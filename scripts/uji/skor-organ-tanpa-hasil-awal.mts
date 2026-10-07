import { bacaSumber } from '../lib/sumberAsli.mjs'
import assert from 'node:assert/strict'
import { childPugh, maddreyScore, sofaScore } from '../../src/domains/clinical-calculators/index.ts'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// TIGA SKOR ORGAN, DAN SATU YANG MENGGAWATKAN ALIH-ALIH MENENANGKAN.
//
// SOFA terbuka pada PaO2/FiO2 350, trombosit 180, bilirubin 0,8, GCS 15 dan
// kreatinin 1,0. Keenam subskornya bernilai NOL, jadi layar itu menampilkan
// SOFA 0 dengan "estimated mortality <10%" lalu menulisnya ke grafik tren.
//
// Child-Pugh terbuka pada bilirubin 1,5 / albumin 3,2 / INR 1,4 dan mencetak
// sebuah kelas beserta angka ketahanan hidup satu tahun.
//
// Maddrey adalah kebalikan seluruh keluarga ini, dan karena itu paling layak
// diingat: nilai awalnya MENGGAWATKAN. Bilirubin 8,0 dengan PT 22 detik
// terhadap kontrol 12 memberi DF = 4,6 x 10 + 8 = 54, di atas ambang 32.
// Halaman itu terbuka dengan diagnosis "severe alcoholic hepatitis",
// paragraf tentang mortalitas 30-50% tanpa terapi, pertimbangan
// kortikosteroid, dan sebuah kalimat siap salin.
//
// Nilai awal yang menenangkan membuat orang lengah. Nilai awal yang
// menggawatkan membuat orang bertindak. Keduanya sama-sama karangan.
// ─────────────────────────────────────────────────────────────────────────────

