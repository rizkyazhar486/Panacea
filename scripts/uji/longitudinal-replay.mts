import assert from 'node:assert/strict'
import {
  buildLongitudinalReplayFrame,
  compareLongitudinalReplayFrames,
  materializeLongitudinalStateAt,
} from '../../src/lib/longitudinalReplay.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'

const subjectId = 'replay-subject-001'
const consent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
  grantedAt: '2026-09-01T00:00:00.000Z',
}

function makeEvent(input: {
  id: string
  metric: string
  domain: LongitudinalEvent['domain']
  value: LongitudinalEvent['value']
  unit?: string
  recordedAt: string
  receivedAt?: string
  confidence?: number
  review?: LongitudinalEvent['review']
}): LongitudinalEvent {
  return {
    id: input.id,
    subjectId,
    domain: input.domain,
    metric: input.metric,
    value: input.value,
    unit: input.unit,
    recordedAt: input.recordedAt,
    confidence: input.confidence ?? 0.9,
    provenance: {
      sourceKind: input.domain === 'lab' ? 'clinical-system' : 'wearable',
      sourceId: input.domain === 'lab' ? 'lab-source' : 'wearable-source',
      capturedAt: input.recordedAt,
      receivedAt: input.receivedAt ?? input.recordedAt,
      method: 'fixture',
    },
    consent,
    review: input.review ?? { state: 'not-required' },
  }
}

let state = createLongitudinalPatientState(subjectId, '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  makeEvent({
    id: 'rhr-1',
    metric: 'resting-heart-rate',
    domain: 'vital',
    value: 64,
    unit: 'bpm',
    recordedAt: '2026-09-01T06:00:00.000Z',
  }),
  makeEvent({
    id: 'sleep-1',
    metric: 'sleep-duration',
    domain: 'sleep',
    value: 7.2,
    unit: 'h',
    recordedAt: '2026-09-02T06:00:00.000Z',
  }),
  makeEvent({
    id: 'ldl-1',
    metric: 'ldl-c',
    domain: 'lab',
    value: 118,
    unit: 'mg/dL',
    recordedAt: '2026-09-03T08:00:00.000Z',
    receivedAt: '2026-09-07T08:00:00.000Z',
    review: {
      state: 'accepted',
      reviewerId: 'clinician-001',
      reviewedAt: '2026-09-08T09:00:00.000Z',
    },
  }),
  makeEvent({
    id: 'rhr-2',
    metric: 'resting-heart-rate',
    domain: 'vital',
    value: 60,
    unit: 'bpm',
    recordedAt: '2026-09-05T06:00:00.000Z',
  }),
  makeEvent({
    id: 'weight-kg',
    metric: 'weight',
    domain: 'longevity',
    value: 80,
    unit: 'kg',
    recordedAt: '2026-09-02T07:00:00.000Z',
  }),
  makeEvent({
    id: 'weight-lb',
    metric: 'weight',
    domain: 'longevity',
    value: 176,
    unit: 'lb',
    recordedAt: '2026-09-09T07:00:00.000Z',
  }),
])

const earlyKnown = buildLongitudinalReplayFrame(state, '2026-09-04T00:00:00.000Z')
assert.equal(earlyKnown.clock, 'known')
assert.deepEqual(
  earlyKnown.metrics.map((item) => item.metric),
  ['resting-heart-rate', 'sleep-duration', 'weight'],
)
assert.equal(earlyKnown.metrics.some((item) => item.metric === 'ldl-c'), false)

const earlyEffective = buildLongitudinalReplayFrame(state, '2026-09-04T00:00:00.000Z', {
  clock: 'effective',
})
assert.equal(earlyEffective.metrics.some((item) => item.metric === 'ldl-c'), true)

const earlyClinical = buildLongitudinalReplayFrame(state, '2026-09-04T00:00:00.000Z', {
  clock: 'effective',
  surface: 'clinical',
})
assert.equal(earlyClinical.metrics.some((item) => item.metric === 'ldl-c'), false)
assert.equal(earlyClinical.governance?.pendingClinicalReview, 1)

const reconstructed = materializeLongitudinalStateAt(state, '2026-09-04T00:00:00.000Z', 'effective')
assert.equal(reconstructed.eventsById['ldl-1'].review.state, 'pending', 'later clinician acceptance must not leak backward in replay time')

const lateClinical = buildLongitudinalReplayFrame(state, '2026-09-09T12:00:00.000Z', {
  surface: 'clinical',
})
assert.equal(lateClinical.metrics.some((item) => item.metric === 'ldl-c'), true)
assert.equal(lateClinical.governance?.pendingClinicalReview, 0)

const lateKnown = buildLongitudinalReplayFrame(state, '2026-09-09T12:00:00.000Z')
const diff = compareLongitudinalReplayFrames(earlyKnown, lateKnown)

const rhrDiff = diff.metrics.find((item) => item.metric === 'resting-heart-rate')
assert.equal(rhrDiff?.status, 'changed')
assert.equal(rhrDiff?.numeric?.absoluteDelta, -4)
assert.equal(rhrDiff?.numeric?.relativeDelta, -0.0625)

const ldlDiff = diff.metrics.find((item) => item.metric === 'ldl-c')
assert.equal(ldlDiff?.status, 'added')

const weightDiff = diff.metrics.find((item) => item.metric === 'weight')
assert.equal(weightDiff?.status, 'changed')
assert.equal(weightDiff?.numeric, undefined, 'unit changes must not produce a fake arithmetic delta')

assert.equal(diff.counts.added, 1)
assert.equal(diff.counts.changed, 2)
assert.equal(diff.counts.unchanged, 1)
assert.equal(diff.metrics.some((item) => item.status === 'unchanged'), false)

const withUnchanged = compareLongitudinalReplayFrames(earlyKnown, lateKnown, { includeUnchanged: true })
assert.equal(withUnchanged.metrics.some((item) => item.metric === 'sleep-duration' && item.status === 'unchanged'), true)

const foreign = { ...lateKnown, subjectId: 'other-subject' }
assert.throws(() => compareLongitudinalReplayFrames(earlyKnown, foreign), /different subjects/)

console.log('Longitudinal Replay + Health Diff verified: known-vs-effective clocks, temporal review integrity, governed surface replay, deterministic numeric deltas, unit safety and subject isolation.')
