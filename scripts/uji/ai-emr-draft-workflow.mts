import assert from 'node:assert/strict'
import {
  buildHumanSignatureHandoff,
  createAiEmrDraft,
  requestAiEmrDraftReview,
  reviewAiEmrDraft,
} from '../../src/lib/aiEmrDraftWorkflow.ts'
import type { LongitudinalEvent } from '../../src/lib/panaceaLongitudinalState.ts'

const event: LongitudinalEvent<number> = {
  id: 'event-1',
  subjectId: 'emr-subject',
  domain: 'vital',
  metric: 'resting-heart-rate',
  value: 58,
  unit: 'bpm',
  recordedAt: '2026-09-17T00:00:00.000Z',
  confidence: 0.94,
  provenance: {
    sourceKind: 'wearable',
    sourceId: 'oura:ring',
    capturedAt: '2026-09-17T00:00:00.000Z',
    receivedAt: '2026-09-17T00:01:00.000Z',
  },
  consent: { granted: true, purposes: ['clinical-support'], grantedAt: '2026-09-01T00:00:00.000Z' },
  review: { state: 'not-required' },
}

const draft = createAiEmrDraft({
  id: 'draft-1',
  subjectId: 'emr-subject',
  createdAt: '2026-09-17T01:00:00.000Z',
  sourceStateRevision: 9,
  sections: [
    { key: 'objective', text: 'Resting heart-rate trend available for clinician review.', evidenceEvents: [event, event] },
    { key: 'assessment-context', text: 'Context only; no autonomous diagnostic conclusion.', evidenceEvents: [event] },
  ],
})
assert.equal(draft.status, 'draft')
assert.equal(draft.sections[0].evidence.length, 1)
assert.equal(draft.governance.aiMaySign, false)
assert.equal(draft.governance.aiMayPlaceOrders, false)
assert.equal(draft.governance.aiMayCommitMedicationChanges, false)
assert.equal(draft.governance.aiMayCommitToMedicalRecord, false)

const requested = requestAiEmrDraftReview(draft, '2026-09-17T01:05:00.000Z')
assert.equal(requested.status, 'review-requested')
const reviewed = reviewAiEmrDraft(requested, {
  reviewerId: 'clinician-opaque',
  reviewedAt: '2026-09-17T01:10:00.000Z',
  outcome: 'accepted-for-signature',
  note: 'Reviewed as a draft.',
})
assert.equal(reviewed.status, 'reviewed')
assert.equal(reviewed.governance.explicitHumanSignatureRequired, true)

const handoff = buildHumanSignatureHandoff(reviewed)
assert.equal(handoff.requiresExplicitHumanSignature, true)
assert.equal(handoff.committed, false)
assert.equal(handoff.signed, false)
assert.deepEqual(handoff.evidenceEventIds, ['event-1'])

const rejected = reviewAiEmrDraft(requested, {
  reviewerId: 'clinician-opaque',
  reviewedAt: '2026-09-17T01:11:00.000Z',
  outcome: 'rejected',
})
assert.equal(rejected.status, 'rejected')
assert.throws(() => buildHumanSignatureHandoff(rejected), /not clinician-reviewed/)

console.log('AI-EMR draft workflow verified: evidence provenance retained, clinician review required, and signature/order/medication/record commit remain explicit human-only handoffs.')
