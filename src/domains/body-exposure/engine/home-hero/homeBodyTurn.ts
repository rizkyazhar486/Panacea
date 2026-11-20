// Turning Home's atlas body and tilting its stage: pure maths for the turntable sprite baked by
// scripts/bangun/bake-home-body.mjs (frame i = i×360/frames degrees about the body's vertical axis).
//
// Deterministic: time and pointer positions are measured by the caller and passed in. Invalid input fails closed to
// "no turn / no tilt" (the front view, where the hotspots are true), never to a guessed angle.

/** Signed angle in (-180, 180]. Not finite → null. */
export function wrapDeg(deg: number): number | null {
  if (!Number.isFinite(deg)) return null
  const r = ((deg % 360) + 360) % 360
  return r > 180 ? r - 360 : r
}

/** Sprite frame for an angle: the nearest of `frames` evenly spaced views. Invalid → null. */
export function turnFrame(deg: number, frames: number): number | null {
  const w = wrapDeg(deg)
  if (w === null || !Number.isInteger(frames) || frames < 1) return null
  const step = 360 / frames
  return ((Math.round(((w + 360) % 360) / step) % frames) + frames) % frames
}

/** True when the angle shows the front frame, the only view the hotspots were projected for. Invalid → true. */
export function isFront(deg: number, frames: number): boolean {
  const f = turnFrame(deg, frames)
  return f === null || f === 0
}

/**
 * Angle while dragging: a drag across the full stage width turns the body once (`degPerWidth`). Dragging right turns
 * the body to its left, like grabbing a turntable. Invalid → null (caller keeps the last valid angle).
 */
export function dragAngle(startDeg: number, dxPx: number, widthPx: number, degPerWidth = 360): number | null {
  if (![startDeg, dxPx, widthPx, degPerWidth].every(Number.isFinite) || widthPx <= 0) return null
  return startDeg + (dxPx / widthPx) * degPerWidth
}

/**
 * One step of the spring back to the front after release: exponential decay along the shorter way round, with a
 * half-life of `halfLifeMs`. Snaps to exactly 0 under half a degree so the front image (and its hotspots) return.
 * Invalid or non-positive time → 0 (land on the front at once rather than hang mid-turn).
 */
export function settleStep(deg: number, dtMs: number, halfLifeMs = 160): number {
  const w = wrapDeg(deg)
  if (w === null || !Number.isFinite(dtMs) || dtMs <= 0 || !Number.isFinite(halfLifeMs) || halfLifeMs <= 0) return 0
  const next = w * Math.pow(0.5, dtMs / halfLifeMs)
  return Math.abs(next) < 0.5 ? 0 : next
}

/** One full turn for the 360 control, eased in and out: angle at `tMs` of a `durationMs` spin. Done or invalid → 0. */
export function spinAngle(tMs: number, durationMs: number): number {
  if (!Number.isFinite(tMs) || !Number.isFinite(durationMs) || durationMs <= 0 || tMs <= 0 || tMs >= durationMs) return 0
  const t = tMs / durationMs
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  return eased * 360
}

export interface Tilt { readonly rx: number; readonly ry: number }

/**
 * Parallax tilt of the stage from a pointer at (px, py) inside a w×h box: up to `maxDeg` either way, pointing the
 * stage towards the pointer. Outside the box is clamped to the edge. Invalid → null (no tilt).
 */
export function tiltFor(px: number, py: number, w: number, h: number, maxDeg = 6): Tilt | null {
  if (![px, py, w, h, maxDeg].every(Number.isFinite) || w <= 0 || h <= 0 || maxDeg < 0) return null
  const nx = Math.min(1, Math.max(-1, (px / w) * 2 - 1))
  const ny = Math.min(1, Math.max(-1, (py / h) * 2 - 1))
  const r = (v: number) => Math.round(v * 100) / 100 + 0
  return { rx: r(-ny * maxDeg), ry: r(nx * maxDeg) }
}
