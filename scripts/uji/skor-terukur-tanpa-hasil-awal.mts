import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// PENGUKURAN YANG BELUM DIAMBIL BUKAN JAWABAN.
//
// Lanjutan dari kalkulator-tanpa-hasil-awal.mts, untuk tiga skor yang
// dibangun dari TANDA VITAL dan REKAMAN, bukan dari centang.
//
// Perbedaannya penting dan sengaja dipertahankan: Killip I tanpa henti
// jantung, SpO2 pada udara ruangan, atau "sadar penuh" adalah jawaban yang
// SAH dan bernilai nol -- seseorang memang menjawabnya. Nadi 75 dan QT 400 ms
// bukan jawaban; keduanya hanya terlihat seperti jawaban.
//
// Yang diukur sebelum perbaikan: NEWS2 terbuka dengan RR 16 / SpO2 98 /
// TD 120 / nadi 75 / suhu 37,0 -- berjumlah NOL -- lalu menampilkan
// "Low risk" dan anjuran "Routine monitoring per ward protocol", serta
// menyimpannya sebagai titik tren. QTc terbuka pada QT 400 @ 60 bpm, yang
// terkoreksi menjadi tepat 400 ms dan dijawab "Normal". GRACE terbuka pada
// usia 60 / nadi 75 / TD 130 / kreatinin 1,0 dan mencetak angka kematian
// di rumah sakit.
// ─────────────────────────────────────────────────────────────────────────────

const baca = (n: string) => readFileSync(new URL(`../../src/pages/${n}`, import.meta.url), 'utf8')
const kodeDari = (s: string) => s.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// ── NEWS2 (RCP 2017) ───────────────────────────────────────────────────────
const news = baca('News2Score.tsx')
const newsKode = kodeDari(news)
for (const bawaan of ['useState(16)', 'useState(98)', 'useState(120)', 'useState(37.0)']) {
  assert.ok(!newsKode.includes(bawaan), `a vital-sign default is back in NEWS2: ${bawaan}`)
}
assert.ok(/const lengkap = belum\.length === 0/.test(newsKode), 'NEWS2 no longer tracks what is missing')
assert.ok(/const result = lengkap \? band\(total, anyThree\) : null/.test(newsKode),
  'NEWS2 still bands a total built from unmeasured observations')
assert.ok(/\{lengkap && \([\s\S]{0,80}<ScoreTrend/.test(news),
  'NEWS2 still records a trend point for a patient nobody assessed')
assert.ok(/routine monitoring/i.test(news), 'NEWS2 no longer explains why a zero score is not reassurance')
// Nadi masih boleh datang dari cache kesehatan -- itu bacaan yang nyata.
assert.ok(/getHealthCache\(\)\.restingHr/.test(newsKode),
  'the genuine device pulse reading was removed along with the invented defaults')

// ── QTc ────────────────────────────────────────────────────────────────────
const qtc = baca('QTcCalculator.tsx')
const qtcKode = kodeDari(qtc)
assert.ok(!/useState\(400\)/.test(qtcKode) && !/useState\(60\)/.test(qtcKode),
  'the QT 400 ms / 60 bpm defaults are back')
assert.ok(/const primaryBand = lengkap \? band\(primary, sex\) : null/.test(qtcKode),
  'QTc still bands a correction computed from nothing')
assert.ok(/\{lengkap && \([\s\S]{0,80}<ScoreTrend/.test(qtc), 'QTc still records a trend point')
assert.ok(/getDemoTersimpan/.test(qtcKode) && !/\bgetDemo\s*\(/.test(qtcKode),
  'QTc still takes sex from getDemo(), which answers male for an empty profile')

// Bazett ditulis ulang di sini: QTc = QT / sqrt(RR). Pada 60 bpm, RR = 1 s,
// jadi QTc = QT persis. Itulah sebabnya 400 @ 60 tampak "Normal" -- premis
// yang diperiksa, bukan diandaikan.
const bazett = (qtMs: number, hr: number) => (qtMs / 1000) / Math.sqrt(60 / hr) * 1000
assert.ok(Math.abs(bazett(400, 60) - 400) < 1e-9,
  'Bazett at 60 bpm no longer returns the QT unchanged; re-read this gate')
assert.ok(Math.abs(bazett(400, 100) - 516.4) < 0.1, 'Bazett is not what this gate thinks it is')
assert.ok(/qtSec \/ Math\.sqrt\(rrSec\) \* 1000/.test(qtcKode), 'the page no longer applies Bazett')

// ── GRACE (Granger 2003) ───────────────────────────────────────────────────
const grace = baca('GraceScore.tsx')
const graceKode = kodeDari(grace)
for (const bawaan of ['useState(75)', 'useState(130)', 'useState(1.0)']) {
  assert.ok(!graceKode.includes(bawaan), `a measurement default is back in GRACE: ${bawaan}`)
}
assert.ok(/const result = lengkap \? band\(score\) : null/.test(graceKode),
  'GRACE still prints an in-hospital mortality band for measurements nobody took')
assert.ok(/getDemoTersimpan/.test(graceKode) && !/\bgetDemo\s*\(/.test(graceKode),
  'GRACE still seeds age from getDemo()')
// Yang berbentuk jawaban harus TETAP ada. Memaksa seseorang mencentang
// "Killip I" hanya memindahkan beban tanpa menambah kebenaran.
assert.ok(/useState\(0\)\s*\/\/|const \[killip, setKillip\] = useState\(0\)/.test(graceKode),
  'Killip was turned into a required field; it is a real answer worth zero points')
for (const tetap of ['arrest, setArrest] = useState(false)', 'stDev, setStDev] = useState(false)', 'markers, setMarkers] = useState(false)']) {
  assert.ok(graceKode.includes(tetap), `a valid zero-point answer was removed from GRACE: ${tetap}`)
}

console.log('skor-terukur-tanpa-hasil-awal: ok')
