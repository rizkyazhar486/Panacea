/**
 * STOP-BANG (Chung et al., Anesthesiology 2008;108:812-821): 8 butir ya/tidak, 1 poin masing-masing.
 * STOP = 4 jawaban; BANG = IMT > 35 kg/m², usia > 50 th, lingkar leher > 40 cm, jenis kelamin laki-laki.
 * Pita: 0–2 rendah, 3–4 sedang, 5–8 tinggi. Skor hanya keluar bila keempat masukan BANG terisi dan masuk akal;
 * masukan yang hilang/di luar rentang menolak (tidak diam-diam 0 poin atau poin laki-laki). Rentang = batas kewajaran
 * masukan, BUKAN ambang klinis; ini skrining, bukan diagnosis.
 */
import { inRange } from './inputs'

export const STOP_BANG_RANGES = {
  bmi: { min: 10, max: 100 },
  ageYears: { min: 18, max: 120 },
  neckCm: { min: 20, max: 80 },
} as const

export type StopBangBand = 'low' | 'intermediate' | 'high'
export type StopBangInput = { stop: readonly boolean[]; bmi: number; ageYears: number; neckCm: number; sex: 'M' | 'F' | '' }
export type StopBangResult =
  | { ok: true; stopScore: number; bangScore: number; total: number; band: StopBangBand }
  | { ok: false; missing: string[]; invalid: string[] }

export function stopBang(i: StopBangInput): StopBangResult {
  const missing: string[] = []
  const invalid: string[] = []
  const check = (label: string, v: number, r: { min: number; max: number }) => {
    if (typeof v === 'number' && Number.isNaN(v)) missing.push(label)
    else if (!inRange(v, r.min, r.max)) invalid.push(label)
  }
  if (!Array.isArray(i.stop) || i.stop.length !== 4 || i.stop.some((b) => typeof b !== 'boolean')) invalid.push('STOP answers')
  if (i.sex !== 'M' && i.sex !== 'F') missing.push('sex')
  check('BMI', i.bmi, STOP_BANG_RANGES.bmi)
  check('age', i.ageYears, STOP_BANG_RANGES.ageYears)
  check('neck circumference', i.neckCm, STOP_BANG_RANGES.neckCm)
  if (missing.length || invalid.length) return { ok: false, missing, invalid }
  const stopScore = i.stop.filter(Boolean).length
  const bangScore = (i.bmi > 35 ? 1 : 0) + (i.ageYears > 50 ? 1 : 0) + (i.neckCm > 40 ? 1 : 0) + (i.sex === 'M' ? 1 : 0)
  const total = stopScore + bangScore
  return { ok: true, stopScore, bangScore, total, band: total <= 2 ? 'low' : total <= 4 ? 'intermediate' : 'high' }
}
