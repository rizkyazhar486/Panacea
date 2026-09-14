import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  panaceaMotionStyle,
  prefersReducedMotion,
  type PanaceaMotionVariant,
} from '../lib/panaceaMotionLanguage'

// Scroll-reveal wrapper. It now uses the original Panacea motion-language
// tokens while preserving the old class names so existing CSS/tests keep
// working. Motion stays progressive-enhancement only: reduced-motion users get
// immediately visible content with no transform/filter choreography.
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
  variant = 'rise',
}: {
  children: ReactNode
  delay?: number
  as?: 'div' | 'section' | 'li' | 'span'
  className?: string
  variant?: PanaceaMotionVariant
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(Boolean(mq?.matches) || document.documentElement.classList.contains('reduce-motion'))
    sync()
    mq?.addEventListener?.('change', sync)
    return () => mq?.removeEventListener?.('change', sync)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      setShown(true)
      return
    }

    // Reveal immediately if already in view on mount (above-the-fold content
    // must never wait on a scroll event).
    const r = el.getBoundingClientRect()
    if (r.top < (window.innerHeight || 800) && r.bottom > 0) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)

    // Safety net: never leave content permanently hidden if IntersectionObserver
    // stalls in an embedded/headless browser or after a restored tab.
    const fallback = window.setTimeout(() => setShown(true), 1500)
    return () => {
      io.disconnect()
      clearTimeout(fallback)
    }
  }, [reduced])

  const motion = panaceaMotionStyle(variant, shown, reduced)

  return (
    <Tag
      // @ts-expect-error – ref typing across the union of intrinsic tags
      ref={ref}
      style={{ ...motion, transitionDelay: reduced ? '0ms' : `${Math.max(0, delay)}ms` }}
      data-motion={variant}
      data-motion-state={shown ? 'shown' : 'hidden'}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

// Animated number that counts up once it enters the viewport. requestAnimationFrame
// is explicitly cancelled on unmount and the final value is used for reduced
// motion so motion preferences never hide or delay information.
export function CountUp({
  to,
  suffix = '',
  prefix = '',
  duration = 1400,
  className = '',
}: {
  to: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || document.documentElement.classList.contains('reduce-motion')) {
      setVal(to)
      return
    }

    let raf = 0
    let cancelled = false
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          if (cancelled) return
          const p = Math.min(1, (now - start) / Math.max(1, duration))
          const eased = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(to * eased))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val}
      {suffix}
    </span>
  )
}
