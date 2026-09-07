import { lazy, Suspense } from 'react'

// Wearable-detail widgets can be sizeable and often render only when personal
// data exists. Keep their data/calculation implementation unchanged, but load
// it only when this family is mounted.
const Hrv = lazy(() => import('./UbinPerangkatImpl').then((m) => ({ default: m.UbinHrv })))
const TahapTidur = lazy(() => import('./UbinPerangkatImpl').then((m) => ({ default: m.UbinTahapTidur })))
const EfisiensiTidur = lazy(() => import('./UbinPerangkatImpl').then((m) => ({ default: m.UbinEfisiensiTidur })))
const LajuNapas = lazy(() => import('./UbinPerangkatImpl').then((m) => ({ default: m.UbinLajuNapas })))
const Saturasi = lazy(() => import('./UbinPerangkatImpl').then((m) => ({ default: m.UbinSaturasi })))
const Suhu = lazy(() => import('./UbinPerangkatImpl').then((m) => ({ default: m.UbinSuhu })))

const fallback = <div className="min-h-[120px]" aria-hidden />

export function UbinHrv() {
  return <Suspense fallback={fallback}><Hrv /></Suspense>
}

export function UbinTahapTidur() {
  return <Suspense fallback={fallback}><TahapTidur /></Suspense>
}

export function UbinEfisiensiTidur() {
  return <Suspense fallback={fallback}><EfisiensiTidur /></Suspense>
}

export function UbinLajuNapas() {
  return <Suspense fallback={fallback}><LajuNapas /></Suspense>
}

export function UbinSaturasi() {
  return <Suspense fallback={fallback}><Saturasi /></Suspense>
}

export function UbinSuhu() {
  return <Suspense fallback={fallback}><Suhu /></Suspense>
}
