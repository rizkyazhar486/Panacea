import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mcdonaldGestationalAge, midParentalHeight } from '../../src/domains/clinical-calculators/index.ts'

// ── Mid-parental: nilai tangan ──
assert.deepEqual(midParentalHeight(170, 158, 'M'), { ok: true, data: { targetCm: 170.5, rangeLoCm: 162, rangeHiCm: 179 } }) // (170+158+13)/2
assert.deepEqual(midParentalHeight(170, 158, 'F'), { ok: true, data: { targetCm: 157.5, rangeLoCm: 149, rangeHiCm: 166 } }) // (170+158−13)/2
// Pasangan: hanya jenis kelamin anak berbeda → selisih tepat 13 cm.
const m = midParentalHeight(175, 160, 'M'), f = midParentalHeight(175, 160, 'F')
assert.ok(m.ok && f.ok && m.data.targetCm - f.data.targetCm === 13)
// Regresi: identik dengan rumus halaman lama pada seluruh masukan sah.
for (let fa = 100; fa <= 250; fa += 15) for (let mo = 100; mo <= 250; mo += 15) for (const sx of ['M', 'F'] as const) {
  const lama = sx === 'M' ? (fa + mo + 13) / 2 : (fa + mo - 13) / 2
  const r = midParentalHeight(fa, mo, sx); assert.ok(r.ok)
  if (r.ok) { assert.equal(r.data.targetCm, lama); assert.equal(r.data.rangeLoCm, lama - 8.5); assert.equal(r.data.rangeHiCm, lama + 8.5) }
}
// Batas dan penolakan, dengan nama kolom; hanya kolom itu yang rusak.
for (const [a, b] of [[100, 100], [250, 250], [100, 250]] as const) assert.equal(midParentalHeight(a, b, 'M').ok, true, `${a},${b}`)
const GF = { ok: false, reason: "Father's height must be 100–250 cm" }, GM = { ok: false, reason: "Mother's height must be 100–250 cm" }
for (const h of [99.99, 0, -170, 250.01, 1700, NaN, Infinity, +'']) {
  assert.deepEqual(midParentalHeight(h, 158, 'M'), GF, `ayah ${h}`)
  assert.deepEqual(midParentalHeight(170, h, 'M'), GM, `ibu ${h}`)
}
assert.deepEqual(midParentalHeight(170, 158, 'X' as 'M'), { ok: false, reason: 'Child sex must be M or F' })
for (const salah of [undefined, null, '170'] as unknown as number[]) { assert.equal(midParentalHeight(salah, 158, 'M').ok, false); assert.equal(midParentalHeight(170, salah, 'M').ok, false) }
assert.equal('data' in (midParentalHeight(0, 158, 'M') as object), false)
// Jebakan nyata: tinggi ayah kosong → 0 → halaman lama menampilkan 85.5 cm sebagai tinggi target.
assert.equal((+'' + 158 + 13) / 2, 85.5)

// ── McDonald ──
for (const cm of [20, 28, 36, 28.5]) assert.deepEqual(mcdonaldGestationalAge(cm), { ok: true, data: { gestationalWeeks: cm } }, `cm ${cm}`)
const GR = { ok: false, reason: "McDonald's rule applies to a fundal height of 20–36 cm" }
for (const cm of [19.99, 0, -28, 36.01, 80, NaN, Infinity, -Infinity, +'']) assert.deepEqual(mcdonaldGestationalAge(cm), GR, `cm ${cm}`)
for (const salah of [undefined, null, '28', {}] as unknown as number[]) assert.equal(mcdonaldGestationalAge(salah).ok, false)
assert.equal('data' in (mcdonaldGestationalAge(0) as object), false)
// Jebakan nyata: kolom kosong → "≈ 0 minggu"; nilai berlebih → "≈ 80 minggu".
assert.equal(+'', 0)

// Halaman memakai fungsi kanonik, tanpa menghitung ulang.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /midParentalHeight\(fatherCm, motherCm, childSex\)/)
assert.match(halaman, /mcdonaldGestationalAge\(fundalCm\)/)
for (const re of [/mph\.ok \?/, /mcdonald\.ok \?/, /\{mph\.reason\}/, /\{mcdonald\.reason\}/]) assert.match(halaman, re)
assert.doesNotMatch(halaman, /fatherCm \+ motherCm \+ 13/, 'rumus mid-parental tidak boleh disalin ke halaman')
assert.doesNotMatch(halaman, /const gaWeeksEst/, 'McDonald tidak boleh dihitung ulang di halaman')
console.log('mid-parental-mcdonald: golden values, regression grid, fail-closed ranges by field, single-source formulas')
