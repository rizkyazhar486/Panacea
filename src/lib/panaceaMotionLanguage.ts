export type PanaceaMotionVariant = 'rise' | 'glass' | 'kinetic' | 'explode' | 'soft'

export interface PanaceaMotionPreset {
  durationMs: number
  easing: string
  hiddenTransform: string
  hiddenFilter: string
  hiddenOpacity: number
}

export const PANACEA_MOTION: Record<PanaceaMotionVariant, PanaceaMotionPreset> = {
  rise: { durationMs: 620, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', hiddenTransform: 'translate3d(0, 22px, 0) scale(0.985)', hiddenFilter: 'blur(2px)', hiddenOpacity: 0 },
  glass: { durationMs: 760, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', hiddenTransform: 'translate3d(0, 14px, 0) scale(0.97)', hiddenFilter: 'blur(10px) saturate(0.82)', hiddenOpacity: 0 },
  kinetic: { durationMs: 540, easing: 'cubic-bezier(0.2, 0.85, 0.25, 1)', hiddenTransform: 'translate3d(-18px, 0, 0) skewX(-2deg)', hiddenFilter: 'blur(1px)', hiddenOpacity: 0 },
  explode: { durationMs: 820, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', hiddenTransform: 'translate3d(0, 28px, 0) scale(0.92)', hiddenFilter: 'blur(4px)', hiddenOpacity: 0 },
  soft: { durationMs: 420, easing: 'ease-out', hiddenTransform: 'translate3d(0, 8px, 0)', hiddenFilter: 'none', hiddenOpacity: 0 },
}

export function panaceaMotionStyle(variant: PanaceaMotionVariant, shown: boolean, reduced: boolean) {
  const preset = PANACEA_MOTION[variant]
  if (reduced) return { opacity: 1, transform: 'none', filter: 'none', transition: 'none', willChange: 'auto' } as const
  return {
    opacity: shown ? 1 : preset.hiddenOpacity,
    transform: shown ? 'translate3d(0, 0, 0) scale(1)' : preset.hiddenTransform,
    filter: shown ? 'none' : preset.hiddenFilter,
    transitionProperty: 'opacity, transform, filter',
    transitionDuration: `${preset.durationMs}ms`,
    transitionTimingFunction: preset.easing,
    willChange: shown ? 'auto' : 'opacity, transform, filter',
  } as const
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
