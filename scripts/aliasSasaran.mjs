// Baris padanan yang SASARANNYA TIDAK ADA.
//
// MENGAPA SKRIP INI ADA. osceStationNoteAliases.ts memetakan nama kasus di
// rekap ujian ke kunci catatan. Bila kunci sasarannya salah ketik atau catatan
// itu kemudian diganti namanya, padanannya diam-diam berhenti bekerja: kartu
// kasusnya kembali tampil tanpa tombol "Catatan", persis seperti sebelum
// padanan itu ditulis. Tidak ada yang gagal, tidak ada yang merah, dan
// pekerjaan yang sudah selesai hilang tanpa jejak.
//
// Ini bentuk kegagalan yang sudah berulang di aplikasi ini: catatan yang ADA
// dan LENGKAP tetapi TIDAK TERJANGKAU. Tabel padanan justru menambah satu cara
// baru untuk mengalaminya, jadi ia perlu penjaganya sendiri.
//
// Dijalankan: node scripts/aliasSasaran.mjs
import { readFileSync } from 'node:fs'

const alias = readFileSync('src/lib/osceStationNoteAliases.ts', 'utf8')

/*
 * DUA RAK CATATAN, BUKAN SATU.
 *
 * Skrip ini semula hanya membaca osceStationNotes.ts, sebab catatanStasiun()
 * memang hanya melihat rak itu. Lalu 19 padanan sekaligus dilaporkan rusak —
 * Bells' palsy, Goiter, Hipertiroid, Osteomielitis, Lipoma, Kandidiasis mulut,
 * Sifilis, Varisela — dan semuanya ternyata ADA dan LENGKAP, hanya di rak yang
 * lain: skdiDiseaseNotes.ts. Yang salah bukan padanannya, melainkan fungsinya,
 * yang tidak pernah melihat ke sana.
 *
 * Sesudah catatanStasiun() diberi cadangan ke catatan SKDI, penjaganya harus
 * membaca kedua rak itu juga — kalau tidak, ia akan melaporkan rusak untuk
 * padanan yang di layar bekerja dengan baik, dan laporan yang mengada-adakan
 * kerusakan sama berbahayanya dengan yang menyembunyikannya.
 */
const ambilKunci = (berkas) =>
  [...readFileSync(berkas, 'utf8').matchAll(/^  '((?:[^'\\]|\\.)*)':\s*\{$/gm)].map((m) => m[1].replace(/\\'/g, "'"))

const kunciOsce = ambilKunci('src/lib/osceStationNotes.ts')
const kunciSkdi = ambilKunci('src/lib/skdiDiseaseNotes.ts')
const kunci = new Set([...kunciOsce, ...kunciSkdi])

// Hanya isi objek ALIAS yang dibaca, bukan seluruh berkas.
const badan = alias.slice(alias.indexOf('const ALIAS'), alias.indexOf('\n}', alias.indexOf('const ALIAS')))
/*
 * KUNCI BERKUTIP GANDA IKUT DIBACA.
 *
 * Pola semula hanya mengenali kunci berkutip TUNGGAL dan kunci telanjang.
 * Padahal kunci yang isinya mengandung apostrof ditulis dengan kutip GANDA —
 * "Bell's palsy", "Grave's disease". Akibatnya skrip melaporkan keduanya
 * "belum ada catatannya", padahal di layar tombol catatannya muncul dan
 * isinya benar. Bell's palsy keluar DELAPAN KALI dalam sepuluh tahun, dan
 * selama itu ia berdiri di puncak daftar pekerjaan yang sebenarnya sudah
 * selesai.
 *
 * Ini kesalahan alat ukur, bukan kesalahan aplikasi — bentuk yang paling
 * mahal, sebab ia mengarahkan pekerjaan ke tempat yang keliru.
 */
const baris = [
  ...badan.matchAll(/^\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|([A-Za-z][A-Za-z0-9_]*)):\s*'((?:[^'\\]|\\.)*)',/gm),
].map((m) => ({ dari: (m[1] ?? m[2] ?? m[3]).replace(/\\'/g, "'"), ke: m[4].replace(/\\'/g, "'") }))

const rusak = baris.filter((b) => !kunci.has(b.ke))
// Padanan yang menunjuk dirinya sendiri tidak salah, tetapi tidak berguna.
const percuma = baris.filter((b) => b.dari === b.ke)

console.log(`Catatan stasiun OSCE     : ${kunciOsce.length}`)
console.log(`Catatan penyakit SKDI    : ${kunciSkdi.length}`)
console.log(`Baris padanan            : ${baris.length}`)
console.log(`  sasarannya TIDAK ADA   : ${rusak.length}`)
console.log(`  menunjuk dirinya sendiri: ${percuma.length}`)

if (rusak.length) {
  console.log('\n── sasaran yang tidak ada ──')
  for (const r of rusak) console.log(`   '${r.dari}'  ->  '${r.ke}'`)
  console.log('\nTiap baris di atas berarti padanannya diam-diam tidak bekerja:')
  console.log('kartu kasusnya tampil tanpa tombol "Catatan", seolah belum ditulis.')
  process.exitCode = 1
}
if (percuma.length) {
  console.log('\n── menunjuk dirinya sendiri (tidak perlu) ──')
  for (const p of percuma) console.log(`   '${p.dari}'`)
}
if (!rusak.length && !percuma.length) console.log('\nseluruh padanan menunjuk catatan yang ada')
