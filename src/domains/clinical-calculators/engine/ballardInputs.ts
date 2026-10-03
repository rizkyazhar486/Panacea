/**
 * Validasi masukan bayi baru lahir untuk kalkulator Ballard/Lubchenco/SOAP: berat lahir (g), Apgar menit 1 dan 5.
 * Hanya penolakan masukan; tabel Ballard→usia gestasi dan persentil Lubchenco tetap di halaman dan tidak diubah.
 * Apgar 0 adalah nilai klinis yang sah (depresi berat), jadi kolom kosong HARUS ditolak, bukan dibaca 0: halaman lama
 * menulis "severe depression, needs further resuscitation & NICU referral" dari kolom Apgar yang kosong.
 */
import { inRange } from './inputs'

// Batas kewarasan masukan (bukan ambang klinis). Apgar 0-10 adalah definisi skalanya.
export const BIRTH_WEIGHT_G = { min: 200, max: 8000 } as const
export const APGAR = { min: 0, max: 10 } as const

export type BallardInputsResult =
  | { ok: true; data: { birthWeightG: number; apgar1: number; apgar5: number } }
  | { ok: false; reason: string }

export function validateBallardInputs(birthWeightG: number, apgar1: number, apgar5: number): BallardInputsResult {
  if (!inRange(birthWeightG, BIRTH_WEIGHT_G.min, BIRTH_WEIGHT_G.max)) return { ok: false, reason: `Birth weight must be ${BIRTH_WEIGHT_G.min}–${BIRTH_WEIGHT_G.max} g` }
  for (const [name, v] of [["1-minute", apgar1], ["5-minute", apgar5]] as const) {
    if (!inRange(v, APGAR.min, APGAR.max) || !Number.isInteger(v)) return { ok: false, reason: `${name} APGAR must be a whole number of ${APGAR.min}–${APGAR.max}` }
  }
  return { ok: true, data: { birthWeightG, apgar1, apgar5 } }
}
