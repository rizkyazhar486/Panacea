import assert from 'node:assert/strict'
import {
  comparePredictionToObservation,
  createRealityErrorLedger,
  recordRealityPrediction,
  type RealityErrorLedger,
  type RealityPredictionRecord,
} from '../../src/lib/physiology/realityErrorLedger.ts'
import {
  buildResidualSeries,
  type ResidualIntelligenceOptions,
} from '../../src/lib/humanLaw/residualIntelligence.ts'

const options: ResidualIntelligenceOptions = {
  standardizedResidualThreshold: 2,
  minQuantifiedSamples: 3,
}

const prediction = (
  id: string,
  targetAt: string,
  overrides: Partial<RealityPredictionRecord> = {},
): RealityPredictionRecord => ({
  id,
  subjectId: 'subject-1',
  field: 'cardio.heart_rate',
  unit: 'bpm',
  predictedValue: 100,
  predictedSigma: 1,
  createdAt: '2026-09-28T01:00:00.000Z',
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
    parentProvenanceIds: [],
  },
  ...overrides,
})

const observation = (
  id: string,
  recordedAt: string,
  value: number,
  field = 'cardio.heart_rate',
  unit = 'bpm',
) => ({
  id,
  subjectId: 'subject-1',
  domain: 'vital',
  metric: field,
  value,
  unit,
  recordedAt,
  confidence: 0.95,
  provenance: {
    sourceKind: 'wearable',
    sourceId: 'device:watch',
    capturedAt: recordedAt,
    receivedAt: recordedAt,
  },
  consent: {
    granted: true,
    purposes: ['personal-visualization'],
    grantedAt: '2026-09-28T00:00:00.000Z',
  },
  review: { state: 'not-required' },
  semanticState: 'measured',
}) as any

function addMatched(
  ledger: RealityErrorLedger,
  record: RealityPredictionRecord,
  observedValue: number,
  observationId: string,
  observationSigma: number | null = 0,
): RealityErrorLedger {
  let next = recordRealityPrediction(ledger, record).ledger
  return comparePredictionToObservation(
    next,
    record.id,
    observation(observationId, record.targetAt, observedValue, record.field, record.unit),
    {
      matchToleranceMs: 0,
      comparisonCreatedAt: new Date(Date.parse(record.targetAt) + 1_000).toISOString(),
      ...(observationSigma === null
        ? {}
        : { observationSigma: { sigma: observationSigma, provenanceId: 'sigma:fixture' } }),
    },
  ).ledger
}

let ledger = createRealityErrorLedger('subject-1')
ledger = addMatched(ledger, prediction('p-late', '2026-09-28T01:04:00.000Z'), 102.5, 'o-late')
ledger = addMatched(ledger, prediction('p-noise', '2026-09-28T01:02:00.000Z'), 100.5, 'o-noise')
ledger = addMatched(ledger, prediction('p-negative', '2026-09-28T01:03:00.000Z'), 97.5, 'o-negative')
ledger = addMatched(ledger, prediction('p-unknown', '2026-09-28T01:05:00.000Z'), 103, 'o-unknown', null)

const series = buildResidualSeries(ledger, options)
assert.equal(series.length, 1)
assert.deepEqual(
  series[0].samples.map((sample) => [sample.predictionId, sample.classification]),
  [
    ['p-noise', 'within-expected-noise'],
    ['p-negative', 'extreme-negative'],
    ['p-late', 'extreme-positive'],
    ['p-unknown', 'unquantified'],
  ],
)
assert.equal(series[0].samples[0].standardizedResidual, 0.5)
assert.equal(series[0].samples[1].standardizedResidual, -2.5)
assert.equal(series[0].samples[2].standardizedResidual, 2.5)
assert.equal(series[0].samples[3].standardizedResidual, null)

const replay = buildResidualSeries(ledger, options)
assert.deepEqual(replay, series)

