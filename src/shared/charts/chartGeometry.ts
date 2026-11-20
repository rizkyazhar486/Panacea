// Chart geometry: the maths behind every chart shape, with no React, no DOM and no colour. Each function takes
// numbers and a box and returns coordinates or an SVG path. Pure and deterministic, so the shapes can be tested
// exactly rather than eyeballed.
//
// Fail closed: invalid input (NaN, infinite, negative size, empty series, a domain with no span) returns null or an
// empty result instead of a guessed shape. A chart that cannot be drawn truthfully is not drawn.

export interface Box { readonly w: number; readonly h: number }

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const box = (b: Box): boolean => num(b.w) && num(b.h) && b.w > 0 && b.h > 0
const r2 = (v: number): number => Math.round(v * 100) / 100

/** Point on a circle. Angles are degrees clockwise from 12 o'clock, which is how a gauge is read. */
export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } | null {
  if (![cx, cy, r, deg].every(num) || r < 0) return null
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: r2(cx + r * Math.cos(rad)), y: r2(cy + r * Math.sin(rad)) }
}

/**
 * Ring segment (donut slice, gauge track) from `from` to `to` degrees. A sweep of 360° or more draws the full ring
 * as two half arcs, since one arc cannot close a circle.
 */
export function arcPath(cx: number, cy: number, rOuter: number, rInner: number, from: number, to: number): string | null {
  if (![cx, cy, rOuter, rInner, from, to].every(num)) return null
  if (rOuter <= 0 || rInner < 0 || rInner >= rOuter) return null
  const sweep = to - from
  if (sweep <= 0) return null
  if (sweep >= 360) {
    const ring = (r: number) => `M${r2(cx - r)} ${r2(cy)}A${r2(r)} ${r2(r)} 0 1 1 ${r2(cx + r)} ${r2(cy)}A${r2(r)} ${r2(r)} 0 1 1 ${r2(cx - r)} ${r2(cy)}Z`
    return `${ring(rOuter)}${ring(rInner)}`
  }
  const o1 = polar(cx, cy, rOuter, from), o2 = polar(cx, cy, rOuter, to)
  const i1 = polar(cx, cy, rInner, to), i2 = polar(cx, cy, rInner, from)
  if (!o1 || !o2 || !i1 || !i2) return null
  const large = sweep > 180 ? 1 : 0
  return `M${o1.x} ${o1.y}A${r2(rOuter)} ${r2(rOuter)} 0 ${large} 1 ${o2.x} ${o2.y}L${i1.x} ${i1.y}A${r2(rInner)} ${r2(rInner)} 0 ${large} 0 ${i2.x} ${i2.y}Z`
}

export interface Slice { readonly key: string; readonly value: number }
export interface SliceArc extends Slice { readonly from: number; readonly to: number; readonly fraction: number }

/** Donut slices in order, starting at `startDeg`. Any negative value, or a total of zero, → empty. */
export function donutSlices(slices: readonly Slice[], startDeg = 0): SliceArc[] {
  if (!slices || slices.length === 0) return []
  if (!num(startDeg)) return []
  if (slices.some((s) => !num(s.value) || s.value < 0)) return []
  const total = slices.reduce((t, s) => t + s.value, 0)
  if (!(total > 0)) return []
  const out: SliceArc[] = []
  let at = startDeg
  for (const s of slices) {
    const sweep = (s.value / total) * 360
    out.push({ ...s, from: r2(at), to: r2(at + sweep), fraction: s.value / total })
    at += sweep
  }
  return out
}

/** Where a value sits on a gauge of `arcDeg` degrees centred at the top: the angle and the 0..1 position. */
export function gaugeAngle(value: number, min: number, max: number, arcDeg = 240): { deg: number; t: number } | null {
  if (![value, min, max, arcDeg].every(num) || max <= min || arcDeg <= 0 || arcDeg > 360) return null
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)))
  return { deg: r2(-arcDeg / 2 + t * arcDeg), t }
}

