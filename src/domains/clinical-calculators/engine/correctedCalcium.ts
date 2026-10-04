/**
 * Kalsium terkoreksi albumin (Payne et al. 1973, BMJ 4:643): Ca koreksi = Ca total + 0.8 × (4.0 − albumin g/dL).
 * Rumus dan pita (<7.0 / <8.5 / ≤10.5 / ≤12 mg/dL) dipindahkan dari halaman tanpa perubahan. Yang baru: "belum diisi"
 * dipisahkan dari "di luar rentang" (dulu Ca 999 atau albumin 50 lolos gerbang `> 0` dan menghasilkan kategori), dan
 * hasil hanya ada bila kedua nilai lab sah. Alat bantu, bukan diagnosis; kalsium terionisasi terukur lebih andal.
 */
import { inRange } from './inputs'

export const CALCIUM_RANGES = {
  totalCa: { min: 1, max: 25, name: 'total calcium', unit: ' mg/dL' },
  albumin: { min: 0.5, max: 7, name: 'albumin', unit: ' g/dL' },
} as const

export type CalciumTone = 'brand' | 'low' | 'critical'
export type CalciumBand = Readonly<{ label: string; tone: CalciumTone }>
export type CalciumInput = Readonly<{ totalCa: number; albumin: number }>
export type CalciumResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  corrected: number | null
  totalBand: CalciumBand | null
  correctedBand: CalciumBand | null
  changesCategory: boolean
}>

export function calciumBand(ca: number): CalciumBand {
  if (ca < 7.0) return { label: 'Severe hypocalcemia', tone: 'critical' }
  if (ca < 8.5) return { label: 'Hypocalcemia', tone: 'low' }
  if (ca <= 10.5) return { label: 'Normal', tone: 'brand' }
  if (ca <= 12) return { label: 'Hypercalcemia', tone: 'low' }
  return { label: 'Severe hypercalcemia', tone: 'critical' }
}

export function correctedCalcium(i: CalciumInput): CalciumResult {
  const missing: string[] = []
  const invalid: string[] = []
  for (const k of ['totalCa', 'albumin'] as const) {
    const r = CALCIUM_RANGES[k]
    const v: unknown = i[k]
    if (typeof v === 'number' && Number.isNaN(v)) missing.push(`measured ${r.name}`)
    else if (!inRange(v, r.min, r.max)) invalid.push(`${r.name} must be ${r.min}–${r.max}${r.unit}`)
  }
  if (missing.length || invalid.length) return { missing, invalid, corrected: null, totalBand: null, correctedBand: null, changesCategory: false }
  const corrected = i.totalCa + 0.8 * (4.0 - i.albumin)
  const totalBand = calciumBand(i.totalCa)
  const correctedBand = calciumBand(corrected)
  return { missing, invalid, corrected, totalBand, correctedBand, changesCategory: totalBand.label !== correctedBand.label }
}
