import assert from 'node:assert/strict'
import {
  createDecodedBciIntentEvent,
  createExplicitIntentEvent,
  createSimulatedIntentEvent,
} from '../../src/lib/neuralIntentAdapters.ts'
import {
  ingestIntentIntoLongitudinalState,
  intentToLongitudinalEvent,
} from '../../src/lib/neuralIntentLongitudinalBridge.ts'
import {
  createLongitudinalPatientState,
  projectStateToSurface,
} from '../../src/lib/panaceaLongitudinalState.ts'
import {
  appendClinicalReviewDecision,
  createClinicalReviewLedger,
  materializeReviewedState,
} from '../../src/lib/clinicalReviewWorkflow.ts'

const consent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context', 'rehab-tracking'] as const,
  grantedAt: '2026-09-18T00:00:00.000Z',
}

const explicit = createExplicitIntentEvent({
  id: 'explicit-1',
  subjectId: 'subject-intent',
  action: 'reach',
  effector: 'right-upper-limb',
  sourceKind: 'explicit-touch',
  sourceId: 'intent-pad',
  version: '1',
  capturedAt: '2026-09-18T01:00:00.000Z',
  receivedAt: '2026-09-18T01:00:01.000Z',
  consent,
  tags: ['rehab-session'],
})

const mappedExplicit = intentToLongitudinalEvent(explicit, { confidence: 0.94 })
assert.equal(mappedExplicit.status, 'mapped')
if (mappedExplicit.status !== 'mapped') throw new Error('explicit intent did not map')
assert.equal(mappedExplicit.event.domain, 'intent')
assert.equal(mappedExplicit.event.review.state, 'pending')
assert.equal(mappedExplicit.event.confidence, 0.94)
assert.equal(mappedExplicit.event.provenance.sourceKind, 'manual')
assert.equal(mappedExplicit.event.provenance.sourceId, 'intent-pad')
assert.ok(mappedExplicit.event.consent.purposes.includes('rehab-tracking'))
assert.ok(mappedExplicit.event.tags?.includes('intent:evidence:explicit'))
assert.ok(mappedExplicit.event.tags?.includes('intent:effector:right-upper-limb'))

const initial = createLongitudinalPatientState('subject-intent', '2026-09-18T00:00:00.000Z')
const first = ingestIntentIntoLongitudinalState(initial, explicit, { confidence: 0.94 })
assert.equal(first.status, 'inserted')
assert.equal(first.state.revision, 1)

const duplicate = ingestIntentIntoLongitudinalState(first.state, explicit, { confidence: 0.94 })
assert.equal(duplicate.status, 'duplicate')
assert.equal(duplicate.state.revision, 1)

const yourBody = projectStateToSurface(first.state, 'your-body', '2026-09-18T01:05:00.000Z')
assert.equal(yourBody.metrics.length, 1)
assert.equal(yourBody.metrics[0].domain, 'intent')

const clinicalBeforeReview = projectStateToSurface(first.state, 'clinical', '2026-09-18T01:05:00.000Z')
assert.equal(clinicalBeforeReview.metrics.length, 0)
assert.equal(clinicalBeforeReview.pendingClinicalReview, 1)

let ledger = createClinicalReviewLedger()
ledger = appendClinicalReviewDecision(first.state, ledger, {
  id: 'review-explicit-1',
  eventId: 'intent:explicit-1',
  subjectId: 'subject-intent',
  outcome: 'accepted',
  reviewerId: 'qualified-reviewer-demo',
  reviewedAt: '2026-09-18T01:10:00.000Z',
  rationaleCode: 'intent-context-reviewed',
})
const reviewed = materializeReviewedState(first.state, ledger)
const clinicalAfterReview = projectStateToSurface(reviewed, 'clinical', '2026-09-18T01:11:00.000Z')
assert.equal(clinicalAfterReview.metrics.length, 1)
assert.equal(clinicalAfterReview.metrics[0].latest.review.state, 'accepted')

