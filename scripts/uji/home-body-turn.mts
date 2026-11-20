// Memutar tubuh atlas di Home dan memiringkan panggungnya: sudut dibungkus, bingkai sprite benar, titik hanya di
// tampak depan, pegas kembali ke depan, putaran 360 mulus, kemiringan dijepit; masukan tak sah → tanpa putar/miring.
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { HOME_BODY_TURN } from '../../src/domains/body-exposure/data/homeBodyAnchors.ts'
import { dragAngle, isFront, settleStep, spinAngle, tiltFor, turnFrame, wrapDeg } from '../../src/domains/body-exposure/engine/home-hero/homeBodyTurn.ts'

const gagal = (nama: string, f: () => void) => { try { f() } catch (e) { throw new Error(`[${nama}] ${(e as Error).message}`) } }
const N = 24

// ── Positif ──────────────────────────────────────────────────────────────────────────────────────────────────
gagal('sudut-dibungkus-ke-minus180-180', () => {
  assert.equal(wrapDeg(0), 0); assert.equal(wrapDeg(190), -170); assert.equal(wrapDeg(-190), 170); assert.equal(wrapDeg(720 + 45), 45)
})
gagal('bingkai-terdekat', () => {
  assert.equal(turnFrame(0, N), 0); assert.equal(turnFrame(15, N), 1); assert.equal(turnFrame(-15, N), 23); assert.equal(turnFrame(180, N), 12)
})
gagal('seret-selebar-panggung-satu-putaran', () => {
  assert.equal(dragAngle(0, 400, 400), 360); assert.equal(dragAngle(30, -100, 400), -60)
})
gagal('pegas-mengambil-jalan-terpendek', () => {
  assert.ok(settleStep(350, 16) > -10 && settleStep(350, 16) < 0, '350° kembali lewat -10°, bukan berputar 350° balik')
  assert.equal(settleStep(80, 160), 40, 'satu waktu paruh = setengah sudut')
})
gagal('pegas-mendarat-tepat-di-nol', () => {
  let a = 170; let n = 0
  while (a !== 0 && n < 200) { a = settleStep(a, 16); n++ }
  assert.equal(a, 0); assert.ok(n < 100, `mendarat dalam ${n} bingkai`)
})
gagal('putaran-360-mulus-dan-simetris', () => {
  assert.equal(spinAngle(600, 1200), 180)
  assert.ok(Math.abs(spinAngle(300, 1200) + spinAngle(900, 1200) - 360) < 1e-9, 'ease-in-out simetris')
  let prev = 0
  for (let t = 1; t < 1200; t += 7) { const v = spinAngle(t, 1200); assert.ok(v >= prev, 'monoton naik'); prev = v }
})
gagal('miring-ke-arah-penunjuk', () => {
  assert.deepEqual(tiltFor(200, 250, 400, 500), { rx: 0, ry: 0 })
  assert.deepEqual(tiltFor(400, 0, 400, 500), { rx: 6, ry: 6 })
  assert.deepEqual(tiltFor(0, 500, 400, 500, 4), { rx: -4, ry: -4 })
})

// ── Batas ────────────────────────────────────────────────────────────────────────────────────────────────────
gagal('titik-hanya-di-tampak-depan', () => {
  const setengah = 360 / N / 2
  assert.equal(isFront(setengah - 0.01, N), true); assert.equal(isFront(setengah + 0.01, N), false)
  assert.equal(isFront(-(setengah - 0.01), N), true); assert.equal(isFront(-(setengah + 0.01), N), false)
})
gagal('180-dan-minus180-sama', () => { assert.equal(wrapDeg(-180), 180); assert.equal(turnFrame(-180, N), turnFrame(180, N)) })
gagal('di-bawah-setengah-derajat-menjepret-ke-nol', () => { assert.equal(settleStep(0.9, 160), 0); assert.notEqual(settleStep(1.2, 160), 0) })
gagal('putaran-di-ujung-waktu-nol', () => { assert.equal(spinAngle(0, 1200), 0); assert.equal(spinAngle(1200, 1200), 0) })
gagal('miring-dijepit-di-luar-kotak', () => { assert.deepEqual(tiltFor(9000, -9000, 400, 500), { rx: 6, ry: 6 }) })

// ── Negatif: gagal tertutup ──────────────────────────────────────────────────────────────────────────────────
gagal('sudut-tak-sah-ditolak', () => {
  for (const v of [NaN, Infinity, -Infinity]) { assert.equal(wrapDeg(v), null); assert.equal(turnFrame(v, N), null); assert.equal(isFront(v, N), true); assert.equal(settleStep(v, 16), 0) }
})
gagal('jumlah-bingkai-tak-sah-ditolak', () => {
  for (const f of [0, -3, 2.5, NaN]) assert.equal(turnFrame(15, f), null)
})
gagal('seret-tak-sah-ditolak', () => {
  assert.equal(dragAngle(0, 10, 0), null); assert.equal(dragAngle(0, 10, -5), null); assert.equal(dragAngle(0, NaN, 400), null); assert.equal(dragAngle(NaN, 1, 400), null)
})
gagal('waktu-tak-sah-mendarat-di-depan', () => {
  for (const dt of [0, -16, NaN]) assert.equal(settleStep(90, dt), 0)
  assert.equal(settleStep(90, 16, 0), 0); assert.equal(spinAngle(100, 0), 0); assert.equal(spinAngle(NaN, 1200), 0)
})
gagal('miring-tak-sah-ditolak', () => {
  assert.equal(tiltFor(1, 1, 0, 500), null); assert.equal(tiltFor(NaN, 1, 400, 500), null); assert.equal(tiltFor(1, 1, 400, 500, -1), null)
})

// ── Aset: sprite yang dirujuk ada dan ukurannya cocok dengan deklarasinya ────────────────────────────────────
gagal('sprite-putar-ada-dan-sesuai', () => {
  assert.equal(HOME_BODY_TURN.frames, N)
  const buf = readFileSync(new URL(`../../public/${HOME_BODY_TURN.src}`, import.meta.url))
  assert.equal(buf.subarray(0, 4).toString(), 'RIFF'); assert.equal(buf.subarray(8, 12).toString(), 'WEBP')
  // VP8X: kanvas lebar/tinggi 24-bit (minus satu) di offset 24/27.
  if (buf.subarray(12, 16).toString() === 'VP8X') {
    const w = buf.readUIntLE(24, 3) + 1, h = buf.readUIntLE(27, 3) + 1
    assert.deepEqual([w, h], [HOME_BODY_TURN.width * HOME_BODY_TURN.frames, HOME_BODY_TURN.height])
  }
  assert.ok(statSync(new URL(`../../public/${HOME_BODY_TURN.src}`, import.meta.url)).size < 800_000, 'sprite di bawah 800 KB')
})
gagal('deterministik', () => { assert.equal(settleStep(123, 17), settleStep(123, 17)); assert.deepEqual(tiltFor(3, 4, 5, 6), tiltFor(3, 4, 5, 6)) })

console.log('home-body-turn: OK')
