import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { coffeeFluidMl, fastingElectrolytes, FASTING_HYDRATION_REVIEW } from '../../src/domains/personal-health/engine/fastingHydration.ts'
import { parseNumberField } from '../../src/domains/clinical-calculators/engine/inputs.ts'

// Positif: nilai tangan (koefisien dipindahkan tanpa perubahan dari halaman).
assert.deepEqual(coffeeFluidMl(2), { ok: true, value: { ml: 300 } })
assert.deepEqual(fastingElectrolytes(16), { ok: true, value: { sodiumMg: 960, potassiumMg: 720, magnesiumMg: 128 } })
// 0 sah bila diketik eksplisit (bukan karena kosong).
assert.deepEqual(coffeeFluidMl(0), { ok: true, value: { ml: 0 } })
assert.deepEqual(fastingElectrolytes(0), { ok: true, value: { sodiumMg: 0, potassiumMg: 0, magnesiumMg: 0 } })
// Batas atas harian ikut berlaku (72 jam → natrium 4320 → 3000, kalium 3240 → 2500, magnesium 576 → 350).
assert.deepEqual(fastingElectrolytes(72), { ok: true, value: { sodiumMg: 3000, potassiumMg: 2500, magnesiumMg: 350 } })

// Batas berpasangan: tepat di batas diterima, ±1 langkah ditolak.
assert.equal(coffeeFluidMl(15).ok, true)
assert.deepEqual(coffeeFluidMl(16), { ok: false, problem: 'Cups must be a whole number from 0 to 15.' })
assert.deepEqual(coffeeFluidMl(-1), { ok: false, problem: 'Cups must be a whole number from 0 to 15.' })
assert.deepEqual(coffeeFluidMl(2.5), { ok: false, problem: 'Cups must be a whole number from 0 to 15.' })
assert.equal(fastingElectrolytes(72).ok, true)
assert.deepEqual(fastingElectrolytes(72.01), { ok: false, problem: 'Fasting hours must be between 0 and 72.' })
assert.deepEqual(fastingElectrolytes(-0.01), { ok: false, problem: 'Fasting hours must be between 0 and 72.' })

// Negatif: kosong/teks/NaN/Infinity lewat parseNumberField tidak pernah menjadi angka.
const cupsMsg = { ok: false, problem: 'Enter the number of cups (a whole number from 0 to 15).' }
const hoursMsg = { ok: false, problem: 'Enter how many hours you have been fasting (0 to 72).' }
for (const teks of ['', '   ', 'abc', 'NaN', 'Infinity', '-Infinity', '1e999']) {
  assert.deepEqual(coffeeFluidMl(parseNumberField(teks)), cupsMsg, `cups ${JSON.stringify(teks)}`)
  assert.deepEqual(fastingElectrolytes(parseNumberField(teks)), hoursMsg, `hours ${JSON.stringify(teks)}`)
}
// Berpasangan: hanya "kosong" yang berbeda dari "0" eksplisit.
assert.equal(coffeeFluidMl(parseNumberField('0')).ok, true)
assert.equal(coffeeFluidMl(parseNumberField('')).ok, false)

// Determinisme.
assert.deepEqual(fastingElectrolytes(16), fastingElectrolytes(16))

// Regresi halaman: tanpa fallback `|| 0`, kolom mulai kosong, estimasi lewat engine.
const halaman = readFileSync(new URL('../../src/pages/bodyhub/NutritionToolkit.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(halaman, /Number\([^()]*\)\s*\|\|\s*0/, 'halaman tidak boleh membaca kolom kosong sebagai 0')
assert.match(halaman, /useState\(''\)[\s\S]*coffeeFluidMl\(parseNumberField\(cups\)\)/)
assert.match(halaman, /fastingElectrolytes\(parseNumberField\(hours\)\)/)
assert.doesNotMatch(halaman, /hours \* 60/, 'rumus elektrolit tidak boleh disalin kembali ke halaman')
console.log('nutrition-puasa-kopi: OK')

assert.deepEqual(FASTING_HYDRATION_REVIEW, {
  status: 'PENDING_CLINICAL_REVIEW', clinically_reviewed: false, coefficient_evidence: 'UNVERIFIED',
  reviewer: null, reviewed_at: null, evidence: null,
})
for (const bad of ['2', null, undefined, true, {}]) {
  assert.equal(coffeeFluidMl(bad as unknown as number).ok, false)
  assert.equal(fastingElectrolytes(bad as unknown as number).ok, false)
}
assert.match(halaman, /not intake targets or supplement doses/)
assert.doesNotMatch(halaman, /Rough daily targets/)
const workflow = readFileSync(new URL('../../.github/workflows/stabilization-acceptance.yml', import.meta.url), 'utf8')
assert.match(workflow, /run: node scripts\/qa\/nutrition-input-smoke\.mjs/)
