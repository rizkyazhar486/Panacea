export type DigestiveBileCycleInputs = {
  hepaticSynthesisDrive: number
  gallbladderAvailability: number
  mealRelease: number
  ilealReabsorption: number
}

export type DigestiveBileCycleSignals = {
  intestinalDelivery: number
  ilealReturn: number
  fecalLoss: number
  hepaticReturn: number
}

export const DIGESTIVE_BILE_DEFAULTS: DigestiveBileCycleInputs = {
  hepaticSynthesisDrive: 0.55,
  gallbladderAvailability: 0.78,
  mealRelease: 0.72,
  ilealReabsorption: 0.88,
}

export const DIGESTIVE_BILE_PROVENANCE = [
  {
    source: 'PubMed',
    pmid: '29080336',
    doi: '10.5604/01.3001.0010.5493',
    citation: 'Di Ciaula A, Garruti G, Baccetto RL, et al. Ann Hepatol. 2017;16 Suppl 1:s4-s14.',
    supports: 'Bile acids are synthesized in the liver, stored/concentrated in the gallbladder during fasting, released into intestine with dietary fat, and largely returned to the liver after intestinal reabsorption with a small fecal loss.',
    reviewState: 'Published peer-reviewed review; source anchor only, not Panaceamed clinical validation or human review.',
  },
] as const

export const DIGESTIVE_BILE_BOUNDARY =
  'Educational enterohepatic-circulation model using synthetic dimensionless signals only. It does not calculate or infer patient bile-acid pool size, bile flow, gallbladder ejection fraction, ileal absorption, liver function tests, bilirubin, imaging findings, obstruction, cholestasis, diagnosis, prognosis, medication response, dose, nutrition prescription, or patient-specific clinical decisions. Relationships are schematic physiology rather than anatomical geometry or a validated quantitative model.'

const clamp01 = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

export function normalizeBileCycleInputs(input: Partial<DigestiveBileCycleInputs> = {}): DigestiveBileCycleInputs {
  return {
    hepaticSynthesisDrive: clamp01(input.hepaticSynthesisDrive ?? DIGESTIVE_BILE_DEFAULTS.hepaticSynthesisDrive),
    gallbladderAvailability: clamp01(input.gallbladderAvailability ?? DIGESTIVE_BILE_DEFAULTS.gallbladderAvailability),
    mealRelease: clamp01(input.mealRelease ?? DIGESTIVE_BILE_DEFAULTS.mealRelease),
    ilealReabsorption: clamp01(input.ilealReabsorption ?? DIGESTIVE_BILE_DEFAULTS.ilealReabsorption),
  }
}

export function deriveBileCycle(raw: Partial<DigestiveBileCycleInputs> = {}): DigestiveBileCycleSignals {
  const input = normalizeBileCycleInputs(raw)
  const availableBile = clamp01(0.45 * input.hepaticSynthesisDrive + 0.55 * input.gallbladderAvailability)
  const intestinalDelivery = clamp01(availableBile * input.mealRelease)
  const ilealReturn = clamp01(intestinalDelivery * input.ilealReabsorption)
  const fecalLoss = clamp01(intestinalDelivery * (1 - input.ilealReabsorption))
  const hepaticReturn = ilealReturn
  return { intestinalDelivery, ilealReturn, fecalLoss, hepaticReturn }
}
