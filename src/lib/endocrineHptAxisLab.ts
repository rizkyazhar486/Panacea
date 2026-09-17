export type EndocrineHptInputs = {
  hypothalamicDrive: number
  pituitaryResponsiveness: number
  thyroidResponsiveness: number
  thyroidHormone: number
}

export type EndocrineHptSignals = {
  trhSignal: number
  tshSignal: number
  thyroidHormoneSignal: number
  feedbackSignal: number
}

export const ENDOCRINE_HPT_DEFAULTS: EndocrineHptInputs = {
  hypothalamicDrive: 0.62,
  pituitaryResponsiveness: 0.68,
  thyroidResponsiveness: 0.72,
  thyroidHormone: 0.55,
}

export const ENDOCRINE_HPT_PROVENANCE = [
  {
    source: 'PubMed',
    pmid: '27347897',
    citation: 'Ortiga-Carvalho TM, Chiamolera MI, Pazos-Moura CC, Wondisford FE. Compr Physiol. 2016;6(3):1387-1428.',
    supports: 'TRH stimulates pituitary TSH, TSH stimulates thyroid hormone production, and T3/T4 exert negative feedback on TRH and TSH secretion.',
    reviewState: 'Published peer-reviewed review; source anchor only, not Panaceamed clinical validation or human review.',
  },
] as const

export const ENDOCRINE_HPT_BOUNDARY =
  'Educational hypothalamic-pituitary-thyroid feedback model using synthetic dimensionless signals only. It does not calculate or infer patient TRH, TSH, free T4, free T3, antibody levels, thyroid uptake, imaging findings, diagnosis, prognosis, treatment response, medication dose, pregnancy-specific interpretation, or patient-specific clinical decisions. The relationships are schematic physiology, not anatomical geometry.'

const clamp01 = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0

export function normalizeHptInputs(input: Partial<EndocrineHptInputs> = {}): EndocrineHptInputs {
  return {
    hypothalamicDrive: clamp01(input.hypothalamicDrive ?? ENDOCRINE_HPT_DEFAULTS.hypothalamicDrive),
    pituitaryResponsiveness: clamp01(input.pituitaryResponsiveness ?? ENDOCRINE_HPT_DEFAULTS.pituitaryResponsiveness),
    thyroidResponsiveness: clamp01(input.thyroidResponsiveness ?? ENDOCRINE_HPT_DEFAULTS.thyroidResponsiveness),
    thyroidHormone: clamp01(input.thyroidHormone ?? ENDOCRINE_HPT_DEFAULTS.thyroidHormone),
  }
}

export function deriveHptAxis(raw: Partial<EndocrineHptInputs> = {}): EndocrineHptSignals {
  const input = normalizeHptInputs(raw)
  const feedbackSignal = input.thyroidHormone
  const feedbackBrake = 1 - 0.72 * feedbackSignal
  const trhSignal = clamp01(input.hypothalamicDrive * feedbackBrake)
  const tshSignal = clamp01(trhSignal * input.pituitaryResponsiveness * feedbackBrake)
  const endogenousThyroidDrive = clamp01(tshSignal * input.thyroidResponsiveness)
  const thyroidHormoneSignal = clamp01(0.65 * input.thyroidHormone + 0.35 * endogenousThyroidDrive)
  return { trhSignal, tshSignal, thyroidHormoneSignal, feedbackSignal }
}
