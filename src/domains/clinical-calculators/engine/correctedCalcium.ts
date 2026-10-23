/**
 * Kalsium terkoreksi albumin (Payne et al., BMJ 1973;4:643-6): Ca terkoreksi (mg/dL) = Ca total + 0,8 × (4,0 − albumin g/dL).
 * Pita (<7,0 berat rendah; <8,5 rendah; ≤10,5 normal; ≤12 tinggi; >12 berat tinggi) dan rumus dipindahkan dari halaman tanpa
 * perubahan. Yang baru: tiap nilai diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang". Dulu kalsium
 * 5000 atau albumin 0,01 lolos gerbang `> 0` dan menghasilkan koreksi raksasa dengan pita. Rentang adalah batas kewajaran
 * masukan, BUKAN ambang klinis. Alat bantu; kalsium terionisasi terukur lebih andal pada kasus kritis/borderline.
 */
import { inRange } from './inputs'

export const CA_RANGES = {
  totalCa: { min: 2, max: 20, name: 'measured total calcium', unit: ' mg/dL' },
  albumin: { min: 0.5, max: 7, name: 'serum albumin', unit: ' g/dL' },
} as const
type Field = keyof typeof CA_RANGES

export type CaTone = 'brand' | 'low' | 'critical'
export type CaBand = Readonly<{ label: string; tone: CaTone }>

export function calciumBand(ca: number): CaBand {
  if (ca < 7.0) return { label: 'Severe hypocalcemia', tone: 'critical' }
  if (ca < 8.5) return { label: 'Hypocalcemia', tone: 'low' }
  if (ca <= 10.5) return { label: 'Normal', tone: 'brand' }
  if (ca <= 12) return { label: 'Hypercalcemia', tone: 'low' }
  return { label: 'Severe hypercalcemia', tone: 'critical' }
}

export type CorrectedCalciumResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  corrected: number | null
  totalBand: CaBand | null
  correctedBand: CaBand | null
  changesCategory: boolean | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function correctedCalcium(input: Readonly<{ totalCa: number; albumin: number }>): CorrectedCalciumResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(CA_RANGES) as Field[]) {
    const { min, max, name, unit } = CA_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, corrected: null, totalBand: null, correctedBand: null, changesCategory: null }
  const totalCa = ok.totalCa as number
  const corrected = totalCa + 0.8 * (4.0 - (ok.albumin as number))
  const totalBand = calciumBand(totalCa)
  const correctedBand = calciumBand(corrected)
  return { missing, invalid, corrected, totalBand, correctedBand, changesCategory: totalBand.label !== correctedBand.label }
}
