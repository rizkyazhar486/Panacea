/**
 * Canonical synchronized telemetry envelope for Panacea Sport/Environment OS.
 */

export type TelemetryTruthClass = 'measured' | 'estimated' | 'derived' | 'relayed'
export type TimestampQuality = 'hardware-clock' | 'gnss-synced' | 'server-received' | 'manual' | 'unknown'

export interface PerformanceTelemetryEnvelope {
  id: string
  streamId: string
  sequence: number
  metricId: string
  value: number
  unit: string
  capturedAt: string
  receivedAt: string
  truthClass: TelemetryTruthClass
  sourceType:
    | 'wearable'
    | 'sport-equipment'
    | 'vehicle'
    | 'environment'
    | 'camera-radar'
    | 'event-feed'
    | 'manual'
  sourceId: string
  deviceModel?: string
  firmware?: string
  confidence: number
  uncertainty?: number
  timestampQuality: TimestampQuality
  syncGroup?: string
  position?: {
    lat: number
    lon: number
    accuracyM?: number
  }
}

export interface TelemetryValidation {
  valid: boolean
  errors: readonly string[]
  ageMs: number | null
  transportDelayMs: number | null
}

export function validatePerformanceTelemetry(
  item: PerformanceTelemetryEnvelope,
  nowMs = Date.now(),
): TelemetryValidation {
  const errors: string[] = []
  const capturedMs = Date.parse(item.capturedAt)
  const receivedMs = Date.parse(item.receivedAt)

  if (!item.id.trim()) errors.push('id')
  if (!item.streamId.trim()) errors.push('streamId')
  if (!item.metricId.trim()) errors.push('metricId')
  if (!item.unit.trim()) errors.push('unit')
  if (!item.sourceId.trim()) errors.push('sourceId')
  if (!Number.isInteger(item.sequence) || item.sequence < 0) errors.push('sequence')
  if (!Number.isFinite(item.value)) errors.push('value')
  if (!Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1) errors.push('confidence')
  if (item.uncertainty !== undefined && (!Number.isFinite(item.uncertainty) || item.uncertainty < 0)) errors.push('uncertainty')
  if (!Number.isFinite(capturedMs)) errors.push('capturedAt')
  if (!Number.isFinite(receivedMs)) errors.push('receivedAt')
  if (Number.isFinite(capturedMs) && Number.isFinite(receivedMs) && receivedMs < capturedMs) errors.push('clock-order')

  if (item.position) {
    const { lat, lon, accuracyM } = item.position
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.push('position.lat')
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) errors.push('position.lon')
    if (accuracyM !== undefined && (!Number.isFinite(accuracyM) || accuracyM < 0)) errors.push('position.accuracyM')
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    ageMs: Number.isFinite(capturedMs) ? Math.max(0, nowMs - capturedMs) : null,
    transportDelayMs: Number.isFinite(capturedMs) && Number.isFinite(receivedMs)
      ? Math.max(0, receivedMs - capturedMs)
      : null,
  })
}

export interface AlignmentResult {
  aligned: boolean
  reason: string
  maxSkewMs: number | null
}

/**
 * Overlay is allowed only when all items:
 * - validate,
 * - share a non-empty syncGroup,
 * - are within maxAllowedSkewMs.
 */
export function canSynchronizeTelemetry(
  items: readonly PerformanceTelemetryEnvelope[],
  maxAllowedSkewMs = 1000,
): AlignmentResult {
  if (!items.length) return { aligned: false, reason: 'no-data', maxSkewMs: null }
  if (!Number.isFinite(maxAllowedSkewMs) || maxAllowedSkewMs < 0) {
    return { aligned: false, reason: 'invalid-skew-limit', maxSkewMs: null }
  }

  const validated = items.map((item) => ({ item, validation: validatePerformanceTelemetry(item) }))
  if (validated.some(({ validation }) => !validation.valid)) {
    return { aligned: false, reason: 'invalid-telemetry', maxSkewMs: null }
  }

  const groups = new Set(items.map((item) => item.syncGroup).filter(Boolean))
  if (groups.size !== 1 || items.some((item) => !item.syncGroup)) {
    return { aligned: false, reason: 'sync-group-mismatch', maxSkewMs: null }
  }

  const times = items.map((item) => Date.parse(item.capturedAt))
  const maxSkewMs = Math.max(...times) - Math.min(...times)

  return {
    aligned: maxSkewMs <= maxAllowedSkewMs,
    reason: maxSkewMs <= maxAllowedSkewMs ? 'aligned' : 'timestamp-skew',
    maxSkewMs,
  }
}

export function sortAndDedupeTelemetry(
  items: readonly PerformanceTelemetryEnvelope[],
): PerformanceTelemetryEnvelope[] {
  const byKey = new Map<string, PerformanceTelemetryEnvelope>()
  for (const item of items) {
    if (!validatePerformanceTelemetry(item).valid) continue
    const key = `${item.streamId}:${item.sequence}`
    const existing = byKey.get(key)
    if (!existing || Date.parse(item.receivedAt) > Date.parse(existing.receivedAt)) {
      byKey.set(key, item)
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const time = Date.parse(a.capturedAt) - Date.parse(b.capturedAt)
    return time !== 0 ? time : a.sequence - b.sequence
  })
}

export const PERFORMANCE_TELEMETRY_POLICY = Object.freeze({
  provenanceRequired: true as const,
  unitsRequired: true as const,
  measuredEstimatedDerivedRelayedMustRemainDistinct: true as const,
  sequenceRequired: true as const,
  timestampQualityRequired: true as const,
  synchronizedOverlayMustPassClockGate: true as const,
  incompatibleUnitsMustNotBeMerged: true as const,
})
