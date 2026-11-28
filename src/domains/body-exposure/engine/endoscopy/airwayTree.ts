// Branching airway for the bronchoscopy simulator. Pure and deterministic. Each bronchus' centre line is computed
// from its own reference shaft mesh (lumenPath), oriented to start at its parent's distal end, so the tree is the
// atlas' tree. Navigation picks the child whose opening the scope tip is aimed at — the skill a learner practises —
// and pulling back past a branch's origin returns to its parent. Reference anatomy only; no patient airway.

import { lumenPath, type LumenSlice } from './lumenPath.ts'
import { routeProfile, type RouteProfile } from './scopeSim.ts'

export interface Vec3 { x: number; y: number; z: number }

export interface AirwayBranchDef { id: string; parent: string | null; code: string; name: string }

export interface AirwayBranch {
  id: string
  code: string
  name: string
  /** Index of the parent branch, -1 for the root. */
  parent: number
  children: number[]
  slices: LumenSlice[]
  profile: RouteProfile
}

export type AirwayTreeResult =
  | { ok: true; branches: AirwayBranch[] }
  | { ok: false; reason: 'no-root' | 'multiple-roots' | 'unknown-parent' | 'duplicate-id' | 'geometry'; id?: string }

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z)
const unit = (a: Vec3): Vec3 | null => { const l = len(a); return l > 0 && Number.isFinite(l) ? { x: a.x / l, y: a.y / l, z: a.z / l } : null }

/**
 * Builds the tree. Definitions must list a parent before its children (exactly one root). `positions(id)` returns the
 * world-space vertices of that bronchus' shaft; `bins(depth)` sets centre-line resolution by generation.
 */
export function buildAirwayTree(
  defs: readonly AirwayBranchDef[],
  positions: (id: string) => ArrayLike<number>,
  rootStartNear: Vec3,
  bins: (depth: number) => number = (d) => (d === 0 ? 16 : d === 1 ? 8 : 6),
  /**
   * Terminal (segmental) meshes in the atlas carry their whole sub-tree, so their centre line would wander off into
   * subsegments. For branches without children only vertices within this distance (m) of the parent's distal end
   * are used: the proximal segmental bronchus that a scope actually enters. 0 disables.
   */
  leafReach = 0.035,
): AirwayTreeResult {
  const hasChild = new Set(defs.map((d) => d.parent).filter((p): p is string => p !== null))
  const index = new Map<string, number>()
  const branches: AirwayBranch[] = []
  const depth: number[] = []
  const attachAt: number[] = []
  for (const d of defs) {
    if (index.has(d.id)) return { ok: false, reason: 'duplicate-id', id: d.id }
    let parent = -1
    if (d.parent === null) {
      if (branches.length) return { ok: false, reason: 'multiple-roots', id: d.id }
    } else {
      const p = index.get(d.parent)
      if (p === undefined) return { ok: false, reason: 'unknown-parent', id: d.id }
      parent = p
    }
    const level = parent === -1 ? 0 : depth[parent] + 1
    let pts = positions(d.id)
    // A daughter leaves its parent where its mesh comes closest to the parent's centre line: often the distal end,
    // but not always (RB6 leaves the lower-lobe bronchus near its origin, before the basal trunk).
    const k = parent === -1 ? -1 : nearestSlice(branches[parent].slices, pts)
    const start = parent === -1 ? rootStartNear : branches[parent].slices[k]
    if (parent >= 0 && leafReach > 0 && !hasChild.has(d.id)) pts = within(pts, start, leafReach)
    // At least one slice per ~4 mm of mesh, so a takeoff part-way along a lobar bronchus lands on its own slice.
    const r = lumenPath([{ label: d.id, positions: pts }], Math.max(bins(level), Math.min(32, Math.round(meshExtent(pts) / 0.004))), start)
    if (!r.ok) return { ok: false, reason: 'geometry', id: d.id }
    // A daughter bronchus is never wider than its parent; vertex-spread radius estimates can say otherwise.
    if (parent >= 0) {
      const cap = Math.min(...branches[parent].slices.map((x) => x.r))
      for (const sl of r.slices) sl.r = Math.min(sl.r, cap)
    }
    const profile = routeProfile(r.slices)
    if (!profile) return { ok: false, reason: 'geometry', id: d.id }
    index.set(d.id, branches.length)
    attachAt.push(k)
    depth.push(level)
    branches.push({ id: d.id, code: d.code, name: d.name, parent, children: [], slices: r.slices, profile })
    if (parent >= 0) branches[parent].children.push(branches.length - 1)
  }
  if (!branches.length) return { ok: false, reason: 'no-root' }
  return splitAtTakeoffs(branches, attachAt)
}

