import { useEffect, useRef } from 'react'
import { AURA_FRAME_INTERVAL_MS, auraMayAnimate, auraPhysicsSteps } from '../../shared/ui/auraFramePolicy'

// Lightweight pointer-reactive "constellation" canvas — drifting nodes that
// connect with thin lines and lean toward the cursor. No dependencies; capped
// node count for performance. Stops under the in-app reduce-motion setting AND
// the OS prefers-reduced-motion preference, while off screen or in a hidden tab,
// and redraws at most 30 fps (each redraw forces a full-page frame; see auraFramePolicy).
export function InteractiveAura({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    // const bindings keep their non-null narrowing inside the closures below.
    const cv = canvas
    const ctx = context

    let raf = 0
    let timer = 0
    let lastDraw: number | null = null
    let onScreen = true
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
    let w = 0
    let h = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const mouse = { x: -999, y: -999 }
    type Node = { x: number; y: number; vx: number; vy: number }
    let nodes: Node[] = []

    function resize() {
      const parent = cv.parentElement
      if (!parent) return
      w = parent.clientWidth
      h = parent.clientHeight
      cv.width = w * dpr
      cv.height = h * dpr
      cv.style.width = `${w}px`
      cv.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Density scales with area, capped for performance.
      const count = Math.min(64, Math.round((w * h) / 22000))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }))
    }

    function step() {
      for (const n of nodes) {
        // Gentle drift + subtle pull toward the cursor.
        const dx = mouse.x - n.x
        const dy = mouse.y - n.y
        const dist = Math.hypot(dx, dy)
        if (dist < 160) {
          n.vx += (dx / dist) * 0.015
          n.vy += (dy / dist) * 0.015
        }
        n.vx *= 0.99
        n.vy *= 0.99
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,191,99,0.55)'
        ctx.fill()
      }
      // Connect nearby nodes.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 110) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(0,191,99,${0.12 * (1 - d / 110)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
    }

    function mayAnimate() {
      return auraMayAnimate({
        reduceMotionClass: document.documentElement.classList.contains('reduce-motion'),
        prefersReducedMotion: media?.matches === true,
        onScreen,
        documentHidden: document.hidden,
      })
    }

    function stop() {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
      timer = 0
      raf = 0
      lastDraw = null
    }

    function tick(now: number) {
      raf = 0
      if (!mayAnimate()) return stop()
      const steps = auraPhysicsSteps(lastDraw, now)
      for (let i = 0; i < steps; i++) step()
      if (steps > 0) {
        draw()
        lastDraw = now
      }
      // A timer, not a rAF chain: between redraws no frame is requested at all.
      timer = window.setTimeout(() => {
        timer = 0
        raf = requestAnimationFrame(tick)
      }, AURA_FRAME_INTERVAL_MS)
    }

    function start() {
      if (raf || timer || !mayAnimate()) return
      raf = requestAnimationFrame(tick)
    }

    function sync() {
      if (mayAnimate()) start()
      else stop()
    }

    function onMove(e: PointerEvent) {
      const rect = cv.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    function onLeave() {
      mouse.x = -999
      mouse.y = -999
    }

    resize()
    const visibility = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver((entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting)
        sync()
      })
      : null
    visibility?.observe(cv)
    start()
    media?.addEventListener?.('change', sync)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      stop()
      visibility?.disconnect()
      media?.removeEventListener?.('change', sync)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden />
}
