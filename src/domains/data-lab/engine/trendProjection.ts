// Proyeksi tren biomarker garis lurus (OLS). Murni dan deterministik; bukan model fisiologis.
// Fail closed: sel kosong dilewati, sel berisi tetapi tidak sah ditolak (tidak diam-diam dibuang), minimal 3 titik
// (dua titik selalu cocok sempurna dan tidak menyisakan sisa untuk mengukur ketidakpastian).

export const TREN_MIN_TITIK = 3
export const TREN_MAKS_NILAI = 100000

export type TitikProyeksi = { tahunKe: number; nilai: number | null }
export type HasilTren =
  | { ok: true; data: { n: number; kemiringanPerTahun: number; sisaSd: number; indeksTerakhir: number; proyeksi: TitikProyeksi[] } }
  | { ok: false; alasan: string }

const bulat1 = (x: number) => Math.round(x * 10) / 10

/** `teks[i]` = nilai tahun ke-(i+1). Proyeksi dihitung DARI tahun terakhir yang diisi, bukan dari ujung formulir. */
export function proyeksiTren(teks: readonly string[], horizon = 5): HasilTren {
  if (!Array.isArray(teks)) return { ok: false, alasan: 'Enter yearly values.' }
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 10) return { ok: false, alasan: 'Horizon must be 1–10 years.' }
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < teks.length; i++) {
    // Runtime callers may pass malformed imported data despite the string[] type.
    // A non-string populated cell is invalid, never an implicit blank year.
    if (typeof teks[i] !== 'string') return { ok: false, alasan: `Yr ${i + 1}: enter a number above 0 and up to ${TREN_MAKS_NILAI}.` }
    const t = teks[i].trim()
    if (t === '') continue
    const v = Number(t)
    if (!Number.isFinite(v) || v <= 0 || v > TREN_MAKS_NILAI) return { ok: false, alasan: `Yr ${i + 1}: enter a number above 0 and up to ${TREN_MAKS_NILAI}.` }
    xs.push(i)
    ys.push(v)
  }
  const n = xs.length
  if (n < TREN_MIN_TITIK) return { ok: false, alasan: `Enter at least ${TREN_MIN_TITIK} yearly values (${n} entered).` }
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0)
  const sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0)
  const slope = sxy / sxx
  const intercept = my - slope * mx
  const sse = xs.reduce((a, x, i) => a + (ys[i] - (intercept + slope * x)) ** 2, 0)
  const indeksTerakhir = xs[n - 1]
  const proyeksi = Array.from({ length: horizon }, (_, k) => {
    const y = intercept + slope * (indeksTerakhir + k + 1)
    // Nilai ≤ 0 tidak bermakna untuk biomarker positif: tampilkan "tidak bermakna", jangan angka negatif.
    return { tahunKe: k + 1, nilai: y > 0 ? bulat1(y) : null }
  })
  return { ok: true, data: { n, kemiringanPerTahun: slope, sisaSd: Math.sqrt(sse / (n - 2)), indeksTerakhir, proyeksi } }
}
