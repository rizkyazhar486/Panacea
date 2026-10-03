/**
 * Tinggi target mid-parental: laki-laki (ayah + ibu + 13) / 2, perempuan (ayah + ibu − 13) / 2, rentang ±8.5 cm.
 * Rumus dan konstanta dipindahkan dari halaman tanpa perubahan; yang baru hanya penolakan masukan di luar rentang.
 * Perkiraan statistik, bukan prediksi tinggi anak.
 */
import { inRange } from './inputs'

// Batas kewarasan masukan (bukan ambang klinis).
export const PARENT_HEIGHT_CM = { min: 100, max: 250 } as const
export const TARGET_RANGE_CM = 8.5

export type MidParentalResult =
  | { ok: true; data: { targetCm: number; rangeLoCm: number; rangeHiCm: number } }
  | { ok: false; reason: string }

export function midParentalHeight(fatherCm: number, motherCm: number, childSex: 'M' | 'F'): MidParentalResult {
  if (!inRange(fatherCm, PARENT_HEIGHT_CM.min, PARENT_HEIGHT_CM.max)) return { ok: false, reason: `Father's height must be ${PARENT_HEIGHT_CM.min}–${PARENT_HEIGHT_CM.max} cm` }
  if (!inRange(motherCm, PARENT_HEIGHT_CM.min, PARENT_HEIGHT_CM.max)) return { ok: false, reason: `Mother's height must be ${PARENT_HEIGHT_CM.min}–${PARENT_HEIGHT_CM.max} cm` }
  if (childSex !== 'M' && childSex !== 'F') return { ok: false, reason: 'Child sex must be M or F' }
  const targetCm = childSex === 'M' ? (fatherCm + motherCm + 13) / 2 : (fatherCm + motherCm - 13) / 2
  return { ok: true, data: { targetCm, rangeLoCm: targetCm - TARGET_RANGE_CM, rangeHiCm: targetCm + TARGET_RANGE_CM } }
}
