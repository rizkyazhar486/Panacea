// Lightweight anthropometry helpers (BMI + adult classification).
// Full WHO/CDC z-scores for paediatrics are computed by the AI when a key is set;
// this provides an instant client-side BMI interpretation for adults.

export interface AnthroResult {
  bmi: number
  kesan: string
  tone: 'low' | 'normal' | 'high' | 'critical'
  /** false = berat/tinggi hilang atau tak sah: `bmi` (0) BUKAN pengukuran dan tidak boleh ditampilkan sebagai angka. */
  valid: boolean
}

export function computeBmi(weightKg: number, heightCm: number): AnthroResult {
  const h = heightCm / 100
  const valid = Number.isFinite(weightKg) && weightKg > 0 && Number.isFinite(h) && h > 0
  const bmi = valid ? weightKg / (h * h) : 0
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
  return { bmi: Math.round(bmi * 10) / 10, kesan, tone, valid }
}

export function ageFromDob(dob: string): number {
  const d = new Date(dob)
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}
