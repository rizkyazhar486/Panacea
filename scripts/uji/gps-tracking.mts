const {
  advanceGpsTrack,
  haversineM,
  newGpsTrack,
  privacyTrimRoute,
  updateMotionGate,
} = await import('../../src/lib/gpsTracking.ts')

const failures: string[] = []
function check(name: string, condition: boolean, detail = '') {
  console.log(condition ? 'PASS' : 'FAIL', name, detail)
  if (!condition) failures.push(name)
}

const nearKm = haversineM({ lat: 0, lng: 0 }, { lat: 0, lng: 0.008983 })
check('haversine is approximately one kilometre', nearKm > 990 && nearKm < 1010, String(nearKm))

{
  let s = newGpsTrack(0)
  s = advanceGpsTrack(s, { lat: 0, lng: 0, accuracyM: 8, timestampMs: 0 }, 'run')
  s = advanceGpsTrack(s, { lat: 0, lng: 0.0001, accuracyM: 80, timestampMs: 5000 }, 'run')
  check('poor-accuracy fix is rejected', s.points.length === 1 && s.rejectedAccuracy === 1)
  check('poor-accuracy fix adds no distance', s.totalM === 0)
}

{
  let s = newGpsTrack(0)
  s = advanceGpsTrack(s, { lat: 0, lng: 0, accuracyM: 5, timestampMs: 0 }, 'run')
  s = advanceGpsTrack(s, { lat: 0, lng: 0.01, accuracyM: 5, timestampMs: 5000 }, 'run')
  check('impossible running jump is rejected', s.points.length === 1 && s.rejectedJump === 1)
}

{
  let gate = { moving: false }
  gate = updateMotionGate(gate, 1.5, 0)
  gate = updateMotionGate(gate, 1.5, 4000)
  check('movement resumes only after dwell', gate.moving === true)
  gate = updateMotionGate(gate, 0.1, 5000)
  gate = updateMotionGate(gate, 0.1, 9000)
  check('short stop does not immediately auto-pause', gate.moving === true)
  gate = updateMotionGate(gate, 0.1, 13000)
  check('sustained stop auto-pauses', gate.moving === false)
}

{
  let s = newGpsTrack(0)
  s = advanceGpsTrack(s, { lat: 0, lng: 0, accuracyM: 5, timestampMs: 0 }, 'cycle')
  s = advanceGpsTrack(s, { lat: 0, lng: 0.0001, accuracyM: 5, timestampMs: 180000 }, 'cycle')
  check('long GPS gap starts a new route segment', s.segment === 1 && s.points.at(-1)?.segment === 1)
  check('long GPS gap does not invent distance', s.totalM === 0)
}

{
  let s = newGpsTrack(0)
  // Pre-arm moving state so this test isolates kilometre-boundary arithmetic.
  s = { ...s, motion: { moving: true } }
  const stepLng = 0.002245
  s = advanceGpsTrack(s, { lat: 0, lng: 0, accuracyM: 4, timestampMs: 0 }, 'run')
  s = { ...s, motion: { moving: true } }
  for (let i = 1; i <= 5; i++) {
    s = advanceGpsTrack(s, { lat: 0, lng: stepLng * i, accuracyM: 4, timestampMs: i * 60000 }, 'run')
  }
  check('crossing one kilometre creates a split', s.splits.some((x) => x.km === 1), JSON.stringify(s.splits))
  check('moving time never exceeds elapsed time', s.movingMs <= s.elapsedMs)
}

{
  const points = Array.from({ length: 12 }, (_, i) => ({ lat: 0, lng: i * 0.001 }))
  const trimmed = privacyTrimRoute(points, 200)
  check('privacy trim removes both route ends', trimmed.length > 0 && trimmed.length < points.length - 2, String(trimmed.length))
  const short = privacyTrimRoute(points.slice(0, 3), 200)
  check('too-short route stays hidden', short.length === 0)
}

{
  const segmented = [
    { lat: 0, lng: 0, segment: 0 },
    { lat: 0, lng: 0.0005, segment: 0 },
    { lat: 1, lng: 1, segment: 1 },
    { lat: 1, lng: 1.0005, segment: 1 },
  ]
  const trimmed = privacyTrimRoute(segmented, 200)
  check('privacy buffer never counts a straight line across a GPS signal gap', trimmed.length === 0)
}

if (failures.length) {
  console.error(`\n${failures.length} GPS tests failed: ${failures.join(', ')}`)
  process.exit(1)
}
