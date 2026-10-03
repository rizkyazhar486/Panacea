/**
 * Fractional Excretion of Sodium (Espinel 1976): FeNa % = (UNa × PCr) / (PNa × UCr) × 100. Rumus dan pita (<1, 1–2, >2)
 * dipindahkan dari halaman tanpa perubahan; yang baru hanya penolakan masukan di luar rentang masuk akal. Sebelumnya
 * Na plasma 9999 atau kreatinin 500 lolos gerbang "> 0" dan menghasilkan FeNa palsu yang dibaca sebagai diagnosis
 * banding. UNa 0 sah (urin bebas natrium); kolom kosong (NaN) ditolak. Alat bantu skrining, bukan diagnosis.
 */
import { inRange } from './inputs'

export const FENA_RANGES = {
  urineNa: { min: 0, max: 300, name: 'Urine sodium', unit: ' mEq/L' },
  plasmaNa: { min: 90, max: 200, name: 'Plasma sodium', unit: ' mEq/L' },
  urineCr: { min: 1, max: 500, name: 'Urine creatinine', unit: ' mg/dL' },
  plasmaCr: { min: 0.1, max: 30, name: 'Plasma creatinine', unit: ' mg/dL' },
} as const

export type FenaTone = 'brand' | 'low' | 'critical'
export type FenaInput = Readonly<{ urineNa: number; plasmaNa: number; urineCr: number; plasmaCr: number }>
export type FenaResult =
  | { ok: true; data: { fena: number; band: { label: string; tone: FenaTone } } }
  | { ok: false; reason: string }

export function fenaBand(fena: number): { label: string; tone: FenaTone } {
  if (fena < 1) return { label: 'Prerenal azotemia likely', tone: 'brand' }
  if (fena <= 2) return { label: 'Indeterminate zone', tone: 'low' }
  return { label: 'Intrinsic renal injury (e.g. ATN) likely', tone: 'critical' }
}

export function fena(input: FenaInput): FenaResult {
  for (const key of ['urineNa', 'plasmaCr', 'plasmaNa', 'urineCr'] as const) {
    const { min, max, name, unit } = FENA_RANGES[key]
    if (!inRange(input[key], min, max)) return { ok: false, reason: `${name} must be ${min}–${max}${unit}` }
  }
  const value = ((input.urineNa * input.plasmaCr) / (input.plasmaNa * input.urineCr)) * 100
  return { ok: true, data: { fena: value, band: fenaBand(value) } }
}
