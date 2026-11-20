// Chart marks. Each component is a thin SVG renderer over src/shared/charts/chartGeometry: the geometry decides
// every coordinate, this file only paints. A chart whose geometry refuses the data renders nothing, so a surface
// never shows an empty frame dressed up as a result.

import type { ReactNode } from 'react'
import {
  arcPath, boxStats, bubbleLayout, divergingBars, donutSlices, gaugeAngle, groupedBars, heatCells, histogramBins, polar,
  radarPoints, scale, scatterPoints, seriesPath, stackedColumns, treemapLayout, waterfallSteps,
} from './chartGeometry.ts'

const VB = (w: number, h: number) => ({ viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'none' as const })
const SQ = (w: number, h: number) => ({ viewBox: `0 0 ${w} ${h}` })

export interface SeriesProps { values: readonly number[]; min: number; max: number; w?: number; h?: number; tone: string; area?: boolean }
export function AreaChart({ values, min, max, w = 160, h = 56, tone, area = true }: SeriesProps) {
  const line = seriesPath(values, min, max, { w, h })
  const fill = area ? seriesPath(values, min, max, { w, h }, true) : null
  if (!line) return null
  return (
    <svg {...VB(w, h)} className="pc-svg" aria-hidden>
      {fill && <path d={fill} fill={tone} opacity={0.16} />}
      <path d={line} fill="none" stroke={tone} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export interface DonutProps { slices: ReadonlyArray<{ key: string; value: number; tone: string }>; size?: number; thickness?: number; centre?: ReactNode }
export function DonutChart({ slices, size = 120, thickness = 16, centre }: DonutProps) {
  const arcs = donutSlices(slices, -90)
  if (arcs.length === 0) return null
  const r = size / 2
  return (
    <div className="pc-donut" style={{ width: size, height: size }}>
      <svg {...SQ(size, size)} aria-hidden>
        {arcs.map((a) => {
          const d = arcPath(r, r, r, r - thickness, a.from, a.to)
          const tone = slices.find((s) => s.key === a.key)?.tone ?? 'currentColor'
          return d ? <path key={a.key} d={d} fill={tone} /> : null
        })}
      </svg>
      {centre !== undefined && <div className="pc-donut-centre">{centre}</div>}
    </div>
  )
}

export interface GaugeProps { value: number; min: number; max: number; tone: string; size?: number; centre?: ReactNode }
export function GaugeChart({ value, min, max, tone, size = 110, centre }: GaugeProps) {
  const at = gaugeAngle(value, min, max)
  const r = size / 2
  const track = arcPath(r, r, r, r - 10, -120, 120)
  if (!at || !track) return null
  const live = arcPath(r, r, r, r - 10, -120, at.deg)
  const tip = polar(r, r, r - 5, at.deg)
  return (
    <div className="pc-donut" style={{ width: size, height: size }}>
      <svg {...SQ(size, size)} aria-hidden>
        <path d={track} className="pc-track" />
        {live && <path d={live} fill={tone} />}
        {tip && <circle cx={tip.x} cy={tip.y} r={3.2} fill={tone} />}
      </svg>
      {centre !== undefined && <div className="pc-donut-centre">{centre}</div>}
    </div>
  )
}

export interface StackedProps { columns: ReadonlyArray<{ key: string; parts: readonly number[] }>; tones: readonly string[]; w?: number; h?: number }
export function StackedColumnChart({ columns, tones, w = 160, h = 76 }: StackedProps) {
  const rects = stackedColumns(columns, { w, h })
  if (rects.length === 0) return null
  return (
    <svg {...VB(w, h)} className="pc-svg" aria-hidden>
      {rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={tones[r.part % tones.length]} rx={1} />)}
    </svg>
  )
}

export interface GroupedProps { groups: ReadonlyArray<{ key: string; values: readonly number[] }>; tones: readonly string[]; w?: number; h?: number }
export function GroupedBarChart({ groups, tones, w = 160, h = 76 }: GroupedProps) {
  const bars = groupedBars(groups, { w, h })
  if (bars.length === 0) return null
  return (
    <svg {...VB(w, h)} className="pc-svg" aria-hidden>
      {bars.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={tones[b.group % tones.length]} rx={1} />)}
    </svg>
  )
}

