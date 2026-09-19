import {
  metricSnapshot,
  projectStateToSurface,
  type LongitudinalEvent,
  type LongitudinalMetricSnapshot,
  type LongitudinalPatientState,
  type PanaceaSurface,
} from './panaceaLongitudinalState.ts'

export type LongitudinalReplayClock = 'known' | 'effective'

export interface LongitudinalReplayOptions {
  /**
   * known: reconstruct what Panaceamed could actually have known at the cutoff
   * (recordedAt <= cutoff AND provenance.receivedAt <= cutoff).
   *
   * effective: reconstruct the biological/measurement timeline by recordedAt,
   * even when a record was backfilled into Panaceamed later.
   */
  clock?: LongitudinalReplayClock
  surface?: PanaceaSurface
}

export interface LongitudinalReplayFrame {
  subjectId: string
  at: string
  clock: LongitudinalReplayClock
  sourceRevision: number
  eventCount: number
  metrics: readonly LongitudinalMetricSnapshot[]
  governance?: {
    surface: PanaceaSurface
    pendingClinicalReview: number
    blockedByConsent: number
  }
}

export type LongitudinalMetricDiffStatus = 'added' | 'removed' | 'changed' | 'unchanged'

export interface NumericLongitudinalDelta {
  from: number
  to: number
  unit?: string
  absoluteDelta: number
  relativeDelta: number | null
}

export interface LongitudinalMetricDiff {
  metric: string
  domain: LongitudinalEvent['domain']
  status: LongitudinalMetricDiffStatus
  from?: LongitudinalMetricSnapshot
  to?: LongitudinalMetricSnapshot
  numeric?: NumericLongitudinalDelta
  confidenceDelta?: number
}

export interface LongitudinalReplayDiff {
  subjectId: string
  fromAt: string
  toAt: string
  fromClock: LongitudinalReplayClock
  toClock: LongitudinalReplayClock
  metrics: readonly LongitudinalMetricDiff[]
  counts: {
    added: number
    removed: number
    changed: number
    unchanged: number
  }
}

function parseCutoff(value: string) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error('replay cutoff must be a valid timestamp')
  return parsed
}

function reviewAsKnownAt(event: LongitudinalEvent, cutoffMs: number): LongitudinalEvent {
  const state = event.review.state
  if (state !== 'accepted' && state !== 'rejected') return event

  const reviewedAt = event.review.reviewedAt ? Date.parse(event.review.reviewedAt) : Number.NaN
  if (!Number.isFinite(reviewedAt) || reviewedAt <= cutoffMs) return event

  // Historical replay must not leak a later clinician decision backward in time.
  return {
    ...event,
    review: { state: 'pending' },
  }
}

function eventExistsAt(
  event: LongitudinalEvent,
  cutoffMs: number,
  clock: LongitudinalReplayClock,
) {
  if (Date.parse(event.recordedAt) > cutoffMs) return false
  if (clock === 'effective') return true
  return Date.parse(event.provenance.receivedAt) <= cutoffMs
}

/**
 * Reconstruct an immutable historical view over the canonical append-only
 * longitudinal state. This does not create a second source of truth and does
 * not mutate the current patient state.
 */
export function materializeLongitudinalStateAt(
  state: LongitudinalPatientState,
  at: string,
  clock: LongitudinalReplayClock = 'known',
): LongitudinalPatientState {
  const cutoffMs = parseCutoff(at)
  const events = Object.values(state.eventsById)
    .filter((event) => eventExistsAt(event, cutoffMs, clock))
    .map((event) => reviewAsKnownAt(event, cutoffMs))

  const eventsById: Record<string, LongitudinalEvent> = {}
  const metricEventIds: Record<string, string[]> = {}

  for (const event of events) {
    eventsById[event.id] = event
    metricEventIds[event.metric] = [...(metricEventIds[event.metric] ?? []), event.id]
  }

  for (const ids of Object.values(metricEventIds)) {
    ids.sort((leftId, rightId) => {
      const left = eventsById[leftId]
      const right = eventsById[rightId]
      return Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || left.id.localeCompare(right.id)
    })
  }

  return {
    subjectId: state.subjectId,
    revision: events.length,
    updatedAt: at,
    eventsById,
    metricEventIds,
  }
}

