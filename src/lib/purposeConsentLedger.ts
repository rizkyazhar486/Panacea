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
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a valid ISO timestamp`)
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertNonBlank(value: string, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must not be blank`)
}

const PURPOSES: readonly ConsentPurpose[] = ['personal-visualization', 'clinical-support', 'ai-context', 'research-export']

function validateDecision(decision: PurposeConsentDecision) {
  if (!decision || typeof decision !== 'object') throw new Error('invalid consent decision')
  assertNonBlank(decision.id, 'decision.id')
  assertNonBlank(decision.subjectId, 'decision.subjectId')
  if (!PURPOSES.includes(decision.purpose)) throw new Error('unknown consent purpose')
  if (decision.action !== 'grant' && decision.action !== 'revoke') throw new Error('unknown consent action')
  parseIso(decision.decidedAt, 'decision.decidedAt')
}

export function createPurposeConsentLedger(): PurposeConsentLedger {
  return { decisionsById: {}, decisionIdsByPurpose: {} }
}

export function appendPurposeConsentDecision(
  ledger: PurposeConsentLedger,
  decision: PurposeConsentDecision,
): PurposeConsentLedger {
  validateDecision(decision)

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
  if (!PURPOSES.includes(purpose)) throw new Error('unknown consent purpose')
  assertNonBlank(subjectId, 'subjectId')
  for (const record of [ledger.decisionsById, ledger.decisionIdsByPurpose]) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('invalid consent ledger')
  }
  const ids = ledger.decisionIdsByPurpose[purpose] ?? []
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length) throw new Error('invalid consent index')
  const indexed = new Set(ids)
  for (const id of ids) {
    const decision = ledger.decisionsById[id]
    validateDecision(decision)
    if (decision.id !== id || decision.purpose !== purpose) throw new Error('consent index does not match decision')
  }
  // Missing index entries must not silently erase a revocation from history.
  for (const [id, decision] of Object.entries(ledger.decisionsById)) {
    validateDecision(decision)
    if (decision.id !== id) throw new Error('consent identity does not match record')
    if (decision.purpose === purpose && !indexed.has(id)) throw new Error('incomplete consent index')
  }
  return ids.map((id) => ledger.decisionsById[id]).filter((decision) => decision.subjectId === subjectId)
}

function latestDecisionAt(
  decisions: readonly PurposeConsentDecision[],
  atMs: number,
) {
  let latest: PurposeConsentDecision | undefined
  for (const decision of decisions) {
    const time = Date.parse(decision.decidedAt)
    if (time > atMs) continue
    const latestTime = latest ? Date.parse(latest.decidedAt) : Number.NEGATIVE_INFINITY
    // Persisted index order is not authority. At an ambiguous equal time,
    // revocation wins rather than an arbitrary decision ID authorizing use.
    if (time > latestTime || (time === latestTime && decision.action === 'revoke')) latest = decision
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
  try {
    if (!isConsentActive(event.consent, purpose, at)) return false
    const capturedAt = parseIso(event.recordedAt, 'event.recordedAt')
    if (capturedAt > at) return false
    assertNonBlank(event.subjectId, 'event.subjectId')
    const decisions = decisionsForPurpose(ledger, purpose, event.subjectId)
    if (!decisions.length) return true

    const current = latestDecisionAt(decisions, at)
    if (!current || current.action !== 'grant') return false

    const captureDecision = latestDecisionAt(decisions, capturedAt)
    if (captureDecision?.action === 'revoke') return false
    return true
  } catch { return false }
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
  let decisions: PurposeConsentDecision[]
  try { decisions = decisionsForPurpose(ledger, purpose, subjectId) }
  catch { return { purpose, decisionCount: 0, latestDecision: null, ledgerAuthorized: false } }
  const latest = latestDecisionAt(decisions, atMs)
  return {
    purpose,
    decisionCount: decisions.length,
    latestDecision: latest ?? null,
    ledgerAuthorized: latest ? latest.action === 'grant' : null,
  }
}
