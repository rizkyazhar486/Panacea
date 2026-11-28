// Subsegmental airways from the atlas itself. Each segmental bronchus mesh in Z-Anatomy / BodyParts3D is not one tube
// but several separate tube pieces ("islands") that leave each other part-way along the shaft. Splitting the mesh into
// islands, orienting each from where it touches the tree, and cutting a host piece where another leaves it gives the
// reference subsegmental branching — measured from the meshes, not drawn. Pure and deterministic.
// Numbering is atlas order (RB1-1, RB1-2 …), NOT the Boyden a/b/c letters: which piece is "a" is not encoded in the
// atlas, so no letter is claimed.

import { segmentCentreline, type LumenSlice } from './lumenPath.ts'
import { routeProfile } from './scopeSim.ts'
import type { AirwayBranch, Vec3 } from './airwayTree.ts'

/**
 * Splits a triangle mesh into its connected pieces. Vertices at the same position (within `weld` m) count as joined,
 * so a mesh with duplicated seam vertices is still one piece. `index` null means non-indexed triangles.
 */
export function meshIslands(positions: ArrayLike<number>, index: ArrayLike<number> | null, weld = 1e-5): Float32Array[] {
  const n = Math.floor(positions.length / 3)
  if (!n || !(weld > 0)) return []
  const par = new Int32Array(n)
  for (let i = 0; i < n; i++) par[i] = i
  const find = (x: number) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x] } return x }
  const join = (a: number, b: number) => { const ra = find(a), rb = find(b); if (ra !== rb) par[Math.max(ra, rb)] = Math.min(ra, rb) }
  const tri = index ? index.length : n
  for (let t = 0; t + 2 < tri; t += 3) {
    const a = index ? index[t] : t, b = index ? index[t + 1] : t + 1, c = index ? index[t + 2] : t + 2
    if (a < n && b < n && c < n) { join(a, b); join(a, c) }
  }
  const seen = new Map<string, number>()
  for (let i = 0; i < n; i++) {
    const k = `${Math.round(positions[i * 3] / weld)},${Math.round(positions[i * 3 + 1] / weld)},${Math.round(positions[i * 3 + 2] / weld)}`
    const j = seen.get(k)
    if (j === undefined) seen.set(k, i)
    else join(i, j)
  }
  const groups = new Map<number, number[]>()
  for (let i = 0; i < n; i++) {
    const r = find(i)
    let g = groups.get(r)
    if (!g) { g = []; groups.set(r, g) }
    g.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
  }
  return [...groups.values()].map((g) => new Float32Array(g))
}

export interface IslandPiece {
  slices: LumenSlice[]
  /** Index of the parent piece; -1 for the first piece, which continues the tree from `origin`. */
  parent: number
}

const d3 = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

function extent(p: ArrayLike<number>): number {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity
  for (let i = 0; i + 2 < p.length; i += 3) {
    x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2])
  }
  return Math.hypot(x1 - x0, y1 - y0, z1 - z0)
}

/**
 * Orders islands into a tree. The island with an end nearest `origin` is placed first (that end becomes its start);
 * every other island is then placed, nearest first, starting from the end closest to any placed centre line, and
 * attached to the nearest slice there. A host is cut where a child leaves it, so each cut ends in a real bifurcation:
 * the host's continuation and the child. Returns pieces parent-first, or null when no island has a usable centre line.
 */
