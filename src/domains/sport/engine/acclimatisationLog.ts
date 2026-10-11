/**
 * Validasi masukan log aklimatisasi panas/ketinggian. Sebelumnya `Number(x) || 0` membuat kolom kosong tersimpan ke
 * localStorage sebagai paparan 0 °C / 0 menit / 0 m, dan kartu penalti ketinggian menampilkan "−0%" untuk kolom
 * kosong seolah-olah ketinggian laut. Rentang = kewajaran masukan (bukan ambang fisiologis; ambang 27 °C/30 menit
 * dan 1500 m tetap di `lib/enduranceTools`).
 */
import { inRange } from '../../clinical-calculators/engine/inputs'

export const HEAT_TEMP_C = { min: 0, max: 60 } as const
export const HEAT_MINUTES = { min: 1, max: 1440 } as const
export const ALTITUDE_M = { min: 0, max: 8900 } as const
export const ALTITUDE_HOURS = { min: 0.5, max: 24 } as const

export type LogCheck<T> = { ok: true; value: T } | { ok: false; reason: string }

export function validateHeatExposure(suhuC: number, menit: number): LogCheck<{ suhuC: number; menit: number }> {
  if (!inRange(suhuC, HEAT_TEMP_C.min, HEAT_TEMP_C.max)) return { ok: false, reason: `Temperature must be ${HEAT_TEMP_C.min}–${HEAT_TEMP_C.max} °C` }
  if (!inRange(menit, HEAT_MINUTES.min, HEAT_MINUTES.max)) return { ok: false, reason: `Minutes must be ${HEAT_MINUTES.min}–${HEAT_MINUTES.max}` }
  return { ok: true, value: { suhuC, menit } }
}

export function validateAltitude(meter: number): LogCheck<number> {
  if (!inRange(meter, ALTITUDE_M.min, ALTITUDE_M.max)) return { ok: false, reason: `Altitude must be ${ALTITUDE_M.min}–${ALTITUDE_M.max} m` }
  return { ok: true, value: meter }
}

export function validateAltitudeExposure(meter: number, jam: number): LogCheck<{ meter: number; jam: number }> {
  const alt = validateAltitude(meter)
  if (!alt.ok) return alt
  if (!inRange(jam, ALTITUDE_HOURS.min, ALTITUDE_HOURS.max)) return { ok: false, reason: `Hours must be ${ALTITUDE_HOURS.min}–${ALTITUDE_HOURS.max}` }
  return { ok: true, value: { meter, jam } }
}
