import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type TaskId = 'checkin' | 'training' | 'hydration' | 'nutrition' | 'recovery'
type DailyState = {
  date: string
  done: Record<TaskId, boolean>
  hydration: number
  readiness: number | null
}

type DailyFocus = {
  name: string
  short: string
  detail: string
  target: string
  route: string
}

const STORAGE_KEY = 'panacea:today-command-center:v1'
const TASKS: Array<{ id: TaskId; label: string; hint: string; route: string }> = [
  { id: 'checkin', label: 'Morning check-in', hint: 'Log how your body feels before the day gets noisy.', route: '/fitness-hub?view=numbers' },
  { id: 'training', label: 'Training', hint: 'Complete the movement focus selected for today.', route: '/fitness-hub?view=workout' },
  { id: 'hydration', label: 'Hydration', hint: 'Build toward your daily water target.', route: '/fitness-hub?view=nutrition' },
  { id: 'nutrition', label: 'Nutrition', hint: 'Record meals or review today’s nutrition context.', route: '/fitness-hub?view=nutrition' },
  { id: 'recovery', label: 'Recovery', hint: 'Close the loop with sleep, recovery and readiness.', route: '/fitness-hub?view=recovery' },
]

const ROTATION: DailyFocus[] = [
  { name: 'Push', short: 'PUSH', detail: 'Chest · shoulders · triceps', target: 'Strength + clean reps', route: '/fitness-hub?view=workout&t=sesi' },
  { name: 'Pull', short: 'PULL', detail: 'Back · rear delts · biceps', target: 'Strength + posture', route: '/fitness-hub?view=workout&t=sesi' },
  { name: 'Legs', short: 'LEGS', detail: 'Quads · posterior chain · calves', target: 'Strength + lower-body capacity', route: '/fitness-hub?view=workout&t=sesi' },
  { name: 'Core + Zone 2', short: 'CORE', detail: 'Trunk stability · easy aerobic work', target: 'Control + aerobic base', route: '/fitness-hub?view=training&t=rencana' },
  { name: 'Push', short: 'PUSH', detail: 'Chest · shoulders · triceps', target: 'Volume + progression', route: '/fitness-hub?view=workout&t=sesi' },
  { name: 'Pull + Full Body', short: 'MIX', detail: 'Pull emphasis · total-body accessories', target: 'Balanced weekly volume', route: '/fitness-hub?view=workout&t=sesi' },
  { name: 'Recovery', short: 'RESET', detail: 'Walk · mobility · easy recovery', target: 'Restore for next week', route: '/fitness-hub?view=recovery' },
]

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function emptyState(date = localDateKey()): DailyState {
  return {
    date,
    done: { checkin: false, training: false, hydration: false, nutrition: false, recovery: false },
    hydration: 0,
    readiness: null,
  }
}

function readState(): DailyState {
  const today = localDateKey()
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<DailyState> | null
    if (!parsed || parsed.date !== today) return emptyState(today)
    return {
      ...emptyState(today),
      ...parsed,
      done: { ...emptyState(today).done, ...(parsed.done ?? {}) },
      hydration: Math.max(0, Math.min(12, Number(parsed.hydration) || 0)),
      readiness: typeof parsed.readiness === 'number' ? Math.max(1, Math.min(5, parsed.readiness)) : null,
    }
  } catch {
    return emptyState(today)
  }
}

function dayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7
}

function readinessLabel(value: number | null) {
  if (value === null) return 'Not checked'
  return ['Very low', 'Low', 'Okay', 'Good', 'Excellent'][value - 1]
}

