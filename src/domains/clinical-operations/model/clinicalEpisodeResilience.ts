export type EpisodeConnectivity = 'online' | 'degraded' | 'offline'
export type EpisodeTransportKind =
  | 'observation'
  | 'lab-order'
  | 'specimen-handoff'
  | 'diagnostic-result'
  | 'care-plan'
  | 'claim-evidence'
export type EpisodeDeliveryState = 'pending' | 'acknowledged' | 'rejected'
export type EpisodeResilienceState = 'ready' | 'degraded' | 'blocked'

export interface ClinicalEpisodeTransportEvent {
  eventId: string
  patientId: string
  episodeId: string
  kind: EpisodeTransportKind
  authoredAt: string
  sourceId: string
  sequence: number
  payloadDigest: string
  delivery: EpisodeDeliveryState
  durableLocalCopy: boolean
  encryptedAtRest: boolean
  retryCount: number
}

export interface ClinicalEpisodeResilienceInput {
  patientId: string
  episodeId: string
  connectivity: EpisodeConnectivity
  secureLocalStorageAvailable: boolean
  events: readonly ClinicalEpisodeTransportEvent[]
  evaluatedAt: string
  maxRetryCount?: number
}

export interface ClinicalEpisodeResilienceResult {
  state: EpisodeResilienceState
  safeToContinueOffline: boolean
  pendingCount: number
  acknowledgedCount: number
  idempotentReplayIds: string[]
  integrityConflictIds: string[]
  sequenceConflictIds: string[]
  foreignContextIds: string[]
  invalidTimestampIds: string[]
  unprotectedPendingIds: string[]
  retryExhaustedIds: string[]
  rejectedIds: string[]
  nextOperationalAction: string
  warnings: string[]
}

function validIsoAtOrBefore(value: string, evaluatedAtMs: number): boolean {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && parsed <= evaluatedAtMs
}

function validIdentity(value: string): boolean {
  return value.trim().length > 0
}

function sameReplay(a: ClinicalEpisodeTransportEvent, b: ClinicalEpisodeTransportEvent): boolean {
  return a.patientId === b.patientId
    && a.episodeId === b.episodeId
    && a.kind === b.kind
    && a.authoredAt === b.authoredAt
    && a.sourceId === b.sourceId
    && a.sequence === b.sequence
    && a.payloadDigest === b.payloadDigest
}

/**
 * Pure resilience gate for one longitudinal care episode.
 *
 * This evaluates transport/integrity continuity only. It does not infer
 * clinical correctness, determine medical urgency, or authorize treatment.
 *
 * Survival rule:
 * - offline continuation is allowed only when every pending event is durably
 *   persisted and encrypted at rest;
 * - exact duplicate replays are treated as idempotent transport retries;
 * - conflicting duplicates, sequence collisions, foreign patient/episode
 *   context, invalid/future timestamps, exhausted retries and rejected
 *   transport fail closed.
 */
