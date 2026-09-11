import assert from 'node:assert/strict'
import {
  TETAPAN, TELOMERASE, GARPU_PER_ORIGIN,
  mulaiReplikasi, langkahReplikasi, lamaFaseSDetik, anggaranGalat,
  mulaiTelomer, langkahPembelahan, atrisiBersihBp, sisaPembelahan, batasHayflick,
} from '../../src/lib/replikasiDna.ts'

// Mesin ini menjelaskan mekanisme, jadi yang diuji bukan "apakah kodenya
// berjalan" melainkan "apakah angkanya jatuh di tempat yang sama dengan
// biologi yang sudah diukur orang". Kalau sebuah tetapan diubah sampai
// keluarannya tidak masuk akal lagi, uji ini harus gagal.

// ── 1. Lama fase S harus jatuh sendiri di kisaran yang teramati ─────────────
//
// Tidak ditulis sebagai angka hafalan: ia diturunkan dari laju garpu, jumlah
// origin, dan ukuran genom. Fase S somatik manusia berkisar 6-10 jam.
const jam = lamaFaseSDetik() / 3600
assert.ok(jam > 5 && jam < 12, `Lama fase S di luar kisaran teramati: ${jam.toFixed(2)} jam`)

// Satu origin melahirkan DUA garpu. Kalau ini terlewat, perkiraannya meleset
// tepat dua kali lipat.
assert.equal(GARPU_PER_ORIGIN, 2)
assert.ok(Math.abs(lamaFaseSDetik(1000, 1, 10) - 50) < 1e-9,
  '1000 bp / (2 garpu x 10 nt/s) harus 50 detik.')

// ── 2. Untai lambat menempuh jarak yang sama, tetapi terputus-putus ─────────
let r = mulaiReplikasi({ origin: 1, lajuGarpu: 100, panjangOkazaki: 150, bpTarget: 10_000 })
r = langkahReplikasi(r, 3)
assert.equal(r.garpu.majuBp, 300, 'Untai maju disintesis kontinu.')
assert.equal(r.garpu.lambatBp, 300, 'Untai lambat mengikuti garpu yang sama.')
assert.equal(r.garpu.fragmen, 2, '300 nt / 150 nt = 2 fragmen Okazaki selesai.')

// Replikasi berhenti tepat di target, tidak melewatinya.
let penuh = mulaiReplikasi({ origin: 1, lajuGarpu: 100, bpTarget: 1000 })
for (let i = 0; i < 100; i++) penuh = langkahReplikasi(penuh, 1)
assert.equal(penuh.bpSelesai, 1000)
assert.ok(penuh.selesai)
const beku = langkahReplikasi(penuh, 10)
assert.equal(beku.waktuDetik, penuh.waktuDetik, 'Keadaan selesai tidak bergerak lagi.')

// ── 3. Tiga lapis pengamanan, tiga orde besaran ─────────────────────────────
//
// Inilah alasan replikasi genom 3.1 Gb tetap bisa diandalkan: bukan satu
// mekanisme yang sempurna, melainkan tiga yang masing-masing tidak sempurna.
const g = anggaranGalat()
assert.ok(g.tanpaKoreksi > 10_000, `Tanpa koreksi harus puluhan ribu galat: ${g.tanpaKoreksi}`)
assert.ok(g.setelahProofreading > 100 && g.setelahProofreading < 1000,
  `Setelah proofreading ratusan galat per genom: ${g.setelahProofreading}`)
assert.ok(g.setelahMMR < 10, `Setelah MMR hanya beberapa galat per genom: ${g.setelahMMR}`)
assert.ok(g.tanpaKoreksi / g.setelahProofreading >= 50, 'Proofreading harus menyumbang orde besaran.')
assert.ok(g.setelahProofreading / g.setelahMMR >= 50, 'MMR harus menyumbang orde besaran lagi.')

// ── 4. Masalah replikasi ujung dan telomerase ───────────────────────────────
assert.equal(atrisiBersihBp('somatik'), TETAPAN.atrisiPerPembelahan.nilai,
  'Sel somatik dewasa tidak mengompensasi apa pun.')
assert.equal(atrisiBersihBp('germinal'), 0, 'Sel germinal mempertahankan panjang telomer.')
assert.ok(atrisiBersihBp('punca') > 0 && atrisiBersihBp('punca') < atrisiBersihBp('somatik'),
  'Sel punca menua lebih lambat, bukan tidak menua -- ini pembeda yang penting.')

