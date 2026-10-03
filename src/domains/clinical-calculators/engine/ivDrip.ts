/**
 * Laju tetes infus: mL/jam = volume / jam; tetes/menit = volume × faktor-tetes / (jam × 60).
 * Aritmetika murni (tampilan pendukung keputusan, bukan order); tidak ada batas laju klinis yang diciptakan.
 */
import { inRange, isFiniteNumber } from './inputs'

export type IvDripResult =
  | { ok: true; data: { mlPerHour: number; dropsPerMin: number } }
  | { ok: false; reason: string }

// Batas kewarasan masukan (bukan ambang klinis): volume 1 mL–10 L, durasi 1 menit–7 hari.
export const IV_VOLUME_ML = { min: 1, max: 10000 } as const
export const IV_DURATION_HOURS = { min: 1 / 60, max: 168 } as const
// Faktor tetes yang ditawarkan antarmuka: 15/20 = set makro, 60 = set mikro.
export const IV_DROP_FACTORS = [15, 20, 60] as const

export function ivDrip(volumeMl: number, hours: number, dropFactor: number): IvDripResult {
  if (!inRange(volumeMl, IV_VOLUME_ML.min, IV_VOLUME_ML.max)) {
    return { ok: false, reason: `Volume must be ${IV_VOLUME_ML.min}–${IV_VOLUME_ML.max} mL` }
  }
  if (!inRange(hours, IV_DURATION_HOURS.min, IV_DURATION_HOURS.max)) {
    return { ok: false, reason: `Duration must be 1 minute to ${IV_DURATION_HOURS.max} hours` }
  }
  if (!isFiniteNumber(dropFactor) || !(IV_DROP_FACTORS as readonly number[]).includes(dropFactor)) {
    return { ok: false, reason: `Drop factor must be one of ${IV_DROP_FACTORS.join(', ')} drops/mL` }
  }
  return { ok: true, data: { mlPerHour: volumeMl / hours, dropsPerMin: (volumeMl * dropFactor) / (hours * 60) } }
}
