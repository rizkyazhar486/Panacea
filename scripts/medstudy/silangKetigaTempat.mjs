// ─────────────────────────────────────────────────────────────────────────────
// Periksa silang tiga tempat.
//
// MENGAPA BERKAS INI ADA. Skrip kelengkapan hanya membaca satu berkas, dan
// karena itu ia melaporkan sebuah kasus "selesai 8/8" padahal orang yang
// membuka aplikasi tidak menemukannya. Angina pektoris stabil adalah contohnya:
// catatan stasiunnya lengkap, tetapi halaman tatalaksana sama sekali tidak
// punya entrinya — satu-satunya yang ada adalah "Angina Prinzmetal: CCB (untuk
// kontrol)", empat kata tanpa satu pun dosis — dan direktori penyakit hanya
// punya "Angina Ludwig", penyakit yang sama sekali berbeda.
//
// Yang diperiksa di sini bukan kelengkapan medan, melainkan KETERSEDIAAN di
// ketiga tempat orang benar-benar mencari: catatan stasiun OSCE, halaman
// tatalaksana, dan direktori penyakit (termasuk lewat nama aliasnya).
//
// Jalankan setiap kali selesai mengisi catatan, SEBELUM melaporkannya selesai.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'fs'

const stasiun = readFileSync('src/lib/osceStationNotes.ts','utf8')
const terapi  = readFileSync('src/lib/skdiTherapyReference.ts','utf8')
const catatan = readFileSync('src/lib/skdiDiseaseNotes.ts','utf8')
const alias   = readFileSync('src/lib/skdiDiseaseNoteAliases.ts','utf8')
/*
 * Tabel padanan nama stasiun ikut dibaca. Tanpa ini, skrip melaporkan
 * 'Ankle Sprain / Knee Sprain' TIDAK ADA hanya karena kunci catatannya
 * diperluas menjadi '... / Wrist Sprain', padahal aplikasinya sendiri sudah
 * menemukannya lewat padanan. Alat ukur yang tidak mengikuti perubahan pada
 * yang diukurnya akan melaporkan kerusakan yang tidak ada — dan laporan palsu
 * itu memakan waktu yang sama dengan kerusakan sungguhan.
 */
const aliasStasiun = readFileSync('src/lib/osceStationNoteAliases.ts','utf8')

const SELESAI = [
 ['PPOK Eksaserbasi Akut','PPOK'], ['Cluster Headache','cluster'],
 ['Gangguan Cemas Menyeluruh (GAD)','cemas menyeluruh'], ['Parkinson Disease','Parkinson'],
 ['Tarsal Tunnel Syndrome','tarsal'], ['Ankle Sprain / Knee Sprain','sprain'],
 ['Gangguan Somatisasi / Hipokondriasis','somatisasi'], ['Insect Bite / Fixed Drug Eruption','insect bite'],
 ['Gangguan Panik','panik'], ['Meniere Disease','meniere'], ['Prostatitis','prostatitis'],
 ['Corpus Alienum (mata/hidung/telinga) — tindakan ekstraksi','corpus alienum'],
 ['Angina Pektoris Stabil','angina pektoris'], ['Bronkiektasis','bronkiektasis'],
 ['Retensio Urin e.c. BPH / Vesikolitiasis — pasang kateter','retensi urin'],
]
const punya = (teks, kata) => teks.toLowerCase().includes(kata.toLowerCase())
let kurang = 0
console.log('kasus'.padEnd(46), 'stasiun terapi catatan')
for (const [kunci, cari] of SELESAI) {
  const a = stasiun.includes(`  '${kunci}': {`) || aliasStasiun.includes(`'${kunci}':`)
  const b = punya(terapi, cari)
  const c = punya(catatan, cari) || punya(alias, cari)
  if (!(a && b && c)) kurang++
  console.log(kunci.slice(0,45).padEnd(46), (a?'ada':'-- ').padEnd(8), (b?'ada':'-- ').padEnd(6), c?'ada':'--')
}
console.log(kurang ? `\n${kurang} kasus belum ada di salah satu tempat` : '\nsemua ada di ketiganya')