export interface DivergingProps { rows: ReadonlyArray<{ key: string; value: number }>; up: string; down: string; w?: number; h?: number }
export function DivergingChart({ rows, up, down, w = 160, h = 86 }: DivergingProps) {
  const bars = divergingBars(rows, { w, h })
  if (bars.length === 0) return null
  return (
    <svg {...VB(w, h)} className="pc-svg" aria-hidden>
      <line x1={w / 2} y1={0} x2={w / 2} y2={h} className="pc-axis" />
      {bars.map((b) => <rect key={b.key} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.positive ? up : down} rx={1} />)}
    </svg>
  )
}

export interface WaterfallProps { base: number; steps: ReadonlyArray<{ key: string; delta: number; total?: boolean }>; up: string; down: string; total: string; w?: number; h?: number }
export function WaterfallChart({ base, steps, up, down, total, w = 160, h = 76 }: WaterfallProps) {
  const bars = waterfallSteps(base, steps, { w, h })
  if (bars.length === 0) return null
  return (
    <svg {...VB(w, h)} className="pc-svg" aria-hidden>
      {bars.map((b) => <rect key={b.key} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.total ? total : b.delta >= 0 ? up : down} rx={1} />)}
    </svg>
  )
}

export interface RadarProps { series: ReadonlyArray<{ key: string; values: readonly number[]; tone: string; fill?: boolean }>; size?: number; rings?: number }
export function RadarChart({ series, size = 150, rings = 3 }: RadarProps) {
  const r = size / 2 - 6
  const c = size / 2
  const axes = series[0]?.values.length ?? 0
  if (axes < 3) return null
  const ring = (k: number) => radarPoints(new Array(axes).fill(k), c, c, r).map((p) => `${p.x},${p.y}`).join(' ')
  return (
    <svg {...SQ(size, size)} className="pc-svg" aria-hidden>
      {Array.from({ length: rings }, (_, i) => <polygon key={i} points={ring((i + 1) / rings)} className="pc-grid" />)}
      {radarPoints(new Array(axes).fill(1), c, c, r).map((p, i) => <line key={i} x1={c} y1={c} x2={p.x} y2={p.y} className="pc-grid" />)}
      {series.map((s) => {
        const pts = radarPoints(s.values, c, c, r)
        if (pts.length === 0) return null
        const d = pts.map((p) => `${p.x},${p.y}`).join(' ')
        return <polygon key={s.key} points={d} fill={s.fill === false ? 'none' : s.tone} fillOpacity={0.18} stroke={s.tone} strokeWidth={1.6} />
      })}
    </svg>
  )
}

export interface BubbleProps { rows: ReadonlyArray<{ key: string; x: number; y: number; size: number; tone: string }>; xDomain: readonly [number, number]; yDomain: readonly [number, number]; w?: number; h?: number; maxR?: number }
export function BubbleChart({ rows, xDomain, yDomain, w = 160, h = 110, maxR = 18 }: BubbleProps) {
  const bubbles = bubbleLayout(rows, xDomain, yDomain, { w, h }, maxR)
  if (bubbles.length === 0) return null
  return (
    <svg {...SQ(w, h)} className="pc-svg" aria-hidden>
      {bubbles.map((b) => {
        const tone = rows.find((r) => r.key === b.key)?.tone ?? 'currentColor'
        return <circle key={b.key} cx={b.cx} cy={b.cy} r={b.r} fill={tone} fillOpacity={0.3} stroke={tone} strokeWidth={1.4} />
      })}
    </svg>
  )
}

export interface HeatmapProps { matrix: ReadonlyArray<readonly number[]>; cold: string; hot: string; w?: number; h?: number }
export function HeatmapChart({ matrix, cold, hot, w = 160, h = 76 }: HeatmapProps) {
  const cells = heatCells(matrix, { w, h })
  if (cells.length === 0) return null
  return (
    <svg {...VB(w, h)} className="pc-svg" aria-hidden>
      {cells.map((c) => (
        <rect key={`${c.row}-${c.col}`} x={c.x} y={c.y} width={c.w} height={c.h} rx={1}
          fill={`color-mix(in oklab, ${hot} ${Math.round(c.t * 100)}%, ${cold})`} />
      ))}
    </svg>
  )
}

