import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { egfrCkdEpi2021, kdigoGfrStage } from '../../src/lib/longevity.ts'

// Rujukan independen: persamaan CKD-EPI 2021 (Inker et al., NEJM 2021) ditulis ulang dengan exp/log, bukan Math.pow,
// sehingga bukan salinan baris implementasi. Nilai di bawah dihitung dari persamaan itu, bukan dari tabel terbitan.
//   eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^usia × 1.012 [perempuan]
//   κ = 0.7 (P) / 0.9 (L); α = −0.241 (P) / −0.302 (L)
function rujukan(scr: number, usia: number, perempuan: boolean): number {
  const kappa = perempuan ? 0.7 : 0.9
  const alfa = perempuan ? -0.241 : -0.302
  const r = scr / kappa
  return 142 * Math.exp(alfa * Math.log(Math.min(r, 1))) * Math.exp(-1.2 * Math.log(Math.max(r, 1)))
    * Math.exp(usia * Math.log(0.9938)) * (perempuan ? 1.012 : 1)
}

const GOLDEN = [
  { scr: 1.0, usia: 40, perempuan: false, egfr: 97.575111, stadium: 'G1' },
  { scr: 0.8, usia: 55, perempuan: true, egfr: 86.960715, stadium: 'G2' },
  { scr: 1.8, usia: 70, perempuan: false, egfr: 39.992801, stadium: 'G3b' },
  { scr: 0.5, usia: 30, perempuan: true, egfr: 129.31696, stadium: 'G1' }, // di bawah κ: cabang min()^α
  { scr: 0.6, usia: 25, perempuan: false, egfr: 137.386075, stadium: 'G1' },
  { scr: 0.9, usia: 50, perempuan: false, egfr: 104.049013, stadium: 'G1' }, // Scr = κ: 142 × 0.9938^50
  { scr: 0.7, usia: 60, perempuan: true, egfr: 98.948315, stadium: 'G1' }, // Scr = κ: 142 × 0.9938^60 × 1.012
  { scr: 3.2, usia: 82, perempuan: true, egfr: 13.929127, stadium: 'G5' },
  { scr: 0.1, usia: 18, perempuan: false, egfr: 246.519595, stadium: 'G1' }, // batas bawah masukan
  { scr: 25, usia: 120, perempuan: true, egfr: 0.93312, stadium: 'G5' }, // batas atas masukan
] as const

for (const c of GOLDEN) {
  assert.ok(Math.abs(rujukan(c.scr, c.usia, c.perempuan) - c.egfr) < 1e-6, `rujukan independen menyimpang untuk ${JSON.stringify(c)}`)
  const r = egfrCkdEpi2021(c.scr, c.usia, c.perempuan)
  assert.equal(r.ok, true, JSON.stringify(c))
  if (!r.ok) continue
  assert.equal(r.data.nilai, Number(c.egfr.toFixed(1)), `nilai ${JSON.stringify(c)}`)
  assert.equal(r.data.stadium, c.stadium, `stadium ${JSON.stringify(c)}`)
  assert.equal(r.data.satuan, 'mL/min/1.73m²')
  assert.equal(r.data.catatan[0], `KDIGO category ${c.stadium} by eGFR alone`)
}

// Pasangan: hanya jenis kelamin yang berbeda. Perempuan memiliki κ dan α sendiri serta faktor 1.012.
const laki = egfrCkdEpi2021(1.0, 40, false)
const perempuan = egfrCkdEpi2021(1.0, 40, true)
assert.ok(laki.ok && perempuan.ok)
if (laki.ok && perempuan.ok) assert.notEqual(laki.data.nilai, perempuan.data.nilai)

