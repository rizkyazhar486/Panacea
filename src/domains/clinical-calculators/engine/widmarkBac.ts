/**
 * Estimasi unit alkohol dan BAC Widmark: BAC(‰) = A / (r × m) − β × t. Kandungan etanol per minuman, tetapan r (0.68 L /
 * 0.55 P), β = 0.15 ‰/jam dan rumus dipindahkan dari halaman tanpa perubahan; yang baru hanya penolakan masukan di luar
 * rentang. Berat kosong/0 sebelumnya menghasilkan "Infinity‰"/"NaN‰", dan jumlah minuman negatif dapat mengurangi total
 * gram sehingga BAC tampak lebih rendah dari sebenarnya. Estimasi rata-rata populasi, bukan hasil alat ukur; satu-satunya
 * kadar aman untuk menyetir adalah nol (teks itu tetap di halaman).
 */
import { inRange } from './inputs'

export const ETHANOL_DENSITY_G_PER_ML = 0.789
export const WIDMARK_R = { M: 0.68, F: 0.55 } as const
export const ELIMINATION_PERMILLE_PER_H = 0.15

export interface Drink { label: string; icon: string; volumeMl: number; abv: number }
export const DRINKS: readonly Drink[] = [
  { label: 'Beer (330 ml, 5%)', icon: '🍺', volumeMl: 330, abv: 5 },
  { label: 'Beer, strong (330 ml, 8%)', icon: '🍺', volumeMl: 330, abv: 8 },
  { label: 'Wine (150 ml, 12%)', icon: '🍷', volumeMl: 150, abv: 12 },
  { label: 'Spirits, single (30 ml, 40%)', icon: '🥃', volumeMl: 30, abv: 40 },
  { label: 'Cocktail (250 ml, 15%)', icon: '🍹', volumeMl: 250, abv: 15 },
]

export const BAC_RANGES = {
  weightKg: { min: 30, max: 200 },
  hours: { min: 0, max: 12 },
  drinkCount: { min: 0, max: 50 },
} as const

export const gramsOf = (d: Drink): number => (d.volumeMl * (d.abv / 100)) * ETHANOL_DENSITY_G_PER_ML

export type BacInput = Readonly<{ sex: 'M' | 'F'; weightKg: number; hours: number; counts: Readonly<Record<string, number>> }>
export type BacResult =
  | { ok: true; data: { totalGrams: number; unitsUK: number; standardUS: number; permille: number; percent: number } }
  | { ok: false; reason: string }

export function widmarkBac(input: BacInput): BacResult {
  if (input.sex !== 'M' && input.sex !== 'F') return { ok: false, reason: 'Sex must be M or F' }
  const { weightKg: w, hours: h } = BAC_RANGES
  if (!inRange(input.weightKg, w.min, w.max)) return { ok: false, reason: `Body weight must be ${w.min}–${w.max} kg` }
  if (!inRange(input.hours, h.min, h.max)) return { ok: false, reason: `Hours must be ${h.min}–${h.max}` }
  const { min, max } = BAC_RANGES.drinkCount
  for (const d of DRINKS) {
    const n = input.counts[d.label] ?? 0
    if (!inRange(n, min, max)) return { ok: false, reason: `${d.label} count must be ${min}–${max}` }
  }
  const totalGrams = DRINKS.reduce((s, d) => s + (input.counts[d.label] ?? 0) * gramsOf(d), 0)
  const permille = Math.max(0, totalGrams / (WIDMARK_R[input.sex] * input.weightKg) - ELIMINATION_PERMILLE_PER_H * input.hours)
  return { ok: true, data: { totalGrams, unitsUK: totalGrams / 8, standardUS: totalGrams / 14, permille, percent: permille / 10 } }
}
