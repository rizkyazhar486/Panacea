// ─────────────────────────────────────────────────────────────────────────────
// Letak kota — sengaja kasar.
//
// Connect menyaring calon kenalan berdasarkan radius, dan radius butuh jarak.
// Jarak biasanya diambil dari GPS ponsel, dan di sinilah keputusan desainnya:
// KAMI TIDAK MENGAMBIL GPS.
//
// Alasannya bukan kemalasan teknis. Fitur perkenalan yang menyimpan koordinat
// presisi menciptakan bahaya yang tidak sepadan dengan manfaatnya: siapa pun
// yang bisa membaca jarak ke seseorang dari tiga titik berbeda dapat menghitung
// letak rumahnya (trilaterasi). Ini bukan kekhawatiran teoretis — beberapa
// aplikasi kencan besar pernah kebobolan persis lewat jalan itu. Menyimpan
// koordinat rumah pengguna berarti membangun basis data yang, bila bocor,
// membahayakan keselamatan fisik orang, bukan sekadar privasinya.
//
// Karena itu letak diambil dari KOTA yang sudah pengguna tulis sendiri di
// formulir verifikasi. Titik yang disimpan adalah pusat kota, sama untuk semua
// penduduk kota itu. Dua orang di kota yang sama berjarak 0 km; jarak antarkota
// cukup akurat untuk pertanyaan "apakah dia di kota sebelah atau di pulau lain",
// yang memang satu-satunya pertanyaan yang perlu dijawab radius.
//
// Konsekuensinya jujur dan harus disampaikan ke pengguna: radius di bawah
// jarak antarkota terdekat tidak menyaring apa pun di dalam satu kota.
// ─────────────────────────────────────────────────────────────────────────────

export interface Kota {
  id: string
  nama: string
  provinsi: string
  lat: number
  lon: number
}

/**
 * Kota dengan populasi besar di Indonesia. Koordinat adalah pusat kota,
 * dibulatkan ke dua desimal (kira-kira satu kilometer) karena presisi lebih
 * dari itu tidak dipakai dan hanya menambah risiko.
 */
