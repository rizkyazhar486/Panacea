import type { LongitudinalEvent } from './panaceaLongitudinalState.ts'
import type { WearableProvider } from './wearableSignalAdapters.ts'

export interface WearableReconciliationPolicy {
  providerPriority: readonly WearableProvider[]
  conflictWindowSeconds: number
}

export interface ReconciledMeasurementCluster {
  metric: string
  clusterStartAt: string
  clusterEndAt: string
  selectedEventId: string
  candidateEventIds: readonly string[]
  candidateSourceIds: readonly string[]
  conflictingValues: boolean
  resolutionReason: 'provider-priority' | 'confidence' | 'recency' | 'single-candidate'
  hiddenAveragingPerformed: false
}

function providerFromSourceId(sourceId: string): WearableProvider | null {
  const provider = sourceId.split(':', 1)[0] as WearableProvider
  return ['apple-health', 'garmin', 'oura', 'whoop', 'strava', 'health-connect'].includes(provider) ? provider : null
}

function assertPolicy(policy: WearableReconciliationPolicy) {
  if (!Number.isFinite(policy.conflictWindowSeconds) || policy.conflictWindowSeconds < 0) {
    throw new Error('conflictWindowSeconds must be >= 0')
  }
  if (new Set(policy.providerPriority).size !== policy.providerPriority.length) {
    throw new Error('providerPriority must not contain duplicates')
  }
}

function valueFingerprint(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toPrecision(12)
  return JSON.stringify(value)
}

function chooseCandidate(
  candidates: readonly LongitudinalEvent[],
  policy: WearableReconciliationPolicy,
) {
  if (candidates.length === 1) return { event: candidates[0], reason: 'single-candidate' as const }
  const priority = new Map(policy.providerPriority.map((provider, index) => [provider, index]))
  const ranked = [...candidates].sort((left, right) => {
    const leftProvider = providerFromSourceId(left.provenance.sourceId)
    const rightProvider = providerFromSourceId(right.provenance.sourceId)
    const leftPriority = leftProvider ? (priority.get(leftProvider) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
    const rightPriority = rightProvider ? (priority.get(rightProvider) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
    if (leftPriority !== rightPriority) return leftPriority - rightPriority
    if (left.confidence !== right.confidence) return right.confidence - left.confidence
    return Date.parse(right.recordedAt) - Date.parse(left.recordedAt) || left.id.localeCompare(right.id)
  })

  const selected = ranked[0]
  const selectedProvider = providerFromSourceId(selected.provenance.sourceId)
  const bestPriority = selectedProvider ? (priority.get(selectedProvider) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER
  const sameProviderRank = ranked.filter((event) => {
    const provider = providerFromSourceId(event.provenance.sourceId)
    return (provider ? (priority.get(provider) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER) === bestPriority
  })
  if (sameProviderRank.length !== candidates.length) return { event: selected, reason: 'provider-priority' as const }
  if (sameProviderRank.some((event) => event.confidence !== selected.confidence)) return { event: selected, reason: 'confidence' as const }
  return { event: selected, reason: 'recency' as const }
}

/**
 * Reconcile near-simultaneous wearable measurements for display selection.
 * No values are averaged or deleted. The selected event is a deterministic view
 * preference only; every candidate remains available with its provenance.
 */
export function reconcileWearableMeasurements(
  events: readonly LongitudinalEvent[],
  policy: WearableReconciliationPolicy,
): ReconciledMeasurementCluster[] {
  assertPolicy(policy)
  const wearable = events
    .filter((event) => event.provenance.sourceKind === 'wearable')
    .sort((left, right) => left.metric.localeCompare(right.metric) || Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || left.id.localeCompare(right.id))

  const clusters: ReconciledMeasurementCluster[] = []
  let bucket: LongitudinalEvent[] = []

  const flush = () => {
    if (!bucket.length) return
    const { event: selected, reason } = chooseCandidate(bucket, policy)
    const fingerprints = new Set(bucket.map((event) => `${valueFingerprint(event.value)}|${event.unit ?? ''}`))
    clusters.push({
      metric: selected.metric,
      clusterStartAt: bucket[0].recordedAt,
      clusterEndAt: bucket[bucket.length - 1].recordedAt,
      selectedEventId: selected.id,
      candidateEventIds: bucket.map((event) => event.id),
      candidateSourceIds: [...new Set(bucket.map((event) => event.provenance.sourceId))],
      conflictingValues: fingerprints.size > 1,
      resolutionReason: reason,
      hiddenAveragingPerformed: false,
    })
    bucket = []
  }

  for (const event of wearable) {
    if (!bucket.length) {
      bucket = [event]
      continue
    }
    const first = bucket[0]
    const sameMetric = event.metric === first.metric
    const withinWindow = Math.abs(Date.parse(event.recordedAt) - Date.parse(first.recordedAt)) <= policy.conflictWindowSeconds * 1000
    if (sameMetric && withinWindow) bucket.push(event)
    else {
      flush()
      bucket = [event]
    }
  }
  flush()
  return clusters
}
