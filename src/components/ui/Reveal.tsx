import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  panaceaMotionStyle,
  prefersReducedMotion,
  type PanaceaMotionVariant,
} from '../../lib/panaceaMotionLanguage'

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
    // Without an observer there is nothing to wait for: content is never left hidden.
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    // No getBoundingClientRect() here: on a page of many Reveals the first call forced style and layout of the whole
    // document inside React's commit (254 ms of the landing's blocking time on a 4x-slowed phone CPU). The observer's
    // first report gives the same answer without forcing layout: any overlap at mount shows the element at once;
    // later, 12% of it must enter the viewport.
    let first = true
    const io = new IntersectionObserver(
      ([entry]) => {
        const reveal = entry.isIntersecting && (first || entry.intersectionRatio >= 0.12)
        first = false
        if (reveal) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: [0, 0.12], rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
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
      {prefix}{val}{suffix}
    </span>
  )
}
