// Laju cahaya simulasi mengikuti apa yang benar-benar dihasilkan perangkat: tepat waktu → kembali cepat, terlambat →
// melambat, masih terlambat di laju paling lambat → berhenti (gagal tertutup), masukan tak sah → berhenti.
import assert from 'node:assert/strict'
import { MOTION_PACE, isLate, nextMotionPace } from '../../src/domains/body-exposure/engine/body-motion/motionPacing.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const { minMs, maxMs, slackMs } = MOTION_PACE

// ── Positif ──────────────────────────────────────────────────────────────────────────────────────────────────
gagal('tepat-waktu-tetap-di-laju-tercepat', () => {
  assert.deepEqual(nextMotionPace(minMs, 0, 1), { intervalMs: minMs, stalled: false })
})
gagal('tepat-waktu-mempercepat-kembali', () => {
  assert.deepEqual(nextMotionPace(400, 10, 1), { intervalMs: 320, stalled: false })
})
gagal('terlambat-menggandakan-jeda', () => {
  assert.deepEqual(nextMotionPace(minMs, 60, 1), { intervalMs: 100, stalled: false })
})
gagal('terlambat-jauh-melompat-ke-keterlambatan', () => {
  // Perangkat lunak: bingkai datang 900 ms terlambat → jeda langsung 900 ms, bukan 100.
  assert.deepEqual(nextMotionPace(minMs, 900, 2), { intervalMs: 900, stalled: false })
})
gagal('lama-render-cpu-menjadi-batas-bawah', () => {
  assert.deepEqual(nextMotionPace(minMs, 0, 30), { intervalMs: 120, stalled: false })
})

// ── Batas ────────────────────────────────────────────────────────────────────────────────────────────────────
gagal('tepat-di-ambang-belum-terlambat', () => {
  const ambang = minMs * 0.5 + slackMs
  assert.equal(isLate(minMs, ambang), false)
  assert.equal(nextMotionPace(minMs, ambang, 0).intervalMs, minMs)
})
gagal('satu-ms-lewat-ambang-terlambat', () => {
  const ambang = minMs * 0.5 + slackMs
  assert.equal(isLate(minMs, ambang + 1), true)
  assert.equal(nextMotionPace(minMs, ambang + 1, 0).intervalMs, 2 * minMs)
})
gagal('jeda-dijepit-di-laju-paling-lambat', () => {
  assert.deepEqual(nextMotionPace(1500, 5000, 0), { intervalMs: maxMs, stalled: false })
})
gagal('terlambat-di-laju-paling-lambat-berhenti', () => {
  assert.deepEqual(nextMotionPace(maxMs, maxMs * 0.5 + slackMs + 1, 0), { intervalMs: maxMs, stalled: true })
})
gagal('tepat-waktu-di-laju-paling-lambat-tidak-berhenti', () => {
  assert.deepEqual(nextMotionPace(maxMs, maxMs * 0.5 + slackMs, 0), { intervalMs: maxMs * MOTION_PACE.speedUp, stalled: false })
})
gagal('render-cpu-terlalu-berat-berhenti', () => {
  assert.equal(nextMotionPace(minMs, 0, maxMs / MOTION_PACE.duty + 1).stalled, true)
  assert.equal(nextMotionPace(minMs, 0, maxMs / MOTION_PACE.duty).stalled, false)
})
gagal('keterlambatan-negatif-dianggap-nol', () => {
  assert.deepEqual(nextMotionPace(400, -30, 1), nextMotionPace(400, 0, 1))
})

// ── Negatif: gagal tertutup ──────────────────────────────────────────────────────────────────────────────────
gagal('masukan-tak-sah-berhenti', () => {
  for (const [i, l, r] of [[NaN, 0, 0], [Infinity, 0, 0], [0, 0, 0], [-50, 0, 0], [minMs, NaN, 0], [minMs, Infinity, 0], [minMs, 0, NaN], [minMs, 0, -1]] as const) {
    assert.deepEqual(nextMotionPace(i, l, r), { intervalMs: maxMs, stalled: true }, `(${i}, ${l}, ${r}) harus berhenti`)
  }
})

// ── Konvergensi: perangkat lambat tetap berhenti, perangkat cepat tetap 20 fps ───────────────────────────────
gagal('perangkat-lunak-berhenti-dalam-beberapa-bingkai', () => {
  let p = { intervalMs: minMs as number, stalled: false }; let n = 0
  while (!p.stalled && n < 20) { p = nextMotionPace(p.intervalMs, 6000, 3); n++ }
  assert.equal(p.stalled, true); assert.ok(n <= 3, `berhenti setelah ${n} bingkai`)
})
gagal('gpu-cepat-tidak-pernah-melambat', () => {
  let p = { intervalMs: minMs as number, stalled: false }
  for (let i = 0; i < 200; i++) p = nextMotionPace(p.intervalMs, 16, 2)
  assert.deepEqual(p, { intervalMs: minMs, stalled: false })
})
gagal('deterministik', () => {
  assert.deepEqual(nextMotionPace(321, 77, 4), nextMotionPace(321, 77, 4))
})

console.log('body-motion-pacing: OK')
