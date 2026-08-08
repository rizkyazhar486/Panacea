// Pengingat obat setelah server mati beberapa hari.
//
// Cacat yang diuji: jadwal hanya dimajukan 24 jam tiap detak penjadwal, jadi
// server yang mati lima hari mengirim lima pemberitahuan dalam lima menit saat
// hidup kembali — dan yang diberitahukan adalah dosis yang sudah lewat
// berhari-hari, yang bisa membuat orang minum obat dua kali.
import { putusanPengingat, TOLERANSI_TELAT_MS } from '../../server/src/jadwal.js'

let lulus = 0, gagal = 0
function cek(nama: string, benar: boolean, ket = '') {
  if (benar) { lulus++; console.log('PASS', nama, ket) }
  else { gagal++; console.log('FAIL', nama, ket) }
}

const HARI = 86_400_000
const T = 1_800_000_000_000   // titik waktu sembarang

cek('belum jatuh tempo: tidak diberitahukan dan jadwal tidak bergeser',
  (() => { const r = putusanPengingat(T + 1000, T); return !r.beritahu && r.berikutnya === T + 1000 })())

// Baru saja jatuh tempo → diberitahukan, jadwal maju tepat satu hari.
{
  const r = putusanPengingat(T, T + 30_000)
  cek('baru jatuh tempo: diberitahukan', r.beritahu)
  cek('baru jatuh tempo: maju satu hari', r.berikutnya === T + HARI)
}

// Terlambat masih dalam toleransi → tetap diberitahukan.
{
  const r = putusanPengingat(T, T + TOLERANSI_TELAT_MS - 1000)
  cek('telat dalam batas toleransi: tetap diberitahukan', r.beritahu)
}

// Terlambat melewati toleransi → jadwal dikejar, kabarnya ditahan.
{
  const r = putusanPengingat(T, T + TOLERANSI_TELAT_MS + 60_000)
  cek('telat melewati toleransi: tidak diberitahukan', !r.beritahu)
  cek('telat melewati toleransi: jadwal tetap dikejar', r.berikutnya === T + HARI)
}

// Inti perkaranya: mati lima hari harus selesai dalam SATU langkah.
{
  const sekarang = T + 5 * HARI + 3 * 3_600_000
  const r = putusanPengingat(T, sekarang)
  cek('mati lima hari: tidak diberitahukan', !r.beritahu)
  cek('mati lima hari: jadwal berikutnya sudah di masa depan', r.berikutnya > sekarang,
    `${Math.round((r.berikutnya - sekarang) / 3_600_000)} jam lagi`)
  cek('mati lima hari: selesai dalam satu langkah, bukan lima',
    r.berikutnya === T + 6 * HARI, new Date(r.berikutnya).toISOString())

  // Ulangi seperti penjadwal berikutnya akan melakukannya: tidak boleh ada
  // pemberitahuan susulan sama sekali.
  const lagi = putusanPengingat(r.berikutnya, sekarang + 60_000)
  cek('detak berikutnya tidak memicu susulan', !lagi.beritahu && lagi.berikutnya === r.berikutnya)
}

// Jam tepat pada batas hari: tidak boleh menghasilkan jadwal di masa lalu.
for (const telat of [1, 1000, HARI - 1, HARI, HARI + 1, 30 * HARI]) {
  const sekarang = T + telat
  const r = putusanPengingat(T, sekarang)
  if (r.berikutnya <= sekarang) { gagal++; console.log('FAIL', `telat ${telat}ms tetap di masa lalu`); break }
}
cek('tidak ada keterlambatan yang menyisakan jadwal di masa lalu', true)

// Tanggal rusak tidak boleh membekukan penjadwal.
cek('jadwal tidak sah diabaikan dengan aman',
  (() => { const r = putusanPengingat(NaN, T); return !r.beritahu })())

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal ? 1 : 0)
