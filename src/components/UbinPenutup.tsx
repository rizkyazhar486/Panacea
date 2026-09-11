import { lazy, Suspense } from 'react'
import { hariIni as tanggalHariIni } from '../lib/ukurBerkala'

// The six closing/occasional widgets are preserved exactly in the implementation
// chunk and requested only when mounted. Keep the focus-session logger sync:
// UbinWaktuHidup records completed focus sessions through this public helper.
const Amsler = lazy(() => import('./UbinPenutupImpl').then((m) => ({ default: m.UbinAmsler })))
const Layar = lazy(() => import('./UbinPenutupImpl').then((m) => ({ default: m.UbinLayar })))
const Peregangan = lazy(() => import('./UbinPenutupImpl').then((m) => ({ default: m.UbinPeregangan })))
const TekananPagiSore = lazy(() => import('./UbinPenutupImpl').then((m) => ({ default: m.UbinTekananPagiSore })))
const Rangkaian = lazy(() => import('./UbinPenutupImpl').then((m) => ({ default: m.UbinRangkaian })))
const JetLag = lazy(() => import('./UbinPenutupImpl').then((m) => ({ default: m.UbinJetLag })))

const fallback = <div className="min-h-[120px]" aria-hidden />
const KUNCI_SESI_FOKUS = 'pmd_sesi_fokus_log_v1'

export function catatSesiFokus(menit: number): void {
  try {
    const semua = JSON.parse(localStorage.getItem(KUNCI_SESI_FOKUS) || '[]') as { tanggal: string; menit: number }[]
    semua.push({ tanggal: tanggalHariIni(), menit: Math.max(1, Math.round(menit)) })
    localStorage.setItem(KUNCI_SESI_FOKUS, JSON.stringify(semua.slice(-400)))
    window.dispatchEvent(new Event('panacea:sesi-fokus'))
  } catch { /* kuota */ }
}

export function UbinAmsler() {
  return <Suspense fallback={fallback}><Amsler /></Suspense>
}

export function UbinLayar() {
  return <Suspense fallback={fallback}><Layar /></Suspense>
}

export function UbinPeregangan() {
  return <Suspense fallback={fallback}><Peregangan /></Suspense>
}

export function UbinTekananPagiSore() {
  return <Suspense fallback={fallback}><TekananPagiSore /></Suspense>
}

export function UbinRangkaian() {
  return <Suspense fallback={fallback}><Rangkaian /></Suspense>
}

export function UbinJetLag() {
  return <Suspense fallback={fallback}><JetLag /></Suspense>
}
