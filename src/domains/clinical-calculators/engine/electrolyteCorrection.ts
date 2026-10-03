/**
 * Koreksi natrium (Katz 1973: +1.6 mEq/L per 100 mg/dL glukosa di atas 100) dan estimasi defisit kalium (aturan praktis
 * Sterns: 200-400 mEq per 1 mEq/L di bawah 4.0, ditampilkan sebagai rentang). Rumus dan ambang keparahan dipindahkan
 * dari halaman tanpa perubahan angka; yang baru hanya penolakan masukan di luar rentang. Tampilan pendukung keputusan,
 * bukan order: koreksi kalium IV dan kecepatannya diputuskan klinisi.
 */
import { inRange } from './inputs'

// Batas kewarasan masukan (bukan ambang klinis): menolak kolom kosong (0), negatif, NaN, Infinity dan salah satuan.
export const SODIUM_MEQ_L = { min: 80, max: 200 } as const
export const GLUCOSE_MG_DL = { min: 20, max: 2000 } as const
export const POTASSIUM_MEQ_L = { min: 1, max: 10 } as const

export type SodiumCorrectionResult =
  | { ok: true; data: { correctedNa: number } }
  | { ok: false; reason: string }

export function correctedSodiumKatz(measuredNa: number, glucoseMgDl: number): SodiumCorrectionResult {
  if (!inRange(measuredNa, SODIUM_MEQ_L.min, SODIUM_MEQ_L.max)) return { ok: false, reason: `Sodium must be ${SODIUM_MEQ_L.min}–${SODIUM_MEQ_L.max} mEq/L` }
  if (!inRange(glucoseMgDl, GLUCOSE_MG_DL.min, GLUCOSE_MG_DL.max)) return { ok: false, reason: `Glucose must be ${GLUCOSE_MG_DL.min}–${GLUCOSE_MG_DL.max} mg/dL` }
  return { ok: true, data: { correctedNa: measuredNa + 1.6 * Math.max(0, (glucoseMgDl - 100) / 100) } }
}

export type PotassiumTone = 'normal' | 'low' | 'critical'
export type PotassiumResult =
  | {
      ok: true
      data: {
        // null bila K ≥ 4.0: tidak ada defisit untuk diperkirakan.
        deficitMeq: { low: number; high: number } | null
        severity: { label: string; tone: PotassiumTone }
      }
    }
  | { ok: false; reason: string }

export function potassiumAssessment(measuredK: number): PotassiumResult {
  if (!inRange(measuredK, POTASSIUM_MEQ_L.min, POTASSIUM_MEQ_L.max)) return { ok: false, reason: `Potassium must be ${POTASSIUM_MEQ_L.min}–${POTASSIUM_MEQ_L.max} mEq/L` }
  const severity: { label: string; tone: PotassiumTone } =
    measuredK < 2.5 || measuredK > 6.5 ? { label: 'Severe — monitor ECG closely', tone: 'critical' }
    : measuredK < 3.0 || measuredK > 6.0 ? { label: 'Moderate', tone: 'low' }
    : measuredK < 3.5 || measuredK > 5.5 ? { label: 'Mild', tone: 'low' }
    : { label: 'Normal', tone: 'normal' }
  const deficitMeq = measuredK < 4.0 ? { low: (4.0 - measuredK) * 200, high: (4.0 - measuredK) * 400 } : null
  return { ok: true, data: { deficitMeq, severity } }
}
