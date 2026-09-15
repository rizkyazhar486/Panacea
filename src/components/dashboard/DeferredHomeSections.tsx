import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const FeatureUniverse = lazy(() => import('./HomeFeatureUniverse').then((m) => ({ default: m.HomeFeatureUniverse })))
const LearningRail = lazy(() => import('./PanaceaLearningRail').then((m) => ({ default: m.PanaceaLearningRail })))
const BodyExposure = lazy(() => import('./BodyExposureWidget').then((m) => ({ default: m.BodyExposureWidget })))

function useNearViewport(rootMargin = '900px 0px') {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setReady(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setReady(true)
      observer.disconnect()
    }, { rootMargin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ready, rootMargin])

  return { ref, ready }
}

function Placeholder({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-[24px] border border-emerald-500/20 bg-[#050a08] p-4 text-white shadow-[0_14px_34px_rgba(0,0,0,.24)] ${tall ? 'min-h-[220px]' : ''}`}
      aria-label={`${label} loading`}
      role="status"
      aria-live="polite"
    >
      <div className="h-2.5 w-24 animate-pulse rounded-full bg-emerald-400/25" />
      <div className="mt-3 h-5 w-56 max-w-[70%] animate-pulse rounded-full bg-emerald-400/16" />
      <div className="mt-4 flex gap-2 overflow-hidden">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-24 w-36 shrink-0 animate-pulse rounded-[18px] border border-emerald-500/10 bg-[#08130e]" />
        ))}
      </div>
    </div>
  )
}

function BodyFocusWidget() {
  const systems = [
    { label: 'Eye', note: 'Orbit · retina · optics', icon: '◉', to: '/body-explorer?focus=eye' },
    { label: 'Heart', note: 'Flow · valves · vessels', icon: '♥', to: '/body-explorer?focus=heart' },
    { label: 'Brain', note: 'Networks · pathways', icon: '✦', to: '/body-explorer?focus=brain' },
  ]

  return (
    <div className="mt-4 rounded-[20px] border border-emerald-400/20 bg-[#020604] p-3" aria-label="Body Focus quick widget">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-300">New widget · Body Focus</div>
          <div className="mt-0.5 text-[12px] font-black text-white">Jump directly into high-value anatomy</div>
        </div>
        <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-[9px] font-black text-[#001b0d]">LIVE</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {systems.map((system) => (
          <Link
            key={system.label}
            to={system.to}
            className="min-w-0 rounded-[16px] border border-emerald-400/15 bg-[#07110c] p-3 transition hover:border-emerald-300/50 hover:bg-[#0a1a12] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div className="text-[18px] leading-none text-emerald-300" aria-hidden>{system.icon}</div>
            <div className="mt-2 text-[11px] font-black text-white">{system.label}</div>
            <div className="mt-1 line-clamp-2 text-[9px] font-semibold leading-snug text-white/70">{system.note}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

/**
 * The HRA preview owns a WebGL renderer and several large GLB models. Do not
 * create that GPU context just because Home happens to scroll near this block.
 * iOS WebKit is especially sensitive to memory/GPU spikes and can terminate the
 * whole page with "A problem repeatedly occurred" before React can show an
 * error boundary. The preview is therefore opt-in; the full atlas stays one tap
 * away and no medical functionality is removed.
 */
export function DeferredBodyExposureWidget() {
  const [activated, setActivated] = useState(false)

  if (activated) {
    return (
      <Suspense fallback={<Placeholder label="Body Exposure" tall />}>
        <BodyExposure interactive showCta />
      </Suspense>
    )
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_right,rgba(0,191,99,.16),transparent_34%),linear-gradient(145deg,#060b09,#020504)] p-5 text-white shadow-[0_18px_46px_rgba(0,0,0,.3)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-300">3D anatomy · on demand</div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black text-emerald-200">BODY EXPOSURE</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[19px] font-black tracking-tight">Reference human anatomy</h2>
          <p className="mt-1 max-w-xl text-[11px] font-semibold leading-relaxed text-white/75">Interactive whole-body anatomy stays one tap away while the Home screen remains fast and stable on mobile.</p>
        </div>
        <span className="shrink-0 text-4xl" aria-hidden>🫀</span>
      </div>

      <BodyFocusWidget />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActivated(true)}
          className="min-h-11 rounded-full bg-[#00BF63] px-4 py-2.5 text-[10px] font-black text-[#001b0d] shadow-[0_8px_24px_rgba(0,191,99,.22)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Load 3D preview
        </button>
        <Link
          to="/body-explorer?mode=realistic-atlas"
          className="inline-flex min-h-11 items-center rounded-full border border-emerald-400/25 bg-[#07110c] px-4 py-2.5 text-[10px] font-black text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          Open full atlas →
        </Link>
      </div>
    </section>
  )
}

export function DeferredHomeFeatureUniverse() {
  const { ref, ready } = useNearViewport('220px 0px')
  return (
    <div ref={ref}>
      {ready ? <Suspense fallback={<Placeholder label="Feature universe" />}><FeatureUniverse /></Suspense> : <Placeholder label="Feature universe" />}
    </div>
  )
}

export function DeferredPanaceaLearningRail() {
  const { ref, ready } = useNearViewport('220px 0px')
  return (
    <div ref={ref}>
      {ready ? <Suspense fallback={<Placeholder label="Learning shelf" />}><LearningRail /></Suspense> : <Placeholder label="Learning shelf" />}
    </div>
  )
}
