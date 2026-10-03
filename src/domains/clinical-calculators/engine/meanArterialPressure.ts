/**
 * MAP = (sistolik + 2 × diastolik) / 3, dengan label interpretasi yang dipindahkan dari halaman tanpa perubahan ambang
 * (< 60 sangat rendah, ≤ 100 normal, di atasnya tinggi). Tampilan pendukung keputusan, bukan diagnosis.
 */
import { inRange } from './inputs'

// Batas kewarasan masukan (bukan ambang klinis).
export const SYSTOLIC_MMHG = { min: 40, max: 300 } as const
export const DIASTOLIC_MMHG = { min: 20, max: 200 } as const

export type MapTone = 'normal' | 'low' | 'critical'
export type MapResult =
  | { ok: true; data: { map: number; label: string; tone: MapTone; note: string } }
  | { ok: false; reason: string }

export function meanArterialPressure(systolic: number, diastolic: number): MapResult {
  if (!inRange(systolic, SYSTOLIC_MMHG.min, SYSTOLIC_MMHG.max)) return { ok: false, reason: `Systolic must be ${SYSTOLIC_MMHG.min}–${SYSTOLIC_MMHG.max} mmHg` }
  if (!inRange(diastolic, DIASTOLIC_MMHG.min, DIASTOLIC_MMHG.max)) return { ok: false, reason: `Diastolic must be ${DIASTOLIC_MMHG.min}–${DIASTOLIC_MMHG.max} mmHg` }
  // Tekanan nadi nol atau negatif tidak mungkin secara fisik; hampir selalu salah ketik atau tertukar.
  if (systolic <= diastolic) return { ok: false, reason: 'Systolic must be higher than diastolic' }
  const map = (systolic + 2 * diastolic) / 3
  const interp = map < 60
    ? { label: 'Very low', tone: 'critical' as const, note: 'Organ perfusion at risk of being impaired — evaluate for shock/hypoperfusion.' }
    : map <= 100
    ? { label: 'Normal', tone: 'normal' as const, note: 'Generally sufficient for organ perfusion (target MAP ≥65 in septic shock).' }
    : { label: 'High', tone: 'low' as const, note: 'Evaluate for hypertension / hypertensive crisis if very high.' }
  return { ok: true, data: { map, ...interp } }
}
