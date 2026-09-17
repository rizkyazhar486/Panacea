import assert from 'node:assert/strict'
import { createClinicalReviewLedger } from '../../src/lib/clinicalReviewWorkflow.ts'
import { createLongitudinalPatientState } from '../../src/lib/panaceaLongitudinalState.ts'
import {
  appendPurposeConsentDecision,
  createPurposeConsentLedger,
} from '../../src/lib/purposeConsentLedger.ts'
import { runProductionContinuousCareSync } from '../../src/lib/productionContinuousCarePipeline.ts'

const subjectId = 'prod-subject'
const selfVitals = [
  ['b1', '2026-09-01T08:00:00.000Z', 80],
  ['b2', '2026-09-03T08:00:00.000Z', 81],
  ['b3', '2026-09-05T08:00:00.000Z', 79],
  ['r1', '2026-09-12T08:00:00.000Z', 65],
  ['r2', '2026-09-14T08:00:00.000Z', 64],
  ['r3', '2026-09-16T08:00:00.000Z', 66],
].map(([id, at, heartRate]) => ({
  id: String(id),
  at: String(at),
  systolic: 118,
  diastolic: 74,
  heartRate: Number(heartRate),
  spo2: 99,
  tempC: 36.5,
}))

const appState = {
  vitals: {},
  selfVitals,
  vo2maxLog: [],
  account: {
    email: 'prod@example.test',
    name: 'Production Subject',
    role: 'pasien' as const,
    isSubscriber: false,
    patientId: subjectId,
    loggedAt: '2026-09-01T00:00:00.000Z',
  },
}

let purposeConsentLedger = createPurposeConsentLedger()
purposeConsentLedger = appendPurposeConsentDecision(purposeConsentLedger, {
  id: 'grant-ai',
  subjectId,
  purpose: 'ai-context',
  action: 'grant',
  decidedAt: '2026-09-01T00:00:00.000Z',
  source: 'user',
})
purposeConsentLedger = appendPurposeConsentDecision(purposeConsentLedger, {
  id: 'grant-clinical',
  subjectId,
  purpose: 'clinical-support',
  action: 'grant',
  decidedAt: '2026-09-01T00:00:00.000Z',
  source: 'user',
})

const request = {
  state: createLongitudinalPatientState(subjectId, '2026-09-01T00:00:00.000Z'),
  appState,
  subjectId,
  scope: 'personal-plus-clinical' as const,
  bridgeContext: {
    consent: {
      granted: true,
      purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
      grantedAt: '2026-09-01T00:00:00.000Z',
    },
    receivedAt: '2026-09-17T00:00:00.000Z',
    confidence: {
      clinicalVital: 0.98,
      selfVital: 0.85,
      vo2max: 0.80,
      deviceSnapshot: 0.92,
    },
  },
  habitualRules: [{
    metric: 'heart-rate',
    recentWindowDays: 7,
    baselineLookbackDays: 21,
    relativeChangeThreshold: 0.1,
    minRecentSamples: 3,
    minBaselineSamples: 3,
  }],
  routes: {
    yourBody: '/fitness-hub',
    clinical: '/clinical',
    forYou: '/for-you',
  },
  purposeConsentLedger,
  clinicalReviewLedger: createClinicalReviewLedger(),
  aiPolicy: {
    maxSignals: 12,
    maxAgeDays: 30,
    freshnessHalfLifeDays: 7,
  },
  evaluatedAt: '2026-09-17T00:00:00.000Z',
}

const result = runProductionContinuousCareSync(request)
assert.equal(result.production.personalStoresIncluded, true)
assert.equal(result.production.sourceCounts.selfVitals, 6)
assert.equal(result.habitualCare.signals.length, 1)
assert.equal(result.habitualCare.signals[0].metric, 'heart-rate')
assert.equal(result.habitualCare.signals[0].direction, 'falling')
assert.ok(result.widgets.some((widget) => widget.surface === 'your-body' && widget.metric === 'heart-rate'))
assert.ok(result.governedContext.aiChatbot.signals.some((signal) => signal.metric === 'heart-rate'))
assert.equal(result.governedContext.consent.aiContext.ledgerAuthorized, true)
assert.equal(result.governedContext.governance.autonomousEmrSigningAllowed, false)
assert.equal(result.orchestration.autonomousClinicalCommitAllowed, false)
assert.equal(result.orchestration.productionStoreProjection, true)

const replay = runProductionContinuousCareSync({ ...request, state: result.state })
assert.equal(replay.production.insertedEventCount, 0)
assert.equal(replay.production.duplicateEventCount, result.production.candidateEventCount)
assert.equal(replay.state.revision, result.state.revision)

purposeConsentLedger = appendPurposeConsentDecision(purposeConsentLedger, {
  id: 'revoke-ai',
  subjectId,
  purpose: 'ai-context',
  action: 'revoke',
  decidedAt: '2026-09-16T12:00:00.000Z',
  source: 'user',
})
const revoked = runProductionContinuousCareSync({ ...request, purposeConsentLedger })
assert.equal(revoked.governedContext.aiChatbot.signals.length, 0)
assert.equal(revoked.governedContext.consent.aiContext.ledgerAuthorized, false)
assert.equal(revoked.governedContext.consent.clinicalSupport.ledgerAuthorized, true)
assert.equal(revoked.habitualCare.signals.length, 1)

console.log('Production AppState → longitudinal state → habitual care → visual widgets → governed AI context is deterministic, idempotent, consent-scoped, and non-autonomous.')