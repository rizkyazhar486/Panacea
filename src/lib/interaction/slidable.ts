export interface SlidableEdgeState {
  canLeft: boolean
  canRight: boolean
}

export type SlidableDirection = 'left' | 'right'

export function edgeState(scrollLeft: number, clientWidth: number, scrollWidth: number, epsilon = 2): SlidableEdgeState {
  const max = Math.max(0, scrollWidth - clientWidth)
  return {
    canLeft: scrollLeft > epsilon,
    canRight: scrollLeft < max - epsilon,
  }
}

export function nextIndex(current: number, count: number, direction: SlidableDirection): number {
  if (count <= 0) return -1
  const clamped = Math.min(Math.max(current, 0), count - 1)
  return direction === 'right' ? Math.min(count - 1, clamped + 1) : Math.max(0, clamped - 1)
}

export function scrollBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? 'auto' : 'smooth'
}

export function clampScrollTarget(target: number, clientWidth: number, scrollWidth: number): number {
  return Math.min(Math.max(0, target), Math.max(0, scrollWidth - clientWidth))
}
