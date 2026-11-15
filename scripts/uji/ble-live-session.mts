// A live connection to a heart-rate wearable as plain data (src/domains/devices/engine/liveSession.ts):
//   - valid packets become samples in time order; refused or out-of-order packets are recorded as interruptions;
//   - memory is bounded (10 min); "live" means newer than 5 s and on the skin; the chart covers the last minute;
//   - an HRV recording is judged only on what arrived after it started, and any interruption inside it refuses it;
//   - saving writes heart rate and RMSSD under its own key — never into the SDNN field `hrvMs`.
// All values are synthetic.
import assert from 'node:assert/strict'
import {
  EMPTY_SESSION, addPacket, summarize, hrvProgress, vitalsPatchFrom, SESSION_KEEP_MS, LIVE_WITHIN_MS,
  RR_ABSENT_AFTER_PACKETS, type HeartRateParse, type LiveSession, type SensorContact,
} from '../../src/domains/devices/index.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const packet = (bpm: number, rrMs: number[] = [], contact: SensorContact = 'detected'): HeartRateParse =>
  ({ ok: true, reading: { bpm, contact, energyExpendedKj: null, rrMs } })
const REFUSED: HeartRateParse = { ok: false, reason: 'truncated' }
const feed = (entries: [HeartRateParse, number][], from: LiveSession = EMPTY_SESSION) =>
  entries.reduce((s, [p, t]) => addPacket(s, p, t), from)
/** One packet a second from `start`, each carrying one interval alternating 990/1010 ms. */
const steady = (seconds: number, start = 0, from: LiveSession = EMPTY_SESSION) =>
  feed(Array.from({ length: seconds }, (_, i) => [packet(60, [i % 2 === 0 ? 990 : 1010]), start + (i + 1) * 1000] as [HeartRateParse, number]), from)

gagal('paket_sah_menjadi_sampel_berurutan', () => {
  const s = feed([[packet(60), 1000], [packet(62), 2000], [packet(61, [980]), 3000]])
  assert.deepEqual(s.samples.map((x) => [x.atMs, x.bpm]), [[1000, 60], [2000, 62], [3000, 61]])
  assert.deepEqual(s.samples[2]!.rrMs, [980])
  assert.deepEqual(s.refusedAtMs, [])
})

gagal('paket_ditolak_dicatat_sebagai_jeda', () => {
  const s = feed([[packet(60), 1000], [REFUSED, 2000]])
  assert.equal(s.samples.length, 1)
  assert.deepEqual(s.refusedAtMs, [2000])
})

gagal('paket_mundur_waktu_dicatat_sebagai_jeda_pada_waktu_terakhir', () => {
  const s = feed([[packet(60), 5000], [packet(61), 4000]])
  assert.deepEqual(s.samples.map((x) => x.atMs), [5000])
  assert.deepEqual(s.refusedAtMs, [5000])
  // Twin: the same packet one millisecond later is a sample.
  assert.equal(feed([[packet(60), 5000], [packet(61), 5001]]).samples.length, 2)
})

gagal('waktu_tidak_sah_diabaikan_tanpa_efek', () => {
  const s = feed([[packet(60), 1000]])
  assert.equal(addPacket(s, packet(61), Number.NaN), s)
  assert.equal(addPacket(s, REFUSED, Number.POSITIVE_INFINITY), s)
})

gagal('memori_dibatasi_sepuluh_menit', () => {
  assert.equal(SESSION_KEEP_MS, 600_000)
  const kept = feed([[packet(60), 0], [packet(61), 600_000]])
  assert.deepEqual(kept.samples.map((x) => x.atMs), [0, 600_000], 'exactly 10 minutes old is kept')
  const dropped = feed([[packet(60), 0], [packet(61), 600_001]])
  assert.deepEqual(dropped.samples.map((x) => x.atMs), [600_001])
  const refusalDropped = feed([[REFUSED, 0], [packet(61), 600_001]])
  assert.deepEqual(refusalDropped.refusedAtMs, [])
})

gagal('live_hanya_lima_detik_dan_di_kulit', () => {
  assert.equal(LIVE_WITHIN_MS, 5000)
  const s = feed([[packet(64), 10_000]])
  assert.equal(summarize(s, 15_000).live, true)
  assert.equal(summarize(s, 15_001).live, false)
  assert.equal(summarize(s, 9_999).live, false, 'a reading from the future is not live')
  assert.equal(summarize(feed([[packet(64, [], 'not-detected'), 10_000]]), 10_000).live, false)
  assert.equal(summarize(feed([[packet(64, [], 'not-supported'), 10_000]]), 10_000).live, true)
  assert.equal(summarize(EMPTY_SESSION, 0).live, false)
  assert.equal(summarize(EMPTY_SESSION, 0).latest, null)
})

