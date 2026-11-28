// Scope route through the airway tree. The scope always travels one chain root → current branch, plus at most one
// "next" child: the opening it is aimed at. Near the end of a branch the learner chooses that child by aiming (or by
// tapping its label); pulling back into a parent keeps the branch just left as the next one. Pure and deterministic.

import type { LumenSlice } from './lumenPath.ts'
import { routeProfile, type RouteProfile } from './scopeSim.ts'
import type { AirwayBranch } from './airwayTree.ts'

export interface AirwayRoute {
  /** Branch indices, root first; each is a child of the one before. */
  path: number[]
  slices: LumenSlice[]
  /** Arc length (m) at the first and last slice of each path element. */
  starts: number[]
  ends: number[]
  profile: RouteProfile
}

/** Root → branch indices. Empty for an unknown branch or a broken parent chain. */
export function indexPath(branches: readonly AirwayBranch[], at: number): number[] {
  const out: number[] = []
  let i = at, guard = 0
  while (i >= 0 && i < branches.length && guard++ <= branches.length) { out.unshift(i); i = branches[i].parent }
  return out.length && branches[out[0]].parent === -1 ? out : []
}

/** Centre line along a chain from the root. Null when the path is empty, not a parent→child chain, or degenerate. */
export function airwayRoute(branches: readonly AirwayBranch[], path: readonly number[]): AirwayRoute | null {
  if (!path.length || branches[path[0]]?.parent !== -1) return null
  const slices: LumenSlice[] = []
  const first: number[] = [], last: number[] = []
  for (let i = 0; i < path.length; i++) {
    const b = branches[path[i]]
    if (!b || (i > 0 && b.parent !== path[i - 1])) return null
    let from = 0
    const prev = slices[slices.length - 1]
    if (prev && Math.hypot(prev.x - b.slices[0].x, prev.y - b.slices[0].y, prev.z - b.slices[0].z) < 1e-6) from = 1
    first.push(slices.length - (from ? 1 : 0))
    slices.push(...b.slices.slice(from))
    last.push(slices.length - 1)
  }
  const profile = routeProfile(slices)
  if (!profile) return null
  return { path: [...path], slices, starts: first.map((k) => profile.s[k]), ends: last.map((k) => profile.s[k]), profile }
}

/** Position in `route.path` of the branch holding arc length s (the gap after a branch end still belongs to it). */
export function routeBranchAt(route: AirwayRoute, s: number): number {
  if (!Number.isFinite(s)) return 0
  let i = 0
  for (let k = 1; k < route.starts.length; k++) if (s > route.starts[k]) i = k
  return i
}

/**
 * The path the scope should be on now, or null when the current route already is it. `aimed` is the child the tip
 * points at (-1 for none) and is only honoured within `zone` metres before the current branch's end; `locked` (-1 for
 * none) is a child the learner picked by name and wins over aim.
 */
export function nextAirwayPath(branches: readonly AirwayBranch[], route: AirwayRoute, s: number, aimed: number, locked: number, zone = 0.015): number[] | null {
  const i = routeBranchAt(route, s)
  const current = route.path[i]
  const base = route.path.slice(0, i + 1)
  const kids = branches[current]?.children ?? []
  let want = base
  if (kids.length) {
    const next = route.path[i + 1]
    const enteringNext = next !== undefined && s > route.ends[i]
    let choose = next !== undefined && kids.includes(next) ? next : kids[0]
    if (!enteringNext) {
      if (kids.includes(locked)) choose = locked
      else if (kids.includes(aimed) && s >= route.ends[i] - zone) choose = aimed
    }
    want = [...base, choose]
  }
  return want.length === route.path.length && want.every((v, k) => v === route.path[k]) ? null : want
}
