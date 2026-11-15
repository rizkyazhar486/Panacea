// The words beside a metric insight. Every sentence carries its numbers, so a reader can check it, and none
// judges health: "within your usual range" compares with the person's own record, nothing more. Pure and
// locale-fixed (English first; translation happens in the locale layer).

import type { MetricInsight, RangePosition } from './metricInsight.ts'
import { RANGE_MIN_DAYS } from './metricInsight.ts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** "Nov 15" for 2026-11-15; the input is a validated YYYY-MM-DD. */
export function shortDate(date: string): string {
  const [, m, d] = date.split('-')
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`
}

export function formatValue(value: number, digits: number): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** Value with its unit, e.g. "8,029 steps", "6.8 h", "57 bpm". */
export function withUnit(value: number, digits: number, unit: string): string {
  return unit ? `${formatValue(value, digits)} ${unit}` : formatValue(value, digits)
}

export const POSITION_LABEL: Record<RangePosition, string> = {
  below: 'Below your usual',
  within: 'Within your usual',
  above: 'Above your usual',
}

/** The same comparison in the few characters a Home tile has room for. */
export const POSITION_SHORT: Record<RangePosition, string> = {
  below: '↓ Below usual',
  within: '• Usual',
  above: '↑ Above usual',
}

export interface InsightLine {
  text: string
  /** measured: a recorded reading; derived: computed from readings (an average, a range, a difference). */
  truth: 'measured' | 'derived'
}

export const INSIGHT_BOUNDARY = 'Compared with your own records only — not a medical assessment.'

export function insightLines(insight: Extract<MetricInsight, { ok: true }>): InsightLine[] {
  const { metric, stats, range, rangeDays, position, change, window } = insight
  const u = (value: number, digits = metric.digits) => withUnit(value, digits, metric.unit)
  if (!stats) return [{ text: `Nothing recorded in the last ${window} days.`, truth: 'measured' }]
  const lines: InsightLine[] = [
    { text: `Latest: ${u(stats.latest.value)} on ${shortDate(stats.latest.date)}.`, truth: 'measured' },
  ]
  if (range && position) {
    lines.push({
      text: `${POSITION_LABEL[position]} range of ${formatValue(range.low, metric.digits)}–${u(range.high)} (middle 80% of ${range.days} recorded days).`,
      truth: 'derived',
    })
  } else {
    lines.push({ text: `A usual range appears after ${RANGE_MIN_DAYS} recorded days; ${rangeDays} so far.`, truth: 'derived' })
  }
  if (change) {
    const delta = Math.abs(change.delta)
    const same = Number(formatValue(delta, metric.digits).replace(/,/g, '')) === 0
    const direction = same ? 'about the same as' : change.delta > 0 ? `${u(delta)} more than` : `${u(delta)} less than`
    lines.push({ text: `Last 7 days averaged ${u(change.recentMean)} — ${direction} the 7 days before.`, truth: 'derived' })
  }
  lines.push({
    text: `Average over ${window} days: ${u(stats.mean)}, from ${stats.recorded} recorded ${stats.recorded === 1 ? 'day' : 'days'}.`,
    truth: 'derived',
  })
  return lines
}