gagal('grafik_satu_menit_dengan_min_maks', () => {
  const s = feed([[packet(50), 0], [packet(70), 1000], [packet(66), 61_000]])
  const r = summarize(s, 61_000)
  assert.deepEqual(r.chart, [{ atMs: 1000, bpm: 70 }, { atMs: 61_000, bpm: 66 }], 'exactly one minute old is in, older is out')
  assert.equal(r.minBpm, 66)
  assert.equal(r.maxBpm, 70)
  const empty = summarize(EMPTY_SESSION, 0)
  assert.deepEqual([empty.chart, empty.minBpm, empty.maxBpm], [[], null, null])
})

gagal('perangkat_tanpa_rr_dikenali_setelah_sepuluh_paket', () => {
  assert.equal(RR_ABSENT_AFTER_PACKETS, 10)
  const nine = feed(Array.from({ length: 9 }, (_, i) => [packet(60), i * 1000] as [HeartRateParse, number]))
  assert.equal(summarize(nine, 9000).sendsBeatIntervals, null)
  const ten = addPacket(nine, packet(60), 9000)
  assert.equal(summarize(ten, 9000).sendsBeatIntervals, false)
  assert.equal(summarize(addPacket(nine, packet(60, [1000]), 9000), 9000).sendsBeatIntervals, true)
})

gagal('hrv_lima_menit_tanpa_jeda', () => {
  const p = hrvProgress(steady(300), 0)
  assert.deepEqual(p.result, { ok: true, rmssdMs: 20, intervals: 300, coveredMs: 300_000, edited: false })
  assert.equal(p.fraction, 1)
  assert.equal(p.intervals.length, 300)
})

gagal('hrv_parsial_belum_cukup', () => {
  const p = hrvProgress(steady(150), 0)
  assert.equal(p.fraction, 0.5)
  assert.deepEqual(p.result, { ok: false, reason: 'too-short', coveredMs: 150_000 })
})

gagal('hrv_hanya_menghitung_sejak_mulai', () => {
  // 60 s before the recording starts, then 300 s of recording.
  const before = steady(60, -60_000)
  const s = steady(300, 0, before)
  const p = hrvProgress(s, 1)
  assert.equal(p.result.ok, true)
  assert.equal(p.intervals.length, 300)
})

gagal('hrv_terputus_saat_kontak_lepas', () => {
  const s = steady(300, 0, feed([[packet(60, [1000], 'not-detected'), 500]]))
  assert.deepEqual(hrvProgress(s, 0).result.ok === false && hrvProgress(s, 0).result, { ok: false, reason: 'interrupted', coveredMs: 301_000 })
  // Twin: lost contact before the recording started does not count.
  const before = steady(300, 0, feed([[packet(60, [1000], 'not-detected'), -500]]))
  assert.equal(hrvProgress(before, 0).result.ok, true)
})

gagal('hrv_terputus_saat_paket_ditolak', () => {
  const s = steady(150, 150_000, addPacket(steady(150), REFUSED, 150_500))
  assert.equal(hrvProgress(s, 0).result.ok, false)
  assert.equal(hrvProgress(s, 0).result.ok === false && hrvProgress(s, 0).result.reason, 'interrupted')
  // Twin: a refusal before the start does not interrupt it.
  const t = steady(300, 0, addPacket(EMPTY_SESSION, REFUSED, -1))
  assert.equal(hrvProgress(t, 0).result.ok, true)
})

gagal('simpan_menulis_detak_dan_rmssd_bukan_sdnn', () => {
  const s = steady(300)
  const latest = summarize(s, 300_000).latest
  const hrv = hrvProgress(s, 0).result
  assert.deepEqual(vitalsPatchFrom(latest, hrv, 'Strap One'), { source: 'Bluetooth · Strap One', heartRate: 60, hrvRmssdMs: 20 })
  const golden = { ok: true as const, rmssdMs: Math.sqrt(200), intervals: 4, coveredMs: 300_000, edited: false as const }
  const patch = vitalsPatchFrom(latest, golden, 'Strap One')!
  assert.equal(patch.hrvRmssdMs, 14.1, 'one decimal')
  assert.equal('hrvMs' in patch, false)
})

gagal('simpan_tanpa_hrv_sah_hanya_detak', () => {
  const latest = summarize(feed([[packet(72), 1000]]), 1000).latest
  assert.deepEqual(vitalsPatchFrom(latest, { ok: false, reason: 'too-short', coveredMs: 1000 }, 'Band'),
    { source: 'Bluetooth · Band', heartRate: 72 })
  assert.deepEqual(vitalsPatchFrom(latest, null, 'Band'), { source: 'Bluetooth · Band', heartRate: 72 })
})

gagal('simpan_tanpa_bacaan_tidak_menulis_apa_pun', () => {
  assert.equal(vitalsPatchFrom(null, null, 'Band'), null)
  assert.equal(vitalsPatchFrom(null, { ok: false, reason: 'no-intervals', coveredMs: 0 }, 'Band'), null)
})

console.log('ble live session: packets become ordered samples, refusals interrupt, memory is bounded, HRV is judged only on its own recording, and saving never writes RMSSD into the SDNN field')
