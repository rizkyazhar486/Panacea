import assert from 'node:assert/strict'
import {
  authorizeVisitRealtimeJoin,
  createVisitRealtimeReplayGuard,
  isReservedVisitRealtimeRoom,
  refreshVisitRealtimeAuthorization,
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

const replayGuard = createVisitRealtimeReplayGuard()
assert.equal(replayGuard.accept(base), true, 'first sequence in a visit session is accepted')
assert.equal(replayGuard.accept(base), false, 'duplicate sequence is rejected')
assert.equal(replayGuard.accept({ ...base, sequence: 0 }), false, 'older sequence is rejected')
assert.equal(replayGuard.accept({ ...base, sequence: 2 }), true, 'newer sequence is accepted')

// Re-authorizing/re-joining the same visit must not clear replay state.
const rejoined = authorizeVisitRealtimeJoin(
  { userId: 'patient-secure', role: 'pasien' },
  'visit-secure',
  membership,
  '2026-09-19T08:31:00Z',
)
assert.equal(rejoined.allowed, true)
assert.equal(
  replayGuard.accept({ ...base, sequence: 1 }),
  false,
  're-join must not make an already-consumed sequence valid again',
)

// A genuinely new signaling session gets its own sequence stream.
assert.equal(
  replayGuard.accept({ ...base, sessionId: 'session-new', sequence: 0 }),
  true,
  'new session id starts an independent sequence stream',
)

// A WebSocket join is only a snapshot. Current membership must be checked again
// before every secure signal so lifecycle/window changes revoke access without
// waiting for a reconnect.
const refreshed = refreshVisitRealtimeAuthorization(
  { userId: 'patient-secure', role: 'pasien' },
  auth,
  membership,
  '2026-09-19T08:31:00Z',
)
assert.equal(refreshed.allowed, true, 'active current membership remains authorized')

assert.deepEqual(
  refreshVisitRealtimeAuthorization(
    { userId: 'patient-secure', role: 'pasien' },
    auth,
    { ...membership, status: 'ended' },
    '2026-09-19T08:31:00Z',
  ),
  { allowed: false, code: 'visit_ended' },
  'ending a visit must revoke an already-joined signaling session',
)

assert.deepEqual(
  refreshVisitRealtimeAuthorization(
    { userId: 'patient-secure', role: 'pasien' },
    auth,
    membership,
    '2026-09-19T09:00:01Z',
  ),
  { allowed: false, code: 'outside_visit_window' },
  'an already-joined signaling session must expire when the visit window ends',
)

assert.deepEqual(
  refreshVisitRealtimeAuthorization(
    { userId: 'patient-secure', role: 'pasien' },
    auth,
    undefined,
    '2026-09-19T08:31:00Z',
  ),
  { allowed: false, code: 'visit_not_found' },
  'missing canonical membership must fail closed after join',
)

assert.equal(isReservedVisitRealtimeRoom('visit:visit-secure'), true)
assert.equal(isReservedVisitRealtimeRoom(' visit:visit-secure '), true)
assert.equal(isReservedVisitRealtimeRoom('consult:visit-secure'), false)

console.log('Visit secure signaling policy: identity, freshness, replay resistance, live reauthorization and reserved room namespace ok')
