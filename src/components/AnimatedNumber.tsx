import { useLayoutEffect, useRef } from 'react'

/** Display animation only: unavailable values never acquire a fabricated zero. */
export function AnimatedNumber({ v, d = 0 }: { v: number; d?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef<number | null>(Number.isFinite(v) ? v : null)
  const valid = Number.isFinite(v) && Number.isInteger(d) && d >= 0 && d <= 100
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (!valid) { current.current = null; el.textContent = '—'; return }
    const start = current.current ?? v
    if (start === v || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = v; el.textContent = v.toFixed(d); return
    }
    el.textContent = start.toFixed(d)
    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - started) / 500))
      const eased = 1 - (1 - progress) ** 3
      const next = start * (1 - eased) + v * eased
      current.current = Number.isFinite(next) ? next : v
      el.textContent = current.current.toFixed(d)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [v, d, valid])
  return <span ref={ref}>{valid ? v.toFixed(d) : '—'}</span>
}
