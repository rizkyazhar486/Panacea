// Hybrid lateral+vertical Clinical Decision Support (CDSS) scoring + safety gate.
// Operationalizes the ensemble design:
//   CombinedScore = α·V + β·L + γ·S
//   FinalScore    = CombinedScore  if S ≥ S_threshold  else  BLOCKED
// V = vertical (guideline/dosing concordance), L = lateral (LLM novelty/fit),
// S = safety (DDI/allergy/contraindication, dose verification, high-alert).
// AI is decision support; the clinician is in the loop and may override a block
// with a forced, logged justification.

import type { PlanItem, Patient } from './types'

export const WEIGHTS = { alpha: 0.65, beta: 0.25, gamma: 0.1 }
export const S_THRESHOLD = 0.8

// Narrow-therapeutic-index / high-alert drugs (require ranges + clinician dose).
export const HIGH_ALERT = [
  'warfarin',
  'heparin',
  'enoxaparin',
  'insulin',
  'digoxin',
  'amiodarone',
  'morfin',
  'morphine',
  'fentanyl',
  'opioid',
  'noradrenalin',
  'norepinephrine',
  'vasopres',
  'midazolam',
  'propofol',
  'fenitoin',
  'phenytoin',
  'kemoterapi',
  'chemo',
  'methotrexate',
  'kalium',
  'potassium',
]

export interface CdssScore {
  V: number
  L: number
  S: number
  combined: number
  final: number
  blocked: boolean
  reasons: string[]
  highAlert: boolean
}

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export function scorePlanItem(item: PlanItem, patient: Patient): CdssScore {
  const text = item.text.toLowerCase()
  const reasons: string[] = []

  // --- Vertical score: guideline/dosing concordance --------------------------
  let V = 0.55
  if (item.source === 'Dokter') V += 0.2 // clinician-authored = guideline-aligned
  if (/dosis|mg|iv|po|gram|\bg\b|mcg|unit/.test(text)) V += 0.12 // explicit dosing
  if (item.category === 'Definitif' || item.category === 'Suportif') V += 0.08
  V = clamp(V)

  // --- Lateral score: LLM novelty / patient-fit ------------------------------
  let L = item.source === 'AI' ? 0.7 : 0.45
  if (item.category === 'Edukasi' || item.category === 'Follow-up') L += 0.12
  L = clamp(L)

  // --- Safety score: DDI / allergy / contraindication / verification ---------
  let S = 0.95
  const highAlert = HIGH_ALERT.some((d) => text.includes(d))
  if (highAlert) {
    S -= 0.25
    reasons.push('Obat high-alert / indeks terapi sempit — butuh dosis terverifikasi klinisi.')
  }
  // allergy conflict
  const allergyHit = patient.allergies.find((a) => text.includes(a.toLowerCase().slice(0, 5)))
  if (allergyHit) {
    S -= 0.7
    reasons.push(`Potensi kontraindikasi alergi: ${allergyHit}.`)
  }
  // unverified dose on a drug order
  const looksLikeDrug = /mg|iv|po|gram|mcg|unit|tablet|kapsul|infus/.test(text)
  const hasVerifyNote = /verifikasi|diverifikasi|formularium|dokter/.test(text)
  if (looksLikeDrug && highAlert && !hasVerifyNote) {
    S -= 0.15
    reasons.push('Order obat high-alert tanpa catatan verifikasi dosis.')
  }
  if (item.status === 'ditolak') {
    S -= 0.2
  }
  S = clamp(S)

  const combined = clamp(WEIGHTS.alpha * V + WEIGHTS.beta * L + WEIGHTS.gamma * S)
  const blocked = S < S_THRESHOLD
  return {
    V: round(V),
    L: round(L),
    S: round(S),
    combined: round(combined),
    final: blocked ? 0 : round(combined),
    blocked,
    reasons,
    highAlert,
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