const baca = (n: string) => bacaSumber('pages', n)
const kodeDari = (s: string) => s.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// ── Maddrey (Maddrey 1978) ─────────────────────────────────────────────────
const mad = baca('MaddreyScore.tsx')
const madKode = kodeDari(mad)
for (const bawaan of ['useState(8.0)', 'useState(22)', 'useState(12)']) {
  assert.ok(!madKode.includes(bawaan), `a laboratory default is back in Maddrey: ${bawaan}`)
}
// Sejak perhitungan dipindah ke domain/maddreyScore, "berat" hanya ada bila ketiga nilai sah. Regex teks-sumber lama diganti
// padanannya, ditambah pemeriksaan perilaku pada mesin (lebih kuat dari regex).
assert.ok(/const severe = res\.severe === true/.test(madKode) && /const lengkap = res\.df !== null/.test(madKode),
  'Maddrey page no longer takes its severity/completeness from the validated engine')
{
  const tanpaLab = maddreyScore({ bilirubin: NaN, patientPt: NaN, controlPt: NaN })
  assert.equal(tanpaLab.severe, null, 'Maddrey can call a patient severe again without a single laboratory value')
  assert.equal(tanpaLab.df, null, 'Maddrey still computes a discriminant function from values nobody measured')
}
assert.ok(/\{lengkap && \([\s\S]{0,80}<ScoreTrend/.test(mad), 'Maddrey still records a trend point')
assert.ok(/opened alarming rather than reassuring/.test(mad), 'the page no longer explains which way it used to err')

// Rumus Maddrey ditulis ulang, bukan dicerminkan: DF = 4,6 x (PT - kontrol) + bilirubin.
const df = (bili: number, pt: number, kontrol: number) => 4.6 * (pt - kontrol) + bili
assert.equal(df(8, 22, 12), 54, 'the old defaults no longer give 54; re-read this gate')
assert.ok(df(8, 22, 12) >= 32, 'the old defaults no longer cross the steroid threshold; re-read this gate')
// Rumus kini ada di mesin: ia harus sama dengan rumus independen di atas pada beberapa tuple (bukan lagi regex pada halaman).
for (const [b, pt, k] of [[8, 22, 12], [3, 14, 12], [1, 12, 12], [20, 30, 13]] as const) {
  const r = maddreyScore({ bilirubin: b, patientPt: pt, controlPt: k })
  assert.ok(r.df !== null && Math.abs(r.df - df(b, pt, k)) < 1e-9, `the engine no longer applies the Maddrey formula for ${[b, pt, k]}`)
}

// ── SOFA (Vincent 1996) ────────────────────────────────────────────────────
const sofa = baca('SofaScore.tsx')
const sofaKode = kodeDari(sofa)
for (const bawaan of ['useState(350)', 'useState(180)', 'useState(0.8)', 'useState(15)', 'useState(1.0)']) {
  assert.ok(!sofaKode.includes(bawaan), `a measurement default is back in SOFA: ${bawaan}`)
}
// Sejak perhitungan dipindah ke domain/sofaScore, pita mortalitas dan total hanya ada bila kelima nilai sah. Dua pernyataan
// teks-sumber lama diganti dengan padanannya, ditambah pemeriksaan perilaku pada mesin (lebih kuat dari regex).
assert.ok(/const band = res\.band/.test(sofaKode) && /const lengkap = res\.total !== null/.test(sofaKode),
  'SOFA page no longer takes its band/completeness from the validated engine')
assert.ok(/\{lengkap && total !== null && \([\s\S]{0,120}<ScoreTrend/.test(sofa), 'SOFA still records a trend point')
{
  const tanpaUkur = sofaScore({ pf: NaN, plt: NaN, bili: NaN, creat: NaN, gcs: NaN, supported: false, cv: 0 })
  assert.equal(tanpaUkur.band, null, 'SOFA still prints an estimated mortality for measurements nobody took')
  assert.equal(tanpaUkur.total, null, 'SOFA still totals measurements nobody took')
}
// Yang berbentuk penilaian TETAP terjawab.
assert.ok(/const \[cv, setCv\] = useState<CvLevel>\(0\)/.test(sofaKode),
  'the cardiovascular level was made unanswered; "no hypotension" is an assessment')
assert.ok(/const \[supported, setSupported\] = useState\(false\)/.test(sofaKode),
  'the ventilation question was made unanswered; it is a fact someone states')

// ── Child-Pugh (Pugh 1973) ─────────────────────────────────────────────────
const cp = baca('ChildPughScore.tsx')
const cpKode = kodeDari(cp)
for (const bawaan of ['useState(1.5)', 'useState(3.2)', 'useState(1.4)']) {
  assert.ok(!cpKode.includes(bawaan), `a laboratory default is back in Child-Pugh: ${bawaan}`)
}
// Sejak perhitungan dipindah ke domain/childPugh, kelas dan total hanya ada bila ketiga nilai lab sah. Regex teks-sumber lama
// diganti padanannya, ditambah pemeriksaan perilaku pada mesin (lebih kuat dari regex).
assert.ok(/const cls = res\.cls/.test(cpKode) && /const lengkap = res\.pts !== null/.test(cpKode),
  'Child-Pugh page no longer takes its class/completeness from the validated engine')
{
  const tanpaLab = childPugh({ bilirubin: NaN, albumin: NaN, inr: NaN, ascites: 1, enceph: 1 })
  assert.equal(tanpaLab.cls, null, 'Child-Pugh still prints a class and a survival figure without the laboratory values')
  assert.equal(tanpaLab.pts, null, 'Child-Pugh still totals laboratory values nobody drew')
}
// Asites dan ensefalopati berskala 1-3; 1 berarti "tidak ada" -- jawaban sah.
for (const tetap of ['ascites, setAscites] = useState<Level>(1)', 'enceph, setEnceph] = useState<Level>(1)']) {
  assert.ok(cpKode.includes(tetap), `a valid one-point clinical finding was removed from Child-Pugh: ${tetap}`)
}

console.log('skor-organ-tanpa-hasil-awal: ok')
