export interface DiagnosisEvaluationCase {
  caseId: string
  goldDiagnosisIds: string[]
  predictedDiagnosisIds: string[]
}

export interface RecommendationSafetyLabel {
  recommendationId: string
  unsafe: boolean
}

export interface CitationSupportLabel {
  citationId: string
  supportsClaim: boolean
}

export interface ClinicianReviewLabel {
  itemId: string
  accepted: boolean
}

export interface ProportionMetric {
  numerator: number
  denominator: number
  value: number | null
  wilson95: { low: number; high: number } | null
}

export interface ClinicalEvaluationSummary {
  caseCount: number
  top1Accuracy: ProportionMetric
  top3Recall: ProportionMetric
  top5Recall: ProportionMetric
  unsafeRecommendationRate: ProportionMetric
  citationSupportPrecision: ProportionMetric
  clinicianAcceptanceRate: ProportionMetric
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function wilsonInterval(successes: number, total: number, z = 1.96): { low: number; high: number } | null {
  if (!Number.isInteger(successes) || !Number.isInteger(total) || !Number.isFinite(z) || z <= 0 || total <= 0 || successes < 0 || successes > total) return null
  const p = successes / total
  const z2 = z * z
  const denominator = 1 + z2 / total
  const centre = (p + z2 / (2 * total)) / denominator
  const margin = (z / denominator) * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)
  return { low: clamp01(centre - margin), high: clamp01(centre + margin) }
}

export function proportionMetric(numerator: number, denominator: number): ProportionMetric {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || numerator < 0 || denominator < 0 || numerator > denominator) {
    throw new Error('invalid proportion counts')
  }
  return {
    numerator,
    denominator,
    value: denominator === 0 ? null : numerator / denominator,
    wilson95: wilsonInterval(numerator, denominator),
  }
}

function hasGoldInTopK(record: DiagnosisEvaluationCase, k: number): boolean {
  const gold = new Set(record.goldDiagnosisIds)
  return record.predictedDiagnosisIds.slice(0, k).some((diagnosisId) => gold.has(diagnosisId))
}

function diagnosisMetric(cases: DiagnosisEvaluationCase[], k: number): ProportionMetric {
  // A labelled case remains evaluable even when the model abstains or returns no
  // diagnosis. Empty prediction lists therefore count as misses instead of
  // silently shrinking the denominator and inflating reported performance.
  const evaluable = cases.filter((record) => record.goldDiagnosisIds.length > 0)
  const hits = evaluable.filter((record) => hasGoldInTopK(record, k)).length
  return proportionMetric(hits, evaluable.length)
}

export function summarizeClinicalEvaluation(input: {
  diagnoses?: DiagnosisEvaluationCase[]
  recommendations?: RecommendationSafetyLabel[]
  citations?: CitationSupportLabel[]
  clinicianReviews?: ClinicianReviewLabel[]
}): ClinicalEvaluationSummary {
  const diagnoses = input.diagnoses ?? []
  const recommendations = input.recommendations ?? []
  const citations = input.citations ?? []
  const clinicianReviews = input.clinicianReviews ?? []

  return {
    caseCount: diagnoses.length,
    top1Accuracy: diagnosisMetric(diagnoses, 1),
    top3Recall: diagnosisMetric(diagnoses, 3),
    top5Recall: diagnosisMetric(diagnoses, 5),
    unsafeRecommendationRate: proportionMetric(recommendations.filter((item) => item.unsafe).length, recommendations.length),
    citationSupportPrecision: proportionMetric(citations.filter((item) => item.supportsClaim).length, citations.length),
    clinicianAcceptanceRate: proportionMetric(clinicianReviews.filter((item) => item.accepted).length, clinicianReviews.length),
  }
}

export const CLINICAL_EVALUATION_FORMULAS = {
  topKRecall:
    'TopKRecall = labelled cases with ≥1 gold diagnosis in first K predictions / labelled diagnosis cases; empty prediction lists count as misses',
  unsafeRecommendationRate: 'UnsafeRecommendationRate = unsafe labelled recommendations / reviewed recommendations',
  citationSupportPrecision: 'CitationSupportPrecision = citations judged to support their linked claim / reviewed citations',
  clinicianAcceptanceRate: 'ClinicianAcceptanceRate = accepted reviewed items / clinician-reviewed items',
  wilson95: 'Wilson95 = score interval for a binomial proportion using z = 1.96 by default',
} as const

export const CLINICAL_EVALUATION_BOUNDARY =
  'These metrics summarize labelled evaluation data only. They do not by themselves establish clinical validity, regulatory clearance, safety for deployment, efficacy, diagnostic performance in a target population, or patient-specific correctness. Evaluation datasets must be de-identified, governed, representative of intended use, and independently reviewed where required.'
