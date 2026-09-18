import assert from 'node:assert/strict'
import {
  appendClinicalReviewDecision,
  buildClinicalReviewQueue,
  createClinicalReviewLedger,
  materializeReviewedState,
} from '../../src/lib/clinicalReviewWorkflow.ts'
import {
  canEnterClinicalRecord,
  createLongitudinalPatientState,
  ingestLongitudinalEvent,
  projectStateToSurface,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'

const pendingLab: LongitudinalEvent<number> = {
  id: 'lab-1',
  subjectId: 'review-subject',
  domain: 'lab',
  metric: 'demo-marker',
  value: 123,
  unit: 'mg/dL',
  recordedAt: '2026-09-16T01:00:00.000Z',
  confidence: 0.98,
  provenance: {
    sourceKind: 'clinical-system',
    sourceId: 'lab-system',
    capturedAt: '2026-09-16T01:00:00.000Z',
    receivedAt: '2026-09-16T01:05:00.000Z',
  },
  consent: {
    granted: true,
    purposes: ['clinical-support', 'ai-context'],
    grantedAt: '2026-09-01T00:00:00.000Z',
  },
  review: { state: 'pending' },
}

let state = createLongitudinalPatientState('review-subject', '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalEvent(state, pendingLab).state
let ledger = createClinicalReviewLedger()

const queue = buildClinicalReviewQueue(state, ledger)
assert.equal(queue.length, 1)
assert.equal(queue[0].eventId, 'lab-1')
assert.equal(canEnterClinicalRecord(pendingLab, Date.parse('2026-09-17T00:00:00.000Z')), false)

const decision = {
  id: 'review-1',
  eventId: 'lab-1',
  subjectId: 'review-subject',
  outcome: 'accepted' as const,
  reviewerId: 'clinician-opaque-7',
  reviewedAt: '2026-09-16T02:00:00.000Z',
  rationaleCode: 'source-verified',
  note: 'Source and context reviewed.',
}

ledger = appendClinicalReviewDecision(state, ledger, decision)
assert.equal(buildClinicalReviewQueue(state, ledger).length, 0)
assert.equal(appendClinicalReviewDecision(state, ledger, decision), ledger)
assert.throws(() => appendClinicalReviewDecision(state, ledger, { ...decision, id: 'review-2' }), /already has a final/)

const reviewedState = materializeReviewedState(state, ledger)
assert.equal(reviewedState.eventsById['lab-1'].review.state, 'accepted')
assert.equal(reviewedState.eventsById['lab-1'].review.reviewerId, 'clinician-opaque-7')
assert.equal(canEnterClinicalRecord(reviewedState.eventsById['lab-1'], Date.parse('2026-09-17T00:00:00.000Z')), true)
assert.equal(projectStateToSurface(reviewedState, 'clinical', '2026-09-17T00:00:00.000Z').metrics.length, 1)
assert.equal(state.eventsById['lab-1'].review.state, 'pending')

console.log('Clinical review workflow verified: immutable decision ledger, pending queue, no silent overwrite, reviewed-state overlay, and clinical-record gate transition.')
