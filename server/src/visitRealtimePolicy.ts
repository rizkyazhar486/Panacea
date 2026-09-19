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

export const VISIT_REALTIME_SECURITY_BOUNDARY =
  'Do not wire a production Visit WebSocket endpoint until a canonical server-side visit membership registry can resolve visitId to the exact patient and clinician. Generic room names, client-asserted roles, owner/admin status, or authentication alone are not authorization.'
