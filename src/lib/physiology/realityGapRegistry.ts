import type {
  RealityComparisonRecord,
  RealityErrorLedger,
  RealityPredictionRecord,
  RealityPredictionStatus,
} from './realityErrorLedger.ts'

export type RealityGapKind =
  | 'awaiting-observation'
  | 'observation-missing'
  | 'uncertainty-unquantified'

export interface RealityGapRecord {
  predictionId: string
  kind: RealityGapKind
  overdue: boolean
  targetAt: string
  predictionProvenanceId: string
  comparisonId: string | null
  explanation: string
}

export interface RealityGapRegistryCounts {
  predictions: number
  pending: number
  matched: number
  expiredUnobserved: number
  matchedWithQuantifiedUncertainty: number
  matchedWithoutQuantifiedUncertainty: number
}

export interface RealityGapRegistry {
  subjectId: string
  evaluatedAt: string
  ledgerRevision: number
  semantics: 'epistemic-coverage-not-clinical-completeness'
  counts: RealityGapRegistryCounts
  gaps: readonly RealityGapRecord[]
  boundary: {
    clinicalCompletenessScore: null
    causalAttributionAllowed: false
    diagnosisInferenceAllowed: false
    automaticRecalibrationAllowed: false
  }
}

function parseIso(value: string, field: string): number {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertFiniteRevision(revision: number): void {
  if (!Number.isInteger(revision) || revision < 0) {
    throw new Error('ledger revision must be a non-negative integer')
  }
}

function predictionIds(ledger: RealityErrorLedger): string[] {
  return Object.keys(ledger.predictionsById).sort()
}

function assertPredictionIdentity(
  ledger: RealityErrorLedger,
  prediction: RealityPredictionRecord,
  predictionId: string,
): void {
  if (prediction.id !== predictionId) {
    throw new Error(`prediction key ${predictionId} does not match record id ${prediction.id}`)
  }
  if (prediction.subjectId !== ledger.subjectId) {
    throw new Error(`prediction ${predictionId} belongs to another subject`)
  }
}

function comparisonForMatchedPrediction(
  ledger: RealityErrorLedger,
  prediction: RealityPredictionRecord,
): RealityComparisonRecord {
  const comparisonId = ledger.comparisonIdByPredictionId[prediction.id]
  const comparison = comparisonId ? ledger.comparisonsById[comparisonId] : undefined
  if (!comparison) {
    throw new Error(`matched prediction ${prediction.id} requires a comparison`)
  }
  if (comparison.predictionId !== prediction.id) {
    throw new Error(`matched prediction ${prediction.id} points to a comparison for another prediction`)
  }
  if (comparison.subjectId !== prediction.subjectId) {
    throw new Error(`matched prediction ${prediction.id} comparison subject mismatch`)
  }
  if (comparison.field !== prediction.field || comparison.unit !== prediction.unit) {
    throw new Error(`matched prediction ${prediction.id} comparison field/unit mismatch`)
  }
  if (comparison.predictionProvenanceId !== prediction.provenance.provenanceId) {
    throw new Error(`matched prediction ${prediction.id} comparison provenance mismatch`)
  }
  if (comparison.combinedSigma !== null && (!Number.isFinite(comparison.combinedSigma) || comparison.combinedSigma < 0)) {
    throw new Error(`matched prediction ${prediction.id} comparison combinedSigma is invalid`)
  }
  return comparison
}

function assertNoComparisonForUnmatched(
  ledger: RealityErrorLedger,
  predictionId: string,
  status: RealityPredictionStatus,
): void {
  const comparisonId = ledger.comparisonIdByPredictionId[predictionId]
  if (comparisonId) {
    throw new Error(`${status} prediction ${predictionId} must not have a comparison`)
  }
}

function gapForPrediction(
  ledger: RealityErrorLedger,
  prediction: RealityPredictionRecord,
  status: RealityPredictionStatus,
  evaluatedAtMs: number,
): RealityGapRecord | null {
  const targetAtMs = parseIso(prediction.targetAt, `prediction ${prediction.id} targetAt`)
  parseIso(prediction.createdAt, `prediction ${prediction.id} createdAt`)

  if (status === 'pending') {
    assertNoComparisonForUnmatched(ledger, prediction.id, status)
    return {
      predictionId: prediction.id,
      kind: 'awaiting-observation',
      overdue: evaluatedAtMs > targetAtMs,
      targetAt: prediction.targetAt,
      predictionProvenanceId: prediction.provenance.provenanceId,
      comparisonId: null,
      explanation: 'No admissible observed value has been matched to this prospective prediction yet.',
    }
  }

  if (status === 'expired-unobserved') {
    assertNoComparisonForUnmatched(ledger, prediction.id, status)
    return {
      predictionId: prediction.id,
      kind: 'observation-missing',
      overdue: evaluatedAtMs >= targetAtMs,
      targetAt: prediction.targetAt,
      predictionProvenanceId: prediction.provenance.provenanceId,
      comparisonId: null,
      explanation: 'The prediction lifecycle closed without a matched admissible reality observation.',
    }
  }

  const comparison = comparisonForMatchedPrediction(ledger, prediction)
  if (comparison.combinedSigma !== null) return null

  return {
    predictionId: prediction.id,
    kind: 'uncertainty-unquantified',
    overdue: false,
    targetAt: prediction.targetAt,
    predictionProvenanceId: prediction.provenance.provenanceId,
    comparisonId: comparison.id,
    explanation: 'A reality observation was matched, but combined prediction and observation uncertainty is not quantified.',
  }
}

function assertNoOrphanLedgerEntries(ledger: RealityErrorLedger): void {
  for (const predictionId of Object.keys(ledger.statusByPredictionId)) {
    if (!ledger.predictionsById[predictionId]) {
      throw new Error(`status references unknown prediction ${predictionId}`)
    }
  }
  for (const [predictionId, comparisonId] of Object.entries(ledger.comparisonIdByPredictionId)) {
    if (!ledger.predictionsById[predictionId]) {
      throw new Error(`comparison index references unknown prediction ${predictionId}`)
    }
    if (!ledger.comparisonsById[comparisonId]) {
      throw new Error(`comparison index for prediction ${predictionId} references unknown comparison`)
    }
  }
  for (const comparison of Object.values(ledger.comparisonsById)) {
    if (!ledger.predictionsById[comparison.predictionId]) {
      throw new Error(`comparison ${comparison.id} references unknown prediction`)
    }
  }
}

/**
 * Build a deterministic registry of what the prediction-vs-reality pipeline
 * still does not know.
 *
 * The registry is epistemic infrastructure only. It does not turn coverage
 * gaps into diagnosis, severity, model blame, clinical completeness, or an
 * instruction to recalibrate a model.
 */
export function buildRealityGapRegistry(
  ledger: RealityErrorLedger,
  evaluatedAt: string,
): RealityGapRegistry {
  const evaluatedAtMs = parseIso(evaluatedAt, 'evaluatedAt')
  assertFiniteRevision(ledger.revision)
  assertNoOrphanLedgerEntries(ledger)

  const counts: RealityGapRegistryCounts = {
    predictions: 0,
    pending: 0,
    matched: 0,
    expiredUnobserved: 0,
    matchedWithQuantifiedUncertainty: 0,
    matchedWithoutQuantifiedUncertainty: 0,
  }
  const gaps: RealityGapRecord[] = []

  for (const predictionId of predictionIds(ledger)) {
    const prediction = ledger.predictionsById[predictionId]
    assertPredictionIdentity(ledger, prediction, predictionId)
    const status = ledger.statusByPredictionId[predictionId]
    if (!status) throw new Error(`prediction ${predictionId} has no lifecycle status`)

    counts.predictions += 1
    if (status === 'pending') counts.pending += 1
    else if (status === 'expired-unobserved') counts.expiredUnobserved += 1
    else if (status === 'matched') counts.matched += 1
    else throw new Error(`prediction ${predictionId} has invalid lifecycle status`)

    const gap = gapForPrediction(ledger, prediction, status, evaluatedAtMs)
    if (status === 'matched') {
      const comparison = comparisonForMatchedPrediction(ledger, prediction)
      if (comparison.combinedSigma === null) counts.matchedWithoutQuantifiedUncertainty += 1
      else counts.matchedWithQuantifiedUncertainty += 1
    }
    if (gap) gaps.push(gap)
  }

  gaps.sort((left, right) => {
    const targetDelta = Date.parse(left.targetAt) - Date.parse(right.targetAt)
    return targetDelta || left.predictionId.localeCompare(right.predictionId)
  })

  return {
    subjectId: ledger.subjectId,
    evaluatedAt,
    ledgerRevision: ledger.revision,
    semantics: 'epistemic-coverage-not-clinical-completeness',
    counts,
    gaps,
    boundary: {
      clinicalCompletenessScore: null,
      causalAttributionAllowed: false,
      diagnosisInferenceAllowed: false,
      automaticRecalibrationAllowed: false,
    },
  }
}
