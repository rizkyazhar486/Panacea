import assert from 'node:assert/strict'
import { framinghamCVD, cvdBand } from '../../src/lib/riskModels.ts'

// Framingham General CVD (D'Agostino 2008): kasus di bawah memeriksa sifat model
// (monotonik, fail-closed) dan nilai regresi deterministik dari koefisien terbit.
const base = { age: 55, sex: 'M' as const, totChol: 213, hdl: 50, sbp: 120, treatedBP: false, smoker: false, diabetic: false }

// ── Positif: hasil deterministik, dalam rentang 0-100, satu desimal.
{
  const a = framinghamCVD(base)!, b = framinghamCVD(base)!
  assert.equal(a, b, 'hasil tidak deterministik')
  assert.ok(a > 0 && a < 100, `risiko ${a} di luar (0,100)`)
  assert.equal(a, +a.toFixed(1), 'tidak dibulatkan satu desimal')
}

// ── Berpasangan: tiap faktor risiko HANYA berbeda satu kondisi -> risiko naik.
{
  const r0 = framinghamCVD(base)!
  assert.ok(framinghamCVD({ ...base, smoker: true })! > r0, 'perokok tidak menaikkan risiko')
  assert.ok(framinghamCVD({ ...base, diabetic: true })! > r0, 'diabetes tidak menaikkan risiko')
  assert.ok(framinghamCVD({ ...base, sbp: 160 })! > r0, 'TD sistolik tinggi tidak menaikkan risiko')
  assert.ok(framinghamCVD({ ...base, hdl: 35 })! > r0, 'HDL rendah tidak menaikkan risiko')
  assert.ok(framinghamCVD({ ...base, age: 65 })! > r0, 'usia lebih tua tidak menaikkan risiko')
  assert.ok(framinghamCVD({ ...base, sex: 'F' })! < r0, 'perempuan sebaya seharusnya risiko lebih rendah')
}

// ── Negatif: input tidak valid -> null (fail-closed), bukan angka tebakan.
for (const [nama, p] of [
  ['usia 0', { ...base, age: 0 }], ['usia negatif', { ...base, age: -1 }],
  ['kolesterol 0', { ...base, totChol: 0 }], ['HDL 0', { ...base, hdl: 0 }],
  ['TD 0', { ...base, sbp: 0 }], ['NaN', { ...base, sbp: NaN }],
  ['Infinity', { ...base, age: Infinity }], ['-Infinity', { ...base, hdl: -Infinity }],
] as const) {
  assert.equal(framinghamCVD(p), null, `${nama} harus ditolak (null), bukan dihitung`)
}

// ── Batas pita risiko: 7,5 dan 20 (tepat di batas masuk pita atas).
assert.equal(cvdBand(7.4).label, 'Low risk')
assert.equal(cvdBand(7.5).label, 'Intermediate risk')
assert.equal(cvdBand(19.9).label, 'Intermediate risk')
assert.equal(cvdBand(20).label, 'High risk')
console.log('risk-models-framingham: OK')
