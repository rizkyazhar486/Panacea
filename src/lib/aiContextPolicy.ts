import {
  buildContextPacket,
  type LongitudinalDomain,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'

export interface AiContextPolicy {
  maxSignals: number
  maxAgeDays: number
  freshnessHalfLifeDays: number
  includeDomains?: readonly LongitudinalDomain[]
  includeRawClinicalNotes?: boolean
}

export interface MinimizedAiSignal {
  metric: string
  domain: LongitudinalDomain
  value: unknown
  unit?: string
  recordedAt: string
  confidence: number
  sourceKind: string
  sourceId: string
  reviewState: string
  ageDays: number
  freshness: number
  packingScore: number
  rawValueRedacted: boolean
}

export interface MinimizedAiContext {
  subjectId: string
  generatedAt: string
  stateRevision: number
  signals: readonly MinimizedAiSignal[]
  omitted: {
    expiredByAge: number
    outsideDomainPolicy: number
    capacity: number
    rawClinicalNotesRedacted: number
  }
  governance: {
    minimumNecessaryContext: true
    packingScoreIsNotClinicalImportance: true
    autonomousClinicalCommitAllowed: false
  }
}

const DAY_MS = 86_400_000

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertPolicy(policy: AiContextPolicy) {
  if (!Number.isInteger(policy.maxSignals) || policy.maxSignals < 1) throw new Error('policy.maxSignals must be a positive integer')
  if (!Number.isFinite(policy.maxAgeDays) || policy.maxAgeDays <= 0) throw new Error('policy.maxAgeDays must be > 0')
  if (!Number.isFinite(policy.freshnessHalfLifeDays) || policy.freshnessHalfLifeDays <= 0) throw new Error('policy.freshnessHalfLifeDays must be > 0')
}

/**
 * Freshness is an exponential recency weight with the caller's half-life:
 * `freshness = 2^(-ageDays / halfLifeDays)`.
 * Packing score is `0.70 × freshness + 0.30 × source confidence`.
 * Both exist only to pack limited conversational context; neither represents
 * clinical importance, urgency, evidence strength, probability, or severity.
 */
export function minimizeAiContext(
  state: LongitudinalPatientState,
  policy: AiContextPolicy,
  generatedAt = new Date().toISOString(),
): MinimizedAiContext {
  assertPolicy(policy)
  const generatedAtMs = parseIso(generatedAt, 'generatedAt')
  const full = buildContextPacket(state, 'ai-chatbot', generatedAt)
  const allowedDomains = policy.includeDomains ? new Set(policy.includeDomains) : null

  let expiredByAge = 0
  let outsideDomainPolicy = 0
  let rawClinicalNotesRedacted = 0

  const eligible: MinimizedAiSignal[] = []
  for (const signal of full.signals) {
    if (allowedDomains && !allowedDomains.has(signal.domain)) {
      outsideDomainPolicy += 1
      continue
    }

    const recordedAtMs = parseIso(signal.recordedAt, 'signal.recordedAt')
    const ageDays = Math.max(0, (generatedAtMs - recordedAtMs) / DAY_MS)
    if (ageDays > policy.maxAgeDays) {
      expiredByAge += 1
      continue
    }

    const freshness = 2 ** (-ageDays / policy.freshnessHalfLifeDays)
    const packingScore = 0.7 * freshness + 0.3 * signal.confidence
    const redactClinicalNote = signal.domain === 'clinical-note' && !policy.includeRawClinicalNotes
    if (redactClinicalNote) rawClinicalNotesRedacted += 1

    eligible.push({
      metric: signal.metric,
      domain: signal.domain,
      value: redactClinicalNote ? '[clinical note content omitted; use reviewed metadata/context only]' : signal.value,
      unit: signal.unit,
      recordedAt: signal.recordedAt,
      confidence: signal.confidence,
      sourceKind: signal.provenance.sourceKind,
      sourceId: signal.provenance.sourceId,
      reviewState: signal.reviewState,
      ageDays,
      freshness,
      packingScore,
      rawValueRedacted: redactClinicalNote,
    })
  }

  eligible.sort((left, right) => right.packingScore - left.packingScore || Date.parse(right.recordedAt) - Date.parse(left.recordedAt) || left.metric.localeCompare(right.metric))
  const signals = eligible.slice(0, policy.maxSignals)

  return {
    subjectId: full.subjectId,
    generatedAt,
    stateRevision: full.stateRevision,
    signals,
    omitted: {
      expiredByAge,
      outsideDomainPolicy,
      capacity: Math.max(0, eligible.length - signals.length),
      rawClinicalNotesRedacted,
    },
    governance: {
      minimumNecessaryContext: true,
      packingScoreIsNotClinicalImportance: true,
      autonomousClinicalCommitAllowed: false,
    },
  }
}
