import type { LongitudinalEvent } from '../panaceaLongitudinalState.ts'
import { validateLongitudinalEvent } from '../panaceaLongitudinalState.ts'
import type { PhysiologicalFidelity, PhysiologicalValidationClass } from './runtime.ts'

export type RealityPredictionStatus = 'pending' | 'matched' | 'expired-unobserved'

export interface RealityPredictionRecord {
  id: string
  subjectId: string
  field: string
  unit: string
  predictedValue: number
  predictedSigma: number | null
  createdAt: string
  targetAt: string
  predictionClass: 'prospective'
  provenance: {
    provenanceId: string
    engineId: string
    modelId: string
    modelVersion: string
    parameterSetId: string
    validationClass: PhysiologicalValidationClass
    fidelity: PhysiologicalFidelity
    parentProvenanceIds: readonly string[]
  }
}

export interface ObservationSigmaEvidence {
  sigma: number
  provenanceId: string
}

export interface RealityComparisonOptions {
  matchToleranceMs: number
  comparisonCreatedAt: string
  observationSigma?: ObservationSigmaEvidence | null
}

export interface RealityComparisonRecord {
  id: string
  predictionId: string
  subjectId: string
  field: string
  unit: string
  observationEventId: string
  observedValue: number
  observedAt: string
  signedError: number
  absoluteError: number
  predictedSigma: number | null
  observedSigma: number | null
  combinedSigma: number | null
  standardizedResidual: number | null
  predictionProvenanceId: string
  observationSourceId: string
  observationSigmaProvenanceId: string | null
  createdAt: string
}

export interface RealityErrorLedger {
  subjectId: string
  revision: number
  predictionsById: Readonly<Record<string, RealityPredictionRecord>>
  statusByPredictionId: Readonly<Record<string, RealityPredictionStatus>>
  comparisonsById: Readonly<Record<string, RealityComparisonRecord>>
  comparisonIdByPredictionId: Readonly<Record<string, string>>
}

export interface RealityPredictionInsertResult {
  ledger: RealityErrorLedger
  status: 'inserted' | 'duplicate'
}

export interface RealityComparisonResult {
  ledger: RealityErrorLedger
  comparison: RealityComparisonRecord
}

const ADMISSIBLE_OBSERVATION_STATES = new Set(['measured', 'imported', 'clinician-entered'])

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