const decoded = createDecodedBciIntentEvent({
  id: 'bci-1',
  subjectId: 'subject-intent',
  action: 'grasp',
  effector: 'right-upper-limb',
  sourceId: 'bci-device',
  sourceVersion: 'device-fw-4',
  decoderId: 'decoder-motor-v1',
  decoderVersion: '1.2.0',
  decoderConfidence: 0.81,
  signalQuality: 0.73,
  capturedAt: '2026-09-18T02:00:00.000Z',
  receivedAt: '2026-09-18T02:00:02.000Z',
  consent,
  tags: ['bci-session'],
})
const mappedDecoded = intentToLongitudinalEvent(decoded, { confidence: 0.82 })
assert.equal(mappedDecoded.status, 'mapped')
if (mappedDecoded.status !== 'mapped') throw new Error('decoded intent did not map')
assert.equal(mappedDecoded.event.review.state, 'pending')
assert.equal(mappedDecoded.event.provenance.sourceKind, 'derived')
assert.equal(mappedDecoded.event.provenance.version, '1.2.0')
assert.equal(mappedDecoded.event.value.evidenceClass, 'decoded')
assert.equal(mappedDecoded.event.value.decoderConfidence, 0.81)
assert.equal(mappedDecoded.event.value.signalQuality, 0.73)
assert.ok(mappedDecoded.event.tags?.includes('intent:decoder-id:decoder-motor-v1'))
assert.ok(mappedDecoded.event.tags?.includes('intent:evidence:decoded'))

const simulated = createSimulatedIntentEvent({
  id: 'simulation-1',
  subjectId: 'subject-intent',
  action: 'move-upper-limb',
  effector: 'bilateral-upper-limb',
  sourceKind: 'simulation',
  sourceId: 'intent-demo',
  version: '1',
  capturedAt: '2026-09-18T03:00:00.000Z',
  receivedAt: '2026-09-18T03:00:00.000Z',
  consent,
  tags: ['training-demo'],
})
const mappedSimulation = intentToLongitudinalEvent(simulated, { confidence: 1 })
assert.equal(mappedSimulation.status, 'mapped')
if (mappedSimulation.status !== 'mapped') throw new Error('simulation did not map')
assert.equal(mappedSimulation.event.review.state, 'not-required')
assert.equal(mappedSimulation.event.value.evidenceClass, 'simulated')
assert.ok(mappedSimulation.event.consent.purposes.includes('personal-visualization'))
assert.ok(mappedSimulation.event.consent.purposes.includes('rehab-tracking'))
assert.ok(!mappedSimulation.event.consent.purposes.includes('clinical-support'))
assert.ok(!mappedSimulation.event.consent.purposes.includes('ai-context'))

const simulatedState = ingestIntentIntoLongitudinalState(
  createLongitudinalPatientState('subject-intent', '2026-09-18T00:00:00.000Z'),
  simulated,
  { confidence: 1 },
)
assert.notEqual(simulatedState.status, 'skipped')
assert.equal(
  projectStateToSurface(simulatedState.state, 'ai-chatbot', '2026-09-18T03:05:00.000Z').metrics.length,
  0,
)
assert.equal(
  projectStateToSurface(simulatedState.state, 'clinical', '2026-09-18T03:05:00.000Z').metrics.length,
  0,
)

const rejected = { ...explicit, id: 'rejected-1', status: 'rejected' as const }
const rejectedResult = ingestIntentIntoLongitudinalState(first.state, rejected, { confidence: 0.5 })
assert.equal(rejectedResult.status, 'skipped')
assert.equal(rejectedResult.state.revision, first.state.revision)

assert.throws(
  () => ingestIntentIntoLongitudinalState(
    createLongitudinalPatientState('different-subject', '2026-09-18T00:00:00.000Z'),
    explicit,
    { confidence: 0.94 },
  ),
  /subjectId does not match/,
)

assert.throws(
  () => intentToLongitudinalEvent(explicit, { confidence: Number.NaN }),
  /confidence must be a finite value/,
)

console.log('neural intent longitudinal bridge: ok')
