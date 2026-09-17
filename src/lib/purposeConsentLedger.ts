import {
  isConsentActive,
  type ConsentPurpose,
  type LongitudinalEvent,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'

export type ConsentDecisionAction = 'grant' | 'revoke'

export interface PurposeConsentDecision {
  id: string
  subjectId: string
  purpose: ConsentPurpose
  action: ConsentDecisionAction
  decidedAt: string
  policyVersion?: string
  source?: 'user' | 'clinician-assisted' | 'system-migration'
}

export interface PurposeConsentLedger {
  decisionsById: Readonly<Record<string, PurposeConsentDecision>>
  decisionIdsByPurpose: Readonly<Partial<Record<ConsentPurpose, readonly string[]>>>
}

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

export function createPurposeConsentLedger(): PurposeConsentLedger {
  return { decisionsById: {}, decisionIdsByPurpose: {} }
}

export function appendPurposeConsentDecision(
  ledger: PurposeConsentLedger,
  decision: PurposeConsentDecision,
): PurposeConsentLedger {
  assertNonBlank(decision.id, 'decision.id')
  assertNonBlank(decision.subjectId, 'decision.subjectId')
  parseIso(decision.decidedAt, 'decision.decidedAt')

  const normalized: PurposeConsentDecision = {
    ...decision,
    id: decision.id.trim(),
    subjectId: decision.subjectId.trim(),
    policyVersion: decision.policyVersion?.trim() || undefined,
  }
  const existing = ledger.decisionsById[normalized.id]
  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(normalized)) return ledger
    throw new Error('consent decision id already exists with different content')
  }

  const ids = [...(ledger.decisionIdsByPurpose[normalized.purpose] ?? []), normalized.id]
  const decisionsById = { ...ledger.decisionsById, [normalized.id]: normalized }
  ids.sort((leftId, rightId) => {
    const left = decisionsById[leftId]
    const right = decisionsById[rightId]
    return Date.parse(left.decidedAt) - Date.parse(right.decidedAt) || left.id.localeCompare(right.id)
  })

  return {
    decisionsById,
    decisionIdsByPurpose: { ...ledger.decisionIdsByPurpose, [normalized.purpose]: ids },
  }
}

function decisionsForPurpose(
  ledger: PurposeConsentLedger,
  purpose: ConsentPurpose,
  subjectId: string,
) {
  return (ledger.decisionIdsByPurpose[purpose] ?? [])
    .map((id) => ledger.decisionsById[id])
    .filter((decision): decision is PurposeConsentDecision => Boolean(decision) && decision.subjectId === subjectId)
}

function latestDecisionAt(
  decisions: readonly PurposeConsentDecision[],
  atMs: number,
) {
  let latest: PurposeConsentDecision | undefined
  for (const decision of decisions) {
    if (Date.parse(decision.decidedAt) <= atMs) latest = decision
    else break
  }
  return latest
}

/**
 * Current authorization requires both the event's capture-time consent envelope
 * and the purpose-specific ledger to permit use. If the ledger has decisions,
 * the latest decision at use time must be a grant, and the data point must not
 * have been captured during a ledger-revoked interval.
 *
 * This is a software governance contract, not a statement of legal sufficiency.
 */
export function isEventPurposeAuthorized(
  event: LongitudinalEvent,
  ledger: PurposeConsentLedger,
  purpose: ConsentPurpose,
  at = Date.now(),
) {
  if (!isConsentActive(event.consent, purpose, at)) return false
  const decisions = decisionsForPurpose(ledger, purpose, event.subjectId)
  if (!decisions.length) return true

  const current = latestDecisionAt(decisions, at)
  if (!current || current.action !== 'grant') return false

  const capturedAt = Date.parse(event.recordedAt)
  const captureDecision = latestDecisionAt(decisions, capturedAt)
  if (captureDecision?.action === 'revoke') return false
  return true
}

export function filterStateByPurposeConsent(
  state: LongitudinalPatientState,
  ledger: PurposeConsentLedger,
  purpose: ConsentPurpose,
  at = new Date().toISOString(),
): LongitudinalPatientState {
  const atMs = parseIso(at, 'at')
  const eventsById: Record<string, LongitudinalEvent> = {}
  const metricEventIds: Record<string, readonly string[]> = {}

  for (const [metric, ids] of Object.entries(state.metricEventIds)) {
    const kept = ids.filter((id) => {
      const event = state.eventsById[id]
      if (!event) return false
      if (event.subjectId !== state.subjectId) throw new Error('state contains an event for another subject')
      if (!isEventPurposeAuthorized(event, ledger, purpose, atMs)) return false
      eventsById[id] = event
      return true
    })
    if (kept.length) metricEventIds[metric] = kept
  }

  return {
    ...state,
    eventsById,
    metricEventIds,
  }
}

export function purposeConsentStatus(
  ledger: PurposeConsentLedger,
  subjectId: string,
  purpose: ConsentPurpose,
  at = new Date().toISOString(),
) {
  const atMs = parseIso(at, 'at')
  const decisions = decisionsForPurpose(ledger, purpose, subjectId)
  const latest = latestDecisionAt(decisions, atMs)
  return {
    purpose,
    decisionCount: decisions.length,
    latestDecision: latest ?? null,
    ledgerAuthorized: latest ? latest.action === 'grant' : null,
  }
}
