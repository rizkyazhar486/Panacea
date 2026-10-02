import assert from 'node:assert/strict'
import {
  getVisitMembership,
  listVisitMembershipsForUser,
  saveVisitMembership,
  upsertUser,
} from '../src/store.js'

const suffix = Date.now().toString(36)
const patient = upsertUser(`visit-patient-${suffix}@example.test`, 'Visit Patient', 'pasien')
const doctor = upsertUser(`visit-doctor-${suffix}@example.test`, 'Visit Doctor', 'dokter')
const owner = upsertUser(`visit-owner-${suffix}@example.test`, 'Visit Owner', 'owner')

const visitId = `visit-registry-${suffix}`
const scheduled = saveVisitMembership({
  id: visitId,
  patientUserId: patient.id,
  clinicianUserId: doctor.id,
  status: 'scheduled',
  startsAt: '2026-09-19T09:00:00Z',
  endsAt: '2026-09-19T10:00:00Z',
  createdAt: '2026-09-19T08:00:00Z',
  updatedAt: '2026-09-19T08:00:00Z',
})
assert.equal(scheduled.status, 'scheduled')
assert.equal(getVisitMembership(visitId)?.patientUserId, patient.id)
assert.equal(listVisitMembershipsForUser(doctor.id).some((visit) => visit.id === visitId), true)

const active = saveVisitMembership({
  ...scheduled,
  status: 'active',
  updatedAt: '2026-09-19T09:00:00Z',
})
assert.equal(active.status, 'active')

const ended = saveVisitMembership({
  ...active,
  status: 'ended',
  updatedAt: '2026-09-19T10:00:00Z',
})
assert.equal(ended.status, 'ended')

assert.throws(
  () => saveVisitMembership({ ...ended, status: 'active', updatedAt: '2026-09-19T10:01:00Z' }),
  /cannot move backward/,
)
assert.throws(
  () => saveVisitMembership({
    ...ended,
    patientUserId: owner.id,
    updatedAt: '2026-09-19T10:02:00Z',
  }),
  /registered patient user|participants are immutable/,
)
assert.throws(
  () => saveVisitMembership({
    id: `visit-owner-${suffix}`,
    patientUserId: patient.id,
    clinicianUserId: owner.id,
    status: 'scheduled',
  }),
  /registered doctor user/,
)
assert.throws(
  () => saveVisitMembership({
    id: `visit-bad-window-${suffix}`,
    patientUserId: patient.id,
    clinicianUserId: doctor.id,
    status: 'scheduled',
    startsAt: '2026-09-19T10:00:00Z',
    endsAt: '2026-09-19T09:00:00Z',
  }),
  /must not precede/,
)

console.log('Visit membership registry: persisted exact patient/clinician identity and monotonic lifecycle ok')
