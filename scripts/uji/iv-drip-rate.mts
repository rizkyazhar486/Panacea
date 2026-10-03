import assert from 'node:assert/strict'
import { ivDrip } from '../../src/domains/clinical-calculators/index.ts'

// Positif: nilai tangan. 500 mL / 8 j = 62,5 mL/j; ×20 / 480 menit = 20,8333 tetes/menit.
const ok = ivDrip(500, 8, 20)
assert.ok(ok.ok)
if (ok.ok) { assert.equal(ok.data.mlPerHour, 62.5); assert.ok(Math.abs(ok.data.dropsPerMin - 20.8333333) < 1e-6) }
assert.deepEqual(ivDrip(500, 8, 20), ok, 'deterministik')
// Pasangan: hanya faktor tetes berubah → mL/j sama, tetes/menit ×3 pada set mikro 60 vs makro 20.
const mikro = ivDrip(500, 8, 60)
assert.ok(mikro.ok && ok.ok && mikro.data.mlPerHour === ok.data.mlPerHour && Math.abs(mikro.data.dropsPerMin - 3 * ok.data.dropsPerMin) < 1e-9)
// Pada set mikro, tetes/menit = mL/jam (identitas 60 tetes/mL).
assert.ok(mikro.ok && Math.abs(mikro.data.dropsPerMin - mikro.data.mlPerHour) < 1e-9)

// Batas volume.
for (const v of [1, 10000]) assert.equal(ivDrip(v, 8, 20).ok, true, `volume ${v}`)
const GALAT_VOL = { ok: false, reason: 'Volume must be 1–10000 mL' }
for (const v of [0.99, 10000.01, 0, -500, NaN, Infinity, -Infinity, +'']) assert.deepEqual(ivDrip(v, 8, 20), GALAT_VOL, `volume ${v}`)
// Batas durasi (1 menit – 168 jam).
for (const h of [1 / 60, 168]) assert.equal(ivDrip(500, h, 20).ok, true, `jam ${h}`)
const GALAT_DUR = { ok: false, reason: 'Duration must be 1 minute to 168 hours' }
for (const h of [0.016, 168.01, 0, -8, NaN, Infinity, +'']) assert.deepEqual(ivDrip(500, h, 20), GALAT_DUR, `jam ${h}`)
// Faktor tetes: hanya set yang ditawarkan.
const GALAT_FAKTOR = { ok: false, reason: 'Drop factor must be one of 15, 20, 60 drops/mL' }
for (const f of [0, 10, 16, -20, NaN, Infinity, +'']) assert.deepEqual(ivDrip(500, 8, f), GALAT_FAKTOR, `faktor ${f}`)
for (const f of [15, 20, 60]) assert.equal(ivDrip(500, 8, f).ok, true, `faktor ${f}`)
// Tipe salah → ditolak, tanpa angka.
for (const salah of [undefined, null, '500', {}] as unknown as number[]) {
  assert.equal(ivDrip(salah, 8, 20).ok, false); assert.equal(ivDrip(500, salah, 20).ok, false); assert.equal(ivDrip(500, 8, salah).ok, false)
}
assert.equal('data' in (ivDrip(0, 8, 20) as object), false)
console.log('iv-drip-rate: OK')
