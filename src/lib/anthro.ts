// Lightweight anthropometry helpers (BMI + adult classification).
// Full WHO/CDC z-scores for paediatrics are computed by the AI when a key is set;
// this provides an instant client-side BMI interpretation for adults.

export interface AnthroResult {
  bmi: number
  kesan: string
  tone: 'low' | 'normal' | 'high' | 'critical'
}

export function computeBmi(weightKg: number, heightCm: number): AnthroResult {
  const h = heightCm / 100
  const bmi = h > 0 ? weightKg / (h * h) : 0
  let kesan = 'Tidak dapat dihitung'
  let tone: AnthroResult['tone'] = 'normal'
  if (bmi > 0) {
    // Asia-Pacific cut-offs.
    if (bmi < 18.5) {
      kesan = 'Underweight / Gizi kurang'
      tone = 'low'
    } else if (bmi < 23) {
      kesan = 'Normal'
      tone = 'normal'
    } else if (bmi < 25) {
      kesan = 'Berisiko (At risk)'
      tone = 'high'
    } else if (bmi < 30) {
      kesan = 'Obesitas I'
      tone = 'high'
    } else {
      kesan = 'Obesitas II'
      tone = 'critical'
    }
  }
  return { bmi: Math.round(bmi * 10) / 10, kesan, tone }
}

export function ageFromDob(dob: string): number {
  const d = new Date(dob)
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000))
}
