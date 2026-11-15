// Geometry of a metric-insight chart, so the component only draws what this computes. Pure and deterministic.
//
// One scale for marks, ticks and the usual-range band. A daily total (bars) always starts at zero — a bar's
// length is its value; a daily level (line) gets a padded domain around its readings. A day with no reading has
// no mark: a gap in the line, no bar. The chart never draws a value that was not recorded.

import type { MetricInsight } from './metricInsight.ts'
import { shortDate } from './insightText.ts'

export interface ChartBox {
  width: number
  height: number
  /** Inner plot edges in px from the box's own edges. */
  pad: { left: number; right: number; top: number; bottom: number }
}

export const DEFAULT_BOX: ChartBox = { width: 340, height: 200, pad: { left: 40, right: 10, top: 14, bottom: 26 } }

/** Ticks at 1, 2, 2.5 or 5 × 10^k covering [min, max]; never empty for finite input with max ≥ min. */
export function niceTicks(min: number, max: number, target = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min || target < 1) return []
  if (max === min) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.05
    min -= pad
    max += pad
  }
  const rough = (max - min) / target
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const residual = rough / magnitude
  const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 2.5 ? 2.5 : residual <= 5 ? 5 : 10) * magnitude
  const first = Math.floor(min / step + 1e-9) * step
  const last = Math.ceil(max / step - 1e-9) * step
  const ticks: number[] = []
  for (let value = first; value <= last + step / 2; value += step) ticks.push(Number(value.toPrecision(12)))
  return ticks
}

export interface BarMark { index: number; x: number; y: number; width: number; height: number }
export interface DotMark { index: number; x: number; y: number }

export interface ChartPlan {
  box: ChartBox
  /** Centre x of each day's slot, one per point. */
  xs: number[]
  ticks: { value: number; y: number }[]
  /** Usual-range band, clipped to the plot. */
  band: { y: number; height: number } | null
  bars: BarMark[]
  /** Line runs between recorded days; a missing day ends a run. */
  runs: DotMark[][]
  dots: DotMark[]
  xLabels: { x: number; text: string; anchor: 'start' | 'middle' | 'end' }[]
  /** Index of the slot nearest a pointer x, clamped to the days. */
  indexAt(x: number): number
}

export function planChart(insight: Extract<MetricInsight, { ok: true }>, box: ChartBox = DEFAULT_BOX): ChartPlan {
  const { points, stats, range, metric } = insight
  const left = box.pad.left
  const right = box.width - box.pad.right
  const top = box.pad.top
  const bottom = box.height - box.pad.bottom
  const n = points.length
  const step = (right - left) / n
  const xs = points.map((_, index) => left + step * (index + 0.5))
  const indexAt = (x: number) => Math.min(n - 1, Math.max(0, Math.floor((x - left) / step)))
  const xLabels = n === 0 ? [] : [
    { x: xs[0]!, text: shortDate(points[0]!.date), anchor: 'start' as const },
    ...(n > 2 ? [{ x: xs[Math.floor((n - 1) / 2)]!, text: shortDate(points[Math.floor((n - 1) / 2)]!.date), anchor: 'middle' as const }] : []),
    { x: xs[n - 1]!, text: shortDate(points[n - 1]!.date), anchor: 'end' as const },
  ]
  if (!stats) return { box, xs, ticks: [], band: null, bars: [], runs: [], dots: [], xLabels, indexAt }

  let lo = Math.min(stats.low.value, range?.low ?? Number.POSITIVE_INFINITY)
  let hi = Math.max(stats.high.value, range?.high ?? Number.NEGATIVE_INFINITY)
  if (metric.mark === 'bars') {
    lo = 0
    if (hi <= 0) hi = 1 // a run of recorded zeros still gets an axis above zero
  }
  else {
    const spread = hi - lo || Math.max(1, Math.abs(hi) * 0.05)
    lo -= spread * 0.15
    hi += spread * 0.15
  }
  const values = niceTicks(lo, hi, 3)
  const yMin = values[0]!
  const yMax = values[values.length - 1]!
  const y = (value: number) => bottom - ((value - yMin) / (yMax - yMin)) * (bottom - top)
  const ticks = values.map((value) => ({ value, y: y(value) }))

  const band = range
    ? (() => {
        const yTop = Math.max(top, y(range.high))
        const yBottom = Math.min(bottom, y(range.low))
        return yBottom > yTop ? { y: yTop, height: yBottom - yTop } : null
      })()
    : null

  const bars: BarMark[] = []
  const runs: DotMark[][] = []
  const dots: DotMark[] = []
  const width = Math.max(1.5, Math.min(24, step * 0.66))
  let run: DotMark[] = []
  points.forEach((point, index) => {
    if (point.value === null) {
      if (run.length) runs.push(run)
      run = []
      return
    }
    const py = y(point.value)
    const dot = { index, x: xs[index]!, y: py }
    dots.push(dot)
    if (metric.mark === 'bars') bars.push({ index, x: xs[index]! - width / 2, y: py, width, height: bottom - py })
    else run.push(dot)
  })
  if (run.length) runs.push(run)
  return { box, xs, ticks, band, bars, runs, dots, xLabels, indexAt }
}

/** SVG path for a bar with a 4px rounded data end and a square baseline (narrow bars get a smaller radius). */
export function barPath(bar: BarMark): string {
  const r = Math.min(4, bar.width / 2, bar.height)
  const { x, y, width: w, height: h } = bar
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}
