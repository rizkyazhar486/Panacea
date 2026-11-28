// diagnosaSinkron: positive, negative, boundary and regression cases. The clock and UTC offset are injected,
// so every case is deterministic. Each rejection case is paired with an accepted case that differs only in
// the condition under test.
import assert from 'node:assert/strict'
import { diagnosaSinkron, tanggalLokal, SYNC_STALE_MS, type WebhookDelivery } from '../src/domains/push/syncDiagnosis.js'

const WIB = 7 * 60
const JAM = 3_600_000

function kiriman(at: string, ubah: Partial<WebhookDelivery> = {}): WebhookDelivery {
  return {
    at,
    metricGroups: [{ name: 'heart_rate', samples: 40 }],
    workouts: 1,
    hrSamples: 40,
    sleepNights: 0,
    matched: ['restingHr'],
    newestSampleDate: null,
    ...ubah,
  }
}
const judul = (r: ReturnType<typeof diagnosaSinkron>) => r.findings.map((f) => f.judul)

// ── tanggalLokal ────────────────────────────────────────────────────────────
assert.equal(tanggalLokal('2026-11-27T17:30:00.000Z', WIB), '2026-11-28', 'WIB crosses midnight 7 h before UTC')
assert.equal(tanggalLokal('2026-11-27T16:59:59.000Z', WIB), '2026-11-27', 'one second before local midnight')
assert.equal(tanggalLokal('2026-11-27T02:00:00.000Z', -5 * 60), '2026-11-26', 'west of UTC goes back a day')
assert.equal(tanggalLokal('bukan-tanggal', WIB), null, 'unparseable arrival fails closed')
assert.equal(tanggalLokal('2026-11-27T02:00:00.000Z', Number.NaN), null, 'NaN offset fails closed')

// ── empty log ───────────────────────────────────────────────────────────────
{
  const r = diagnosaSinkron([], Date.parse('2026-11-27T08:00:00Z'), WIB)
  assert.deepEqual(judul(r), ['No delivery has ever arrived'])
  assert.equal(r.deliveries, 0)
  assert.equal(r.lastAt, null)
}

// ── healthy (positive) ─────────────────────────────────────────────────────
const sekarang = Date.parse('2026-11-27T08:00:00Z') // 15:00 WIB
const sehat = [
  kiriman('2026-11-27T01:00:00Z', { newestSampleDate: '2026-11-27' }),
  kiriman('2026-11-27T04:00:00Z', { newestSampleDate: '2026-11-27' }),
  kiriman('2026-11-27T07:00:00Z', { newestSampleDate: '2026-11-27' }),
]
{
  const r = diagnosaSinkron(sehat, sekarang, WIB)
  assert.deepEqual(judul(r), ['Sync looks healthy'])
  assert.equal(r.findings[0].level, 'ok')
  assert.equal(r.lastAt, '2026-11-27T07:00:00Z')
  assert.equal(r.deliveries, 3)
}

// ── stale: boundary at exactly 24 h (still running) vs 24 h + 1 ms (stopped) ──
{
  const terakhir = Date.parse(sehat[2].at)
  const tepat = diagnosaSinkron(sehat, terakhir + SYNC_STALE_MS, WIB)
  assert.ok(!judul(tepat).includes('Sync has stopped'), 'exactly 24 h is not stale')
  const lewat = diagnosaSinkron(sehat, terakhir + SYNC_STALE_MS + 1, WIB)
  assert.equal(lewat.findings[0].judul, 'Sync has stopped', 'stopped is reported first')
  assert.equal(lewat.findings[0].level, 'error')
  assert.ok(!judul(lewat).includes('Sync looks healthy'), 'a stopped sync is never called healthy')
  assert.match(lewat.findings[0].detail, /24 hours ago/)
  const tigaHari = diagnosaSinkron(sehat, terakhir + 3 * 24 * JAM, WIB)
  assert.match(tigaHari.findings[0].detail, /3 days ago/)
}

