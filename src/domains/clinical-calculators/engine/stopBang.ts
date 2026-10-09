/**
 * STOP-Bang (Chung et al., Anesthesiology 2008;108:812-821): skrining risiko apnea tidur obstruktif, 8 butir × 1 poin.
 * Ambang BMI >35, usia >50, lingkar leher >40 cm, dan pita 0-2 / 3-4 / 5-8 dipindahkan dari halaman tanpa perubahan.
 * Yang baru: usia, BMI, dan lingkar leher diperiksa rentangnya dan "belum diisi" dipisahkan dari "di luar rentang" (dulu
 * `Number(x) || 0` menelan teks tak terbaca menjadi 0, dan BMI 9000 diam-diam memberi poin). Jenis kelamin membawa satu poin
 * sendiri, jadi tanpa jawaban skor TIDAK dihitung. Rentang = batas kewajaran masukan, BUKAN ambang klinis. Skrining, bukan diagnosis.
 */
import { inRange } from './inputs'

export const STOP_BANG_RANGES = {
  age: { min: 18, max: 120, name: 'age', unit: ' years' },
  bmi: { min: 10, max: 80, name: 'BMI', unit: ' kg/m²' },
  neckCm: { min: 15, max: 80, name: 'neck circumference', unit: ' cm' },
} as const
type Field = keyof typeof STOP_BANG_RANGES

export const STOP_KEYS = ['snoring', 'tired', 'observed', 'pressure'] as const
export type StopKey = typeof STOP_KEYS[number]
export type StopBangSex = 'M' | 'F'
export type StopBangTone = 'brand' | 'low' | 'critical'
export type StopBangBand = Readonly<{ label: string; tone: StopBangTone; desc: string }>

export function stopBangBand(score: number): StopBangBand {
  if (score <= 2) return { label: 'Low risk', tone: 'brand', desc: 'Low probability of moderate-to-severe OSA on this screen.' }
  if (score <= 4) return { label: 'Intermediate risk', tone: 'low', desc: 'Intermediate probability — discuss with a clinician; further testing (e.g. home sleep apnea test or polysomnography) may be warranted, especially if BMI/neck circumference/male gender criteria are also present.' }
  return { label: 'High risk', tone: 'critical', desc: 'High probability of moderate-to-severe OSA — referral for a sleep study (polysomnography or validated home sleep apnea test) is recommended.' }
}

export type StopBangInput = Readonly<{
  /** Butir STOP: tidak dicentang = tidak = 0 poin (jawaban sah). */
  answers: Readonly<Partial<Record<StopKey, boolean>>>
  age: number; bmi: number; neckCm: number
  /** Kosong ('') = belum dijawab. */
  sex: StopBangSex | ''
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

export function stopBang(input: StopBangInput): StopBangResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  for (const k of Object.keys(STOP_BANG_RANGES) as Field[]) {
    const { min, max, name, unit } = STOP_BANG_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  if (input.sex === '') missing.push('sex')
  else if (input.sex !== 'M' && input.sex !== 'F') invalid.push('sex must be M or F')
  for (const k of STOP_KEYS) {
    const a = input.answers[k]
    if (a !== undefined && typeof a !== 'boolean') invalid.push(`${k} must be yes or no`)
  }
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, stop: null, bang: null, total: null, band: null }
  const stop = STOP_KEYS.reduce((s, k) => s + (input.answers[k] === true ? 1 : 0), 0)
  const bang = ((ok.bmi as number) > 35 ? 1 : 0) + ((ok.age as number) > 50 ? 1 : 0) + ((ok.neckCm as number) > 40 ? 1 : 0) + (input.sex === 'M' ? 1 : 0)
  const total = stop + bang
  return { missing, invalid, stop, bang, total, band: stopBangBand(total) }
}
