// The Health Data analyzer's extra views, built on metricInsight (same day rules, same plausibility guards, same
// personal range): a weekday pattern, a spread of the last 90 days, and which signals actually arrived on which
// day. Each view returns its numbers plus one sentence that states them; nothing is called healthy or unhealthy,
// and a day without a reading stays a gap. Pure: `today` is injected.

import type { GlanceMetric } from './glanceMetrics.ts'
import { formatValue } from './insightText.ts'
import { dateOfDay, dayNumber, metricInsight, RANGE_MIN_DAYS, type DayValue, type RangePosition } from './metricInsight.ts'

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

export interface ClockSpoke {
  readonly hour: number
  readonly value: number
  /** From (x1, y1) on the inner ring outward to (x2, y2); length grows with the value. */
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
}

export interface TypicalDay {
  readonly size: number
  readonly inner: number
  readonly outer: number
  readonly spokes: readonly ClockSpoke[]
  /** Hours with no reading: drawn as a faint dot, never as a zero-length spoke. */
  readonly empty: readonly number[]
  /** Hour labels at 00, 06, 12, 18. */
  readonly labels: ReadonlyArray<{ readonly hour: number; readonly x: number; readonly y: number }>
  readonly sentence: string
}

const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

/**
 * A signal's typical day as 24 spokes around a dial, midnight at the top, clockwise. A level's spokes start at its
 * lowest hour, so variation is not swamped by the baseline; a count's start at zero. The sentence names the highest
 * and lowest hour with their values and how many hours had readings. A profile that is not 24 entries, or has no
 * reading, → null: nothing is drawn rather than an empty dial.
 */
export function typicalDay(metric: GlanceMetric, hours: readonly (number | null)[], size = 200): TypicalDay | null {
  if (hours.length !== 24 || !(size > 0)) return null
  const known = hours.map((v, hour) => ({ hour, v })).filter((x): x is { hour: number; v: number } => x.v !== null && Number.isFinite(x.v))
  if (!known.length) return null
  const c = size / 2, inner = size * 0.2, outer = size * 0.42, floor = 6
  const values = known.map((x) => x.v)
  const max = Math.max(...values)
  const min = metric.mark === 'bars' ? 0 : Math.min(...values)
  const at = (hour: number, r: number) => {
    const a = (hour / 24) * 2 * Math.PI - Math.PI / 2
    return { x: +(c + r * Math.cos(a)).toFixed(2), y: +(c + r * Math.sin(a)).toFixed(2) }
  }
  const spokes = known.map(({ hour, v }) => {
    // A flat profile still shows every recorded hour, at equal full length.
    const f = max > min ? (v - min) / (max - min) : 1
    const a = at(hour, inner), b = at(hour, inner + floor + f * (outer - inner - floor))
    return { hour, value: v, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
  })
  const empty = hours.flatMap((v, hour) => (v === null || !Number.isFinite(v) ? [hour] : []))
  const hi = known.reduce((b, x) => (x.v > b.v ? x : b)), lo = known.reduce((b, x) => (x.v < b.v ? x : b))
  const sentence = known.length < 2
    ? `Only ${hh(known[0].hour)} has readings so far (${fmt(known[0].v, metric.digits)} ${metric.unit}).`
    : `Highest around ${hh(hi.hour)} (${fmt(hi.v, metric.digits)} ${metric.unit}), lowest around ${hh(lo.hour)} (${fmt(lo.v, metric.digits)}); ${known.length} of 24 hours have readings.`
  return { size, inner, outer, spokes, empty, labels: [0, 6, 12, 18].map((hour) => ({ hour, ...at(hour, outer + 12) })), sentence }
}

export interface RangeRow {
  readonly id: string
  readonly label: string
  /** Latest reading with its unit. */
  readonly value: string
  /** Where the latest reading sits on a scale where the usual range is always the middle third (1/3..2/3), clamped 0..1. */
  readonly at: number
  readonly position: RangePosition
}

export interface RangeBoard {
  readonly rows: readonly RangeRow[]
  /** Signals with a latest reading but under RANGE_MIN_DAYS of history, so no usual range yet. */
  readonly building: ReadonlyArray<{ readonly id: string; readonly label: string; readonly days: number }>
  readonly sentence: string
}

/**
 * Every signal against its own usual range on one shared scale — the body-analyzer "all bars at once" view. The usual
 * range is drawn as the middle third of each bar, with one range-width either side, so bars of different units line up
 * and a reading outside the band reads as outside at a glance. No value is judged good or bad: above is not worse.
 */
export function rangeBoard(metrics: readonly GlanceMetric[], seriesById: Readonly<Record<string, readonly DayValue[]>>, today: string): RangeBoard {
  const rows: RangeRow[] = []
  const building: Array<{ id: string; label: string; days: number }> = []
  for (const metric of metrics) {
    const r = metricInsight({ metric, series: seriesById[metric.id] ?? [], today, window: 90 })
    const latest = r.ok ? r.stats?.latest : undefined
    if (!r.ok || !latest) continue
    if (!r.range || !r.position) { building.push({ id: metric.id, label: metric.label, days: r.rangeDays }); continue }
    const w = r.range.high - r.range.low
    // A flat usual range has no width to scale by; any reading inside it is the centre, outside it the matching edge.
    const at = w > 0 ? (latest.value - (r.range.low - w)) / (3 * w) : r.position === 'within' ? 0.5 : r.position === 'above' ? 1 : 0
    rows.push({ id: metric.id, label: metric.label, value: `${formatValue(latest.value, metric.digits)} ${metric.unit}`.trim(), at: Math.max(0, Math.min(1, at)), position: r.position })
  }
  const count = (p: RangePosition) => rows.filter((row) => row.position === p).length
  const sentence = rows.length
    ? `${count('within')} of ${rows.length} signals sit within your usual range${count('above') ? `; ${count('above')} above` : ''}${count('below') ? `; ${count('below')} below` : ''}.`
    : building.length
      ? `A usual range appears after ${RANGE_MIN_DAYS} recorded days of a signal.`
      : 'No signal has a reading yet.'
  return { rows, building, sentence }
}
