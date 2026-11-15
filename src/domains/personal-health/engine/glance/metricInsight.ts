// One recorded signal over a window of days, read against the person's own history. Pure: the day ("today") is
// an injected calendar date, the series an injected list; no clock, storage or locale is read here.
//
// What it will say: the days with a reading (a missing day stays missing — never drawn as zero), the window's
// average, lowest and highest, the person's usual range (the middle 80% of up to 90 days, once 14 days exist),
// where the latest reading sits against that range, and how the last 7 days compare with the 7 before. It never
// says whether a number is healthy: the comparison is with the person's own record only.

import type { GlanceMetric } from './glanceMetrics.ts'

export interface DayValue {
  /** Calendar date, YYYY-MM-DD. */
  date: string
  value: number
}

export const INSIGHT_WINDOWS = [7, 30, 90] as const
export type InsightWindow = (typeof INSIGHT_WINDOWS)[number]

/** Days needed before a usual range is stated — fewer gives a range that misleads more than it informs. */
export const RANGE_MIN_DAYS = 14
/** History the usual range is drawn from. */
export const RANGE_SPAN_DAYS = 90
/** Each 7-day half of the week comparison needs at least this many recorded days. */
export const WEEK_MIN_DAYS = 4

export interface PersonalRange {
  low: number
  high: number
  /** Recorded days it is based on. */
  days: number
}

export type RangePosition = 'below' | 'within' | 'above'

/**
 * The usual range of a list of daily values: the 10th and 90th percentiles (nearest rank), so one odd day — a
 * watch left on the charger, a fever — does not stretch it. Null below RANGE_MIN_DAYS values or with a value
 * that is not a finite number.
 */
export function personalRange(values: readonly number[]): PersonalRange | null {
  if (values.length < RANGE_MIN_DAYS || values.some((value) => !Number.isFinite(value))) return null
  const sorted = [...values].sort((a, b) => a - b)
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)))]!
  return { low: at(0.1), high: at(0.9), days: values.length }
}

export const rangePosition = (range: PersonalRange, value: number): RangePosition =>
  value < range.low ? 'below' : value > range.high ? 'above' : 'within'

export interface InsightPoint {
  date: string
  value: number | null
}

export interface InsightStats {
  /** Days in the window with a reading. */
  recorded: number
  mean: number
  low: DayValue
  high: DayValue
  latest: DayValue
}

export interface WeekChange {
  recentMean: number
  previousMean: number
  delta: number
  recentDays: number
  previousDays: number
}

export type MetricInsight =
  | {
      ok: true
      metric: GlanceMetric
      window: InsightWindow
      /** One entry per calendar day of the window, oldest first; null where nothing was recorded. */
      points: InsightPoint[]
      stats: InsightStats | null
      /** Usual range from the last RANGE_SPAN_DAYS days, whatever the window. */
      range: PersonalRange | null
      /** Recorded days in that span, so the page can say how many more are needed. */
      rangeDays: number
      /** Where the latest reading in the window sits against the range. */
      position: RangePosition | null
      change: WeekChange | null
      /** Series entries not used: malformed date, future day, not a number, implausible, or an earlier duplicate. */
      rejected: number
    }
  | { ok: false; reason: 'bad_today' | 'bad_window' }

const DAY_MS = 86_400_000
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Days since 1970-01-01 for a valid YYYY-MM-DD, else null (rejects 2026-02-30, 2026-13-01). */
export function dayNumber(date: string): number | null {
  const match = DATE.exec(date)
  if (!match) return null
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const ms = Date.UTC(y, m - 1, d)
  const back = new Date(ms)
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== m - 1 || back.getUTCDate() !== d) return null
  return ms / DAY_MS
}

export function dateOfDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}

const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

export function metricInsight(input: {
  metric: GlanceMetric
  series: readonly DayValue[]
  today: string
  window: number
}): MetricInsight {
  const today = dayNumber(input.today)
  if (today === null) return { ok: false, reason: 'bad_today' }
  if (!(INSIGHT_WINDOWS as readonly number[]).includes(input.window)) return { ok: false, reason: 'bad_window' }
  const window = input.window as InsightWindow
  const { metric } = input

  // One value per day; the later entry for a day wins (the history keeps the day's last reading).
  const byDay = new Map<number, number>()
  let rejected = 0
  for (const entry of input.series) {
    const day = typeof entry?.date === 'string' ? dayNumber(entry.date) : null
    const value = entry?.value
    if (day === null || day > today || typeof value !== 'number' || !Number.isFinite(value)
      || value < metric.plausible.min || value > metric.plausible.max) { rejected += 1; continue }
    if (byDay.has(day)) rejected += 1
    byDay.set(day, value)
  }

  const points: InsightPoint[] = []
  for (let day = today - window + 1; day <= today; day += 1) {
    points.push({ date: dateOfDay(day), value: byDay.has(day) ? byDay.get(day)! : null })
  }
  const recorded = points.filter((point): point is DayValue => point.value !== null)
  const stats: InsightStats | null = recorded.length === 0 ? null : {
    recorded: recorded.length,
    mean: mean(recorded.map((point) => point.value)),
    // Ties: the earliest low and the latest high, so a repeated extreme points at its first and last appearance.
    low: recorded.reduce((min, point) => (point.value < min.value ? point : min)),
    high: recorded.reduce((max, point) => (point.value >= max.value ? point : max)),
    latest: recorded[recorded.length - 1]!,
  }

  const span: number[] = []
  for (let day = today - RANGE_SPAN_DAYS + 1; day <= today; day += 1) {
    if (byDay.has(day)) span.push(byDay.get(day)!)
  }
  const range = personalRange(span)
  const position = range && stats ? rangePosition(range, stats.latest.value) : null

  const half = (from: number) => {
    const values: number[] = []
    for (let day = from; day < from + 7; day += 1) if (byDay.has(day)) values.push(byDay.get(day)!)
    return values
  }
  const recent = half(today - 6)
  const previous = half(today - 13)
  const change: WeekChange | null = recent.length >= WEEK_MIN_DAYS && previous.length >= WEEK_MIN_DAYS
    ? { recentMean: mean(recent), previousMean: mean(previous), delta: mean(recent) - mean(previous), recentDays: recent.length, previousDays: previous.length }
    : null

  return { ok: true, metric, window, points, stats, range, rangeDays: span.length, position, change, rejected }
}
