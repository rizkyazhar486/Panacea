import type { Role } from './store.js'

export type VisitRealtimeMembershipStatus = 'scheduled' | 'active' | 'ended'

export interface VisitRealtimeMembership {
  visitId: string
  patientUserId: string
  clinicianUserId: string
  status: VisitRealtimeMembershipStatus
  startsAt?: string
  endsAt?: string
}

export interface VisitRealtimePrincipal {
  userId: string
  role: Role
}

export type VisitRealtimeAuthorization =
  | {
      allowed: true
      participant: 'patient' | 'clinician'
      visitId: string
      userId: string
    }
  | {
      allowed: false
      code:
        | 'unauthenticated'
        | 'visit_mismatch'
        | 'visit_ended'
        | 'not_a_participant'
        | 'role_mismatch'
        | 'outside_visit_window'
        | 'visit_not_found'
    }

function requiredText(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field} must not be blank`)
  return normalized
}

function optionalTime(value: string | undefined, field: string): number | undefined {
  if (!value) return undefined
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid timestamp`)
  return parsed
}

/**
 * Pure authorization boundary for the future authenticated Visit realtime path.
 *
 * Authentication alone is intentionally insufficient. The principal must also
 * be the exact patient or clinician recorded by the canonical visit-membership
 * source. Owner/admin roles receive no implicit clinical-room access.
 */
export function authorizeVisitRealtimeJoin(
  principal: VisitRealtimePrincipal | null | undefined,
  requestedVisitId: string,
  membership: VisitRealtimeMembership,
  now = new Date().toISOString(),
): VisitRealtimeAuthorization {
  if (!principal) return { allowed: false, code: 'unauthenticated' }

  const visitId = requiredText(requestedVisitId, 'requestedVisitId')
  const membershipVisitId = requiredText(membership.visitId, 'membership.visitId')
  const userId = requiredText(principal.userId, 'principal.userId')
  if (visitId !== membershipVisitId) return { allowed: false, code: 'visit_mismatch' }
  if (membership.status === 'ended') return { allowed: false, code: 'visit_ended' }

  const nowMs = optionalTime(now, 'now')!
  const startsAt = optionalTime(membership.startsAt, 'membership.startsAt')
  const endsAt = optionalTime(membership.endsAt, 'membership.endsAt')
  if ((startsAt !== undefined && nowMs < startsAt) || (endsAt !== undefined && nowMs > endsAt)) {
    return { allowed: false, code: 'outside_visit_window' }
  }

  if (userId === membership.patientUserId.trim()) {
    if (principal.role !== 'pasien') return { allowed: false, code: 'role_mismatch' }
    return { allowed: true, participant: 'patient', visitId, userId }
  }
  if (userId === membership.clinicianUserId.trim()) {
    if (principal.role !== 'dokter') return { allowed: false, code: 'role_mismatch' }
    return { allowed: true, participant: 'clinician', visitId, userId }
  }

  return { allowed: false, code: 'not_a_participant' }
}

export type VisitRealtimeSignalType =
  | 'visit-rtc-offer'
  | 'visit-rtc-answer'
  | 'visit-rtc-ice'
  | 'visit-rtc-end'

export interface VisitRealtimeSignalEnvelope {
  type: VisitRealtimeSignalType
  visitId: string
  senderUserId: string
  sessionId: string
  sequence: number
  sentAt: string
  payload?: unknown
}