/** Linear scale; a domain with no span is refused rather than collapsing every point onto one pixel. */
export function scale(value: number, from: readonly [number, number], to: readonly [number, number]): number | null {
  if (![value, from[0], from[1], to[0], to[1]].every(num) || from[0] === from[1]) return null
  return r2(to[0] + ((value - from[0]) / (from[1] - from[0])) * (to[1] - to[0]))
}

/** Polyline path through a series, x by index, y scaled from [min, max]. `close` adds a baseline for an area fill. */
export function seriesPath(values: readonly number[], min: number, max: number, b: Box, close = false): string | null {
  if (!values || values.length < 2 || !box(b)) return null
  if (!values.every(num) || ![min, max].every(num) || max <= min) return null
  const pts = values.map((v, i) => {
    const x = r2((i / (values.length - 1)) * b.w)
    const y = r2(b.h - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * b.h)
    return `${x} ${y}`
  })
  const line = `M${pts.join('L')}`
  return close ? `${line}L${r2(b.w)} ${r2(b.h)}L0 ${r2(b.h)}Z` : line
}

export interface Column { readonly key: string; readonly parts: readonly number[] }
export interface ColumnRect { readonly key: string; readonly part: number; readonly x: number; readonly y: number; readonly w: number; readonly h: number }

/** Stacked columns sharing one scale. Negative parts, ragged rows or a zero maximum → empty. */
export function stackedColumns(columns: readonly Column[], b: Box, gap = 0.3): ColumnRect[] {
  if (!columns || columns.length === 0 || !box(b) || !num(gap) || gap < 0 || gap >= 1) return []
  const parts = columns[0]?.parts.length ?? 0
  if (parts === 0) return []
  if (columns.some((c) => c.parts.length !== parts || c.parts.some((v) => !num(v) || v < 0))) return []
  const totals = columns.map((c) => c.parts.reduce((t, v) => t + v, 0))
  const max = Math.max(...totals)
  if (!(max > 0)) return []
  const slot = b.w / columns.length
  const width = slot * (1 - gap)
  const out: ColumnRect[] = []
  columns.forEach((c, ci) => {
    let y = b.h
    c.parts.forEach((v, pi) => {
      const h = (v / max) * b.h
      y -= h
      out.push({ key: c.key, part: pi, x: r2(ci * slot + (slot - width) / 2), y: r2(y), w: r2(width), h: r2(h) })
    })
  })
  return out
}

export interface DivergingBar { readonly key: string; readonly value: number; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly positive: boolean }

/** Bars growing left or right from a centre line, scaled to the largest magnitude. */
export function divergingBars(rows: ReadonlyArray<{ readonly key: string; readonly value: number }>, b: Box, gap = 0.35): DivergingBar[] {
  if (!rows || rows.length === 0 || !box(b) || !num(gap) || gap < 0 || gap >= 1) return []
  if (rows.some((r) => !num(r.value))) return []
  const max = Math.max(...rows.map((r) => Math.abs(r.value)))
  if (!(max > 0)) return []
  const slot = b.h / rows.length
  const height = slot * (1 - gap)
  const mid = b.w / 2
  return rows.map((r, i) => {
    const len = (Math.abs(r.value) / max) * (b.w / 2)
    return {
      key: r.key, value: r.value, positive: r.value >= 0,
      x: r2(r.value >= 0 ? mid : mid - len), y: r2(i * slot + (slot - height) / 2), w: r2(len), h: r2(height),
    }
  })
}

export interface WaterfallStep { readonly key: string; readonly delta: number; readonly start: number; readonly end: number; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly total: boolean }

