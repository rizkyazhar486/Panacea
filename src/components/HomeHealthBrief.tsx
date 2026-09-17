import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getVitals } from '../lib/healthVitals'
import { getWorkouts } from '../lib/workoutStore'
import { IconHeart, IconMoon, IconRun, IconSparkle } from './icons'

function num(value: number | undefined, digits = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return digits ? value.toFixed(digits) : Math.round(value).toLocaleString()
}

export function HomeHealthBrief() {
  const { account, state } = useStore()
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const update = () => setRefresh((value) => value + 1)
    window.addEventListener('panacea:health-updated', update)
    window.addEventListener('focus', update)
    return () => {
      window.removeEventListener('panacea:health-updated', update)
      window.removeEventListener('focus', update)
    }
  }, [])

  const vitals = useMemo(() => getVitals(), [refresh])
  const workouts = useMemo(() => getWorkouts(), [refresh])
  const latestSleep = useMemo(() => [...(state.sleepLogs ?? [])]
    .filter((item) => typeof item?.hours === 'number' && item.hours > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0], [state.sleepLogs])

  const sleep = typeof latestSleep?.hours === 'number'
    ? latestSleep.hours
    : (typeof vitals.sleepH === 'number' ? vitals.sleepH : undefined)
  const steps = typeof vitals.steps === 'number' && vitals.steps >= 0 ? vitals.steps : undefined
  const restingHr = typeof vitals.restingHr === 'number' && vitals.restingHr > 0 ? vitals.restingHr : undefined
  const vo2max = typeof vitals.vo2max === 'number' && vitals.vo2max > 0 ? vitals.vo2max : undefined
  const name = account?.name?.trim().split(/\s+/)[0] || ''
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const date = useMemo(() => new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date()), [])
  const source = typeof vitals.source === 'string' && vitals.source.trim() ? vitals.source.trim() : 'Health data'

  return (
    <section className="liquid-glass-strong liquid-spectral-edge relative overflow-hidden rounded-[32px] p-4 text-white sm:p-6" aria-label="Today health brief">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/[.11] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-24 bottom-[-9rem] h-72 w-72 rounded-full bg-cyan-400/[.10] blur-3xl" aria-hidden />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-black uppercase tracking-[.17em] text-cyan-100/48">{date}</div>
          <h1 className="mt-1 truncate text-[22px] font-black tracking-[-.045em] sm:text-[28px]">{greeting}{name ? `, ${name}` : ''}</h1>
        </div>
        <Link to="/health-data" className="liquid-action shrink-0 rounded-full border border-white/[.10] bg-white/[.045] px-3 py-2 text-[9px] font-black uppercase tracking-[.09em] text-white/55" title={source}>
          Sync
        </Link>
      </div>

      <div className="relative mt-5 grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
        <Link to="/tubuh?t=gerak" className="liquid-action liquid-glass overflow-hidden rounded-[28px] p-5 sm:p-6" aria-label={`Steps ${num(steps)}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[10px] font-black uppercase tracking-[.16em] text-white/38">Steps</div>
              <div className="mt-2 truncate text-[48px] font-black leading-none tracking-[-.065em] tabular-nums sm:text-[62px]">{num(steps)}</div>
            </div>
            <span className="liquid-lens grid h-12 w-12 shrink-0 place-items-center rounded-full text-cyan-100" aria-hidden><IconRun size={21} /></span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/[.07] pt-4">
            <div className="min-w-0"><div className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/30">Sleep</div><div className="mt-1 truncate text-sm font-black tabular-nums">{typeof sleep === 'number' ? `${num(sleep, 1)} h` : '—'}</div></div>
            <div className="min-w-0"><div className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/30">Rest HR</div><div className="mt-1 truncate text-sm font-black tabular-nums">{restingHr ? `${num(restingHr)} bpm` : '—'}</div></div>
            <div className="min-w-0"><div className="truncate text-[8px] font-black uppercase tracking-[.12em] text-white/30">Sessions</div><div className="mt-1 truncate text-sm font-black tabular-nums">{workouts.length || '—'}</div></div>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-2.5">
          <Link to="/tubuh?t=tidur" className="liquid-action liquid-glass rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-2"><span className="truncate text-[9px] font-black uppercase tracking-[.12em] text-indigo-100/48">Sleep</span><IconMoon size={16} className="text-indigo-200" /></div>
            <div className="mt-4 truncate text-2xl font-black tracking-[-.05em] tabular-nums">{num(sleep, 1)}<span className="ml-1 text-[9px] text-white/30">h</span></div>
          </Link>
          <Link to="/tubuh?t=jantung" className="liquid-action liquid-glass rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-2"><span className="truncate text-[9px] font-black uppercase tracking-[.12em] text-rose-100/48">Rest HR</span><IconHeart size={16} className="text-rose-200" /></div>
            <div className="mt-4 truncate text-2xl font-black tracking-[-.05em] tabular-nums">{num(restingHr)}<span className="ml-1 text-[9px] text-white/30">bpm</span></div>
          </Link>
          <Link to="/latihan?t=lab" className="liquid-action liquid-glass rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-2"><span className="truncate text-[9px] font-black uppercase tracking-[.12em] text-cyan-100/48">VO₂max</span><IconRun size={16} className="text-cyan-200" /></div>
            <div className="mt-4 truncate text-2xl font-black tracking-[-.05em] tabular-nums">{num(vo2max, 1)}</div>
          </Link>
          <Link to="/harian" className="liquid-action liquid-glass rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-2"><span className="truncate text-[9px] font-black uppercase tracking-[.12em] text-emerald-100/48">Check-in</span><IconSparkle size={16} className="text-emerald-200" /></div>
            <div className="mt-4 truncate text-sm font-black tracking-[-.025em]">Log today</div>
          </Link>
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-4 gap-2">
        <Link to="/latihan" className="liquid-action rounded-[18px] border border-white/[.075] bg-white/[.03] px-2 py-3 text-center text-[9px] font-black text-white/58">Move</Link>
        <Link to="/readiness" className="liquid-action rounded-[18px] border border-white/[.075] bg-white/[.03] px-2 py-3 text-center text-[9px] font-black text-white/58">Readiness</Link>
        <Link to="/chatbot" className="liquid-action rounded-[18px] border border-white/[.075] bg-white/[.03] px-2 py-3 text-center text-[9px] font-black text-white/58">Ask</Link>
        <Link to="/health-data" className="liquid-action rounded-[18px] border border-white/[.075] bg-white/[.03] px-2 py-3 text-center text-[9px] font-black text-white/58">Connect</Link>
      </div>
    </section>
  )
}

export default HomeHealthBrief
