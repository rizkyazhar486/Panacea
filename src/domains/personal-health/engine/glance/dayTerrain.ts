// A signal's recorded days as a 3D landscape: hours run left to right, days front (newest) to back, and each
// recorded hour is a bar whose height is its value. Orthographic projection, drawn far to near, so it renders as plain
// SVG polygons (no WebGL) and can be turned by changing `yaw`. An hour with no reading is a dot on the floor, never
// a zero-height bar. Pure: the grid and the angles are injected.

import type { DayHourGrid } from './deviceSeries.ts'
import type { GlanceMetric } from './glanceMetrics.ts'
import { formatValue } from './insightText.ts'

export interface TerrainFace {
  /** SVG polygon points. */
  readonly points: string
  /** 0 top, 1 and 2 the two side orientations — the UI darkens sides so the bars read as solids. */
  readonly shade: 0 | 1 | 2
  /** The bar's height as a share of the tallest, 0..1, for colour intensity. */
  readonly level: number
  readonly peak: boolean
}

export interface DayTerrain {
  readonly viewBox: string
  readonly faces: readonly TerrainFace[]
  /** Floor dots for hours with no reading. */
  readonly gaps: ReadonlyArray<{ readonly x: number; readonly y: number }>
  readonly labels: ReadonlyArray<{ readonly x: number; readonly y: number; readonly text: string; readonly anchor: 'start' | 'middle' | 'end' }>
  readonly sentence: string
}

const UNIT = 10
const HEIGHT = 7
const BAR = 0.78
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
const shortDate = (d: string) => `${MONTH[Number(d.slice(5, 7)) - 1] ?? '?'} ${Number(d.slice(8, 10))}`
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

/**
 * Projects a day × hour grid. `yaw` turns the landscape about its vertical axis and `pitch` tilts it towards the
 * viewer, both in degrees. A level's bars start from its lowest recorded hour (so variation is visible); a count's
 * from zero. Grid not 24 columns per day, no reading at all, or an angle out of range → null.
 */
