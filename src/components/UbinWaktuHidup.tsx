import { lazy, Suspense } from 'react'

// Focus/eye/caffeine timers are useful but not needed to paint Home initially.
// Load their implementation only when one of these widgets is actually mounted.
const Mata = lazy(() => import('./UbinWaktuHidupImpl').then((m) => ({ default: m.UbinMata })))
const Fokus = lazy(() => import('./UbinWaktuHidupImpl').then((m) => ({ default: m.UbinFokus })))
const Kopi = lazy(() => import('./UbinWaktuHidupImpl').then((m) => ({ default: m.UbinKopi })))

const fallback = <div className="min-h-[120px]" aria-hidden />

export function UbinMata() {
  return <Suspense fallback={fallback}><Mata /></Suspense>
}

export function UbinFokus() {
  return <Suspense fallback={fallback}><Fokus /></Suspense>
}

export function UbinKopi() {
  return <Suspense fallback={fallback}><Kopi /></Suspense>
}
