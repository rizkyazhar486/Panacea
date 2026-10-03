/** Penjaga masukan bersama kalkulator klinis: gagal-tertutup pada NaN, Infinity, kosong (+'' = 0 ditolak oleh rentang) dan bukan-angka. */
export const isFiniteNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

export const inRange = (x: unknown, min: number, max: number): x is number => isFiniteNumber(x) && x >= min && x <= max
