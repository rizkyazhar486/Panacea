import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { waistHeightRatio, waistHeightRatioFromText, whtrBand } from '../../src/domains/clinical-calculators/index.ts'

// positif: 80/160 = 0,5 persis → batas bawah "increased"
assert.deepEqual(waistHeightRatio(80, 160), { ok: true, ratio: 0.5, band: 'increased' })
assert.deepEqual(waistHeightRatio(70, 175), { ok: true, ratio: 0.4, band: 'lower' })
assert.deepEqual(waistHeightRatio(96, 160), { ok: true, ratio: 0.6, band: 'high' })
// batas ambang berpasangan (±1 langkah)
assert.equal(whtrBand(0.4999), 'lower')
assert.equal(whtrBand(0.5), 'increased')
assert.equal(whtrBand(0.5999), 'increased')
assert.equal(whtrBand(0.6), 'high')
// batas rentang masukan
for (const [w, h] of [[40, 100], [200, 230], [40, 230], [200, 100]] as const) assert.equal(waistHeightRatio(w, h).ok, true, `${w},${h}`)
const W = 'Waist must be 40–200 cm', H = 'Height must be 100–230 cm'
for (const w of [39.99, 200.01, 0, -80, NaN, Infinity, -Infinity]) assert.deepEqual(waistHeightRatio(w, 170), { ok: false, reasons: [W] }, `pinggang ${w}`)
for (const h of [99.99, 230.01, 0, -170, NaN, Infinity, -Infinity]) assert.deepEqual(waistHeightRatio(80, h), { ok: false, reasons: [H] }, `tinggi ${h}`)
assert.deepEqual(waistHeightRatio(NaN, NaN), { ok: false, reasons: [W, H] })
// regresi: kolom kosong dulu = 0 → "Infinity"/High risk atau 0,00/Lower risk; kini ditolak tanpa angka
assert.equal(80 / 0, Infinity)
assert.deepEqual(waistHeightRatioFromText('80', ''), { ok: false, reasons: [H] })
assert.deepEqual(waistHeightRatioFromText('', '170'), { ok: false, reasons: [W] })
assert.deepEqual(waistHeightRatioFromText('  ', 'abc'), { ok: false, reasons: [W, H] })
assert.deepEqual(waistHeightRatioFromText('85', '170'), { ok: true, ratio: 0.5, band: 'increased' })
// determinisme
assert.deepEqual(waistHeightRatio(81, 163), waistHeightRatio(81, 163))
// wiring halaman: tidak boleh kembali ke `|| 0`
const src = readFileSync('src/pages/SelfAssessmentToolkit.tsx', 'utf8')
assert.ok(src.includes('waistHeightRatioFromText'), 'halaman harus memakai fungsi domain')
assert.equal(/Number\([^()]*\)\s*\|\|\s*0/.test(src), false, 'halaman tidak boleh membaca kolom kosong sebagai 0')
console.log('waist-height-ratio: ok')
