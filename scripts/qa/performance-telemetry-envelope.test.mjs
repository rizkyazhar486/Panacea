import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PERFORMANCE_TELEMETRY_POLICY,
  canSynchronizeTelemetry,
  sortAndDedupeTelemetry,
  validatePerformanceTelemetry,
} from '../../src/lib/performanceTelemetryEnvelope.ts'

const make = (overrides = {}) => ({
  id: 'a',
  streamId: 'hr',
  sequence: 1,
  metricId: 'heart-rate',
  value: 150,
  unit: 'bpm',
  capturedAt: '2026-09-20T00:00:00.000Z',
  receivedAt: '2026-09-20T00:00:00.100Z',
  truthClass: 'measured',
  sourceType: 'wearable',
  sourceId: 'strap',
  confidence: 0.99,
  timestampQuality: 'hardware-clock',
  syncGroup: 'session-1',
  ...overrides,
})

test('telemetry contract requires provenance and valid timing', () => {
  assert.equal(validatePerformanceTelemetry(make(), Date.parse('2026-09-20T00:00:01Z')).valid, true)
  assert.equal(validatePerformanceTelemetry(make({ sourceId: '' })).valid, false)
  assert.equal(PERFORMANCE_TELEMETRY_POLICY.measuredEstimatedDerivedRelayedMustRemainDistinct, true)
})

test('scientific overlay rejects excessive timestamp skew', () => {
  const a = make()
  const b = make({ id: 'b', streamId: 'vehicle', metricId: 'g-load', unit: 'g', capturedAt: '2026-09-20T00:00:00.500Z', receivedAt: '2026-09-20T00:00:00.600Z' })
  assert.equal(canSynchronizeTelemetry([a, b], 1000).aligned, true)

  const late = make({ id: 'late', capturedAt: '2026-09-20T00:00:03.000Z', receivedAt: '2026-09-20T00:00:03.100Z' })
  assert.equal(canSynchronizeTelemetry([a, late], 1000).aligned, false)
  assert.equal(canSynchronizeTelemetry([a, late], 1000).reason, 'timestamp-skew')
})

test('dedupe uses stream sequence and keeps newest received copy', () => {
  const older = make({ id: 'older', receivedAt: '2026-09-20T00:00:00.100Z', value: 150 })
  const newer = make({ id: 'newer', receivedAt: '2026-09-20T00:00:00.200Z', value: 151 })
  const out = sortAndDedupeTelemetry([older, newer])
  assert.equal(out.length, 1)
  assert.equal(out[0].value, 151)
})

test('scientific overlay rejects receipt before capture', () => {
  const invalid = make({ capturedAt: '2026-09-20T00:00:00.500Z' })
  assert.ok(validatePerformanceTelemetry(invalid).errors.includes('clock-order'))
  assert.equal(canSynchronizeTelemetry([make(), invalid], 1000).reason, 'invalid-telemetry')
})
