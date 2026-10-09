/**
 * FeNa — fractional excretion of sodium (Espinel 1976, JAMA 236(6):579-581):
 * FeNa % = (UNa × PCr) / (PNa × UCr) × 100. Pita halaman dipindahkan tanpa perubahan: <1 prarenal, 1–2 (inklusif) tak tentu,
 * >2 intrinsik. Yang baru: setiap bacaan harus terisi dan masuk rentang kewajaran masukan (bukan ambang klinis) sebelum ada
 * angka atau pita; kolom kosong dulu terbaca 0 dan tidak pernah menghasilkan diagnosis banding. Tidak valid setelah diuretik —
 * bendera `onDiuretics` hanya menambah peringatan, tidak mengubah angka. Alat bantu keputusan, bukan diagnosis.
 */
import { inRange } from './inputs'

export const FENA_RANGES = {
  urineNa: { min: 1, max: 400, name: 'urine sodium', unit: ' mEq/L' },
  plasmaNa: { min: 100, max: 180, name: 'plasma sodium', unit: ' mEq/L' },
  urineCr: { min: 1, max: 600, name: 'urine creatinine', unit: ' mg/dL' },
  plasmaCr: { min: 0.1, max: 30, name: 'plasma creatinine', unit: ' mg/dL' },
} as const
type Field = keyof typeof FENA_RANGES

export type FenaTone = 'brand' | 'low' | 'critical'
export type FenaBand = Readonly<{ label: string; tone: FenaTone }>

export function fenaBand(fena: number): FenaBand {
  if (fena < 1) return { label: 'Prerenal azotemia likely', tone: 'brand' }
  if (fena <= 2) return { label: 'Indeterminate zone', tone: 'low' }
  return { label: 'Intrinsic renal injury (e.g. ATN) likely', tone: 'critical' }
}

export type FenaInput = Readonly<Record<Field, number>>
export type FenaResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  fena: number | null
  band: FenaBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function fena(input: FenaInput): FenaResult {
  const missing: string[] = []
  const invalid: string[] = []
  for (const k of Object.keys(FENA_RANGES) as Field[]) {
    const { min, max, name, unit } = FENA_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) missing.push(name)
    else if (!inRange(v, min, max)) invalid.push(`${name} must be ${min}–${max}${unit}`)
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, fena: null, band: null }
  const value = (input.urineNa * input.plasmaCr) / (input.plasmaNa * input.urineCr) * 100
  return { missing, invalid, fena: value, band: fenaBand(value) }
}
