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

export interface RealityErrorLedger {
  subjectId: string
  revision: number
  predictionsById: Readonly<Record<string, RealityPredictionRecord>>
  statusByPredictionId: Readonly<Record<string, RealityPredictionStatus>>
  comparisonsById: Readonly<Record<string, never>>
  comparisonIdByPredictionId: Readonly<Record<string, string>>
}

export interface RealityPredictionInsertResult {
  ledger: RealityErrorLedger
  status: 'inserted' | 'duplicate'
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
