import assert from 'node:assert/strict'
import {
  buildContextPacket,
  canEnterClinicalRecord,
  createLongitudinalEventBus,
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  ingestLongitudinalEvent,
  numericMetricTrend,
  projectStateToSurface,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'

const baseConsent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
  grantedAt: '2026-09-01T00:00:00.000Z',
}

function event(
  id: string,
  metric: string,
  domain: LongitudinalEvent['domain'],
  value: LongitudinalEvent['value'],
  recordedAt: string,
  review: LongitudinalEvent['review'] = { state: 'not-required' },
): LongitudinalEvent {
  return {
    id,
    subjectId: 'subject-demo-001',
    domain,
    metric,
    value,
    unit: metric === 'resting-heart-rate' ? 'bpm' : undefined,
    recordedAt,
    confidence: 0.92,
    provenance: {
      sourceKind: 'wearable',
      sourceId: 'demo-device',
      capturedAt: recordedAt,
      receivedAt: new Date(Date.parse(recordedAt) + 60_000).toISOString(),
      method: 'device-sync',
    },
    consent: baseConsent,
    review,
  }
}

let state = createLongitudinalPatientState('subject-demo-001', '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  event('rhr-1', 'resting-heart-rate', 'vital', 64, '2026-09-10T00:00:00.000Z'),
  event('rhr-2', 'resting-heart-rate', 'vital', 61, '2026-09-12T00:00:00.000Z'),
  event('rhr-3', 'resting-heart-rate', 'vital', 58, '2026-09-14T00:00:00.000Z'),
  event('sleep-1', 'sleep-duration', 'sleep', 7.2, '2026-09-14T00:30:00.000Z'),
  event('lab-pending', 'ldl-c', 'lab', 120, '2026-09-14T01:00:00.000Z', { state: 'pending' }),
])

assert.equal(state.revision, 5)
assert.equal(ingestLongitudinalEvent(state, event('rhr-3', 'resting-heart-rate', 'vital', 58, '2026-09-14T00:00:00.000Z')).status, 'duplicate')

const trend = numericMetricTrend(state, 'resting-heart-rate')
assert.ok(trend)
assert.equal(trend.sampleCount, 3)
assert.equal(trend.direction, 'falling')
assert.equal(Math.round(trend.absoluteDelta), -6)

const body = projectStateToSurface(state, 'your-body', '2026-09-15T00:00:00.000Z')
assert.deepEqual(body.metrics.map((item) => item.metric).sort(), ['resting-heart-rate', 'sleep-duration'])

const clinical = projectStateToSurface(state, 'clinical', '2026-09-15T00:00:00.000Z')
assert.equal(clinical.metrics.some((item) => item.metric === 'ldl-c'), false)
assert.equal(clinical.pendingClinicalReview, 1)
assert.equal(canEnterClinicalRecord(state.eventsById['lab-pending']), false)

const acceptedLab = event('lab-accepted', 'hdl-c', 'lab', 55, '2026-09-14T02:00:00.000Z', {
  state: 'accepted',
  reviewerId: 'clinician-opaque-001',
  reviewedAt: '2026-09-14T03:00:00.000Z',
})
state = ingestLongitudinalEvent(state, acceptedLab).state
assert.equal(canEnterClinicalRecord(acceptedLab, Date.parse('2026-09-15T00:00:00.000Z')), true)

const packet = buildContextPacket(state, 'ai-chatbot', '2026-09-15T00:00:00.000Z')
assert.equal(packet.stateRevision, 6)
assert.equal(packet.governance.autonomousClinicalCommitAllowed, false)
assert.ok(packet.signals.some((signal) => signal.metric === 'resting-heart-rate'))

const bus = createLongitudinalEventBus()
let deliveredId = ''
const unsubscribe = bus.subscribe('subject-demo-001', (incoming) => { deliveredId = incoming.id })
assert.equal(bus.subscriberCount('subject-demo-001'), 1)
assert.deepEqual(bus.publish('subject-demo-001', acceptedLab), { delivered: 1, rejected: 0 })
assert.equal(deliveredId, 'lab-accepted')
unsubscribe()
assert.equal(bus.subscriberCount('subject-demo-001'), 0)

assert.throws(() => ingestLongitudinalEvent(state, {
  ...event('bad-confidence', 'metric', 'other', 1, '2026-09-14T00:00:00.000Z'),
  confidence: 1.4,
}), /confidence/)

console.log('Panacea longitudinal state verified: idempotent ingest, provenance/consent gates, clinician-review boundary, trend formula, surface projections, context packet, and event bus.')
