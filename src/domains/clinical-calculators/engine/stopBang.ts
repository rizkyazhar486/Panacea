/**
 * STOP-BANG (Chung et al., 2008, Anesthesiology 108(5):812-821): 8 item ya/tidak, 1 poin tiap item, total 0–8; pita 0–2 rendah,
 * 3–4 menengah, 5–8 tinggi. Ambang BANG (IMT > 35, usia > 50, lingkar leher > 40 cm, pria) dipindahkan dari halaman tanpa perubahan.
 * Yang baru: IMT, usia dan lingkar leher diperiksa rentang kewajarannya sebelum diberi poin. Dulu `Number(x) || 0` + `> 0` membuat
 * lingkar leher 400 cm atau IMT 9999 mendapat poin seolah pengukuran sah. Rentang = batas kewajaran masukan, BUKAN ambang klinis.
 * Alat penapisan terbit, bukan diagnosis; keputusan tetap pada klinisi.
 */
import { inRange } from './inputs'

export const STOP_BANG_RANGES = {
  bmi: { min: 10, max: 100, name: 'BMI', unit: ' kg/m²' },
  age: { min: 10, max: 120, name: 'age', unit: ' years' },
  neckCm: { min: 20, max: 100, name: 'neck circumference', unit: ' cm' },
} as const
type Field = keyof typeof STOP_BANG_RANGES

export const STOP_BANG_THRESHOLDS = { bmi: 35, age: 50, neckCm: 40 } as const

export type StopBangBand = 'low' | 'intermediate' | 'high'
export type StopBangInput = Readonly<{
  snoring: boolean; tired: boolean; observed: boolean; pressure: boolean
  bmi: number; age: number; neckCm: number
  /** '' = belum dijawab: jenis kelamin membawa satu poin sendiri, jadi tidak boleh ditebak. */
  sex: 'M' | 'F' | ''
}>
export type StopBangResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  stop: number | null
  bang: number | null
  total: number | null
  band: StopBangBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)
const NONE = { stop: null, bang: null, total: null, band: null } as const

export function stopBangBand(total: number): StopBangBand {
  return total <= 2 ? 'low' : total <= 4 ? 'intermediate' : 'high'
}

export function stopBang(input: StopBangInput): StopBangResult {
  const missing: string[] = []
  const invalid: string[] = []
  if (input.sex !== 'M' && input.sex !== 'F') missing.push('sex')
  for (const k of Object.keys(STOP_BANG_RANGES) as Field[]) {
    const { min, max, name, unit } = STOP_BANG_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) missing.push(name)
    else if (!inRange(v, min, max)) invalid.push(`${name} must be ${min}–${max}${unit}`)
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, ...NONE }
  const stop = [input.snoring, input.tired, input.observed, input.pressure].filter(Boolean).length
  const bang = (input.bmi > STOP_BANG_THRESHOLDS.bmi ? 1 : 0) + (input.age > STOP_BANG_THRESHOLDS.age ? 1 : 0) +
    (input.neckCm > STOP_BANG_THRESHOLDS.neckCm ? 1 : 0) + (input.sex === 'M' ? 1 : 0)
  const total = stop + bang
  return { missing, invalid, stop, bang, total, band: stopBangBand(total) }
}
