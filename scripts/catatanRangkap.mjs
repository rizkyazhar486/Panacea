// Mencari CATATAN RANGKAP — dua entri berbeda untuk penyakit yang sama.
//
// MENGAPA ADA. Sebuah entri 'Fixed Drug Eruption (FDE)' ditulis lengkap dari
// nol — 8.348 karakter — padahal penyakit itu SUDAH tertulis lengkap di dalam
// entri 'Insect Bite / Fixed Drug Eruption'. Yang menuntun ke sana adalah
// laporan daftar kerja "FDE (tidak ketemu) 0/8": pencariannya memakai
// singkatan, sedangkan kuncinya memuat nama panjang, sehingga entri yang ada
// tidak terlihat.
//
// Rangkap lebih buruk daripada sekadar pekerjaan terbuang. Dua entri untuk satu
// penyakit pasti BERSELISIH setelah beberapa kali disunting, dan pembacanya
// tidak punya cara mengetahui mana yang berlaku — pada catatan yang memuat
// dosis obat, itu berbahaya.
//
// HANYA RANGKAP DALAM SATU BERKAS YANG DILAPORKAN SEBAGAI CACAT. Sebuah
// penyakit memang SENGAJA punya dua catatan pada dua berkas berbeda: catatan
// stasiun OSCE (mendalam, untuk ujian) dan catatan penyakit SKDI (ringkas,
// untuk direktori), yang dihubungkan tabel alias. Melaporkan keduanya sebagai
// rangkap menghasilkan 28 baris peringatan yang seluruhnya benar tetapi tidak
// satu pun perlu dikerjakan — dan daftar peringatan yang isinya bukan pekerjaan
// akan berhenti dibaca, yang sama saja dengan tidak ada penjaganya.
//
// CARA KERJANYA. Kunci catatan kerap memuat beberapa nama sekaligus yang
// dipisah garis miring ('Insect Bite / Fixed Drug Eruption'). Skrip memecahnya,
// lalu memeriksa apakah salah satu pecahan itu muncul sebagai kunci tersendiri
// di tempat lain. Sengaja TIDAK memakai pencocokan longgar: yang dicari adalah
// nama yang benar-benar sama, bukan yang mirip.
//
// Dijalankan: node scripts/catatanRangkap.mjs
import { readFileSync } from 'node:fs'

const BERKAS = ['src/lib/osceStationNotes.ts', 'src/lib/skdiDiseaseNotes.ts']
const norm = (t) =>
  t.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim()

/** Kata yang terlalu umum untuk menandakan penyakit yang sama. */
const UMUM = new Set([
  'akut', 'kronik', 'anak', 'dewasa', 'ekg', 'baca', 'tindakan', 'dan', 'atau',
  'test', 'normal', 'primer', 'sekunder', 'interpretasi', 'pasang', 'resusitasi',
  'cairan', 'infus', 'defibrilasi', 'rjp', 'ngt', 'sprain', 'eruption',
])

const kunci = []
for (const b of BERKAS) {
  const teks = readFileSync(b, 'utf8')
  for (const m of teks.matchAll(/^  '((?:[^'\\]|\\.)*)':\s*\{$/gm)) {
    kunci.push({ berkas: b, nama: m[1].replace(/\\'/g, "'") })
  }
}

// Peta nama tunggal -> kunci penuh yang memuatnya.
const peta = new Map()
for (const k of kunci) {
  for (const potong of k.nama.split('/')) {
    const n = norm(potong)
    if (!n || n.split(' ').every((w) => UMUM.has(w))) continue
    if (!peta.has(n)) peta.set(n, [])
    peta.get(n).push(k)
  }
}

let rangkap = 0
let lintasBerkas = 0
for (const [nama, daftar] of peta) {
  if (daftar.length < 2) continue
  // Kunci yang sama persis muncul dua kali di berkas berbeda juga dilaporkan.
  const unik = [...new Set(daftar.map((d) => d.nama))]
  if (unik.length < 2) continue
  // Dua berkas berbeda = memang begitu rancangannya, bukan cacat.
  const perBerkas = new Map()
  for (const d of daftar) {
    if (!perBerkas.has(d.berkas)) perBerkas.set(d.berkas, new Set())
    perBerkas.get(d.berkas).add(d.nama)
  }
  const bermasalah = [...perBerkas.entries()].filter(([, n]) => n.size > 1)
  if (!bermasalah.length) { lintasBerkas++; continue }
  rangkap++
  console.log(`\nRANGKAP: "${nama}" tertulis pada lebih dari satu entri DALAM BERKAS YANG SAMA`)
  for (const [berkas, nama2] of bermasalah)
    for (const x of nama2) console.log(`   ${berkas.replace('src/lib/', '')} :: ${x}`)
}

console.log(
  rangkap
    ? `\n${rangkap} kemungkinan catatan RANGKAP di dalam satu berkas — periksa satu per satu`
    : '\ntidak ada catatan rangkap di dalam satu berkas',
)
console.log(`(${lintasBerkas} nama punya catatan di dua berkas — itu memang rancangannya, bukan cacat)`)
