// Stacked validation: this fixture intentionally exercises the adapter against the replay layer before production retargeting.
import assert from 'node:assert/strict'
import { buildLongitudinalTwinSnapshot, twinSignalByMetric } from '../../src/lib/longitudinalDigitalTwin.ts'
import {
  appendPurposeConsentDecision,
  createPurposeConsentLedger,
} from '../../src/lib/purposeConsentLedger.ts'
import {
  createLongitudinalPatientState,
  ingestLongitudinalBatch,
  type LongitudinalEvent,
  type LongitudinalProvenance,
} from '../../src/lib/panaceaLongitudinalState.ts'

const subjectId = 'digital-twin-subject-001'
const consentAll = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'] as const,
  grantedAt: '2026-09-01T00:00:00.000Z',
}

function event(input: {
  id: string
  metric: string
  domain: LongitudinalEvent['domain']
  value: LongitudinalEvent['value']
  unit?: string
  recordedAt: string
  receivedAt?: string
  sourceKind: LongitudinalProvenance['sourceKind']
  review?: LongitudinalEvent['review']
  confidence?: number
}): LongitudinalEvent {
  const receivedAt = input.receivedAt ?? input.recordedAt
  return {
    id: input.id,
    subjectId,
    domain: input.domain,
    metric: input.metric,
    value: input.value,
    unit: input.unit,
    recordedAt: input.recordedAt,
    confidence: input.confidence ?? 0.91,
    provenance: {
      sourceKind: input.sourceKind,
      sourceId: `${input.sourceKind}:${input.id}`,
      capturedAt: input.recordedAt,
      receivedAt,
      method: 'fixture',
      version: '1',
    },
    consent: consentAll,
    review: input.review ?? { state: 'not-required' },
  }
}

let consentLedger = createPurposeConsentLedger()
consentLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'grant-personal',
  subjectId,
  purpose: 'personal-visualization',
  action: 'grant',
  decidedAt: '2026-09-01T00:00:00.000Z',
  source: 'user',
})
consentLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'grant-clinical',
  subjectId,
  purpose: 'clinical-support',
  action: 'grant',
  decidedAt: '2026-09-01T00:00:00.000Z',
  source: 'user',
})

let state = createLongitudinalPatientState(subjectId, '2026-09-01T00:00:00.000Z')
state = ingestLongitudinalBatch(state, [
  event({
    id: 'wearable-rhr',
    metric: 'resting-heart-rate',
    domain: 'vital',
    value: 58,
    unit: 'bpm',
    recordedAt: '2026-09-03T06:00:00.000Z',
    sourceKind: 'wearable',
    confidence: 0.94,
  }),
  event({
    id: 'manual-sleep',
    metric: 'sleep-duration',
    domain: 'sleep',
    value: 7.4,
    unit: 'h',
    recordedAt: '2026-09-03T07:00:00.000Z',
    sourceKind: 'manual',
  }),
  event({
    id: 'derived-vo2',
    metric: 'vo2max',
    domain: 'fitness',
    value: 44,
    unit: 'mL/kg/min',
    recordedAt: '2026-09-03T08:00:00.000Z',
    sourceKind: 'derived',
  }),
  event({
    id: 'import-weight',
    metric: 'weight',
    domain: 'longevity',
    value: 78,
    unit: 'kg',
    recordedAt: '2026-09-03T09:00:00.000Z',
    sourceKind: 'import',
  }),
  event({
    id: 'lab-ldl',
    metric: 'ldl-c',
    domain: 'lab',
    value: 116,
    unit: 'mg/dL',
    recordedAt: '2026-09-03T10:00:00.000Z',
    receivedAt: '2026-09-03T11:00:00.000Z',
    sourceKind: 'clinical-system',
    review: {
      state: 'accepted',
      reviewerId: 'clinician-001',
      reviewedAt: '2026-09-05T12:00:00.000Z',
    },
  }),
])

const body = buildLongitudinalTwinSnapshot({
  state,
  consentLedger,
  at: '2026-09-04T12:00:00.000Z',
  surface: 'your-body',
})

