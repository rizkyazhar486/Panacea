import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  authorizeVisitRealtimeJoin,
  createVisitRealtimeReplayGuard,
  isReservedVisitRealtimeRoom,
  validateVisitRealtimeSignalEnvelope,
  type VisitRealtimeMembership,
} from '../../server/src/visitRealtimePolicy.js'

// This is the only authorization boundary between an authenticated user and a
// live doctor<->patient camera/microphone stream. It has driven the actual
// `/ws` wiring in server/src/realtime.ts since 2026-09-19 but had never been
// exercised by a deterministic test of its own — every other `feat(visit)`
// commit that day tested something built on top of it, never this module.

const NOW = '2026-09-19T12:00:00.000Z'

function membership(overrides: Partial<VisitRealtimeMembership> = {}): VisitRealtimeMembership {
  return {
    visitId: 'visit-001',
    patientUserId: 'user-patient',
    clinicianUserId: 'user-clinician',
    status: 'active',
    ...overrides,
  }
}

// --- authorizeVisitRealtimeJoin ---------------------------------------------

assert.deepEqual(
  authorizeVisitRealtimeJoin(null, 'visit-001', membership(), NOW),
  { allowed: false, code: 'unauthenticated' },
  'no authenticated principal must never join a visit room',
)

assert.deepEqual(
  authorizeVisitRealtimeJoin({ userId: 'user-patient', role: 'pasien' }, 'visit-999', membership(), NOW),
  { allowed: false, code: 'visit_mismatch' },
  'the requested room and the resolved membership must name the same visit',
)

assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'user-patient', role: 'pasien' },
    'visit-001',
    membership({ status: 'ended' }),
    NOW,
  ),
  { allowed: false, code: 'visit_ended' },
  'an ended visit must fail closed even for its real participants',
)

assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'user-patient', role: 'pasien' },
    'visit-001',
    membership({ startsAt: '2026-09-19T12:30:00.000Z' }),
    NOW,
  ),
  { allowed: false, code: 'outside_visit_window' },
  'joining before the scheduled visit window must fail closed',
)

assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'user-patient', role: 'pasien' },
    'visit-001',
    membership({ endsAt: '2026-09-19T11:00:00.000Z' }),
    NOW,
  ),
  { allowed: false, code: 'outside_visit_window' },
  'joining after the visit window has closed must fail closed',
)

assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'someone-else', role: 'pasien' },
    'visit-001',
    membership(),
    NOW,
  ),
  { allowed: false, code: 'not_a_participant' },
  'an authenticated user who is neither the patient nor the clinician must be rejected',
)

assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'user-patient', role: 'dokter' },
    'visit-001',
    membership(),
    NOW,
  ),
  { allowed: false, code: 'role_mismatch' },
  'the patient slot must still require the pasien role even when the id matches',
)

assert.deepEqual(
  authorizeVisitRealtimeJoin(
    { userId: 'user-clinician', role: 'owner' },
    'visit-001',
    membership(),
    NOW,
  ),
  { allowed: false, code: 'role_mismatch' },
  'owner/admin identity must receive no implicit clinical-room access, even with a matching id',
)

assert.deepEqual(
  authorizeVisitRealtimeJoin({ userId: 'user-patient', role: 'pasien' }, 'visit-001', membership(), NOW),
  { allowed: true, participant: 'patient', visitId: 'visit-001', userId: 'user-patient' },
  'the exact recorded patient, in the pasien role, must be allowed',
)

const clinicianAuth = authorizeVisitRealtimeJoin(
  { userId: 'user-clinician', role: 'dokter' },
  'visit-001',
  membership(),
  NOW,
)
assert.deepEqual(
  clinicianAuth,
  { allowed: true, participant: 'clinician', visitId: 'visit-001', userId: 'user-clinician' },
  'the exact recorded clinician, in the dokter role, must be allowed',
)
if (!clinicianAuth.allowed) throw new Error('unreachable')

// --- validateVisitRealtimeSignalEnvelope ------------------------------------

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    type: 'visit-rtc-offer' as const,
    visitId: 'visit-001',
    senderUserId: 'user-clinician',
    sessionId: 'session-a',
    sequence: 0,
    sentAt: NOW,
    payload: { sdp: 'v=0' },
    ...overrides,
  }
}

const validated = validateVisitRealtimeSignalEnvelope(envelope(), clinicianAuth, 64 * 1024, NOW)
assert.equal(validated.visitId, 'visit-001')
assert.equal(validated.senderUserId, 'user-clinician')

assert.throws(
  () => validateVisitRealtimeSignalEnvelope(envelope({ visitId: 'visit-999' }), clinicianAuth, 64 * 1024, NOW),
  /does not match authorized visit/,
  'a signal for a different visit than the authorized one must be rejected',
)

assert.throws(
  () => validateVisitRealtimeSignalEnvelope(envelope({ sequence: -1 }), clinicianAuth, 64 * 1024, NOW),
  /non-negative safe integer/,
  'a negative sequence must be rejected',
)

assert.throws(
  () => validateVisitRealtimeSignalEnvelope(envelope({ sequence: 1.5 }), clinicianAuth, 64 * 1024, NOW),
  /non-negative safe integer/,
  'a fractional sequence must be rejected',
)