let identityLedger = createRealityErrorLedger('subject-1')
identityLedger = addMatched(
  identityLedger,
  prediction('v1', '2026-09-28T02:01:00.000Z'),
  100.5,
  'o-v1',
)
identityLedger = addMatched(
  identityLedger,
  prediction('v2', '2026-09-28T02:02:00.000Z', {
    provenance: {
      ...prediction('tmp', '2026-09-28T02:02:00.000Z').provenance,
      provenanceId: 'prov:v2',
      modelVersion: '2.0.0',
    },
  }),
  100.5,
  'o-v2',
)
identityLedger = addMatched(
  identityLedger,
  prediction('param', '2026-09-28T02:03:00.000Z', {
    provenance: {
      ...prediction('tmp2', '2026-09-28T02:03:00.000Z').provenance,
      provenanceId: 'prov:param',
      parameterSetId: 'patient-fit-v2',
    },
  }),
  100.5,
  'o-param',
)
identityLedger = addMatched(
  identityLedger,
  prediction('resp', '2026-09-28T02:04:00.000Z', {
    field: 'resp.rate',
    unit: 'breaths/min',
  }),
  101,
  'o-resp',
)

const identitySeries = buildResidualSeries(identityLedger, options)
assert.equal(identitySeries.length, 4)
assert.equal(new Set(identitySeries.map((item) => item.id)).size, 4)
assert.deepEqual(
  identitySeries.map((item) => [
    item.identity.field,
    item.identity.unit,
    item.identity.modelVersion,
    item.identity.parameterSetId,
  ]),
  [
    ['cardio.heart_rate', 'bpm', '1.0.0', 'patient-fit-v2'],
    ['cardio.heart_rate', 'bpm', '1.0.0', 'population-v1'],
    ['cardio.heart_rate', 'bpm', '2.0.0', 'population-v1'],
    ['resp.rate', 'breaths/min', '1.0.0', 'population-v1'],
  ],
)

assert.throws(
  () => buildResidualSeries(ledger, { ...options, standardizedResidualThreshold: 0 }),
  /standardizedResidualThreshold/,
)
assert.throws(
  () => buildResidualSeries(ledger, { ...options, standardizedResidualThreshold: Number.NaN }),
  /standardizedResidualThreshold/,
)
assert.throws(
  () => buildResidualSeries(ledger, { ...options, minQuantifiedSamples: 1 }),
  /minQuantifiedSamples/,
)
assert.throws(
  () => buildResidualSeries(ledger, { ...options, minQuantifiedSamples: 2.5 }),
  /minQuantifiedSamples/,
)

const comparisonId = ledger.comparisonIdByPredictionId['p-noise']
const comparison = ledger.comparisonsById[comparisonId]

assert.throws(
  () => buildResidualSeries({
    ...ledger,
    comparisonsById: {
      ...ledger.comparisonsById,
      [comparisonId]: { ...comparison, predictionId: 'missing' },
    },
  }, options),
  /unknown prediction/,
)

for (const [label, corrupted] of [
  ['subject', { ...comparison, subjectId: 'subject-2' }],
  ['field', { ...comparison, field: 'wrong.field' }],
  ['unit', { ...comparison, unit: 'wrong-unit' }],
  ['provenance', { ...comparison, predictionProvenanceId: 'wrong-provenance' }],
] as const) {
  assert.throws(
    () => buildResidualSeries({
      ...ledger,
      comparisonsById: { ...ledger.comparisonsById, [comparisonId]: corrupted },
    }, options),
    new RegExp(label),
  )
}

assert.throws(
  () => buildResidualSeries({
    ...ledger,
    statusByPredictionId: {
      ...ledger.statusByPredictionId,
      'p-noise': 'pending',
    },
  }, options),
  /matched/,
)

assert.throws(
  () => buildResidualSeries({
    ...ledger,
    comparisonIdByPredictionId: {
      ...ledger.comparisonIdByPredictionId,
      'p-noise': ledger.comparisonIdByPredictionId['p-negative'],
    },
  }, options),
  /comparison index/,
)

assert.throws(
  () => buildResidualSeries({
    ...ledger,
    comparisonsById: {
      ...ledger.comparisonsById,
      [comparisonId]: { ...comparison, signedError: Number.NaN },
    },
  }, options),
  /signedError/,
)
assert.throws(
  () => buildResidualSeries({
    ...ledger,
    comparisonsById: {
      ...ledger.comparisonsById,
      [comparisonId]: { ...comparison, standardizedResidual: Number.POSITIVE_INFINITY },
    },
  }, options),
  /standardizedResidual/,
)

console.log('human-law residual intelligence task1: exact-identity residual series and sample classification')
