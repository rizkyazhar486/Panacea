// The insight chart: the window's days on one scale, the person's usual range as a soft band, and a readout that
// follows the pointer (or the arrow keys) day by day. Values lead and the date follows; a day with no reading
// reads "No reading", never 0. Everything shown here is also in the table view beneath it.

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { barPath, DEFAULT_BOX, planChart } from '../../engine/glance/chartGeometry.ts'
import { formatValue, shortDate, withUnit } from '../../engine/glance/insightText.ts'
import type { MetricInsight } from '../../engine/glance/metricInsight.ts'
import { INK } from './useDarkClass.ts'

type Insight = Extract<MetricInsight, { ok: true }>

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const weekday = (date: string) => WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]!

/** The readout for one day, e.g. "8,029 steps · Sun, Nov 15" or "No reading · Sat, Nov 14". */
export function readoutFor(insight: Insight, index: number): string {
  const point = insight.points[index]
  if (!point) return ''
  const when = `${weekday(point.date)}, ${shortDate(point.date)}`
  return point.value === null ? `No reading · ${when}` : `${withUnit(point.value, insight.metric.digits, insight.metric.unit)} · ${when}`
}

export function chartLabel(insight: Insight): string {
  const recorded = insight.stats?.recorded ?? 0
  return `${insight.metric.label}, last ${insight.window} days, ${recorded} recorded. Use the left and right arrow keys to read each day.`
}

/** Narrowest and widest plot the chart draws at 1:1, so its text stays at its set size on any screen. */
export const CHART_WIDTH = { min: 280, max: 760 } as const

export function InsightChart({ insight, dark }: { insight: Insight; dark: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(DEFAULT_BOX.width)
  useEffect(() => {
    const element = frame.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const measured = Math.round(entry?.contentRect.width ?? 0)
      if (measured > 0) setWidth(Math.min(CHART_WIDTH.max, Math.max(CHART_WIDTH.min, measured)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const plan = useMemo(() => planChart(insight, { ...DEFAULT_BOX, width }), [insight, width])
  const ink = dark ? INK.dark : INK.light
  const hue = dark ? insight.metric.hue.dark : insight.metric.hue.light
  const lastRecorded = insight.points.reduce((last, point, index) => (point.value !== null ? index : last), insight.points.length - 1)
  const [selected, setSelected] = useState(lastRecorded)
  const index = Math.min(selected, insight.points.length - 1)
  const readoutId = useId()
  const { box } = plan
  const bottom = box.height - box.pad.bottom

  const pick = (event: PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    setSelected(plan.indexAt(((event.clientX - rect.left) / rect.width) * box.width))
  }
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = insight.points.length - 1
    const next = event.key === 'ArrowLeft' ? index - 1 : event.key === 'ArrowRight' ? index + 1
      : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
    if (next === null) return
    event.preventDefault()
    setSelected(Math.min(last, Math.max(0, next)))
  }

  const point = insight.points[index]
  const x = plan.xs[index] ?? 0
  const selectedDot = plan.dots.find((dot) => dot.index === index)
  return (
    <div
      ref={frame}
      role="group"
      aria-roledescription="chart"
      aria-label={chartLabel(insight)}
      aria-describedby={readoutId}
      tabIndex={0}
      onKeyDown={onKey}
      style={{ outlineOffset: 4, borderRadius: 14, touchAction: 'pan-y' }}
    >
      <p id={readoutId} aria-live="polite" style={{ margin: '0 0 6px', minHeight: 20, fontSize: 13, color: ink.secondary }}>
        {point?.value === null || !point ? (
          <span>{readoutFor(insight, index)}</span>
        ) : (
          <>
            <strong style={{ color: ink.ink, fontSize: 15, fontWeight: 800 }}>{withUnit(point.value, insight.metric.digits, insight.metric.unit)}</strong>
            <span> · {weekday(point.date)}, {shortDate(point.date)}</span>
          </>
        )}
      </p>
      <svg viewBox={`0 0 ${box.width} ${box.height}`} width="100%" aria-hidden="true" style={{ display: 'block', maxWidth: '100%', overflow: 'visible', userSelect: 'none' }}>
        {plan.band && (
          <rect x={box.pad.left} y={plan.band.y} width={box.width - box.pad.left - box.pad.right} height={plan.band.height} fill={hue} opacity={dark ? 0.16 : 0.1} rx={3} />
        )}
        {plan.ticks.map((tick) => (
          <g key={tick.value}>
            <line x1={box.pad.left} x2={box.width - box.pad.right} y1={tick.y} y2={tick.y} stroke={ink.grid} strokeWidth={1} />
            <text x={box.pad.left - 6} y={tick.y + 3.5} textAnchor="end" fontSize={10} fill={ink.muted} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatValue(tick.value, Number.isInteger(tick.value) ? 0 : 1)}
            </text>
          </g>
        ))}
        {plan.bars.map((bar) => (
          <path key={bar.index} d={barPath(bar)} fill={hue} opacity={bar.index === index ? 1 : 0.55} />
        ))}
        {plan.runs.map((run) => (
          <polyline key={run[0]!.index} points={run.map((dot) => `${dot.x},${dot.y}`).join(' ')} fill="none" stroke={hue} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {insight.metric.mark === 'line' && insight.points.length <= 30 && plan.dots.map((dot) => (
          <circle key={dot.index} cx={dot.x} cy={dot.y} r={3.5} fill={hue} stroke={ink.surface} strokeWidth={2} />
        ))}
        <line x1={box.pad.left} x2={box.width - box.pad.right} y1={bottom + 0.5} y2={bottom + 0.5} stroke={ink.muted} strokeOpacity={0.5} strokeWidth={1} />
        {plan.xLabels.map((label) => (
          <text key={label.text + label.anchor} x={label.x} y={box.height - 8} textAnchor={label.anchor} fontSize={10} fill={ink.muted}>{label.text}</text>
        ))}
        {/* crosshair + selected mark */}
        <line x1={x} x2={x} y1={box.pad.top} y2={bottom} stroke={ink.secondary} strokeOpacity={0.45} strokeWidth={1} />
        {selectedDot && insight.metric.mark === 'line' && (
          <circle cx={selectedDot.x} cy={selectedDot.y} r={5} fill={hue} stroke={ink.surface} strokeWidth={2} />
        )}
        {/* the hit area is the whole plot, so a reader aims at a day, not at a 2px line */}
        <rect
          x={box.pad.left} y={0} width={box.width - box.pad.left - box.pad.right} height={bottom}
          fill="transparent" style={{ cursor: 'crosshair' }}
          onPointerDown={pick} onPointerMove={pick}
        />
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 6, fontSize: 12, color: ink.secondary }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {insight.metric.mark === 'bars'
            ? <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 2, background: hue }} />
            : <span aria-hidden="true" style={{ width: 14, height: 2, borderRadius: 1, background: hue }} />}
          Daily {insight.metric.mark === 'bars' ? 'total' : 'reading'}
        </span>
        {insight.range && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden="true" style={{ width: 14, height: 10, borderRadius: 2, background: hue, opacity: dark ? 0.3 : 0.18 }} />
            Your usual range {formatValue(insight.range.low, insight.metric.digits)}–{withUnit(insight.range.high, insight.metric.digits, insight.metric.unit)}
          </span>
        )}
      </div>
    </div>
  )
}

export default InsightChart
