/**
 * Kalsium terkoreksi albumin (Payne 1973, BMJ 4:643-646): Ca + 0,8 × (4,0 − albumin). Rumus, pembagian pita, dan
 * ambang dipindahkan dari halaman tanpa perubahan; yang baru hanya penolakan masukan di luar rentang. Kolom kosong
 * sebelumnya terbaca 0 lewat `Number(x) || 0`, sehingga nilai non-numerik diam-diam menjadi "belum diisi" dan nilai
 * negatif lolos. Alat bantu skrining: kalsium terionisasi terukur lebih andal pada pasien kritis atau borderline.
 */
import { inRange } from './inputs'

// Batas kewarasan masukan (bukan ambang klinis): menolak kosong (0), negatif, NaN, Infinity dan salah satuan (mmol/L terbaca mg/dL).
export const CA_RANGES = {
  totalCa: { min: 2, max: 25, name: 'Total calcium', unit: ' mg/dL' },
  albumin: { min: 0.5, max: 7, name: 'Albumin', unit: ' g/dL' },
} as const

export const PAYNE_SLOPE = 0.8
export const PAYNE_REFERENCE_ALBUMIN_G_DL = 4.0

export type CalciumTone = 'brand' | 'low' | 'critical'
export type CalciumBand = { label: string; tone: CalciumTone }
export type CorrectedCalciumInput = Readonly<{ totalCa: number; albumin: number }>
export type CorrectedCalciumResult =
  | { ok: true; data: { corrected: number; totalBand: CalciumBand; correctedBand: CalciumBand; changesCategory: boolean } }
  | { ok: false; reason: string }

export function calciumBand(ca: number): CalciumBand {
  if (ca < 7.0) return { label: 'Severe hypocalcemia', tone: 'critical' }
  if (ca < 8.5) return { label: 'Hypocalcemia', tone: 'low' }
  if (ca <= 10.5) return { label: 'Normal', tone: 'brand' }
  if (ca <= 12) return { label: 'Hypercalcemia', tone: 'low' }
  return { label: 'Severe hypercalcemia', tone: 'critical' }
}

export function correctedCalcium(input: CorrectedCalciumInput): CorrectedCalciumResult {
  for (const key of ['totalCa', 'albumin'] as const) {
    const { min, max, name, unit } = CA_RANGES[key]
    if (!inRange(input[key], min, max)) return { ok: false, reason: `${name} must be ${min}–${max}${unit}` }
  }
  const { totalCa, albumin } = input
  const corrected = totalCa + PAYNE_SLOPE * (PAYNE_REFERENCE_ALBUMIN_G_DL - albumin)
  const totalBand = calciumBand(totalCa)
  const correctedBand = calciumBand(corrected)
  return { ok: true, data: { corrected, totalBand, correctedBand, changesCategory: totalBand.label !== correctedBand.label } }
}
