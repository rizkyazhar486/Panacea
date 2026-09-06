import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { PapanWidget } from '../components/PapanWidget'
import { KisiFitur } from '../components/KisiFitur'
import { CatatanHarian } from '../components/CatatanHarian'
import { CatatanLatihan } from '../components/CatatanLatihan'
import { HomeFeatureUniverse } from '../components/dashboard/HomeFeatureUniverse'
import { PanaceaGrowthRail } from '../components/dashboard/PanaceaGrowthWidgets'
import { pratinjauBeranda } from '../lib/pratinjauBeranda'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { ageFromDob } from '../lib/anthro'

/**
 * Home klasik Panacea.
 *
 * Home adalah dashboard, bukan halaman showcase. Konten 3D, anatomy research,
 * explanation depth, dan pengalaman signature tetap hidup di halaman mereka
 * sendiri; di sini ruang pertama diberikan kepada data pribadi, pintasan, dan
 * widget yang memang dipakai setiap hari.
 */

const PINTASAN = [
  { to: '/latihan', emoji: '🏃', label: 'Training', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' },
  { to: '/tubuh', emoji: '❤️', label: 'Body', tone: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200' },
  { to: '/nutrition', emoji: '🥗', label: 'Nutrition', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200' },
  { to: '/recovery', emoji: '🌙', label: 'Recovery', tone: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200' },
  { to: '/planning', emoji: '🗓️', label: 'Plan', tone: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200' },
  { to: '/keuangan', emoji: '💰', label: 'Money', tone: 'bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-200' },
  { to: '/learn', emoji: '📚', label: 'Life', tone: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200' },
  { to: '/community', emoji: '👥', label: 'People', tone: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-200' },
  { to: '/body-explorer', emoji: '🫀', label: '3D Body', tone: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200' },
  { to: '/chatbot', emoji: '✨', label: 'Ask', tone: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200' },
]

type Signal = { label: string; value: string; unit?: string; tone: string; to: string }

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
    <main className="mx-auto w-full max-w-4xl space-y-6 pb-24">
      <section className="overflow-hidden rounded-[28px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-4 shadow-[0_18px_45px_rgba(15,80,60,.08)] dark:border-white/10 dark:from-emerald-500/12 dark:via-[#0b1518] dark:to-sky-500/10 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700/70 dark:text-emerald-300/70">My Panacea</div>
            <h1 className="mt-1 truncate text-[26px] font-black tracking-[-.045em] text-neutral-950 dark:text-white sm:text-[32px]">
              Hi{name ? `, ${name}` : ''}
            </h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event('panacea:cari'))}
              className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200 bg-white text-lg text-neutral-800 shadow-sm transition active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white"
              aria-label="Search"
            >⌕</button>
            <Link
              to="/atur-fitur"
              className="grid h-11 w-11 place-items-center rounded-full bg-neutral-950 text-lg text-white shadow-sm transition active:scale-95 dark:bg-white dark:text-neutral-950"
              aria-label="Manage Home widgets"
            >＋</Link>
          </div>
        </div>

        {signals.length > 0 ? (
          <div className="no-scrollbar -mx-1 mt-4 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1">
            {signals.map((s) => (
              <Link
                key={s.label}
                to={s.to}
                className="min-h-[112px] w-[142px] shrink-0 snap-start rounded-[22px] border border-black/[.06] bg-white/90 p-3.5 shadow-sm transition active:scale-[.98] dark:border-white/10 dark:bg-white/[.07]"
              >
                <div className="text-[9px] font-black uppercase tracking-[.13em] text-neutral-500 dark:text-neutral-400">{s.label}</div>
                <div className={`mt-4 text-[30px] font-black leading-none tracking-[-.045em] tabular-nums ${s.tone}`}>{s.value}</div>
                {s.unit && <div className="mt-2 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">{s.unit}</div>}
              </Link>
            ))}
          </div>
        ) : (
          <Link to="/harian" className="mt-4 flex min-h-[58px] items-center justify-between rounded-2xl bg-white/90 px-4 text-sm font-bold text-neutral-800 shadow-sm dark:bg-white/[.07] dark:text-white">
            Add your first health or daily entry <span className="text-lg">›</span>
          </Link>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[13px] font-black text-neutral-900 dark:text-white">Quick access</h2>
          <Link to="/semua-fitur" className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">All features ›</Link>
        </div>
        <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {PINTASAN.map((p) => (
            <Link key={p.to + p.label} to={p.to} className="w-[84px] shrink-0 snap-start text-center active:scale-95">
              <span className={`mx-auto grid h-[62px] w-[62px] place-items-center rounded-[20px] text-[25px] shadow-sm ${p.tone}`}>{p.emoji}</span>
              <span className="mt-1.5 block truncate text-[10px] font-bold text-neutral-700 dark:text-neutral-200">{p.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <PanaceaGrowthRail />

      <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_12px_35px_rgba(25,45,55,.06)] dark:border-white/10 dark:bg-white/[.035] sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">Widgets</div>
            <h2 className="mt-1 text-[18px] font-black tracking-tight text-neutral-950 dark:text-white">My dashboard</h2>
          </div>
          <Link to="/atur-fitur" className="shrink-0 rounded-full bg-neutral-100 px-3 py-2 text-[10px] font-black text-neutral-700 dark:bg-white/10 dark:text-neutral-200">Customize</Link>
        </div>
        <PapanWidget pratinjau={pratinjau} tanggalCatatan={tanggalCatatan} />
      </section>

      <HomeFeatureUniverse />

      <details className="group rounded-[26px] border border-neutral-200 bg-white p-4 dark:border-white/10 dark:bg-white/[.035]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[.14em] text-neutral-500 dark:text-neutral-400">Today</div>
            <div className="mt-1 text-[16px] font-black text-neutral-950 dark:text-white">Log my day or workout</div>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-lg text-neutral-700 transition group-open:rotate-45 dark:bg-white/10 dark:text-white">＋</span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-neutral-100 pt-4 dark:border-white/10">
          <CatatanHarian />
          <CatatanLatihan />
        </div>
      </details>

      <KisiFitur />
    </main>
  )
}
