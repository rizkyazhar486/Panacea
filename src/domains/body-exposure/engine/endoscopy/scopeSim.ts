// Teaching simulator for a flexible scope moving along a reference lumen. Pure and deterministic: the caller passes
// dt and the input; no clock, no randomness, no DOM. It models what a learner feels on a trainer — push/pull, tip
// angulation, the shaft drifting toward the wall it is aimed at, "red-out" when the lens meets mucosa, and the lumen
// opening with air and collapsing with suction — on a REFERENCE route. It does not estimate any patient's anatomy,
// insertion distance, force, device setting or a safe trajectory.

import type { LumenSlice } from './lumenPath.ts'

export interface RouteProfile {
  /** Arc length of each sample along the route (m), ascending, starting at 0. */
  s: number[]
  /** Reference lumen radius at each sample (m). */
  r: number[]
  length: number
}

export interface ScopeState {
  /** Distance along the reference route (m). */
  s: number
  /** Tip offset from the centre line in the local frame (m). */
  ox: number
  oy: number
  /** Current tip angulation (rad). */
  yaw: number
  pitch: number
  /** 0 = collapsed lumen, 1 = fully insufflated. */
  insuf: number
  /** Lens against the wall: red-out. */
  contact: boolean
  /** Pushing into the wall: the tip does not advance. */
  blocked: boolean
  time: number
}

export interface ScopeInput {
  /** -1 withdraw … 1 advance. */
  push: number
  /** Requested angulation, -1 … 1 on each axis. */
  aimYaw: number
  aimPitch: number
  air: boolean
  suction: boolean
}

export const SCOPE = {
  MAX_ANGLE: 0.85,
  SPEED: 0.045,
  STEER_RATE: 5,
  AIR_RATE: 0.45,
  SUCTION_RATE: 0.9,
  LEAK_RATE: 0.025,
  /** Fraction of the reference radius left when no air is in the lumen. */
  COLLAPSED: 0.55,
  /** Lens contact once the tip is this fraction of the open radius off centre. */
  CONTACT: 0.78,
  /** How fast the shaft re-centres per metre travelled. */
  CENTRING: 7,
  MIN_RADIUS: 0.004,
  MAX_DT: 0.25,
} as const

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** Radius profile by arc length from a centre line. Null for fewer than 2 slices, non-finite or zero-length input. */
export function routeProfile(slices: readonly LumenSlice[]): RouteProfile | null {
  if (slices.length < 2) return null
  const s = [0], r: number[] = []
  for (let i = 0; i < slices.length; i++) {
    const c = slices[i]
    if (![c.x, c.y, c.z, c.r].every(Number.isFinite) || c.r < 0) return null
    r.push(Math.max(SCOPE.MIN_RADIUS, c.r))
    if (i) s.push(s[i - 1] + Math.hypot(c.x - slices[i - 1].x, c.y - slices[i - 1].y, c.z - slices[i - 1].z))
  }
  const length = s[s.length - 1]
  return length > 0 ? { s, r, length } : null
}

/** Reference radius at arc length s, linearly interpolated and clamped to the route. */
export function radiusAt(p: RouteProfile, s: number): number {
  if (!Number.isFinite(s)) return p.r[0]
  if (s <= 0) return p.r[0]
  if (s >= p.length) return p.r[p.r.length - 1]
  let lo = 0, hi = p.s.length - 1
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p.s[m] <= s) lo = m; else hi = m }
  const span = p.s[hi] - p.s[lo]
  const k = span > 0 ? (s - p.s[lo]) / span : 0
  return p.r[lo] + (p.r[hi] - p.r[lo]) * k
}

/** Lumen opening factor for an insufflation level. */
export const openFactor = (insuf: number) => SCOPE.COLLAPSED + (1 - SCOPE.COLLAPSED) * clamp(Number.isFinite(insuf) ? insuf : 0, 0, 1)

export function initialScope(insuf = 0.35): ScopeState {
  return { s: 0, ox: 0, oy: 0, yaw: 0, pitch: 0, insuf: clamp(insuf, 0, 1), contact: false, blocked: false, time: 0 }
}

/**
 * One simulation step. Invalid dt or input (non-finite, dt <= 0 or > MAX_DT) returns the same state object unchanged,
 * so a bad frame can never teleport the scope.
 */