// Sifat: eGFR tidak naik bila kreatinin atau usia naik.
let sebelumnya = Infinity
for (let scr = 0.1; scr <= 25; scr += 0.1) {
  const r = egfrCkdEpi2021(Number(scr.toFixed(2)), 50, false)
  assert.ok(r.ok)
  if (r.ok) { assert.ok(r.data.nilai <= sebelumnya + 1e-9, `eGFR naik pada kreatinin ${scr}`); sebelumnya = r.data.nilai }
}
sebelumnya = Infinity
for (let usia = 18; usia <= 120; usia++) {
  const r = egfrCkdEpi2021(1.1, usia, true)
  assert.ok(r.ok)
  if (r.ok) { assert.ok(r.data.nilai <= sebelumnya + 1e-9, `eGFR naik pada usia ${usia}`); sebelumnya = r.data.nilai }
}

// Batas masukan: tepat di batas diterima, satu langkah di luar ditolak dengan alasan eksplisit dan tanpa data.
for (const ok of [[0.1, 45], [25, 45], [1, 18], [1, 120]] as const) assert.equal(egfrCkdEpi2021(ok[0], ok[1], false).ok, true, `harus diterima: ${ok}`)
const GALAT_KREATININ = 'Creatinine must be 0.1–25 mg/dL'
const GALAT_USIA = 'Age must be 18–120 years'
for (const scr of [0.0999, 0.09, 0, -1, -0.5, 25.0001, 26, 1000, Number.NaN, Infinity, -Infinity]) {
  const r = egfrCkdEpi2021(scr, 45, false)
  assert.deepEqual(r, { ok: false, alasan: GALAT_KREATININ }, `kreatinin ${scr}`)
}
for (const usia of [17.99, 17, 0, -5, 120.01, 121, 300, Number.NaN, Infinity, -Infinity]) {
  const r = egfrCkdEpi2021(1, usia, false)
  assert.deepEqual(r, { ok: false, alasan: GALAT_USIA }, `usia ${usia}`)
}
// Bukan angka sama sekali (mis. nilai dari kolom yang belum diisi bila pemanggil tidak mengonversi).
for (const salah of [undefined, null, '1.0', {}, []] as unknown as number[]) {
  assert.equal(egfrCkdEpi2021(salah, 45, false).ok, false, `kreatinin ${String(salah)}`)
  assert.equal(egfrCkdEpi2021(1, salah, false).ok, false, `usia ${String(salah)}`)
}
// Bila keduanya salah, kreatinin dilaporkan lebih dulu (urutan pemeriksaan yang terdokumentasi).
assert.equal(egfrCkdEpi2021(-1, 5, false).ok === false && (egfrCkdEpi2021(-1, 5, false) as { alasan: string }).alasan, GALAT_KREATININ)

// Regresi halaman kalkulator: rumus lama yang disalin mentah menghasilkan Infinity untuk kolom kosong (+'' = 0) dan NaN untuk
// kreatinin negatif, lalu rantai ">=" memberi NaN stadium G5 dan Infinity stadium G1. Kontrol positif bahwa jebakan itu nyata:
const rumusLama = (scr: number, usia: number) =>
  142 * Math.min(scr / 0.9, 1) ** -0.302 * Math.max(scr / 0.9, 1) ** -1.2 * 0.9938 ** usia
const stadiumLama = (v: number) => (v >= 90 ? 'G1' : v >= 60 ? 'G2' : v >= 45 ? 'G3a' : v >= 30 ? 'G3b' : v >= 15 ? 'G4' : 'G5')
assert.equal(rumusLama(+'', 45), Infinity)
assert.equal(stadiumLama(rumusLama(+'', 45)), 'G1')
assert.ok(Number.isNaN(rumusLama(-1, 45)))
assert.equal(stadiumLama(rumusLama(-1, 45)), 'G5')
// Kini keduanya ditolak, dan tidak ada angka atau stadium yang dikembalikan.
for (const scr of [+'', 0, -1]) {
  const r = egfrCkdEpi2021(scr, 45, false)
  assert.equal(r.ok, false)
  assert.equal('data' in r, false)
}

