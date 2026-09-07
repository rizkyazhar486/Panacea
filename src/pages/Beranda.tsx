import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { DeferredBodyExposureWidget, DeferredHomeFeatureUniverse, DeferredPanaceaLearningRail } from '../components/dashboard/DeferredHomeSections'
import { HomeSectionBoundary } from '../components/HomeSectionBoundary'
import { pratinjauBeranda } from '../lib/pratinjauBeranda'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { ageFromDob } from '../lib/anthro'
import '../styles/home-odyssey.css'

// Home is the page users open most often. Keep its first paint deliberately
// small: the catalogue, configurable widget board, visual analytics and forms
// are separate chunks and are requested only when they are actually useful.
const LazyPapanWidget = lazy(() => import('../components/PapanWidget').then((m) => ({ default: m.PapanWidget })))
const LazyKisiFitur = lazy(() => import('../components/KisiFitur').then((m) => ({ default: m.KisiFitur })))
const LazyCatatanHarian = lazy(() => import('../components/CatatanHarian').then((m) => ({ default: m.CatatanHarian })))
const LazyCatatanLatihan = lazy(() => import('../components/CatatanLatihan').then((m) => ({ default: m.CatatanLatihan })))
const LazyPanaceaGrowthRail = lazy(() => import('../components/dashboard/PanaceaGrowthWidgets').then((m) => ({ default: m.PanaceaGrowthRail })))
const LazyPanaceaUtilityShelf = lazy(() => import('../components/dashboard/PanaceaUtilityShelf').then((m) => ({ default: m.PanaceaUtilityShelf })))
const LazyPerformanceVisualizationDeck = lazy(() => import('../components/dashboard/PerformanceVisualizationDeck').then((m) => ({ default: m.PerformanceVisualizationDeck })))

/**
 * Home / dashboard Panacea.
 *
 * First paint is sports-first and resilient: the user's key signals, Training,
 * Body and Recovery remain usable even when a secondary visualisation or a
 * large optional module fails to load.
 */

const PINTASAN = [
  { to: '/latihan', emoji: '🏃', label: 'Training', tone: 'bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-600 text-white' },
  { to: '/tubuh', emoji: '❤️', label: 'Body', tone: 'bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 text-white' },
  { to: '/recovery', emoji: '🌙', label: 'Recovery', tone: 'bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white' },
  { to: '/nutrition', emoji: '🥗', label: 'Nutrition', tone: 'bg-gradient-to-br from-lime-300 via-emerald-400 to-teal-500 text-neutral-950' },
  { to: '/planning', emoji: '🗓️', label: 'Plan', tone: 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white' },
  { to: '/keuangan', emoji: '💰', label: 'Money', tone: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 text-neutral-950' },
  { to: '/learn', emoji: '📚', label: 'Life', tone: 'bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 text-white' },
  { to: '/community', emoji: '👥', label: 'People', tone: 'bg-gradient-to-br from-fuchsia-500 via-rose-500 to-red-500 text-white' },
  { to: '/body-explorer', emoji: '🫀', label: '3D Body', tone: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 text-white' },
  { to: '/chatbot', emoji: '✨', label: 'Ask', tone: 'bg-gradient-to-br from-orange-400 via-red-500 to-fuchsia-600 text-white' },
]

type Signal = { label: string; value: string; unit?: string; tone: string; to: string }

function HomeLoadingCard({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div
      className={`rounded-[26px] border border-neutral-200/80 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[.025] ${tall ? 'min-h-[180px]' : 'min-h-[82px]'}`}
      aria-label={`${label} loading`}
    >
      <div className="h-2.5 w-24 rounded-full bg-neutral-200/80 dark:bg-white/10" />
      <div className="mt-3 h-4 w-52 max-w-[68%] rounded-full bg-neutral-100 dark:bg-white/[.06]" />
    </div>
  )
}

function DeferredHomeBlock({
  children,
  label,
  tall = false,
  rootMargin = '180px 0px',
  delayMs = 80,
}: {
  children: ReactNode
  label: string
  tall?: boolean
  rootMargin?: string
  delayMs?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (ready) return
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      const timer = window.setTimeout(() => setReady(true), delayMs)
      return () => window.clearTimeout(timer)
    }

    let timer = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      // Let the hero, key metrics and Training shortcut paint before optional
      // chunks start parsing/evaluating on lower-memory mobile browsers.
      timer = window.setTimeout(() => setReady(true), delayMs)
    }, { rootMargin })

    observer.observe(node)
    return () => {
      observer.disconnect()
      if (timer) window.clearTimeout(timer)
    }
  }, [delayMs, ready, rootMargin])

  return (
    <div ref={ref}>
      {ready ? children : <HomeLoadingCard label={label} tall={tall} />}
    </div>
  )
}