export function stepScope(st: ScopeState, input: ScopeInput, dt: number, p: RouteProfile): ScopeState {
  if (!(dt > 0 && dt <= SCOPE.MAX_DT)) return st
  if (![input.push, input.aimYaw, input.aimPitch].every(Number.isFinite)) return st
  const k = Math.min(1, dt * SCOPE.STEER_RATE)
  const yaw = st.yaw + (clamp(input.aimYaw, -1, 1) * SCOPE.MAX_ANGLE - st.yaw) * k
  const pitch = st.pitch + (clamp(input.aimPitch, -1, 1) * SCOPE.MAX_ANGLE - st.pitch) * k

  let insuf = st.insuf
  if (input.air) insuf += SCOPE.AIR_RATE * dt
  if (input.suction) insuf -= SCOPE.SUCTION_RATE * dt
  if (!input.air && !input.suction) insuf -= SCOPE.LEAK_RATE * dt
  insuf = clamp(insuf, 0, 1)

  const ds = clamp(input.push, -1, 1) * SCOPE.SPEED * dt
  let ox = st.ox, oy = st.oy
  // Advancing carries the tip toward where it points; any travel lets the shaft settle back toward the centre line.
  if (ds > 0) { ox += ds * Math.sin(yaw); oy += ds * Math.sin(pitch) }
  const settle = Math.min(1, Math.abs(ds) * SCOPE.CENTRING)
  ox -= ox * settle
  oy -= oy * settle

  const lim = SCOPE.CONTACT * radiusAt(p, st.s) * openFactor(insuf)
  const d = Math.hypot(ox, oy)
  const contact = d >= lim
  if (d > lim) { ox *= lim / d; oy *= lim / d }
  const intoWall = ox * Math.sin(yaw) + oy * Math.sin(pitch) > 0
  const blocked = contact && ds > 0 && intoWall
  const s = blocked ? st.s : clamp(st.s + ds, 0, p.length)
  return { s, ox, oy, yaw, pitch, insuf, contact, blocked, time: st.time + dt }
}

export type WallPattern = 'colon' | 'oesophagus' | 'stomach' | 'duodenum' | 'trachea' | 'bronchus'

export interface WallFold {
  /** Inward displacement that stays with air (fraction 0..1). */
  fixed: number
  /** Inward displacement that flattens as the lumen is insufflated (0..1). */
  collapsible: number
  /** Crest of a fold or cartilage ring (0..1), for shading. */
  ridge: number
}

const ZERO: WallFold = { fixed: 0, collapsible: 0, ridge: 0 }
const bump = (x: number, w: number) => Math.exp(-(x * x) / (w * w))
const frac = (x: number) => x - Math.floor(x)

/**
 * Simulated mucosal relief by region, keyed by angle around the lumen (theta, rad; 0 = anterior) and arc length s (m).
 * These are textbook surface patterns — haustra between three taeniae, oesophageal longitudinal folds, gastric rugae,
 * duodenal circular folds, C-shaped tracheal cartilage with a flat posterior membrane — drawn on the reference route,
 * not measured from anyone.
 */
export function wallFold(pattern: WallPattern, theta: number, s: number): WallFold {
  if (!Number.isFinite(theta) || !Number.isFinite(s)) return ZERO
  switch (pattern) {
    case 'colon': {
      // Three taeniae pull the wall in (triangular lumen); semilunar haustral folds sit between them every ~4.5 cm.
      const taenia = Math.pow(0.5 + 0.5 * Math.cos(3 * theta), 4)
      const fold = bump(frac(s / 0.045) - 0.5, 0.11) * (0.35 + 0.65 * (1 - taenia))
      return { fixed: clamp(0.22 * taenia + 0.75 * fold, 0, 1), collapsible: 0.3 * (1 - taenia), ridge: fold }
    }
    case 'oesophagus': {
      const f = Math.pow(0.5 + 0.5 * Math.cos(8 * theta + 0.6 * Math.sin(s * 45)), 2)
      return { fixed: 0.04 * f, collapsible: f, ridge: f * 0.4 }
    }
    case 'stomach': {
      const f = Math.pow(0.5 + 0.5 * Math.cos(11 * theta + 2.2 * Math.sin(s * 22)), 3)
      return { fixed: 0.1 * f, collapsible: 0.7 * f, ridge: f }
    }
    case 'duodenum': {
      const f = Math.pow(0.5 + 0.5 * Math.cos((2 * Math.PI * s) / 0.011 + 0.7 * Math.cos(theta)), 6)
      return { fixed: 0.42 * f, collapsible: 0.15, ridge: f }
    }
    case 'trachea':
    case 'bronchus': {
      const spacing = pattern === 'trachea' ? 0.0042 : 0.0032
      const ring = Math.pow(0.5 + 0.5 * Math.cos((2 * Math.PI * s) / spacing), 2)
      // Trachea: cartilage is C-shaped, the posterior third is a flat membranous wall that bulges in on collapse.
      const posterior = pattern === 'trachea' ? bump(Math.cos(theta) + 1, 0.45) : 0
      return { fixed: 0.07 * ring * (1 - posterior), collapsible: 0.25 * posterior, ridge: ring * (1 - posterior) }
    }
    default:
      return ZERO
  }
}