export function islandTree(origin: Vec3, islands: readonly ArrayLike<number>[], binLength = 0.003): IslandPiece[] | null {
  if (![origin.x, origin.y, origin.z].every(Number.isFinite) || !(binLength > 0)) return null
  const lines: LumenSlice[][] = []
  const verts: ArrayLike<number>[] = []
  for (const isl of islands) {
    const bins = Math.max(3, Math.min(32, Math.round(extent(isl) / binLength)))
    const c = segmentCentreline(isl, bins)
    if (c && c.length >= 2) { lines.push(c); verts.push(isl) }
  }
  if (!lines.length) return null
  // Islands touch the tree with their wall, so "where does it touch" is the closest mesh vertex, not the closest
  // centre-line end; the end nearest that contact becomes the island's start.
  const placed: LumenSlice[][] = []
  const attach: { host: number; k: number }[] = []
  const left = new Set(lines.map((_, i) => i))
  while (left.size) {
    let best = { d: Infinity, i: -1, host: -1, k: 0, at: origin as Vec3 }
    for (const i of left) {
      const v = verts[i]
      for (let q = 0; q + 2 < v.length; q += 9) {
        const p = { x: v[q], y: v[q + 1], z: v[q + 2] }
        if (!placed.length) {
          const d = d3(p, origin)
          if (d < best.d) best = { d, i, host: -1, k: 0, at: origin }
          continue
        }
        for (let h = 0; h < placed.length; h++) {
          const line = placed[h]
          for (let k = 0; k < line.length; k++) {
            const d = d3(p, line[k])
            if (d < best.d) best = { d, i, host: h, k, at: line[k] }
          }
        }
      }
    }
    const c = lines[best.i].slice()
    if (d3(c[c.length - 1], best.at) < d3(c[0], best.at)) c.reverse()
    left.delete(best.i)
    placed.push(c)
    attach.push({ host: best.host, k: best.k })
  }
  // Cut points per placed line. A child attached at the very start is moved to the first cut so the host keeps a
  // short common trunk; one attached at the end hangs off the last piece without a cut.
  const cuts = placed.map(() => new Set<number>())
  attach.forEach((a, i) => {
    if (a.host < 0) return
    const last = placed[a.host].length - 1
    const k = Math.max(1, Math.min(last, a.k))
    attach[i] = { host: a.host, k }
    if (k < last) cuts[a.host].add(k)
  })
  // Merge cuts one slice apart; the merged cut keeps the lower index.
  const bounds = placed.map((line, h) => {
    const ks = [...cuts[h]].sort((x, y) => x - y)
    const out = [0]
    for (const k of ks) if (k - out[out.length - 1] > 1) out.push(k)
    out.push(line.length - 1)
    return out
  })
  const pieces: IslandPiece[] = []
  const pending: { line: number; parent: number }[] = [{ line: 0, parent: -1 }]
  const childrenAt = (h: number, k: number) => attach.map((a, i) => ({ a, i })).filter(({ a, i }) => i > 0 && a.host === h && boundFor(h, a.k) === k).map(({ i }) => i)
  // The piece end a child hangs from: the nearest bound after the start (a merged cut moved it by one slice).
  const boundFor = (h: number, k: number) => bounds[h].slice(1).reduce((best, b) => (Math.abs(b - k) < Math.abs(best - k) ? b : best))
  while (pending.length) {
    const { line, parent } = pending.shift()!
    const b = bounds[line]
    let prev = parent
    for (let j = 0; j + 1 < b.length; j++) {
      const id = pieces.length
      pieces.push({ slices: placed[line].slice(b[j], b[j + 1] + 1), parent: prev })
      for (const ch of childrenAt(line, b[j + 1])) pending.push({ line: ch, parent: id })
      prev = id
    }
  }
  return pieces
}

/**
 * Replaces each terminal branch by its atlas subsegmental tree. `islandsFor` returns the separate tube pieces of that
 * branch's mesh (world space), or null to leave it as is. New branches are appended parent-first; codes are the
 * segmental code plus an atlas-order number.
 */
export function withSubsegments(branches: readonly AirwayBranch[], islandsFor: (b: AirwayBranch) => readonly ArrayLike<number>[] | null): AirwayBranch[] {
  const out: AirwayBranch[] = branches.map((b) => ({ ...b, children: [...b.children] }))
  const leaves = out.map((b, i) => ({ b, i })).filter(({ b }) => !b.children.length && b.parent >= 0)
  for (const { b, i } of leaves) {
    const isl = islandsFor(b)
    if (!isl || isl.length < 2) continue
    const host = out[b.parent].slices
    const pieces = islandTree(host[host.length - 1], isl)
    if (!pieces || pieces.length < 2) continue
    const first = routeProfile(pieces[0].slices)
    if (!first) continue
    out[i] = { ...out[i], slices: pieces[0].slices, profile: first }
    const idOf = new Map<number, number>([[0, i]])
    let n = 0
    for (let p = 1; p < pieces.length; p++) {
      const parent = idOf.get(pieces[p].parent)
      if (parent === undefined) continue
      const cap = Math.min(...out[parent].slices.map((s) => s.r))
      const slices = pieces[p].slices.map((s) => ({ ...s, r: Math.min(s.r, cap) }))
      const profile = routeProfile(slices)
      if (!profile) continue
      n++
      const depth = parent === i ? 'Subsegmental' : 'Smaller'
      idOf.set(p, out.length)
      out[parent].children.push(out.length)
      out.push({ id: `${b.id}.${n}`, code: `${b.code}-${n}`, name: `${depth} branch of ${b.code} (atlas no. ${n})`, parent, children: [], slices, profile })
    }
  }
  return out
}
