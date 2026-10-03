/**
 * Holliday-Segar maintenance fluid (4-2-1): 100 mL/kg untuk 10 kg pertama, +50 mL/kg untuk 10 kg kedua,
 * +20 mL/kg untuk setiap kg di atas 20. Tampilan pendukung keputusan, bukan order.
 */
import { inRange } from './inputs'

export type HollidaySegarResult =
  | { ok: true; data: { mlPerDay: number; mlPerHour: number } }
  | { ok: false; reason: string }

// Batas kewarasan masukan (bukan ambang klinis): bayi sangat prematur sampai dewasa sangat berat.
export const MAINTENANCE_WEIGHT_KG = { min: 0.3, max: 300 } as const

export function hollidaySegar(weightKg: number): HollidaySegarResult {
  if (!inRange(weightKg, MAINTENANCE_WEIGHT_KG.min, MAINTENANCE_WEIGHT_KG.max)) {
    return { ok: false, reason: `Weight must be ${MAINTENANCE_WEIGHT_KG.min}–${MAINTENANCE_WEIGHT_KG.max} kg` }
  }
  const mlPerDay = weightKg <= 10 ? weightKg * 100 : weightKg <= 20 ? 1000 + (weightKg - 10) * 50 : 1500 + (weightKg - 20) * 20
  return { ok: true, data: { mlPerDay, mlPerHour: mlPerDay / 24 } }
}
