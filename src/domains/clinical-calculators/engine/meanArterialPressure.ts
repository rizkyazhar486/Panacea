/**
 * Mean arterial pressure (MAP) = (sistolik + 2 × diastolik) / 3. Murni dan deterministik.
 * Ambang kategori dipindahkan tanpa perubahan dari halaman kalkulator (<60 sangat rendah, 60–100 normal, >100 tinggi);
 * target MAP ≥65 pada syok septik adalah catatan, bukan ambang yang dihitung di sini.
 * Rentang masukan adalah batas masuk akal untuk menolak salah ketik, bukan batas klinis.
 */
import { isFiniteNumber as finite } from './inputs'

export type MapTone = 'critical' | 'normal' | 'low'

export type MapResult =
  | { ok: true; data: { map: number; label: string; tone: MapTone; note: string } }
  | { ok: false; reason: string }

export const SYSTOLIC_MMHG = { min: 40, max: 300 } as const
export const DIASTOLIC_MMHG = { min: 20, max: 200 } as const

export function meanArterialPressure(systolic: number, diastolic: number): MapResult {
  if (!finite(systolic) || systolic < SYSTOLIC_MMHG.min || systolic > SYSTOLIC_MMHG.max) {
    return { ok: false, reason: `Systolic must be ${SYSTOLIC_MMHG.min}–${SYSTOLIC_MMHG.max} mmHg` }
  }
  if (!finite(diastolic) || diastolic < DIASTOLIC_MMHG.min || diastolic > DIASTOLIC_MMHG.max) {
    return { ok: false, reason: `Diastolic must be ${DIASTOLIC_MMHG.min}–${DIASTOLIC_MMHG.max} mmHg` }
  }
  if (diastolic >= systolic) return { ok: false, reason: 'Diastolic must be lower than systolic' }
  const map = (systolic + 2 * diastolic) / 3
  if (map < 60) return { ok: true, data: { map, label: 'Very low', tone: 'critical', note: 'Organ perfusion at risk of being impaired — evaluate for shock/hypoperfusion.' } }
  if (map <= 100) return { ok: true, data: { map, label: 'Normal', tone: 'normal', note: 'Generally sufficient for organ perfusion (target MAP ≥65 in septic shock).' } }
  return { ok: true, data: { map, label: 'High', tone: 'low', note: 'Evaluate for hypertension / hypertensive crisis if very high.' } }
}
