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

const LIFE_DOCK = [
  { to: '/planning', emoji: '◫', label: 'Plan', note: 'Shape today' },
  { to: '/harian', emoji: '＋', label: 'Log', note: 'Add a moment' },
  { to: '/latihan', emoji: '🏃', label: 'Training', note: 'Move & perform' },
  { to: '/tubuh', emoji: '♥', label: 'Body', note: 'Signals & recovery' },
  { to: '/nutrition', emoji: '🥗', label: 'Nutrition', note: 'Food & hydration' },
  { to: '/keuangan', emoji: '◉', label: 'Money', note: 'Cash flow' },
  { to: '/med-study', emoji: '✦', label: 'Learn', note: 'Study & medicine' },
  { to: '/body-explorer', emoji: '◎', label: '3D Body', note: 'Explore anatomy' },
  { to: '/community', emoji: '◌', label: 'People', note: 'Community' },
  { to: '/chatbot', emoji: '✧', label: 'Ask', note: 'Ask Panacea' },
  { to: '/my-story', emoji: '⌁', label: 'Story', note: 'Your timeline' },
  { to: '/semua-fitur', emoji: '⊞', label: 'All', note: 'Everything' },
]

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
    vitals.restingHr ? { label: 'Resting HR', value: `${Math.round(vitals.restingHr)}`, unit: 'bpm', emoji: '♥' } : null,
    vitals.sleepH ? { label: 'Sleep', value: `${Math.round(vitals.sleepH * 10) / 10}`, unit: 'hours', emoji: '☾' } : null,
    vitals.vo2max ? { label: 'VO₂max', value: `${Math.round(vitals.vo2max * 10) / 10}`, unit: 'mL/kg/min', emoji: '↗' } : null,
    workouts.length ? { label: 'Activities', value: `${workouts.length}`, unit: formatDate(latest?.mulai), emoji: '⌁' } : null,
  ].filter((x): x is { label: string; value: string; unit: string; emoji: string } => Boolean(x))

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
    <main className="panacea-app-surface mx-auto max-w-7xl space-y-7 px-2 pb-24 pt-1 sm:px-4 lg:px-6">
      {/* HOME HERO — cinematic, but action-first. */}
      <section className="panacea-dashboard-hero overflow-hidden p-5 sm:p-7 lg:min-h-[430px] lg:p-9">
        <div className="relative z-10 grid h-full gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
          <div className="flex min-h-[300px] flex-col justify-between">
            <div>
              <div className="panacea-kicker">Panacea · Your Life OS</div>
              <h1 className="mt-5 max-w-[10ch] text-[clamp(2.9rem,7vw,6.4rem)] font-black leading-[.88] tracking-[-.065em] text-white">
                {greeting()}{name ? `, ${name}` : ''}.
              </h1>
              <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-white/62 sm:text-base">
                One home for your body, movement, sleep, food, focus, money, learning, people and story.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              <Link to="/planning" className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-white px-5 text-[12px] font-black text-[#07131c] shadow-xl transition hover:-translate-y-0.5">
                Plan today <span aria-hidden>→</span>
              </Link>
              <Link to="/harian" className="liquid-orbit-button !min-h-[46px] !px-5">Log now <span aria-hidden>＋</span></Link>
              <Link to="/atur-fitur" className="liquid-orbit-button !min-h-[46px] !px-5">Edit Home <span aria-hidden>⌘</span></Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/10 p-3 backdrop-blur-2xl sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-white/40">Now</div>
                <div className="mt-1 text-sm font-black text-white">Your signals</div>
              </div>
              <Link to="/tubuh" className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[10px] font-black text-white/65">Open body ›</Link>
            </div>

            {signals.length ? (
              <div className="grid grid-cols-2 gap-2.5">
                {signals.map((signal) => (
                  <Link key={signal.label} to="/tubuh" className="group min-h-[118px] rounded-[22px] border border-white/10 bg-white/[.065] p-3.5 transition duration-300 hover:-translate-y-1 hover:bg-white/[.10]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[9px] font-black uppercase tracking-[.14em] text-white/38">{signal.label}</div>
                      <div className="text-sm text-white/36">{signal.emoji}</div>
                    </div>
                    <div className="mt-4 text-[30px] font-black leading-none tabular-nums tracking-[-.04em] text-white">{signal.value}</div>
                    <div className="mt-1.5 text-[10px] text-white/43">{signal.unit}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <Link to="/harian" className="block rounded-[22px] border border-white/10 bg-white/[.06] p-5 text-sm leading-relaxed text-white/65 transition hover:bg-white/[.09]">
                Your home becomes personal when you add real data.
                <span className="mt-3 block text-xs font-black text-emerald-300">Add your first entry →</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FUNCTIONAL COMMAND CAROUSEL */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-400">Jump in</div>
            <h2 className="mt-1 text-[22px] font-black tracking-[-.035em] text-neutral-900 dark:text-white sm:text-[26px]">What do you want to do?</h2>
          </div>
          <Link to="/semua-fitur" className="shrink-0 text-[11px] font-black text-brand-dark dark:text-emerald-300">All features →</Link>
        </div>
        <div className="no-scrollbar -mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-2 sm:-mx-4 sm:px-4">
          {LIFE_DOCK.map((item, index) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              className={`group relative min-h-[138px] w-[132px] shrink-0 snap-start overflow-hidden rounded-[26px] border p-4 shadow-[0_14px_35px_rgba(20,45,55,.07)] transition duration-300 hover:-translate-y-1 sm:w-[148px] ${
                index % 5 === 0 ? 'border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-400/10 dark:from-emerald-500/10 dark:to-white/5' :
                index % 5 === 1 ? 'border-sky-200/60 bg-gradient-to-br from-sky-50 to-white dark:border-sky-400/10 dark:from-sky-500/10 dark:to-white/5' :
                index % 5 === 2 ? 'border-violet-200/60 bg-gradient-to-br from-violet-50 to-white dark:border-violet-400/10 dark:from-violet-500/10 dark:to-white/5' :
                index % 5 === 3 ? 'border-amber-200/60 bg-gradient-to-br from-amber-50 to-white dark:border-amber-400/10 dark:from-amber-500/10 dark:to-white/5' :
                'border-rose-200/60 bg-gradient-to-br from-rose-50 to-white dark:border-rose-400/10 dark:from-rose-500/10 dark:to-white/5'
              }`}
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/80 text-[20px] shadow-sm dark:bg-white/10">{item.emoji}</div>
              <div className="mt-5 text-[14px] font-black tracking-tight text-neutral-900 dark:text-white">{item.label}</div>
              <div className="mt-1 text-[10px] leading-snug text-neutral-500">{item.note}</div>
              <span aria-hidden className="absolute bottom-3 right-3 text-sm font-black text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-500">›</span>
            </Link>
          ))}
        </div>
      </section>

      {/* DAILY BENTO — existing functional Life OS widgets. */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-400">For you</div>
            <h2 className="mt-1 text-[22px] font-black tracking-[-.035em] text-neutral-900 dark:text-white sm:text-[26px]">Today at a glance</h2>
          </div>
        </div>
        <LifeOSWidgets />
      </section>

      {/* USER-CONTROLLED DASHBOARD — preserve the original functional system. */}
      <section className="liquid-panel overflow-hidden !rounded-[30px] p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-400">My dashboard</div>
            <h2 className="mt-1 text-[22px] font-black tracking-[-.035em] text-neutral-900 dark:text-white sm:text-[28px]">Your widgets. Your order.</h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-neutral-500">Keep only what you use. Sleep, training, recovery, nutrition, focus, reminders, body data, environment, faith, study and more.</p>
          </div>
          <Link to="/atur-fitur" className="inline-flex min-h-[40px] items-center rounded-full border border-black/5 bg-white px-4 text-[11px] font-black text-neutral-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">Customize ›</Link>
        </div>
        <PapanWidget pratinjau={pratinjau} tanggalCatatan={tanggalCatatan} />
      </section>

      {/* DISCOVERY — keep the catalog, but later in the journey. */}
      <section>
        <div className="mb-3 px-1">
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-neutral-400">Explore</div>
          <h2 className="mt-1 text-[22px] font-black tracking-[-.035em] text-neutral-900 dark:text-white sm:text-[26px]">Go deeper when you want to.</h2>
        </div>
        <KisiFitur />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <SignatureExperiencesWidget />
        <HumanPassportWidget name={name} />
      </section>

      <section className="no-scrollbar -mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-2 sm:-mx-4 sm:px-4">
        {[
          { to: '/my-story', kicker: 'Your story', title: 'Life is more than metrics.', text: 'Relationships, study, career, money, purpose and major moments belong here too.', tone: 'rose' },
          { to: '/community', kicker: 'People', title: 'Health is social.', text: 'Community and shared experiences sit beside your personal data.', tone: 'violet' },
          { to: '/tutorial', kicker: 'Guide', title: 'Start small.', text: 'Learn Panacea one useful action at a time instead of facing everything at once.', tone: 'emerald' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="liquid-panel min-h-[170px] w-[82vw] max-w-[390px] shrink-0 snap-start !rounded-[28px] p-5 transition hover:-translate-y-1 sm:w-[360px]">
            <div className={`text-[10px] font-black uppercase tracking-[.16em] ${item.tone === 'rose' ? 'text-rose-500' : item.tone === 'violet' ? 'text-violet-500' : 'text-emerald-600'}`}>{item.kicker}</div>
            <div className="mt-3 text-xl font-black tracking-[-.03em] text-neutral-900 dark:text-white">{item.title}</div>
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">{item.text}</p>
            <div className="mt-4 text-[11px] font-black text-neutral-400">Open →</div>
          </Link>
        ))}
      </section>
    </main>
  )
}
