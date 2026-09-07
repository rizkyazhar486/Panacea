import { lazy, Suspense } from 'react'

// Keep the Home board's initial dependency graph small. The implementation is
// requested only when this widget family is actually mounted. The local
// Suspense boundary also keeps these exports safe outside Tumpukan.
const Inspirasi = lazy(() => import('./UbinBelajarImpl').then((m) => ({ default: m.UbinInspirasi })))
const KartuBelajar = lazy(() => import('./UbinBelajarImpl').then((m) => ({ default: m.UbinKartuBelajar })))
const Soal = lazy(() => import('./UbinBelajarImpl').then((m) => ({ default: m.UbinSoal })))
const RingkasanKarya = lazy(() => import('./UbinBelajarImpl').then((m) => ({ default: m.UbinRingkasanKarya })))

const fallback = <div className="min-h-[120px]" aria-hidden />

export function UbinInspirasi() {
  return <Suspense fallback={fallback}><Inspirasi /></Suspense>
}

export function UbinKartuBelajar() {
  return <Suspense fallback={fallback}><KartuBelajar /></Suspense>
}

export function UbinSoal() {
  return <Suspense fallback={fallback}><Soal /></Suspense>
}

export function UbinRingkasanKarya() {
  return <Suspense fallback={fallback}><RingkasanKarya /></Suspense>
}
