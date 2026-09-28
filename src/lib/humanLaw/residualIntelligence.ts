import type {
  RealityComparisonRecord,
  RealityErrorLedger,
  RealityPredictionRecord,
} from '../physiology/realityErrorLedger.ts'

export type ResidualSampleClass =
  | 'unquantified'
  | 'within-expected-noise'
  | 'extreme-positive'
  | 'extreme-negative'

export interface ResidualIntelligenceOptions {
  standardizedResidualThreshold: number
  minQuantifiedSamples: number
}

export interface ResidualSeriesIdentity {
  subjectId: string
  field: string
  unit: string
  engineId: string
  modelId: string
  modelVersion: string
  parameterSetId: string
}

export interface ResidualSample {
  comparisonId: string
  predictionId: string
  observedAt: string
  signedError: number
  standardizedResidual: number | null
  classification: ResidualSampleClass
}

export interface ResidualSeries {
  id: string
  identity: ResidualSeriesIdentity
  samples: readonly ResidualSample[]
}

function nonBlank(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function parseIso(value: string, field: string): number {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function validateOptions(options: ResidualIntelligenceOptions): void {
  if (!Number.isFinite(options.standardizedResidualThreshold) || options.standardizedResidualThreshold <= 0) {
    throw new Error('standardizedResidualThreshold must be a positive finite number')
  }
  if (!Number.isInteger(options.minQuantifiedSamples) || options.minQuantifiedSamples < 2) {
    throw new Error('minQuantifiedSamples must be an integer >= 2')
  }
}

function validateFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite`)
}

function identityForPrediction(prediction: RealityPredictionRecord): ResidualSeriesIdentity {
  return {
    subjectId: nonBlank(prediction.subjectId, 'prediction.subjectId'),
    field: nonBlank(prediction.field, 'prediction.field'),
    unit: nonBlank(prediction.unit, 'prediction.unit'),
    engineId: nonBlank(prediction.provenance.engineId, 'prediction.provenance.engineId'),
    modelId: nonBlank(prediction.provenance.modelId, 'prediction.provenance.modelId'),
    modelVersion: nonBlank(prediction.provenance.modelVersion, 'prediction.provenance.modelVersion'),
    parameterSetId: nonBlank(prediction.provenance.parameterSetId, 'prediction.provenance.parameterSetId'),
  }
}

function seriesId(identity: ResidualSeriesIdentity): string {
  const parts = [
    identity.subjectId,
    identity.field,
    identity.unit,
    identity.engineId,
    identity.modelId,
    identity.modelVersion,
    identity.parameterSetId,
  ]
  return `residual-series:${parts.map((part) => encodeURIComponent(part)).join('|')}`
}

function classificationForResidual(
  standardizedResidual: number | null,
  threshold: number,
): ResidualSampleClass {
  if (standardizedResidual === null) return 'unquantified'
  if (standardizedResidual >= threshold) return 'extreme-positive'
  if (standardizedResidual <= -threshold) return 'extreme-negative'
  return 'within-expected-noise'
}

function predictionForComparison(
  ledger: RealityErrorLedger,
  comparison: RealityComparisonRecord,
): RealityPredictionRecord {
  const prediction = ledger.predictionsById[comparison.predictionId]
  if (!prediction) throw new Error(`comparison ${comparison.id} references unknown prediction ${comparison.predictionId}`)
  if (ledger.statusByPredictionId[prediction.id] !== 'matched') {
    throw new Error(`prediction ${prediction.id} must be matched before residual analysis`)
  }
  const indexedComparisonId = ledger.comparisonIdByPredictionId[prediction.id]
  if (indexedComparisonId !== comparison.id) {
    throw new Error(`comparison index for prediction ${prediction.id} does not reference comparison ${comparison.id}`)
  }
  if (comparison.subjectId !== prediction.subjectId) throw new Error(`comparison ${comparison.id} subject mismatch`)
  if (comparison.field !== prediction.field) throw new Error(`comparison ${comparison.id} field mismatch`)
  if (comparison.unit !== prediction.unit) throw new Error(`comparison ${comparison.id} unit mismatch`)
  if (comparison.predictionProvenanceId !== prediction.provenance.provenanceId) {
    throw new Error(`comparison ${comparison.id} provenance mismatch`)
  }
  validateFinite(comparison.signedError, `comparison ${comparison.id} signedError`)
  validateFinite(comparison.absoluteError, `comparison ${comparison.id} absoluteError`)
  if (comparison.standardizedResidual !== null) {
    validateFinite(comparison.standardizedResidual, `comparison ${comparison.id} standardizedResidual`)
  }
  parseIso(comparison.observedAt, `comparison ${comparison.id} observedAt`)
  return prediction
}

export function buildResidualSeries(
  ledger: RealityErrorLedger,
  options: ResidualIntelligenceOptions,
): readonly ResidualSeries[] {
  validateOptions(options)
  const grouped = new Map<string, { identity: ResidualSeriesIdentity; samples: ResidualSample[] }>()

  for (const [comparisonKey, comparison] of Object.entries(ledger.comparisonsById)) {
    if (comparison.id !== comparisonKey) {
      throw new Error(`comparison key ${comparisonKey} does not match record id ${comparison.id}`)
    }
    const prediction = predictionForComparison(ledger, comparison)
    const identity = identityForPrediction(prediction)
    if (identity.subjectId !== ledger.subjectId) {
      throw new Error(`prediction ${prediction.id} subject does not match residual ledger subject`)
    }
    const id = seriesId(identity)
    const entry = grouped.get(id) ?? { identity, samples: [] }
    entry.samples.push({
      comparisonId: comparison.id,
      predictionId: prediction.id,
      observedAt: comparison.observedAt,
      signedError: comparison.signedError,
      standardizedResidual: comparison.standardizedResidual,
      classification: classificationForResidual(
        comparison.standardizedResidual,
        options.standardizedResidualThreshold,
      ),
    })
    grouped.set(id, entry)
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, entry]) => ({
      id,
      identity: entry.identity,
      samples: [...entry.samples].sort((left, right) => {
        const timeDelta = Date.parse(left.observedAt) - Date.parse(right.observedAt)
        return timeDelta || left.comparisonId.localeCompare(right.comparisonId)
      }),
    }))
}