// Klasifikasi stadium KDIGO tepat pada batas; di luar domain gagal-tertutup.
for (const [nilai, stadium] of [
  [1000, 'G1'], [90, 'G1'], [89.99, 'G2'], [60, 'G2'], [59.99, 'G3a'], [45, 'G3a'], [44.99, 'G3b'],
  [30, 'G3b'], [29.99, 'G4'], [15, 'G4'], [14.99, 'G5'], [0, 'G5'], [-0, 'G5'],
] as const) assert.equal(kdigoGfrStage(nilai), stadium, `eGFR ${nilai}`)
for (const buruk of [Number.NaN, Infinity, -Infinity, -0.01, -1, undefined, null, '60'] as unknown as number[]) {
  assert.throws(() => kdigoGfrStage(buruk), RangeError, `eGFR ${String(buruk)} tidak boleh dipetakan ke stadium`)
}

// Stadium dihitung dari nilai TAK dibulatkan. Tiga kasus nyata: nilai terbulat 60.0 tetapi sebenarnya di bawah 60, jadi G3a.
for (const k of [
  { scr: 1.63, usia: 24, perempuan: false },
  { scr: 1.3, usia: 21, perempuan: true },
  { scr: 1.28, usia: 24, perempuan: true },
]) {
  const takDibulatkan = rujukan(k.scr, k.usia, k.perempuan)
  assert.ok(takDibulatkan >= 59.95 && takDibulatkan < 60, `kasus ${JSON.stringify(k)} harus berada di jebakan pembulatan`)
  const r = egfrCkdEpi2021(k.scr, k.usia, k.perempuan)
  assert.ok(r.ok)
  if (!r.ok) continue
  assert.equal(r.data.nilai, 60, 'nilai tampil dibulatkan 1 desimal')
  assert.equal(r.data.stadium, 'G3a', 'stadium harus dari nilai tak dibulatkan')
  assert.equal(kdigoGfrStage(r.data.nilai), 'G2', 'memetakan nilai terbulat akan salah: inilah mengapa stadium dihitung sebelum pembulatan')
}

// Satu sumber: koefisien 0.9938 hanya boleh ada di lib/longevity.ts, dan halaman kalkulator memakai fungsi kanonik.
const penyalin: string[] = []
for (const rel of readdirSync('src', { recursive: true }) as string[]) {
  if (!/\.tsx?$/.test(rel)) continue
  const path = join('src', rel)
  if (path === join('src', 'lib', 'longevity.ts')) continue
  const isi = readFileSync(path, 'utf8')
  // Konteks CKD-EPI (142 dan 0.9938 bersama) agar data bangkitan yang kebetulan memuat angka itu tidak salah terdeteksi.
  if (/(?<![\w.])0\.9938(?![\d])/.test(isi) && /(?<![\w.])142(?![\d.])/.test(isi)) penyalin.push(path)
}
assert.deepEqual(penyalin, [], `rumus CKD-EPI 2021 harus dipakai dari lib/longevity.ts, bukan disalin:\n  ${penyalin.join('\n  ')}`)
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /import \{ egfrCkdEpi2021[^}]*\} from '\.\.\/\.\.\/lib\/longevity'/, 'halaman harus memakai egfrCkdEpi2021')
assert.match(halaman, /egfrCkdEpi2021\(scr, age, sex === 'F'\)/)
assert.match(halaman, /egfr\.ok \?/, 'halaman harus bercabang pada hasil tervalidasi')
assert.match(halaman, /\{egfr\.alasan\}/, 'masukan tidak valid harus menampilkan alasannya')
assert.doesNotMatch(halaman, /\{result\.toFixed/, 'halaman tidak boleh menampilkan angka mentah tanpa validasi')

console.log('egfr-ckd-epi-2021: independent reference values, fail-closed input ranges, KDIGO stage from the unrounded value, single-source formula')
