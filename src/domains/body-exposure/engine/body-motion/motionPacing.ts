// How often the simulation light may redraw the 3D body, decided from what the device actually delivers.
//
// Every light frame redraws the whole scene. The CPU time of renderer.render() says little about that cost: the GPU
// (or a software rasteriser) does the work afterwards, and the browser then holds back the next animation frame. So
// the pace is driven by LATENESS: how long after its due time a light frame really started. On time → speed back up
// towards 20 frames per second; late → at least double the interval. If the device is still late at the slowest pace,
// the light stops (stalled) so the stage stays responsive; the viewer then shows the simulation as paused.
//
// Pure and deterministic: every time value is measured by the caller and passed in. Invalid measurements fail closed
// to "stalled" (no light) rather than to a guessed pace.

export const MOTION_PACE = {
  /** Fastest light update: 20 per second. Light does not need 60 fps. */
  minMs: 50,
  /** Slowest light update before giving up: one every two seconds. */
  maxMs: 2000,
  /** One display frame of slack: an animation frame always lands up to ~16.7 ms after the timer that asked for it. */
  slackMs: 17,
  /** Light frames never take more than about a quarter of the time, judged by the CPU side of the last render. */
  duty: 4,
  /** On-time frames shrink the interval by this factor; late ones at least double it. */
  speedUp: 0.8,
} as const

export interface MotionPace {
  readonly intervalMs: number
  readonly stalled: boolean
}

const STALLED: MotionPace = { intervalMs: MOTION_PACE.maxMs, stalled: true }

/** True when a light frame started later than half its interval plus one display frame. */
export function isLate(intervalMs: number, latenessMs: number): boolean {
  return latenessMs > intervalMs * 0.5 + MOTION_PACE.slackMs
}

/**
 * The next light interval from the current one, how late the last light frame started and the CPU time of its render.
 * Not finite, non-positive interval or negative render time → stalled.
 */
export function nextMotionPace(intervalMs: number, latenessMs: number, renderMs: number): MotionPace {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0 || !Number.isFinite(latenessMs) || !Number.isFinite(renderMs) || renderMs < 0) return STALLED
  const lateness = Math.max(0, latenessMs)
  const floor = Math.max(MOTION_PACE.minMs, renderMs * MOTION_PACE.duty)
  if (floor > MOTION_PACE.maxMs) return STALLED
  if (isLate(intervalMs, lateness)) {
    if (intervalMs >= MOTION_PACE.maxMs) return STALLED
    return { intervalMs: Math.min(MOTION_PACE.maxMs, Math.max(intervalMs * 2, lateness, floor)), stalled: false }
  }
  return { intervalMs: Math.min(MOTION_PACE.maxMs, Math.max(floor, intervalMs * MOTION_PACE.speedUp)), stalled: false }
}
