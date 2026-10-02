import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// ─────────────────────────────────────────────────────────────────────────────
// NOL YANG PALING BERBAHAYA ADALAH NOL YANG BERARTI "PULANGKAN SAJA".
//
// Tiga skor terakhir dari keluarga ini, dan yang pertama adalah yang paling
// tajam yang ditemukan sejauh ini.
//
// Glasgow-Blatchford terbuka pada ureum 15, Hb 14 (laki-laki) dan TD sistolik
// 120. Ketiganya bernilai NOL poin. Dan skor nol pada GBS bukan sekadar
// "rendah": ia ambang yang dipakai sebagian panduan untuk memulangkan pasien
// perdarahan saluran cerna atas TANPA rawat inap dan TANPA endoskopi. Layar
// itu menampilkan kesimpulan tersebut, lengkap dengan kalimat siap salin,
// sebelum ada yang memasukkan apa pun.
//
// FINDRISC mencetak persentase risiko diabetes 10 tahun dari usia 45, IMT 24
// dan lingkar pinggang 90 yang terisi sendiri. STOP-BANG memberi satu poin
// BANG kepada SEMUA ORANG, karena `demo.sex === 'M'` selalu benar pada profil
// kosong -- dan satu poin memindahkan ambang 3 dan 5.
// ─────────────────────────────────────────────────────────────────────────────

const baca = (n: string) => readFileSync(new URL(`../../src/pages/${n}`, import.meta.url), 'utf8')
const kodeDari = (s: string) => s.split('\n').filter((b) => !b.trim().startsWith('//') && !b.trim().startsWith('*')).join('\n')

// ── Glasgow-Blatchford (Blatchford 2000) ───────────────────────────────────
const gbs = baca('GlasgowBlatchfordScore.tsx')
const gbsKode = kodeDari(gbs)
for (const bawaan of ['useState(15)', 'useState(14)', 'useState(120)']) {
  assert.ok(!gbsKode.includes(bawaan), `a measurement default is back in Glasgow-Blatchford: ${bawaan}`)
}
assert.ok(/const lowRisk = lengkap && score === 0/.test(gbsKode),
  '"very low risk" can be reached again without a single measurement — that is the discharge threshold')
assert.ok(/\{lengkap \?/.test(gbs), 'the GBS result block is not gated on having the measurements')
assert.ok(/without endoscopy/.test(gbs), 'the page no longer says what a zero actually means')
// Kotak centangnya harus TETAP boleh kosong: tidak ada melena adalah jawaban.
assert.ok(/useState<Record<string, boolean>>\(\{\}\)/.test(gbsKode),
  'the GBS flags were dragged into being required; "no melena" is a real answer')

// Premisnya diperiksa: ketiga nilai bawaan itu memang bernilai nol poin.
// Ditulis ulang dari tabel Blatchford, bukan dicerminkan dari halamannya.
const bunPts = (v: number) => (v < 18.2 ? 0 : v < 22.4 ? 2 : v < 28 ? 3 : v < 70 ? 4 : 6)
const sbpPts = (v: number) => (v >= 110 ? 0 : v >= 100 ? 1 : v >= 90 ? 2 : 3)
assert.equal(bunPts(15), 0, 'blood urea 15 is no longer worth zero; re-read this gate')
assert.equal(sbpPts(120), 0, 'a systolic of 120 is no longer worth zero; re-read this gate')

// ── FINDRISC (Lindström & Tuomilehto 2003) ─────────────────────────────────
const fin = baca('Findrisc.tsx')
const finKode = kodeDari(fin)
assert.ok(!/useState\(demo\.age \|\| 45\)/.test(finKode) && !/: 24\n/.test(finKode),
  'the age 45 / BMI 24 defaults are back in FINDRISC')
assert.ok(!/useState\(90\)/.test(finKode), 'the waist 90 cm default is back')
assert.ok(/const result = lengkap \? band\(score\) : null/.test(finKode),
  'FINDRISC still prints a ten-year diabetes percentage without the measurements')
assert.ok(/getDemoTersimpan/.test(finKode) && !/\bgetDemo\s*\(/.test(finKode), 'FINDRISC still reads getDemo()')
// Pertanyaan gaya hidup TETAP terjawab -- itu jawaban bernilai nol poin.
for (const tetap of ['active, setActive] = useState(true)', 'veg, setVeg] = useState(true)']) {
  assert.ok(finKode.includes(tetap), `a valid zero-point lifestyle answer was removed: ${tetap}`)
}

// ── STOP-BANG (Chung 2008) ─────────────────────────────────────────────────
const sb = baca('SleepApneaScreen.tsx')
const sbKode = kodeDari(sb)
assert.ok(!/useState\(demo\.sex === 'M'\)/.test(sbKode),
  'sex again defaults to male, handing every user a BANG point they did not answer for')
assert.ok(/const male = sex === 'M'/.test(sbKode), 'the sex answer is no longer explicit')
assert.ok(/const band = lengkap \? bandFor\(total\) : null/.test(sbKode),
  'STOP-BANG still bands a total that includes an unanswered sex point')
assert.ok(/<option value="">Not answered<\/option>/.test(sb), 'there is no way to leave sex unanswered')
assert.ok(/useState<Record<string, boolean>>\(\{\}\)/.test(sbKode),
  'the four STOP questions were dragged into being required; unticked means no, worth zero')

console.log('skor-lab-tanpa-hasil-awal: ok')
