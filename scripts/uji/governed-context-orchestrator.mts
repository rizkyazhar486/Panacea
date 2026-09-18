import assert from 'node:assert/strict'
import { buildGovernedContextBundle } from '../../src/lib/governedContextOrchestrator.ts'
import {
  appendClinicalReviewDecision,
  createClinicalReviewLedger,
} from '../../src/lib/clinicalReviewWorkflow.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  type LongitudinalEvent,
} from '../../src/lib/panaceaLongitudinalState.ts'
import {
  appendPurposeConsentDecision,
  createPurposeConsentLedger,
} from '../../src/lib/purposeConsentLedger.ts'

function event(id: string, domain: LongitudinalEvent['domain'], metric: string, value: unknown, recordedAt: string): LongitudinalEvent {
  return {
    id,
    subjectId: 'governed-subject',
    domain,
    metric,
    value,
    recordedAt,
    confidence: 0.95,
    provenance: {
      sourceKind: domain === 'lab' ? 'clinical-system' : 'wearable',
      sourceId: domain === 'lab' ? 'lab' : 'wearable',
      capturedAt: recordedAt,
      receivedAt: new Date(Date.parse(recordedAt) + 60_000).toISOString(),
    },
    consent: {
      granted: true,
      purposes: ['ai-context', 'clinical-support', 'personal-visualization'],
      grantedAt: '2026-09-01T00:00:00.000Z',
    },
    review: domain === 'lab' ? { state: 'pending' } : { state: 'not-required' },
  }
}

let state = createLongitudinalPatientState('governed-subject', '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  event('sleep', 'sleep', 'sleep-duration', 7.1, '2026-09-15T00:00:00.000Z'),
  event('lab', 'lab', 'demo-lab', 12, '2026-09-16T00:00:00.000Z'),
])

let reviewLedger = createClinicalReviewLedger()
reviewLedger = appendClinicalReviewDecision(state, reviewLedger, {
  id: 'review-lab',
  eventId: 'lab',
  subjectId: 'governed-subject',
  outcome: 'accepted',
  reviewerId: 'clinician-opaque',
  reviewedAt: '2026-09-16T02:00:00.000Z',
})

let consentLedger = createPurposeConsentLedger()
consentLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'ai-grant', subjectId: 'governed-subject', purpose: 'ai-context', action: 'grant', decidedAt: '2026-09-01T00:00:00.000Z', source: 'user',
})
consentLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'clinical-grant', subjectId: 'governed-subject', purpose: 'clinical-support', action: 'grant', decidedAt: '2026-09-01T00:00:00.000Z', source: 'user',
})

const bundle = buildGovernedContextBundle({
  state,
  purposeConsentLedger: consentLedger,
  clinicalReviewLedger: reviewLedger,
  aiPolicy: { maxSignals: 5, maxAgeDays: 30, freshnessHalfLifeDays: 7 },
  at: '2026-09-17T00:00:00.000Z',
})

assert.ok(bundle.aiChatbot.signals.some((signal) => signal.metric === 'sleep-duration'))
assert.ok(bundle.aiChatbot.signals.some((signal) => signal.metric === 'demo-lab'))
assert.ok(bundle.aiEmr.signals.some((signal) => signal.metric === 'demo-lab'))
assert.equal(bundle.pendingReview.length, 0)
assert.equal(bundle.governance.autonomousEmrSigningAllowed, false)
assert.equal(bundle.governance.autonomousMedicationCommitAllowed, false)
assert.equal(bundle.governance.autonomousOrderCommitAllowed, false)

consentLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'ai-revoke', subjectId: 'governed-subject', purpose: 'ai-context', action: 'revoke', decidedAt: '2026-09-16T12:00:00.000Z', source: 'user',
})
const revoked = buildGovernedContextBundle({
  state,
  purposeConsentLedger: consentLedger,
  clinicalReviewLedger: reviewLedger,
  aiPolicy: { maxSignals: 5, maxAgeDays: 30, freshnessHalfLifeDays: 7 },
  at: '2026-09-17T00:00:00.000Z',
})
assert.equal(revoked.aiChatbot.signals.length, 0)
assert.ok(revoked.aiEmr.signals.some((signal) => signal.metric === 'demo-lab'))
assert.equal(revoked.consent.aiContext.ledgerAuthorized, false)
assert.equal(revoked.consent.clinicalSupport.ledgerAuthorized, true)

console.log('Governed context orchestrator verified: clinician review, purpose-specific consent and minimum-necessary AI packing are enforced together before AI Chatbot/AI-EMR context.')
