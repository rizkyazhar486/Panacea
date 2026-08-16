// Daftar kerja TATALAKSANA YANG MENYEBUT OBAT TANPA MENYEBUT DOSIS.
//
// MENGAPA INI DIHITUNG TERSENDIRI. Bagi yang sedang menghafal untuk ujian,
// "NSAID" dan "Natrium diklofenak 50 mg tiap 8 jam" bukan dua tingkat
// kelengkapan melainkan dua hal berbeda: yang pertama tidak dapat dituliskan
// pada resep dan tidak dapat dijawab ketika penguji bertanya berapa. Entri yang
// menyebut nama obat tanpa dosis terbaca seolah sudah lengkap, sehingga
// kekurangannya tidak pernah muncul pada hitungan mana pun.
//
// CARA MENILAINYA, DAN BATASNYA. Yang diperiksa hanya ADA TIDAKNYA ANGKA di
// dalam kalimat terapinya. Itu ukuran kasar dan sengaja dibiarkan kasar:
// ukuran yang mencoba menilai apakah dosisnya BENAR akan menuntut pengetahuan
// obat di dalam skrip, dan skrip yang berpura-pura tahu kedokteran lebih
// berbahaya daripada skrip yang hanya menghitung.
//
// Sebagian entri memang TIDAK PANTAS berdosis — tindakan bedah, rujukan,
// konseling, dan fisioterapi. Itu disaring lewat daftar kata di bawah supaya
// daftar kerjanya berisi pekerjaan yang benar-benar ada.
//
// Dijalankan: node scripts/dosisKurang.mjs [jumlah]
import { readFileSync } from 'node:fs'

const teks = readFileSync('src/lib/skdiTherapyReference.ts', 'utf8')

/** Entri yang memang tidak berdosis karena bukan obat. */
const BUKAN_OBAT = [
  'rujuk', 'bedah', 'operasi', 'operatif', 'eksisi', 'insisi', 'drainase',
  'ekstraksi', 'debridemen', 'amputasi', 'transplantasi', 'arthroplasty',
  'artroplasti', 'fisioterapi', 'rehabilitasi', 'konseling', 'edukasi',
  'psikoterapi', 'observasi', 'suportif', 'diet', 'imobilisasi', 'bidai',
  'gips', 'kompres', 'irigasi', 'kateter', 'dialisis', 'cuci darah',
  'fototerapi', 'laser', 'krioterapi', 'radioterapi', 'kemoterapi',
  'transfusi', 'ventilasi', 'oksigen', 'resusitasi', 'defibrilasi',
  'reposisi', 'traksi', 'pungsi', 'biopsi', 'sirkumsisi', 'tampon',
  // Ditambahkan setelah memeriksa sisa daftar satu per satu: seluruhnya
  // tindakan, alat, atau ALUR PEMERIKSAAN — bukan obat, sehingga menuntut
  // dosis padanya hanya membuat daftar kerja memuat pekerjaan yang tidak ada.
  'pacemaker', 'stent', 'stocking', 'skleroterapi', 'hearing aid', 'alat bantu',
  'epilasi', 'graft', 'vitrektomi', 'eviserasi', 'enukleasi', 'pengangkatan',
  'lensa sferis', 'lensa silinder', 'helperr', 'uji kehamilan',
  'infeksi meluas', 'infeksi/inflamasi',
]

const entri = []
const re = /^\s*\{\s*system:\s*'([^']*)',\s*diagnosis:\s*'((?:[^'\\]|\\.)*)'[\s\S]*?therapy:\s*'((?:[^'\\]|\\.)*)'/gm
let m
while ((m = re.exec(teks))) {
  entri.push({ sistem: m[1], diagnosis: m[2].replace(/\\'/g, "'"), terapi: m[3].replace(/\\'/g, "'") })
}

const perluDosis = (t) => {
  if (/\d/.test(t)) return false
  const rendah = t.toLowerCase()
  return !BUKAN_OBAT.some((k) => rendah.includes(k))
}

const kurang = entri.filter((e) => perluDosis(e.terapi))
const perSistem = new Map()
for (const e of kurang) perSistem.set(e.sistem, (perSistem.get(e.sistem) ?? 0) + 1)

console.log(`Entri tatalaksana seluruhnya : ${entri.length}`)
console.log(`Menyebut obat TANPA dosis    : ${kurang.length}`)
console.log(`Sudah berdosis atau bukan obat: ${entri.length - kurang.length}`)

console.log('\n── per sistem ──')
for (const [s, n] of [...perSistem.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}  ${s}`)
}

const batas = Number(process.argv[2] ?? 40)
console.log(`\n── ${Math.min(batas, kurang.length)} teratas yang perlu dosis ──`)
for (const e of kurang.slice(0, batas)) {
  console.log(`  ${e.diagnosis.slice(0, 40).padEnd(42)} ${e.terapi.slice(0, 60)}`)
}
