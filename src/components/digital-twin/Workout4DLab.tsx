import { useMemo } from 'react'
import { InsideWorkout4D } from './InsideWorkout4D'
import { WorkoutDNA } from './WorkoutDNA'
import { HumanReplay } from './HumanReplay'
import { getWorkouts } from '../../lib/workoutStore'
import { getDemo } from '../../lib/profile'
import { hrMaxFromAge } from '../../lib/workoutImport'
import { useVitals } from '../../lib/useVitals'
import { IconActivity, IconRun } from '../icons'

export function Workout4DLab() {
  const vitals = useVitals()
  const demo = useMemo(() => getDemo(), [])
  const workouts = useMemo(() => getWorkouts(), [vitals])
  const hrMax = useMemo(() => {
    const observed = workouts.reduce((max, workout) => Math.max(max, workout.maxHr ?? 0, ...workout.hr.map((point) => point.bpm)), 0)
    return Math.max(observed, hrMaxFromAge(demo.age || 30, demo.sex))
  }, [workouts, demo])

  if (!workouts.length) {
    return (
      <section className="rounded-[30px] border border-white/10 bg-[#030914] p-6 text-white">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-emerald-300"><IconActivity size={14} /> Inside My Workout · 4D</div>
        <h2 className="mt-3 text-2xl font-black tracking-[-.04em]">Your first 4D replay starts with a real workout.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/48">Connect or import a workout with duration and, ideally, a heart-rate trace. Panacea will keep measured signals separate from model-derived respiration and educational physiology instead of filling the scene with invented biometrics.</p>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300/12 bg-emerald-300/[.05] p-4 text-xs text-white/55"><IconRun size={18} className="text-emerald-300" /> Health Auto Export workouts already supported by Panacea can drive Inside Workout, Workout DNA and Human Replay automatically.</div>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <InsideWorkout4D workouts={workouts} hrMax={hrMax} />
      <WorkoutDNA workouts={workouts} hrMax={hrMax} />
      <HumanReplay workouts={workouts} hrMax={hrMax} />
    </div>
  )
}