// ── 5. Batas Hayflick harus MUNCUL dari tetapan, bukan ditulis ──────────────
//
// Hayflick melaporkan ~50 pembelahan untuk fibroblas manusia. Kalau tetapan
// atrisi atau ambang senesens digeser sampai angka ini tidak lagi masuk akal,
// uji ini gagal -- dan memang seharusnya begitu.
const batas = batasHayflick()
assert.ok(batas >= 40 && batas <= 60, `Batas Hayflick turunan di luar kisaran yang dilaporkan: ${batas}`)

// Angka biakan dan angka in vivo menjawab pertanyaan berbeda dan tidak boleh
// tertukar: memakai atrisi leukosit in vivo di sini memberi ~85 pembelahan,
// bukan ~50 yang dilaporkan Hayflick.
assert.ok(TETAPAN.atrisiPerPembelahan.nilai > TETAPAN.atrisiInVivoLeukosit.nilai,
  'Fibroblas biakan kehilangan telomer lebih cepat daripada leukosit in vivo.')
assert.ok(batasHayflick(undefined, TETAPAN.atrisiInVivoLeukosit.nilai) > batas,
  'Atrisi in vivo yang lebih lambat memberi cadangan pembelahan lebih panjang.')

// Menjalankan pembelahan satu per satu harus tiba di batas yang sama.
let sel = mulaiTelomer('somatik')
let n = 0
while (!sel.senesen && n < 1000) { sel = langkahPembelahan(sel); n++ }
assert.ok(sel.senesen, 'Sel somatik harus mencapai senesens.')
assert.ok(Math.abs(n - batas) <= 1, `Simulasi (${n}) dan rumus (${batas}) harus sepakat.`)

// Sel yang sudah senesen berhenti; ia tidak "membelah menjadi minus".
const sesudah = langkahPembelahan(sel)
assert.equal(sesudah.pembelahan, sel.pembelahan)
assert.ok(sesudah.panjangBp >= 0)

// ── 6. "Tak terhingga" harus jujur, bukan angka besar diam-diam ────────────
assert.equal(sisaPembelahan(mulaiTelomer('germinal')), null,
  'Telomerase penuh berarti model tidak punya batas -- itu pernyataan tentang model, bukan tentang sel.')
assert.equal(sisaPembelahan(sel), 0, 'Sel senesen tidak punya sisa pembelahan.')
const punca = mulaiTelomer('punca')
const somatik = mulaiTelomer('somatik')
assert.ok((sisaPembelahan(punca) ?? 0) > (sisaPembelahan(somatik) ?? 0),
  'Sel punca punya cadangan pembelahan lebih panjang.')

// ── 7. Ketidakpastian ikut terbawa, tidak hilang ────────────────────────────
//
// Setiap tetapan harus membawa rentang dan asal-usulnya. Angka tunggal tanpa
// rentang membuat keluaran terdengar lebih pasti daripada biologinya.
for (const [nama, t] of Object.entries(TETAPAN)) {
  assert.ok(t.dasar.length > 20, `Tetapan ${nama} harus menjelaskan asalnya.`)
  assert.equal(t.bukti, 'reference-biology',
    `Tetapan ${nama} adalah biologi rujukan, bukan pengukuran pada seseorang.`)
  assert.ok(t.satuan.length > 0, `Tetapan ${nama} harus bersatuan.`)
  const rendah = Math.min(t.min, t.maks)
  const tinggi = Math.max(t.min, t.maks)
  assert.ok(t.nilai >= rendah && t.nilai <= tinggi,
    `Nilai tengah ${nama} (${t.nilai}) harus berada di dalam rentangnya [${rendah}, ${tinggi}].`)
}

assert.ok(TELOMERASE.kanker > TELOMERASE.punca && TELOMERASE.kanker < 1,
  'Sel kanker mengaktifkan kembali telomerase hampir sepenuhnya, tetapi dimodelkan tidak sempurna.')

console.log('Replikasi DNA: lama fase S, fragmen Okazaki, anggaran galat tiga lapis, dan batas Hayflick semuanya turunan dari tetapan yang membawa rentangnya sendiri.')
