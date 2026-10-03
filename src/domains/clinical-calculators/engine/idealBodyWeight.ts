/**
 * Berat badan ideal (Broca / Lorentz) dan kebutuhan kalori harian = BBI × faktor aktivitas. Rumus dipindahkan dari dua
 * halaman yang menyalinnya sendiri-sendiri (Broca dan Broca–Lorentz) dan kini satu sumber. Faktor aktivitas 30/35/40
 * kcal/kg apa adanya dari halaman; tampilan pendukung keputusan, bukan preskripsi gizi.
 */
import { inRange } from './inputs'

// Rumus ini untuk dewasa; di bawah 120 cm Broca mendekati 0 kg. Batas kewarasan masukan, bukan ambang klinis.
export const IBW_HEIGHT_CM = { min: 120, max: 250 } as const

export type IbwSex = 'M' | 'F'
export type IbwFormula = 'broca' | 'lorentz'
export type ActivityLevel = 'ringan' | 'sedang' | 'berat'
export const KCAL_PER_KG: Readonly<Record<ActivityLevel, number>> = { ringan: 30, sedang: 35, berat: 40 }

export type IdealBodyWeightResult =
  | { ok: true; data: { ibwKg: number } }
  | { ok: false; reason: string }
export type DailyCaloriesResult =
  | { ok: true; data: { ibwKg: number; kcalPerDay: number } }
  | { ok: false; reason: string }

export function idealBodyWeight(heightCm: number, sex: IbwSex, formula: IbwFormula): IdealBodyWeightResult {
  if (!inRange(heightCm, IBW_HEIGHT_CM.min, IBW_HEIGHT_CM.max)) return { ok: false, reason: `Height must be ${IBW_HEIGHT_CM.min}–${IBW_HEIGHT_CM.max} cm` }
  if (sex !== 'M' && sex !== 'F') return { ok: false, reason: 'Sex must be M or F' }
  if (formula !== 'broca' && formula !== 'lorentz') return { ok: false, reason: 'Formula must be broca or lorentz' }
  const base = heightCm - 100
  const ibwKg = formula === 'broca'
    ? (sex === 'M' ? base - base * 0.1 : base - base * 0.15)
    : (sex === 'M' ? heightCm - 100 - (heightCm - 150) / 4 : heightCm - 100 - (heightCm - 150) / 2.5)
  return { ok: true, data: { ibwKg } }
}

export function dailyCalories(heightCm: number, sex: IbwSex, formula: IbwFormula, activity: ActivityLevel): DailyCaloriesResult {
  if (!Object.prototype.hasOwnProperty.call(KCAL_PER_KG, activity)) return { ok: false, reason: 'Activity must be ringan, sedang or berat' }
  const ibw = idealBodyWeight(heightCm, sex, formula)
  if (!ibw.ok) return ibw
  return { ok: true, data: { ibwKg: ibw.data.ibwKg, kcalPerDay: ibw.data.ibwKg * KCAL_PER_KG[activity] } }
}
