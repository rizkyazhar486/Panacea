import type { HabitualCareEvaluation, HabitualCareSignal } from './habitualCareEngine.ts'

export type InsightSurface = 'your-body' | 'clinical' | 'for-you'
export type InsightVisual = 'sparkline' | 'trend-band' | 'status-orb' | 'timeline'

export interface InsightRouteConfig {
  yourBody: string
  clinical: string
  forYou: string
}

export interface VisualInsightWidget {
  id: string
  surface: InsightSurface
  metric: string
  visual: InsightVisual
  microLabel: string
  hiddenContext: string
  primaryRoute: string
  maxInteractionsFromHome: 1 | 2
  interpretationVisibility: 'on-demand'
  mainTextLines: 1
  sourceEventIds: readonly string[]
  provenanceSourceIds: readonly string[]
  meanConfidence: number
  presentationCoherence: number
  requiresClinicianReview: boolean
  autonomousClinicalActionAllowed: false
  companionSurfaces: readonly ('ai-chatbot' | 'ai-emr')[]
}

const FOR_YOU_DOMAINS = new Set(['sleep', 'recovery', 'readiness', 'fitness', 'nutrition', 'activity', 'longevity'])
const MAX_MICRO_LABEL = 72
const MAX_HIDDEN_CONTEXT = 420

function assertRoute(value: string, field: string) {
  if (!value.startsWith('/')) throw new Error(`${field} must be an absolute app route beginning with /`)
  if (value.includes('://')) throw new Error(`${field} must be an internal app route`)
}

function compactLabel(signal: HabitualCareSignal) {
  const arrow = signal.direction === 'rising' ? '↑' : '↓'
  const change = signal.relativeChange === null
    ? `${signal.absoluteChange >= 0 ? '+' : ''}${signal.absoluteChange.toFixed(2)}`
    : `${signal.relativeChange >= 0 ? '+' : ''}${(signal.relativeChange * 100).toFixed(1)}%`
  const unit = signal.unit ? ` ${signal.unit}` : ''
  const label = `${signal.metric} ${arrow} ${change}${unit}`
  return label.length <= MAX_MICRO_LABEL ? label : `${label.slice(0, MAX_MICRO_LABEL - 1)}…`
}

function hiddenContext(signal: HabitualCareSignal) {
  const relative = signal.relativeChange === null
    ? 'relative change unavailable because the baseline median is zero'
    : `relative change ${(signal.relativeChange * 100).toFixed(1)}%`
  const text = `Baseline median ${signal.baselineMedian}${signal.unit ? ` ${signal.unit}` : ''}; recent median ${signal.recentMedian}${signal.unit ? ` ${signal.unit}` : ''}; ${relative}; ${signal.baselineSampleCount} baseline and ${signal.recentSampleCount} recent samples. This is a transparent longitudinal presentation signal, not a diagnosis, risk estimate, or treatment trigger.`
  return text.length <= MAX_HIDDEN_CONTEXT ? text : `${text.slice(0, MAX_HIDDEN_CONTEXT - 1)}…`
}

function visualFor(signal: HabitualCareSignal): InsightVisual {
  if (signal.clinicianReviewRequired) return 'timeline'
  if (signal.domain === 'sleep' || signal.domain === 'recovery' || signal.domain === 'readiness') return 'trend-band'
  if (signal.domain === 'vital') return 'sparkline'
  return 'status-orb'
}

function surfaceFor(signal: HabitualCareSignal): InsightSurface {
  if (signal.clinicianReviewRequired) return 'clinical'
  return 'your-body'
}

/**
 * Presentation coherence is a UI ordering aid only:
 * `coherence = mean source confidence × direction-aligned recent fraction`.
 * It is not clinical certainty, evidence quality, probability, or severity.
 */
function presentationCoherence(signal: HabitualCareSignal) {
  return Math.max(0, Math.min(1, signal.meanConfidence * signal.alignedRecentFraction))
}

export function projectHabitualCareToWidgets(
  evaluation: HabitualCareEvaluation,
  routes: InsightRouteConfig,
): VisualInsightWidget[] {
  assertRoute(routes.yourBody, 'routes.yourBody')
  assertRoute(routes.clinical, 'routes.clinical')
  assertRoute(routes.forYou, 'routes.forYou')

  const widgets: VisualInsightWidget[] = []

  for (const signal of evaluation.signals) {
    const surface = surfaceFor(signal)
    const route = surface === 'clinical' ? routes.clinical : routes.yourBody
    widgets.push({
      id: `insight:${surface}:${signal.metric}:${signal.lastRecentAt}`,
      surface,
      metric: signal.metric,
      visual: visualFor(signal),
      microLabel: compactLabel(signal),
      hiddenContext: hiddenContext(signal),
      primaryRoute: route,
      maxInteractionsFromHome: 2,
      interpretationVisibility: 'on-demand',
      mainTextLines: 1,
      sourceEventIds: signal.eventIds,
      provenanceSourceIds: signal.provenanceSourceIds,
      meanConfidence: signal.meanConfidence,
      presentationCoherence: presentationCoherence(signal),
      requiresClinicianReview: signal.clinicianReviewRequired,
      autonomousClinicalActionAllowed: false,
      companionSurfaces: signal.clinicianReviewRequired ? ['ai-chatbot', 'ai-emr'] : ['ai-chatbot'],
    })

    if (!signal.clinicianReviewRequired && FOR_YOU_DOMAINS.has(signal.domain)) {
      widgets.push({
        id: `insight:for-you:${signal.metric}:${signal.lastRecentAt}`,
        surface: 'for-you',
        metric: signal.metric,
        visual: signal.domain === 'sleep' || signal.domain === 'recovery' ? 'trend-band' : 'status-orb',
        microLabel: compactLabel(signal),
        hiddenContext: hiddenContext(signal),
        primaryRoute: routes.forYou,
        maxInteractionsFromHome: 2,
        interpretationVisibility: 'on-demand',
        mainTextLines: 1,
        sourceEventIds: signal.eventIds,
        provenanceSourceIds: signal.provenanceSourceIds,
        meanConfidence: signal.meanConfidence,
        presentationCoherence: presentationCoherence(signal),
        requiresClinicianReview: false,
        autonomousClinicalActionAllowed: false,
        companionSurfaces: ['ai-chatbot'],
      })
    }
  }

  return widgets.sort((left, right) => {
    const surfaceOrder: Record<InsightSurface, number> = { 'your-body': 0, clinical: 1, 'for-you': 2 }
    return surfaceOrder[left.surface] - surfaceOrder[right.surface]
      || right.presentationCoherence - left.presentationCoherence
      || left.metric.localeCompare(right.metric)
  })
}

export function validateVisualInsightWidget(widget: VisualInsightWidget) {
  if (widget.mainTextLines !== 1) throw new Error('main scrolling text must remain one line')
  if (widget.maxInteractionsFromHome > 2) throw new Error('important insight must be reachable in at most two interactions from Home')
  if (widget.interpretationVisibility !== 'on-demand') throw new Error('interpretation must remain on-demand')
  if (widget.microLabel.length > MAX_MICRO_LABEL) throw new Error('microLabel is too long')
  if (widget.hiddenContext.length > MAX_HIDDEN_CONTEXT) throw new Error('hiddenContext is too long')
  assertRoute(widget.primaryRoute, 'widget.primaryRoute')
  if (widget.autonomousClinicalActionAllowed !== false) throw new Error('autonomous clinical action must remain disabled')
  return true
}