/** Running total bars: each step starts where the last ended. `base` is the opening value. */
export function waterfallSteps(base: number, steps: ReadonlyArray<{ readonly key: string; readonly delta: number; readonly total?: boolean }>, b: Box, gap = 0.3): WaterfallStep[] {
  if (!num(base) || !steps || steps.length === 0 || !box(b) || !num(gap) || gap < 0 || gap >= 1) return []
  if (steps.some((s) => !num(s.delta))) return []
  const levels: Array<{ start: number; end: number }> = []
  let at = base
  for (const s of steps) {
    const end = s.total ? at : at + s.delta
    levels.push({ start: s.total ? 0 : at, end })
    at = end
  }
  const lo = Math.min(0, ...levels.flatMap((l) => [l.start, l.end]))
  const hi = Math.max(...levels.flatMap((l) => [l.start, l.end]))
  if (hi <= lo) return []
  const slot = b.w / steps.length
  const width = slot * (1 - gap)
  const y = (v: number) => b.h - ((v - lo) / (hi - lo)) * b.h
  return steps.map((s, i) => {
    const l = levels[i]
    const top = Math.min(y(l.start), y(l.end)), bottom = Math.max(y(l.start), y(l.end))
    return {
      key: s.key, delta: s.delta, start: l.start, end: l.end, total: s.total === true,
      x: r2(i * slot + (slot - width) / 2), y: r2(top), w: r2(width), h: r2(Math.max(1, bottom - top)),
    }
  })
}

/** Radar polygon: one point per axis, clockwise from 12 o'clock, each value 0..1 of the radius. */
export function radarPoints(values: readonly number[], cx: number, cy: number, r: number): Array<{ x: number; y: number }> {
  if (!values || values.length < 3 || ![cx, cy, r].every(num) || r <= 0) return []
  if (!values.every((v) => num(v) && v >= 0)) return []
  const step = 360 / values.length
  const out: Array<{ x: number; y: number }> = []
  for (let i = 0; i < values.length; i++) {
    const p = polar(cx, cy, r * Math.min(1, values[i]), i * step)
    if (!p) return []
    out.push(p)
  }
  return out
}

export interface Bubble { readonly key: string; readonly cx: number; readonly cy: number; readonly r: number }

/** Bubbles placed on two scales, radius by area (so a value twice as large looks twice as big, not four times). */
export function bubbleLayout(
  rows: ReadonlyArray<{ readonly key: string; readonly x: number; readonly y: number; readonly size: number }>,
  xDomain: readonly [number, number], yDomain: readonly [number, number], b: Box, maxR: number,
): Bubble[] {
  if (!rows || rows.length === 0 || !box(b) || !num(maxR) || maxR <= 0) return []
  if (rows.some((r) => !num(r.x) || !num(r.y) || !num(r.size) || r.size < 0)) return []
  const maxSize = Math.max(...rows.map((r) => r.size))
  if (!(maxSize > 0)) return []
  const out: Bubble[] = []
  for (const row of rows) {
    const cx = scale(row.x, xDomain, [maxR, b.w - maxR])
    const cy = scale(row.y, yDomain, [b.h - maxR, maxR])
    if (cx === null || cy === null) return []
    out.push({ key: row.key, cx, cy, r: r2(maxR * Math.sqrt(row.size / maxSize)) })
  }
  return out
}

export interface HeatCell { readonly row: number; readonly col: number; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly value: number; readonly t: number }

/** Heatmap cells with `t` as each value's 0..1 position between the matrix min and max. */
export function heatCells(matrix: ReadonlyArray<readonly number[]>, b: Box, pad = 2): HeatCell[] {
  if (!matrix || matrix.length === 0 || !box(b) || !num(pad) || pad < 0) return []
  const cols = matrix[0]?.length ?? 0
  if (cols === 0 || matrix.some((r) => r.length !== cols || r.some((v) => !num(v)))) return []
  const flat = matrix.flat()
  const lo = Math.min(...flat), hi = Math.max(...flat)
  const cw = b.w / cols, ch = b.h / matrix.length
  if (cw <= pad || ch <= pad) return []
  const out: HeatCell[] = []
  matrix.forEach((row, ri) => row.forEach((v, ci) => {
    out.push({ row: ri, col: ci, x: r2(ci * cw + pad / 2), y: r2(ri * ch + pad / 2), w: r2(cw - pad), h: r2(ch - pad), value: v, t: hi === lo ? 0.5 : (v - lo) / (hi - lo) })
  }))
  return out
}

