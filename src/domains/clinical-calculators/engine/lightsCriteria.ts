/**
 * Kriteria de Light (Light et al. 1972, Ann Intern Med 77:507): eksudat bila SALAH SATU dari tiga kriteria terpenuhi.
 * Rumus dan ambang dipindahkan dari halaman tanpa perubahan; yang baru hanya penolakan masukan di luar rentang. Sebelumnya
 * kolom kosong terbaca 0 sehingga rasio menjadi 0 dan semua kriteria "Not met" → "Transudate" untuk masukan yang belum diisi.
 * Alat bantu klasifikasi, bukan diagnosis; tidak menggantikan analisis cairan lanjutan.
 */
import { inRange } from './inputs'

// Batas kewarasan masukan (bukan ambang klinis). Penyebut (serum) harus positif agar rasio terdefinisi.
export const LIGHTS_RANGES = {
  pleuralProtein: { min: 0.1, max: 15, unit: ' g/dL', name: 'Pleural protein' },
  serumProtein: { min: 0.5, max: 15, unit: ' g/dL', name: 'Serum protein' },
  pleuralLdh: { min: 1, max: 20000, unit: ' IU/L', name: 'Pleural LDH' },
  serumLdh: { min: 1, max: 20000, unit: ' IU/L', name: 'Serum LDH' },
  serumLdhUln: { min: 1, max: 2000, unit: ' IU/L', name: 'Serum LDH upper limit' },
} as const

export const PROTEIN_RATIO_CUTOFF = 0.5
export const LDH_RATIO_CUTOFF = 0.6
/** Pleural LDH > 2/3 batas atas normal LDH serum. */
export const LDH_ULN_FRACTION = 2 / 3

export type LightsInput = Readonly<Record<keyof typeof LIGHTS_RANGES, number>>
export type LightsCriterion = Readonly<{ label: string; value: string; met: boolean }>
export type LightsResult =
  | { ok: true; data: { criteria: readonly LightsCriterion[]; exudate: boolean } }
  | { ok: false; reason: string }

export function lightsCriteria(input: LightsInput): LightsResult {
  for (const key of Object.keys(LIGHTS_RANGES) as (keyof typeof LIGHTS_RANGES)[]) {
    const { min, max, unit, name } = LIGHTS_RANGES[key]
    if (!inRange(input[key], min, max)) return { ok: false, reason: `${name} must be ${min}–${max}${unit}` }
  }
  const { pleuralProtein, serumProtein, pleuralLdh, serumLdh, serumLdhUln } = input
  const proteinRatio = pleuralProtein / serumProtein
  const ldhRatio = pleuralLdh / serumLdh
  const ldhVsUln = pleuralLdh / (LDH_ULN_FRACTION * serumLdhUln)
  const criteria: LightsCriterion[] = [
    { label: 'Pleural/serum protein ratio > 0.5', value: proteinRatio.toFixed(2), met: proteinRatio > PROTEIN_RATIO_CUTOFF },
    { label: 'Pleural/serum LDH ratio > 0.6', value: ldhRatio.toFixed(2), met: ldhRatio > LDH_RATIO_CUTOFF },
    { label: 'Pleural LDH > ⅔ upper limit of normal serum LDH', value: pleuralLdh.toFixed(0), met: ldhVsUln > 1 },
  ]
  return { ok: true, data: { criteria, exudate: criteria.some((c) => c.met) } }
}