export function validateVisitRealtimeSignalEnvelope(
  envelope: VisitRealtimeSignalEnvelope,
  authorization: Extract<VisitRealtimeAuthorization, { allowed: true }>,
  maxBytes = 64 * 1024,
  now = new Date().toISOString(),
): VisitRealtimeSignalEnvelope {
  const visitId = requiredText(envelope.visitId, 'envelope.visitId')
  const senderUserId = requiredText(envelope.senderUserId, 'envelope.senderUserId')
  const sessionId = requiredText(envelope.sessionId, 'envelope.sessionId')
  if (visitId !== authorization.visitId) throw new Error('signal visit does not match authorized visit')
  if (!Number.isSafeInteger(envelope.sequence) || envelope.sequence < 0) {
    throw new Error('signal sequence must be a non-negative safe integer')
  }
  const sentAtMs = optionalTime(envelope.sentAt, 'envelope.sentAt')!
  const nowMs = optionalTime(now, 'now')!
  if (nowMs - sentAtMs > 2 * 60_000) throw new Error('signal timestamp is stale')
  if (sentAtMs - nowMs > 30_000) throw new Error('signal timestamp is too far in the future')
  if (senderUserId !== authorization.userId) throw new Error('signal sender does not match authenticated participant')

  const encoded = Buffer.byteLength(JSON.stringify(envelope), 'utf8')
  if (encoded > maxBytes) throw new Error('signal exceeds maximum payload size')

  return {
    ...envelope,
    visitId,
    senderUserId,
    sessionId,
  }
}

/**
 * Refresh an already-joined Visit authorization from the canonical membership
 * source before accepting another secure signal. Join authorization is only a
 * snapshot: visit lifecycle/window changes must take effect without requiring
 * the WebSocket to reconnect.
 */
export function refreshVisitRealtimeAuthorization(
  principal: VisitRealtimePrincipal | null | undefined,
  current: Extract<VisitRealtimeAuthorization, { allowed: true }>,
  membership: VisitRealtimeMembership | null | undefined,
  now = new Date().toISOString(),
): VisitRealtimeAuthorization {
  if (!membership) return { allowed: false, code: 'visit_not_found' }
  return authorizeVisitRealtimeJoin(principal, current.visitId, membership, now)
}

export const VISIT_REALTIME_SECURITY_BOUNDARY =
  'Secure Visit signaling must resolve canonical server-side membership at join and re-authorize it before every signal. Cached join state, generic room names, client-asserted roles, owner/admin status, or authentication alone are never sufficient authorization.'


export interface VisitRealtimeReplayGuard {
  accept(signal: Pick<VisitRealtimeSignalEnvelope, 'visitId' | 'senderUserId' | 'sessionId' | 'sequence'>): boolean
}

/**
 * Tracks the highest accepted sequence for each authenticated Visit signaling
 * stream. Keep one guard for the lifetime of a WebSocket connection so a
 * visit-join retry cannot reset replay state. A new sessionId intentionally
 * starts a new sequence stream.
 */
export function createVisitRealtimeReplayGuard(maxStreams = 32): VisitRealtimeReplayGuard {
  if (!Number.isSafeInteger(maxStreams) || maxStreams < 1) {
    throw new Error('maxStreams must be a positive safe integer')
  }

  const highestByStream = new Map<string, number>()

  return {
    accept(signal) {
      if (!Number.isSafeInteger(signal.sequence) || signal.sequence < 0) return false

      const visitId = requiredText(signal.visitId, 'signal.visitId')
      const senderUserId = requiredText(signal.senderUserId, 'signal.senderUserId')
      const sessionId = requiredText(signal.sessionId, 'signal.sessionId')
      const streamKey = JSON.stringify([visitId, senderUserId, sessionId])
      const previous = highestByStream.get(streamKey)

      if (previous !== undefined) {
        if (signal.sequence <= previous) return false
        highestByStream.set(streamKey, signal.sequence)
        return true
      }

      // Fail closed rather than evicting an old stream: eviction would make an
      // earlier sequence replayable again. Reconnect to establish fresh state.
      if (highestByStream.size >= maxStreams) return false
      highestByStream.set(streamKey, signal.sequence)
      return true
    },
  }
}

/**
 * The secure Visit transport and legacy Consult relay share one WebSocket
 * server, so their room namespaces must never overlap.
 */
export function isReservedVisitRealtimeRoom(room: string): boolean {
  return room.trim().startsWith('visit:')
}
