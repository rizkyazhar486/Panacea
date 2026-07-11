import { useEffect, useRef, useState } from 'react'

// Scroll-driven cinematic sequence for the landing page hero region — the
// live implementation of the Remotion concept video (sunrise → vitality →
// science → longevity). A tall (400vh) track holds a `sticky` viewport;
// scrolling through the track advances a 0..1 progress value that drives
// each act's opacity/parallax via direct style writes (no re-render per
// scroll frame, so it stays smooth on mobile).
const ACTS = [
  { key: 'hero', label: 'Start' },
  { key: 'vitality', label: 'Vitality' },
  { key: 'science', label: 'Science' },
  { key: 'longevity', label: 'Longevity' },
] as const

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

export function ScrollCinematic() {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const actRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(document.documentElement.classList.contains('reduce-motion'))
  }, [])

  useEffect(() => {
    if (reduced) return
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const track = trackRef.current
        if (!track) return
        const rect = track.getBoundingClientRect()
        const total = rect.height - window.innerHeight
        const progress = total > 0 ? clamp01(-rect.top / total) : 0

        ACTS.forEach((_, i) => {
          const el = actRefs.current[i]
          const dot = dotRefs.current[i]
          if (!el) return
          const start = i / ACTS.length
          const end = (i + 1) / ACTS.length
          const local = clamp01((progress - start) / (end - start))
          const isFirst = i === 0
          const isLast = i === ACTS.length - 1
          let opacity: number
          if (!isFirst && local < 0.18) opacity = local / 0.18
          else if (!isLast && local > 0.82) opacity = (1 - local) / 0.18
          else opacity = 1
          const translateY = (1 - opacity) * 36
          el.style.opacity = String(opacity)
          el.style.transform = `translateY(${translateY}px)`
          el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none'
          if (dot) {
            dot.style.opacity = opacity > 0.3 ? '1' : '0.35'
            dot.style.transform = opacity > 0.3 ? 'scale(1.35)' : 'scale(1)'
          }
        })
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  // Reduced-motion / no-JS-scroll fallback: just stack the acts normally,
  // no pinning, no opacity tricks — everyone still sees all 4 beats.
  if (reduced) {
    return (
      <div className="space-y-4 px-6 py-16 sm:px-10">
        <ActHero />
        <ActVitality />
        <ActScience />
        <ActLongevity />
      </div>
    )
  }

  return (
    <div ref={trackRef} className="relative" style={{ height: '400vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {ACTS.map((a, i) => (
          <div
            key={a.key}
            ref={(el) => { actRefs.current[i] = el }}
            className="absolute inset-0"
            style={{ opacity: i === 0 ? 1 : 0, willChange: 'opacity, transform' }}
          >
            {a.key === 'hero' && <ActHero />}
            {a.key === 'vitality' && <ActVitality />}
            {a.key === 'science' && <ActScience />}
            {a.key === 'longevity' && <ActLongevity />}
          </div>
        ))}

        {/* Progress rail — mirrors the 4-act structure so scroll depth is legible */}
        <div className="pointer-events-none absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3 sm:right-8">
          {ACTS.map((a, i) => (
            <span
              key={a.key}
              ref={(el) => { dotRefs.current[i] = el }}
              className="h-2 w-2 rounded-full bg-white transition-transform"
              style={{ opacity: 0.35 }}
              title={a.label}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">Scroll</span>
          <span className="scroll-chevron text-lg">↓</span>
        </div>
      </div>
    </div>
  )
}

// ── Shared visual bits (pure CSS/SVG loops — no per-scroll JS needed) ──────

function Particles({ seed = 1, color = '#7CF5B8' }: { seed?: number; color?: string }) {
  const items = Array.from({ length: 26 }).map((_, i) => {
    const r = ((Math.sin(i * 999 + seed) + 1) / 2)
    const r2 = ((Math.sin(i * 1777 + seed) + 1) / 2)
    const r3 = ((Math.sin(i * 41 + seed) + 1) / 2)
    return {
      left: `${r * 100}%`,
      size: 2 + r2 * 4,
      duration: 6 + r3 * 10,
      delay: -(r * 12),
    }
  })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((p, i) => (
        <span
          key={i}
          className="cinematic-particle absolute rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function SunriseGlow({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      className="cinematic-breathe pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: 640,
        height: 640,
        maxWidth: '90vw',
        opacity,
        background: 'radial-gradient(circle, rgba(124,245,184,0.55) 0%, rgba(0,191,99,0.28) 35%, rgba(5,46,28,0) 70%)',
        filter: 'blur(6px)',
      }}
    />
  )
}

function DnaHelix() {
  const rungs = Array.from({ length: 12 })
  return (
    <div className="cinematic-spin pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ perspective: 600 }}>
      <svg width="180" height="340" viewBox="0 0 180 340">
        {rungs.map((_, i) => {
          const t = i / (rungs.length - 1)
          const y = t * 320 + 10
          return (
            <g key={i} className="cinematic-helix-rung" style={{ animationDelay: `${-t * 3}s` }}>
              <line x1="20" y1={y} x2="160" y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
              <circle cx="20" cy={y} r={5} fill="#7CF5B8" />
              <circle cx="160" cy={y} r={5} fill="#00BF63" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Heartbeat() {
  return (
    <svg width="100%" height="80" viewBox="0 0 700 100" preserveAspectRatio="none" className="mx-auto max-w-md">
      <polyline
        className="cinematic-heartbeat"
        points="0,50 260,50 285,50 300,10 315,90 330,50 345,50 700,50"
        fill="none"
        stroke="#7CF5B8"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StretchSilhouette() {
  return (
    <div className="cinematic-bob pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2">
      <svg width="140" height="230" viewBox="0 0 220 360">
        <ellipse cx="110" cy="330" rx="46" ry="10" fill="rgba(0,0,0,0.2)" />
        <circle cx="110" cy="46" r="26" fill="rgba(255,255,255,0.92)" />
        <rect x="92" y="70" width="36" height="120" rx="18" fill="rgba(255,255,255,0.92)" />
        <g className="cinematic-arm-left"><rect x="60" y="80" width="42" height="16" rx="8" fill="rgba(255,255,255,0.85)" /></g>
        <g className="cinematic-arm-right"><rect x="118" y="80" width="42" height="16" rx="8" fill="rgba(255,255,255,0.85)" /></g>
        <rect x="95" y="185" width="14" height="110" rx="7" fill="rgba(255,255,255,0.9)" transform="rotate(-6 102 240)" />
        <rect x="111" y="185" width="14" height="110" rx="7" fill="rgba(255,255,255,0.9)" transform="rotate(6 118 240)" />
      </svg>
    </div>
  )
}

function Rays() {
  return (
    <div
      className="cinematic-rotate pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: 900,
        height: 900,
        maxWidth: '140vw',
        background: 'repeating-conic-gradient(rgba(124,245,184,0.16) 0deg 6deg, transparent 6deg 18deg)',
        maskImage: 'radial-gradient(circle, black 0%, transparent 62%)',
        WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 62%)',
      }}
    />
  )
}

// ── The 4 acts ──────────────────────────────────────────────────────────

function ActHero() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center" style={{ background: 'linear-gradient(180deg, #052E1C 0%, #0B4A2E 60%, #0B7A4B 100%)' }}>
      <SunriseGlow />
      <Particles seed={3} />
      <h2 className="relative text-3xl font-black tracking-tight text-white sm:text-5xl">PANACEAMED.ID</h2>
      <p className="relative max-w-md px-6 text-sm font-semibold text-white/75 sm:text-base">Toward a Longer, Healthier Life</p>
    </div>
  )
}

function ActVitality() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start gap-6 pt-20 text-center" style={{ background: 'linear-gradient(180deg, #0B4A2E 0%, #0B7A4B 55%, #00BF63 100%)' }}>
      <Particles seed={11} color="#EFFFF6" />
      <h2 className="relative text-2xl font-black tracking-tight text-white sm:text-4xl">VITALITY</h2>
      <p className="relative max-w-md px-6 text-sm font-semibold text-white/80">Move every day, live longer</p>
      <StretchSilhouette />
      <div className="absolute bottom-10 left-0 right-0 px-6"><Heartbeat /></div>
    </div>
  )
}

function ActScience() {
  const chips = ['VO₂max', 'Biomarker Endpoints', 'AI Clinical Insight']
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-start gap-4 pt-20 text-center" style={{ background: 'linear-gradient(180deg, #00BF63 0%, #0B7A4B 55%, #0B4A2E 100%)' }}>
      <Particles seed={19} color="#DFFFF0" />
      <DnaHelix />
      <h2 className="relative text-2xl font-black tracking-tight text-white sm:text-4xl">LONGEVITY SCIENCE</h2>
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-3 px-6">
        {chips.map((c) => (
          <span key={c} className="rounded-full border border-white/35 bg-white/15 px-6 py-2 text-sm font-bold text-white backdrop-blur">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

function ActLongevity() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 text-center" style={{ background: 'linear-gradient(180deg, #0B4A2E 0%, #0B7A4B 45%, #052E1C 100%)' }}>
      <Rays />
      <SunriseGlow opacity={0.7} />
      <Particles seed={29} />
      <h2 className="relative max-w-lg px-6 text-2xl font-black tracking-tight text-white sm:text-4xl">LONGEVITY STARTS TODAY</h2>
      <p className="relative text-base font-bold" style={{ color: '#7CF5B8' }}>Start Your Longevity Journey →</p>
    </div>
  )
}

// ── Keyframes (scoped, injected once) ──────────────────────────────────
export function ScrollCinematicStyles() {
  return (
    <style>{`
      .cinematic-particle { animation-name: cinematicFloat; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0.6; bottom: -10px; }
      @keyframes cinematicFloat { from { transform: translateY(0); opacity: 0; } 10% { opacity: 0.7; } 90% { opacity: 0.7; } to { transform: translateY(-110vh); opacity: 0; } }
      .cinematic-breathe { animation: cinematicBreathe 6s ease-in-out infinite; }
      @keyframes cinematicBreathe { 0%,100% { transform: translate(-50%,-50%) scale(0.94); } 50% { transform: translate(-50%,-50%) scale(1.04); } }
      .cinematic-spin { animation: cinematicSpin 14s linear infinite; }
      @keyframes cinematicSpin { from { transform: translate(-50%,-50%) rotateY(0deg); } to { transform: translate(-50%,-50%) rotateY(360deg); } }
      .cinematic-helix-rung { animation: cinematicRungFade 3s ease-in-out infinite; transform-origin: center; }
      @keyframes cinematicRungFade { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
      .cinematic-heartbeat { stroke-dasharray: 1400; animation: cinematicDash 2.4s linear infinite; }
      @keyframes cinematicDash { from { stroke-dashoffset: 1400; } to { stroke-dashoffset: 0; } }
      .cinematic-bob { animation: cinematicBob 3.2s ease-in-out infinite; }
      @keyframes cinematicBob { 0%,100% { transform: translate(-50%,0); } 50% { transform: translate(-50%,-12px); } }
      .cinematic-arm-left { animation: cinematicArmL 3.2s ease-in-out infinite; transform-origin: 100px 90px; }
      .cinematic-arm-right { animation: cinematicArmR 3.2s ease-in-out infinite; transform-origin: 120px 90px; }
      @keyframes cinematicArmL { 0%,100% { transform: rotate(-18deg); } 50% { transform: rotate(-30deg); } }
      @keyframes cinematicArmR { 0%,100% { transform: rotate(18deg); } 50% { transform: rotate(30deg); } }
      .cinematic-rotate { animation: cinematicRotate 30s linear infinite; }
      @keyframes cinematicRotate { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
      .scroll-chevron { animation: cinematicChevron 1.6s ease-in-out infinite; }
      @keyframes cinematicChevron { 0%,100% { transform: translateY(0); opacity: 0.7; } 50% { transform: translateY(6px); opacity: 1; } }
      .reduce-motion .cinematic-particle, .reduce-motion .cinematic-breathe, .reduce-motion .cinematic-spin,
      .reduce-motion .cinematic-helix-rung, .reduce-motion .cinematic-heartbeat, .reduce-motion .cinematic-bob,
      .reduce-motion .cinematic-arm-left, .reduce-motion .cinematic-arm-right, .reduce-motion .cinematic-rotate,
      .reduce-motion .scroll-chevron { animation: none !important; }
    `}</style>
  )
}
