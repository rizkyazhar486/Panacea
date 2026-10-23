/**
 * Aritmetika dosis anak berbasis berat (mg/kg/hari → mg/dosis → mL/dosis sirup). Hanya aritmetika masukan pengguna:
 * tidak ada dosis, batas maksimum obat, atau indikasi di sini — itu milik formularium resmi dan klinisi.
 */
import { inRange, isFiniteNumber } from './inputs'

export type PedsDoseResult =
  | { ok: true; data: { totalDailyMg: number; perDoseMg: number; perDoseMl: number } }
  | { ok: false; reason: string }

export const PEDS_WEIGHT_KG = { min: 0.3, max: 200 } as const
export const PEDS_FREQUENCY_PER_DAY = { min: 1, max: 24 } as const

export function pedsDose(weightKg: number, doseMgPerKgPerDay: number, frequencyPerDay: number, concentrationMgPerMl: number): PedsDoseResult {
  if (!inRange(weightKg, PEDS_WEIGHT_KG.min, PEDS_WEIGHT_KG.max)) {
    return { ok: false, reason: `Weight must be ${PEDS_WEIGHT_KG.min}–${PEDS_WEIGHT_KG.max} kg` }
  }
  if (!isFiniteNumber(doseMgPerKgPerDay) || doseMgPerKgPerDay <= 0) return { ok: false, reason: 'Dose must be a number above 0 mg/kg/day' }
  if (!inRange(frequencyPerDay, PEDS_FREQUENCY_PER_DAY.min, PEDS_FREQUENCY_PER_DAY.max) || !Number.isInteger(frequencyPerDay)) {
    return { ok: false, reason: `Frequency must be a whole number of ${PEDS_FREQUENCY_PER_DAY.min}–${PEDS_FREQUENCY_PER_DAY.max} times per day` }
  }
  if (!isFiniteNumber(concentrationMgPerMl) || concentrationMgPerMl <= 0) return { ok: false, reason: 'Concentration must be a number above 0 mg/mL' }
  const totalDailyMg = weightKg * doseMgPerKgPerDay
  const perDoseMg = totalDailyMg / frequencyPerDay
  const perDoseMl = perDoseMg / concentrationMgPerMl
  // Masukan yang hanya "hingga dan > 0" dapat meluap (dosis 1e308, konsentrasi 1e-320): hasil yang tidak hingga bukan hasil. Tidak ada dosis maksimum di sini (milik formularium).
  if (![totalDailyMg, perDoseMg, perDoseMl].every(Number.isFinite)) return { ok: false, reason: 'Result is not a finite number — check the dose and concentration' }
  return { ok: true, data: { totalDailyMg, perDoseMg, perDoseMl } }
}
