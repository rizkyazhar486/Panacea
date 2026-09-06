import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getWorkouts } from '../../lib/workoutStore'
import type { ImportedWorkout } from '../../lib/workoutImport'

interface Milestone {
  id: string
  icon: string
  title: string
  description: string
  value: number
  target: number
  unit: string
}

function distinctDays(workouts: ImportedWorkout[]) {
  return new Set(workouts.map((w) => w.mulai.slice(0, 10))).size
}

function longestStreak(workouts: ImportedWorkout[]) {
  const days = [...new Set(workouts.map((w) => w.mulai.slice(0, 10)))].sort()
  let best = days.length ? 1 : 0
  let current = best
  for (let i = 1; i < days.length; i++) {
    const d = (Date.parse(`${days[i]}T00:00:00Z`) - Date.parse(`${days[i - 1]}T00:00:00Z`)) / 86400000
    current = Math.round(d) === 1 ? current + 1 : 1
    best = Math.max(best, current)
  }
  return best
}

function milestones(workouts: ImportedWorkout[]): Milestone[] {
  const totalKm = workouts.reduce((n, w) => n + (w.jarakKm ?? 0), 0)
  const totalMin = workouts.reduce((n, w) => n + w.durasi / 60, 0)
  const longestKm = workouts.reduce((n, w) => Math.max(n, w.jarakKm ?? 0), 0)
  const longestMin = workouts.reduce((n, w) => Math.max(n, w.durasi / 60), 0)
  const days = distinctDays(workouts)
  const streak = longestStreak(workouts)
  return [
    { id: 'ignite', icon: '🚀', title: 'Ignition', description: 'First logged activity', value: workouts.length, target: 1, unit: 'session' },
    { id: 'orbit', icon: '🪐', title: 'Orbit Builder', description: 'Five different active days', value: days, target: 5, unit: 'days' },
    { id: '5k', icon: '🏃', title: 'First 5K', description: 'One activity reaches 5 km', value: longestKm, target: 5, unit: 'km' },
    { id: '10k', icon: '🌍', title: '10K Explorer', description: 'One activity reaches 10 km', value: longestKm, target: 10, unit: 'km' },
    { id: 'hour', icon: '⏱️', title: 'Endurance Hour', description: 'One session reaches 60 minutes', value: longestMin, target: 60, unit: 'min' },
    { id: '100k', icon: '🏅', title: 'Century Distance', description: 'Accumulate 100 km', value: totalKm, target: 100, unit: 'km' },
    { id: '500m', icon: '🔥', title: 'Training Engine', description: 'Accumulate 500 active minutes', value: totalMin, target: 500, unit: 'min' },
    { id: 'streak', icon: '✨', title: 'Seven-Day Orbit', description: 'Seven consecutive active days', value: streak, target: 7, unit: 'days' },
  ]
}

export function ActivityAchievementWidget() {
  const workouts = useMemo(() => getWorkouts(), [])
  const items = useMemo(() => milestones(workouts), [workouts])
  const unlocked = items.filter((m) => m.value >= m.target)
  const next = items.filter((m) => m.value < m.target).sort((a, b) => (b.value / b.target) - (a.value / a.target))[0]
  const xp = unlocked.length * 120 + Math.min(99, workouts.length * 8)

  return (
    <section className="liquid-panel h-full p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="panacea-kicker !text-neutral-500 dark:!text-white/55">Momentum</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-neutral-900 dark:text-white">Achievements that come from real logs</h2>
        </div>
        <div className="rounded-2xl border border-[#d8bb70]/30 bg-[#d8bb70]/10 px-3 py-2 text-right">
          <div className="text-lg font-black tabular-nums text-[#9a7422] dark:text-[#f3d98d]">{xp}</div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-neutral-500 dark:text-white/50">XP</div>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.slice(0, 6).map((m) => {
          const done = m.value >= m.target
          return (
            <div key={m.id} title={m.description} className={`min-w-[116px] rounded-2xl border p-3 ${done ? 'border-[#d8bb70]/35 bg-[#d8bb70]/10' : 'border-black/[.055] bg-white/45 dark:border-white/10 dark:bg-white/[.035]'}`}>
              <div className={`text-xl ${done ? '' : 'grayscale opacity-45'}`}>{m.icon}</div>
              <div className="mt-2 text-xs font-black text-neutral-800 dark:text-white">{m.title}</div>
              <div className="mt-1 text-[10px] leading-snug text-neutral-500 dark:text-white/45">{done ? 'Unlocked' : `${Math.min(m.value, m.target).toFixed(m.unit === 'km' ? 1 : 0)}/${m.target} ${m.unit}`}</div>
            </div>
          )
        })}
      </div>
      {next ? (
        <div className="mt-4 rounded-2xl border border-black/[.05] bg-white/40 p-3 dark:border-white/10 dark:bg-white/[.03]">
          <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-neutral-600 dark:text-white/60"><span>Next: {next.title}</span><span>{Math.min(100, Math.round((next.value / next.target) * 100))}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[.05] dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#00bf63] to-[#d8bb70]" style={{ width: `${Math.min(100, (next.value / next.target) * 100)}%` }} /></div>
        </div>
      ) : <div className="mt-4 text-xs text-neutral-500">All current milestones unlocked. More tiers can be added without inventing progress.</div>}
      <Link to="/workout" className="mt-4 inline-flex text-xs font-black text-brand-dark dark:text-emerald-300">Open workouts →</Link>
    </section>
  )
}
