/**
 * Perkiraan waktu habisnya glikogen hati (heuristik ilustratif populasi-rata-rata, BUKAN pengukuran autofagi pengguna):
 * jam dasar = 14 − (1 − lemak tubuh/100) × 2, sisa = max(0, dasar − jam sejak makan terakhir). Rumus dipindahkan dari halaman
 * tanpa perubahan. Yang baru: lemak tubuh dan jam sejak makan diperiksa rentang kewajarannya; dulu `Number(x) || 0` membuat kolom
 * kosong terbaca 0% lemak / 0 jam dan menampilkan perkiraan seolah masukan sah. Rentang = kewajaran masukan, bukan ambang klinis.
 */
import { inRange, isFiniteNumber } from './inputs'

export const AUTOPHAGY_RANGES = {
  bodyFatPct: { min: 3, max: 70, name: 'body fat', unit: ' %' },
  hoursSinceMeal: { min: 0, max: 72, name: 'hours since last meal', unit: ' h' },
} as const
type Field = keyof typeof AUTOPHAGY_RANGES

export type AutophagyTimingResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  hoursRemaining: number | null
  started: boolean | null
}>

const NONE = { hoursRemaining: null, started: null } as const

export function autophagyTiming(input: Readonly<{ bodyFatPct: number; hoursSinceMeal: number }>): AutophagyTimingResult {
  const missing: string[] = []
  const invalid: string[] = []
  for (const k of Object.keys(AUTOPHAGY_RANGES) as Field[]) {
    const { min, max, name, unit } = AUTOPHAGY_RANGES[k]
    const v = input[k]
    if (typeof v === 'number' && Number.isNaN(v)) missing.push(name)
    else if (!inRange(v, min, max)) invalid.push(`${name} must be ${min}–${max}${unit}`)
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, ...NONE }
  const leanMassFactor = 1 - input.bodyFatPct / 100
  const hoursRemaining = Math.max(0, 14 - leanMassFactor * 2 - input.hoursSinceMeal)
  return { missing, invalid, hoursRemaining, started: isFiniteNumber(hoursRemaining) && hoursRemaining <= 0 }
}
