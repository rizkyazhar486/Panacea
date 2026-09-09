import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { DeferredBodyExposureWidget, DeferredHomeFeatureUniverse, DeferredPanaceaLearningRail } from '../components/dashboard/DeferredHomeSections'
import { HomeSectionBoundary } from '../components/HomeSectionBoundary'
import { pratinjauBeranda } from '../lib/pratinjauBeranda'
import { getVitals, vitalsAge } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { ageFromDob } from '../lib/anthro'
import { emptyHomeDailyState, homeDailyStateSignature, PANACEA_STATE_STORAGE_KEY, parseHomeDailyState, type HomeDailyState } from '../lib/homeCrossTabDailyState'
import '../styles/home-odyssey.css'
import '../styles/home-utility-polish.css'
import '../styles/home-mobile-stability.css'

const LazyPapanWidget = lazy(() => import('../components/PapanWidget').then((m) => ({ default: m.PapanWidget })))
const LazyKisiFitur = lazy(() => import('../components/KisiFitur').then((m) => ({ default: m.KisiFitur })))
const LazyCatatanHarian = lazy(() => import('../components/CatatanHarian').then((m) => ({ default: m.CatatanHarian })))
const LazyCatatanLatihan = lazy(() => import('../components/CatatanLatihan').then((m) => ({ default: m.CatatanLatihan })))
const LazyPerformanceVisualizationDeck = lazy(() => import('../components/dashboard/PerformanceVisualizationDeck').then((m) => ({ default: m.PerformanceVisualizationDeck })))

type QuickAction = {
  to: string
  emoji: string
  label: string
  note: string
  accent: string
}

const AKSI_UTAMA: QuickAction[] = [
  { to: '/latihan', emoji: '🏃', label: 'Training', note: 'Start session · history · zones', accent: 'from-emerald-400 to-cyan-500' },
  { to: '/readiness', emoji: '🔆', label: 'Readiness', note: 'Recorded recovery inputs', accent: 'from-amber-400 to-orange-500' },
  { to: '/recovery', emoji: '🌙', label: 'Recovery', note: 'Sleep · recovery tools', accent: 'from-indigo-500 to-violet-600' },
  { to: '/tubuh', emoji: '❤️', label: 'Body', note: 'Vitals · trends · health data', accent: 'from-rose-500 to-red-600' },
  { to: '/pola-tidur', emoji: '😴', label: 'Sleep', note: 'Duration · stages · history', accent: 'from-blue-500 to-indigo-600' },
  { to: '/hydration', emoji: '💧', label: 'Hydration', note: 'Recorded hydration data', accent: 'from-sky-400 to-blue-500' },
  { to: '/nutrition', emoji: '🥗', label: 'Nutrition', note: 'Food · macros · intake', accent: 'from-lime-400 to-emerald-500' },
  { to: '/med-reminders', emoji: '💊', label: 'Medication', note: 'Dose reminders', accent: 'from-fuchsia-500 to-pink-600' },
  { to: '/planning', emoji: '🗓️', label: 'Plan', note: 'Turn goals into actions', accent: 'from-cyan-500 to-blue-600' },
  { to: '/emergency', emoji: '🆘', label: 'Emergency', note: 'Emergency health card', accent: 'from-red-500 to-orange-500' },
  { to: '/body-explorer', emoji: '🫀', label: '3D Body', note: 'Explore anatomy visually', accent: 'from-violet-500 to-blue-600' },
  { to: '/chatbot', emoji: '✨', label: 'Ask Panacea', note: 'Ask from your context', accent: 'from-orange-400 to-fuchsia-600' },
]

type Signal = {
  label: string
  value: string
  unit?: string
  meta?: string
  tone: string
  to: string
}

function HomeLoadingCard({ label, tall = false }: { label: string; tall?: boolean }) {
  return (
    <div
      className={`home-loading-card ${tall ? 'min-h-[180px]' : 'min-h-[82px]'}`}
      aria-label={`${label} loading`}
      aria-busy="true"
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
      timer = window.setTimeout(() => setReady(true), delayMs)
    }, { rootMargin })

    observer.observe(node)
    return () => {
      observer.disconnect()
      if (timer) window.clearTimeout(timer)
    }
  }, [delayMs, ready, rootMargin])

  return <div ref={ref}>{ready ? children : <HomeLoadingCard label={label} tall={tall} />}</div>
}

