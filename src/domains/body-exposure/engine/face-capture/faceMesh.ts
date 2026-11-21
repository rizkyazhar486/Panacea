// Step 2 of face-from-photo: turn the landmark points read from the aligned photo into a 3D surface. Pure: no DOM, no
// I/O. The points come from an on-device landmark model (adapters/face-capture); this file only triangulates them.
//
// Truth class: an estimate from one photo. Depth (z) from a single image is the model's inference, not a measurement,
// so the mesh is a likeness — never patient anatomy, never used for any clinical number (FACE_PHOTO_BOUNDARY).

export interface FacePoint { readonly x: number; readonly y: number; readonly z: number }

/** The face model gives 468 surface points, plus 10 iris points when iris refinement is on. */
export const FACE_SURFACE_POINTS = 468
const ACCEPTED_COUNTS = [468, 478]

/** A triangle edge longer than this many times the median edge bridges a gap (lips, eyes, outline) and is dropped. */
const MAX_EDGE_RATIO = 4.5

export interface FaceMesh {
  /** xyz per vertex, centred on the face and scaled so the face is 2 units tall. */
  readonly positions: Float32Array
  /** uv per vertex into the aligned photo (v = 0 at the bottom). */
  readonly uvs: Float32Array
  readonly indices: Uint32Array
  readonly vertexCount: number
  readonly triangleCount: number
}

type P2 = readonly [number, number]

/**
 * Delaunay triangulation (Bowyer–Watson). Returns index triples, counter-clockwise in y-down image space.
 * Points must be distinct and finite; duplicates are skipped rather than breaking the triangulation.
 */
export function delaunay(points: readonly P2[]): number[] {
  const n = points.length
  if (n < 3) return []
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of points) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return []
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  const d = Math.max(maxX - minX, maxY - minY) || 1
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
  // Super-triangle far outside every point; its vertices are n, n+1, n+2 and are removed at the end.
  const pts: P2[] = [...points, [cx - 20 * d, cy - d], [cx, cy + 20 * d], [cx + 20 * d, cy - d]]
  interface Tri { a: number; b: number; c: number; x: number; y: number; r2: number }
  const circum = (a: number, b: number, c: number): Tri | null => {
    const [ax, ay] = pts[a]!, [bx, by] = pts[b]!, [qx, qy] = pts[c]!
    const den = 2 * (ax * (by - qy) + bx * (qy - ay) + qx * (ay - by))
    if (Math.abs(den) < 1e-18) return null
    const a2 = ax * ax + ay * ay, b2 = bx * bx + by * by, c2 = qx * qx + qy * qy
    const x = (a2 * (by - qy) + b2 * (qy - ay) + c2 * (ay - by)) / den
    const y = (a2 * (qx - bx) + b2 * (ax - qx) + c2 * (bx - ax)) / den
    return { a, b, c, x, y, r2: (ax - x) ** 2 + (ay - y) ** 2 }
  }
  let tris: Tri[] = [circum(n, n + 1, n + 2)!]
  const seen = new Set<string>()
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[i]!
    const key = `${px},${py}`
    if (seen.has(key)) continue
    seen.add(key)
    const bad: Tri[] = [], keep: Tri[] = []
    for (const t of tris) ((px - t.x) ** 2 + (py - t.y) ** 2 < t.r2 ? bad : keep).push(t)
    // Boundary of the hole = edges that belong to exactly one bad triangle.
    const edges = new Map<string, [number, number]>()
    for (const t of bad) {
      for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]] as const) {
        const k = u < v ? `${u}_${v}` : `${v}_${u}`
        if (edges.has(k)) edges.delete(k)
        else edges.set(k, [u, v])
      }
    }
    for (const [u, v] of edges.values()) {
      const t = circum(u, v, i)
      if (t) keep.push(t)
    }
    tris = keep
  }
  const out: number[] = []
  for (const t of tris) {
    if (t.a >= n || t.b >= n || t.c >= n) continue
    const [ax, ay] = pts[t.a]!, [bx, by] = pts[t.b]!, [qx, qy] = pts[t.c]!
    const cross = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax)
    out.push(...(cross > 0 ? [t.a, t.b, t.c] : [t.a, t.c, t.b]))
  }
  return out
}

/**
 * Builds the 3D face from normalised landmarks (x, y in 0..1 of the square aligned photo, y down; z in the same scale
 * as x, negative towards the camera). Returns null — never a partial face — when the count is wrong, a value is not
 * finite, or the points collapse to nothing.
 */
export function buildFaceMesh(points: readonly FacePoint[]): FaceMesh | null {
  if (!ACCEPTED_COUNTS.includes(points.length)) return null
  const surface = points.slice(0, FACE_SURFACE_POINTS)
  if (!surface.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z))) return null
  const ys = surface.map((p) => p.y)
  const height = Math.max(...ys) - Math.min(...ys)
  if (!(height > 1e-6)) return null
  const cx = surface.reduce((s, p) => s + p.x, 0) / surface.length
  const cy = surface.reduce((s, p) => s + p.y, 0) / surface.length
  const cz = surface.reduce((s, p) => s + p.z, 0) / surface.length
  const k = 2 / height

  const tri = delaunay(surface.map((p) => [p.x, p.y] as const))
  const len = (i: number, j: number) => Math.hypot(surface[i]!.x - surface[j]!.x, surface[i]!.y - surface[j]!.y)
  const edgeLens: number[] = []
  for (let t = 0; t < tri.length; t += 3) edgeLens.push(len(tri[t]!, tri[t + 1]!), len(tri[t + 1]!, tri[t + 2]!), len(tri[t + 2]!, tri[t]!))
  const sorted = [...edgeLens].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0
  const kept: number[] = []
  for (let t = 0; t < tri.length; t += 3) {
    if (Math.max(edgeLens[t]!, edgeLens[t + 1]!, edgeLens[t + 2]!) > MAX_EDGE_RATIO * median) continue
    // Image space is y-down; flipping y below reverses winding, so swap two corners to keep faces front-facing.
    kept.push(tri[t]!, tri[t + 2]!, tri[t + 1]!)
  }
  if (kept.length === 0) return null

  const positions = new Float32Array(surface.length * 3)
  const uvs = new Float32Array(surface.length * 2)
  surface.forEach((p, i) => {
    positions[i * 3] = (p.x - cx) * k
    positions[i * 3 + 1] = -(p.y - cy) * k
    positions[i * 3 + 2] = -(p.z - cz) * k
    uvs[i * 2] = p.x
    uvs[i * 2 + 1] = 1 - p.y
  })
  return { positions, uvs, indices: Uint32Array.from(kept), vertexCount: surface.length, triangleCount: kept.length / 3 }
}

/** Where the aligned photo is drawn in a square canvas `size` px across, matching the CSS preview (object-fit: cover). */
export function coverRect(imageW: number, imageH: number, size: number): { w: number; h: number } | null {
  if (!(imageW > 0) || !(imageH > 0) || !(size > 0)) return null
  const s = size / Math.min(imageW, imageH)
  return { w: imageW * s, h: imageH * s }
}
