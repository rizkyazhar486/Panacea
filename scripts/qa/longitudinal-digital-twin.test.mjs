import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLongitudinalTwinSnapshot, twinSignalByMetric } from '../../src/lib/longitudinalDigitalTwin.ts'
import { appendPurposeConsentDecision, createPurposeConsentLedger } from '../../src/lib/purposeConsentLedger.ts'
import { createLongitudinalPatientState, ingestLongitudinalBatch } from '../../src/lib/panaceaLongitudinalState.ts'

const subjectId = 'twin-subject-1'
const consent = {
  granted: true,
  purposes: ['personal-visualization', 'clinical-support', 'ai-context'],
  grantedAt: '2026-09-01T00:00:00.000Z',
}

const event = ({
  id,
  metric,
  domain,
  value,
  unit,
  recordedAt,
  receivedAt = recordedAt,
  sourceKind,
  review = { state: 'not-required' },
  eventConsent = consent,
}) => ({
  id,
  subjectId,
  domain,
  metric,
  value,
  unit,
  recordedAt,
  confidence: 0.91,
  provenance: {
    sourceKind,
    sourceId: `${sourceKind}:${id}`,
    capturedAt: recordedAt,
    receivedAt,
    method: 'fixture',
    version: '1',
  },
  consent: eventConsent,
  review,
})

let ledger = createPurposeConsentLedger()
for (const [id, purpose] of [
  ['grant-personal', 'personal-visualization'],
  ['grant-clinical', 'clinical-support'],
]) {
  ledger = appendPurposeConsentDecision(ledger, {
    id,
    subjectId,
    purpose,
    action: 'grant',
    decidedAt: '2026-09-01T00:00:00.000Z',
    source: 'user',
  })
}

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
      reviewerId: 'clinician-1',
      reviewedAt: '2026-09-05T12:00:00.000Z',
    },
  }),
])

test('Your Body twin exposes governed personal signals without fabricating patient anatomy', () => {
  const body = buildLongitudinalTwinSnapshot({
    state,
    consentLedger: ledger,
    at: '2026-09-04T12:00:00.000Z',
    surface: 'your-body',
  })
  assert.equal(twinSignalByMetric(body, 'resting-heart-rate')?.evidenceClass, 'sensor-recorded')
  assert.equal(twinSignalByMetric(body, 'sleep-duration')?.evidenceClass, 'self-reported')
  assert.equal(twinSignalByMetric(body, 'ldl-c'), undefined)
  assert.equal(body.boundary.patientSpecificSignals, true)
  assert.equal(body.boundary.patientSpecificInternalGeometry, false)
  assert.equal(body.boundary.referenceAtlasGeometryMayBeUsedForOrientationOnly, true)
  assert.equal(body.boundary.diagnosticInferenceGenerated, false)
  assert.equal(body.boundary.autonomousClinicalActionAllowed, false)
})

test('historical clinical twin does not leak a later clinician review backward in time', () => {
  const early = buildLongitudinalTwinSnapshot({
    state,
    consentLedger: ledger,
    at: '2026-09-04T12:00:00.000Z',
    surface: 'clinical',
    clock: 'effective',
  })
  assert.equal(twinSignalByMetric(early, 'ldl-c'), undefined)
  assert.equal(early.governance.pendingClinicalReview, 1)

  const later = buildLongitudinalTwinSnapshot({
    state,
    consentLedger: ledger,
    at: '2026-09-06T12:00:00.000Z',
    surface: 'clinical',
  })
  assert.equal(twinSignalByMetric(later, 'ldl-c')?.displayState, 'reviewed')
  assert.equal(twinSignalByMetric(later, 'ldl-c')?.evidenceClass, 'clinical-record')
})

test('purpose-specific revocation removes personal visualization without revoking clinical support', () => {
  const revoked = appendPurposeConsentDecision(ledger, {
    id: 'revoke-personal',
    subjectId,
    purpose: 'personal-visualization',
    action: 'revoke',
    decidedAt: '2026-09-05T18:00:00.000Z',
    source: 'user',
  })

  const body = buildLongitudinalTwinSnapshot({
    state,
    consentLedger: revoked,
    at: '2026-09-06T12:00:00.000Z',
    surface: 'your-body',
  })
  assert.equal(body.signals.length, 0)
  assert.ok(body.governance.purposeConsentFilteredEvents > 0)

  const clinical = buildLongitudinalTwinSnapshot({
    state,
    consentLedger: revoked,
    at: '2026-09-06T12:00:00.000Z',
    surface: 'clinical',
  })
  assert.ok(twinSignalByMetric(clinical, 'ldl-c'))
})
