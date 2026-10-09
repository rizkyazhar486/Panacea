import { bacaSumber } from '../lib/sumberAsli.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { meldNa as hitungMeld } from '../../src/domains/clinical-calculators/index.ts'
import { correctedCalcium } from '../../src/domains/clinical-calculators/index.ts'

// ─────────────────────────────────────────────────────────────────────────────
// SEBUAH KALKULATOR KLINIS TIDAK BOLEH TERBUKA DENGAN JAWABAN.
//
// Terukur di peramban sebelum perbaikan ini: Corrected Calcium terbuka pada
// kalsium 8,0 dan albumin 2,5, memasang label "Hypocalcemia", dan menawarkan
// tombol menyalinnya ke catatan. MELD-Na terbuka pada bilirubin 2,0 / INR 1,5
// / kreatinin 1,2 / Na 135, mencetak skor beserta "~2% 3-month mortality",
// dan MENYIMPAN angka itu sebagai satu titik tren di perangkat.
//
// Nilai awalnya berbahaya justru karena masuk akal: 70 kg terbaca sebagai
// nilai bawaan, tetapi bilirubin 2,0 terbaca sebagai hasil lab seseorang.
// ─────────────────────────────────────────────────────────────────────────────

const baca = (nama: string) => bacaSumber('pages', nama)
const kodeDari = (s: string) => s.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// ── Corrected Calcium (Payne 1973) ─────────────────────────────────────────
const ca = baca('CorrectedCalcium.tsx')
const caKode = kodeDari(ca)
assert.ok(/const \[totalText, setTotalCa\] = useState\(''\)[\s\S]{0,160}const \[albuminText, setAlbumin\] = useState\(''\)/.test(caKode),
  'calcium or albumin has a starting value again; both are laboratory results')
assert.ok(!/useState\(8\.0\)/.test(caKode) && !/useState\(2\.5\)/.test(caKode),
  'the 8.0 mg/dL calcium or 2.5 g/dL albumin default is back')
assert.ok(/const lengkap = corrected !== null/.test(caKode), 'the page computes without both values')
assert.equal(correctedCalcium({ totalCa: NaN, albumin: 2.5 }).corrected, null, 'a corrected calcium was produced without a measured calcium')
assert.equal(correctedCalcium({ totalCa: 8, albumin: NaN }).corrected, null, 'a corrected calcium was produced without an albumin')
assert.ok(/correctedCalcium\(/.test(caKode), 'the page no longer takes its bands from the engine')
assert.equal(correctedCalcium({ totalCa: NaN, albumin: NaN }).totalBand, null,
  'a band can still be produced from an empty field, where it answers "Severe hypocalcemia"')
assert.equal(correctedCalcium({ totalCa: 0, albumin: 3 }).totalBand, null, 'calcium 0 is banded as a measurement')
assert.ok(/Nothing is calculated yet/.test(ca), 'the page no longer says it is waiting')
assert.ok(/an empty field is not a value of zero/.test(ca), 'the page no longer explains why')

// Rumus Payne ditulis ulang di sini, bukan dicerminkan dari halamannya.
const payne = (total: number, alb: number) => total + 0.8 * (4.0 - alb)
assert.ok(Math.abs(payne(7.6, 2.0) - 9.2) < 1e-9, 'the Payne correction is not what this gate thinks it is')
const motorCa = readFileSync(new URL('../../src/domains/clinical-calculators/engine/correctedCalcium.ts', import.meta.url), 'utf8')
assert.ok(/totalCa \+ 0\.8 \* \(4\.0 - \(ok\.albumin as number\)\)/.test(motorCa), 'the engine no longer applies the Payne correction')
const nyataCa = correctedCalcium({ totalCa: 7.6, albumin: 2.0 }).corrected
assert.ok(nyataCa !== null && Math.abs(nyataCa - payne(7.6, 2.0)) < 1e-9, 'the engine correction differs from the independent rewrite')

// ── MELD-Na (Kamath 2001; Kim 2008; OPTN 2016) ─────────────────────────────
const meld = baca('MeldScore.tsx')
const meldKode = kodeDari(meld)
for (const bawaan of ['useState(2.0)', 'useState(1.5)', 'useState(1.2)', 'useState(135)']) {
  assert.ok(!meldKode.includes(bawaan), `a laboratory default is back in MELD: ${bawaan}`)
}
assert.ok(/const lengkap = hasil\.meldNa !== null/.test(meldKode), 'MELD no longer tracks what is missing')
assert.ok(/const bandInfo = hasil\.band/.test(meldKode) && /hitungMeld\(/.test(meldKode), 'the MELD page no longer takes its band from the engine')
assert.equal(hitungMeld({ bilirubin: NaN, inr: NaN, creatinine: NaN, sodium: NaN, dialysis: false }).band, null,
  'MELD still bands a score built from floored empty fields')
assert.deepEqual(hitungMeld({ bilirubin: 2, inr: 1.5, creatinine: NaN, sodium: 135, dialysis: false }).missing, ['creatinine'],
  'creatinine is not required off dialysis')
assert.notEqual(hitungMeld({ bilirubin: 2, inr: 1.5, creatinine: NaN, sodium: 135, dialysis: true }).meldNa, null,
  'creatinine is required even on dialysis')

// Yang paling penting: titik tren TIDAK boleh tersimpan dari halaman kosong.
assert.ok(/\{lengkap && \([\s\S]{0,80}<ScoreTrend/.test(meld),
  'ScoreTrend still records a score on a page where nothing was entered')

// Lantai rumusnya memang mengubah 0 menjadi 1,0 -- itulah sebabnya penjaga di
// atas diperlukan. Diperiksa, bukan diandaikan.
const meldRaw = (b: number, i: number, c: number) => 3.78 * Math.log(Math.max(b, 1)) + 11.2 * Math.log(Math.max(i, 1)) + 9.57 * Math.log(Math.min(Math.max(c, 1), 4)) + 6.43
const kosong = Math.min(Math.max(meldRaw(0, 0, 0), 6), 40)
assert.equal(Math.round(kosong), 6,
  'the empty-page MELD is no longer 6; re-read this gate, the floors have changed')

console.log('kalkulator-tanpa-hasil-awal: ok')