assert.throws(
  () => validateVisitRealtimeSignalEnvelope(envelope({ sentAt: '2026-09-19T11:56:00.000Z' }), clinicianAuth, 64 * 1024, NOW),
  /stale/,
  'a signal timestamped more than two minutes in the past must be rejected',
)

assert.throws(
  () => validateVisitRealtimeSignalEnvelope(envelope({ sentAt: '2026-09-19T12:01:00.000Z' }), clinicianAuth, 64 * 1024, NOW),
  /too far in the future/,
  'a signal timestamped more than thirty seconds ahead must be rejected',
)

assert.throws(
  () => validateVisitRealtimeSignalEnvelope(envelope({ senderUserId: 'user-patient' }), clinicianAuth, 64 * 1024, NOW),
  /sender does not match/,
  'a claimed sender other than the authenticated joiner must be rejected, even the other real participant',
)

assert.throws(
  () => validateVisitRealtimeSignalEnvelope(envelope({ payload: { sdp: 'x'.repeat(200) } }), clinicianAuth, 128, NOW),
  /exceeds maximum payload size/,
  'an oversized signal payload must be rejected',
)

// --- createVisitRealtimeReplayGuard ------------------------------------------

{
  const guard = createVisitRealtimeReplayGuard()
  const signal = (sequence: number, sessionId = 'session-a', senderUserId = 'user-clinician') => ({
    visitId: 'visit-001',
    senderUserId,
    sessionId,
    sequence,
  })

  assert.equal(guard.accept(signal(0)), true, 'the first sequence on a fresh stream must be accepted')
  assert.equal(guard.accept(signal(1)), true, 'a strictly increasing sequence must be accepted')
  assert.equal(guard.accept(signal(1)), false, 'a repeated sequence must be rejected as a replay')
  assert.equal(guard.accept(signal(0)), false, 'a sequence lower than the highest seen must be rejected')
  assert.equal(guard.accept(signal(-1)), false, 'a negative sequence must never be accepted, even mid-stream')

  assert.equal(
    guard.accept(signal(0, 'session-b')),
    true,
    'a new sessionId must start an independent sequence stream even while an older one is active',
  )
  assert.equal(
    guard.accept(signal(0, 'session-a', 'user-patient')),
    true,
    'the same visit/session but a different sender is a distinct stream',
  )
}

{
  const guard = createVisitRealtimeReplayGuard(2)
  assert.equal(guard.accept({ visitId: 'v', senderUserId: 'a', sessionId: 's1', sequence: 0 }), true)
  assert.equal(guard.accept({ visitId: 'v', senderUserId: 'a', sessionId: 's2', sequence: 0 }), true)
  assert.equal(
    guard.accept({ visitId: 'v', senderUserId: 'a', sessionId: 's3', sequence: 0 }),
    false,
    'once a small replay guard is at capacity it must fail closed rather than evict an existing stream',
  )
  assert.equal(
    guard.accept({ visitId: 'v', senderUserId: 'a', sessionId: 's1', sequence: 1 }),
    true,
    'an existing stream must keep working normally while the guard is at capacity',
  )
}

assert.throws(
  () => createVisitRealtimeReplayGuard(0),
  /maxStreams must be a positive safe integer/,
  'a non-positive stream cap must be rejected at construction',
)

// --- isReservedVisitRealtimeRoom ---------------------------------------------

assert.equal(isReservedVisitRealtimeRoom('visit:visit-001'), true)
assert.equal(isReservedVisitRealtimeRoom('  visit:visit-001  '), true, 'padding around the room name must not defeat the reservation')
assert.equal(isReservedVisitRealtimeRoom('visitroom'), false, 'a room name that merely starts with the letters "visit" is not the reserved namespace')
assert.equal(isReservedVisitRealtimeRoom('consult-general'), false)

// --- realtime.ts actually wires this policy in, not a parallel check -------

const realtime = readFileSync(new URL('../../server/src/realtime.ts', import.meta.url), 'utf8')
assert.match(
  realtime,
  /from '\.\/visitRealtimePolicy\.js'/,
  'server/src/realtime.ts must consume this policy module rather than re-implementing visit authorization inline',
)
assert.match(realtime, /getVisitMembership\(m\.visitId\)/, 'visit-join must resolve membership from the canonical registry, not a client-supplied shape')
assert.match(realtime, /isReservedVisitRealtimeRoom\(requestedRoom\)/, 'the generic join path must refuse the visit: namespace so the two transports cannot collide')
assert.match(realtime, /validateVisitRealtimeSignalEnvelope/, 'visit-rtc-* signals must be validated, not relayed raw')
assert.match(realtime, /replayGuard\.accept\(envelope\)/, 'accepted signals must still pass the replay guard before being relayed')
assert.match(realtime, /!room\.startsWith\('visit:'\)/, 'legacy rtc-* Consult signaling must stay excluded from the secure visit: namespace')

console.log(
  'Visit realtime policy: authorization boundary, signal-envelope validation, per-stream replay protection, ' +
  'and room-namespace isolation between legacy Consult and secure Visit OS signaling are verified end to end.',
)
