// Lightweight anthropometry helpers (BMI + adult classification).
// Adult BMI arithmetic only; pediatric reference curves and clinical interpretation
// are separate. Calculation availability is not clinical validation.

export interface AnthroResult {
  bmi: number
  kesan: string
  tone: 'low' | 'normal' | 'high' | 'critical'
  /** Technical availability only, not clinical approval. false = berat/tinggi hilang atau tak sah: `bmi` (0) BUKAN pengukuran dan tidak boleh ditampilkan sebagai angka. */
  valid: boolean
}

export function computeBmi(weightKg: number, heightCm: number): AnthroResult {
  const unavailable: AnthroResult = { bmi: 0, kesan: 'Cannot be calculated', tone: 'normal', valid: false }
  if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(heightCm) || heightCm <= 0) return unavailable
  const h = heightCm / 100
  const squareHeight = h * h
  if (!Number.isFinite(squareHeight) || squareHeight <= 0) return unavailable
  const bmi = weightKg / squareHeight
  const rounded = Math.round(bmi * 10) / 10
  // Finite inputs can still overflow, underflow or round to an impossible zero BMI.
  if (!Number.isFinite(bmi) || bmi <= 0 || !Number.isFinite(rounded) || rounded <= 0) return unavailable
  let kesan = 'Cannot be calculated'
  let tone: AnthroResult['tone'] = 'normal'
  if (bmi > 0) {
    // Asia-Pacific cut-offs.
    if (bmi < 18.5) {
      kesan = 'Underweight'
      tone = 'low'
    } else if (bmi < 23) {
      kesan = 'Normal'
      tone = 'normal'
    } else if (bmi < 25) {
      kesan = 'At risk'
      tone = 'high'
    } else if (bmi < 30) {
      kesan = 'Obesity I'
      tone = 'high'
    } else {
      kesan = 'Obesity II'
      tone = 'critical'
    }
  }
  return { bmi: rounded, kesan, tone, valid: true }
}

export function ageFromDob(dob: string): number {
  const d = new Date(dob)
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}
