import { useEffect, useRef, useState, type ReactNode } from 'react'

// Scroll-reveal wrapper. Adds `reveal-in` when the element scrolls into view;
// CSS handles the fade/slide. Respects the reduced-motion preference (the
// `.reduce-motion` layer forces it visible with no transition).
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className = '',
}: {
  children: ReactNode
  delay?: number
  as?: 'div' | 'section' | 'li' | 'span'
  className?: string
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Reveal immediately if already in view on mount (above-the-fold content
    // must never wait on a scroll event).
    const r = el.getBoundingClientRect()
    if (r.top < (window.innerHeight || 800) && r.bottom > 0) { setShown(true); return }
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
    // Safety net: never leave content permanently hidden if the observer
    // never fires (some headless/embedded browsers, tab restores, etc.).
    const fallback = window.setTimeout(() => setShown(true), 1500)
    return () => { io.disconnect(); clearTimeout(fallback) }
  }, [])

  return (
    <Tag
      // @ts-expect-error – ref typing across the union of intrinsic tags
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

// Animated number that counts up once it enters the viewport.
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
    const reduced = document.documentElement.classList.contains('reduce-motion')
    if (reduced) {
      setVal(to)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
          setVal(Math.round(to * eased))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val}
      {suffix}
    </span>
  )
}
