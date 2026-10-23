// Aritmetika penjadwalan pengingat berulang harian.
//
// Dipisahkan dari penjadwalnya supaya bisa diuji tanpa menunggu waktu berjalan.
// Perhitungan yang hidup di dalam setInterval hanya bisa diperiksa dengan cara
// membiarkan server mati beberapa hari lalu menyalakannya lagi, dan cacat yang
// hanya muncul dalam keadaan seperti itu adalah cacat yang tidak akan pernah
// ditemukan sebelum sampai ke pengguna.

/** Selisih keterlambatan yang masih pantas diberitahukan. */
export const TOLERANSI_TELAT_MS = 60 * 60_000

export interface PutusanPengingat {
  /** Perlu diberitahukan sekarang? */
  beritahu: boolean
  /** Jadwal berikutnya, dalam milidetik epoch. */
  berikutnya: number
}

/**
 * Putuskan apa yang harus terjadi pada satu pengingat harian.
 *
 * Dua hal yang dijaga, dan keduanya pernah salah:
 *
 * 1. JADWAL DIKEJAR SEKALIGUS. Memajukan jadwal 24 jam tiap detak berarti
 *    server yang mati lima hari mengirim lima pemberitahuan dalam lima menit
 *    saat hidup kembali.
 * 2. YANG TERLAMBAT JAUH TIDAK DIBERITAHUKAN. Menyuruh seseorang minum obat
 *    untuk dosis kemarin bukan sekadar berisik — ia bisa membuat orang minum
 *    dua kali. Jadwalnya tetap dikejar; hanya kabarnya yang ditahan.
 */
export function putusanPengingat(
  jadwalMs: number,
  sekarangMs: number,
  periodeMs = 86_400_000,
  toleransiMs = TOLERANSI_TELAT_MS,
): PutusanPengingat {
  if (!Number.isFinite(jadwalMs) || jadwalMs > sekarangMs) {
    return { beritahu: false, berikutnya: jadwalMs }
  }
  const lewat = Math.floor((sekarangMs - jadwalMs) / periodeMs) + 1
  return {
    beritahu: sekarangMs - jadwalMs <= toleransiMs,
    berikutnya: jadwalMs + lewat * periodeMs,
  }
}
