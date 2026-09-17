import assert from 'node:assert/strict'
import { auditIntegrationFreshness } from '../../src/lib/integrationFreshnessAudit.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'

function event(id: string, sourceId: string, metric: string, recordedAt: string, receivedAt: string): LongitudinalEvent<number> {
  return {
    id,
    subjectId: 'freshness-subject',
    domain: 'vital',
    metric,
    value: 1,
    recordedAt,
    confidence: 0.9,
    provenance: { sourceKind: 'wearable', sourceId, capturedAt: recordedAt, receivedAt },
    consent: { granted: true, purposes: ['personal-visualization'], grantedAt: '2026-09-01T00:00:00.000Z' },
    review: { state: 'not-required' },
  }
}

let state = createLongitudinalPatientState('freshness-subject', '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  event('oura-1', 'oura:ring', 'resting-heart-rate', '2026-09-17T00:00:00.000Z', '2026-09-17T00:01:00.000Z'),
  event('oura-2', 'oura:ring', 'hrv-rmssd', '2026-09-17T01:00:00.000Z', '2026-09-17T01:02:00.000Z'),
  event('garmin-1', 'garmin:watch', 'resting-heart-rate', '2026-09-16T00:00:00.000Z', '2026-09-16T00:05:00.000Z'),
])

const audits = auditIntegrationFreshness(state, [
  { sourcePrefix: 'oura:', label: 'Oura', freshnessHalfLifeMinutes: 120, agingAfterMinutes: 180, staleAfterMinutes: 720, expectedMetrics: ['resting-heart-rate','hrv-rmssd','sleep-duration'] },
  { sourcePrefix: 'garmin:', label: 'Garmin', freshnessHalfLifeMinutes: 120, agingAfterMinutes: 180, staleAfterMinutes: 720, expectedMetrics: ['resting-heart-rate'] },
  { sourcePrefix: 'whoop:', label: 'WHOOP', freshnessHalfLifeMinutes: 120, agingAfterMinutes: 180, staleAfterMinutes: 720 },
], '2026-09-17T02:00:00.000Z')

const oura = audits.find((audit) => audit.sourcePrefix === 'oura:')
assert.ok(oura)
assert.equal(oura.status, 'fresh')
assert.equal(oura.eventCount, 2)
assert.deepEqual(oura.missingExpectedMetrics, ['sleep-duration'])
assert.ok(oura.freshness > 0 && oura.freshness <= 1)
assert.equal(oura.latestTransportLagSeconds, 120)
assert.equal(oura.healthInterpretationAllowed, false)

const garmin = audits.find((audit) => audit.sourcePrefix === 'garmin:')
assert.ok(garmin)
assert.equal(garmin.status, 'stale')
const whoop = audits.find((audit) => audit.sourcePrefix === 'whoop:')
assert.ok(whoop)
assert.equal(whoop.status, 'unseen')
assert.equal(whoop.freshness, 0)

console.log('Integration freshness audit verified: operational recency, transport lag, expected-metric gaps and explicit stale/unseen states without health interpretation.')
