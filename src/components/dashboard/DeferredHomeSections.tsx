import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/panacea-system.css'

const FeatureUniverse = lazy(() => import('./HomeFeatureUniverse').then((m) => ({ default: m.HomeFeatureUniverse })))
const LearningRail = lazy(() => import('./PanaceaLearningRail').then((m) => ({ default: m.PanaceaLearningRail })))

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

function Placeholder({ label }: { label: string }) {
  return (
    <div className="p-glass min-h-[120px] p-5" aria-label={`${label} loading`} role="status" aria-live="polite">
      <div className="h-2.5 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
      <div className="mt-3 h-5 w-56 max-w-[70%] animate-pulse rounded-full bg-black/[.06] dark:bg-white/[.06]" />
    </div>
  )
}

/**
 * Home no longer creates a second WebGL/body-visualisation surface. It is a
 * calm portal into the single canonical Body Explorer. This avoids duplicated
 * controls, duplicated GPU work and the false impression that two different
 * anatomy products exist.
 */
export function DeferredBodyExposureWidget() {
  return (
    <section className="p-body-portal" aria-labelledby="body-portal-title">
      <div className="relative z-10 flex items-center gap-5 sm:gap-7">
        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200">Body Exposure</div>
          <h2 id="body-portal-title" className="mt-2 text-[22px] font-black tracking-[-.035em] sm:text-[28px]">One body. One explorer.</h2>
          <p className="mt-2 max-w-xl text-[12px] font-semibold leading-relaxed text-white/70 sm:text-[13px]">
            Anatomy, physiology, imaging, disease, pharmacology and simulation now enter through one immersive workspace instead of competing previews.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/body-explorer" className="p-button-primary p-interactive">Open Body Explorer <span aria-hidden>→</span></Link>
            <Link to="/tubuh" className="inline-flex min-h-11 items-center rounded-full border border-white/14 bg-white/[.07] px-4 text-[11px] font-black text-white p-interactive">View body signals</Link>
          </div>
        </div>
        <div className="p-body-orb hidden sm:block" aria-hidden />
      </div>
    </section>
  )
}

/** Retained for secondary surfaces that explicitly request the full catalogue. */
export function DeferredHomeFeatureUniverse() {
  const { ref, ready } = useNearViewport('220px 0px')
  return (
    <div ref={ref}>
      {ready ? <Suspense fallback={<Placeholder label="Feature universe" />}><FeatureUniverse /></Suspense> : <Placeholder label="Feature universe" />}
    </div>
  )
}

/** Retained for secondary surfaces that explicitly request the learning rail. */
export function DeferredPanaceaLearningRail() {
  const { ref, ready } = useNearViewport('220px 0px')
  return (
    <div ref={ref}>
      {ready ? <Suspense fallback={<Placeholder label="Learning shelf" />}><LearningRail /></Suspense> : <Placeholder label="Learning shelf" />}
    </div>
  )
}
