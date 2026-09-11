import { lazy, Suspense } from 'react'

// These periodic/rare-action widgets should stay available without forcing
// their implementation into Home's first dependency graph.
const ObatPengingat = lazy(() => import('./UbinUkurImpl').then((m) => ({ default: m.UbinObatPengingat })))
const Beban = lazy(() => import('./UbinUkurImpl').then((m) => ({ default: m.UbinBeban })))
const UkurBerkala = lazy(() => import('./UbinUkurImpl').then((m) => ({ default: m.UbinUkurBerkala })))
const Skrining = lazy(() => import('./UbinUkurImpl').then((m) => ({ default: m.UbinSkrining })))

const fallback = <div className="min-h-[120px]" aria-hidden />

export function UbinObatPengingat() {
  return <Suspense fallback={fallback}><ObatPengingat /></Suspense>
}

export function UbinBeban() {
  return <Suspense fallback={fallback}><Beban /></Suspense>
}

export function UbinUkurBerkala() {
  return <Suspense fallback={fallback}><UkurBerkala /></Suspense>
}

export function UbinSkrining() {
  return <Suspense fallback={fallback}><Skrining /></Suspense>
}