/** Parent slice nearest to any vertex of a daughter mesh (every 3rd vertex is enough at atlas density). */
function nearestSlice(slices: readonly LumenSlice[], pts: ArrayLike<number>): number {
  let best = slices.length - 1, bd = Infinity
  for (let i = 0; i + 2 < pts.length; i += 9) {
    for (let k = 0; k < slices.length; k++) {
      const s = slices[k]
      const d = (pts[i] - s.x) ** 2 + (pts[i + 1] - s.y) ** 2 + (pts[i + 2] - s.z) ** 2
      if (d < bd) { bd = d; best = k }
    }
  }
  return best
}

/**
 * Cuts a parent wherever a daughter leaves it before its distal end, so every bifurcation is a branch end: the
 * proximal piece keeps the parent's id, the rest becomes "<name> (beyond <codes>)" — e.g. the basal trunk of the
 * lower-lobe bronchus beyond RB6. Continuation branches are appended after all defined branches.
 */
function splitAtTakeoffs(input: AirwayBranch[], attachAt: readonly number[]): AirwayTreeResult {
  const branches = input
  const count = branches.length
  for (let p = 0; p < count; p++) {
    const last = branches[p].slices.length - 1
    const kids = branches[p].children.map((c) => ({ c, k: Math.max(1, Math.min(last, attachAt[c])) }))
    const cuts: number[] = []
    for (const k of [...new Set(kids.map((x) => x.k))].sort((a, b) => a - b)) if (k < last && k - (cuts[cuts.length - 1] ?? 0) > 1) cuts.push(k)
    if (!cuts.length) continue
    const bounds = [0, ...cuts, last]
    const endOf = (k: number) => bounds.slice(1).reduce((b, x) => (Math.abs(x - k) < Math.abs(b - k) ? x : b))
    const all = branches[p].slices
    const { id, code, name } = branches[p]
    let prev = p
    for (let j = 0; j + 1 < bounds.length; j++) {
      const slices = all.slice(bounds[j], bounds[j + 1] + 1)
      const profile = routeProfile(slices)
      if (!profile) return { ok: false, reason: 'geometry', id }
      const here = kids.filter((x) => endOf(x.k) === bounds[j + 1]).map((x) => x.c)
      let at = p
      if (j === 0) branches[p] = { ...branches[p], slices, profile, children: [] }
      else {
        const before = kids.filter((x) => endOf(x.k) <= bounds[j]).map((x) => branches[x.c].code).join(', ')
        at = branches.length
        branches.push({ id: `${id}>${j}`, code, name: `${name} (beyond ${before})`, parent: prev, children: [], slices, profile })
        branches[prev].children.push(at)
      }
      for (const c of here) { branches[c] = { ...branches[c], parent: at }; branches[at].children.push(c) }
      prev = at
    }
  }
  return { ok: true, branches }
}

function meshExtent(p: ArrayLike<number>): number {
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity
  for (let i = 0; i + 2 < p.length; i += 3) {
    x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2])
  }
  return Number.isFinite(x0) ? Math.hypot(x1 - x0, y1 - y0, z1 - z0) : 0
}

function within(pts: ArrayLike<number>, c: Vec3, reach: number): Float32Array {
  const out: number[] = []
  const r2 = reach * reach
  for (let i = 0; i + 2 < pts.length; i += 3) {
    const dx = pts[i] - c.x, dy = pts[i + 1] - c.y, dz = pts[i + 2] - c.z
    if (dx * dx + dy * dy + dz * dz <= r2) out.push(pts[i], pts[i + 1], pts[i + 2])
  }
  return new Float32Array(out)
}

