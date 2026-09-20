import assert from 'node:assert/strict'
import { buildContextPacket, createLongitudinalPatientState, ingestLongitudinalBatch, type LongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'

const at = '2026-09-20T12:00:00.000Z'
function event(id: string, day: number, value: number): LongitudinalEvent<number> {
  const time = `2026-09-${day}T00:00:00.000Z`
  return {
    id, subjectId: 'patient', domain: 'lab', metric: 'test-measurement', value, unit: 'unit',
    recordedAt: time, confidence: 1,
    provenance: { sourceKind: 'clinical-system', sourceId: 'test', capturedAt: time, receivedAt: time },
    consent: { granted: true, purposes: ['ai-context', 'clinical-support'], grantedAt: '2026-09-01T00:00:00.000Z' },
    review: { state: 'accepted', reviewerId: 'reviewer', reviewedAt: time },
  }
}
const first = event('first', 18, 10)
const last = event('last', 20, 14)
const excluded = [
  { ...event('not-granted', 19, 100), consent: { ...first.consent, granted: false } },
  { ...event('wrong-purpose', 19, 200), consent: { ...first.consent, purposes: ['personal-visualization'] as const } },
  { ...event('revoked', 19, 300), consent: { ...first.consent, revokedAt: '2026-09-19T01:00:00.000Z' } },
  { ...event('expired', 19, 400), consent: { ...first.consent, expiresAt: '2026-09-19T01:00:00.000Z' } },
  { ...event('rejected', 19, 500), review: { ...first.review, state: 'rejected' as const } },
]
for (const surface of ['ai-chatbot', 'ai-emr', 'clinical'] as const) {
  const state = ingestLongitudinalBatch(createLongitudinalPatientState('patient'), [first, ...excluded, last])
  const packet = buildContextPacket(state, surface, at)
  assert.equal(packet.signals.length, 1)
  assert.equal(packet.signals[0].value, 14)
  assert.equal(packet.signals[0].trend?.sampleCount, 2, surface + ' excludes unauthorized history')
  assert.equal(packet.signals[0].trend?.slopePerDay, 2)
  assert.equal(packet.signals[0].trend?.absoluteDelta, 4)
  assert.equal(Object.keys(state.eventsById).length, 7, 'source history is preserved')
}
const pending = { ...event('pending', 19, 100), review: { state: 'pending' as const } }
const pendingState = ingestLongitudinalBatch(createLongitudinalPatientState('patient'), [first, pending, last])
assert.equal(buildContextPacket(pendingState, 'ai-emr', at).signals[0].trend?.sampleCount, 2)
assert.equal(buildContextPacket(pendingState, 'ai-chatbot', at).signals[0].trend?.sampleCount, 3, 'AI retains existing pending-review policy')
const sparse = ingestLongitudinalBatch(createLongitudinalPatientState('patient'), [...excluded, last])
assert.equal(buildContextPacket(sparse, 'ai-chatbot', at).signals[0].trend, null, 'one authorized point cannot produce a trend')
console.log('Context packet trends respect purpose consent and surface review policy without mutating history.')
