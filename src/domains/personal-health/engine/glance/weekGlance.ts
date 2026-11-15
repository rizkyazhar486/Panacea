// What a Home tile shows for one signal: its last 7 days and where this week's latest reading sits in the person's
// usual range (the range itself comes from up to 90 days). A reading older than the week gets no position on the
// tile — a chip about a stale reading would read as today's. Pure: the day is passed in.

import { glanceMetric, type GlanceMetricId } from './glanceMetrics.ts'
import { metricInsight, type DayValue, type MetricInsight } from './metricInsight.ts'

export type WeekGlance = Extract<MetricInsight, { ok: true }>

export function weekGlance(id: GlanceMetricId | string, series: readonly DayValue[], today: string): WeekGlance | null {
  const metric = glanceMetric(id)
  if (!metric) return null
  const week = metricInsight({ metric, series, today, window: 7 })
  return week.ok ? week : null
}

/** A device's local calendar day for an instant, YYYY-MM-DD (the date the person sees on their clock). */
export function localDayOf(instant: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${instant.getFullYear()}-${p(instant.getMonth() + 1)}-${p(instant.getDate())}`
}
