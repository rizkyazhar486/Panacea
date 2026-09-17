import type { LongitudinalPatientState } from './panaceaLongitudinalState.ts'

export interface SourceFreshnessPolicy {
  sourcePrefix: string
  label: string
  freshnessHalfLifeMinutes: number
  agingAfterMinutes: number
  staleAfterMinutes: number
  expectedMetrics?: readonly string[]
}

export type SourceFreshnessStatus = 'fresh' | 'aging' | 'stale' | 'unseen'

export interface SourceFreshnessAudit {
  sourcePrefix: string
  label: string
  status: SourceFreshnessStatus
  latestRecordedAt: string | null
  latestReceivedAt: string | null
  ageMinutes: number | null
  latestTransportLagSeconds: number | null
  freshness: number
  observedMetrics: readonly string[]
  missingExpectedMetrics: readonly string[]
  eventCount: number
  healthInterpretationAllowed: false
}

function assertPolicy(policy: SourceFreshnessPolicy) {
  if (!policy.sourcePrefix.trim()) throw new Error('sourcePrefix must not be blank')
  if (!policy.label.trim()) throw new Error('label must not be blank')
  if (!Number.isFinite(policy.freshnessHalfLifeMinutes) || policy.freshnessHalfLifeMinutes <= 0) throw new Error('freshnessHalfLifeMinutes must be > 0')
  if (!Number.isFinite(policy.agingAfterMinutes) || policy.agingAfterMinutes < 0) throw new Error('agingAfterMinutes must be >= 0')
  if (!Number.isFinite(policy.staleAfterMinutes) || policy.staleAfterMinutes <= policy.agingAfterMinutes) throw new Error('staleAfterMinutes must be > agingAfterMinutes')
}

/**
 * Integration freshness is operational only:
 * `freshness = 2^(-ageMinutes / halfLifeMinutes)`.
 * It describes recency of received source data, not patient health, signal
 * validity, clinical risk, or whether a wearable is medically accurate.
 */
export function auditIntegrationFreshness(
  state: LongitudinalPatientState,
  policies: readonly SourceFreshnessPolicy[],
  at = new Date().toISOString(),
): SourceFreshnessAudit[] {
  const atMs = Date.parse(at)
  if (!Number.isFinite(atMs)) throw new Error('at must be a valid ISO timestamp')
  const seenPrefixes = new Set<string>()

  return policies.map((policy) => {
    assertPolicy(policy)
    const prefix = policy.sourcePrefix.trim()
    if (seenPrefixes.has(prefix)) throw new Error(`duplicate sourcePrefix policy: ${prefix}`)
    seenPrefixes.add(prefix)

    const events = Object.values(state.eventsById)
      .filter((event) => event.provenance.sourceId.startsWith(prefix))
      .sort((left, right) => Date.parse(left.provenance.receivedAt) - Date.parse(right.provenance.receivedAt) || left.id.localeCompare(right.id))
    const latest = events[events.length - 1]
    const observedMetrics = [...new Set(events.map((event) => event.metric))].sort()
    const expected = [...new Set(policy.expectedMetrics ?? [])]
    const missingExpectedMetrics = expected.filter((metric) => !observedMetrics.includes(metric))

    if (!latest) {
      return {
        sourcePrefix: prefix,
        label: policy.label,
        status: 'unseen' as const,
        latestRecordedAt: null,
        latestReceivedAt: null,
        ageMinutes: null,
        latestTransportLagSeconds: null,
        freshness: 0,
        observedMetrics,
        missingExpectedMetrics,
        eventCount: 0,
        healthInterpretationAllowed: false as const,
      }
    }

    const receivedAtMs = Date.parse(latest.provenance.receivedAt)
    const recordedAtMs = Date.parse(latest.recordedAt)
    const ageMinutes = Math.max(0, (atMs - receivedAtMs) / 60_000)
    const latestTransportLagSeconds = Math.max(0, (receivedAtMs - recordedAtMs) / 1000)
    const freshness = 2 ** (-ageMinutes / policy.freshnessHalfLifeMinutes)
    const status: SourceFreshnessStatus = ageMinutes >= policy.staleAfterMinutes
      ? 'stale'
      : ageMinutes >= policy.agingAfterMinutes
        ? 'aging'
        : 'fresh'

    return {
      sourcePrefix: prefix,
      label: policy.label,
      status,
      latestRecordedAt: latest.recordedAt,
      latestReceivedAt: latest.provenance.receivedAt,
      ageMinutes,
      latestTransportLagSeconds,
      freshness,
      observedMetrics,
      missingExpectedMetrics,
      eventCount: events.length,
      healthInterpretationAllowed: false as const,
    }
  })
}
