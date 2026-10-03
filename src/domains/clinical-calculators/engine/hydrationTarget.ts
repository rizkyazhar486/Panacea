/**
 * Target cairan harian: 33 mL/kg + tambahan olahraga (400/600/800 mL per jam menurut intensitas), iklim panas (+500),
 * kehamilan (+300) dan menyusui (+700). Konstanta dan rumus dipindahkan dari halaman tanpa perubahan; yang baru hanya
 * penolakan masukan di luar rentang. Berat kosong sebelumnya terbaca 0 sehingga target hanya berisi tambahan olahraga/iklim
 * dan tampak seperti angka sah. Rata-rata populasi, bukan resep: kondisi ginjal/jantung/hati yang membatasi cairan
 * mengesampingkan angka ini (teks itu tetap di halaman). Rentang berat 30–200 kg mengikuti batas input halaman; di bawah itu
 * aturan 33 mL/kg dewasa tidak berlaku, jadi ditolak, bukan dihitung.
 */
import { inRange } from './inputs'

export type HydrationIntensity = 'none' | 'light' | 'moderate' | 'intense'
export const INTENSITY_ML_PER_HOUR: Readonly<Record<HydrationIntensity, number>> = { none: 0, light: 400, moderate: 600, intense: 800 }
export const ML_PER_KG = 33
export const HOT_CLIMATE_ML = 500
export const PREGNANCY_ML = 300
export const BREASTFEEDING_ML = 700
export const ML_PER_GLASS = 250

export const HYDRATION_RANGES = { weightKg: { min: 30, max: 200 }, exerciseMin: { min: 0, max: 600 } } as const

export type HydrationInput = Readonly<{
  weightKg: number; exerciseMin: number; intensity: HydrationIntensity; hotClimate: boolean; pregnant: boolean; breastfeeding: boolean
}>
export type HydrationRow = Readonly<{ label: string; ml: number }>
export type HydrationResult =
  | { ok: true; data: { totalMl: number; totalL: number; glasses: number; rows: readonly HydrationRow[] } }
  | { ok: false; reason: string }

export function hydrationTarget(input: HydrationInput): HydrationResult {
  const { weightKg: w, exerciseMin: e } = HYDRATION_RANGES
  if (!inRange(input.weightKg, w.min, w.max)) return { ok: false, reason: `Body weight must be ${w.min}–${w.max} kg` }
  if (!inRange(input.exerciseMin, e.min, e.max)) return { ok: false, reason: `Exercise must be ${e.min}–${e.max} minutes` }
  if (!Object.hasOwn(INTENSITY_ML_PER_HOUR, input.intensity)) return { ok: false, reason: 'Unknown exercise intensity' }
  const baseMl = input.weightKg * ML_PER_KG
  const exerciseMl = (input.exerciseMin / 60) * INTENSITY_ML_PER_HOUR[input.intensity]
  const climateMl = input.hotClimate ? HOT_CLIMATE_ML : 0
  const pregnancyMl = input.pregnant ? PREGNANCY_ML : 0
  const breastfeedingMl = input.breastfeeding ? BREASTFEEDING_ML : 0
  const totalMl = baseMl + exerciseMl + climateMl + pregnancyMl + breastfeedingMl
  const rows = [
    { label: 'Baseline (33 mL/kg body weight)', ml: baseMl },
    { label: `Exercise (${input.exerciseMin} min, ${input.intensity})`, ml: exerciseMl },
    { label: 'Hot/humid climate', ml: climateMl },
    { label: 'Pregnancy', ml: pregnancyMl },
    { label: 'Breastfeeding', ml: breastfeedingMl },
  ].filter((r) => r.ml > 0)
  return { ok: true, data: { totalMl, totalL: totalMl / 1000, glasses: Math.round(totalMl / ML_PER_GLASS), rows } }
}
