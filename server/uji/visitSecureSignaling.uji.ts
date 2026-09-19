import assert from 'node:assert/strict'
import {
  authorizeVisitRealtimeJoin,
  validateVisitRealtimeSignalEnvelope,
} from '../src/visitRealtimePolicy.js'

const membership = {
  visitId: 'visit-secure',
  patientUserId: 'patient-secure',
  clinicianUserId: 'doctor-secure',
  status: 'active',
  startsAt: '2026-09-19T08:00:00Z',
  endsAt: '2026-09-19T09:00:00Z',
}

const auth = authorizeVisitRealtimeJoin(
  { userId: 'patient-secure', role: 'pasien' },
  'visit-secure',
  membership,
  '2026-09-19T08:30:00Z',
)
assert.equal(auth.allowed, true)
if (!auth.allowed) throw new Error('fixture authorization failed')
assert.equal(auth.userId, 'patient-secure')

const base = {
  type: 'visit-rtc-offer',
  visitId: 'visit-secure',
  senderUserId: 'patient-secure',
  sessionId: 'session-secure',
  sequence: 1,
  sentAt: '2026-09-19T08:30:00Z',
  payload: { sdp: 'fixture' },
}
assert.equal(
  validateVisitRealtimeSignalEnvelope(base, auth, 64 * 1024, '2026-09-19T08:30:30Z').sequence,
  1,
)
assert.throws(
  () => validateVisitRealtimeSignalEnvelope(
    { ...base, senderUserId: 'spoofed-user' },
    auth,
    64 * 1024,
    '2026-09-19T08:30:30Z',
  ),
  /authenticated participant/,
)
assert.throws(
  () => validateVisitRealtimeSignalEnvelope(
    { ...base, sentAt: '2026-09-19T08:27:00Z' },
    auth,
    64 * 1024,
    '2026-09-19T08:30:30Z',
  ),
  /stale/,
)
assert.throws(
  () => validateVisitRealtimeSignalEnvelope(
    { ...base, sentAt: '2026-09-19T08:31:31Z' },
    auth,
    64 * 1024,
    '2026-09-19T08:30:30Z',
  ),
  /future/,
)

console.log('Visit secure signaling policy: authenticated identity, freshness, sender binding and payload bounds ok')
