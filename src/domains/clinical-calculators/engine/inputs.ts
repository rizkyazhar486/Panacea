/** Penjaga masukan bersama kalkulator klinis: gagal-tertutup pada NaN, Infinity, kosong (+'' = 0 ditolak oleh rentang) dan bukan-angka. */
export const isFiniteNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

export const inRange = (x: unknown, min: number, max: number): x is number => isFiniteNumber(x) && x >= min && x <= max

/**
 * Teks kolom → angka. Kolom kosong atau hanya spasi menjadi NaN (bukan 0), sehingga "belum diisi" tidak pernah
 * terbaca sebagai nilai 0 yang sah; fungsi domain menolak NaN dengan alasan eksplisit.
 */
export function parseNumberField(text: unknown): number {
  if (typeof text !== 'string' || text.trim() === '') return Number.NaN
  return Number(text)
}
