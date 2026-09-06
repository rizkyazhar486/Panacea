// Uji kerapatan piksel yang menyesuaikan diri.
//
// Aturan penyesuaian resolusi punya satu cara khas untuk gagal: BERAYUN. Kalau
// ambang naik dan ambang turun sama, kerapatan akan naik-turun tepat di titik
// itu selamanya, dan resolusi yang berkedip jauh lebih mengganggu daripada
// resolusi yang tetap rendah. Kegagalan itu tidak pernah muncul sebagai galat;
// ia hanya membuat gambar berdenyut. Karena itu seluruh aturannya dibuat murni
// perhitungan, supaya bisa dijalankan ribuan kali tanpa GPU sama sekali.

import {
  BATAS_BAKU, AMBANG_NAIK, AMBANG_TURUN, JamBingkai,
  keadaanAwal, langkahSkala, skalaAwal,
} from '../../src/lib/renderScale'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const anggaran = BATAS_BAKU.anggaranMs

// ── Batas ───────────────────────────────────────────────────────────────────
ok('ambang turun di atas ambang naik — inilah histeresisnya', AMBANG_TURUN > AMBANG_NAIK)
ok('anggaran bingkai sekitar 60 fps', anggaran > 15 && anggaran < 18)
ok('batas atas mencakup ponsel berkerapatan 3', BATAS_BAKU.maksimum >= 3)
ok('batas bawah masih terbaca, tidak sampai buram', BATAS_BAKU.minimum >= 0.5)

// ── Kerapatan awal ──────────────────────────────────────────────────────────
ok('layar biasa mulai di 1', skalaAwal(1) === 1)
// Inilah inti permintaan "definisi tinggi": ponsel berkerapatan 3 harus
// menggambar pada 3, bukan dipotong ke 2 lalu direntangkan.
ok('ponsel berkerapatan 3 mulai di 3, bukan dipotong ke 2', skalaAwal(3) === 3)
ok('kerapatan 2 mulai di 2', skalaAwal(2) === 2)
ok('kerapatan sangat tinggi tetap dibatasi', skalaAwal(5) === BATAS_BAKU.maksimum)
ok('kerapatan tak masuk akal ditangani', skalaAwal(0) === 1 && skalaAwal(NaN) === 1)
ok('batas khusus dihormati',
  skalaAwal(3, { ...BATAS_BAKU, maksimum: 1.75 }) === 1.75)

// ── Turun saat lambat ───────────────────────────────────────────────────────
{
  let k = keadaanAwal(3)
  const lambat = anggaran * 2
  // Satu bingkai lambat BUKAN bukti: bisa saja bingkai saat tekstur diunggah.
  for (let i = 0; i < 19; i++) k = langkahSkala(k, lambat)
  ok('tidak turun sebelum buktinya cukup', k.skala === 3)
  k = langkahSkala(k, lambat)
  ok('turun setelah cukup banyak bingkai lambat berturut-turut', k.skala === 2.75)
  ok('hitungan direset setelah berubah', k.hitung === 0)
  // Turun bertahap: sekali langkah sering sudah cukup, dan langsung ke dasar
  // membuang ketajaman yang sebenarnya mampu dicapai.
  ok('turunnya bertahap, bukan langsung ke dasar', k.skala > BATAS_BAKU.minimum)
}
{
  let k = keadaanAwal(3)
  for (let i = 0; i < 400; i++) k = langkahSkala(k, anggaran * 4)
  ok('perangkat sangat lambat akhirnya sampai di batas bawah', k.skala === BATAS_BAKU.minimum)
  const lagi = langkahSkala(k, anggaran * 4)
  ok('tidak pernah turun di bawah batas bawah', lagi.skala === BATAS_BAKU.minimum)
}

// ── Naik saat lega ──────────────────────────────────────────────────────────
{
  let k = keadaanAwal(1)
  const cepat = anggaran * 0.4
  for (let i = 0; i < 19; i++) k = langkahSkala(k, cepat)
  ok('tidak naik sebelum buktinya cukup', k.skala === 1)
  k = langkahSkala(k, cepat)
  ok('naik setelah cukup banyak bingkai cepat', k.skala === 1.25)
  for (let i = 0; i < 400; i++) k = langkahSkala(k, cepat)
  ok('perangkat cepat akhirnya mencapai kerapatan penuh', k.skala === BATAS_BAKU.maksimum)
  ok('tidak pernah naik di atas batas atas',
    langkahSkala(k, cepat).skala === BATAS_BAKU.maksimum)
}

// ── Tidak berayun ───────────────────────────────────────────────────────────
//
// Uji terpenting. Waktu bingkai tepat di anggaran berada DI ANTARA kedua
// ambang, sehingga tidak ada perubahan sama sekali — bukan naik-turun.
{
  let k = keadaanAwal(2)
  for (let i = 0; i < 500; i++) k = langkahSkala(k, anggaran)
  ok('waktu bingkai tepat di anggaran tidak mengubah apa pun', k.skala === 2)

  // Simulasi perangkat yang waktu bingkainya memburuk saat kerapatan naik dan
  // membaik saat turun — persis keadaan yang membuat aturan naif berayun.
  let s = keadaanAwal(1)
  const riwayat: number[] = []
  for (let i = 0; i < 3000; i++) {
    const ms = 5 + s.skala * s.skala * 2.2
    s = langkahSkala(s, ms)
    riwayat.push(s.skala)
  }
  const limaRatusTerakhir = riwayat.slice(-500)
  const berbeda = new Set(limaRatusTerakhir).size
  ok('kerapatan mengendap, tidak berayun tanpa henti', berbeda <= 2, `${berbeda} nilai berbeda`)
  ok('mengendap pada nilai yang masuk akal',
    limaRatusTerakhir[limaRatusTerakhir.length - 1] >= BATAS_BAKU.minimum &&
    limaRatusTerakhir[limaRatusTerakhir.length - 1] <= BATAS_BAKU.maksimum)
}
{
  // Bukti lama tidak boleh menumpuk: sembilan belas bingkai lambat lalu satu
  // bingkai normal harus menghapus hitungannya, bukan menyisakannya.
  let k = keadaanAwal(3)
  for (let i = 0; i < 19; i++) k = langkahSkala(k, anggaran * 2)
  k = langkahSkala(k, anggaran)
  ok('bingkai normal mereset bukti yang menumpuk', k.hitung === 0)
  k = langkahSkala(k, anggaran * 2)
  ok('setelah reset, satu bingkai lambat tidak langsung menurunkan', k.skala === 3)
}

// ── Jam bingkai ─────────────────────────────────────────────────────────────
{
  const j = new JamBingkai(5)
  ok('belum siap sebelum ada cukup contoh', !j.siap)
  ok('rata-rata kosong adalah nol', j.rataMs === 0)
  for (let i = 0; i < 5; i++) j.catat(10)
  ok('siap setelah jendelanya terisi', j.siap)
  ok('rata-rata dihitung benar', j.rataMs === 10)
  for (let i = 0; i < 5; i++) j.catat(20)
  ok('jendela bergerak — contoh lama terdorong keluar', j.rataMs === 20)
  j.catat(NaN); j.catat(-5); j.catat(0)
  ok('nilai tak masuk akal diabaikan', j.rataMs === 20)
  j.bersihkan()
  ok('bisa dibersihkan setelah kerapatan berubah', !j.siap && j.rataMs === 0)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
