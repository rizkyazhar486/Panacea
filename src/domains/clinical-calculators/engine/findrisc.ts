/**
 * FINDRISC (Lindström & Tuomilehto, Diabetes Care 2003;26:725-731): skor risiko diabetes tipe 2 10 tahun tanpa tes darah.
 * Poin usia/IMT/lingkar pinggang, pita, dan persentase risiko dipindahkan dari halaman tanpa perubahan. Yang baru: usia, IMT, dan
 * lingkar pinggang diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang" (dulu usia 500 atau pinggang 9000 lolos
 * gerbang `> 0` dan menghasilkan persentase risiko). Rentang = batas kewajaran masukan, BUKAN ambang klinis. Pertanyaan ya/tidak
 * tetap bernilai nol poin bila tidak dicentang. Skrining pencegahan, bukan diagnosis.
 */
import { inRange } from './inputs'

export const FINDRISC_RANGES = {
  age: { min: 18, max: 120, name: 'age', unit: ' years' },
  bmi: { min: 10, max: 80, name: 'BMI', unit: ' kg/m²' },
  waist: { min: 30, max: 250, name: 'waist circumference', unit: ' cm' },
} as const
type Field = keyof typeof FINDRISC_RANGES

export type FindriscSex = 'M' | 'F'
export type FindriscFamily = 0 | 3 | 5
export type FindriscTone = 'brand' | 'low' | 'critical'
export type FindriscBand = Readonly<{ label: string; tone: FindriscTone; risk: string }>

export const agePts = (a: number): number => (a < 45 ? 0 : a <= 54 ? 2 : a <= 64 ? 3 : 4)
export const bmiPts = (bmi: number): number => (bmi < 25 ? 0 : bmi <= 30 ? 1 : 3)
export function waistPts(cm: number, sex: FindriscSex): number {
  if (sex === 'M') return cm < 94 ? 0 : cm <= 102 ? 3 : 4
  return cm < 80 ? 0 : cm <= 88 ? 3 : 4
}

export function findriscBand(score: number): FindriscBand {
  if (score < 7) return { label: 'Low', tone: 'brand', risk: '~1% develop diabetes within 10 years' }
  if (score <= 11) return { label: 'Slightly elevated', tone: 'brand', risk: '~4% develop diabetes within 10 years' }
  if (score <= 14) return { label: 'Moderate', tone: 'low', risk: '~17% develop diabetes within 10 years' }
  if (score <= 20) return { label: 'High', tone: 'critical', risk: '~33% develop diabetes within 10 years' }
  return { label: 'Very high', tone: 'critical', risk: '~50% develop diabetes within 10 years' }
}

export type FindriscInput = Readonly<{
  age: number; bmi: number; waist: number; sex: FindriscSex
  active: boolean; veg: boolean; bpMed: boolean; highGlucose: boolean; family: FindriscFamily
}>
export type FindriscResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  score: number | null
  band: FindriscBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function findrisc(input: FindriscInput): FindriscResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(FINDRISC_RANGES) as Field[]) {
    const { min, max, name, unit } = FINDRISC_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (input.sex !== 'M' && input.sex !== 'F') invalid.push('sex must be M or F')
  if (input.family !== 0 && input.family !== 3 && input.family !== 5) invalid.push('family history must be 0, 3 or 5 points')
  for (const k of ['active', 'veg', 'bpMed', 'highGlucose'] as const) if (typeof input[k] !== 'boolean') invalid.push(`${k} must be yes or no`)
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, score: null, band: null }
  const score =
    agePts(ok.age as number) + bmiPts(ok.bmi as number) + waistPts(ok.waist as number, input.sex) +
    (input.active ? 0 : 2) + (input.veg ? 0 : 1) + (input.bpMed ? 2 : 0) + (input.highGlucose ? 5 : 0) + input.family
  return { missing, invalid, score, band: findriscBand(score) }
}
