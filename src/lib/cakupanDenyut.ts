// Berapa banyak sesi pekan ini yang benar-benar merekam detak jantung?
//
// Setiap angka yang diturunkan dari deret HR — menit per zona, pemulihan
// denyut, beban latihan — hanya dapat dihitung untuk sesi yang merekamnya.
// Sesi tanpa sabuk dada atau jam tangan bukan menyumbang NOL menit; menitnya
// TIDAK DIKETAHUI.
//
// Perbedaan itu menentukan, dan menghilangkannya adalah kebohongan yang paling
// mudah terjadi di sini. Menyaring sesi tanpa HR lalu menuliskan "34 menit
// Zona 2" membuat angka itu terbaca sebagai seluruh pekan, padahal ia hanya
// mewakili sebagian sesinya. Pembacanya menyimpulkan ia kurang berlatih, lalu
// menambah beban yang sebenarnya tidak perlu ditambah — kesimpulan yang salah
// dari angka yang benar.
//
// Fungsi ini hanya MENGHITUNG cakupannya. Perhitungan zona sendiri tetap
// tinggal di tempatnya masing-masing: menyalinnya ke sini akan membuat dua
// angka berbeda tentang hal yang sama, dan tidak ada yang gagal pada hari
// keduanya mulai menyimpang.

const HARI = 864e5

export interface CakupanDenyut {
  /** Sesi tujuh hari terakhir yang punya deret HR cukup untuk dihitung. */
  denganHr: number
  /** Sesi tujuh hari terakhir tanpa deret HR — nilainya tidak diketahui. */
  tanpaHr: number
}

/**
 * Menghitung cakupan HR pada sesi tujuh hari terakhir.
 *
 * Ambang `>= 2` titik disamakan dengan penyaring yang sudah dipakai ubin-ubin
 * latihan: satu titik tidak membentuk rentang waktu, jadi tidak ada zona yang
 * dapat diturunkan darinya.
 */
export function cakupanDenyutPekan(
  workouts: readonly { mulai?: string; hr?: unknown[] }[],
  sekarang = Date.now(),
): CakupanDenyut {
  let denganHr = 0
  let tanpaHr = 0
  for (const w of workouts) {
    const mulai = Date.parse(w?.mulai ?? '')
    if (!Number.isFinite(mulai)) continue
    const umur = sekarang - mulai
    if (umur < 0 || umur >= 7 * HARI) continue
    if (Array.isArray(w.hr) && w.hr.length >= 2) denganHr += 1
    else tanpaHr += 1
  }
  return { denganHr, tanpaHr }
}

/**
 * Kalimat cakupan untuk dipasang di bawah angka yang diturunkan dari HR.
 *
 * Mengembalikan null ketika seluruh sesi terukur: menambahkan "dari 3 dari 3
 * sesi" pada keadaan yang memang lengkap hanya menambah teks tanpa menambah
 * apa pun yang perlu diketahui.
 */
export function kalimatCakupan(c: CakupanDenyut): string | null {
  if (c.tanpaHr <= 0) return null
  const total = c.denganHr + c.tanpaHr
  return `From ${c.denganHr} of ${total} sessions this week. ` +
    `${c.tanpaHr === 1 ? 'One session has' : `${c.tanpaHr} sessions have`} no heart-rate data, ` +
    'so their minutes are unknown rather than zero — the figure above is a floor.'
}
