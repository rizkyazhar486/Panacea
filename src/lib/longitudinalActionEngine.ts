import { calculateLongitudinalTrends } from './longitudinalTrendEngine'
import { summarizeLongitudinalState, type LongitudinalSignal } from './longitudinalPatientState'

export type LongitudinalAction = {
  id: string
  label: string
  route: string
  reason: 'empty' | 'stale' | 'consent' | 'mixed-source' | 'trend' | 'clinical-context'
  priority: number
}

const DAY_MS = 86_400_000

function ageMs(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return Number.POSITIVE_INFINITY
  return Math.max(0, Date.now() - parsed)
}

export function deriveLongitudinalActions(signals: LongitudinalSignal[], limit = 4): LongitudinalAction[] {
  const summary = summarizeLongitudinalState(signals)
  const trends = calculateLongitudinalTrends(signals, { windowDays: 30, minSamples: 2 })
  const actions: LongitudinalAction[] = []

  if (!summary.signalCount) {
    actions.push({ id: 'connect-data', label: 'Add health data', route: '/fitness-hub?view=health-data', reason: 'empty', priority: 100 })
  }

  if (summary.signalCount && ageMs(summary.lastMeasuredAt) > DAY_MS) {
    actions.push({ id: 'refresh-data', label: 'Refresh data', route: '/fitness-hub?view=health-data', reason: 'stale', priority: 90 })
  }

  if (summary.signalCount && summary.consentedCount < summary.signalCount) {
    actions.push({ id: 'review-consent', label: 'Review consent', route: '/settings', reason: 'consent', priority: 85 })
  }

  if (trends.some((trend) => trend.mixedProvenance)) {
    actions.push({ id: 'compare-sources', label: 'Compare sources', route: '/fitness-hub?view=health-data', reason: 'mixed-source', priority: 70 })
  }

  if (trends.length) {
    actions.push({ id: 'open-trends', label: 'Explore trends', route: '/fitness-hub?view=labs', reason: 'trend', priority: 60 })
  }

  if (signals.some((signal) => signal.domain === 'clinical')) {
    actions.push({ id: 'clinical-context', label: 'Open Clinical', route: '/clinical', reason: 'clinical-context', priority: 55 })
  }

  return actions.sort((a, b) => b.priority - a.priority).slice(0, limit)
}

export const longitudinalActionBoundary = 'Actions manage data/context/navigation only. They do not diagnose, prescribe, triage severity, or replace clinician review.'
