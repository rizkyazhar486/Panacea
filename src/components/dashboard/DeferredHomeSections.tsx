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
    <div className={`rounded-[28px] border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[.025] ${tall ? 'min-h-[300px]' : ''}`} aria-label={`${label} loading`}>
      <div className="h-2.5 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-white/10" />
      <div className="mt-3 h-5 w-56 max-w-[70%] animate-pulse rounded-full bg-neutral-200 dark:bg-white/10" />
      <div className="mt-4 flex gap-2 overflow-hidden">
        {[0, 1, 2].map((item) => <div key={item} className="h-28 w-36 shrink-0 animate-pulse rounded-[22px] bg-neutral-100 dark:bg-white/[.06]" />)}
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
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-[#080b0e] p-5 text-white shadow-[0_16px_42px_rgba(4,10,14,.18)] dark:border-white/10">
      <div className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-300">3D anatomy · on demand</div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[18px] font-black tracking-tight">Reference human anatomy</h2>
          <p className="mt-1 max-w-xl text-[10px] font-medium leading-relaxed text-white/60">The HuBMAP 3D model is kept off during app launch to protect mobile memory. Load it only when you want the interactive preview.</p>
        </div>
        <span className="shrink-0 text-4xl" aria-hidden>🫀</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setActivated(true)} className="rounded-full bg-white px-4 py-2.5 text-[10px] font-black text-neutral-950 active:scale-95">Load 3D preview</button>
        <Link to="/body-explorer?mode=realistic-atlas" className="rounded-full border border-white/15 px-4 py-2.5 text-[10px] font-black text-white/80 active:scale-95">Open full atlas →</Link>
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