export function TodayCommandCenter() {
  const [state, setState] = useState<DailyState>(() => readState())
  const [now, setNow] = useState(() => new Date())
  const focus = ROTATION[dayIndex(now)]

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = new Date()
      setNow(next)
      setState((current) => current.date === localDateKey(next) ? current : emptyState(localDateKey(next)))
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new CustomEvent('panacea:today-updated', { detail: state }))
  }, [state])

  const completed = TASKS.filter((task) => state.done[task.id]).length
  const progress = Math.round((completed / TASKS.length) * 100)
  const nextTask = TASKS.find((task) => !state.done[task.id])

  const week = useMemo(() => {
    const monday = new Date(now)
    monday.setHours(12, 0, 0, 0)
    monday.setDate(now.getDate() - dayIndex(now))
    return ROTATION.map((item, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return {
        ...item,
        date,
        active: localDateKey(date) === localDateKey(now),
      }
    })
  }, [now])

  function toggle(id: TaskId) {
    setState((current) => ({ ...current, done: { ...current.done, [id]: !current.done[id] } }))
  }

  function changeHydration(delta: number) {
    setState((current) => {
      const hydration = Math.max(0, Math.min(12, current.hydration + delta))
      return {
        ...current,
        hydration,
        done: { ...current.done, hydration: hydration >= 8 },
      }
    })
  }

  const formattedDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const greeting = now.getHours() < 11 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#07100d] shadow-[0_22px_80px_rgba(0,0,0,.28)] sm:rounded-[30px]" aria-label="Today command center">
      <div className="pointer-events-none absolute -left-20 -top-32 h-72 w-72 rounded-full bg-brand/[.14] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-64 w-64 rounded-full bg-cyan-400/[.05] blur-[90px]" />

      <div className="relative grid gap-3 p-3 sm:p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.24em] text-brand">Today · daily health command center</div>
              <h2 className="mt-1 text-2xl font-black tracking-[-.035em] text-white sm:text-[2rem]">{greeting}. Own the next action.</h2>
              <p className="mt-1 text-xs font-semibold text-neutral-500">{formattedDate}</p>
            </div>
            <div className="rounded-2xl border border-brand/20 bg-brand/[.08] px-3 py-2 text-right">
              <div className="text-[9px] font-black uppercase tracking-[.16em] text-brand">Daily progress</div>
              <div className="text-2xl font-black tabular-nums text-white">{progress}%</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-white/[.08] bg-white/[.035] p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 min-w-12 place-items-center rounded-2xl border border-brand/25 bg-brand/10 px-2 text-[11px] font-black tracking-[.08em] text-brand">{focus.short}</div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-500">Today’s movement focus</div>
                  <div className="text-base font-black text-white">{focus.name}</div>
                  <div className="text-[11px] text-neutral-400">{focus.detail}</div>
                </div>
              </div>
              <Link to={focus.route} className="inline-flex min-h-[42px] items-center rounded-2xl bg-brand px-4 text-[11px] font-black text-white shadow-[0_10px_28px_rgba(0,191,99,.18)] transition hover:-translate-y-0.5 hover:bg-emerald-500">
                Start session →
              </Link>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]" aria-label={`${progress}% daily progress`}>
              <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold text-neutral-500">
              <span>{focus.target}</span>
              <span>{completed}/{TASKS.length} closed</span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {TASKS.map((task) => {
              const done = state.done[task.id]
              return (
                <button
                  key={task.id}
                  type="button"
                  aria-pressed={done}
                  onClick={() => toggle(task.id)}
                  className={`group min-h-[100px] rounded-[20px] border p-3 text-left transition ${done ? 'border-brand/35 bg-brand/[.1]' : 'border-white/[.08] bg-white/[.025] hover:border-white/15 hover:bg-white/[.05]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] font-black ${done ? 'border-brand bg-brand text-white' : 'border-white/15 bg-black/20 text-neutral-500'}`}>{done ? '✓' : '·'}</span>
                    <span className={`text-[8px] font-black uppercase tracking-[.14em] ${done ? 'text-brand' : 'text-neutral-600'}`}>{done ? 'Done' : 'Open'}</span>
                  </div>
                  <div className={`mt-2 text-[12px] font-black leading-tight ${done ? 'text-emerald-100' : 'text-white'}`}>{task.label}</div>
                  <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-neutral-500">{task.hint}</p>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-500">Hydration</div>
                <div className="mt-0.5 text-xl font-black text-white"><span className="tabular-nums">{state.hydration}</span><span className="text-sm text-neutral-500"> / 8 cups</span></div>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => changeHydration(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-lg font-black text-neutral-300" aria-label="Remove one cup">−</button>
                <button type="button" onClick={() => changeHydration(1)} className="grid h-10 w-10 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-lg font-black text-brand" aria-label="Add one cup">+</button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-8 gap-1" aria-hidden>
              {Array.from({ length: 8 }).map((_, index) => <span key={index} className={`h-2 rounded-full ${index < Math.min(state.hydration, 8) ? 'bg-brand' : 'bg-white/[.07]'}`} />)}
            </div>
          </div>

          <div className="rounded-[22px] border border-white/[.08] bg-black/20 p-3.5">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-500">How ready do you feel?</div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <div className="text-sm font-black text-white">{readinessLabel(state.readiness)}</div>
              <div className="text-[10px] font-bold text-neutral-600">subjective check-in</div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" aria-pressed={state.readiness === value} onClick={() => setState((current) => ({ ...current, readiness: value, done: { ...current.done, checkin: true } }))} className={`min-h-[40px] rounded-xl border text-xs font-black transition ${state.readiness === value ? 'border-brand bg-brand text-white' : 'border-white/[.08] bg-white/[.03] text-neutral-400 hover:bg-white/[.07]'}`}>{value}</button>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-brand/15 bg-gradient-to-br from-brand/[.09] to-transparent p-3.5 sm:col-span-2 lg:col-span-1">
            <div className="text-[9px] font-black uppercase tracking-[.16em] text-brand">Next best action</div>
            {nextTask ? (
              <>
                <div className="mt-1 text-base font-black text-white">{nextTask.label}</div>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">{nextTask.hint}</p>
                <Link to={nextTask.route} className="mt-3 inline-flex min-h-[40px] items-center rounded-xl border border-brand/25 bg-brand/10 px-3 text-[10px] font-black text-brand transition hover:bg-brand/15">Open workspace →</Link>
              </>
            ) : (
              <>
                <div className="mt-1 text-base font-black text-white">Daily loop complete</div>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">Your five core actions are closed. Keep the rest of the day simple and protect recovery.</p>
              </>
            )}
          </div>
        </aside>
      </div>

      <div className="relative border-t border-white/[.07] bg-black/15 px-3 py-3 sm:px-5">
        <div className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-0.5" aria-label="Weekly movement rotation">
          {week.map((item) => (
            <div key={localDateKey(item.date)} className={`min-w-[116px] flex-1 snap-start rounded-2xl border px-3 py-2.5 ${item.active ? 'border-brand/35 bg-brand/[.09]' : 'border-white/[.07] bg-white/[.02]'}`}>
              <div className={`text-[8px] font-black uppercase tracking-[.13em] ${item.active ? 'text-brand' : 'text-neutral-600'}`}>{new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(item.date)}</div>
              <div className="mt-0.5 text-[11px] font-black text-white">{item.name}</div>
              <div className="mt-0.5 line-clamp-1 text-[9px] text-neutral-500">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TodayCommandCenter
