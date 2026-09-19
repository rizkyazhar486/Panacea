import assert from 'node:assert/strict'
import { canEnterClinicalRecord } from '../../src/lib/panaceaLongitudinalState.ts'
import {
  buildAiEmrVisitContext,
  createVisitOperatingSession,
  endVisit,
  ingestVisitDeviceObservation,
  promoteObservationToClinicalRecord,
  reconcileVisitDeviceLiveness,
  revokeVisitClinicalConsent,
  registerMedicalDevice,
  resumeVisit,
  setMedicalDeviceConnection,
  startVisit,
  updateVisitMedia,
  visitObservationFreshness,
  type VisitDeviceObservation,
} from '../../src/lib/visitOperatingSystem.ts'

const consent = {
  clinicalData: {
    granted: true,
    purposes: ['clinical-support', 'ai-context'] as const,
    grantedAt: '2026-09-18T10:00:00.000Z',
  },
  media: {
    camera: true,
    microphone: true,
    ambientAi: true,
    acknowledgedAt: '2026-09-18T10:00:00.000Z',
  },
}

let state = createVisitOperatingSession({
  visitId: 'visit-001',
  subjectId: 'patient-001',
  clinicianId: 'doctor-001',
  createdAt: '2026-09-18T10:01:00.000Z',
  scheduledAt: '2026-09-18T10:05:00.000Z',
  consent,
})

assert.equal(state.phase, 'ready')
assert.equal(state.media.rawMediaPersisted, false)
assert.equal(state.media.recording, 'disabled')
assert.equal(state.media.ambientAi, 'consented')

state = registerMedicalDevice(state, {
  id: 'pulseox-room-a',
  label: 'Bedside pulse oximeter',
  deviceClass: 'pulse-oximeter',
  evidenceClass: 'clinical',
  transport: 'bluetooth-le',
  manufacturer: 'Example MedTech',
  model: 'PX-1',
  firmwareVersion: '1.4.2',
  supports: ['heart-rate', 'spo2'],
}, '2026-09-18T10:02:00.000Z')

state = startVisit(state, '2026-09-18T10:05:00.000Z')
state = updateVisitMedia(state, { camera: 'live', microphone: 'live', peerCount: 2 })
state = setMedicalDeviceConnection(state, 'pulseox-room-a', 'live', '2026-09-18T10:05:05.000Z')

const sample: VisitDeviceObservation = {
  id: 'sample-hr-001',
  visitId: 'visit-001',
  subjectId: 'patient-001',
  deviceId: 'pulseox-room-a',
  metric: 'heart-rate',
  value: 76,
  unit: 'bpm',
  capturedAt: '2026-09-18T10:05:10.000Z',
  receivedAt: '2026-09-18T10:05:11.000Z',
  signalQuality: 0.96,
  standardCode: { system: 'loinc', code: '8867-4' },
}

let ingested = ingestVisitDeviceObservation(state, sample)
assert.equal(ingested.accepted, true)
state = ingested.state
assert.equal(state.latestByMetric['heart-rate']?.value, 76)
assert.equal(state.sampleCountByMetric['heart-rate'], 1)
assert.equal(state.quarantinedSampleCount, 0)

const unknownQuality = ingestVisitDeviceObservation(state, {
  ...sample,
  id: 'sample-spo2-unknown-quality',
  metric: 'spo2',
  value: 98,
  unit: '%',
  capturedAt: '2026-09-18T10:05:12.000Z',
  receivedAt: '2026-09-18T10:05:13.000Z',
  signalQuality: null,
  standardCode: undefined,
})
assert.equal(unknownQuality.accepted, true)
state = unknownQuality.state
assert.equal(state.latestByMetric.spo2?.value, 98)

const duplicate = ingestVisitDeviceObservation(state, sample)
assert.equal(duplicate.accepted, false)
assert.equal(duplicate.reason, 'duplicate')
assert.equal(duplicate.state.quarantinedSampleCount, 0, 'idempotent duplicate should not inflate quarantine')

const wrongUnit = ingestVisitDeviceObservation(state, {
  ...sample,
  id: 'sample-hr-unit',
  value: 77,
  unit: 'Hz',
  capturedAt: '2026-09-18T10:05:12.000Z',
  receivedAt: '2026-09-18T10:05:13.000Z',
})
assert.equal(wrongUnit.accepted, false)
assert.equal(wrongUnit.reason, 'unit-mismatch')
assert.equal(wrongUnit.state.quarantinedSampleCount, 1)

const lowSignal = ingestVisitDeviceObservation(state, {
  ...sample,
  id: 'sample-hr-noisy',
  value: 75,
  capturedAt: '2026-09-18T10:05:14.000Z',
  receivedAt: '2026-09-18T10:05:15.000Z',
  signalQuality: 0.2,
})
assert.equal(lowSignal.accepted, false)
assert.equal(lowSignal.reason, 'low-signal-quality')

const wrongPatient = ingestVisitDeviceObservation(state, {
  ...sample,
  id: 'sample-other-patient',
  subjectId: 'patient-999',
  capturedAt: '2026-09-18T10:05:16.000Z',
  receivedAt: '2026-09-18T10:05:17.000Z',
})
assert.equal(wrongPatient.accepted, false)
assert.equal(wrongPatient.reason, 'subject-mismatch')

