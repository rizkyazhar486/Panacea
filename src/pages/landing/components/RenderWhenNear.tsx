import type { ReactNode } from 'react'

/** Layouts change at Tailwind's `lg` breakpoint; below it the phone heights are the closer estimate. */
const DESKTOP_QUERY = '(min-width: 1024px)'

/**
 * Below the hero the landing is about 23 more phone screens tall, and computing style and layout for all of it on load
 * was the largest part of its blocking time. A block wrapped here is skipped for style, layout and paint until it nears
 * the viewport (`content-visibility: auto`). `phone` and `desktop` are the block's measured heights at 390 and 1440 px,
 * used as its placeholder size until it has rendered once; after that the browser keeps the real height (`auto`).
 *
 * Containment clips paint to the block and anchors fixed-position descendants to it, so only wrap blocks that draw
 * inside their own box and open no fixed overlay. In-page jumps must re-align once they stop (see scrollToSection).
 * A missing or invalid estimate renders the block normally.
 */
export function RenderWhenNear({ phone, desktop, children }: { phone: number; desktop: number; children: ReactNode }) {
  const wide = typeof window !== 'undefined' && window.matchMedia?.(DESKTOP_QUERY).matches === true
  const estimate = wide ? desktop : phone
  if (!Number.isFinite(estimate) || estimate <= 0) return <>{children}</>
  return <div style={{ contentVisibility: 'auto', containIntrinsicSize: `auto ${Math.round(estimate)}px` }}>{children}</div>
}