export interface GroupedBar { readonly key: string; readonly group: number; readonly x: number; readonly y: number; readonly w: number; readonly h: number; readonly value: number }

/** Side-by-side bars per group, all on one scale from zero. */
export function groupedBars(groups: ReadonlyArray<{ readonly key: string; readonly values: readonly number[] }>, b: Box, gap = 0.3, inner = 0.15): GroupedBar[] {
  if (!groups || groups.length === 0 || !box(b)) return []
  if (![gap, inner].every((g) => num(g) && g >= 0 && g < 1)) return []
  const n = groups[0]?.values.length ?? 0
  if (n === 0 || groups.some((g) => g.values.length !== n || g.values.some((v) => !num(v) || v < 0))) return []
  const max = Math.max(...groups.flatMap((g) => g.values))
  if (!(max > 0)) return []
  const slot = b.w / groups.length
  const band = slot * (1 - gap)
  const bar = (band / n) * (1 - inner)
  const out: GroupedBar[] = []
  groups.forEach((g, gi) => g.values.forEach((v, vi) => {
    const h = (v / max) * b.h
    out.push({ key: g.key, group: vi, value: v, x: r2(gi * slot + (slot - band) / 2 + vi * (band / n) + ((band / n) - bar) / 2), y: r2(b.h - h), w: r2(bar), h: r2(h) })
  }))
  return out
}

// ── Distribution: quantile, histogram, box plot ─────────────────────────────────────────────────────────────────

/** Linear-interpolated quantile (type 7, the spreadsheet/NumPy default) of an ascending array. Invalid → null. */
export function quantile(sorted: readonly number[], p: number): number | null {
  if (!sorted || sorted.length === 0 || !num(p) || p < 0 || p > 1 || sorted.some((v) => !num(v))) return null
  for (let i = 1; i < sorted.length; i++) if (sorted[i] < sorted[i - 1]) return null
  const at = (sorted.length - 1) * p
  const lo = Math.floor(at), hi = Math.ceil(at)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (at - lo)
}

export interface HistogramBin { readonly from: number; readonly to: number; readonly count: number; readonly x: number; readonly y: number; readonly w: number; readonly h: number }

/**
 * `bins` equal-width bins over `domain` (default: the data's own min..max), each bar's height its count on one scale
 * from zero. The last bin includes its upper edge; values outside the domain are not drawn. A domain with no span,
 * any non-finite value, or fewer than one bin → empty.
 */
export function histogramBins(values: readonly number[], bins: number, b: Box, domain?: readonly [number, number], gap = 1): HistogramBin[] {
  if (!values || values.length === 0 || !box(b) || !Number.isInteger(bins) || bins < 1 || !num(gap) || gap < 0) return []
  if (values.some((v) => !num(v))) return []
  const [lo, hi] = domain ?? [Math.min(...values), Math.max(...values)]
  if (!num(lo) || !num(hi) || !(hi > lo)) return []
  const width = (hi - lo) / bins
  const counts = new Array<number>(bins).fill(0)
  for (const v of values) {
    if (v < lo || v > hi) continue
    counts[Math.min(bins - 1, Math.floor((v - lo) / width))]++
  }
  const max = Math.max(...counts)
  if (max === 0) return []
  const slot = b.w / bins
  if (slot <= gap) return []
  return counts.map((count, i) => {
    const h = (count / max) * b.h
    return { from: lo + i * width, to: lo + (i + 1) * width, count, x: r2(i * slot + gap / 2), y: r2(b.h - h), w: r2(slot - gap), h: r2(h) }
  })
}

export interface BoxStats {
  readonly n: number
  readonly q1: number
  readonly median: number
  readonly q3: number
  /** Tukey whiskers: furthest values within 1.5 × IQR of the box. */
  readonly low: number
  readonly high: number
  readonly outliers: readonly number[]
}

