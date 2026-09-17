export const DEFAULT_GESTURE_THRESHOLDS = {
  tapTolerancePx: 10,
  swipeDistancePx: 38,
  swipeMaxDurationMs: 420,
  longPressMs: 650,
  doubleTapMs: 280,
} as const

export interface GestureThresholds {
  tapTolerancePx: number
  swipeDistancePx: number
  swipeMaxDurationMs: number
  longPressMs: number
  doubleTapMs: number
}

export interface GesturePoint {
  x: number
  y: number
}

export type GestureDecision =
  | 'none'
  | 'tap'
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'

export type GestureDirection = 'left' | 'right' | 'up' | 'down'

export interface ReleasedGestureInput {
  dx: number
  dy: number
  elapsedMs: number
  dragged: boolean
  longPressed: boolean
  cancelled: boolean
  thresholds?: Partial<GestureThresholds>
}

export function gestureThresholds(overrides?: Partial<GestureThresholds>): GestureThresholds {
  return { ...DEFAULT_GESTURE_THRESHOLDS, ...overrides }
}

export function distanceBetween(a: GesturePoint, b: GesturePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function dominantDirection(dx: number, dy: number): GestureDirection | null {
  if (dx === 0 && dy === 0) return null
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
  return dy >= 0 ? 'down' : 'up'
}

/**
 * Klasifikasi release harus murni dan deterministik supaya komponen React
 * tidak memiliki ambang yang berbeda-beda untuk gestur yang sama.
 *
 * Long-press dijalankan oleh timer ketika pointer masih ditekan. Karena itu
 * release setelah long-press sengaja menghasilkan `none`, mencegah satu
 * rangkaian pointer memicu dua tindakan.
 */
export function classifyReleasedGesture(input: ReleasedGestureInput): GestureDecision {
  const t = gestureThresholds(input.thresholds)
  if (input.cancelled || input.dragged || input.longPressed) return 'none'

  const distance = Math.hypot(input.dx, input.dy)
  if (distance <= t.tapTolerancePx) return 'tap'
  if (input.elapsedMs > t.swipeMaxDurationMs || distance < t.swipeDistancePx) return 'none'

  const direction = dominantDirection(input.dx, input.dy)
  if (!direction) return 'none'
  return `swipe-${direction}`
}
