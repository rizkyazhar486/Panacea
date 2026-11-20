// Chart marks. Each component is a thin SVG renderer over src/shared/charts/chartGeometry: the geometry decides
// every coordinate, this file only paints. A chart whose geometry refuses the data renders nothing, so a surface
// never shows an empty frame dressed up as a result.

import type { ReactNode } from 'react'
import {
  arcPath, bubbleLayout, divergingBars, donutSlices, gaugeAngle, groupedBars, heatCells, polar, radarPoints,
  seriesPath, stackedColumns, waterfallSteps,
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
