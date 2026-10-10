/**
 * STOP-BANG (Chung et al., 2008, Anesthesiology 108(5):812-821): skrining risiko OSA, 8 butir × 1 poin. Aturan skor
 * (BMI > 35, usia > 50, leher > 40 cm, laki-laki) dan pita (0–2 / 3–4 / 5–8) dipindahkan dari halaman tanpa perubahan.
 * Yang baru: tiap masukan diperiksa rentangnya (dulu leher 400 cm atau BMI 9999 tetap memberi poin), dan "belum diisi"
 * dipisahkan dari "di luar rentang". Rentang = batas kewajaran masukan, BUKAN ambang klinis; alat ini skrining, bukan diagnosis.
 */
import { inRange } from './inputs'

export const STOPBANG_RANGES = {
  bmi: { min: 10, max: 80, name: 'BMI', unit: ' kg/m²' },
  age: { min: 18, max: 120, name: 'age', unit: ' years' },
  neckCm: { min: 20, max: 80, name: 'neck circumference', unit: ' cm' },
} as const
type Field = keyof typeof STOPBANG_RANGES

export const STOPBANG_THRESHOLDS = { bmi: 35, age: 50, neckCm: 40 } as const
export const STOP_KEYS = ['snoring', 'tired', 'observed', 'pressure'] as const

export type StopBangSex = 'M' | 'F' | ''
export type StopBangTone = 'brand' | 'low' | 'critical'
export type StopBangInput = Readonly<{ stop: Readonly<Record<string, boolean>>; sex: StopBangSex } & Record<Field, number>>
export type StopBangResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  stopScore: number
  bangScore: number | null
  total: number | null
  band: Readonly<{ label: string; tone: StopBangTone }> | null
}>

export function stopBangBand(total: number): { label: string; tone: StopBangTone } {
  if (total <= 2) return { label: 'Low risk', tone: 'brand' }
  if (total <= 4) return { label: 'Intermediate risk', tone: 'low' }
  return { label: 'High risk', tone: 'critical' }
}

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function stopBang(input: StopBangInput): StopBangResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(STOPBANG_RANGES) as Field[]) {
    const { min, max, name, unit } = STOPBANG_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  // Jenis kelamin membawa satu poin BANG sendiri, jadi tidak boleh diisi tebakan.
  if (input.sex !== 'M' && input.sex !== 'F') missing.push('sex')
  const stopScore = STOP_KEYS.reduce((s, k) => s + (input.stop[k] === true ? 1 : 0), 0)
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, stopScore, bangScore: null, total: null, band: null }
  const bangScore = (ok.bmi! > STOPBANG_THRESHOLDS.bmi ? 1 : 0) + (ok.age! > STOPBANG_THRESHOLDS.age ? 1 : 0)
    + (ok.neckCm! > STOPBANG_THRESHOLDS.neckCm ? 1 : 0) + (input.sex === 'M' ? 1 : 0)
  const total = stopScore + bangScore
  return { missing, invalid, stopScore, bangScore, total, band: stopBangBand(total) }
}
