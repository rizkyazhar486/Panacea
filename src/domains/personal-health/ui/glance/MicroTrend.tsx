// The last 7 days of one signal, sized to the tile it sits in. The latest day carries the colour; earlier days
// are a lighter wash of it. A day with no reading draws nothing, and a week with no readings draws only the
// baseline — never a zero. A recorded zero is a 1.5 px stub, so it is told apart from a missing day.

import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { GlanceMetric } from '../../engine/glance/glanceMetrics.ts'
import type { InsightPoint } from '../../engine/glance/metricInsight.ts'

const PAD = 2
const MIN_W = 48
const MAX_W = 260

export interface MicroTrendProps {
  metric: GlanceMetric
  /** One point per day, oldest first (the insight's 7-day points). */
  points: readonly InsightPoint[]
  dark: boolean
  height?: number
}

export function microTrendLabel(metric: GlanceMetric, points: readonly InsightPoint[]): string {
  const recorded = points.filter((point) => point.value !== null).length
  return `${metric.label}, last ${points.length} days: ${recorded} recorded`
}

/** Bars or line runs for `points` in a W×H box; pure, so the shapes are testable without a DOM. */
export function microTrendMarks(metric: GlanceMetric, points: readonly InsightPoint[], W: number, H: number) {
  const values = points.map((point) => point.value).filter((value): value is number => value !== null)
  const n = points.length
  const step = (W - PAD * 2) / Math.max(1, n)
  const x = (index: number) => PAD + step * (index + 0.5)
  const lastIndex = points.reduce((last, point, index) => (point.value !== null ? index : last), -1)
  if (!values.length) return { bars: [], runs: [], last: null, lastIndex }
  const max = Math.max(...values)
  const min = Math.min(...values)
  if (metric.mark === 'bars') {
    const width = Math.max(2, Math.min(14, step * 0.6))
    const bars = points.flatMap((point, index) => point.value === null ? [] : [{
      index, x: x(index) - width / 2, width,
      height: Math.max(1.5, (point.value / (max || 1)) * (H - PAD * 2 - 2)),
    }])
    return { bars, runs: [], last: null, lastIndex }
  }
  const span = max - min || 1
  const y = (value: number) => H - PAD - 3 - ((value - min) / span) * (H - PAD * 2 - 6)
  const runs: { x: number; y: number }[][] = []
  let run: { x: number; y: number }[] = []
  points.forEach((point, index) => {
    if (point.value === null) { if (run.length) runs.push(run); run = []; return }
    run.push({ x: x(index), y: y(point.value) })
  })
  if (run.length) runs.push(run)
  return { bars: [], runs, last: { x: x(lastIndex), y: y(points[lastIndex]!.value!) }, lastIndex }
}

export function MicroTrend({ metric, points, dark, height = 26 }: MicroTrendProps) {
  const box = useRef<HTMLSpanElement>(null)
  const [W, setW] = useState(56)
  useEffect(() => {
    const element = box.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry?.contentRect.width ?? 0)
      if (width > 0) setW(Math.min(MAX_W, Math.max(MIN_W, width)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const H = height
  const hue = dark ? metric.hue.dark : metric.hue.light
  const { bars, runs, last, lastIndex } = microTrendMarks(metric, points, W, H)
  const marks: ReactElement[] = [
    ...bars.map((bar) => (
      <rect key={bar.index} x={bar.x} y={H - PAD - bar.height} width={bar.width} height={bar.height} rx={Math.min(2, bar.width / 2)}
        fill={hue} opacity={bar.index === lastIndex ? 1 : 0.38} />
    )),
    ...runs.map((run) => (
      <polyline key={`${run[0]!.x}`} points={run.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} fill="none" stroke={hue}
        strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
    )),
    ...(last ? [<circle key="last" cx={last.x} cy={last.y} r={2.8} fill={hue} stroke={dark ? '#0b0f0d' : '#ffffff'} strokeWidth={1.5} />] : []),
  ]
  return (
    // Explicit size and no transform: a host card's own `svg` rules (e.g. the Home ring's rotation) must not reach it.
    <span ref={box} style={{ display: 'block', width: '100%', maxWidth: MAX_W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={microTrendLabel(metric, points)} style={{ display: 'block', overflow: 'visible', width: W, height: H, aspectRatio: 'auto', transform: 'none' }}>
        <line x1={PAD} x2={W - PAD} y1={H - PAD + 0.5} y2={H - PAD + 0.5} stroke="currentColor" strokeOpacity={0.14} strokeWidth={1} />
        {marks}
      </svg>
    </span>
  )
}
