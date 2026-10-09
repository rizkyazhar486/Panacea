/**
 * STOP-BANG (Chung et al., Anesthesiology 2008;108:812-821): skrining risiko apnea tidur obstruktif, 8 butir × 1 poin.
 * Ambang BANG (IMT >35, usia >50, leher >40 cm), pita 0–2/3–4/5–8 dan teks pita dipindahkan dari halaman tanpa perubahan.
 * Yang baru: usia, IMT, dan lingkar leher diperiksa rentangnya ("belum diisi" dipisahkan dari "di luar rentang"; dulu
 * usia 500 atau leher 1e6 lolos gerbang `> 0` dan menambah poin). Jenis kelamin yang belum dijawab tetap menahan skor,
 * karena satu poin BANG memindahkan ambang 3 dan 5. Rentang = batas kewajaran masukan, BUKAN ambang klinis.
 * Empat butir STOP yang tidak dicentang bernilai nol poin. Skrining, bukan diagnosis.
 */
import { inRange } from './inputs'

export const STOP_BANG_RANGES = {
  age: { min: 18, max: 120, name: 'age', unit: ' years' },
  bmi: { min: 10, max: 80, name: 'BMI', unit: ' kg/m²' },
  neckCm: { min: 15, max: 80, name: 'neck circumference', unit: ' cm' },
} as const
type Field = keyof typeof STOP_BANG_RANGES

export const STOP_KEYS = ['snoring', 'tired', 'observed', 'pressure'] as const
export type StopKey = (typeof STOP_KEYS)[number]
export type StopBangSex = 'M' | 'F' | ''
export type StopBangTone = 'brand' | 'low' | 'critical'
export type StopBangBand = Readonly<{ label: string; tone: StopBangTone; desc: string }>

export function stopBangBand(score: number): StopBangBand {
  if (score <= 2) return { label: 'Low risk', tone: 'brand', desc: 'Low probability of moderate-to-severe OSA on this screen.' }
  if (score <= 4) return { label: 'Intermediate risk', tone: 'low', desc: 'Intermediate probability — discuss with a clinician; further testing (e.g. home sleep apnea test or polysomnography) may be warranted, especially if BMI/neck circumference/male gender criteria are also present.' }
  return { label: 'High risk', tone: 'critical', desc: 'High probability of moderate-to-severe OSA — referral for a sleep study (polysomnography or validated home sleep apnea test) is recommended.' }
}

export type StopBangInput = Readonly<{
  age: number; bmi: number; neckCm: number; sex: StopBangSex
  stop: Readonly<Record<StopKey, boolean>>
}>
export type StopBangResult = Readonly<{
  missing: readonly string[]
  invalid: readonly string[]
  stopScore: number | null
  bangScore: number | null
  total: number | null
  band: StopBangBand | null
}>

const isEmpty = (v: unknown) => typeof v === 'number' && Number.isNaN(v)

export function stopBang(input: StopBangInput): StopBangResult {
  const missing: string[] = []
  const invalid: string[] = []
  const ok: Partial<Record<Field, number>> = {}
  if (input.sex === '') missing.push('sex')
  else if (input.sex !== 'M' && input.sex !== 'F') invalid.push('sex must be M or F')
  for (const k of ['age', 'bmi', 'neckCm'] as const) {
    const { min, max, name, unit } = STOP_BANG_RANGES[k]
    const v = input[k]
    if (isEmpty(v)) { missing.push(name); continue }
    if (!inRange(v, min, max)) { invalid.push(`${name} must be ${min}–${max}${unit}`); continue }
    ok[k] = v
  }
  for (const k of STOP_KEYS) if (typeof input.stop?.[k] !== 'boolean') invalid.push(`${k} must be yes or no`)
  if (missing.length > 0 || invalid.length > 0) return { missing, invalid, stopScore: null, bangScore: null, total: null, band: null }
  const stopScore = STOP_KEYS.reduce((s, k) => s + (input.stop[k] ? 1 : 0), 0)
  const bangScore = ((ok.bmi as number) > 35 ? 1 : 0) + ((ok.age as number) > 50 ? 1 : 0) + ((ok.neckCm as number) > 40 ? 1 : 0) + (input.sex === 'M' ? 1 : 0)
  const total = stopScore + bangScore
  return { missing, invalid, stopScore, bangScore, total, band: stopBangBand(total) }
}
