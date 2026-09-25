import assert from 'node:assert/strict'
import { createLongitudinalPatientState } from '../../src/lib/panaceaLongitudinalState.ts'
import { syncProductionAppState } from '../../src/lib/productionAppStateLongitudinalSync.ts'

const appState = {
  vitals: {
    'patient-a': [{
      id: 'clinical-a',
      takenAt: '2026-09-17T01:00:00.000Z',
      systolic: 120,
      diastolic: 76,
      heartRate: 62,
      respRate: 16,
      tempC: 36.6,
      spo2: 98,
    }],
    'patient-b': [{
      id: 'clinical-b',
      takenAt: '2026-09-17T01:01:00.000Z',
      systolic: 130,
      diastolic: 82,
      heartRate: 70,
      respRate: 18,
      tempC: 36.7,
      spo2: 97,
    }],
  },
  selfVitals: [{
    id: 'self-a',
    at: '2026-09-17T01:05:00.000Z',
    systolic: 118,
    diastolic: 74,
    heartRate: 59,
    spo2: 99,
    tempC: 36.5,
  }],
  vo2maxLog: [{
    id: 'vo2-a',
    at: '2026-09-16T12:00:00.000Z',
    value: 48.2,
    method: 'Tes Cooper',
  }],
  account: {
    email: 'patient@example.test',
    name: 'Patient A',
    role: 'pasien' as const,
    isSubscriber: false,
    patientId: 'patient-a',
    loggedAt: '2026-09-17T00:00:00.000Z',
  },
}

const context = {
  consent: {
    granted: true,
    purposes: ['personal-visualization', 'clinical-support'] as const,
    grantedAt: '2026-09-01T00:00:00.000Z',
  },
  receivedAt: '2026-09-17T01:30:00.000Z',
  confidence: {
    clinicalVital: 0.98,
    selfVital: 0.85,
    vo2max: 0.80,
    deviceSnapshot: 0.92,
  },
} as const

const sharedVitals = {
  heartRate: 58,
  source: 'Apple Watch',
  measuredAt: '2026-09-17T01:15:00.000Z',
  syncedAt: '2026-09-17T01:16:00.000Z',
}

const labByType = {
  hba1c: [{ id: 'hba1c-1', tanggal: '2026-08-01', nilai: 5.4 }],
}
const bioAgeTrajectory = [{
  tanggal: '2026-08-01',
  usia: 40,
  phenoAge: 38.2,
  ageGap: -1.8,
  metode: 'phenoage-levine-2018' as const,
}]
const labContext = {
  consent: context.consent,
  receivedAt: context.receivedAt,
  confidence: { labManualEntry: 0.75, bioAgeDerived: 0.7 },
} as const

const personal = syncProductionAppState({
  state: createLongitudinalPatientState('patient-a', '2026-09-01T00:00:00.000Z'),
  appState,
  subjectId: 'patient-a',
  scope: 'personal-plus-clinical',
  currentVitals: sharedVitals,
  context,
  labByType,
  bioAgeTrajectory,
  labContext,
})
assert.equal(personal.personalStoresIncluded, true)
assert.equal(personal.sourceCounts.clinicalVitals, 1)
assert.equal(personal.sourceCounts.selfVitals, 1)
assert.equal(personal.sourceCounts.vo2max, 1)
assert.equal(personal.sourceCounts.currentSharedVitals, 1)
assert.equal(personal.sourceCounts.labTypes, 1)
assert.equal(personal.sourceCounts.labResults, 1)
assert.equal(personal.sourceCounts.bioAgePoints, 1)
assert.ok(Object.values(personal.state.eventsById).some((event) => event.provenance.sourceId === 'health-vitals:Apple Watch'))
assert.ok(Object.values(personal.state.eventsById).some((event) => event.provenance.sourceId === 'panaceamed:self-vitals'))
assert.ok(Object.values(personal.state.eventsById).some((event) => event.provenance.sourceId === 'panaceamed:lab-log' && event.review.state === 'pending'))
assert.ok(Object.values(personal.state.eventsById).some((event) => event.provenance.sourceId === 'panaceamed:bioage-trajectory' && event.review.state === 'not-required'))

// Lab/bioAge stay excluded from the clinical-only scope even when supplied,
// the same way currentVitals is excluded — personal data never attaches to
// an arbitrary clinical patient.
const clinicalOnlyWithLab = syncProductionAppState({
  state: createLongitudinalPatientState('patient-b', '2026-09-01T00:00:00.000Z'),
  appState,
  subjectId: 'patient-b',
  scope: 'clinical-only',
  labByType,
  bioAgeTrajectory,
  labContext,
  context,
})
assert.equal(clinicalOnlyWithLab.sourceCounts.labTypes, 0)
assert.equal(clinicalOnlyWithLab.sourceCounts.bioAgePoints, 0)
assert.ok(Object.values(clinicalOnlyWithLab.state.eventsById).every((event) => event.domain !== 'lab' && event.domain !== 'longevity'))

const clinicalOnly = syncProductionAppState({
  state: createLongitudinalPatientState('patient-b', '2026-09-01T00:00:00.000Z'),
  appState,
  subjectId: 'patient-b',
  scope: 'clinical-only',
  currentVitals: sharedVitals,
  context,
})
assert.equal(clinicalOnly.personalStoresIncluded, false)
assert.deepEqual(clinicalOnly.sourceCounts, {
  clinicalVitals: 1,
  selfVitals: 0,
  vo2max: 0,
  currentSharedVitals: 0,
  labTypes: 0,
  labResults: 0,
  bioAgePoints: 0,
})
assert.ok(Object.values(clinicalOnly.state.eventsById).every((event) => event.subjectId === 'patient-b'))
assert.ok(Object.values(clinicalOnly.state.eventsById).every((event) => event.provenance.sourceId === 'panaceamed:clinical-vitals'))

assert.throws(
  () => syncProductionAppState({
    state: createLongitudinalPatientState('patient-b', '2026-09-01T00:00:00.000Z'),
    appState,
    subjectId: 'patient-b',
    scope: 'personal-plus-clinical',
    currentVitals: sharedVitals,
    context,
  }),
  /personal store scope requires account.patientId to match subjectId/,
)

console.log('AppState orchestration keeps account-global personal/device data out of unrelated clinical subjects.')