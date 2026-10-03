/**
 * Validasi usia untuk penapis perkembangan Denver II (versi sederhana). Rentang 0-72 bulan adalah batas yang sudah
 * ditulis pada kolom halaman itu sendiri (min 0, max 72) tetapi tidak ditegakkan: usia 1000 bulan menampilkan semua
 * tonggak dan peringatan keterlambatan. Daftar tonggak dan aturan peringatan ≥ 6 bulan tidak diubah.
 */
import { inRange } from './inputs'

export const DENVER_AGE_MONTHS = { min: 0, max: 72 } as const

export type DenverAgeResult =
  | { ok: true; data: { ageMonths: number } }
  | { ok: false; reason: string }

export function validateDenverAge(ageMonths: number): DenverAgeResult {
  if (!inRange(ageMonths, DENVER_AGE_MONTHS.min, DENVER_AGE_MONTHS.max)) {
    return { ok: false, reason: `Age must be ${DENVER_AGE_MONTHS.min}–${DENVER_AGE_MONTHS.max} months` }
  }
  return { ok: true, data: { ageMonths } }
}