export const KOTA: Kota[] = [
  { id: 'jakarta', nama: 'Jakarta', provinsi: 'DKI Jakarta', lat: -6.21, lon: 106.85 },
  { id: 'bogor', nama: 'Bogor', provinsi: 'Jawa Barat', lat: -6.60, lon: 106.80 },
  { id: 'depok', nama: 'Depok', provinsi: 'Jawa Barat', lat: -6.40, lon: 106.82 },
  { id: 'tangerang', nama: 'Tangerang', provinsi: 'Banten', lat: -6.18, lon: 106.63 },
  { id: 'bekasi', nama: 'Bekasi', provinsi: 'Jawa Barat', lat: -6.24, lon: 106.99 },
  { id: 'bandung', nama: 'Bandung', provinsi: 'Jawa Barat', lat: -6.91, lon: 107.61 },
  { id: 'cirebon', nama: 'Cirebon', provinsi: 'Jawa Barat', lat: -6.71, lon: 108.56 },
  { id: 'semarang', nama: 'Semarang', provinsi: 'Jawa Tengah', lat: -6.97, lon: 110.42 },
  { id: 'solo', nama: 'Surakarta', provinsi: 'Jawa Tengah', lat: -7.57, lon: 110.83 },
  { id: 'yogyakarta', nama: 'Yogyakarta', provinsi: 'DI Yogyakarta', lat: -7.80, lon: 110.36 },
  { id: 'surabaya', nama: 'Surabaya', provinsi: 'Jawa Timur', lat: -7.26, lon: 112.75 },
  { id: 'malang', nama: 'Malang', provinsi: 'Jawa Timur', lat: -7.98, lon: 112.63 },
  { id: 'denpasar', nama: 'Denpasar', provinsi: 'Bali', lat: -8.65, lon: 115.22 },
  { id: 'medan', nama: 'Medan', provinsi: 'Sumatera Utara', lat: 3.59, lon: 98.67 },
  { id: 'palembang', nama: 'Palembang', provinsi: 'Sumatera Selatan', lat: -2.98, lon: 104.76 },
  { id: 'pekanbaru', nama: 'Pekanbaru', provinsi: 'Riau', lat: 0.51, lon: 101.45 },
  { id: 'padang', nama: 'Padang', provinsi: 'Sumatera Barat', lat: -0.95, lon: 100.35 },
  { id: 'bandarlampung', nama: 'Bandar Lampung', provinsi: 'Lampung', lat: -5.43, lon: 105.26 },
  { id: 'batam', nama: 'Batam', provinsi: 'Kepulauan Riau', lat: 1.08, lon: 104.03 },
  { id: 'banjarmasin', nama: 'Banjarmasin', provinsi: 'Kalimantan Selatan', lat: -3.32, lon: 114.59 },
  { id: 'balikpapan', nama: 'Balikpapan', provinsi: 'Kalimantan Timur', lat: -1.24, lon: 116.85 },
  { id: 'samarinda', nama: 'Samarinda', provinsi: 'Kalimantan Timur', lat: -0.50, lon: 117.15 },
  { id: 'pontianak', nama: 'Pontianak', provinsi: 'Kalimantan Barat', lat: -0.02, lon: 109.34 },
  { id: 'makassar', nama: 'Makassar', provinsi: 'Sulawesi Selatan', lat: -5.15, lon: 119.43 },
  { id: 'manado', nama: 'Manado', provinsi: 'Sulawesi Utara', lat: 1.47, lon: 124.84 },
  { id: 'ambon', nama: 'Ambon', provinsi: 'Maluku', lat: -3.70, lon: 128.18 },
  { id: 'jayapura', nama: 'Jayapura', provinsi: 'Papua', lat: -2.53, lon: 140.72 },
  { id: 'kupang', nama: 'Kupang', provinsi: 'Nusa Tenggara Timur', lat: -10.18, lon: 123.61 },
  { id: 'mataram', nama: 'Mataram', provinsi: 'Nusa Tenggara Barat', lat: -8.58, lon: 116.12 },
  { id: 'bandaaceh', nama: 'Banda Aceh', provinsi: 'Aceh', lat: 5.55, lon: 95.32 },
]

const PETA = new Map(KOTA.map((k) => [k.id, k]))

function normal(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, '')
}

/**
 * Menebak kota dari teks bebas "Bandung, Jawa Barat" yang sudah pengguna tulis
 * di formulir verifikasi, supaya tidak perlu menanyakan letak dua kali.
 *
 * Hanya bagian sebelum koma yang dipakai, dan pencocokannya harus persis
 * setelah dinormalkan. Pencocokan longgar berbahaya di sini: "Kota Baru"
 * tidak boleh diam-diam menjadi "Batam" hanya karena mirip.
 */
export function kotaDariTeks(teks: string): Kota | null {
  if (!teks) return null
  const bagian = teks.split(',')[0]
  const n = normal(bagian)
  if (!n) return null
  for (const k of KOTA) {
    if (normal(k.nama) === n || k.id === n) return k
  }
  // Beberapa nama sehari-hari yang berbeda dari nama resmi.
  const alias: Record<string, string> = {
    solo: 'solo', jogja: 'yogyakarta', jogjakarta: 'yogyakarta', yogya: 'yogyakarta',
    djakarta: 'jakarta', ujungpandang: 'makassar', bandarlampung: 'bandarlampung',
  }
  const id = alias[n]
  return id ? PETA.get(id) ?? null : null
}

export function kotaDariId(id: string): Kota | null {
  return PETA.get(id) ?? null
}

/**
 * Jarak lingkaran besar dalam kilometer (haversine).
 *
 * Bumi diperlakukan sebagai bola berjari-jari 6371 km. Untuk jarak antarkota
 * di Indonesia, galatnya di bawah satu persen — jauh lebih kecil daripada
 * kekasaran yang sudah kita pilih dengan memakai titik pusat kota.
 */
export function jarakKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLon = rad(bLon - aLon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}