function rawReplayMetrics(state: LongitudinalPatientState) {
  return Object.keys(state.metricEventIds)
    .sort()
    .map((metric) => metricSnapshot(state, metric))
    .filter((snapshot): snapshot is LongitudinalMetricSnapshot => Boolean(snapshot))
}

/**
 * Build a replay frame from the same canonical state used by Your Body,
 * Clinical, AI-EMR and AI context.
 *
 * When a surface is supplied, the existing consent/review projection is reused
 * rather than reimplemented here.
 */
export function buildLongitudinalReplayFrame(
  state: LongitudinalPatientState,
  at: string,
  options: LongitudinalReplayOptions = {},
): LongitudinalReplayFrame {
  const clock = options.clock ?? 'known'
  const historicalState = materializeLongitudinalStateAt(state, at, clock)

  if (!options.surface) {
    return {
      subjectId: state.subjectId,
      at,
      clock,
      sourceRevision: state.revision,
      eventCount: Object.keys(historicalState.eventsById).length,
      metrics: rawReplayMetrics(historicalState),
    }
  }

  const projection = projectStateToSurface(historicalState, options.surface, at)
  return {
    subjectId: state.subjectId,
    at,
    clock,
    sourceRevision: state.revision,
    eventCount: Object.keys(historicalState.eventsById).length,
    metrics: [...projection.metrics].sort((left, right) => left.metric.localeCompare(right.metric)),
    governance: {
      surface: options.surface,
      pendingClinicalReview: projection.pendingClinicalReview,
      blockedByConsent: projection.blockedByConsent,
    },
  }
}

function numericDelta(
  from: LongitudinalMetricSnapshot | undefined,
  to: LongitudinalMetricSnapshot | undefined,
): NumericLongitudinalDelta | undefined {
  if (!from || !to) return undefined
  if (typeof from.latest.value !== 'number' || !Number.isFinite(from.latest.value)) return undefined
  if (typeof to.latest.value !== 'number' || !Number.isFinite(to.latest.value)) return undefined
  if ((from.latest.unit ?? '') !== (to.latest.unit ?? '')) return undefined

  const fromValue = from.latest.value
  const toValue = to.latest.value
  const absoluteDelta = toValue - fromValue
  return {
    from: fromValue,
    to: toValue,
    unit: to.latest.unit,
    absoluteDelta,
    relativeDelta: Math.abs(fromValue) <= Number.EPSILON ? null : absoluteDelta / Math.abs(fromValue),
  }
}

/**
 * Deterministic descriptive diff. It reports state change only; it does not
 * infer diagnosis, severity, prognosis, treatment effect or causality.
 */
export function compareLongitudinalReplayFrames(
  fromFrame: LongitudinalReplayFrame,
  toFrame: LongitudinalReplayFrame,
  options: { includeUnchanged?: boolean } = {},
): LongitudinalReplayDiff {
  if (fromFrame.subjectId !== toFrame.subjectId) {
    throw new Error('cannot compare replay frames from different subjects')
  }

  const fromByMetric = new Map(fromFrame.metrics.map((snapshot) => [snapshot.metric, snapshot]))
  const toByMetric = new Map(toFrame.metrics.map((snapshot) => [snapshot.metric, snapshot]))
  const metricNames = [...new Set([...fromByMetric.keys(), ...toByMetric.keys()])].sort()

  const allMetrics: LongitudinalMetricDiff[] = metricNames.map((metric) => {
    const from = fromByMetric.get(metric)
    const to = toByMetric.get(metric)
    const status: LongitudinalMetricDiffStatus = !from
      ? 'added'
      : !to
        ? 'removed'
        : from.latest.id === to.latest.id
          ? 'unchanged'
          : 'changed'

    return {
      metric,
      domain: (to ?? from)!.domain,
      status,
      from,
      to,
      numeric: numericDelta(from, to),
      confidenceDelta: from && to ? to.latest.confidence - from.latest.confidence : undefined,
    }
  })

  const counts = allMetrics.reduce(
    (acc, metric) => {
      acc[metric.status] += 1
      return acc
    },
    { added: 0, removed: 0, changed: 0, unchanged: 0 },
  )

  return {
    subjectId: fromFrame.subjectId,
    fromAt: fromFrame.at,
    toAt: toFrame.at,
    fromClock: fromFrame.clock,
    toClock: toFrame.clock,
    metrics: options.includeUnchanged ? allMetrics : allMetrics.filter((metric) => metric.status !== 'unchanged'),
    counts,
  }
}
