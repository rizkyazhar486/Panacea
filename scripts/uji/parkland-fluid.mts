import assert from 'node:assert/strict'
import { parklandFluid } from '../../src/domains/clinical-calculators/engine/parkland.ts'

// Nilai rujukan dihitung tangan dari 4 mL × kg × %TBSA (Baxter 1968): 70 kg, 20% -> 5600 mL; 2800 mL/8 h = 350; 2800/16 = 175.
const ok = parklandFluid(70, 20)
assert.deepEqual(ok, { ok: true, data: { total24hMl: 5600, first8hMlPerH: 350, next16hMlPerH: 175 } })
const anak = parklandFluid(20, 30)
assert.deepEqual(anak, { ok: true, data: { total24hMl: 2400, first8hMlPerH: 150, next16hMlPerH: 75 } })

// Batas: tepat di batas diterima, satu langkah di luar ditolak (berpasangan: hanya satu argumen berubah).
assert.equal(parklandFluid(0.5, 100).ok, true)
assert.equal(parklandFluid(300, 0).ok, true)
assert.equal(parklandFluid(0.49, 20).ok, false)
assert.equal(parklandFluid(300.1, 20).ok, false)
assert.equal(parklandFluid(70, -0.1).ok, false)
assert.equal(parklandFluid(70, 100.1).ok, false)

// Negatif: kosong (0 dari +'' ), NaN, Infinity, negatif -> ditolak dengan alasan, tanpa angka.
for (const berat of [0, -70, NaN, Infinity, -Infinity]) {
  const r = parklandFluid(berat, 20)
  assert.deepEqual(r, { ok: false, alasan: 'Body weight must be 0.5–300 kg' }, `berat ${berat}`)
}
for (const tbsa of [NaN, Infinity, -5, 101]) {
  const r = parklandFluid(70, tbsa)
  assert.deepEqual(r, { ok: false, alasan: '%TBSA must be 0–100' }, `tbsa ${tbsa}`)
}
assert.equal(parklandFluid('70' as unknown as number, 20).ok, false) // salah tipe

// Deterministik + separuh/separuh: laju 8 jam × 8 + laju 16 jam × 16 = total.
const a = parklandFluid(83.5, 37.5)
assert.deepEqual(a, parklandFluid(83.5, 37.5))
if (a.ok) assert.ok(Math.abs(a.data.first8hMlPerH * 8 + a.data.next16hMlPerH * 16 - a.data.total24hMl) < 1e-9)
console.log('parkland-fluid: ok')