function validSigma(value: number | null, field: string): void {
  if (value === null) return
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be null or a non-negative finite number`)
}

function normalizePrediction(input: RealityPredictionRecord): RealityPredictionRecord {
  if (input.predictionClass !== 'prospective') throw new Error('predictionClass must be prospective')
  if (!Number.isFinite(input.predictedValue)) throw new Error('predictedValue must be finite')
  validSigma(input.predictedSigma, 'predictedSigma')
  const created = parseIso(input.createdAt, 'createdAt')
  const target = parseIso(input.targetAt, 'targetAt')
  if (target < created) throw new Error('targetAt must not be before createdAt')

  const parentProvenanceIds = input.provenance.parentProvenanceIds.map((id, index) => nonBlank(id, `parentProvenanceIds[${index}]`))
  return {
    ...input,
    id: nonBlank(input.id, 'id'),
    subjectId: nonBlank(input.subjectId, 'subjectId'),
    field: nonBlank(input.field, 'field'),
    unit: nonBlank(input.unit, 'unit'),
    provenance: {
      ...input.provenance,
      provenanceId: nonBlank(input.provenance.provenanceId, 'provenanceId'),
      engineId: nonBlank(input.provenance.engineId, 'engineId'),
      modelId: nonBlank(input.provenance.modelId, 'modelId'),
      modelVersion: nonBlank(input.provenance.modelVersion, 'modelVersion'),
      parameterSetId: nonBlank(input.provenance.parameterSetId, 'parameterSetId'),
      parentProvenanceIds,
    },
  }
}

function samePrediction(a: RealityPredictionRecord, b: RealityPredictionRecord): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function validateOptions(options: RealityComparisonOptions): number {
  if (!Number.isFinite(options.matchToleranceMs) || options.matchToleranceMs < 0) {
    throw new Error('matchToleranceMs must be a non-negative finite number')
  }
  return parseIso(options.comparisonCreatedAt, 'comparisonCreatedAt')
}

function observationSigma(options: RealityComparisonOptions): { sigma: number | null; provenanceId: string | null } {
  const evidence = options.observationSigma
  if (evidence == null) return { sigma: null, provenanceId: null }
  if (!Number.isFinite(evidence.sigma) || evidence.sigma < 0) throw new Error('observationSigma.sigma must be a non-negative finite number')
  return { sigma: evidence.sigma, provenanceId: nonBlank(evidence.provenanceId, 'observationSigma.provenanceId') }
}

function predictionForComparison(ledger: RealityErrorLedger, predictionId: string): RealityPredictionRecord {
  const id = nonBlank(predictionId, 'predictionId')
  const prediction = ledger.predictionsById[id]
  if (!prediction) throw new Error(`unknown prediction id ${id}`)
  const status = ledger.statusByPredictionId[id]
  if (status === 'matched') throw new Error(`prediction ${id} is already matched`)
  if (status === 'expired-unobserved') throw new Error(`prediction ${id} is expired-unobserved`)
  if (status !== 'pending') throw new Error(`prediction ${id} has invalid lifecycle status`)
  return prediction
}

function validateRealityObservation(
  prediction: RealityPredictionRecord,
  observation: LongitudinalEvent<number>,
  matchToleranceMs: number,
  comparisonCreatedAtMs: number,
): number {
  validateLongitudinalEvent(observation)
  if (!ADMISSIBLE_OBSERVATION_STATES.has(String(observation.semanticState))) {
    throw new Error(`observation semanticState ${String(observation.semanticState)} is not an admissible reality observation`)
  }
  if (observation.subjectId.trim() !== prediction.subjectId) throw new Error('observation subject does not match prediction subject')
  if (observation.metric.trim() !== prediction.field) throw new Error('observation field does not match prediction field')
  if (typeof observation.unit !== 'string' || observation.unit.trim() !== prediction.unit) throw new Error('observation unit does not match prediction unit')
  if (typeof observation.value !== 'number') throw new Error('observation value must be numeric')
  if (!Number.isFinite(observation.value)) throw new Error('observation value must be finite')
  const observedAtMs = parseIso(observation.recordedAt, 'observation.recordedAt')
  const targetAtMs = parseIso(prediction.targetAt, 'prediction.targetAt')
  if (Math.abs(observedAtMs - targetAtMs) > matchToleranceMs) throw new Error('observation is outside match tolerance')
  if (comparisonCreatedAtMs < observedAtMs) throw new Error('comparisonCreatedAt must not be before observation time')
  return observedAtMs
}

export function createRealityErrorLedger(subjectId: string): RealityErrorLedger {
  return {
    subjectId: nonBlank(subjectId, 'subjectId'),
    revision: 0,
    predictionsById: {},
    statusByPredictionId: {},
    comparisonsById: {},
    comparisonIdByPredictionId: {},
  }
}

export function recordRealityPrediction(
  ledger: RealityErrorLedger,
  prediction: RealityPredictionRecord,
): RealityPredictionInsertResult {
  const normalized = normalizePrediction(prediction)
  if (normalized.subjectId !== ledger.subjectId) throw new Error('prediction subjectId does not match ledger subjectId')

  const existing = ledger.predictionsById[normalized.id]
  if (existing) {
    if (!samePrediction(existing, normalized)) throw new Error(`conflicting prediction id ${normalized.id}`)
    return { ledger, status: 'duplicate' }
  }

  return {
    status: 'inserted',
    ledger: {
      ...ledger,
      revision: ledger.revision + 1,
      predictionsById: { ...ledger.predictionsById, [normalized.id]: normalized },
      statusByPredictionId: { ...ledger.statusByPredictionId, [normalized.id]: 'pending' },
    },
  }
}

export function markPredictionExpiredUnobserved(
  ledger: RealityErrorLedger,
  predictionId: string,
  at: string,
): RealityErrorLedger {
  const id = nonBlank(predictionId, 'predictionId')
  const prediction = ledger.predictionsById[id]
  if (!prediction) throw new Error(`unknown prediction id ${id}`)
  const status = ledger.statusByPredictionId[id]
  if (status === 'matched') throw new Error(`prediction ${id} is already matched`)
  if (status === 'expired-unobserved') return ledger
  const expiredAt = parseIso(at, 'at')
  if (expiredAt < parseIso(prediction.targetAt, 'targetAt')) throw new Error('cannot expire prediction before target time')
  return {
    ...ledger,
    revision: ledger.revision + 1,
    statusByPredictionId: { ...ledger.statusByPredictionId, [id]: 'expired-unobserved' },
  }
}

export function comparePredictionToObservation(
  ledger: RealityErrorLedger,
  predictionId: string,
  observation: LongitudinalEvent<number>,
  options: RealityComparisonOptions,
): RealityComparisonResult {
  const prediction = predictionForComparison(ledger, predictionId)
  const comparisonCreatedAtMs = validateOptions(options)
  validateRealityObservation(prediction, observation, options.matchToleranceMs, comparisonCreatedAtMs)
  const sigma = observationSigma(options)
  const signedError = observation.value - prediction.predictedValue
  const absoluteError = Math.abs(signedError)
  const combinedSigma = prediction.predictedSigma !== null && sigma.sigma !== null
    ? Math.hypot(prediction.predictedSigma, sigma.sigma)
    : null
  const standardizedResidual = combinedSigma !== null && combinedSigma > 0 ? signedError / combinedSigma : null
  const id = `comparison:${encodeURIComponent(prediction.id)}:${encodeURIComponent(observation.id)}`
  const comparison: RealityComparisonRecord = {
    id,
    predictionId: prediction.id,
    subjectId: prediction.subjectId,
    field: prediction.field,
    unit: prediction.unit,
    observationEventId: observation.id,
    observedValue: observation.value,
    observedAt: observation.recordedAt,
    signedError,
    absoluteError,
    predictedSigma: prediction.predictedSigma,
    observedSigma: sigma.sigma,
    combinedSigma,
    standardizedResidual,
    predictionProvenanceId: prediction.provenance.provenanceId,
    observationSourceId: observation.provenance.sourceId,
    observationSigmaProvenanceId: sigma.provenanceId,
    createdAt: options.comparisonCreatedAt,
  }
  const collision = ledger.comparisonsById[id]
  if (collision && JSON.stringify(collision) !== JSON.stringify(comparison)) throw new Error(`conflicting comparison id ${id}`)
  return {
    comparison,
    ledger: {
      ...ledger,
      revision: ledger.revision + 1,
      statusByPredictionId: { ...ledger.statusByPredictionId, [prediction.id]: 'matched' },
      comparisonsById: { ...ledger.comparisonsById, [id]: comparison },
      comparisonIdByPredictionId: { ...ledger.comparisonIdByPredictionId, [prediction.id]: id },
    },
  }
}
