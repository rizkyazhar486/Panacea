/**
 * Aturan McDonald: tinggi fundus (cm) ≈ usia kehamilan (minggu), berlaku sekitar 20–36 minggu pada kehamilan tunggal
 * dengan pertumbuhan janin normal. Rentang berlaku diambil dari teks halaman itu sendiri; di luar rentang tidak ada
 * perkiraan yang dikembalikan (sebelumnya halaman menampilkan "≈ 0 minggu" atau "≈ 80 minggu").
 */
import { inRange } from './inputs'

export const MCDONALD_FUNDAL_CM = { min: 20, max: 36 } as const

export type McdonaldResult =
  | { ok: true; data: { gestationalWeeks: number } }
  | { ok: false; reason: string }

export function mcdonaldGestationalAge(fundalHeightCm: number): McdonaldResult {
  if (!inRange(fundalHeightCm, MCDONALD_FUNDAL_CM.min, MCDONALD_FUNDAL_CM.max)) {
    return { ok: false, reason: `McDonald's rule applies to a fundal height of ${MCDONALD_FUNDAL_CM.min}–${MCDONALD_FUNDAL_CM.max} cm` }
  }
  return { ok: true, data: { gestationalWeeks: fundalHeightCm } }
}
