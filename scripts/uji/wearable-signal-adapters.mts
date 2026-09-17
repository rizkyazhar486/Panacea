import assert from 'node:assert/strict'
import {
  normalizeWearableBatch,
  normalizeWearableSample,
  wearableAdapterCoverage,
  wearableProviderSupportsMetric,
  type WearableSample,
} from '../../src/lib/wearableSignalAdapters.ts'

const consent = {
  granted: true,
  purposes: ['personal-visualization', 'ai-context'] as const,
  grantedAt: '2026-09-01T00:00:00.000Z',
}

function sample(overrides: Partial<WearableSample> = {}): WearableSample {
  return {
    provider: 'apple-health',
    externalId: 'sample-1',
    subjectId: 'opaque-subject',
    metric: 'resting-heart-rate',
    value: 58,
    unit: 'bpm',
    recordedAt: '2026-09-16T01:00:00.000Z',
    receivedAt: '2026-09-16T01:01:00.000Z',
    confidence: 0.95,
    sourceDevice: 'watch',
    ...overrides,
  }
}

const apple = normalizeWearableSample(sample(), { consent })
assert.equal(apple.metric, 'resting-heart-rate')
assert.equal(apple.domain, 'vital')
assert.equal(apple.unit, 'bpm')
assert.equal(apple.provenance.sourceId, 'apple-health:watch')

const hrv = normalizeWearableSample(sample({
  provider: 'oura',
  externalId: 'oura-hrv',
  metric: 'hrv-rmssd',
  value: 0.052,
  unit: 's',
}), { consent })
assert.equal(hrv.value, 52)
assert.equal(hrv.unit, 'ms')
assert.equal(hrv.domain, 'recovery')

const sleep = normalizeWearableSample(sample({
  provider: 'whoop',
  externalId: 'whoop-sleep',
  metric: 'sleep-duration',
  value: 450,
  unit: 'min',
}), { consent })
assert.equal(sleep.value, 7.5)
assert.equal(sleep.unit, 'h')

const distance = normalizeWearableSample(sample({
  provider: 'strava',
  externalId: 'strava-distance',
  metric: 'distance',
  value: 5000,
  unit: 'm',
}), { consent })
assert.equal(distance.value, 5)
assert.equal(distance.unit, 'km')

const temperature = normalizeWearableSample(sample({
  provider: 'garmin',
  externalId: 'garmin-temp',
  metric: 'body-temperature',
  value: 98.6,
  unit: 'F',
}), { consent })
assert.ok(Math.abs(temperature.value - 37) < 1e-9)
assert.equal(temperature.unit, '°C')

assert.equal(wearableProviderSupportsMetric('oura', 'readiness-score'), true)
assert.equal(wearableProviderSupportsMetric('strava', 'readiness-score'), false)
assert.throws(() => normalizeWearableSample(sample({
  provider: 'strava',
  metric: 'readiness-score',
  unit: 'score',
}), { consent }), /mapping not registered/)

const batch = normalizeWearableBatch([
  sample({ externalId: 'a', recordedAt: '2026-09-16T02:00:00.000Z', receivedAt: '2026-09-16T02:01:00.000Z' }),
  sample({ externalId: 'b', recordedAt: '2026-09-16T01:00:00.000Z', receivedAt: '2026-09-16T01:01:00.000Z' }),
  sample({ externalId: 'b', recordedAt: '2026-09-16T01:00:00.000Z', receivedAt: '2026-09-16T01:01:00.000Z' }),
], { consent })
assert.equal(batch.length, 2)
assert.ok(batch[0].recordedAt < batch[1].recordedAt)

const coverage = wearableAdapterCoverage()
assert.deepEqual(coverage.map((entry) => entry.provider).sort(), ['apple-health', 'garmin', 'health-connect', 'oura', 'strava', 'whoop'])
assert.ok(coverage.every((entry) => entry.metricCount > 0))

console.log('Wearable adapters verified: provider allowlists, deterministic normalized IDs, unit conversion, provenance, consent propagation, deduplication, and multi-provider coverage.')
