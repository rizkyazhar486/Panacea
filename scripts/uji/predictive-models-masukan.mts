import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePredictiveField, PREDICTIVE_FIELDS, type PredictiveField } from '../../src/domains/personal-health/engine/predictiveInputs.ts'

const ok = (f: PredictiveField, t: string) => parsePredictiveField(f, t)

// Positif: nilai sah dibaca persis.
assert.deepEqual(ok('bodyFatPct', '20'), { ok: true, value: 20 })
assert.deepEqual(ok('foodGrams', ' 150.5 '), { ok: true, value: 150.5 })
assert.deepEqual(ok('lightWithinMin', '0'), { ok: true, value: 0 }, '0 eksplisit sah bila rentang memuatnya')

// Batas berpasangan untuk setiap kolom: tepat di batas diterima, satu langkah di luar ditolak.
for (const [f, s] of Object.entries(PREDICTIVE_FIELDS) as [PredictiveField, { min: number; max: number }][]) {
  assert.deepEqual(ok(f, String(s.min)), { ok: true, value: s.min }, `${f} batas bawah`)
  assert.deepEqual(ok(f, String(s.max)), { ok: true, value: s.max }, `${f} batas atas`)
  assert.equal(ok(f, String(s.min - 0.01)).ok, false, `${f} di bawah batas`)
  assert.equal(ok(f, String(s.max + 0.01)).ok, false, `${f} di atas batas`)
}

// Negatif: kosong ≠ 0 (kolom yang rentangnya memuat 0 tetap menolak kosong), pesan eksak.
assert.deepEqual(ok('lightWithinMin', ''), { ok: false, problem: 'Daylight within is empty — enter a value (0–240 min).' })
assert.deepEqual(ok('hoursSinceMeal', '   '), { ok: false, problem: 'Hours since last meal is empty — enter a value (0–72 h).' })
assert.deepEqual(ok('saunaTempC', 'abc'), { ok: false, problem: 'Temperature must be a finite number (40–110 °C).' })
for (const bad of ['NaN', 'Infinity', '-Infinity', '1e999']) assert.equal(ok('foodGrams', bad).ok, false, bad)
assert.deepEqual(ok('saunaMinutes', '-5'), { ok: false, problem: 'Session length must be within 1–180 min.' })
for (const t of [undefined, null, 20, {}, []] as unknown[]) assert.equal(parsePredictiveField('bodyFatPct', t).ok, false, `tipe ${typeof t}`)

// Determinisme.
assert.deepEqual(ok('bodyFatPct', '33'), ok('bodyFatPct', '33'))

// Regresi halaman: tidak ada "|| 0" pada kolom, setiap kolom memakai validator, dan kartu "No estimate yet" ada.
const halaman = readFileSync('src/pages/bodyhub/PredictiveModelsToolkit.tsx', 'utf8')
assert.doesNotMatch(halaman, /(?:Number|parseFloat|parseInt)\([^()]*\)\s*\|\|\s*0/, 'kolom kosong tidak boleh dibaca 0')
for (const f of Object.keys(PREDICTIVE_FIELDS)) assert.match(halaman, new RegExp(`useField\\('${f}'`), `${f} harus lewat validator`)
assert.match(halaman, /No estimate yet/)
assert.match(halaman, /from '\.\.\/domains\/personal-health'/, 'impor lewat index domain')

console.log('predictive-models-masukan: OK')
