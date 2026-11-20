import { useEffect, useRef, useState, type ReactNode } from 'react'

export interface WhenNearProps {
  children: ReactNode
  /** Space held before mounting, so the page does not jump when the content arrives. */
  minHeight: number
  /** How far below the screen to start loading, in pixels. */
  margin?: number
}

// The sibling of WhenOpened for content below the fold: a heavy section (a chart board, a feature map) costs
// nothing at first paint and mounts when it scrolls within `margin` of the screen. Without IntersectionObserver
// it mounts at once, so no reader ever loses the content.
export function WhenNear({ children, minHeight, margin = 400 }: WhenNearProps) {
  const marker = useRef<HTMLDivElement | null>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = marker.current
    if (!el || typeof IntersectionObserver === 'undefined') { setNear(true); return }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setNear(true); io.disconnect() }
    }, { rootMargin: `0px 0px ${margin}px 0px` })
    io.observe(el)
    return () => io.disconnect()
  }, [margin])

  if (near) return <>{children}</>
  return <div ref={marker} style={{ minHeight }} aria-hidden />
}
