export const DIGESTIVE_SEQUENCE = [
  'esophagus',
  'stomach',
  'duodenum',
  'small-bowel',
  'colon',
  'rectum',
] as const

export type DigestiveStage = (typeof DIGESTIVE_SEQUENCE)[number]

export interface DigestiveTransitVisualState {
  progress: number
  routeIndex: number
  localProgress: number
  activeStage: DigestiveStage
  nextStage: DigestiveStage
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Normalized educational animation state for the digestive source render.
 *
 * This intentionally does not encode physiologic transit time. `speed` is a
 * display multiplier only so the visual can be inspected comfortably.
 */
export function digestiveTransitVisualState(
  elapsedSeconds: number,
  speed = 1,
): DigestiveTransitVisualState {
  const safeElapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0
  const safeSpeed = clamp(Number.isFinite(speed) ? speed : 1, 0.25, 3)
  const routeCount = DIGESTIVE_SEQUENCE.length - 1
  const cycleSeconds = 12 / safeSpeed
  const progress = cycleSeconds > 0 ? (safeElapsed % cycleSeconds) / cycleSeconds : 0
  const scaled = progress * routeCount
  const routeIndex = Math.min(routeCount - 1, Math.floor(scaled))
  const localProgress = scaled - routeIndex

  return {
    progress,
    routeIndex,
    localProgress,
    activeStage: DIGESTIVE_SEQUENCE[routeIndex],
    nextStage: DIGESTIVE_SEQUENCE[routeIndex + 1],
  }
}
