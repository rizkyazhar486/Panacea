// Cakupan kasus yang muncul HANYA SEKALI dalam sepuluh tahun rekap OSCE.
//
// MENGAPA DIPISAH DARI prioritasCatatan.mjs. Skrip itu sengaja hanya menghitung
// kasus yang muncul dua kali atau lebih, sebab urutan pengerjaan menjelang
// ujian ditentukan oleh seberapa sering sebuah kasus keluar. Yang muncul sekali
// berjumlah 773 — empat kali lipat dari yang berulang — dan memasukkannya ke
// daftar yang sama akan menenggelamkan pekerjaan yang paling menentukan.
//
// TETAPI JUMLAH ITU MENYESATKAN BILA TIDAK DIUKUR. Sebagian besar kasus yang
// muncul sekali BUKAN penyakit langka melainkan penyakit lazim yang kebetulan
// hanya sekali diujikan, dan catatannya sudah ada lewat daftar SKDI. Menyebut
// "773 belum dikerjakan" tanpa memeriksa akan melaporkan pekerjaan yang
// sebagian besarnya sudah selesai — kekeliruan yang sudah berkali-kali terjadi
// pada skrip-skrip di sini, dan yang paling mahal akibatnya.
//
// Dijalankan: node scripts/kasusSekali.mjs [jumlah]

import { FIELD, ALIAS_GANDA, petaNorm, terisi, bukanKasus, norm, kunciCatatan, semuaKasus } from './lib/catatanRekap.mjs'

const kasus = semuaKasus()

const sekali = kasus.filter((k) => k.jumlah === 1)
let adaLengkap = 0, adaSebagian = 0, tidakAda = 0
const belum = []
let dibuang = 0
for (const k of sekali) {
  if (bukanKasus(k.label)) { dibuang++; continue }
  // Urutannya sama persis dengan yang dipakai layar; lihat kunciCatatan().
  const kunci = kunciCatatan(k.label, k.kunci)
  if (!kunci) { tidakAda++; belum.push({ ...k, isi: 0, kunci: '(tidak ketemu)' }); continue }
  /*
   * Baris yang memuat DUA stasiun dinilai dari catatan yang PALING TIDAK
   * lengkap di antara keduanya — sebab yang dibaca pemakai adalah keduanya,
   * dan satu yang kurang tetap berarti pekerjaannya belum selesai.
   */
  const isi = kunci.startsWith('GANDA::')
    ? Math.min(...ALIAS_GANDA.get(kunci.slice(7)).map((k) => terisi('OSCE::' + k) || terisi(k)))
    : terisi(kunci)
  if (isi >= 8) adaLengkap++
  else { adaSebagian++; belum.push({ ...k, isi, kunci }) }
}

console.log(`Baris muncul sekali            : ${sekali.length}`)
console.log(`  bukan kasus (dibuang)        : ${dibuang}`)
console.log(`Kasus sesungguhnya             : ${sekali.length - dibuang}`)
console.log(`  catatannya sudah lengkap 8/8 : ${adaLengkap}`)
console.log(`  ada tetapi belum lengkap     : ${adaSebagian}`)
console.log(`  belum ada catatannya         : ${tidakAda}`)

/*
 * PERKIRAAN KASAR, DIPISAH DAN DIBERI LABEL — bukan dijadikan angka resmi.
 *
 * Sebagian besar yang "tidak ketemu" bukan penyakit baru melainkan cara
 * menulis yang berbeda: bahasa Inggris ('Acute Lung Oedem' berbanding 'Edema
 * paru'), atau gabungan diagnosis dengan penyebabnya ('ADHF e.c Cor Pulmonal
 * Kronik'). Pencocokan longgar dapat menaksirnya, TETAPI TIDAK BOLEH dipakai
 * untuk menyatakan sebuah catatan sudah ada: pencocokan longgar pernah
 * menautkan 'Transient Ischemic Attack' ke 'Transient tics disorder' di skrip
 * sebelah, dan kekeliruan semacam itu membuat orang belajar penyakit yang
 * salah. Karena itu angkanya dilaporkan TERPISAH sebagai perkiraan yang masih
 * harus diperiksa tangan, bukan sebagai pekerjaan yang sudah selesai.
 */
const kataUmum = new Set(['akut', 'kronik', 'kronis', 'dengan', 'tanpa', 'pada', 'anak', 'dewasa', 'berat', 'ringan', 'sedang', 'baca', 'tindakan'])
let mungkinAda = 0
for (const b of belum) {
  if (b.kunci !== '(tidak ketemu)') continue
  const kata = norm(b.label).split(' ').filter((w) => w.length > 4 && !kataUmum.has(w))
  if (kata.some((w) => [...petaNorm.keys()].some((kn) => kn.includes(w)))) mungkinAda++
}
console.log(`\n(perkiraan: ${mungkinAda} dari ${tidakAda} yang "tidak ketemu" memuat kata yang muncul`)
console.log(` pada kunci catatan yang sudah ada — kemungkinan hanya beda cara menulis,`)
console.log(` tetapi HARUS diperiksa satu per satu sebelum disebut sudah ada)`)

const batas = Number(process.argv[2] ?? 30)
console.log(`\n── ${Math.min(batas, belum.length)} teratas yang belum lengkap ──`)
for (const b of belum.slice(0, batas)) {
  console.log(`  ${String(b.isi)}/8  ${b.label.slice(0, 44).padEnd(46)} ${b.kunci.slice(0, 40)}`)
}
