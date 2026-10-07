import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseNumberField, validateBallardInputs, validateDenverAge } from '../../src/domains/clinical-calculators/index.ts'

// ── Ballard: berat lahir dan Apgar ──
assert.deepEqual(validateBallardInputs(3000, 8, 9), { ok: true, data: { birthWeightG: 3000, apgar1: 8, apgar5: 9 } })
for (const [w, a1, a5] of [[200, 0, 0], [8000, 10, 10], [200, 10, 0], [2500.5, 7, 7]] as const) assert.equal(validateBallardInputs(w, a1, a5).ok, true, `${w},${a1},${a5}`)
const GW = { ok: false, reason: 'Birth weight must be 200–8000 g' }
for (const w of [199.99, 0, -3000, 8000.01, 30000, NaN, Infinity, -Infinity, parseNumberField('')]) assert.deepEqual(validateBallardInputs(w, 8, 9), GW, `berat ${w}`)
// Pasangan: hanya satu Apgar rusak → alasan menyebut menit yang tepat.
const G1 = { ok: false, reason: '1-minute APGAR must be a whole number of 0–10' }, G5 = { ok: false, reason: '5-minute APGAR must be a whole number of 0–10' }
for (const bad of [-1, 11, 5.5, 0.1, NaN, Infinity, parseNumberField('')]) {
  assert.deepEqual(validateBallardInputs(3000, bad, 9), G1, `apgar1 ${bad}`)
  assert.deepEqual(validateBallardInputs(3000, 8, bad), G5, `apgar5 ${bad}`)
}
for (const salah of [undefined, null, '8'] as unknown as number[]) { assert.equal(validateBallardInputs(salah, 8, 9).ok, false); assert.equal(validateBallardInputs(3000, salah, 9).ok, false); assert.equal(validateBallardInputs(3000, 8, salah).ok, false) }
assert.equal('data' in (validateBallardInputs(3000, NaN, 9) as object), false)
// Apgar 0 sah (bukan "kosong"): inilah mengapa kolom kosong harus ditolak, bukan dibaca 0.
assert.equal(validateBallardInputs(3000, 0, 0).ok, true); assert.equal(validateBallardInputs(3000, parseNumberField(''), parseNumberField('')).ok, false)
// Jebakan nyata halaman lama: Apgar 5 menit kosong → 0 → catatan SOAP otomatis menulis depresi berat dan rujukan NICU.
const kalimatLama = (apgar5: number) => apgar5 >= 7 ? 'good, adequate neonatal adaptation' : apgar5 >= 4 ? 'needs close observation' : 'severe depression, needs further resuscitation & NICU referral'
assert.equal(kalimatLama(+''), 'severe depression, needs further resuscitation & NICU referral')

// ── Denver: usia ──
for (const age of [0, 72, 12, 0.5, 71.99]) assert.deepEqual(validateDenverAge(age), { ok: true, data: { ageMonths: age } }, `usia ${age}`)
const GD = { ok: false, reason: 'Age must be 0–72 months' }
for (const age of [-0.01, -1, 72.01, 100, 1000, NaN, Infinity, -Infinity, parseNumberField('')]) assert.deepEqual(validateDenverAge(age), GD, `usia ${age}`)
for (const salah of [undefined, null, '12'] as unknown as number[]) assert.equal(validateDenverAge(salah).ok, false)
assert.equal('data' in (validateDenverAge(1000) as object), false)

// ── Halaman: teks mentah, gerbang validasi, dan isi klinis lama tidak diubah ──
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /validateBallardInputs\(parseNumberField\(birthWeightG\), parseNumberField\(apgar1\), parseNumberField\(apgar5\)\)/)
assert.match(halaman, /const \[apgar5, setApgar5\] = useState\('9'\)/); assert.match(halaman, /const \[birthWeightG, setBirthWeightG\] = useState\('3000'\)/)
assert.match(halaman, /const soapNote = !neonate\.ok \|\| !lub \? '' :/)
assert.match(halaman, /neonate\.ok \? \(/); assert.match(halaman, /\{neonate\.reason\}/)
assert.doesNotMatch(halaman, /Birth Weight: \$\{birthWeightG\} g/, 'catatan SOAP tidak boleh memakai teks mentah berat lahir')
assert.doesNotMatch(halaman, /5-minute APGAR \$\{apgar5 >= 7/, 'catatan SOAP tidak boleh memakai Apgar mentah')
assert.match(halaman, /severe depression, needs further resuscitation & NICU referral/, 'isi klinis lama tidak boleh diubah')
assert.match(halaman, /validateDenverAge\(parseNumberField\(ageText\)\)/); assert.match(halaman, /const \[ageText, setAgeText\] = useState\('12'\)/)
assert.match(halaman, /const domainFlags = !denverAge\.ok \? \[\] : DENVER_DOMAINS\.map/); assert.match(halaman, /\{denverAge\.reason\}/)
assert.match(halaman, /ageMo - m\.ageMo >= 6/, 'aturan peringatan keterlambatan ≥ 6 bulan tidak diubah')
console.log('ballard-denver-inputs: empty APGAR/weight/age never read as 0, SOAP and milestones gated on valid input, clinical content unchanged')
