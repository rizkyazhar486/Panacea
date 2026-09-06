// ─────────────────────────────────────────────────────────────────────────────
// ARAH SERAT: SUMBU UTAMA SEBUAH STRUKTUR.
//
// Proyeksi triplanar tidak tahu apa-apa tentang anatomi. Ia mengambil tekstur
// menurut sumbu RUANG, sehingga sumbu halus tekstur jatuh di arah Z pada satu
// sisi permukaan dan di arah X pada sisi lain — dan pada permukaan melengkung
// keduanya berpapasan sehingga hasilnya teranyam seperti kain, bukan berserat
// seperti otot. Anyaman itu terlihat lebih buruk daripada warna rata: kain
// jelas bukan jaringan.
//
// Serat otot berjalan mengikuti sumbu panjang ototnya sendiri. Karena itu
// arah itu harus dihitung per struktur, lalu diberikan ke shader supaya
// teksturnya diputar mengikuti anatominya, bukan mengikuti sumbu dunia.
//
// Yang dipakai di sini adalah sisi terpanjang kotak pembatasnya, bukan
// analisis komponen utama. Alasannya jujur: kotak pembatas dihitung sekali
// dengan biaya nyaris nol untuk 743 mesh, sedangkan kovarians harus menyapu
// setiap titik. Untuk struktur yang memang memanjang — dan hampir semua otot
// rangka memanjang — keduanya menunjuk arah yang sama.
// ─────────────────────────────────────────────────────────────────────────────

export interface Kotak { min: [number, number, number]; maks: [number, number, number] }

/** Sumbu terpanjang kotak pembatas, sebagai vektor satuan. */
export function sumbuUtama(kotak: Kotak): [number, number, number] {
  const d = [
    kotak.maks[0] - kotak.min[0],
    kotak.maks[1] - kotak.min[1],
    kotak.maks[2] - kotak.min[2],
  ]
  let i = 0
  if (d[1] > d[i]) i = 1
  if (d[2] > d[i]) i = 2
  // Kotak yang rusak atau berukuran nol tidak boleh menghasilkan vektor nol:
  // shader akan membangun basis yang runtuh dan teksturnya hilang sama sekali.
  if (!Number.isFinite(d[i]) || d[i] <= 0) return [0, 1, 0]
  const v: [number, number, number] = [0, 0, 0]
  v[i] = 1
  return v
}

/**
 * Seberapa jelas struktur ini memanjang.
 *
 * Struktur yang hampir sekubus — tulang karpal, kelenjar — tidak punya arah
 * serat yang berarti, dan memaksakan arah padanya hanya menambah pola yang
 * salah. Nilai ini dipakai untuk memudarkan pemutaran teksturnya.
 */
export function kelonjongan(kotak: Kotak): number {
  const d = [
    kotak.maks[0] - kotak.min[0],
    kotak.maks[1] - kotak.min[1],
    kotak.maks[2] - kotak.min[2],
  ].filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => b - a)
  if (d.length < 2 || d[1] <= 0) return 0
  const rasio = d[0] / d[1]
  // 1 berarti sekubus, 3 ke atas berarti jelas memanjang.
  return Math.max(0, Math.min(1, (rasio - 1.15) / 1.85))
}