assert.equal(body.subjectId, subjectId)
assert.equal(body.surface, 'your-body')
assert.equal(body.boundary.patientSpecificSignals, true)
assert.equal(body.boundary.patientSpecificInternalGeometry, false)
assert.equal(body.boundary.referenceAtlasGeometryMayBeUsedForOrientationOnly, true)
assert.equal(body.boundary.diagnosticInferenceGenerated, false)
assert.equal(body.boundary.autonomousClinicalActionAllowed, false)
assert.equal(body.boundary.simulatedState, false)
assert.equal(body.boundary.purposeConsentLedgerApplied, true)
assert.equal(body.governance.purposeConsentFilteredEvents, 0)

const rhr = twinSignalByMetric(body, 'resting-heart-rate')
assert.ok(rhr)
assert.equal(rhr.evidenceClass, 'sensor-recorded')
assert.equal(rhr.displayState, 'recorded')
assert.equal(rhr.confidence, 0.94)
assert.equal(rhr.provenance.sourceId, 'wearable:wearable-rhr')

assert.equal(twinSignalByMetric(body, 'sleep-duration')?.evidenceClass, 'self-reported')
assert.equal(twinSignalByMetric(body, 'vo2max')?.evidenceClass, 'derived')
assert.equal(twinSignalByMetric(body, 'weight')?.evidenceClass, 'imported')
assert.equal(twinSignalByMetric(body, 'ldl-c'), undefined, 'Your Body projection must not silently include clinical lab domain data')

const earlyClinical = buildLongitudinalTwinSnapshot({
  state,
  consentLedger,
  at: '2026-09-04T12:00:00.000Z',
  surface: 'clinical',
  clock: 'effective',
})
assert.equal(twinSignalByMetric(earlyClinical, 'ldl-c'), undefined)
assert.equal(earlyClinical.governance.pendingClinicalReview, 1, 'later clinician review must not leak backward into the historical twin')

const reviewedClinical = buildLongitudinalTwinSnapshot({
  state,
  consentLedger,
  at: '2026-09-06T12:00:00.000Z',
  surface: 'clinical',
})
const ldl = twinSignalByMetric(reviewedClinical, 'ldl-c')
assert.ok(ldl)
assert.equal(ldl.evidenceClass, 'clinical-record')
assert.equal(ldl.displayState, 'reviewed')
assert.equal(ldl.reviewState, 'accepted')
assert.equal(ldl.provenance.sourceId, 'clinical-system:lab-ldl')

const revokedPersonalLedger = appendPurposeConsentDecision(consentLedger, {
  id: 'revoke-personal',
  subjectId,
  purpose: 'personal-visualization',
  action: 'revoke',
  decidedAt: '2026-09-05T18:00:00.000Z',
  source: 'user',
})
const revokedBody = buildLongitudinalTwinSnapshot({
  state,
  consentLedger: revokedPersonalLedger,
  at: '2026-09-06T12:00:00.000Z',
  surface: 'your-body',
})
assert.equal(revokedBody.signals.length, 0, 'purpose revoke must remove formerly consented personal signals')
assert.ok(revokedBody.governance.purposeConsentFilteredEvents > 0)

const clinicalAfterPersonalRevoke = buildLongitudinalTwinSnapshot({
  state,
  consentLedger: revokedPersonalLedger,
  at: '2026-09-06T12:00:00.000Z',
  surface: 'clinical',
})
assert.ok(twinSignalByMetric(clinicalAfterPersonalRevoke, 'ldl-c'), 'personal-visualization revoke must not revoke clinical-support purpose')

assert.equal(Object.prototype.hasOwnProperty.call(reviewedClinical, 'anatomy'), false)
assert.equal(Object.prototype.hasOwnProperty.call(ldl, 'bodyRegion'), false)

console.log('Longitudinal Digital Twin adapter verified: governed replay input, purpose-ledger grant/revoke enforcement, evidence-class separation, temporal clinician-review integrity, provenance preservation, surface scoping, and no fabricated patient-specific internal anatomy.')
