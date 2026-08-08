// ─────────────────────────────────────────────────────────────────────────────
// Alur halaman — ke mana "kembali" seharusnya membawa.
//
// Tombol kembali yang hanya memanggil history.back() terasa benar sampai
// riwayatnya tidak seperti yang dibayangkan, dan itu sering terjadi:
//
//   * Tautan dibuka langsung dari pesan atau notifikasi. Historynya kosong,
//     sehingga "kembali" melempar pengguna KELUAR dari aplikasi.
//   * Pengguna berputar-putar: A → B → A → B. history.back() membawanya ke B
//     lagi, bukan naik ke induknya.
//   * Halaman datang dari pengalihan, sehingga satu langkah mundur justru
//     memicu pengalihan itu lagi dan terlihat seperti tombolnya rusak.
//
// Karena itu urutannya: induk yang dinyatakan dulu, baru riwayat, baru beranda.
// Naik ke induk selalu bisa diramalkan; riwayat hanya dipakai saat induknya
// memang tidak ada.
//
// Dengan 180-an rute, memetakan semuanya satu per satu akan basi dalam sepekan.
// Jadi hanya hubungan yang TIDAK bisa ditebak dari alamatnya yang ditulis di
// sini; sisanya diturunkan dari ruas alamat, dan rute bersarang mendapatkannya
// gratis (/health-data/tutorial → /health-data).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Induk yang tidak terbaca dari alamatnya sendiri. Ditulis hanya bila menebak
 * dari ruas alamat akan salah.
 */
const INDUK: Record<string, string> = {
  '/verifikasi-connect': '/dek-connect',
  '/tinjau-connect': '/dek-connect',
  '/dek-connect': '/',
  '/learn': '/',
  '/change': '/',
  '/analisis-pro': '/latihan',
  '/riwayat-latihan': '/latihan',
  '/macro-lab': '/nutrition',
  '/health-data/tutorial': '/health-data',
}

/**
 * Ke mana halaman ini naik, atau null bila tidak ada induk yang jelas dan
 * riwayat sebaiknya dipakai.
 */
export function indukRute(path: string): string | null {
  const bersih = path.split('?')[0].replace(/\/+$/, '') || '/'
  if (bersih === '/') return null

  const eksplisit = INDUK[bersih]
  if (eksplisit) return eksplisit

  // Rute bersarang: buang ruas terakhir. /a/b/c → /a/b
  const ruas = bersih.split('/').filter(Boolean)
  if (ruas.length > 1) return '/' + ruas.slice(0, -1).join('/')

  // Rute satu ruas tanpa induk tercatat: biarkan riwayat yang memutuskan.
  return null
}

export default indukRute
