import assert from 'node:assert/strict'
import { selectProductionHealthStoreSlice } from '../../src/lib/productionHealthStoreSelector.ts'

const store = {
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

const clinicalOnly = selectProductionHealthStoreSlice(store, 'patient-b', 'clinical-only')
assert.equal(clinicalOnly.clinicalVitals.length, 1)
assert.equal(clinicalOnly.clinicalVitals[0].id, 'clinical-b')
assert.equal(clinicalOnly.selfVitals.length, 0)
assert.equal(clinicalOnly.vo2maxLog.length, 0)
assert.equal(clinicalOnly.personalStoresIncluded, false)

const personal = selectProductionHealthStoreSlice(store, 'patient-a', 'personal-plus-clinical')
assert.equal(personal.clinicalVitals[0].id, 'clinical-a')
assert.equal(personal.selfVitals[0].id, 'self-a')
assert.equal(personal.vo2maxLog[0].id, 'vo2-a')
assert.equal(personal.personalStoresIncluded, true)

assert.throws(
  () => selectProductionHealthStoreSlice(store, 'patient-b', 'personal-plus-clinical'),
  /personal store scope requires account.patientId to match subjectId/,
)

console.log('Production health-store selector prevents personal self-tracking data from crossing subject boundaries.')