/** Initial direction of a branch (from its first slice toward its third, or last if shorter). */
export function branchDirection(b: AirwayBranch): Vec3 | null {
  const s = b.slices
  if (s.length < 2) return null
  return unit(sub(s[Math.min(2, s.length - 1)], s[0]))
}

/**
 * The opening the scope is aimed at: the child whose origin lies most nearly along the look direction from the tip.
 * Returns -1 when there is no child, the look direction is invalid, or every child lies behind the tip.
 */
export function chooseChild(branches: readonly AirwayBranch[], at: number, tip: Vec3, look: Vec3): number {
  const b = branches[at]
  const l = unit(look)
  if (!b || !l || ![tip.x, tip.y, tip.z].every(Number.isFinite)) return -1
  let best = -1, bestCos = 0
  for (const c of b.children) {
    const ch = branches[c]
    // Aim at a point a little way into the child, so a short child still has a well-defined direction.
    const into = ch.slices[Math.min(2, ch.slices.length - 1)]
    const d = unit(sub(into, tip))
    if (!d) continue
    const cos = d.x * l.x + d.y * l.y + d.z * l.z
    if (cos > bestCos) { bestCos = cos; best = c }
  }
  return best
}

/** Codes from the root to a branch, for a breadcrumb such as Trachea › RMB › RUL › RB1. */
export function airwayPath(branches: readonly AirwayBranch[], at: number): string[] {
  const out: string[] = []
  let i = at
  let guard = 0
  while (i >= 0 && i < branches.length && guard++ < branches.length) { out.unshift(branches[i].code); i = branches[i].parent }
  return out
}

export interface AirwayCapsule { a: Vec3; ra: number; b: Vec3; rb: number; branch: number; s0: number; generation: number }

/**
 * Wall primitives for rendering: consecutive centre-line slices as round cones, plus a connector from each parent's
 * distal end to its child's first slice, so every bifurcation is closed. `s0` is arc length along the branch.
 */
export function airwayCapsules(branches: readonly AirwayBranch[]): AirwayCapsule[] {
  const out: AirwayCapsule[] = []
  const gen = (i: number) => { let g = 0, k = branches[i].parent; while (k >= 0) { g++; k = branches[k].parent } return g }
  branches.forEach((b, i) => {
    const g = gen(i)
    if (b.parent >= 0) {
      const p = branches[b.parent].slices[branches[b.parent].slices.length - 1]
      const c = b.slices[0]
      out.push({ a: p, ra: Math.min(p.r, c.r * 1.15), b: c, rb: c.r, branch: i, s0: 0, generation: g })
    }
    for (let k = 0; k + 1 < b.slices.length; k++) {
      const a = b.slices[k], c = b.slices[k + 1]
      out.push({ a, ra: a.r, b: c, rb: c.r, branch: i, s0: b.profile.s[k], generation: g })
    }
  })
  return out
}

/** Distance from p to a capsule's segment (axis), for picking the nearest primitives each frame. */
export function capsuleAxisDistance(c: AirwayCapsule, p: Vec3): number {
  const ab = sub(c.b, c.a), ap = sub(p, c.a)
  const l2 = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z
  const h = l2 > 0 ? Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / l2)) : 0
  return len({ x: ap.x - ab.x * h, y: ap.y - ab.y * h, z: ap.z - ab.z * h })
}

/** Indices of the `max` capsules nearest p, nearest first. Deterministic tie-break by index. */
export function nearestCapsules(caps: readonly AirwayCapsule[], p: Vec3, max: number): number[] {
  if (!(max > 0)) return []
  return caps
    .map((c, i) => ({ i, d: capsuleAxisDistance(c, p) }))
    .sort((x, y) => x.d - y.d || x.i - y.i)
    .slice(0, Math.floor(max))
    .map((x) => x.i)
}