export function dayTerrain(metric: GlanceMetric, grid: DayHourGrid, yaw = -35, pitch = 35): DayTerrain | null {
  const D = grid.days.length
  if (!D || grid.cells.length !== D || grid.cells.some((r) => r.length !== 24)) return null
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch) || pitch < 5 || pitch > 85) return null
  const known = grid.cells.flatMap((row, d) => row.flatMap((v, h) => (v !== null && Number.isFinite(v) ? [{ d, h, v }] : [])))
  if (!known.length) return null

  const vs = known.map((k) => k.v)
  const max = Math.max(...vs)
  const min = metric.mark === 'bars' ? 0 : Math.min(...vs)
  // A level's lowest hour keeps a sliver of height so it still reads as a reading, not a gap.
  const floor = metric.mark === 'bars' ? 0 : 0.08
  const level = (v: number) => (max > min ? floor + (1 - floor) * ((v - min) / (max - min)) : 1)

  const ry = (yaw * Math.PI) / 180, rp = (pitch * Math.PI) / 180
  const cy = Math.cos(ry), sy = Math.sin(ry), cp = Math.cos(rp), sp = Math.sin(rp)
  // Days run front (newest, nearest the viewer) to back.
  const X = (h: number) => h - 11.5
  const Z = (d: number) => (D - 1 - d) - (D - 1) / 2
  const proj = (x: number, y: number, z: number) => {
    const xr = x * cy - z * sy, zr = x * sy + z * cy
    return { sx: xr * UNIT, sy: -(y * cp + zr * sp) * UNIT, depth: zr * cp - y * sp }
  }
  const pts = (ps: ReadonlyArray<{ sx: number; sy: number }>) => ps.map((p) => `${+p.sx.toFixed(1)},${+p.sy.toFixed(1)}`).join(' ')
  // A side faces the viewer when its outward normal, turned by yaw, points back towards −z.
  const faces4 = [
    { n: [0, -1], shade: 1 as const }, { n: [0, 1], shade: 1 as const },
    { n: [-1, 0], shade: 2 as const }, { n: [1, 0], shade: 2 as const },
  ].filter(({ n }) => n[0]! * sy + n[1]! * cy < 0)

  const peak = known.reduce((b, k) => (k.v > b.v ? k : b))
  const bars = known.map((k) => {
    const x0 = X(k.h) - BAR / 2, x1 = X(k.h) + BAR / 2, z0 = Z(k.d) - BAR / 2, z1 = Z(k.d) + BAR / 2
    const top = level(k.v) * HEIGHT
    return { k, x0, x1, z0, z1, top, depth: proj(X(k.h), top / 2, Z(k.d)).depth }
  }).sort((a, b) => b.depth - a.depth)

  const faces: TerrainFace[] = []
  const all: Array<{ sx: number; sy: number }> = []
  for (const b of bars) {
    const lv = level(b.k.v), isPeak = b.k === peak
    for (const f of faces4) {
      const [nx, nz] = f.n as [number, number]
      const quad = nz !== 0
        ? [[b.x0, nz < 0 ? b.z0 : b.z1], [b.x1, nz < 0 ? b.z0 : b.z1]]
        : [[nx < 0 ? b.x0 : b.x1, b.z0], [nx < 0 ? b.x0 : b.x1, b.z1]]
      const p = [proj(quad[0]![0]!, 0, quad[0]![1]!), proj(quad[1]![0]!, 0, quad[1]![1]!), proj(quad[1]![0]!, b.top, quad[1]![1]!), proj(quad[0]![0]!, b.top, quad[0]![1]!)]
      all.push(...p)
      faces.push({ points: pts(p), shade: f.shade, level: lv, peak: isPeak })
    }
    const t = [proj(b.x0, b.top, b.z0), proj(b.x1, b.top, b.z0), proj(b.x1, b.top, b.z1), proj(b.x0, b.top, b.z1)]
    all.push(...t)
    faces.push({ points: pts(t), shade: 0, level: lv, peak: isPeak })
  }

  const gaps = grid.cells.flatMap((row, d) => row.flatMap((v, h) => {
    if (v !== null && Number.isFinite(v)) return []
    const p = proj(X(h), 0, Z(d))
    all.push(p)
    return [{ x: +p.sx.toFixed(1), y: +p.sy.toFixed(1) }]
  }))

  // Hour ticks along the front edge, the newest and oldest day along the left edge.
  const front = Z(D - 1) - 1.2, left = X(0) - 1.2
  const labels = [
    ...[0, 6, 12, 18].map((h) => ({ p: proj(X(h), 0, front), text: String(h).padStart(2, '0'), anchor: 'middle' as const })),
    { p: proj(left, 0, Z(D - 1)), text: shortDate(grid.days[D - 1]!), anchor: 'end' as const },
    ...(D > 1 ? [{ p: proj(left, 0, Z(0)), text: shortDate(grid.days[0]!), anchor: 'end' as const }] : []),
  ].map((l) => { all.push(l.p); return { x: +l.p.sx.toFixed(1), y: +l.p.sy.toFixed(1), text: l.text, anchor: l.anchor } })

  const xs = all.map((p) => p.sx), ys = all.map((p) => p.sy), pad = 14
  const minX = Math.min(...xs) - pad - 24, minY = Math.min(...ys) - pad
  const viewBox = `${+minX.toFixed(1)} ${+minY.toFixed(1)} ${+(Math.max(...xs) + pad - minX).toFixed(1)} ${+(Math.max(...ys) + pad - minY).toFixed(1)}`

  const sentence = `Across ${D} ${D === 1 ? 'day' : 'days'}: highest ${formatValue(peak.v, metric.digits)} ${metric.unit} at ${hh(peak.h)} on ${shortDate(grid.days[peak.d]!)}; ${known.length} of ${D * 24} hours have readings.`
  return { viewBox, faces, gaps, labels, sentence }
}
