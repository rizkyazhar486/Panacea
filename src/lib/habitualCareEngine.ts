import {
  canEnterAiContext,
  eventsForMetric,
  type LongitudinalDomain,
  type LongitudinalEvent,
  type LongitudinalPatientState,
} from './panaceaLongitudinalState.ts'

export interface HabitualCareRule {
  metric: string
  recentWindowDays: number
  baselineLookbackDays: number
  relativeChangeThreshold: number
  minRecentSamples: number
  minBaselineSamples: number
}

export type ChangeDirection = 'rising' | 'falling'

export interface HabitualCareSignal {
  metric: string
  domain: LongitudinalDomain
  unit?: string
  baselineMedian: number
  recentMedian: number
  absoluteChange: number
  relativeChange: number | null
  direction: ChangeDirection
  threshold: number
  thresholdMultiple: number | null
  recentSampleCount: number
  baselineSampleCount: number
  alignedRecentFraction: number
  meanConfidence: number
  firstRecentAt: string
  lastRecentAt: string
  eventIds: readonly string[]
  provenanceSourceIds: readonly string[]
  clinicianReviewRequired: boolean
  aiContextEligible: boolean
  autonomousClinicalActionAllowed: false
}

export interface HabitualCareAction {
  id: string
  metric: string
  surface: 'your-body' | 'clinical'
  action: 'visualize-change' | 'open-clinical-context'
  microLabel: string
  detail: string
  requiresHumanReview: boolean
  sourceEventIds: readonly string[]
}

export interface HabitualCareEvaluation {
  subjectId: string
  evaluatedAt: string
  stateRevision: number
  signals: readonly HabitualCareSignal[]
  actions: readonly HabitualCareAction[]
  skipped: readonly {
    metric: string
    reason: 'metric-missing' | 'insufficient-baseline' | 'insufficient-recent' | 'below-presentation-threshold'
  }[]
  governance: {
    autonomousClinicalActionAllowed: false
    thresholdsArePresentationRulesNotClinicalCutoffs: true
  }
}

const DAY_MS = 86_400_000
const EPSILON = 1e-9
const CLINICAL_CONTEXT_DOMAINS = new Set<LongitudinalDomain>(['lab', 'symptom', 'medication', 'clinical-note'])

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertRule(rule: HabitualCareRule) {
  if (!rule.metric.trim()) throw new Error('rule.metric must not be blank')
  if (!Number.isFinite(rule.recentWindowDays) || rule.recentWindowDays <= 0) {
    throw new Error('rule.recentWindowDays must be > 0')
  }
  if (!Number.isFinite(rule.baselineLookbackDays) || rule.baselineLookbackDays <= rule.recentWindowDays) {
    throw new Error('rule.baselineLookbackDays must be greater than rule.recentWindowDays')
  }
  if (!Number.isFinite(rule.relativeChangeThreshold) || rule.relativeChangeThreshold <= 0) {
    throw new Error('rule.relativeChangeThreshold must be > 0')
  }
  if (!Number.isInteger(rule.minRecentSamples) || rule.minRecentSamples < 1) {
    throw new Error('rule.minRecentSamples must be a positive integer')
  }
  if (!Number.isInteger(rule.minBaselineSamples) || rule.minBaselineSamples < 1) {
    throw new Error('rule.minBaselineSamples must be a positive integer')
  }
}

