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


export type ResidualStructureClass =
  | 'insufficient-evidence'
  | 'noise-compatible'
  | 'persistent-positive-bias-candidate'
  | 'persistent-negative-bias-candidate'
  | 'repeated-extreme-residuals'
  | 'mixed-residuals'

export interface ResidualSeriesAnalysis {
  seriesId: string
  identity: ResidualSeriesIdentity
  sampleCount: number
  quantifiedSampleCount: number
  unquantifiedSampleCount: number
  extremeSampleCount: number
  meanSignedError: number
  meanStandardizedResidual: number | null
  classification: ResidualStructureClass
  candidateStructure: boolean
  comparisonIds: readonly string[]
  predictionIds: readonly string[]
  latestObservedAt: string
  explanation: string
}

export interface ResidualIntelligenceReport {
  subjectId: string
  ledgerRevision: number
  evaluatedAt: string
  semantics: 'candidate-residual-structure-not-biological-discovery'
  options: ResidualIntelligenceOptions
  series: readonly ResidualSeriesAnalysis[]
  boundary: {
    diagnosisInferenceAllowed: false
    causalAttributionAllowed: false
    automaticRecalibrationAllowed: false
    automaticConceptGenerationAllowed: false
    automaticLawPromotionAllowed: false
  }
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function structureForSeries(
  series: ResidualSeries,
  options: ResidualIntelligenceOptions,
): Pick<ResidualSeriesAnalysis, 'classification' | 'candidateStructure' | 'explanation'> {
  const quantified = series.samples.filter(
    (sample): sample is ResidualSample & { standardizedResidual: number } =>
      sample.standardizedResidual !== null,
  )

  if (quantified.length < options.minQuantifiedSamples) {
    return {
      classification: 'insufficient-evidence',
      candidateStructure: false,
      explanation: 'Too few quantified residuals exist to evaluate repeated structure.',
    }
  }

  const tail = quantified.slice(-options.minQuantifiedSamples)
  if (tail.every((sample) => sample.classification === 'extreme-positive')) {
    return {
      classification: 'persistent-positive-bias-candidate',
      candidateStructure: true,
      explanation: 'The latest quantified residual window is persistently above the configured extreme threshold.',
    }
  }
  if (tail.every((sample) => sample.classification === 'extreme-negative')) {
    return {
      classification: 'persistent-negative-bias-candidate',
      candidateStructure: true,
      explanation: 'The latest quantified residual window is persistently below the configured extreme threshold.',
    }
  }

  if (quantified.every((sample) => sample.classification === 'within-expected-noise')) {
    return {
      classification: 'noise-compatible',
      candidateStructure: false,
      explanation: 'All quantified residuals remain within the configured standardized-residual threshold.',
    }
  }

  const extremeCount = quantified.filter(
    (sample) =>
      sample.classification === 'extreme-positive'
      || sample.classification === 'extreme-negative',
  ).length
  if (extremeCount >= options.minQuantifiedSamples) {
    return {
      classification: 'repeated-extreme-residuals',
      candidateStructure: true,
      explanation: 'Repeated extreme residuals exist without a persistent single-direction tail.',
    }
  }

  return {
    classification: 'mixed-residuals',
    candidateStructure: false,
    explanation: 'The residual series is mixed and does not meet the configured repeated-structure criteria.',
  }
}

function analyzeSeries(
  series: ResidualSeries,
  options: ResidualIntelligenceOptions,
): ResidualSeriesAnalysis {
  const quantified = series.samples.filter(
    (sample): sample is ResidualSample & { standardizedResidual: number } =>
      sample.standardizedResidual !== null,
  )
  const extremeSampleCount = quantified.filter(
    (sample) =>
      sample.classification === 'extreme-positive'
      || sample.classification === 'extreme-negative',
  ).length
  const structure = structureForSeries(series, options)
  const latest = series.samples[series.samples.length - 1]
  if (!latest) throw new Error(`residual series ${series.id} has no samples`)

  return {
    seriesId: series.id,
    identity: series.identity,
    sampleCount: series.samples.length,
    quantifiedSampleCount: quantified.length,
    unquantifiedSampleCount: series.samples.length - quantified.length,
    extremeSampleCount,
    meanSignedError: mean(series.samples.map((sample) => sample.signedError)),
    meanStandardizedResidual: quantified.length
      ? mean(quantified.map((sample) => sample.standardizedResidual))
      : null,
    classification: structure.classification,
    candidateStructure: structure.candidateStructure,
    comparisonIds: series.samples.map((sample) => sample.comparisonId),
    predictionIds: series.samples.map((sample) => sample.predictionId),
    latestObservedAt: latest.observedAt,
    explanation: structure.explanation,
  }
}

export function analyzeResidualIntelligence(
  ledger: RealityErrorLedger,
  evaluatedAt: string,
  options: ResidualIntelligenceOptions,
): ResidualIntelligenceReport {
  const evaluatedAtMs = parseIso(evaluatedAt, 'evaluatedAt')
  validateOptions(options)
  for (const comparison of Object.values(ledger.comparisonsById)) {
    const comparisonCreatedAtMs = parseIso(
      comparison.createdAt,
      `comparison ${comparison.id} createdAt`,
    )
    if (evaluatedAtMs < comparisonCreatedAtMs) {
      throw new Error('evaluatedAt must not be before a comparison creation time')
    }
  }

  const series = buildResidualSeries(ledger, options)
    .map((item) => analyzeSeries(item, options))
    .sort((left, right) => left.seriesId.localeCompare(right.seriesId))

  return {
    subjectId: ledger.subjectId,
    ledgerRevision: ledger.revision,
    evaluatedAt,
    semantics: 'candidate-residual-structure-not-biological-discovery',
    options: { ...options },
    series,
    boundary: {
      diagnosisInferenceAllowed: false,
      causalAttributionAllowed: false,
      automaticRecalibrationAllowed: false,
      automaticConceptGenerationAllowed: false,
      automaticLawPromotionAllowed: false,
    },
  }
}
