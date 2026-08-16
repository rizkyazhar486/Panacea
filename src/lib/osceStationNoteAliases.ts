import { OSCE_STATION_NOTES } from './osceStationNotes'

// ─────────────────────────────────────────────────────────────────────────────
// Nama kasus di REKAP UJIAN berbanding nama kunci CATATAN.
//
// CACAT YANG DITEMUKAN. Halaman Case Bank mencari catatan dengan
// OSCE_STATION_NOTES[c.name] — pencocokan persis, tanpa cadangan. Selama nama
// di rekap ujian sama persis dengan kunci catatannya, itu cukup. Tetapi rekap
// ujian ditulis oleh banyak orang selama sepuluh tahun, dan ejaannya
// bermacam-macam: "Omphalitis" berbanding "Omfalitis", "V- Fib (RJP)"
// berbanding "Fibrilasi Ventrikel".
//
// Akibatnya catatan yang sudah ditulis lengkap TIDAK PERNAH MUNCUL di layar.
// Ia ada di dalam berkas, terhitung lengkap oleh skrip pemeriksa, dan tetap
// tidak dapat dibaca siapa pun — bentuk kegagalan yang paling merugikan, sebab
// tidak ada satu pun angka yang menunjukkannya.
//
// MENGAPA TABEL, BUKAN PENCOCOKAN LONGGAR. Pencocokan longgar di layar akan
// menampilkan catatan yang KELIRU pada kasus yang mirip namanya, dan pembaca
// tidak punya cara mengetahuinya. Itu sudah terjadi pada skrip prioritas —
// "Transient Ischemic Attack" tercocokkan ke "Transient tics disorder" hanya
// karena berbagi kata. Di layar, kekeliruan semacam itu berarti seseorang
// belajar penyakit yang salah. Tabel ini kecil dan setiap barisnya dapat
// diperiksa dengan mata.
// ─────────────────────────────────────────────────────────────────────────────

const ALIAS: Record<string, string> = {
  Omphalitis: 'Omfalitis',
  'V- Fib (RJP)': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  'V-Fib (RJP)': 'Fibrilasi Ventrikel — RJP & defibrilasi',
  'VF (RJP)': 'Fibrilasi Ventrikel — RJP & defibrilasi',
}

/**
 * Catatan untuk sebuah nama kasus, lewat nama aslinya lebih dahulu lalu
 * lewat tabel padanan. Mengembalikan undefined bila memang belum ada — dan
 * itu benar; kartu kasusnya lalu tampil tanpa tombol "Catatan", bukan tampil
 * dengan catatan penyakit lain.
 */
export function catatanStasiun(nama: string) {
  return OSCE_STATION_NOTES[nama] ?? OSCE_STATION_NOTES[ALIAS[nama] ?? '']
}

export default catatanStasiun