const context = buildAiEmrVisitContext(state, '2026-09-18T10:05:20.000Z')
assert.equal(context.observations.length, 2)
const heartRateContext = context.observations.find((observation) => observation.metric === 'heart-rate')
assert.ok(heartRateContext)
assert.equal(heartRateContext.freshness, 'fresh')
const spo2Context = context.observations.find((observation) => observation.metric === 'spo2')
assert.ok(spo2Context)
assert.equal(spo2Context.signalQuality, null)
assert.equal(context.media.camera, 'live')
assert.equal(context.media.peerCount, 2)
assert.equal(context.governance.liveDeviceDataIsPermanentRecord, false)
assert.equal(context.governance.selectedObservationRequiresClinicianPromotion, true)
assert.equal(context.governance.autonomousDiagnosisAllowed, false)
assert.equal(context.governance.autonomousTreatmentAllowed, false)

assert.deepEqual(
  visitObservationFreshness('2026-09-18T10:05:11.000Z', '2026-09-18T10:05:41.000Z'),
  { freshness: 'fresh', ageMs: 30_000 },
)
assert.deepEqual(
  visitObservationFreshness('2026-09-18T10:05:11.000Z', '2026-09-18T10:06:00.000Z'),
  { freshness: 'delayed', ageMs: 49_000 },
)
assert.deepEqual(
  visitObservationFreshness('2026-09-18T10:05:11.000Z', '2026-09-18T10:08:00.000Z'),
  { freshness: 'stale', ageMs: 169_000 },
)

const reviewed = promoteObservationToClinicalRecord(
  state,
  'heart-rate',
  'doctor-001',
  '2026-09-18T10:06:00.000Z',
)
assert.equal(reviewed.review.state, 'accepted')
assert.equal(reviewed.value, 76)
assert.equal(reviewed.metric, 'heart-rate')
assert.equal(reviewed.provenance.sourceKind, 'device')
assert.match(reviewed.provenance.method ?? '', /bluetooth-le/)
assert.match(reviewed.provenance.method ?? '', /loinc:8867-4/)
assert.equal(canEnterClinicalRecord(reviewed, Date.parse('2026-09-18T10:06:01.000Z')), true)
assert.throws(
  () => promoteObservationToClinicalRecord(state, 'spo2', 'doctor-001', '2026-09-18T10:06:02.000Z'),
  /signal quality is unknown/,
)

state = endVisit(state, '2026-09-18T10:10:00.000Z')
assert.equal(state.phase, 'ended')
assert.equal(state.media.camera, 'off')
assert.equal(state.media.microphone, 'off')
assert.equal(state.devices['pulseox-room-a'].status, 'offline')

const afterEnd = ingestVisitDeviceObservation(state, {
  ...sample,
  id: 'sample-after-end',
  capturedAt: '2026-09-18T10:10:01.000Z',
  receivedAt: '2026-09-18T10:10:02.000Z',
})
assert.equal(afterEnd.accepted, false)
assert.equal(afterEnd.reason, 'visit-not-running')

const revokedState = createVisitOperatingSession({
  visitId: 'visit-revoked',
  subjectId: 'patient-002',
  clinicianId: 'doctor-001',
  createdAt: '2026-09-18T10:05:00.000Z',
  consent: {
    clinicalData: {
      ...consent.clinicalData,
      revokedAt: '2026-09-18T10:04:00.000Z',
    },
    media: consent.media,
  },
})
assert.equal(revokedState.phase, 'consent-required')
assert.throws(
  () => startVisit(revokedState, '2026-09-18T10:05:10.000Z'),
  /active clinical \+ media consent is required/,
)

console.log('Visit OS verified: WebRTC metadata boundary, continuous device ingest, consent/identity/unit/quality gates, unknown-quality live context, freshness formula, uncommitted AI-EMR context, and clinician-reviewed promotion.')


const reliabilityBase = createVisitOperatingSession({
  visitId: 'visit-reliability',
  subjectId: 'patient-reliability',
  clinicianId: 'doctor-001',
  createdAt: '2026-09-18T11:00:00.000Z',
  consent,
})
let reliabilityState = registerMedicalDevice(reliabilityBase, {
  id: 'monitor-1',
  label: 'Bedside monitor',
  deviceClass: 'vital-signs-monitor',
  evidenceClass: 'clinical',
  transport: 'local-network',
  supports: ['heart-rate'],
}, '2026-09-18T11:00:05.000Z')
reliabilityState = startVisit(reliabilityState, '2026-09-18T11:00:10.000Z')
reliabilityState = setMedicalDeviceConnection(reliabilityState, 'monitor-1', 'live', '2026-09-18T11:00:20.000Z')

const degraded = reconcileVisitDeviceLiveness(reliabilityState, '2026-09-18T11:02:21.000Z')
assert.equal(degraded.devices['monitor-1'].status, 'degraded', 'device should degrade after >120 s without transport activity')

const offline = reconcileVisitDeviceLiveness(reliabilityState, '2026-09-18T11:05:21.000Z')
assert.equal(offline.devices['monitor-1'].status, 'offline', 'device should become offline after >5 min without transport activity')

const revoked = revokeVisitClinicalConsent(reliabilityState, '2026-09-18T11:01:00.000Z')
assert.equal(revoked.phase, 'consent-required')
assert.equal(revoked.consent.clinicalData.revokedAt, '2026-09-18T11:01:00.000Z')
assert.equal(revoked.media.camera, 'off')
assert.equal(revoked.media.microphone, 'off')
assert.equal(revoked.media.ambientAi, 'disabled')
assert.equal(revoked.devices['monitor-1'].status, 'offline')
assert.throws(
  () => resumeVisit({ ...revoked, phase: 'paused' }, '2026-09-18T11:01:05.000Z'),
  /active clinical \+ media consent is required/,
)
assert.throws(
  () => revokeVisitClinicalConsent(reliabilityState, '2026-09-18T09:59:00.000Z'),
  /must not be earlier than consent grant/,
)
