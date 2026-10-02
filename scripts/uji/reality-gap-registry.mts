import assert from 'node:assert/strict'
import {
  comparePredictionToObservation,
  createRealityErrorLedger,
  markPredictionExpiredUnobserved,
  recordRealityPrediction,
  type RealityPredictionRecord,
} from '../../src/lib/physiology/realityErrorLedger.ts'
import { buildRealityGapRegistry } from '../../src/lib/physiology/realityGapRegistry.ts'

const prediction = (id: string, targetAt: string, sigma: number | null = 2): RealityPredictionRecord => ({
  id,
  subjectId: 'subject-1',
  field: 'cardio.heart_rate',
  unit: 'bpm',
  predictedValue: 100,
  predictedSigma: sigma,
  createdAt: '2026-09-27T10:00:00.000Z',
  targetAt,
  predictionClass: 'prospective',
  provenance: {
    provenanceId: `prov:${id}`,
    engineId: 'cardio.engine',
    modelId: 'cardio-model',
    modelVersion: '1.0.0',
    parameterSetId: 'population-v1',
    validationClass: 'synthetic',
    fidelity: 'infrastructure-fixture',
    parentProvenanceIds: ['parent-1'],
  },
})

const observation = (id: string, recordedAt: string) => ({
  id,
  subjectId: 'subject-1',
  domain: 'vital',
  metric: 'cardio.heart_rate',
  value: 104,
  unit: 'bpm',
  recordedAt,
  confidence: 0.9,
  provenance: {
    sourceKind: 'wearable',
    sourceId: 'device:watch',
    capturedAt: recordedAt,
    receivedAt: recordedAt,
  },
  consent: {
    granted: true,
    purposes: ['personal-visualization'],
    grantedAt: '2026-09-27T09:00:00.000Z',
  },
  review: { state: 'not-required' },
  semanticState: 'measured',
}) as any

let ledger = createRealityErrorLedger('subject-1')
ledger = recordRealityPrediction(ledger, prediction('pending-future', '2026-09-27T11:30:00.000Z')).ledger
ledger = recordRealityPrediction(ledger, prediction('pending-overdue', '2026-09-27T10:30:00.000Z')).ledger
ledger = recordRealityPrediction(ledger, prediction('expired', '2026-09-27T10:20:00.000Z')).ledger
ledger = markPredictionExpiredUnobserved(ledger, 'expired', '2026-09-27T10:21:00.000Z')
ledger = recordRealityPrediction(ledger, prediction('matched-unknown-sigma', '2026-09-27T10:40:00.000Z')).ledger
ledger = comparePredictionToObservation(
  ledger,
  'matched-unknown-sigma',
  observation('obs-unknown', '2026-09-27T10:40:00.000Z'),
  { matchToleranceMs: 1_000, comparisonCreatedAt: '2026-09-27T10:40:01.000Z' },
).ledger
ledger = recordRealityPrediction(ledger, prediction('matched-quantified', '2026-09-27T10:50:00.000Z')).ledger
ledger = comparePredictionToObservation(
  ledger,
  'matched-quantified',
  observation('obs-quantified', '2026-09-27T10:50:00.000Z'),
  {
    matchToleranceMs: 1_000,
    comparisonCreatedAt: '2026-09-27T10:50:01.000Z',
    observationSigma: { sigma: 1, provenanceId: 'sigma:watch-v1' },
  },
).ledger

const registry = buildRealityGapRegistry(ledger, '2026-09-27T11:00:00.000Z')
assert.equal(registry.semantics, 'epistemic-coverage-not-clinical-completeness')
assert.equal(registry.ledgerRevision, ledger.revision)
assert.deepEqual(registry.counts, {
  predictions: 5,
  pending: 2,
  matched: 2,
  expiredUnobserved: 1,
  matchedWithQuantifiedUncertainty: 1,
  matchedWithoutQuantifiedUncertainty: 1,
})
assert.deepEqual(
  registry.gaps.map((gap) => [gap.predictionId, gap.kind, gap.overdue]),
  [
    ['expired', 'observation-missing', true],
    ['pending-overdue', 'awaiting-observation', true],
    ['matched-unknown-sigma', 'uncertainty-unquantified', false],
    ['pending-future', 'awaiting-observation', false],
  ],
)
assert.equal(registry.gaps.some((gap) => gap.predictionId === 'matched-quantified'), false)
assert.ok(registry.gaps.every((gap) => gap.predictionProvenanceId.startsWith('prov:')))
assert.ok(registry.gaps.every((gap) => !gap.explanation.toLowerCase().includes('diagnos')))

const replay = buildRealityGapRegistry(ledger, '2026-09-27T11:00:00.000Z')
assert.deepEqual(replay, registry)

assert.throws(() => buildRealityGapRegistry(ledger, 'not-a-date'), /evaluatedAt/)
assert.throws(
  () => buildRealityGapRegistry({
    ...ledger,
    statusByPredictionId: { ...ledger.statusByPredictionId, 'pending-future': 'matched' },
  }, '2026-09-27T11:00:00.000Z'),
  /matched prediction.*comparison/,
)

console.log('reality-gap-registry: explicit epistemic gaps, deterministic counts, and fail-closed ledger consistency verified')