export function evaluateClinicalEpisodeResilience(
  input: ClinicalEpisodeResilienceInput,
): ClinicalEpisodeResilienceResult {
  const evaluatedAtMs = Date.parse(input.evaluatedAt)
  if (!Number.isFinite(evaluatedAtMs)) throw new Error('evaluatedAt must be a valid timestamp')
  if (!validIdentity(input.patientId)) throw new Error('patientId is required')
  if (!validIdentity(input.episodeId)) throw new Error('episodeId is required')
  const maxRetryCount = input.maxRetryCount ?? 8
  if (!Number.isInteger(maxRetryCount) || maxRetryCount < 0) {
    throw new Error('maxRetryCount must be a non-negative integer')
  }

  const idempotentReplayIds: string[] = []
  const integrityConflictIds = new Set<string>()
  const sequenceConflictIds = new Set<string>()
  const foreignContextIds: string[] = []
  const invalidTimestampIds: string[] = []
  const unprotectedPendingIds: string[] = []
  const retryExhaustedIds: string[] = []
  const rejectedIds: string[] = []

  const canonicalById = new Map<string, ClinicalEpisodeTransportEvent>()
  const canonicalBySequence = new Map<number, ClinicalEpisodeTransportEvent>()

  for (const event of input.events) {
    const eventId = event.eventId.trim()
    if (!eventId || !validIdentity(event.sourceId) || !validIdentity(event.payloadDigest)) {
      integrityConflictIds.add(event.eventId || '(missing-event-id)')
      continue
    }
    if (event.patientId !== input.patientId || event.episodeId !== input.episodeId) {
      foreignContextIds.push(event.eventId)
      continue
    }
    if (!Number.isInteger(event.sequence) || event.sequence < 1) {
      sequenceConflictIds.add(event.eventId)
      continue
    }
    if (!validIsoAtOrBefore(event.authoredAt, evaluatedAtMs)) {
      invalidTimestampIds.push(event.eventId)
      continue
    }
    if (!Number.isInteger(event.retryCount) || event.retryCount < 0) {
      retryExhaustedIds.push(event.eventId)
      continue
    }

    const sameId = canonicalById.get(event.eventId)
    if (sameId) {
      if (sameReplay(sameId, event)) idempotentReplayIds.push(event.eventId)
      else integrityConflictIds.add(event.eventId)
      continue
    }

    const sameSequence = canonicalBySequence.get(event.sequence)
    if (sameSequence && sameSequence.eventId !== event.eventId) {
      sequenceConflictIds.add(sameSequence.eventId)
      sequenceConflictIds.add(event.eventId)
      continue
    }

    canonicalById.set(event.eventId, event)
    canonicalBySequence.set(event.sequence, event)

    if (event.delivery === 'pending') {
      if (!event.durableLocalCopy || !event.encryptedAtRest) unprotectedPendingIds.push(event.eventId)
      if (event.retryCount >= maxRetryCount) retryExhaustedIds.push(event.eventId)
    }
    if (event.delivery === 'rejected') rejectedIds.push(event.eventId)
  }

  const canonical = [...canonicalById.values()]
  const pendingCount = canonical.filter((event) => event.delivery === 'pending').length
  const acknowledgedCount = canonical.filter((event) => event.delivery === 'acknowledged').length

  const hardFailures =
    integrityConflictIds.size
    + sequenceConflictIds.size
    + foreignContextIds.length
    + invalidTimestampIds.length
    + unprotectedPendingIds.length
    + retryExhaustedIds.length
    + rejectedIds.length

  const safeToContinueOffline =
    input.secureLocalStorageAvailable
    && unprotectedPendingIds.length === 0
    && hardFailures === 0

  const warnings: string[] = []
  if (input.connectivity !== 'online') warnings.push(`Connectivity is ${input.connectivity}`)
  if (pendingCount > 0) warnings.push(`${pendingCount} event(s) await acknowledgement`)
  if (idempotentReplayIds.length > 0) warnings.push('Idempotent replay(s) recognized without creating new episode truth')

  if (hardFailures > 0) {
    return {
      state: 'blocked',
      safeToContinueOffline: false,
      pendingCount,
      acknowledgedCount,
      idempotentReplayIds,
      integrityConflictIds: [...integrityConflictIds],
      sequenceConflictIds: [...sequenceConflictIds],
      foreignContextIds,
      invalidTimestampIds,
      unprotectedPendingIds,
      retryExhaustedIds,
      rejectedIds,
      nextOperationalAction: 'Resolve episode transport integrity, identity, protection, rejection, or retry failure before reconciliation',
      warnings,
    }
  }

  if (input.connectivity === 'offline') {
    if (!input.secureLocalStorageAvailable || (pendingCount > 0 && !safeToContinueOffline)) {
      return {
        state: 'blocked',
        safeToContinueOffline: false,
        pendingCount,
        acknowledgedCount,
        idempotentReplayIds,
        integrityConflictIds: [],
        sequenceConflictIds: [],
        foreignContextIds,
        invalidTimestampIds,
        unprotectedPendingIds,
        retryExhaustedIds,
        rejectedIds,
        nextOperationalAction: 'Do not persist new episode data until secure durable offline storage is available',
        warnings,
      }
    }
    return {
      state: 'degraded',
      safeToContinueOffline: true,
      pendingCount,
      acknowledgedCount,
      idempotentReplayIds,
      integrityConflictIds: [],
      sequenceConflictIds: [],
      foreignContextIds,
      invalidTimestampIds,
      unprotectedPendingIds,
      retryExhaustedIds,
      rejectedIds,
      nextOperationalAction: pendingCount > 0
        ? 'Continue bounded offline capture and drain the encrypted queue when connectivity returns'
        : 'Continue offline with no unsent episode events',
      warnings,
    }
  }

  if (pendingCount > 0 || input.connectivity === 'degraded') {
    return {
      state: 'degraded',
      safeToContinueOffline,
      pendingCount,
      acknowledgedCount,
      idempotentReplayIds,
      integrityConflictIds: [],
      sequenceConflictIds: [],
      foreignContextIds,
      invalidTimestampIds,
      unprotectedPendingIds,
      retryExhaustedIds,
      rejectedIds,
      nextOperationalAction: 'Drain pending episode events and verify acknowledgements against the same patient episode',
      warnings,
    }
  }

  return {
    state: 'ready',
    safeToContinueOffline,
    pendingCount,
    acknowledgedCount,
    idempotentReplayIds,
    integrityConflictIds: [],
    sequenceConflictIds: [],
    foreignContextIds,
    invalidTimestampIds,
    unprotectedPendingIds,
    retryExhaustedIds,
    rejectedIds,
    nextOperationalAction: 'Episode transport is reconciled',
    warnings,
  }
}
