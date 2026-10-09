/**
 * Kafein tersisa saat tidur: eliminasi orde-pertama, sisa = dosis × 0,5^(jam / waktu paruh). Isi minuman (mg), pita sisa (>25% / >12,5%),
 * aturan 3 waktu paruh, dan rentang waktu paruh 1,5–9,5 jam dipindahkan dari halaman tanpa perubahan. Yang baru: porsi, mg tambahan,
 * waktu paruh, dan jam divalidasi (dulu porsi negatif atau 1e9 lolos dan jam kosong menghasilkan NaN). Porsi/mg kosong = 0 (tidak minum),
 * itu jawaban sah; nilai yang tidak masuk akal ditolak. Rentang = batas kewajaran masukan, BUKAN batas aman kafein. Estimasi edukasi.
 */
import { inRange } from './inputs'

export type CaffeineDrink = Readonly<{ label: string; icon: string; mg: number }>
export const CAFFEINE_DRINKS: readonly CaffeineDrink[] = [
  { label: 'Brewed coffee (240 ml)', icon: '☕', mg: 95 },
  { label: 'Espresso shot', icon: '☕', mg: 63 },
  { label: 'Black tea (240 ml)', icon: '🍵', mg: 47 },
  { label: 'Green tea (240 ml)', icon: '🍵', mg: 28 },
  { label: 'Energy drink (250 ml can)', icon: '🥤', mg: 80 },
  { label: 'Cola (330 ml can)', icon: '🥤', mg: 34 },
]

export const CAFFEINE_RANGES = {
  servings: { min: 0, max: 20 },
  customMg: { min: 0, max: 2000 },
  halfLifeH: { min: 1.5, max: 9.5 },
} as const

export type CaffeineBand = 'high' | 'near' | 'low'
export const caffeineBand = (pct: number): CaffeineBand => (pct > 25 ? 'high' : pct > 12.5 ? 'near' : 'low')

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
const blank = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export type CaffeineInput = Readonly<{
  servings: Readonly<Record<string, number>>
  customMg: number
  consumedAt: string
  bedtime: string
  halfLifeH: number
}>
export type CaffeineResult = Readonly<{
  invalid: readonly string[]
  totalDoseMg: number | null
  hoursUntilBed: number | null
  remainingMg: number | null
  pctAtBed: number | null
  band: CaffeineBand | null
  hoursTo12pct: number | null
  curve: readonly number[]
}>

export function decayCurve(doseMg: number, halfLifeH: number, hoursOut: number): number[] {
  const points: number[] = []
  for (let h = 0; h <= hoursOut; h++) points.push(doseMg * Math.pow(0.5, h / halfLifeH))
  return points
}

export function caffeineAtBedtime(input: CaffeineInput): CaffeineResult {
  const invalid: string[] = []
  let dose = 0
  for (const [label, n] of Object.entries(input.servings)) {
    const drink = CAFFEINE_DRINKS.find((d) => d.label === label)
    if (!drink) { invalid.push(`unknown drink: ${label}`); continue }
    if (blank(n)) continue
    if (!inRange(n, CAFFEINE_RANGES.servings.min, CAFFEINE_RANGES.servings.max)) { invalid.push(`${label} servings must be 0–20`); continue }
    dose += n * drink.mg
  }
  let custom = 0
  if (!blank(input.customMg)) {
    if (inRange(input.customMg, CAFFEINE_RANGES.customMg.min, CAFFEINE_RANGES.customMg.max)) custom = input.customMg
    else invalid.push('custom caffeine must be 0–2000 mg')
  }
  if (!inRange(input.halfLifeH, CAFFEINE_RANGES.halfLifeH.min, CAFFEINE_RANGES.halfLifeH.max)) invalid.push('half-life must be 1.5–9.5 hours')
  if (typeof input.consumedAt !== 'string' || !HHMM.test(input.consumedAt)) invalid.push('time consumed must be a valid HH:MM time')
  if (typeof input.bedtime !== 'string' || !HHMM.test(input.bedtime)) invalid.push('bedtime must be a valid HH:MM time')
  if (invalid.length > 0) return { invalid, totalDoseMg: null, hoursUntilBed: null, remainingMg: null, pctAtBed: null, band: null, hoursTo12pct: null, curve: [] }
  const totalDoseMg = dose + custom
  let hoursUntilBed = (minutes(input.bedtime) - minutes(input.consumedAt)) / 60
  if (hoursUntilBed < 0) hoursUntilBed += 24
  const remainingMg = totalDoseMg * Math.pow(0.5, hoursUntilBed / input.halfLifeH)
  const pctAtBed = totalDoseMg > 0 ? (remainingMg / totalDoseMg) * 100 : 0
  return {
    invalid, totalDoseMg, hoursUntilBed, remainingMg, pctAtBed, band: caffeineBand(pctAtBed),
    hoursTo12pct: input.halfLifeH * 3, curve: decayCurve(totalDoseMg, input.halfLifeH, 16),
  }
}