/** Five-number summary with Tukey whiskers. Fewer than `minN` values or any non-finite value → null. */
export function boxStats(values: readonly number[], minN = 4): BoxStats | null {
  if (!values || values.length < Math.max(1, minN) || values.some((v) => !num(v))) return null
  const s = [...values].sort((a, b) => a - b)
  const q1 = quantile(s, 0.25)!, median = quantile(s, 0.5)!, q3 = quantile(s, 0.75)!
  const fence = 1.5 * (q3 - q1)
  const inside = s.filter((v) => v >= q1 - fence && v <= q3 + fence)
  return { n: s.length, q1, median, q3, low: inside[0], high: inside[inside.length - 1], outliers: s.filter((v) => v < q1 - fence || v > q3 + fence) }
}

// ── Tree map ─────────────────────────────────────────────────────────────────────────────────────────────────────

export interface TreeRect { readonly key: string; readonly value: number; readonly x: number; readonly y: number; readonly w: number; readonly h: number }

/**
 * Squarified tree map (Bruls, Huizing & van Wijk 2000): areas exactly proportional to value, laid out to keep tiles
 * near square. Zero-valued items get no tile. Any negative or non-finite value, or a total of zero → empty.
 */
export function treemapLayout(items: ReadonlyArray<{ readonly key: string; readonly value: number }>, b: Box): TreeRect[] {
  if (!items || items.length === 0 || !box(b) || items.some((i) => !num(i.value) || i.value < 0)) return []
  const total = items.reduce((t, i) => t + i.value, 0)
  if (!(total > 0)) return []
  const k = (b.w * b.h) / total
  const queue = items.filter((i) => i.value > 0).map((i) => ({ key: i.key, value: i.value, area: i.value * k })).sort((a, c) => c.area - a.area)
  const out: TreeRect[] = []
  let x = 0, y = 0, w = b.w, h = b.h
  const worst = (row: typeof queue, side: number) => {
    const sum = row.reduce((t, r) => t + r.area, 0)
    const mx = Math.max(...row.map((r) => r.area)), mn = Math.min(...row.map((r) => r.area))
    return Math.max((side * side * mx) / (sum * sum), (sum * sum) / (side * side * mn))
  }
  let row: typeof queue = []
  const place = () => {
    const sum = row.reduce((t, r) => t + r.area, 0)
    if (w >= h) {
      const cw = sum / h; let cy = y
      for (const r of row) { const rh = r.area / cw; out.push({ key: r.key, value: r.value, x: r2(x), y: r2(cy), w: r2(cw), h: r2(rh) }); cy += rh }
      x += cw; w -= cw
    } else {
      const rh = sum / w; let cx = x
      for (const r of row) { const rw = r.area / rh; out.push({ key: r.key, value: r.value, x: r2(cx), y: r2(y), w: r2(rw), h: r2(rh) }); cx += rw }
      y += rh; h -= rh
    }
    row = []
  }
  for (const item of queue) {
    const side = Math.min(w, h)
    if (row.length === 0 || worst([...row, item], side) <= worst(row, side)) row.push(item)
    else { place(); row.push(item) }
  }
  if (row.length) place()
  return out
}

// ── Scatter ──────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ScatterPoint { readonly key: string; readonly cx: number; readonly cy: number }

/** Points on two linear scales, inset by `pad` so a mark on the edge is not cut. Any invalid point → empty. */
export function scatterPoints(rows: ReadonlyArray<{ readonly key: string; readonly x: number; readonly y: number }>, xDomain: readonly [number, number], yDomain: readonly [number, number], b: Box, pad = 4): ScatterPoint[] {
  if (!rows || rows.length === 0 || !box(b) || !num(pad) || pad < 0 || 2 * pad >= Math.min(b.w, b.h)) return []
  const out: ScatterPoint[] = []
  for (const r of rows) {
    if (!num(r.x) || !num(r.y)) return []
    const cx = scale(r.x, xDomain, [pad, b.w - pad]), cy = scale(r.y, yDomain, [b.h - pad, pad])
    if (cx === null || cy === null) return []
    out.push({ key: r.key, cx: r2(cx), cy: r2(cy) })
  }
  return out
}
