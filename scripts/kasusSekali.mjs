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
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const FIELD = ['definisi', 'etiologi', 'patofisiologi', 'anamnesis', 'pemeriksaanFisik', 'penunjang', 'diagnosisBanding', 'tatalaksana']
const SETARA = { patofisiologi: ['patofisiologi', 'rantai'] }

function blokDari(teks, awalan = '') {
  const out = {}
  const idx = []
  const re = /^  '((?:[^'\\]|\\.)*)':\s*\{$/gm
  let m
  while ((m = re.exec(teks))) idx.push({ key: m[1], start: m.index })
  idx.forEach((x, i) => { out[awalan + x.key] = teks.slice(x.start, i + 1 < idx.length ? idx[i + 1].start : teks.length) })
  return out
}

const notes = readFileSync('src/lib/skdiDiseaseNotes.ts', 'utf8')
const osce = readFileSync('src/lib/osceStationNotes.ts', 'utf8')
const blok = { ...blokDari(notes), ...blokDari(osce, 'OSCE::') }

/*
 * PENYERAGAMAN EJAAN, karena rekap ujian ditulis banyak orang selama sepuluh
 * tahun. Tanpa ini, 'Abses Peritonsilar' dan 'Abses Peritonsiler' dilaporkan
 * belum ada catatannya padahal 'Abses Peritonsil' sudah lengkap 8/8 — dan
 * angka 'belum dikerjakan' menjadi berlipat tanpa satu pun pekerjaan nyata di
 * belakangnya. Hanya perbedaan EJAAN yang diseragamkan, bukan makna.
 */
const EJAAN = [
  [/\b(\w+)(sil[ae]r|siler)\b/g, '$1sil'],   // peritonsilar/peritonsiler -> peritonsil
  [/\bpulmo\w*\b/g, 'paru'],
  [/\bdextra\b|\bsinistra\b|\bbilateral\b/g, ''],
  [/\bec\b|\be c\b|\brme\b|\bsuspek\b|\bsusp\b|\bdd\b/g, ''],
  [/\bamobeasis\b|\bamoebiasis\b|\bamebiasis\b/g, 'amoeba'],
  [/\bkomplis\b|\bkomplit\b|\bkompletus\b/g, 'komplit'],
  [/\bsy\b/g, 'sindrom'],
  [/\bc\b/g, ''],
]
const norm = (s) => {
  let t = s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
  for (const [re, ganti] of EJAAN) t = t.replace(re, ganti)
  return t.replace(/\s+/g, ' ').trim()
}

/*
 * BARIS YANG BUKAN KASUS ikut terbawa dari rekap: angka sisa penguraian
 * ('0.0', '6.0') dan catatan periode ('2020 - Februari 2022 Ga ada OSCE').
 * Menghitungnya sebagai pekerjaan berarti mengarang pekerjaan yang tidak ada.
 */
const bukanKasus = (label) =>
  /^[\d.,\s]+$/.test(label) ||
  /ga ada osce|tidak ada osce|covid-19\)$/i.test(label) ||
  label.trim().length < 4
const petaNorm = new Map()
for (const k of Object.keys(blok)) {
  const n = norm(k.replace(/^OSCE::/, ''))
  if (!petaNorm.has(n)) petaNorm.set(n, k)
}

const terisi = (kunci) => {
  const b = blok[kunci]
  if (!b) return 0
  return FIELD.filter((f) => (SETARA[f] ?? [f]).some((nama) => new RegExp('^\\s{4}' + nama + ':', 'm').test(b))).length
}

/** Pencocokan KETAT: nama persis, atau seluruh kata bermakna termuat. */
function cari(nama) {
  const n = norm(nama)
  if (petaNorm.has(n)) return petaNorm.get(n)
  const kata = n.split(' ').filter((w) => w.length > 3)
  if (!kata.length) return null
  for (const [kn, kunci] of petaNorm) {
    if (!kata.every((w) => kn.includes(w))) continue
    if (kata.length === 1 && !(kn === kata[0] || kn.startsWith(kata[0] + ' '))) continue
    return kunci
  }
  return null
}

const kasus = JSON.parse(
  execFileSync('npx', ['tsx', '-e', `
    import { hitungKasus } from './src/lib/analisisOsce'
    console.log(JSON.stringify(hitungKasus().map((k) => ({ label: k.label, kunci: k.kunci, sistem: k.sistem, jumlah: k.jumlah }))))
  `], { encoding: 'utf8', maxBuffer: 64e6 }).trim(),
)

const sekali = kasus.filter((k) => k.jumlah === 1)
let adaLengkap = 0, adaSebagian = 0, tidakAda = 0
const belum = []
let dibuang = 0
for (const k of sekali) {
  if (bukanKasus(k.label)) { dibuang++; continue }
  const kunci = cari(k.kunci) ?? cari(k.label)
  if (!kunci) { tidakAda++; belum.push({ ...k, isi: 0, kunci: '(tidak ketemu)' }); continue }
  const isi = terisi(kunci)
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
