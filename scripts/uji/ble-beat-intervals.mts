// RMSSD from beat-to-beat intervals (src/domains/devices/engine/beatIntervals.ts). Source: Shaffer & Ginsberg 2017,
// Front Public Health 5:258 (PMID 29034226), read in full text — the formula, and 5 min as the conventional minimum
// recording. Golden values are computed by hand in the comments; every refusal is paired with an accepted twin.
import assert from 'node:assert/strict'
import { rmssd, rmssdOfRecording, RMSSD_MIN_RECORDING_MS } from '../../src/domains/devices/index.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
/** n intervals alternating a, b (a first). */
const alternating = (n: number, a: number, b: number) => Array.from({ length: n }, (_, i) => (i % 2 === 0 ? a : b))

gagal('rmssd_nilai_emas', () => {
  // differences 10, -20, 10 -> squares 100, 400, 100 -> mean 200 -> sqrt(200)
  assert.equal(rmssd([1000, 1010, 990, 1000]), Math.sqrt(200))
  // differences all ±20 -> RMSSD 20 exactly
  assert.equal(rmssd(alternating(10, 990, 1010)), 20)
})

gagal('deret_tetap_bernilai_nol_bukan_kosong', () => {
  assert.equal(rmssd([800, 800, 800]), 0)
})

gagal('menolak_kurang_dari_dua_interval', () => {
  assert.equal(rmssd([]), null)
  assert.equal(rmssd([1000]), null)
  assert.equal(rmssd([1000, 1010]), 10)
})

gagal('menolak_interval_tidak_sah', () => {
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, 0, -5]) {
    assert.equal(rmssd([1000, bad, 1000]), null, String(bad))
  }
  assert.equal(rmssd([1000, 1, 1000]), Math.sqrt((999 * 999 * 2) / 2), 'the smallest positive interval is still an interval')
})

gagal('minimum_rekaman_lima_menit_dari_sumber', () => {
  assert.equal(RMSSD_MIN_RECORDING_MS, 300_000)
})

gagal('rekaman_tepat_lima_menit_diterima', () => {
  // 300 intervals: 150 x 990 + 150 x 1010 = 300 000 ms
  const r = rmssdOfRecording(alternating(300, 990, 1010), false)
  assert.deepEqual(r, { ok: true, rmssdMs: 20, intervals: 300, coveredMs: 300_000, edited: false })
})

gagal('rekaman_kurang_satu_milidetik_ditolak', () => {
  const rr = alternating(300, 990, 1010)
  rr[299] = 1009
  assert.deepEqual(rmssdOfRecording(rr, false), { ok: false, reason: 'too-short', coveredMs: 299_999 })
})

gagal('rekaman_terputus_ditolak_walau_cukup_panjang', () => {
  const rr = alternating(300, 990, 1010)
  assert.deepEqual(rmssdOfRecording(rr, true), { ok: false, reason: 'interrupted', coveredMs: 300_000 })
  assert.equal(rmssdOfRecording(rr, false).ok, true)
})

gagal('rekaman_tanpa_interval_ditolak', () => {
  assert.deepEqual(rmssdOfRecording([], false), { ok: false, reason: 'no-intervals', coveredMs: 0 })
  assert.deepEqual(rmssdOfRecording([400_000], false), { ok: false, reason: 'no-intervals', coveredMs: 400_000 })
})

gagal('rekaman_dengan_interval_tidak_sah_ditolak', () => {
  const rr = alternating(310, 990, 1010)
  rr[5] = Number.NaN
  const r = rmssdOfRecording(rr, false)
  assert.equal(r.ok, false)
  assert.equal(r.ok === false && r.reason, 'interrupted')
})

console.log('ble beat intervals: RMSSD as published, only from an uninterrupted recording of at least 5 minutes, marked unedited; nothing is filled in')
