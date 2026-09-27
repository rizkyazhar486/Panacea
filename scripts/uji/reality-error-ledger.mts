import assert from 'node:assert/strict'
import {
  createRealityErrorLedger,
  markPredictionExpiredUnobserved,
  recordRealityPrediction,
  type RealityPredictionRecord,
} from '../../src/lib/physiology/realityErrorLedger.ts'

const prediction = (overrides: Partial<RealityPredictionRecord> = {}): RealityPredictionRecord => ({
  id: 'pred-1',
  subjectId: 'subject-1',
  field: 'cardio.heart_rate',
  unit: 'bpm',
  predictedValue: 112,
  predictedSigma: 6,
  createdAt: '2026-09-27T10:00:00.000Z',
  targetAt: '2026-09-27T10:30:00.000Z',
  predictionClass: 'prospective',
  provenance: {
    provenanceId: 'prov-1',
    engineId: 'cardio.engine',
    modelId: 'cardio-model',
    modelVersion: '1.0.0',
    parameterSetId: 'population-v1',
    validationClass: 'synthetic',
    fidelity: 'infrastructure-fixture',
    parentProvenanceIds: ['parent-1'],
  },
  ...overrides,
})

const empty = createRealityErrorLedger('subject-1')
assert.equal(empty.subjectId, 'subject-1')
assert.equal(empty.revision, 0)
assert.deepEqual(empty.predictionsById, {})
assert.deepEqual(empty.statusByPredictionId, {})
assert.deepEqual(empty.comparisonsById, {})
assert.deepEqual(empty.comparisonIdByPredictionId, {})

const inserted = recordRealityPrediction(empty, prediction())
assert.equal(inserted.status, 'inserted')
assert.equal(inserted.ledger.revision, 1)
assert.equal(inserted.ledger.statusByPredictionId['pred-1'], 'pending')
assert.equal(inserted.ledger.predictionsById['pred-1'].predictedValue, 112)

const duplicate = recordRealityPrediction(inserted.ledger, prediction())
assert.equal(duplicate.status, 'duplicate')
assert.equal(duplicate.ledger.revision, 1)
assert.deepEqual(duplicate.ledger, inserted.ledger)

assert.throws(() => recordRealityPrediction(inserted.ledger, prediction({ predictedValue: 113 })), /conflicting prediction id/)
assert.throws(() => createRealityErrorLedger('   '), /subjectId/)
assert.throws(() => recordRealityPrediction(empty, prediction({ id: ' ' })), /id/)
assert.throws(() => recordRealityPrediction(empty, prediction({ field: ' ' })), /field/)
assert.throws(() => recordRealityPrediction(empty, prediction({ unit: ' ' })), /unit/)
assert.throws(() => recordRealityPrediction(empty, prediction({ predictedValue: Number.NaN })), /predictedValue/)
assert.throws(() => recordRealityPrediction(empty, prediction({ predictedSigma: -1 })), /predictedSigma/)
assert.throws(() => recordRealityPrediction(empty, prediction({ predictedSigma: Number.POSITIVE_INFINITY })), /predictedSigma/)
assert.throws(() => recordRealityPrediction(empty, prediction({ createdAt: 'not-a-date' })), /createdAt/)
assert.throws(() => recordRealityPrediction(empty, prediction({ targetAt: '2026-09-27T09:59:59.000Z' })), /targetAt/)
assert.throws(() => recordRealityPrediction(empty, prediction({ predictionClass: 'counterfactual' as never })), /prospective/)
assert.throws(() => recordRealityPrediction(empty, prediction({ subjectId: 'subject-2' })), /subjectId.*ledger/)
assert.throws(() => recordRealityPrediction(empty, prediction({ provenance: { ...prediction().provenance, modelId: ' ' } })), /modelId/)

assert.throws(() => markPredictionExpiredUnobserved(inserted.ledger, 'missing', '2026-09-27T10:31:00.000Z'), /unknown prediction id/)
assert.throws(() => markPredictionExpiredUnobserved(inserted.ledger, 'pred-1', '2026-09-27T10:29:59.000Z'), /before target/)
const beforeExpiry = structuredClone(inserted.ledger.predictionsById['pred-1'])
const expired = markPredictionExpiredUnobserved(inserted.ledger, 'pred-1', '2026-09-27T10:31:00.000Z')
assert.equal(expired.revision, 2)
assert.equal(expired.statusByPredictionId['pred-1'], 'expired-unobserved')
assert.deepEqual(expired.comparisonsById, {})
assert.deepEqual(expired.predictionsById['pred-1'], beforeExpiry)
const expiredAgain = markPredictionExpiredUnobserved(expired, 'pred-1', '2026-09-27T10:32:00.000Z')
assert.deepEqual(expiredAgain, expired)

console.log('reality-error-ledger task1: prediction lifecycle')
