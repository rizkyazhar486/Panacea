import assert from 'node:assert/strict'
import {
  authorizeVisitRealtimeJoin,
  validateVisitRealtimeSignalEnvelope,
} from '../src/visitRealtimePolicy.js'

const membership = {
  visitId: 'visit-1',
  patientUserId: 'patient-1',
  clinicianUserId: 'doctor-1',
  status: 'active',
  startsAt: '2026-09-19T08:00:00Z',
  endsAt: '2026-09-19T09:00:00Z',
}

const patient = authorizeVisitRealtimeJoin(
  { userId: 'patient-1', role: 'pasien' },
  'visit-1',
  membership,
  '2026-09-19T08:30:00Z',
)
assert.equal(patient.allowed, true)
if (!patient.allowed) throw new Error('patient authorization unexpectedly failed')
assert.equal(patient.participant, 'patient')

const clinician = authorizeVisitRealtimeJoin(
  { userId: 'doctor-1', role: 'dokter' },
  'visit-1',
  membership,
  '2026-09-19T08:30:00Z',
)
assert.equal(clinician.allowed, true)

assert.deepEqual(
  authorizeVisitRealtimeJoin(null, 'visit-1', membership, '2026-09-19T08:30:00Z'),
  { allowed: false, code: 'unauthenticated' },
)
assert.equal(
  authorizeVisitRealtimeJoin(
    { userId: 'owner-1', role: 'owner' },
    'visit-1',
    membership,
    '2026-09-19T08:30:00Z',
  ).allowed,
  false,
  'owner/admin status must not create implicit clinical-room access',
)
assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'patient-1', role: 'dokter' },
    'visit-1',
    membership,
    '2026-09-19T08:30:00Z',
  ),
  { allowed: false, code: 'role_mismatch' },
)
assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'patient-1', role: 'pasien' },
    'visit-other',
    membership,
    '2026-09-19T08:30:00Z',
  ),
  { allowed: false, code: 'visit_mismatch' },
)
assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'patient-1', role: 'pasien' },
    'visit-1',
    membership,
    '2026-09-19T07:59:59Z',
  ),
  { allowed: false, code: 'outside_visit_window' },
)
assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'patient-1', role: 'pasien' },
    'visit-1',
    { ...membership, status: 'ended' },
    '2026-09-19T08:30:00Z',
  ),
  { allowed: false, code: 'visit_ended' },
)

const signal = validateVisitRealtimeSignalEnvelope({
  type: 'visit-rtc-offer',
  visitId: 'visit-1',
  senderUserId: 'patient-1',
  sessionId: 'session-1',
  sequence: 0,
  sentAt: '2026-09-19T08:30:00Z',
  payload: { sdp: 'fixture' },
}, patient)
assert.equal(signal.visitId, 'visit-1')

assert.throws(
  () => validateVisitRealtimeSignalEnvelope({ ...signal, visitId: 'visit-2' }, patient),
  /authorized visit/,
)
assert.throws(
  () => validateVisitRealtimeSignalEnvelope({ ...signal, sequence: -1 }, patient),
  /non-negative safe integer/,
)
assert.throws(
  () => validateVisitRealtimeSignalEnvelope(
    { ...signal, payload: { huge: 'x'.repeat(70 * 1024) } },
    patient,
  ),
  /maximum payload size/,
)

console.log('Visit realtime authorization policy: exact membership, least privilege, visit window and bounded signaling ok')