export interface HistogramProps { values: readonly number[]; bins?: number; domain?: readonly [number, number]; tone: string; mark?: number; w?: number; h?: number }
/** Bars of how often each range of values occurred; `mark` draws one value (e.g. today) as a line across. */
export function HistogramChart({ values, bins = 10, domain, tone, mark, w = 160, h = 64 }: HistogramProps) {
  const bars = histogramBins(values, bins, { w, h }, domain)
  if (bars.length === 0) return null
  const lo = bars[0].from, hi = bars[bars.length - 1].to
  const mx = typeof mark === 'number' ? scale(mark, [lo, hi], [0, w]) : null
  return (
    <svg {...VB(w, h)} className="pc-svg" aria-hidden>
      {bars.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={1} fill={tone} fillOpacity={0.75} />)}
      {mx !== null && mx >= 0 && mx <= w && <line x1={mx} x2={mx} y1={0} y2={h} stroke="currentColor" strokeWidth={1.4} strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />}
    </svg>
  )
}

export interface BoxPlotProps { rows: ReadonlyArray<{ key: string; values: readonly number[]; tone: string }>; domain: readonly [number, number]; w?: number; h?: number }
/** One horizontal box per row on a shared scale: whiskers, interquartile box, median tick and outlier dots. */
export function BoxPlotChart({ rows, domain, w = 160, h = 80 }: BoxPlotProps) {
  const drawn = rows.map((r) => ({ r, s: boxStats(r.values) })).filter((x) => x.s !== null)
  if (drawn.length === 0) return null
  const band = h / drawn.length
  const X = (v: number) => scale(v, domain, [2, w - 2]) ?? 0
  return (
    <svg {...SQ(w, h)} className="pc-svg" aria-hidden>
      {drawn.map(({ r, s }, i) => {
        const cy = band * i + band / 2, bh = Math.min(14, band * 0.6)
        return (
          <g key={r.key} stroke={r.tone}>
            <line x1={X(s!.low)} x2={X(s!.high)} y1={cy} y2={cy} strokeWidth={1.2} />
            <rect x={X(s!.q1)} y={cy - bh / 2} width={Math.max(1, X(s!.q3) - X(s!.q1))} height={bh} rx={2} fill={r.tone} fillOpacity={0.22} strokeWidth={1.2} />
            <line x1={X(s!.median)} x2={X(s!.median)} y1={cy - bh / 2} y2={cy + bh / 2} strokeWidth={2.2} />
            {s!.outliers.map((o, j) => <circle key={j} cx={X(o)} cy={cy} r={1.8} fill={r.tone} stroke="none" />)}
          </g>
        )
      })}
    </svg>
  )
}

export interface TreemapProps { items: ReadonlyArray<{ key: string; value: number; tone: string; label?: string }>; w?: number; h?: number }
/** Areas proportional to value; a label is drawn only where the tile is big enough to hold it. */
export function TreemapChart({ items, w = 160, h = 90 }: TreemapProps) {
  const rects = treemapLayout(items, { w, h })
  if (rects.length === 0) return null
  return (
    <svg {...SQ(w, h)} className="pc-svg" aria-hidden>
      {rects.map((r) => {
        const it = items.find((i) => i.key === r.key)
        return (
          <g key={r.key}>
            <rect x={r.x + 0.75} y={r.y + 0.75} width={Math.max(0, r.w - 1.5)} height={Math.max(0, r.h - 1.5)} rx={3} fill={it?.tone ?? 'currentColor'} fillOpacity={0.55} />
            {it?.label && r.w > 34 && r.h > 16 && <text x={r.x + 5} y={r.y + 13} fontSize={9} fontWeight={700} fill="currentColor">{it.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}

export interface ScatterProps { rows: ReadonlyArray<{ key: string; x: number; y: number; tone: string; strong?: boolean }>; xDomain: readonly [number, number]; yDomain: readonly [number, number]; w?: number; h?: number }
/** Dots on two scales; `strong` rows (e.g. the latest) are drawn larger and on top. */
export function ScatterChart({ rows, xDomain, yDomain, w = 160, h = 100 }: ScatterProps) {
  const pts = scatterPoints(rows, xDomain, yDomain, { w, h })
  if (pts.length === 0) return null
  const order = rows.map((r, i) => ({ r, p: pts[i] })).sort((a, b) => Number(!!a.r.strong) - Number(!!b.r.strong))
  return (
    <svg {...SQ(w, h)} className="pc-svg" aria-hidden>
      {order.map(({ r, p }) => <circle key={r.key} cx={p.cx} cy={p.cy} r={r.strong ? 4 : 2.4} fill={r.tone} fillOpacity={r.strong ? 1 : 0.55} stroke={r.strong ? 'currentColor' : 'none'} strokeWidth={1} />)}
    </svg>
  )
}
