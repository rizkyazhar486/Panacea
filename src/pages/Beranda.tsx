import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { ActivityAchievementWidget } from '../components/dashboard/ActivityAchievementWidget'
import { LibraryDiscoveryWidget } from '../components/dashboard/LibraryDiscoveryWidget'
import { SignatureExperiencesWidget } from '../components/dashboard/SignatureExperiencesWidget'
import { HumanPassportWidget } from '../components/growth/HumanPassportWidget'
import { LearningModeSwitch } from '../components/LearningModeSwitch'
import {
  IconActivity,
  IconBook,
  IconChat,
  IconHeart,
  IconPill,
  IconRun,
  IconSparkle,
} from '../components/icons'
import '../styles/panacea2026.css'

type QuickAction = {
  to: string
  title: string
  hint: string
  icon: ComponentType<{ size?: number }>
}

const QUICK_ACTIONS: QuickAction[] = [
  { to: '/body-explorer', title: '4D Body', hint: 'Anatomy · radiology · physiology', icon: IconActivity },
  { to: '/med-study', title: 'Learn', hint: 'Diseases · questions · clinical skills', icon: IconBook },
  { to: '/drug-info', title: 'Drugs', hint: 'MOA · uses · adverse effects', icon: IconPill },
  { to: '/latihan', title: 'Training', hint: 'Run · workout · recovery', icon: IconRun },
  { to: '/chatbot', title: 'Ask Panacea', hint: 'Health questions with context', icon: IconChat },
  { to: '/tubuh', title: 'My Signals', hint: 'Vitals · trends · body data', icon: IconHeart },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
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
    vitals.vo2max ? { label: 'VO₂max', value: `${Math.round(vitals.vo2max * 10) / 10}`, unit: 'mL/kg/min' } : null,
    vitals.weightKg ? { label: 'Weight', value: `${vitals.weightKg}`, unit: 'kg' } : null,
    workouts.length ? { label: 'Activities', value: `${workouts.length}`, unit: formatDate(latest?.mulai) } : null,
  ].filter((x): x is { label: string; value: string; unit: string } => Boolean(x))

  return (
    <main className="panacea-app-surface mx-auto max-w-6xl space-y-4 px-3 pb-24 pt-2 sm:space-y-5 sm:px-5">
      <section className="panacea-dashboard-hero p-5 sm:p-7">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="panacea-kicker">PanaceaMed · human health operating system</div>
            <h1 className="mt-4 text-[clamp(2rem,6vw,4.4rem)] font-black leading-[.96] tracking-[-.045em] text-white">
              {greeting()}{name ? `, ${name}` : ''}.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/62 sm:text-base">
              One calm place for your body, training, medical learning and clinical tools. The dashboard shows what matters now; the deeper system stays one tap away.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => window.dispatchEvent(new Event('panacea:cari'))} className="liquid-orbit-button">Search anything <span aria-hidden>⌕</span></button>
              <Link to="/harian" className="liquid-orbit-button">Log today <span aria-hidden>＋</span></Link>
              <Link to="/body-explorer" className="liquid-orbit-button">Explore body <span aria-hidden>→</span></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
            {signals.length ? signals.map((signal) => (
              <div key={signal.label} className="rounded-2xl border border-white/10 bg-white/[.055] p-3 backdrop-blur-xl">
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-white/42">{signal.label}</div>
                <div className="mt-2 text-2xl font-black tabular-nums text-white">{signal.value}</div>
                <div className="mt-1 text-[10px] text-white/45">{signal.unit}</div>
              </div>
            )) : (
              <div className="col-span-full rounded-2xl border border-white/10 bg-white/[.055] p-4 text-sm text-white/65 backdrop-blur-xl">
                Your dashboard will fill itself from real health and activity logs. Start with one entry—no fake scores or placeholder wellness numbers.
              </div>
            )}
          </div>
        </div>
      </section>

      <HumanPassportWidget name={name} />
      <SignatureExperiencesWidget />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="liquid-panel p-4 sm:p-5">
          <LearningModeSwitch />
        </div>
        <div className="liquid-panel p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <IconSparkle size={17} />
            <h2 className="text-sm font-black text-neutral-900 dark:text-white">Today at a glance</h2>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/45 p-3 text-center dark:bg-white/[.035]"><div className="text-xl font-black tabular-nums text-neutral-900 dark:text-white">{totalKm.toFixed(1)}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">km logged</div></div>
            <div className="rounded-2xl bg-white/45 p-3 text-center dark:bg-white/[.035]"><div className="text-xl font-black tabular-nums text-neutral-900 dark:text-white">{Math.round(activeMinutes)}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">active min</div></div>
            <div className="rounded-2xl bg-white/45 p-3 text-center dark:bg-white/[.035]"><div className="text-xl font-black tabular-nums text-neutral-900 dark:text-white">{workouts.length}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-wide text-neutral-400">sessions</div></div>
          </div>
        </div>
      </section>

      <section className="liquid-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="panacea-kicker !text-neutral-500 dark:!text-white/55">Shortcuts</div>
            <h2 className="mt-1 text-lg font-black tracking-tight text-neutral-900 dark:text-white">Do the next useful thing</h2>
          </div>
          <Link to="/semua-fitur" className="text-xs font-black text-brand-dark dark:text-emerald-300">All features →</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.to} to={action.to} className="panacea-quick-action">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-black/[.05] bg-white/55 text-neutral-700 shadow-[inset_0_1px_rgba(255,255,255,.8)] dark:border-white/10 dark:bg-white/[.05] dark:text-white"><Icon size={18} /></span>
                <span className="min-w-0"><span className="block truncate text-xs font-black text-neutral-800 dark:text-white">{action.title}</span><span className="mt-0.5 block text-[9px] leading-tight text-neutral-400">{action.hint}</span></span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActivityAchievementWidget />
        <LibraryDiscoveryWidget />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link to="/med-study" className="liquid-panel p-4"><div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Learn</div><div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">Make difficult medicine understandable</div><p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">Questions, diseases, drugs and skills are organized by purpose and explanation depth.</p></Link>
        <Link to="/feed" className="liquid-panel p-4"><div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Briefing</div><div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">Source-aware health updates</div><p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">Live items should show their source and timestamp; evergreen content is labeled as a learning brief.</p></Link>
        <Link to="/tutorial" className="liquid-panel p-4"><div className="panacea-kicker !text-neutral-500 dark:!text-white/50">Guide</div><div className="mt-2 text-sm font-black text-neutral-900 dark:text-white">New here? Start small.</div><p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-white/50">A short guided path is better than asking you to understand hundreds of features at once.</p></Link>
      </section>
    </main>
  )
}