export default function Beranda() {
  const { account, state } = useStore()
  const [refresh, setRefresh] = useState(0)
  const [logsOpen, setLogsOpen] = useState(false)

  useEffect(() => {
    const update = () => setRefresh((x) => x + 1)
    window.addEventListener('panacea:health-updated', update)
    return () => window.removeEventListener('panacea:health-updated', update)
  }, [])

  const vitals = useMemo(() => getVitals(), [refresh])
  const workouts = useMemo(() => getWorkouts(), [refresh])
  const name = account?.name?.trim().split(/\s+/)[0] || ''

  const tanggalCatatan = useMemo(() => {
    const dates = new Set<string>()
    for (const sleep of state.sleepLogs ?? []) if (sleep?.date) dates.add(sleep.date)
    for (const date of Object.keys(state.wellness ?? {})) dates.add(date)
    return [...dates]
  }, [state.sleepLogs, state.wellness])

  const pratinjau = useMemo(
    () => pratinjauBeranda({
      foods: state.foods ?? [],
      sleepLogs: state.sleepLogs ?? [],
      umur: account?.dob ? ageFromDob(account.dob) : undefined,
    }),
    [state.foods, state.sleepLogs, account?.dob, refresh],
  )

  const signals = useMemo<Signal[]>(() => {
    const out: Signal[] = []
    const lastSleep = [...(state.sleepLogs ?? [])]
      .filter((x) => typeof x?.hours === 'number' && x.hours > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0]

    if (typeof vitals.steps === 'number' && vitals.steps > 0) {
      out.push({ label: 'Steps', value: Math.round(vitals.steps).toLocaleString(), unit: 'today', tone: 'text-emerald-700 dark:text-emerald-300', to: '/tubuh?t=gerak' })
    }
    if (lastSleep) {
      out.push({ label: 'Sleep', value: (Math.round(lastSleep.hours * 10) / 10).toString(), unit: 'hours', tone: 'text-indigo-700 dark:text-indigo-300', to: '/tubuh?t=tidur' })
    } else if (typeof vitals.sleepH === 'number' && vitals.sleepH > 0) {
      out.push({ label: 'Sleep', value: (Math.round(vitals.sleepH * 10) / 10).toString(), unit: 'hours', tone: 'text-indigo-700 dark:text-indigo-300', to: '/tubuh?t=tidur' })
    }
    if (typeof vitals.restingHr === 'number' && vitals.restingHr > 0) {
      out.push({ label: 'Resting HR', value: Math.round(vitals.restingHr).toString(), unit: 'bpm', tone: 'text-rose-700 dark:text-rose-300', to: '/tubuh?t=jantung' })
    }
    if (typeof vitals.vo2max === 'number' && vitals.vo2max > 0) {
      out.push({ label: 'VO₂max', value: (Math.round(vitals.vo2max * 10) / 10).toString(), unit: 'mL/kg/min', tone: 'text-sky-700 dark:text-sky-300', to: '/latihan?t=lab' })
    }
    if (typeof vitals.weightKg === 'number' && vitals.weightKg > 0) {
      out.push({ label: 'Weight', value: vitals.weightKg.toString(), unit: 'kg', tone: 'text-neutral-900 dark:text-white', to: '/body' })
    }
    if (workouts.length > 0) {
      out.push({ label: 'Sessions', value: workouts.length.toString(), unit: 'recorded', tone: 'text-violet-700 dark:text-violet-300', to: '/latihan' })
    }
    return out
  }, [vitals, workouts, state.sleepLogs])

  return (
    <main className="panacea-home mx-auto w-full max-w-4xl space-y-6 pb-24">
      <div className="panacea-home-backdrop" aria-hidden />

      <section className="home-odyssey-hero p-5 sm:p-7">
        <div className="home-orbit-core" aria-hidden>
          <span className="core" />
          <span className="satellite" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="home-odyssey-kicker">Panacea · Human Odyssey</div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => window.dispatchEvent(new Event('panacea:cari'))}
                className="grid h-11 w-11 place-items-center rounded-full border border-black/[.07] bg-white/70 text-lg text-neutral-800 shadow-sm backdrop-blur-xl transition active:scale-95 dark:border-white/10 dark:bg-white/[.08] dark:text-white"
                aria-label="Search"
              >⌕</button>
              <Link
                to="/atur-fitur"
                className="grid h-11 w-11 place-items-center rounded-full bg-neutral-950 text-lg text-white shadow-[0_10px_30px_rgba(20,20,35,.22)] transition active:scale-95 dark:bg-white dark:text-neutral-950"
                aria-label="Manage Home widgets"
              >＋</Link>
            </div>
          </div>

          <h1 className="home-odyssey-title">
            {name ? `Hi, ${name}. ` : ''}Build your <span className="energy-word">strongest life.</span>
          </h1>
          <p className="home-odyssey-copy">
            Health, performance, recovery, knowledge, relationships and purpose — one evolving system for the life you are building.
          </p>

          <div className="home-odyssey-actions">
            <Link to="/latihan" className="home-primary-action">Open training <span aria-hidden>→</span></Link>
            <Link to="/harian" className="home-secondary-action">Log today <span aria-hidden>＋</span></Link>
            <Link to="/chatbot" className="home-secondary-action">Ask Panacea <span aria-hidden>✦</span></Link>
          </div>

          <div className="home-journey-strip" aria-label="Life journey dimensions">
            <div className="home-journey-chip"><strong>Body</strong><span>Capacity · recovery</span></div>
            <div className="home-journey-chip"><strong>Mind</strong><span>Focus · knowledge</span></div>
            <div className="home-journey-chip"><strong>Legacy</strong><span>Purpose · people</span></div>
          </div>

          {signals.length > 0 ? (
            <div className="home-signal-rail no-scrollbar -mx-1 mt-5 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1">
              {signals.map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  className="home-signal-card min-h-[112px] w-[142px] shrink-0 snap-start rounded-[22px] p-3.5 transition active:scale-[.98]"
                >
                  <div className="text-[9px] font-black uppercase tracking-[.13em] text-neutral-500 dark:text-neutral-400">{s.label}</div>
                  <div className={`mt-4 text-[30px] font-black leading-none tracking-[-.045em] tabular-nums ${s.tone}`}>{s.value}</div>
                  {s.unit && <div className="mt-2 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">{s.unit}</div>}
                </Link>
              ))}
            </div>
          ) : (
            <Link to="/harian" className="home-signal-card mt-5 flex min-h-[58px] max-w-md items-center justify-between rounded-2xl px-4 text-sm font-bold text-neutral-800 dark:text-white">
              Add your first health or daily entry <span className="text-lg">›</span>
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-neutral-400">Daily movement</div>
            <h2 className="mt-0.5 text-[13px] font-black text-neutral-900 dark:text-white">Training first</h2>
          </div>
          <Link to="/latihan" className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">Training hub ›</Link>
        </div>
        <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {PINTASAN.map((p) => (
            <Link key={p.to + p.label} to={p.to} className="w-[84px] shrink-0 snap-start text-center active:scale-95">
              <span className={`home-shortcut-tile mx-auto h-[62px] w-[62px] rounded-[20px] text-[25px] ${p.tone}`}>{p.emoji}</span>
              <span className="mt-1.5 block truncate text-[10px] font-bold text-neutral-700 dark:text-neutral-200">{p.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <DeferredHomeBlock label="Performance" tall rootMargin="500px 0px" delayMs={120}>
        <HomeSectionBoundary label="Performance analytics">
          <Suspense fallback={<HomeLoadingCard label="Performance" tall />}>
            <LazyPerformanceVisualizationDeck mode="home" />
          </Suspense>
        </HomeSectionBoundary>
      </DeferredHomeBlock>

      <DeferredHomeBlock label="Growth" rootMargin="240px 0px">
        <HomeSectionBoundary label="Growth rail">
          <Suspense fallback={<HomeLoadingCard label="Growth" />}>
            <LazyPanaceaGrowthRail />
          </Suspense>
        </HomeSectionBoundary>
      </DeferredHomeBlock>

      <DeferredHomeBlock label="Utilities" rootMargin="180px 0px">
        <HomeSectionBoundary label="Utility shelf">
          <Suspense fallback={<HomeLoadingCard label="Utilities" />}>
            <LazyPanaceaUtilityShelf />
          </Suspense>
        </HomeSectionBoundary>
      </DeferredHomeBlock>

      <section className="home-section-shell rounded-[28px] p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">Command deck</div>
            <h2 className="mt-1 text-[18px] font-black tracking-tight text-neutral-950 dark:text-white">My dashboard</h2>
          </div>
          <Link to="/atur-fitur" className="shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-[10px] font-black text-neutral-700 dark:bg-white/10 dark:text-neutral-200">Customize</Link>
        </div>
        <DeferredHomeBlock label="Dashboard widgets" tall rootMargin="160px 0px">
          <HomeSectionBoundary label="Dashboard widgets">
            <Suspense fallback={<HomeLoadingCard label="Dashboard widgets" tall />}>
              <LazyPapanWidget pratinjau={pratinjau} tanggalCatatan={tanggalCatatan} />
            </Suspense>
          </HomeSectionBoundary>
        </DeferredHomeBlock>
      </section>

      <HomeSectionBoundary label="Body Exposure">
        <DeferredBodyExposureWidget />
      </HomeSectionBoundary>
      <HomeSectionBoundary label="Feature universe">
        <DeferredHomeFeatureUniverse />
      </HomeSectionBoundary>
      <HomeSectionBoundary label="Learning shelf">
        <DeferredPanaceaLearningRail />
      </HomeSectionBoundary>

      <details
        className="home-section-shell group rounded-[26px] p-4"
        onToggle={(event) => setLogsOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">Today</div>
            <div className="mt-1 text-[16px] font-black text-neutral-950 dark:text-white">Log my day or workout</div>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-lg text-neutral-700 transition group-open:rotate-45 dark:bg-white/10 dark:text-white">＋</span>
        </summary>
        {logsOpen && (
          <div className="mt-4 space-y-4 border-t border-neutral-100 pt-4 dark:border-white/10">
            <HomeSectionBoundary label="Daily log">
              <Suspense fallback={<HomeLoadingCard label="Daily log" />}>
                <LazyCatatanHarian />
              </Suspense>
            </HomeSectionBoundary>
            <HomeSectionBoundary label="Workout log">
              <Suspense fallback={<HomeLoadingCard label="Workout log" />}>
                <LazyCatatanLatihan />
              </Suspense>
            </HomeSectionBoundary>
          </div>
        )}
      </details>

      <DeferredHomeBlock label="Feature catalogue" tall rootMargin="120px 0px">
        <HomeSectionBoundary label="Feature catalogue">
          <Suspense fallback={<HomeLoadingCard label="Feature catalogue" tall />}>
            <LazyKisiFitur />
          </Suspense>
        </HomeSectionBoundary>
      </DeferredHomeBlock>
    </main>
  )
}