// ── regression: WIB early morning must not trip "today missing" ──────────────
// 06:00 WIB on 28 Nov = 23:00 UTC on 27 Nov. Samples dated 28 Nov (phone-local) are current.
{
  const pagi = [
    kiriman('2026-11-27T21:00:00Z', { newestSampleDate: '2026-11-28' }),
    kiriman('2026-11-27T22:00:00Z', { newestSampleDate: '2026-11-28' }),
    kiriman('2026-11-27T23:00:00Z', { newestSampleDate: '2026-11-28' }),
  ]
  const r = diagnosaSinkron(pagi, Date.parse('2026-11-27T23:30:00Z'), WIB)
  assert.deepEqual(judul(r), ['Sync looks healthy'], 'local 28 Nov samples arriving 28 Nov WIB are current')
}

// ── "today missing": paired positive and negative ───────────────────────────
{
  const kemarin = sehat.map((k) => ({ ...k, newestSampleDate: '2026-11-26' }))
  const r = diagnosaSinkron(kemarin, sekarang, WIB)
  assert.ok(judul(r).includes('Today’s data is never included'))
  assert.match(r.findings.find((f) => f.judul === 'Today’s data is never included')!.detail, /arrived on 2026-11-27 with samples up to 2026-11-26/)
  // Same log, but one delivery includes its own day -> the rule must not fire.
  const satuBenar = [...kemarin.slice(0, 2), { ...kemarin[2], newestSampleDate: '2026-11-27' }]
  assert.ok(!judul(diagnosaSinkron(satuBenar, sekarang, WIB)).includes('Today’s data is never included'))
  // Fewer than three dated deliveries is not enough evidence.
  assert.ok(!judul(diagnosaSinkron(kemarin.slice(0, 2), sekarang, WIB)).includes('Today’s data is never included'))
}

// ── other rules keep their behaviour (paired) ─────────────────────────────────
{
  const tanpaLatihan = sehat.map((k) => ({ ...k, workouts: 0 }))
  assert.ok(judul(diagnosaSinkron(tanpaLatihan, sekarang, WIB)).includes('Workouts are never included'))
  assert.ok(!judul(diagnosaSinkron(sehat, sekarang, WIB)).includes('Workouts are never included'))

  const ditolak = [...sehat.slice(0, 2), { ...sehat[2], rejected: 'too_large' as const }]
  const rd = diagnosaSinkron(ditolak, sekarang, WIB)
  assert.ok(judul(rd).includes('Some deliveries were rejected before they could be read'))
  assert.match(rd.findings.find((f) => f.judul.startsWith('Some deliveries'))!.detail, /^1 of the last 3 deliveries were too large/)

  const tanpaHr = sehat.map((k) => ({ ...k, hrSamples: 0 }))
  assert.ok(judul(diagnosaSinkron(tanpaHr, sekarang, WIB)).includes('No heart-rate sample has been stored'))

  const hampa = sehat.map((k) => ({ ...k, matched: [], hrSamples: 0, workouts: 0, sleepNights: 0 }))
  assert.ok(judul(diagnosaSinkron(hampa, sekarang, WIB)).includes('Deliveries arrive but produce nothing'))
}

// ── purity: same input twice -> identical output; input not mutated ──────────
{
  const salinan = JSON.parse(JSON.stringify(sehat))
  assert.deepEqual(diagnosaSinkron(sehat, sekarang, WIB), diagnosaSinkron(sehat, sekarang, WIB))
  assert.deepEqual(sehat, salinan, 'the delivery log is not mutated')
}

// ── unparseable arrival time does not invent a stale or a date finding ────────
{
  const rusak = sehat.map((k) => ({ ...k, at: 'bukan-tanggal', newestSampleDate: '2026-11-20' }))
  const r = diagnosaSinkron(rusak, sekarang, WIB)
  assert.ok(!judul(r).includes('Sync has stopped'))
  assert.ok(!judul(r).includes('Today’s data is never included'))
}

console.log('syncDiagnosis: stale boundary (24 h), WIB date regression, paired rule cases, purity — OK')
