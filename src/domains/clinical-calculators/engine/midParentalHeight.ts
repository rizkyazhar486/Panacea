/**
 * Tinggi target tengah-orangtua (Tanner): anak laki-laki (ayah + ibu + 13) / 2, anak perempuan (ayah + ibu − 13) / 2,
 * rentang ±8,5 cm. Rumus dan rentang dipindahkan dari halaman tanpa perubahan. Estimasi genetik, bukan diagnosis.
 */
import { inRange } from './inputs'

// Batas kewarasan tinggi orang dewasa (bukan ambang klinis).
export const PARENT_HEIGHT_CM = { min: 100, max: 250 } as const
const SEX_OFFSET_CM = 13
const RANGE_CM = 8.5

export type MidParentalResult =
  | { ok: true; data: { targetCm: number; lowCm: number; highCm: number } }
  | { ok: false; reason: string }

export function midParentalHeight(fatherCm: number, motherCm: number, childSex: 'M' | 'F'): MidParentalResult {
  if (!inRange(fatherCm, PARENT_HEIGHT_CM.min, PARENT_HEIGHT_CM.max)) return { ok: false, reason: `Father's height must be ${PARENT_HEIGHT_CM.min}–${PARENT_HEIGHT_CM.max} cm` }
  if (!inRange(motherCm, PARENT_HEIGHT_CM.min, PARENT_HEIGHT_CM.max)) return { ok: false, reason: `Mother's height must be ${PARENT_HEIGHT_CM.min}–${PARENT_HEIGHT_CM.max} cm` }
  if (childSex !== 'M' && childSex !== 'F') return { ok: false, reason: "Child's sex must be selected" }
  const targetCm = (fatherCm + motherCm + (childSex === 'M' ? SEX_OFFSET_CM : -SEX_OFFSET_CM)) / 2
  return { ok: true, data: { targetCm, lowCm: targetCm - RANGE_CM, highCm: targetCm + RANGE_CM } }
}
