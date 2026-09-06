import { lazy, Suspense, useEffect, useRef, useState } from 'react'

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
    <div className="rounded-[28px] border border-neutral-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[.025]" aria-label={`${label} loading`}>
      <div className="h-2.5 w-24 animate-pulse rounded-full bg-neutral-200 dark:bg-white/10" />
      <div className="mt-3 h-5 w-56 max-w-[70%] animate-pulse rounded-full bg-neutral-200 dark:bg-white/10" />
      <div className="mt-4 flex gap-2 overflow-hidden">
        {[0, 1, 2].map((item) => <div key={item} className="h-28 w-36 shrink-0 animate-pulse rounded-[22px] bg-neutral-100 dark:bg-white/[.06]" />)}
      </div>
    </div>
  )
}

export function DeferredHomeFeatureUniverse() {
  const { ref, ready } = useNearViewport()
  return (
    <div ref={ref}>
      {ready ? <Suspense fallback={<Placeholder label="Feature universe" />}><FeatureUniverse /></Suspense> : <Placeholder label="Feature universe" />}
    </div>
  )
}

export function DeferredPanaceaLearningRail() {
  const { ref, ready } = useNearViewport('750px 0px')
  return (
    <div ref={ref}>
      {ready ? <Suspense fallback={<Placeholder label="Learning shelf" />}><LearningRail /></Suspense> : <Placeholder label="Learning shelf" />}
    </div>
  )
}