export default function Beranda() {
  const { account, state } = useStore()
  const [refresh, setRefresh] = useState(0)
  const [externalDailyState, setExternalDailyState] = useState<HomeDailyState | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const lowMemory = typeof document !== 'undefined' && document.documentElement.classList.contains('pmd-low-memory')

  const localDailyState = useMemo<HomeDailyState>(() => ({
    foods: state.foods ?? [],
    sleepLogs: state.sleepLogs ?? [],
    wellness: state.wellness ?? {},
  }), [state.foods, state.sleepLogs, state.wellness])
  const localDailySignature = useMemo(() => homeDailyStateSignature(localDailyState), [localDailyState])
  const localDailySignatureRef = useRef(localDailySignature)

  useEffect(() => {
    if (localDailySignatureRef.current === localDailySignature) return
    localDailySignatureRef.current = localDailySignature
    setExternalDailyState(null)
  }, [localDailySignature])

  useEffect(() => {
    const update = () => setRefresh((x) => x + 1)
    const onStorage = (event: StorageEvent) => {
      update()
      if (event.key !== PANACEA_STATE_STORAGE_KEY) return
      if (event.newValue === null) {
        setExternalDailyState(emptyHomeDailyState())
        return
      }
      const next = parseHomeDailyState(event.newValue)
      if (next) setExternalDailyState(next)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') update()
    }
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const dailyState = externalDailyState ?? localDailyState
  const dailyFoods = dailyState.foods ?? []
  const dailySleepLogs = dailyState.sleepLogs ?? []
  const dailyWellness = dailyState.wellness ?? {}
  const vitals = useMemo(() => getVitals(), [refresh])
  const workouts = useMemo(() => getWorkouts(), [refresh])
  const name = account?.name?.trim().split(/\s+/)[0] || ''
  const vitalsFreshness = useMemo(() => vitalsAge(vitals), [vitals])
  const vitalsMeta = useMemo(
    () => [typeof vitals.source === 'string' ? vitals.source.trim() : '', vitalsFreshness ?? '']
      .filter(Boolean)
      .join(' · '),
    [vitals.source, vitalsFreshness],
  )

  const tanggalCatatan = useMemo(() => {
    const dates = new Set<string>()
    for (const sleep of dailySleepLogs) if (sleep?.date) dates.add(sleep.date)
    for (const date of Object.keys(dailyWellness)) dates.add(date)
    return [...dates]
  }, [dailySleepLogs, dailyWellness])

  const pratinjau = useMemo(
    () => pratinjauBeranda({
      foods: dailyFoods,
      sleepLogs: dailySleepLogs,
      umur: account?.dob ? ageFromDob(account.dob) : undefined,
    }),
    [dailyFoods, dailySleepLogs, account?.dob, refresh],
  )

  const signals = useMemo<Signal[]>(() => {
    const out: Signal[] = []
    const sharedMeta = vitalsMeta || 'Source/time unavailable'
    const lastSleep = [...dailySleepLogs]
      .filter((x) => typeof x?.hours === 'number' && x.hours > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0]

    if (typeof vitals.steps === 'number' && vitals.steps > 0) {
      out.push({ label: 'Steps', value: Math.round(vitals.steps).toLocaleString(), unit: 'steps', meta: sharedMeta, tone: 'text-emerald-700 dark:text-emerald-300', to: '/tubuh?t=gerak' })
    }
    if (lastSleep) {
      out.push({ label: 'Sleep', value: (Math.round(lastSleep.hours * 10) / 10).toString(), unit: 'hours', meta: lastSleep.date ? `Recorded ${lastSleep.date}` : 'Recorded sleep log', tone: 'text-indigo-700 dark:text-indigo-300', to: '/tubuh?t=tidur' })
    } else if (typeof vitals.sleepH === 'number' && vitals.sleepH > 0) {
      out.push({ label: 'Sleep', value: (Math.round(vitals.sleepH * 10) / 10).toString(), unit: 'hours', meta: sharedMeta, tone: 'text-indigo-700 dark:text-indigo-300', to: '/tubuh?t=tidur' })
    }
    if (typeof vitals.restingHr === 'number' && vitals.restingHr > 0) {
      out.push({ label: 'Resting HR', value: Math.round(vitals.restingHr).toString(), unit: 'bpm', meta: sharedMeta, tone: 'text-rose-700 dark:text-rose-300', to: '/tubuh?t=jantung' })
    }
    if (typeof vitals.vo2max === 'number' && vitals.vo2max > 0) {
      out.push({ label: 'VO₂max', value: (Math.round(vitals.vo2max * 10) / 10).toString(), unit: 'mL/kg/min', meta: sharedMeta, tone: 'text-sky-700 dark:text-sky-300', to: '/latihan?t=lab' })
    }
    if (typeof vitals.weightKg === 'number' && vitals.weightKg > 0) {
      out.push({ label: 'Weight', value: vitals.weightKg.toString(), unit: 'kg', meta: sharedMeta, tone: 'text-neutral-900 dark:text-white', to: '/body' })
    }
    if (workouts.length > 0) {
      out.push({ label: 'Sessions', value: workouts.length.toString(), unit: 'recorded', meta: 'Local workout history', tone: 'text-violet-700 dark:text-violet-300', to: '/latihan' })
    }
    return out
  }, [vitals, workouts, dailySleepLogs, vitalsMeta])

  return (
    <main className="panacea-home mx-auto w-full max-w-4xl space-y-5 pb-24">
      <div className="panacea-home-backdrop" aria-hidden />

      <section className="home-odyssey-hero p-5 sm:p-7" aria-labelledby="panacea-home-title">
        <div className="home-orbit-core" aria-hidden>
          <span className="core" />
          <span className="satellite" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="home-odyssey-kicker">Panacea · Daily command</div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('panacea:cari'))}
                className="home-icon-button"
                aria-label="Search Panacea"
              >⌕</button>
              <Link to="/atur-fitur" className="home-icon-button home-icon-button-strong" aria-label="Customize Home widgets">＋</Link>
            </div>
          </div>

          <h1 id="panacea-home-title" className="home-odyssey-title">
            {name ? `Hi, ${name}. ` : ''}Your <span className="energy-word">daily command center.</span>
          </h1>
          <p className="home-odyssey-copy">
            Useful actions, recorded health signals and your own widgets — dense enough to work every day, light enough to stay smooth.
          </p>

          <div className="home-odyssey-actions">
            <Link to="/latihan" className="home-primary-action">Start training <span aria-hidden>→</span></Link>
            <button type="button" onClick={() => setLogsOpen(true)} className="home-secondary-action">Quick log <span aria-hidden>＋</span></button>
            <Link to="/readiness" className="home-secondary-action">Review readiness <span aria-hidden>↗</span></Link>
          </div>

          {signals.length > 0 ? (
            <div className="home-signal-rail no-scrollbar -mx-1 mt-4 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1" aria-label="Recorded health signals" aria-live="polite">
              {signals.slice(0, 5).map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  className="home-signal-card min-h-[116px] w-[148px] shrink-0 snap-start rounded-[20px] p-3 transition active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="text-[11px] font-black uppercase tracking-[.11em] text-neutral-600 dark:text-neutral-300">{s.label}</div>
                  <div className={`mt-2.5 text-[27px] font-black leading-none tracking-[-.045em] tabular-nums ${s.tone}`}>{s.value}</div>
                  {s.unit && <div className="mt-1.5 truncate text-[10.5px] font-bold text-neutral-600 dark:text-neutral-300">{s.unit}</div>}
                  {s.meta && <div className="mt-1 truncate text-[10px] font-semibold text-neutral-600 dark:text-neutral-300" title={s.meta}>{s.meta}</div>}
                </Link>
              ))}
            </div>
          ) : (
            <Link to="/harian" className="home-signal-card mt-4 flex min-h-[58px] max-w-md items-center justify-between rounded-2xl px-4 text-sm font-bold text-neutral-800 dark:text-white">
              Add your first health or daily entry <span className="text-lg">›</span>
            </Link>
          )}
        </div>
      </section>

      <section className="home-command-panel" aria-labelledby="daily-tools-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.14em] text-neutral-600 dark:text-neutral-300">High utility</div>
            <h2 id="daily-tools-title" className="mt-0.5 text-[17px] font-black tracking-tight text-neutral-950 dark:text-white">What do you need now?</h2>
          </div>
          <Link to="/semua-fitur" className="home-text-link">All features ›</Link>
        </div>
        <div className="home-action-grid">
          {AKSI_UTAMA.map((item) => (
            <Link key={item.to} to={item.to} className="home-action-card min-h-[78px]">
              <span className={`home-action-icon bg-gradient-to-br ${item.accent}`} aria-hidden>{item.emoji}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-black leading-tight text-neutral-950 dark:text-white">{item.label}</span>
                <span className="mt-1 block text-[11px] font-semibold leading-snug text-neutral-600 dark:text-neutral-300">{item.note}</span>
              </span>
              <span className="ml-auto text-neutral-400 dark:text-neutral-500" aria-hidden>›</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-command-panel" aria-labelledby="my-dashboard-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.14em] text-neutral-600 dark:text-neutral-300">Live widgets</div>
            <h2 id="my-dashboard-title" className="mt-0.5 text-[17px] font-black tracking-tight text-neutral-950 dark:text-white">My dashboard</h2>
            <p className="mt-1 text-[12px] font-semibold leading-relaxed text-neutral-600 dark:text-neutral-300">Your selected metrics, trends, timers and reminders stay visible here.</p>
          </div>
          <Link to="/atur-fitur" className="home-pill-button">Customize</Link>
        </div>
        <DeferredHomeBlock
          label="Dashboard widgets"
          tall
          rootMargin={lowMemory ? '40px 0px' : '140px 0px'}
          delayMs={lowMemory ? 120 : 60}
        >
          <HomeSectionBoundary label="Dashboard widgets">
            <Suspense fallback={<HomeLoadingCard label="Dashboard widgets" tall />}>
              <LazyPapanWidget pratinjau={pratinjau} tanggalCatatan={tanggalCatatan} />
            </Suspense>
          </HomeSectionBoundary>
        </DeferredHomeBlock>
      </section>

      <DeferredHomeBlock
        label="Performance"
        tall
        rootMargin={lowMemory ? '0px' : '60px 0px'}
        delayMs={lowMemory ? 260 : 160}
      >
        <HomeSectionBoundary label="Performance analytics">
          <Suspense fallback={<HomeLoadingCard label="Performance" tall />}>
            <LazyPerformanceVisualizationDeck mode="home" />
          </Suspense>
        </HomeSectionBoundary>
      </DeferredHomeBlock>

      <details
        className="home-command-panel group"
        open={logsOpen}
        onToggle={(event) => setLogsOpen(event.currentTarget.open)}
      >
        <summary className="home-details-summary">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.14em] text-neutral-600 dark:text-neutral-300">Fast input</div>
            <div className="mt-0.5 text-[15px] font-black text-neutral-950 dark:text-white">Log today or a workout</div>
          </div>
          <span className="home-summary-plus">＋</span>
        </summary>
        {logsOpen && (
          <div className="mt-4 space-y-4 border-t border-neutral-200/70 pt-4 dark:border-white/10">
            <HomeSectionBoundary label="Workout log">
              <Suspense fallback={<HomeLoadingCard label="Workout log" />}>
                <LazyCatatanLatihan />
              </Suspense>
            </HomeSectionBoundary>
            <HomeSectionBoundary label="Daily log">
              <Suspense fallback={<HomeLoadingCard label="Daily log" />}>
                <LazyCatatanHarian />
              </Suspense>
            </HomeSectionBoundary>
          </div>
        )}
      </details>

      <HomeSectionBoundary label="Body Exposure">
        <DeferredBodyExposureWidget />
      </HomeSectionBoundary>

      <details
        className="home-command-panel group"
        onToggle={(event) => setExploreOpen(event.currentTarget.open)}
      >
        <summary className="home-details-summary">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.14em] text-neutral-600 dark:text-neutral-300">Explore</div>
            <div className="mt-0.5 text-[15px] font-black text-neutral-950 dark:text-white">Learning & Panacea universe</div>
            <div className="mt-1 text-[11px] font-semibold leading-relaxed text-neutral-600 dark:text-neutral-300">Loaded only when you want it.</div>
          </div>
          <span className="text-xl text-neutral-500 transition group-open:rotate-90 dark:text-neutral-400" aria-hidden>›</span>
        </summary>
        {exploreOpen && (
          <div className="mt-4 space-y-5 border-t border-neutral-200/70 pt-4 dark:border-white/10">
            <HomeSectionBoundary label="Feature universe"><DeferredHomeFeatureUniverse /></HomeSectionBoundary>
            <HomeSectionBoundary label="Learning shelf"><DeferredPanaceaLearningRail /></HomeSectionBoundary>
          </div>
        )}
      </details>

      <DeferredHomeBlock
        label="Feature catalogue"
        tall
        rootMargin={lowMemory ? '0px' : '80px 0px'}
        delayMs={lowMemory ? 240 : 120}
      >
        <HomeSectionBoundary label="Feature catalogue">
          <Suspense fallback={<HomeLoadingCard label="Feature catalogue" tall />}>
            <LazyKisiFitur />
          </Suspense>
        </HomeSectionBoundary>
      </DeferredHomeBlock>
    </main>
  )
}