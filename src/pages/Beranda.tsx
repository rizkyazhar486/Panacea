import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { ActivityAchievementWidget } from '../components/dashboard/ActivityAchievementWidget'
import { LibraryDiscoveryWidget } from '../components/dashboard/LibraryDiscoveryWidget'
import { SignatureExperiencesWidget } from '../components/dashboard/SignatureExperiencesWidget'
import { LifeOSWidgets } from '../components/dashboard/LifeOSWidgets'
import { HumanPassportWidget } from '../components/growth/HumanPassportWidget'
import { LearningModeSwitch } from '../components/LearningModeSwitch'
import {
  IconActivity,
  IconBook,
  IconChat,
  IconHeart,
  IconPlan,
  IconRun,
  IconSparkle,
  IconWallet,
} from '../components/icons'
import '../styles/panacea2026.css'

type QuickAction = {
  to: string
  title: string
  hint: string
  icon: ComponentType<{ size?: number }>
}

const QUICK_ACTIONS: QuickAction[] = [
  { to: '/planning', title: 'Plan', hint: 'Day · goals · priorities', icon: IconPlan },
  { to: '/keuangan', title: 'Money', hint: 'Cash flow · debt · buffer', icon: IconWallet },
  { to: '/latihan', title: 'Move', hint: 'Run · workout · recovery', icon: IconRun },
  { to: '/tubuh', title: 'Body', hint: 'Sleep · vitals · signals', icon: IconHeart },
  { to: '/med-study', title: 'Learn', hint: 'Study · medicine · knowledge', icon: IconBook },
  { to: '/body-explorer', title: '3D Atlas', hint: 'Anatomy made visual', icon: IconActivity },
  { to: '/chatbot', title: 'Ask', hint: 'Talk to Panacea', icon: IconChat },
  { to: '/semua-fitur', title: 'More', hint: 'Everything else', icon: IconSparkle },
]

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
  const { account } = useStore()
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    const update = () => setRefresh((x) => x + 1)
    window.addEventListener('panacea:health-updated', update)
    return () => window.removeEventListener('panacea:health-updated', update)
  }, [])

  const vitals = useMemo(() => getVitals(), [refresh])
  const workouts = useMemo(() => getWorkouts(), [refresh])
  const name = account?.name?.trim().split(/\s+/)[0] || ''
  const totalKm = workouts.reduce((n, w) => n + (w.jarakKm ?? 0), 0)
  const activeMinutes = workouts.reduce((n, w) => n + w.durasi / 60, 0)
  const latest = workouts[0]

  const signals = [
    vitals.restingHr ? { label: 'Resting HR', value: `${Math.round(vitals.restingHr)}`, unit: 'bpm' } : null,
    vitals.sleepH ? { label: 'Sleep', value: `${Math.round(vitals.sleepH * 10) / 10}`, unit: 'hours' } : null,
    vitals.vo2max ? { label: 'VO₂max', value: `${Math.round(vitals.vo2max * 10) / 10}`, unit: 'mL/kg/min' } : null,
    workouts.length ? { label: 'Activities', value: `${workouts.length}`, unit: formatDate(latest?.mulai) } : null,
  ].filter((x): x is { label: string; value: string; unit: string } => Boolean(x))

  return (
    <main className="panacea-app-surface mx-auto max-w-6xl space-y-4 px-3 pb-24 pt-2 sm:space-y-5 sm:px-5">
      <section className="panacea-dashboard-hero p-5 sm:p-7">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.18fr_.82fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="panacea-kicker">Life OS · body, mind, time, money, learning</div>
            <h1 className="mt-4 text-[clamp(2.2rem,6vw,4.8rem)] font-black leading-[.93] tracking-[-.055em] text-white">
              {greeting()}{name ? `, ${name}` : ''}.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
              Panacea is not just medicine. It is one place to organize the things that shape your life: time, focus, movement, money, learning, relationships and health.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/planning" className="liquid-orbit-button">Plan today <span aria-hidden>→</span></Link>
              <Link to="/harian" className="liquid-orbit-button">Log my day <span aria-hidden>＋</span></Link>
              <Link to="/semua-fitur" className="liquid-orbit-button">Explore Panacea <span aria-hidden>✦</span></Link>
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="panacea-kicker !text-neutral-500 dark:!text-white/55">Jump back in</div>
            <h2 className="mt-1 text-lg font-black tracking-tight text-neutral-900 dark:text-white">Choose a part of your life</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-white/45">Simple labels first. Detailed tools stay one level deeper.</p>
          </div>
          <Link to="/semua-fitur" className="text-xs font-black text-brand-dark dark:text-emerald-300">See all →</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.to} to={action.to} className="panacea-quick-action group">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-black/[.05] bg-white/65 text-neutral-700 shadow-[inset_0_1px_rgba(255,255,255,.8)] transition group-hover:scale-105 dark:border-white/10 dark:bg-white/[.05] dark:text-white"><Icon size={18} /></span>
                <span className="min-w-0"><span className="block truncate text-xs font-black text-neutral-800 dark:text-white">{action.title}</span><span className="mt-0.5 block text-[9px] leading-tight text-neutral-400">{action.hint}</span></span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="liquid-panel p-4 sm:p-5">
          <LearningModeSwitch />
        </div>
        <div className="liquid-panel p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <IconSparkle size={17} />
            <h2 className="text-sm font-black text-neutral-900 dark:text-white">Movement at a glance</h2>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-cyan-50/80 p-3 text-center dark:bg-cyan-300/[.05]"><div className="text-xl font-black tabular-nums text-neutral-900 dark:text-white">{totalKm.toFixed(1)}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">km logged</div></div>
            <div className="rounded-2xl bg-emerald-50/80 p-3 text-center dark:bg-emerald-300/[.05]"><div className="text-xl font-black tabular-nums text-neutral-900 dark:text-white">{Math.round(activeMinutes)}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">active min</div></div>
            <div className="rounded-2xl bg-violet-50/80 p-3 text-center dark:bg-violet-300/[.05]"><div className="text-xl font-black tabular-nums text-neutral-900 dark:text-white">{workouts.length}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">sessions</div></div>
          </div>
          <Link to="/latihan" className="mt-3 inline-flex text-[10px] font-black text-brand-dark dark:text-emerald-300">Open movement →</Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityAchievementWidget />
        <LibraryDiscoveryWidget />
      </section>

      <SignatureExperiencesWidget />
      <HumanPassportWidget name={name} />

      <section className="grid gap-3 sm:grid-cols-3">
        <Link to="/community" className="liquid-panel p-4 transition hover:-translate-y-0.5"><div className="panacea-kicker !text-neutral-500 dark:!text-white/50">People</div><div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">Health is social too</div><p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">Community, relationships and shared experiences belong beside metrics—not underneath them.</p></Link>
        <Link to="/feed" className="liquid-panel p-4 transition hover:-translate-y-0.5"><div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Discover</div><div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">Useful things worth knowing</div><p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">Briefings and learning content without turning the home screen into a clinical chart.</p></Link>
        <Link to="/tutorial" className="liquid-panel p-4 transition hover:-translate-y-0.5"><div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Guide</div><div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">New here? Start small.</div><p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">Understand Panacea one useful action at a time, instead of facing hundreds of features at once.</p></Link>
      </section>
    </main>
  )
}
