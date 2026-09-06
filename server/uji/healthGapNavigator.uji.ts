import {
  DEFAULT_GAP_SIGNALS,
  buildGapReport,
  careFriction,
  scoreGap,
  type GapSignal,
} from '../../src/lib/healthGapNavigator'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

ok('default gap signals tersedia', DEFAULT_GAP_SIGNALS.length >= 8)
ok('id gap unik', new Set(DEFAULT_GAP_SIGNALS.map((x) => x.id)).size === DEFAULT_GAP_SIGNALS.length)

{
  const clear: GapSignal[] = DEFAULT_GAP_SIGNALS.map((x) => ({ ...x, status: 'clear' }))
  const report = buildGapReport(clear)
  ok('semua clear menghasilkan bridge score 100', report.bridgeScore === 100)
  ok('semua clear menghasilkan nol open gaps', report.openGapCount === 0)
}

{
  const blocked: GapSignal[] = DEFAULT_GAP_SIGNALS.map((x) => ({ ...x, status: 'blocked' }))
  const report = buildGapReport(blocked)
  ok('semua blocked menghasilkan bridge score 0', report.bridgeScore === 0)
  ok('blocked count sama dengan jumlah signal', report.blockedCount === blocked.length)
  ok('question budget maksimum tiga item', report.topQuestions.length === 3)
}

{
  const high = scoreGap({
    id: 'high', domain: 'safety', label: 'Safety', prompt: 'x', status: 'missing', impact: 3, actionability: 3,
  })
  const low = scoreGap({
    id: 'low', domain: 'evidence', label: 'Evidence', prompt: 'x', status: 'partial', impact: 1, actionability: 1,
  })
  ok('gap safety high-impact diprioritaskan di atas partial low-impact', high.priority > low.priority)
}

{
  const lowFriction = careFriction({
    waitingHours: 0,
    travelMinutes: 0,
    outOfPocketCost: 0,
    monthlyDisposableBudget: 1_000_000,
    numberOfSteps: 1,
    missedWorkHours: 0,
    digitalBarrier: 0,
  })
  ok('friction minimal = 0', lowFriction.score === 0)
  ok('friction minimal berlevel low', lowFriction.level === 'low')
}

{
  const highFriction = careFriction({
    waitingHours: 336,
    travelMinutes: 360,
    outOfPocketCost: 5_000_000,
    monthlyDisposableBudget: 1_000_000,
    numberOfSteps: 10,
    missedWorkHours: 24,
    digitalBarrier: 5,
  })
  ok('friction ekstrem dibatasi 0-100', highFriction.score >= 0 && highFriction.score <= 100)
  ok('friction ekstrem berlevel very-high', highFriction.level === 'very-high')
}

console.log(`\nHealth Gap Navigator: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