function median(values: readonly number[]) {
  if (!values.length) throw new Error('median requires at least one value')
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

function mean(values: readonly number[]) {
  if (!values.length) throw new Error('mean requires at least one value')
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function numericEvents(state: LongitudinalPatientState, metric: string) {
  return eventsForMetric(state, metric).filter((event): event is LongitudinalEvent<number> => {
    return typeof event.value === 'number' && Number.isFinite(event.value)
  })
}

function unique(values: readonly string[]) {
  return [...new Set(values)]
}

function actionFromSignal(signal: HabitualCareSignal): HabitualCareAction {
  const clinical = signal.clinicianReviewRequired
  const direction = signal.direction === 'rising' ? '↑' : '↓'
  const change = signal.relativeChange === null
    ? `${signal.absoluteChange >= 0 ? '+' : ''}${signal.absoluteChange.toFixed(2)}`
    : `${signal.relativeChange >= 0 ? '+' : ''}${(signal.relativeChange * 100).toFixed(1)}%`

  return {
    id: `habitual:${signal.metric}:${signal.lastRecentAt}`,
    metric: signal.metric,
    surface: clinical ? 'clinical' : 'your-body',
    action: clinical ? 'open-clinical-context' : 'visualize-change',
    microLabel: `${signal.metric} ${direction} ${change}`,
    detail: clinical
      ? 'A configured longitudinal presentation threshold was crossed. Show the source values, provenance, confidence and temporal context for clinician review; do not infer a diagnosis or treatment from this signal alone.'
      : 'A configured longitudinal presentation threshold was crossed. Show the visual trend and source context; the change detector does not establish health benefit, harm, diagnosis or treatment need.',
    requiresHumanReview: clinical,
    sourceEventIds: signal.eventIds,
  }
}

/**
 * Evaluate configured longitudinal presentation rules.
 *
 * Baseline and recent values are summarized with the median. Relative change is
 * `(recentMedian - baselineMedian) / |baselineMedian|` when the denominator is
 * non-zero. `thresholdMultiple = |relativeChange| / configuredThreshold`.
 * These thresholds are product presentation rules supplied by the caller, not
 * medical cutoffs, diagnostic criteria, risk estimates, or treatment triggers.
 */
export function evaluateHabitualCare(
  state: LongitudinalPatientState,
  rules: readonly HabitualCareRule[],
  evaluatedAt = new Date().toISOString(),
): HabitualCareEvaluation {
  const evaluatedAtMs = parseIso(evaluatedAt, 'evaluatedAt')
  const signals: HabitualCareSignal[] = []
  const skipped: HabitualCareEvaluation['skipped'][number][] = []

  for (const rule of rules) {
    assertRule(rule)
    const metric = rule.metric.trim()
    const events = numericEvents(state, metric)
    if (!events.length) {
      skipped.push({ metric, reason: 'metric-missing' })
      continue
    }

    const recentStart = evaluatedAtMs - rule.recentWindowDays * DAY_MS
    const baselineStart = evaluatedAtMs - rule.baselineLookbackDays * DAY_MS
    const baseline = events.filter((event) => {
      const timestamp = Date.parse(event.recordedAt)
      return timestamp >= baselineStart && timestamp < recentStart
    })
    const recent = events.filter((event) => {
      const timestamp = Date.parse(event.recordedAt)
      return timestamp >= recentStart && timestamp <= evaluatedAtMs
    })

    if (baseline.length < rule.minBaselineSamples) {
      skipped.push({ metric, reason: 'insufficient-baseline' })
      continue
    }
    if (recent.length < rule.minRecentSamples) {
      skipped.push({ metric, reason: 'insufficient-recent' })
      continue
    }

    const baselineMedian = median(baseline.map((event) => event.value))
    const recentMedian = median(recent.map((event) => event.value))
    const absoluteChange = recentMedian - baselineMedian
    const relativeChange = Math.abs(baselineMedian) <= EPSILON
      ? null
      : absoluteChange / Math.abs(baselineMedian)

    if (relativeChange !== null && Math.abs(relativeChange) < rule.relativeChangeThreshold) {
      skipped.push({ metric, reason: 'below-presentation-threshold' })
      continue
    }
    if (relativeChange === null && Math.abs(absoluteChange) <= EPSILON) {
      skipped.push({ metric, reason: 'below-presentation-threshold' })
      continue
    }

    const direction: ChangeDirection = absoluteChange >= 0 ? 'rising' : 'falling'
    const alignedRecentCount = recent.filter((event) => {
      return direction === 'rising' ? event.value >= baselineMedian : event.value <= baselineMedian
    }).length
    const combined = [...baseline, ...recent]
    const latest = recent[recent.length - 1]
    const clinicianReviewRequired = CLINICAL_CONTEXT_DOMAINS.has(latest.domain)
    const thresholdMultiple = relativeChange === null
      ? null
      : Math.abs(relativeChange) / rule.relativeChangeThreshold

    signals.push({
      metric,
      domain: latest.domain,
      unit: latest.unit,
      baselineMedian,
      recentMedian,
      absoluteChange,
      relativeChange,
      direction,
      threshold: rule.relativeChangeThreshold,
      thresholdMultiple,
      recentSampleCount: recent.length,
      baselineSampleCount: baseline.length,
      alignedRecentFraction: alignedRecentCount / recent.length,
      meanConfidence: mean(combined.map((event) => event.confidence)),
      firstRecentAt: recent[0].recordedAt,
      lastRecentAt: latest.recordedAt,
      eventIds: combined.map((event) => event.id),
      provenanceSourceIds: unique(combined.map((event) => event.provenance.sourceId)),
      clinicianReviewRequired,
      aiContextEligible: combined.every((event) => canEnterAiContext(event, evaluatedAtMs)),
      autonomousClinicalActionAllowed: false,
    })
  }

  signals.sort((left, right) => {
    const leftMultiple = left.thresholdMultiple ?? Number.POSITIVE_INFINITY
    const rightMultiple = right.thresholdMultiple ?? Number.POSITIVE_INFINITY
    return rightMultiple - leftMultiple || left.metric.localeCompare(right.metric)
  })

  return {
    subjectId: state.subjectId,
    evaluatedAt,
    stateRevision: state.revision,
    signals,
    actions: signals.map(actionFromSignal),
    skipped,
    governance: {
      autonomousClinicalActionAllowed: false,
      thresholdsArePresentationRulesNotClinicalCutoffs: true,
    },
  }
}
