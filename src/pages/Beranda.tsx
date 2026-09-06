import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { ageFromDob } from '../lib/anthro'
import { pratinjauBeranda } from '../lib/pratinjauBeranda'
import { PapanWidget } from '../components/PapanWidget'
import { KisiFitur } from '../components/KisiFitur'
import { SignatureExperiencesWidget } from '../components/dashboard/SignatureExperiencesWidget'
import { LifeOSWidgets } from '../components/dashboard/LifeOSWidgets'
import { HumanPassportWidget } from '../components/growth/HumanPassportWidget'
import '../styles/panacea2026.css'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Still awake'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(iso?: string) {
  if (!iso) return 'No activity yet'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 'Activity logged' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export default function Beranda() {
  const { account, state } = useStore()
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const update = () => setRefresh((x) => x + 1)
    window.addEventListener('panacea:health-updated', update)
    return () => window.removeEventListener('panacea:health-updated', update)
  }, [])

  const vitals = useMemo(() => getVitals(), [refresh])
  const workouts = useMemo(() => getWorkouts(), [refresh])
  const name = account?.name?.trim().split(/\s+/)[0] || ''
  const latest = workouts[0]

  const signals = [
    vitals.restingHr ? { label: 'Resting HR', value: `${Math.round(vitals.restingHr)}`, unit: 'bpm' } : null,
    vitals.sleepH ? { label: 'Sleep', value: `${Math.round(vitals.sleepH * 10) / 10}`, unit: 'hours' } : null,
    vitals.vo2max ? { label: 'VO₂max', value: `${Math.round(vitals.vo2max * 10) / 10}`, unit: 'mL/kg/min' } : null,
    workouts.length ? { label: 'Activities', value: `${workouts.length}`, unit: formatDate(latest?.mulai) } : null,
  ].filter((x): x is { label: string; value: string; unit: string } => Boolean(x))

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

  return (
    <main className="panacea-app-surface mx-auto max-w-6xl space-y-5 px-3 pb-24 pt-2 sm:px-5">
      <section className="panacea-dashboard-hero p-5 sm:p-7">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.18fr_.82fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="panacea-kicker">Life OS · body, mind, time, money, learning</div>
            <h1 className="mt-4 text-[clamp(2.2rem,6vw,4.8rem)] font-black leading-[.93] tracking-[-.055em] text-white">
              {greeting()}{name ? `, ${name}` : ''}.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Panacea is not just medicine. It is one place for the parts of life that shape health: movement, sleep, food, focus, money, learning, relationships, purpose and your body.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/planning" className="liquid-orbit-button">Plan today <span aria-hidden>→</span></Link>
              <Link to="/harian" className="liquid-orbit-button">Log my day <span aria-hidden>＋</span></Link>
              <Link to="/semua-fitur" className="liquid-orbit-button">Explore everything <span aria-hidden>✦</span></Link>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[9px] font-black uppercase tracking-[.18em] text-white/40">Personal signals</div>
            <div className="grid grid-cols-2 gap-2">
              {signals.length ? signals.map((signal) => (
                <div key={signal.label} className="group rounded-2xl border border-white/10 bg-white/[.06] p-3 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/[.09]">
                  <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/42">{signal.label}</div>
                  <div className="mt-2 text-2xl font-black tabular-nums text-white">{signal.value}</div>
                  <div className="mt-1 text-[10px] text-white/45">{signal.unit}</div>
                </div>
              )) : (
                <div className="col-span-full rounded-2xl border border-white/10 bg-white/[.06] p-4 text-sm leading-relaxed text-white/65 backdrop-blur-xl">
                  Your home becomes personal as you use Panacea. Nothing here is filled with fake scores.
                  <Link to="/harian" className="mt-3 block text-xs font-black text-emerald-300">Add my first entry →</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <LifeOSWidgets />

      <section className="liquid-panel p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="panacea-kicker !text-neutral-500 dark:!text-white/55">My widgets</div>
            <h2 className="mt-1 text-xl font-black tracking-tight text-neutral-900 dark:text-white">Your original Panacea widgets are back.</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-500 dark:text-white/45">
              Keep the home screen personal: sleep, training, recovery, nutrition, focus, environment, faith, reminders, learning, body data and the other functional widgets already built into Panacea. Tap Manage widgets inside this section to choose what stays visible.
            </p>
          </div>
        </div>
        <PapanWidget pratinjau={pratinjau} tanggalCatatan={tanggalCatatan} />
      </section>

      <KisiFitur />

      <SignatureExperiencesWidget />
      <HumanPassportWidget name={name} />

      <section className="grid gap-3 sm:grid-cols-3">
        <Link to="/my-story" className="liquid-panel p-4 transition hover:-translate-y-0.5">
          <div className="panacea-kicker !text-rose-600 dark:!text-rose-300">Your story</div>
          <div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">Health inside a whole human life</div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">Relationships, study, career, money, purpose and major life moments belong here too.</p>
        </Link>
        <Link to="/community" className="liquid-panel p-4 transition hover:-translate-y-0.5">
          <div className="panacea-kicker !text-violet-600 dark:!text-violet-300">People</div>
          <div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">Health is social too</div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">Community, relationships and shared experiences belong beside metrics—not underneath them.</p>
        </Link>
        <Link to="/tutorial" className="liquid-panel p-4 transition hover:-translate-y-0.5">
          <div className="panacea-kicker !text-emerald-600 dark:!text-emerald-300">Guide</div>
          <div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">New here? Start small.</div>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">Understand Panacea one useful action at a time, instead of facing hundreds of features at once.</p>
        </Link>
      </section>
    </main>
  )
}
