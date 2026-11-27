// Centerline of a hollow organ traced from its reference-atlas surface mesh.
// Each atlas segment (rectum, sigmoid colon, ...) is clustered into a few
// cross-sections; the section centroids become the path and the mean
// distance from centroid to surface becomes the local lumen radius. The path
// and calibre therefore come from the measured atlas geometry, not a drawing.

export type Vec3 = [number, number, number]

export interface SegmentSurface {
  id: string
  label: string
  /** World-space surface vertices of this segment. */
  points: Vec3[]
}

export interface CenterlineNode {
  p: Vec3
  r: number
  segment: number
}

export interface Centerline {
  nodes: CenterlineNode[]
  /** Normalised path position (0..1) where each segment starts. */
  segmentStarts: number[]
  labels: string[]
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

function mean(points: Vec3[]): Vec3 {
  const c: Vec3 = [0, 0, 0]
  for (const p of points) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2] }
  const n = Math.max(1, points.length)
  return [c[0] / n, c[1] / n, c[2] / n]
}

/** Deterministic k-means seeded by farthest-point sampling. */
function clusters(points: Vec3[], k: number): Vec3[][] {
  const seeds: Vec3[] = [points[0]!]
  while (seeds.length < k) {
    let best = points[0]!
    let bestD = -1
    for (const p of points) {
      const d = Math.min(...seeds.map((s) => dist(p, s)))
      if (d > bestD) { bestD = d; best = p }
    }
    seeds.push(best)
  }
  let centers = seeds
  let groups: Vec3[][] = []
  for (let iter = 0; iter < 12; iter++) {
    groups = centers.map(() => [])
    for (const p of points) {
      let bi = 0
      let bd = Infinity
      centers.forEach((c, i) => { const d = dist(p, c); if (d < bd) { bd = d; bi = i } })
      groups[bi]!.push(p)
    }
    centers = groups.map((g, i) => (g.length ? mean(g) : centers[i]!))
  }
  return groups.filter((g) => g.length > 0)
}

/** Orders section centroids into a chain starting nearest `from`. */
function chain(sections: { c: Vec3; r: number }[], from: Vec3) {
  const left = [...sections]
  const out: { c: Vec3; r: number }[] = []
  let cursor = from
  while (left.length) {
    let bi = 0
    left.forEach((s, i) => { if (dist(s.c, cursor) < dist(left[bi]!.c, cursor)) bi = i })
    const next = left.splice(bi, 1)[0]!
    out.push(next)
    cursor = next.c
  }
  return out
}

/**
 * @param start where the scope enters: 'lowest' (anus) or 'highest' (mouth/larynx)
 *   picks the first segment's entry end by vertical position.
 */
export function traceCenterline(segments: SegmentSurface[], start: 'lowest' | 'highest'): Centerline {
  if (!segments.length) throw new Error('No segments to trace')
  const nodes: CenterlineNode[] = []
  const boundaries: number[] = []
  let cursor: Vec3 | null = null

  segments.forEach((segment, index) => {
    if (segment.points.length < 8) throw new Error(`${segment.id} has too few vertices to trace`)
    const k = Math.max(3, Math.min(12, Math.round(segment.points.length / 12)))
    const sections = clusters(segment.points, k).map((g) => {
      const c = mean(g)
      return { c, r: g.reduce((sum, p) => sum + dist(p, c), 0) / g.length }
    })
    if (!cursor) {
      const ys = sections.map((s) => s.c[1])
      const target = start === 'lowest' ? Math.min(...ys) : Math.max(...ys)
      const entry = sections.find((s) => s.c[1] === target)!
      cursor = sub(entry.c, [0, start === 'lowest' ? 0.001 : -0.001, 0])
    }
    const ordered = chain(sections, cursor)
    boundaries.push(nodes.length)
    for (const s of ordered) nodes.push({ p: s.c, r: s.r, segment: index })
    cursor = ordered[ordered.length - 1]!.c
  })

  // Light smoothing removes the cluster jitter while keeping the ends fixed.
  const smooth = nodes.map((node, i) => {
    if (i === 0 || i === nodes.length - 1) return node
    const a = nodes[i - 1]!
    const b = nodes[i + 1]!
    return {
      ...node,
      p: [0, 1, 2].map((ax) => (a.p[ax]! + 2 * node.p[ax]! + b.p[ax]!) / 4) as Vec3,
      r: (a.r + 2 * node.r + b.r) / 4,
    }
  })

  const lengths = [0]
  for (let i = 1; i < smooth.length; i++) lengths.push(lengths[i - 1]! + dist(smooth[i - 1]!.p, smooth[i]!.p))
  const total = lengths[lengths.length - 1] || 1
  return {
    nodes: smooth,
    segmentStarts: boundaries.map((i) => lengths[i]! / total),
    labels: segments.map((s) => s.label),
  }
}

/** Index of the segment the scope is in at normalised position t. */
export function segmentAt(line: Centerline, t: number): number {
  let index = 0
  line.segmentStarts.forEach((s, i) => { if (t >= s - 1e-9) index = i })
  return index
}
