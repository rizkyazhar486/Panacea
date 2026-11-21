// The Health Data analyzer's extra views, built on metricInsight (same day rules, same plausibility guards, same
// personal range): a weekday pattern, a spread of the last 90 days, and which signals actually arrived on which
// day. Each view returns its numbers plus one sentence that states them; nothing is called healthy or unhealthy,
// and a day without a reading stays a gap. Pure: `today` is injected.

import type { GlanceMetric } from './glanceMetrics.ts'
import { formatValue } from './insightText.ts'
import { dateOfDay, dayNumber, metricInsight, type DayValue } from './metricInsight.ts'

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
/** Readings a weekday needs before it gets a box; fewer would draw a box from one or two nights. */
export const WEEKDAY_MIN_READINGS = 4

/** The readings metricInsight accepts in the last 90 days, oldest first. Bad today → []. */
function accepted(metric: GlanceMetric, series: readonly DayValue[], today: string): DayValue[] {
  const r = metricInsight({ metric, series, today, window: 90 })
  return r.ok ? r.points.filter((p): p is DayValue => p.value !== null) : []
}

/** Same number style as every other insight line ("6,000", "6.8"). */
const fmt = formatValue
const median = (xs: readonly number[]) => {
  const s = [...xs].sort((a, b) => a - b), m = s.length / 2
  return s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2
}

export interface WeekdayPattern {
  /** Monday first; `values` empty for a weekday below WEEKDAY_MIN_READINGS. */
  readonly days: ReadonlyArray<{ readonly name: string; readonly values: readonly number[] }>
  readonly sentence: string
}

/**
 * The last 90 days grouped by weekday (Monday first). The sentence names the weekdays with the highest and lowest
 * median, with both medians, only when at least two weekdays have enough readings.
 */
export function weekdayPattern(metric: GlanceMetric, series: readonly DayValue[], today: string): WeekdayPattern {
  const groups = new Map<number, number[]>()
  for (const p of accepted(metric, series, today)) {
    const wd = new Date(`${p.date}T12:00:00Z`).getUTCDay()
    groups.set(wd, [...(groups.get(wd) ?? []), p.value])
  }
  const days = [1, 2, 3, 4, 5, 6, 0].map((wd) => {
    const vs = groups.get(wd) ?? []
    return { name: WEEKDAY[wd], values: vs.length >= WEEKDAY_MIN_READINGS ? vs : [] }
  })
  const ranked = days.filter((d) => d.values.length).map((d) => ({ name: d.name, med: median(d.values) })).sort((a, b) => a.med - b.med)
  const sentence = ranked.length < 2
    ? `Weekday pattern needs ${WEEKDAY_MIN_READINGS} readings on at least two weekdays.`
    : `Highest on ${ranked[ranked.length - 1].name} (median ${fmt(ranked[ranked.length - 1].med, metric.digits)} ${metric.unit}), lowest on ${ranked[0].name} (${fmt(ranked[0].med, metric.digits)}).`
  return { days, sentence }
}

export interface Spread {
  readonly values: readonly number[]
  readonly latest: number | null
  /** Share of the 90-day readings at or below the latest one, 0..1. */
  readonly rank: number | null
  readonly sentence: string
}

/** The last 90 days' accepted readings and where the latest sits among them, as a plain percentile rank. */
export function spread(metric: GlanceMetric, series: readonly DayValue[], today: string): Spread {
  const vs = accepted(metric, series, today).map((p) => p.value)
  if (vs.length === 0) return { values: [], latest: null, rank: null, sentence: `No ${metric.label} readings in the last 90 days.` }
  const latest = vs[vs.length - 1]
  const rank = vs.filter((v) => v <= latest).length / vs.length
  const sentence = vs.length < 5
    ? `${vs.length} ${vs.length === 1 ? 'reading' : 'readings'} so far — too few to show a spread.`
    : rank >= 0.5
      ? `Latest ${fmt(latest, metric.digits)} ${metric.unit} is at or above ${Math.round(rank * 100)}% of your last ${vs.length} readings.`
      : `Latest ${fmt(latest, metric.digits)} ${metric.unit} is below ${Math.round((vs.filter((v) => v > latest).length / vs.length) * 100)}% of your last ${vs.length} readings.`
  return { values: vs, latest, rank, sentence }
}

export interface Coverage {
  /** Rows follow `metrics`, columns are the last `days` calendar days (oldest left): 1 = a reading arrived. */
  readonly matrix: readonly (readonly number[])[]
  readonly counts: readonly number[]
  readonly days: number
  readonly sentence: string
}

/**
 * Which signal arrived on which of the last `days` days. Uses the same acceptance as metricInsight, so an
 * implausible import counts as a gap here too. The sentence names the best- and worst-covered signal.
 */
export function coverage(metrics: readonly GlanceMetric[], seriesById: Readonly<Record<string, readonly DayValue[]>>, today: string, days = 28): Coverage {
  const end = dayNumber(today)
  if (end === null || !Number.isInteger(days) || days < 1 || days > 90 || metrics.length === 0) {
    return { matrix: [], counts: [], days: 0, sentence: 'Coverage cannot be shown for this date.' }
  }
  const cols = Array.from({ length: days }, (_, i) => dateOfDay(end - days + 1 + i))
  const matrix = metrics.map((m) => {
    const got = new Set(accepted(m, seriesById[m.id] ?? [], today).map((p) => p.date))
    return cols.map((d): number => (got.has(d) ? 1 : 0))
  })
  const counts = matrix.map((row) => row.reduce((t, v) => t + v, 0))
  const order = metrics.map((m, i) => ({ label: m.label, n: counts[i] })).sort((a, b) => b.n - a.n)
  const total = counts.reduce((t, v) => t + v, 0)
  const sentence = total === 0
    ? `No readings arrived in the last ${days} days. Connect a device or import a file.`
    : `${order[0].label} arrived on ${order[0].n} of ${days} days; ${order[order.length - 1].label} on ${order[order.length - 1].n}.`
  return { matrix, counts, days, sentence }
}
