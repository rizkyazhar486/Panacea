// Skor tes kebugaran (gaya SIPSS, heuristik): butir yang belum diisi BUKAN nol repetisi.
// Dulu `+e.target.value || 0` dan keadaan awal 0 membuat halaman menampilkan "Total 0/100 — Needs Improvement" sebelum seorang pun
// mengisi apa pun, dan butir yang belum diuji ikut menyeret total. Sekarang tiap butir bernilai `undefined` sampai diisi, total dan
// keputusan baru dihitung bila keempat butir terisi, dan nol yang diketik tetap nol.
export type Sex = 'L' | 'P'
export type Butir = 'pushup' | 'situp' | 'pullup' | 'cooper'
export const BUTIR: readonly Butir[] = ['pushup', 'situp', 'pullup', 'cooper']

// Target skor maksimum perkiraan (≈ "Excellent") untuk tes jasmani TNI-Polri. Repetisi dalam 1 menit kecuali dicatat.
export const TARGET: Record<Sex, Record<Butir, number>> = {
  L: { pushup: 43, situp: 41, pullup: 18, cooper: 2800 }, // pull-up: repetisi; cooper: meter / 12 menit
  P: { pushup: 30, situp: 30, pullup: 90, cooper: 2300 }, // perempuan: "pull-up" = chinning (detik)
}
/** Batas kewajaran masukan (bukan ambang klinis); di atasnya dianggap salah ketik. */
export const BATAS: Record<Butir, number> = { pushup: 300, situp: 300, pullup: 900, cooper: 6000 }

export type Reps = Partial<Record<Butir, number>>

/** Teks kolom → angka; kosong, bukan angka, negatif, tak hingga, atau di atas batas kewajaran → `undefined` (belum diisi). */
export function parseButir(teks: unknown, butir: Butir): number | undefined {
  if (typeof teks !== 'string' || teks.trim() === '') return undefined
  const v = Number(teks)
  return Number.isFinite(v) && v >= 0 && v <= BATAS[butir] ? v : undefined
}

export const skorButir = (v: number | undefined, target: number): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.max(0, Math.min(100, Math.round((v / target) * 100))) : null

export interface RingkasanTes {
  skor: { k: Butir; nilai: number | null }[]
  /** `null` sampai keempat butir terisi. */
  total: number | null
  /** `null` sampai keempat butir terisi. */
  lulus: boolean | null
  kurang: Butir[]
}

export function ringkasTes(reps: Reps, sex: Sex): RingkasanTes {
  const t = TARGET[sex]
  const skor = BUTIR.map((k) => ({ k, nilai: skorButir(reps[k], t[k]) }))
  const kurang = skor.filter((s) => s.nilai === null).map((s) => s.k)
  if (kurang.length > 0) return { skor, total: null, lulus: null, kurang }
  const nilai = skor.map((s) => s.nilai as number)
  const total = Math.round(nilai.reduce((a, b) => a + b, 0) / nilai.length)
  return { skor, total, lulus: total >= 60 && nilai.every((v) => v >= 41), kurang }
}
