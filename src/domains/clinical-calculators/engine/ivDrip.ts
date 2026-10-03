/**
 * Laju tetes infus: mL/jam dan tetes/menit = (volume × faktor tetes) / (jam × 60). Aritmetika masukan pengguna;
 * faktor tetes harus sesuai kemasan set infus yang dipakai (klinisi memastikan).
 */
import { inRange, isFiniteNumber } from './inputs'

export type IvDripResult =
  | { ok: true; data: { mlPerHour: number; dropsPerMin: number } }
  | { ok: false; reason: string }

export const DROP_FACTORS = [15, 20, 60] as const
export type DropFactor = (typeof DROP_FACTORS)[number]
// Batas kewarasan masukan (bukan ambang klinis).
export const IV_VOLUME_ML = { min: 1, max: 20000 } as const
export const IV_DURATION_HOURS = { min: 0.1, max: 168 } as const

export function ivDrip(volumeMl: number, hours: number, dropFactor: number): IvDripResult {
  if (!inRange(volumeMl, IV_VOLUME_ML.min, IV_VOLUME_ML.max)) return { ok: false, reason: `Volume must be ${IV_VOLUME_ML.min}–${IV_VOLUME_ML.max} mL` }
  if (!inRange(hours, IV_DURATION_HOURS.min, IV_DURATION_HOURS.max)) return { ok: false, reason: `Duration must be ${IV_DURATION_HOURS.min}–${IV_DURATION_HOURS.max} hours` }
  if (!isFiniteNumber(dropFactor) || !(DROP_FACTORS as readonly number[]).includes(dropFactor)) return { ok: false, reason: 'Drop factor must be 15, 20 or 60 drops/mL' }
  return { ok: true, data: { mlPerHour: volumeMl / hours, dropsPerMin: (volumeMl * dropFactor) / (hours * 60) } }
}
