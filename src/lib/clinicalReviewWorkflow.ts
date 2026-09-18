import {
  requiresClinicianReview,
  validateLongitudinalEvent,
  type LongitudinalEvent,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'

export type ClinicalReviewOutcome = 'accepted' | 'rejected'

export interface ClinicalReviewDecision {
  id: string
  eventId: string
  subjectId: string
  outcome: ClinicalReviewOutcome
  reviewerId: string
  reviewedAt: string
  rationaleCode?: string
  note?: string
}

export interface ClinicalReviewLedger {
  decisionsById: Readonly<Record<string, ClinicalReviewDecision>>
  decisionIdByEventId: Readonly<Record<string, string>>
}

export interface ClinicalReviewQueueItem {
  eventId: string
  metric: string
  domain: LongitudinalEvent['domain']
  recordedAt: string
  receivedAt: string
  confidence: number
  provenanceSourceId: string
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

export function createClinicalReviewLedger(): ClinicalReviewLedger {
  return { decisionsById: {}, decisionIdByEventId: {} }
}

export function buildClinicalReviewQueue(
  state: LongitudinalPatientState,
  ledger: ClinicalReviewLedger = createClinicalReviewLedger(),
): ClinicalReviewQueueItem[] {
  return Object.values(state.eventsById)
    .filter((event) => requiresClinicianReview(event))
    .filter((event) => event.review.state === 'pending')
    .filter((event) => !ledger.decisionIdByEventId[event.id])
    .map((event) => ({
      eventId: event.id,
      metric: event.metric,
      domain: event.domain,
      recordedAt: event.recordedAt,
      receivedAt: event.provenance.receivedAt,
      confidence: event.confidence,
      provenanceSourceId: event.provenance.sourceId,
    }))
    .sort((left, right) => Date.parse(left.receivedAt) - Date.parse(right.receivedAt) || left.eventId.localeCompare(right.eventId))
}

/**
 * Append one immutable human review decision. The ledger never overwrites a
 * previous final decision for the same event; corrections must be represented by
 * a separately governed correction workflow rather than silently rewriting audit history.
 */
export function appendClinicalReviewDecision(
  state: LongitudinalPatientState,
  ledger: ClinicalReviewLedger,
  decision: ClinicalReviewDecision,
): ClinicalReviewLedger {
  assertNonBlank(decision.id, 'decision.id')
  assertNonBlank(decision.eventId, 'decision.eventId')
  assertNonBlank(decision.subjectId, 'decision.subjectId')
  assertNonBlank(decision.reviewerId, 'decision.reviewerId')
  const reviewedAt = parseIso(decision.reviewedAt, 'decision.reviewedAt')

  if (decision.subjectId.trim() !== state.subjectId) throw new Error('decision.subjectId does not match state.subjectId')
  const event = state.eventsById[decision.eventId]
  if (!event) throw new Error('decision.eventId does not exist in state')
  validateLongitudinalEvent(event)
  if (!requiresClinicianReview(event)) throw new Error('event domain does not require clinician review')
  if (event.review.state !== 'pending') throw new Error('only pending events can enter this review workflow')
  if (reviewedAt < Date.parse(event.provenance.receivedAt)) throw new Error('reviewedAt must not precede event receipt')

  const existingById = ledger.decisionsById[decision.id]
  if (existingById) {
    const same = JSON.stringify(existingById) === JSON.stringify(decision)
    if (same) return ledger
    throw new Error('decision.id already exists with different content')
  }
  if (ledger.decisionIdByEventId[decision.eventId]) throw new Error('event already has a final review decision')

  const normalized: ClinicalReviewDecision = {
    ...decision,
    id: decision.id.trim(),
    eventId: decision.eventId.trim(),
    subjectId: decision.subjectId.trim(),
    reviewerId: decision.reviewerId.trim(),
    rationaleCode: decision.rationaleCode?.trim() || undefined,
    note: decision.note?.trim() || undefined,
  }

  return {
    decisionsById: { ...ledger.decisionsById, [normalized.id]: normalized },
    decisionIdByEventId: { ...ledger.decisionIdByEventId, [normalized.eventId]: normalized.id },
  }
}

/**
 * Overlay immutable review decisions onto a derived state snapshot used by
 * Clinical / AI-EMR projections. Original events and the review ledger remain
 * separately auditable; this function does not sign, order, prescribe, or commit care.
 */
export function materializeReviewedState(
  state: LongitudinalPatientState,
  ledger: ClinicalReviewLedger,
): LongitudinalPatientState {
  const eventsById: Record<string, LongitudinalEvent> = { ...state.eventsById }
  let applied = 0
  let latestReviewAt = Date.parse(state.updatedAt)

  for (const [eventId, decisionId] of Object.entries(ledger.decisionIdByEventId)) {
    const event = state.eventsById[eventId]
    const decision = ledger.decisionsById[decisionId]
    if (!event || !decision) throw new Error('review ledger contains a dangling event/decision reference')
    if (decision.subjectId !== state.subjectId) throw new Error('review ledger subject mismatch')
    if (event.review.state !== 'pending') continue

    eventsById[eventId] = {
      ...event,
      review: {
        state: decision.outcome,
        reviewerId: decision.reviewerId,
        reviewedAt: decision.reviewedAt,
        note: decision.note,
      },
    }
    applied += 1
    latestReviewAt = Math.max(latestReviewAt, parseIso(decision.reviewedAt, 'decision.reviewedAt'))
  }

  return {
    ...state,
    revision: state.revision + applied,
    updatedAt: new Date(latestReviewAt).toISOString(),
    eventsById,
  }
}
