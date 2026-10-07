import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseNumberField, validateCdcInputs, validateNeonateInputs, validateWhoGrowthInputs } from '../../src/domains/clinical-calculators/index.ts'

const bad = (extra: number[] = []) => [NaN, Infinity, -Infinity, parseNumberField(''), ...extra]

// ── WHO 0-60 bulan ──
assert.deepEqual(validateWhoGrowthInputs(12, 9.6, 75.7), { ok: true, data: { ageMonths: 12, weightKg: 9.6, lengthCm: 75.7 } })
for (const [a, w, l] of [[0, 0.5, 30], [60, 60, 150], [0, 60, 150]] as const) assert.equal(validateWhoGrowthInputs(a, w, l).ok, true, `${a},${w},${l}`)
const WA = { ok: false, reason: 'Age must be 0–60 months' }, WW = { ok: false, reason: 'Weight must be 0.5–60 kg' }, WL = { ok: false, reason: 'Length/height must be 30–150 cm' }
for (const v of bad([-0.01, -1, 60.01, 600])) assert.deepEqual(validateWhoGrowthInputs(v, 9.6, 75.7), WA, `usia ${v}`)
for (const v of bad([0.49, 0, -9, 60.01, 500])) assert.deepEqual(validateWhoGrowthInputs(12, v, 75.7), WW, `berat ${v}`)
for (const v of bad([29.99, 0, -75, 150.01, 1500])) assert.deepEqual(validateWhoGrowthInputs(12, 9.6, v), WL, `panjang ${v}`)
// Jebakan nyata: tinggi 0 → BMI Infinity; berat kosong → 0 kg.
assert.equal(9.6 / (+'' / 100) ** 2, Infinity)

// ── Neonatus 0-30 hari ──
assert.deepEqual(validateNeonateInputs(3200, 5, 2950), { ok: true, data: { birthWeightG: 3200, days: 5, currentWeightG: 2950 } })
for (const [b, d, c] of [[200, 0, 200], [8000, 30, 8000], [3200, 14.5, 3000]] as const) assert.equal(validateNeonateInputs(b, d, c).ok, true, `${b},${d},${c}`)
const NB = { ok: false, reason: 'Birth weight must be 200–8000 g' }, ND = { ok: false, reason: 'Age must be 0–30 days' }, NC = { ok: false, reason: 'Current weight must be 200–8000 g' }
for (const v of bad([199.99, 0, -3200, 8000.01])) assert.deepEqual(validateNeonateInputs(v, 5, 2950), NB, `berat lahir ${v}`)
for (const v of bad([-0.01, -1, 30.01, 300])) assert.deepEqual(validateNeonateInputs(3200, v, 2950), ND, `hari ${v}`)
for (const v of bad([199.99, 0, -2950, 8000.01])) assert.deepEqual(validateNeonateInputs(3200, 5, v), NC, `berat kini ${v}`)

// ── CDC 2-20 tahun ──
assert.deepEqual(validateCdcInputs(10, 32, 138), { ok: true, data: { ageYears: 10, weightKg: 32, heightCm: 138 } })
for (const [a, w, h] of [[2, 5, 50], [20, 300, 250], [2.5, 12.5, 90.5]] as const) assert.equal(validateCdcInputs(a, w, h).ok, true, `${a},${w},${h}`)
const CA = { ok: false, reason: 'Age must be 2–20 years' }, CW = { ok: false, reason: 'Weight must be 5–300 kg' }, CH = { ok: false, reason: 'Height must be 50–250 cm' }
for (const v of bad([1.99, 0, -10, 20.01, 200])) assert.deepEqual(validateCdcInputs(v, 32, 138), CA, `usia ${v}`)
for (const v of bad([4.99, 0, -32, 300.01])) assert.deepEqual(validateCdcInputs(10, v, 138), CW, `berat ${v}`)
for (const v of bad([49.99, 0, -138, 250.01, 1380])) assert.deepEqual(validateCdcInputs(10, 32, v), CH, `tinggi ${v}`)
// Pasangan: urutan pemeriksaan terdokumentasi — usia dilaporkan lebih dulu bila beberapa kolom salah.
assert.deepEqual(validateCdcInputs(NaN, NaN, NaN), CA)
for (const salah of [undefined, null, '10'] as unknown as number[]) {
  assert.equal(validateWhoGrowthInputs(salah, 9.6, 75.7).ok, false); assert.equal(validateNeonateInputs(3200, salah, 2950).ok, false); assert.equal(validateCdcInputs(10, 32, salah).ok, false)
}
for (const r of [validateWhoGrowthInputs(NaN, 1, 1), validateNeonateInputs(NaN, 1, 1), validateCdcInputs(NaN, 1, 1)]) assert.equal('data' in (r as object), false)
assert.deepEqual(validateCdcInputs(10, 32, 138), validateCdcInputs(10, 32, 138), 'deterministik')

// ── Halaman: teks mentah, anak hanya dirender bila sah, isi klinis dan tabel tidak diubah ──
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /validateWhoGrowthInputs\(parseNumberField\(ageText\), parseNumberField\(weightText\), parseNumberField\(heightText\)\)/)
assert.match(halaman, /validateNeonateInputs\(parseNumberField\(birthText\), parseNumberField\(daysText\), parseNumberField\(currentText\)\)/)
assert.match(halaman, /validateCdcInputs\(parseNumberField\(ageText\), parseNumberField\(weightText\), parseNumberField\(heightText\)\)/)
for (const re of [/<WhoGrowthResults \{\.\.\.inputs\.data\} sex=\{sex\} \/>/, /<WhoNeonateResults \{\.\.\.inputs\.data\} \/>/, /<CdcAnthropometryResults \{\.\.\.inputs\.data\} sex=\{sex\} \/>/]) assert.match(halaman, re)
assert.equal((halaman.match(/inputs\.ok \? \(/g) ?? []).length >= 3, true)
assert.match(halaman, /const \[ageText, setAgeText\] = useState\('12'\)/); assert.match(halaman, /const \[birthText, setBirthText\] = useState\('3200'\)/)
// Hitungan dan peringatan klinis yang ada tetap persis. Kecocokan per BARIS UTUH, bukan substring ("** 2.1" mengandung "** 2").
const barisHalaman = halaman.split('\n').map((l) => l.trim())
for (const baris of [
  'const waz = (weight - wM) / wSD', 'const haz = (height - hM) / hSD', 'const whz = (weight - whzRef.m) / whzRef.sd',
  'const bmi = weight / (height / 100) ** 2', 'const masked = haz <= -2 && waz > -2',
  'const expectedG = (birthWeightG * expectedPct) / 100', 'const z = (currentPct - expectedPct) / sdPct',
  'const excessLoss = days <= 10 && lossFromBirth > 10', 'const notRegained = days >= 14 && currentWeightG < birthWeightG',
  'const cls = cdcBmiClass(bmi, ageYr, sex)',
]) assert.ok(barisHalaman.includes(baris), `isi klinis tidak boleh berubah: ${baris}`)
// BMI ada di dua komponen (WHO dan CDC) dan keduanya harus tetap persis.
assert.equal(barisHalaman.filter((l) => l === 'const bmi = weight / (height / 100) ** 2').length, 2, 'rumus BMI harus utuh di kedua komponen')
assert.ok(!/useState\(\d+(\.\d+)?\)\s*\n[^\n]*setAgeMo/.test(halaman), 'tidak ada state numerik lama untuk usia WHO')
console.log('growth-inputs: WHO / neonate / CDC inputs validated, empty never read as 0, results rendered only for valid input, tables and clinical rules untouched')
