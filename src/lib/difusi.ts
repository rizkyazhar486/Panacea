// Hukum Fick dan alasan tubuh memerlukan peredaran darah.
//
// KENAPA INI DIGAMBAR. `bodyPhysiology.ts` memuat "Flux ~ A x D x dC / T"
// sebagai TEKS dan tidak menghitung apa pun dengannya. Rumus yang dicetak tidak
// pernah bisa salah, dan karena itu tidak pernah bisa mengajar.
//
// Pelajarannya bukan pada rumus fluks itu, melainkan pada satu akibat yang
// tidak terlihat di dalamnya: WAKTU DIFUSI SEBANDING DENGAN KUADRAT JARAK.
//
//   t ~ x^2 / (2D)
//
// Menggandakan jarak tidak menggandakan waktunya -- ia MELIPATEMPATKANNYA.
// Karena itu oksigen menyeberangi satu mikrometer dalam waktu di bawah satu
// milidetik, tetapi memerlukan hitungan MENIT untuk satu milimeter, dan waktu
// seumur hidup untuk satu meter. Tidak ada jumlah "usaha" yang memperbaikinya.
//
// Itulah sebabnya setiap sel harus berada dalam beberapa puluh mikrometer dari
// sebuah kapiler, dan itulah sebabnya hewan yang lebih besar daripada beberapa
// lapis sel tidak punya pilihan selain memompa. Pernyataan itu tentang BENTUK
// KURVA -- parabola, bukan garis -- dan tidak ada tabel yang membuatnya terasa.
//
// Semua fungsi di sini juga yang MENGGAMBAR kurvanya.

export const TETAPAN_DIFUSI = {
  /** Koefisien difusi oksigen dalam jaringan, m²/s (37 °C, nilai lazim). */
  D_OKSIGEN: 2e-9,
  /** Koefisien difusi glukosa dalam air, m²/s. */
  D_GLUKOSA: 6.7e-10,
  /**
   * Koefisien difusi BEBAS CO2, m²/s.
   *
   * HATI-HATI, dan ini disebut di panelnya juga: angka ini membuat CO2 tampak
   * LEBIH LAMBAT daripada oksigen, dan untuk difusi bebas memang begitu. Tetapi
   * perpindahan CO2 yang sesungguhnya melintasi jaringan JAUH LEBIH CEPAT
   * daripada oksigen, karena kelarutannya berkali-kali lipat lebih besar --
   * yang menentukan di sana adalah koefisien Krogh (D x kelarutan), bukan D
   * sendirian. Berkas ini sengaja TIDAK memodelkan kelarutan, jadi urutan
   * kecepatan di sini berlaku untuk difusi bebas saja dan tidak boleh dibaca
   * sebagai pernyataan tentang pertukaran gas.
   */
  D_CO2: 1.6e-9,
} as const

export interface ZatDifusi { id: string; nama: string; d: number }

export const ZAT_RUJUKAN: readonly ZatDifusi[] = [
  { id: 'o2', nama: 'Oxygen', d: TETAPAN_DIFUSI.D_OKSIGEN },
  { id: 'co2', nama: 'Carbon dioxide', d: TETAPAN_DIFUSI.D_CO2 },
  { id: 'glukosa', nama: 'Glucose', d: TETAPAN_DIFUSI.D_GLUKOSA },
] as const

/**
 * Waktu difusi ciri, detik, untuk menempuh jarak x meter.
 *
 * t = x^2 / (2D). Inilah seluruh pelajarannya, dan ia KUADRAT.
 */
export function waktuDifusi(jarakMeter: number, d: number): number {
  if (!Number.isFinite(jarakMeter) || jarakMeter < 0) return Number.NaN
  if (!Number.isFinite(d) || d <= 0) return Number.NaN
  return (jarakMeter * jarakMeter) / (2 * d)
}

/** Jarak yang ditempuh dalam waktu tertentu, meter. Kebalikan yang tepat. */
export function jarakDifusi(detik: number, d: number): number {
  if (!Number.isFinite(detik) || detik < 0) return Number.NaN
  if (!Number.isFinite(d) || d <= 0) return Number.NaN
  return Math.sqrt(2 * d * detik)
}

export interface MasukanFick {
  /** Luas permukaan, m². */
  luas: number
  /** Koefisien difusi, m²/s. */
  d: number
  /** Beda konsentrasi, mol/m³. */
  bedaKonsentrasi: number
  /** Tebal penghalang, m. */
  tebal: number
}

/**
 * Fluks menurut hukum Fick, mol/s.
 *
 * Tebal nol akan memberi fluks tak hingga, yang tidak ada di alam -- ditolak
 * dengan NaN alih-alih dicetak sebagai angka raksasa.
 */
export function fluksFick({ luas, d, bedaKonsentrasi, tebal }: MasukanFick): number {
  if (![luas, d, bedaKonsentrasi, tebal].every(Number.isFinite)) return Number.NaN
  if (luas < 0 || d <= 0 || tebal <= 0) return Number.NaN
  return (luas * d * bedaKonsentrasi) / tebal
}

export interface TitikDifusi { jarakUm: number; detik: number }

/**
 * Waktu difusi terhadap jarak, dalam mikrometer.
 *
 * Digambar pada sumbu LINEAR dengan sengaja: pada sumbu logaritmik parabola ini
 * menjadi garis lurus dan pelajarannya hilang justru saat digambar.
 */
export function deretWaktu(d: number, jarakMaksUm = 200, langkahUm = 2): TitikDifusi[] {
  const titik: TitikDifusi[] = []
  for (let um = 0; um <= jarakMaksUm + 1e-9; um += langkahUm) {
    titik.push({ jarakUm: um, detik: waktuDifusi(um * 1e-6, d) })
  }
  return titik
}

export const RENTANG_DIFUSI = {
  jarakUm: { min: 1, maks: 200 },
  tebalUm: { min: 0.2, maks: 20 },
  luasM2: { min: 1, maks: 120 },
} as const
