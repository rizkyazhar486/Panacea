import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVitals, vitalsAge } from '../../lib/healthVitals'
import { getWorkouts } from '../../lib/workoutStore'
import { IconBook, IconHeart, IconPlan, IconRun, IconWallet } from '../icons'

type FinanceTx = {
  date?: string
  kind?: 'income' | 'expense'
  amount?: number
}

const FINANCE_KEY = 'pmd_finance_tx_v1'
const FOCUS_KEY = 'pmd_focus_timer_v1'
const FOCUS_DEFAULT = 25 * 60

function readFinance(): FinanceTx[] {
  try {
    const raw = localStorage.getItem(FINANCE_KEY)
    const value = raw ? JSON.parse(raw) : []
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function formatIdrShort(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${value < 0 ? '−' : ''}Rp${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)} jt`
  if (abs >= 1_000) return `${value < 0 ? '−' : ''}Rp${Math.round(abs / 1_000)} rb`
  return `${value < 0 ? '−' : ''}Rp${Math.round(abs).toLocaleString('id-ID')}`
}

function formatTimer(seconds: number) {
  const min = Math.floor(seconds / 60).toString().padStart(2, '0')
  const sec = (seconds % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function timeOfDay() {
  const h = new Date().getHours()
  if (h < 5) return 'Quiet hours'
  if (h < 11) return 'Morning'
  if (h < 15) return 'Midday'
  if (h < 18) return 'Afternoon'
  return 'Evening'
}

export function LifeOSWidgets() {
  const [version, setVersion] = useState(0)
  const [now, setNow] = useState(() => new Date())
  const [focusSeconds, setFocusSeconds] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(FOCUS_KEY))
      return Number.isFinite(saved) && saved >= 0 && saved <= FOCUS_DEFAULT ? saved : FOCUS_DEFAULT
    } catch {
      return FOCUS_DEFAULT
    }
  })
  const [focusRunning, setFocusRunning] = useState(false)

  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1)
    const clock = window.setInterval(() => setNow(new Date()), 30_000)
    window.addEventListener('panacea:health-updated', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(clock)
      window.removeEventListener('panacea:health-updated', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    if (!focusRunning) return
    const timer = window.setInterval(() => {
      setFocusSeconds((value) => {
        if (value <= 1) {
          setFocusRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [focusRunning])

  useEffect(() => {
    try { localStorage.setItem(FOCUS_KEY, String(focusSeconds)) } catch { /* ignore */ }
  }, [focusSeconds])

  const vitals = useMemo(() => getVitals(), [version])
  const workouts = useMemo(() => getWorkouts(), [version])
  const finance = useMemo(() => readFinance(), [version])
  const latestWorkout = workouts[0]
  const monthKey = now.toISOString().slice(0, 7)
  const monthFinance = finance.filter((tx) => tx.date?.startsWith(monthKey))
  const income = monthFinance.reduce((sum, tx) => sum + (tx.kind === 'income' && Number.isFinite(tx.amount) ? Number(tx.amount) : 0), 0)
  const expense = monthFinance.reduce((sum, tx) => sum + (tx.kind === 'expense' && Number.isFinite(tx.amount) ? Number(tx.amount) : 0), 0)
  const net = income - expense
  const healthAge = vitalsAge(vitals)

  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
  const timeLabel = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <section aria-label="Life OS widgets" className="grid auto-rows-[minmax(150px,auto)] gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article className="relative overflow-hidden rounded-[28px] border border-indigo-200/20 bg-[radial-gradient(circle_at_88%_0%,rgba(129,140,248,.42),transparent_42%),linear-gradient(145deg,#12162f,#0a1024)] p-5 text-white shadow-[0_22px_70px_rgba(30,40,120,.2)] md:col-span-2">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/[.07]" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.2em] text-indigo-200/70">Today · Life OS</div>
            <div className="mt-2 text-3xl font-black tracking-[-.035em] sm:text-4xl">{timeLabel}</div>
            <div className="mt-1 text-sm font-bold text-white/60">{dateLabel}</div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-indigo-100">{timeOfDay()}</span>
        </div>
        <p className="mt-5 max-w-xl text-xs leading-relaxed text-white/55">Plan the day, log what happened, check prayer times, or jump back into the part of life that needs attention.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/planning" className="rounded-full bg-white px-3.5 py-2 text-[10px] font-black text-indigo-950">Plan day</Link>
          <Link to="/harian" className="rounded-full border border-white/12 bg-white/[.06] px-3.5 py-2 text-[10px] font-black text-white">Daily log</Link>
          <Link to="/prayer-times" className="rounded-full border border-white/12 bg-white/[.06] px-3.5 py-2 text-[10px] font-black text-white">Prayer times</Link>
          <Link to="/my-story" className="rounded-full border border-white/12 bg-white/[.06] px-3.5 py-2 text-[10px] font-black text-white">My story</Link>
        </div>
      </article>

      <article className="relative overflow-hidden rounded-[28px] border border-orange-200/20 bg-[radial-gradient(circle_at_88%_0%,rgba(251,146,60,.42),transparent_44%),linear-gradient(145deg,#2b160d,#17100d)] p-5 text-white shadow-[0_22px_65px_rgba(150,70,15,.16)]">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-orange-200"><IconBook size={20} /></span>
          <span className="text-[8px] font-black uppercase tracking-[.18em] text-orange-100/45">Focus</span>
        </div>
        <div className="mt-4 text-4xl font-black tabular-nums tracking-[-.04em]">{formatTimer(focusSeconds)}</div>
        <div className="mt-1 text-[10px] font-bold text-white/45">25-minute focus block</div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => focusSeconds > 0 && setFocusRunning((v) => !v)} className="rounded-full bg-orange-300 px-3.5 py-2 text-[10px] font-black text-orange-950">{focusRunning ? 'Pause' : focusSeconds === 0 ? 'Finished' : 'Start'}</button>
          <button onClick={() => { setFocusRunning(false); setFocusSeconds(FOCUS_DEFAULT) }} className="rounded-full border border-white/12 bg-white/[.06] px-3.5 py-2 text-[10px] font-black text-white/75">Reset</button>
        </div>
      </article>

      <Link to="/keuangan" className="group relative overflow-hidden rounded-[28px] border border-emerald-200/20 bg-[radial-gradient(circle_at_88%_0%,rgba(52,211,153,.38),transparent_44%),linear-gradient(145deg,#0c241d,#091612)] p-5 text-white shadow-[0_22px_65px_rgba(10,100,65,.16)] transition hover:-translate-y-1">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-emerald-200"><IconWallet size={20} /></span>
          <span className="text-[8px] font-black uppercase tracking-[.18em] text-emerald-100/45">Money</span>
        </div>
        <div className={`mt-4 text-2xl font-black tracking-tight ${net < 0 ? 'text-rose-200' : 'text-white'}`}>{monthFinance.length ? formatIdrShort(net) : 'Start tracking'}</div>
        <div className="mt-1 text-[10px] font-bold text-white/45">{monthFinance.length ? `Net this month · ${monthFinance.length} entries` : 'Cash flow · emergency fund · debt'}</div>
        <div className="mt-4 text-[10px] font-black text-emerald-200">Open finance →</div>
      </Link>

      <Link to="/latihan" className="group relative overflow-hidden rounded-[28px] border border-cyan-200/20 bg-[radial-gradient(circle_at_88%_0%,rgba(34,211,238,.38),transparent_44%),linear-gradient(145deg,#081f28,#071319)] p-5 text-white shadow-[0_22px_65px_rgba(10,90,120,.16)] transition hover:-translate-y-1">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-cyan-200"><IconRun size={20} /></span>
          <span className="text-[8px] font-black uppercase tracking-[.18em] text-cyan-100/45">Movement</span>
        </div>
        <div className="mt-4 text-2xl font-black tracking-tight">{latestWorkout ? (latestWorkout.nama || 'Workout') : 'Move today'}</div>
        <div className="mt-1 text-[10px] font-bold text-white/45">{latestWorkout ? `${Math.round(latestWorkout.durasi / 60)} min${latestWorkout.jarakKm ? ` · ${latestWorkout.jarakKm.toFixed(1)} km` : ''}` : 'Run · strength · mobility · recovery'}</div>
        <div className="mt-4 flex items-center justify-between text-[10px] font-black text-cyan-200"><span>{workouts.length ? `${workouts.length} sessions saved` : 'Start a session'}</span><span>→</span></div>
      </Link>

      <Link to="/tubuh" className="group relative overflow-hidden rounded-[28px] border border-rose-200/20 bg-[radial-gradient(circle_at_88%_0%,rgba(251,113,133,.36),transparent_44%),linear-gradient(145deg,#261019,#140d13)] p-5 text-white shadow-[0_22px_65px_rgba(120,20,50,.15)] transition hover:-translate-y-1">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-rose-200"><IconHeart size={20} /></span>
          <span className="text-[8px] font-black uppercase tracking-[.18em] text-rose-100/45">Body</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><div className="text-xl font-black tabular-nums">{vitals.restingHr ? Math.round(vitals.restingHr) : '—'}</div><div className="text-[8px] font-black uppercase tracking-wide text-white/35">resting bpm</div></div>
          <div><div className="text-xl font-black tabular-nums">{vitals.sleepH ? `${Math.round(vitals.sleepH * 10) / 10}h` : '—'}</div><div className="text-[8px] font-black uppercase tracking-wide text-white/35">sleep</div></div>
        </div>
        <div className="mt-4 truncate text-[9px] font-bold text-rose-100/55">{healthAge ? `${vitals.source || 'Health data'} · ${healthAge}` : 'Connect health data when you want'}</div>
      </Link>

      <Link to="/med-study" className="group relative overflow-hidden rounded-[28px] border border-violet-200/20 bg-[radial-gradient(circle_at_88%_0%,rgba(167,139,250,.38),transparent_44%),linear-gradient(145deg,#1d1533,#100d1b)] p-5 text-white shadow-[0_22px_65px_rgba(80,45,150,.16)] transition hover:-translate-y-1 md:col-span-2 xl:col-span-1">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-violet-200"><IconPlan size={20} /></span>
          <span className="text-[8px] font-black uppercase tracking-[.18em] text-violet-100/45">Learn</span>
        </div>
        <div className="mt-4 text-2xl font-black tracking-tight">Continue learning</div>
        <div className="mt-1 text-[10px] font-bold leading-relaxed text-white/45">Medicine, science and knowledge stay part of life—not the whole app.</div>
        <div className="mt-4 text-[10px] font-black text-violet-200">Open learning →</div>
      </Link>
    </section>
  )
}
