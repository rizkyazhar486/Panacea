import assert from 'node:assert/strict'
import { reconcileWearableMeasurements } from '../../src/lib/wearableReconciliation.ts'
import type { LongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'

function event(id: string, provider: string, value: number, confidence: number, recordedAt: string): LongitudinalEvent<number> {
  return {
    id,
    subjectId: 'reconcile-subject',
    domain: 'vital',
    metric: 'resting-heart-rate',
    value,
    unit: 'bpm',
    recordedAt,
    confidence,
    provenance: {
      sourceKind: 'wearable',
      sourceId: `${provider}:device`,
      capturedAt: recordedAt,
      receivedAt: new Date(Date.parse(recordedAt) + 30_000).toISOString(),
    },
    consent: { granted: true, purposes: ['personal-visualization'], grantedAt: '2026-09-01T00:00:00.000Z' },
    review: { state: 'not-required' },
  }
}

const events = [
  event('apple', 'apple-health', 58, 0.9, '2026-09-17T00:00:00.000Z'),
  event('oura', 'oura', 60, 0.98, '2026-09-17T00:00:15.000Z'),
  event('garmin', 'garmin', 59, 0.99, '2026-09-17T00:00:20.000Z'),
  event('later', 'oura', 61, 0.99, '2026-09-17T01:00:00.000Z'),
]

const clusters = reconcileWearableMeasurements(events, {
  providerPriority: ['oura', 'garmin', 'apple-health', 'whoop', 'health-connect', 'strava'],
  conflictWindowSeconds: 60,
})
assert.equal(clusters.length, 2)
assert.equal(clusters[0].selectedEventId, 'oura')
assert.equal(clusters[0].resolutionReason, 'provider-priority')
assert.equal(clusters[0].conflictingValues, true)
assert.equal(clusters[0].hiddenAveragingPerformed, false)
assert.deepEqual(clusters[0].candidateEventIds, ['apple', 'oura', 'garmin'])
assert.equal(clusters[1].selectedEventId, 'later')
assert.equal(clusters[1].resolutionReason, 'single-candidate')

assert.throws(() => reconcileWearableMeasurements(events, {
  providerPriority: ['oura', 'oura'],
  conflictWindowSeconds: 60,
}), /duplicates/)

console.log('Wearable reconciliation verified: near-simultaneous conflicts preserve all sources, never average silently, and use explicit provider priority → confidence → recency for display selection.')
