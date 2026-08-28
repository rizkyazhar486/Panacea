// ─────────────────────────────────────────────────────────────────────────────
// Arah kiblat.
//
// TIDAK ADA LAYANAN YANG DIPANGGIL untuk menghitungnya. Arah kiblat adalah
// GEOMETRI MURNI: azimut awal lingkaran besar dari tempat Anda menuju Ka'bah.
// Sekali koordinatnya diketahui, hasilnya pasti — tidak ada mazhab, tidak ada
// metode yang berbeda-beda seperti pada waktu salat, dan tidak ada alasan
// mengirim posisi seseorang ke layanan mana pun untuk mendapatkannya.
//
// YANG TIDAK PASTI BUKAN ANGKANYA MELAINKAN KOMPASNYA. Angka azimut ini benar
// sampai pecahan derajat. Yang meleset adalah pembacaan kompas telepon:
//
//   1. Kompas telepon menunjuk UTARA MAGNETIS, sedangkan azimut ini dihitung
//      terhadap UTARA SEJATI. Selisih keduanya (deklinasi magnetik) mencapai
//      beberapa derajat di Indonesia dan belasan derajat di tempat lain.
//   2. Magnetometer telepon mudah terganggu logam, pengeras suara, casing
//      bermagnet, dan mobil.
//
// Karena itu antarmuka menampilkan ANGKANYA sebagai yang utama dan kompas
// hanya sebagai pembantu — angka 295° dapat dipakai dengan kompas sungguhan,
// dengan bayangan matahari, atau dicocokkan dengan saf masjid terdekat.
// ─────────────────────────────────────────────────────────────────────────────

/** Koordinat Ka'bah, Masjidil Haram. */
export const KABAH = { lat: 21.4224779, lng: 39.6516066 }

const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/**
 * Azimut awal lingkaran besar dari (lat,lng) menuju Ka'bah, dalam derajat
 * searah jarum jam dari UTARA SEJATI (0-360).
 *
 * Memakai lingkaran besar, bukan garis lurus di peta. Pada proyeksi Mercator
 * arah ke Ka'bah dari Indonesia tampak ke barat laut yang landai, padahal
 * jalur terpendek di atas bola bumi berbeda — dan yang benar adalah yang di
 * atas bola.
 */
export function azimutKiblat(lat: number, lng: number): number {
  const f1 = rad(lat)
  const f2 = rad(KABAH.lat)
  const dl = rad(KABAH.lng - lng)
  const y = Math.sin(dl) * Math.cos(f2)
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)
  return (deg(Math.atan2(y, x)) + 360) % 360
}

/** Jarak lingkaran besar ke Ka'bah dalam kilometer (haversine, R = 6371 km). */
export function jarakKeKabah(lat: number, lng: number): number {
  const f1 = rad(lat)
  const f2 = rad(KABAH.lat)
  const df = rad(KABAH.lat - lat)
  const dl = rad(KABAH.lng - lng)
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/** Nama mata angin terdekat — dipakai agar angkanya bisa dipakai tanpa kompas. */
export function mataAngin(azimut: number): string {
  const nama = [
    'North', 'North-northeast', 'Northeast', 'East-northeast',
    'East', 'East-southeast', 'Southeast', 'South-southeast',
    'South', 'South-southwest', 'Southwest', 'West-southwest',
    'West', 'West-northwest', 'Northwest', 'North-northwest',
  ]
  return nama[Math.round(((azimut % 360) / 22.5)) % 16]
}

/**
 * Selisih sudut terpendek dari `dari` ke `ke`, dalam rentang -180..180.
 * Dipakai untuk menyatakan "putar 40 derajat ke kanan" alih-alih menyuruh
 * orang mengurangkan dua angka sendiri.
 */
export function selisihSudut(dari: number, ke: number): number {
  return ((((ke - dari) % 360) + 540) % 360) - 180
}
