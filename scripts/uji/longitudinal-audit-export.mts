import assert from 'node:assert/strict'
import { buildLongitudinalAuditManifest } from '../../src/lib/longitudinalAuditExport.ts'
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

function event(id: string, domain: LongitudinalEvent['domain'], metric: string, recordedAt: string): LongitudinalEvent<number> {
  return {
    id,
    subjectId: 'audit-subject',
    domain,
    metric,
    value: 1,
    recordedAt,
    confidence: 0.91,
    provenance: {
      sourceKind: domain === 'lab' ? 'clinical-system' : 'wearable',
      sourceId: domain === 'lab' ? 'lab-system' : 'oura:ring',
      capturedAt: recordedAt,
      receivedAt: new Date(Date.parse(recordedAt) + 60_000).toISOString(),
    },
    consent: {
      granted: true,
      purposes: ['ai-context', 'clinical-support'],
      grantedAt: '2026-09-01T00:00:00.000Z',
    },
    review: domain === 'lab' ? { state: 'pending' } : { state: 'not-required' },
  }
}

let state = createLongitudinalPatientState('audit-subject', '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  event('wearable-1', 'vital', 'resting-heart-rate', '2026-09-16T00:00:00.000Z'),
  event('lab-1', 'lab', 'demo-lab', '2026-09-16T01:00:00.000Z'),
])

let consentLedger = createPurposeConsentLedger()
consentLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'consent-1', subjectId: 'audit-subject', purpose: 'ai-context', action: 'grant', decidedAt: '2026-09-01T00:00:00.000Z', source: 'user',
})
let reviewLedger = createClinicalReviewLedger()
reviewLedger = appendClinicalReviewDecision(state, reviewLedger, {
  id: 'review-1', eventId: 'lab-1', subjectId: 'audit-subject', outcome: 'accepted', reviewerId: 'clinician-opaque', reviewedAt: '2026-09-16T02:00:00.000Z', rationaleCode: 'source-verified',
})

const manifest = buildLongitudinalAuditManifest(state, consentLedger, reviewLedger, '2026-09-17T00:00:00.000Z')
assert.equal(manifest.counts.events, 2)
assert.equal(manifest.counts.metrics, 2)
assert.equal(manifest.counts.provenanceSources, 2)
assert.equal(manifest.counts.consentDecisions, 1)
assert.equal(manifest.counts.clinicalReviewDecisions, 1)
assert.equal(manifest.coverage.provenanceCoverageFraction, 1)
assert.equal(manifest.coverage.governanceMetadataCoverageFraction, 1)
assert.equal(manifest.boundaries.containsRawClinicalNarrative, false)
assert.equal(manifest.boundaries.containsAuthenticationSecrets, false)
assert.equal(manifest.boundaries.provesClinicalValidity, false)
assert.equal(manifest.boundaries.provesRegulatoryCompliance, false)
assert.deepEqual(manifest.events.map((item) => item.id), ['wearable-1', 'lab-1'])

console.log('Longitudinal audit export verified: deterministic event provenance, consent/review decisions, audit-coverage formulas, and no raw narrative/secrets/regulatory overclaim.')
