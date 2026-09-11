import type { ImportedWorkout } from './workoutImport'

export type Workout4DProvenance = 'measured' | 'derived' | 'educational'

export interface Workout4DSignal<T = number> {
  value: T
  provenance: Workout4DProvenance
  label: string
  detail: string
}

export interface Workout4DFrame {
  t: number
  progress: number
  heartRate: Workout4DSignal
  respiration: Workout4DSignal
  intensity: Workout4DSignal<string>
  cardiacDemand: Workout4DSignal
  oxygenDemand: Workout4DSignal
  carbohydrateShare: Workout4DSignal
  fatShare: Workout4DSignal
  muscleKeywords: string[]
  focus: 'whole' | 'cardio' | 'lungs' | 'muscle' | 'recovery'
  title: string
  story: string
}

export interface Workout4DReplay {
  workout: ImportedWorkout
  frames: Workout4DFrame[]
  duration: number
  hasMeasuredHr: boolean
  measuredSignals: string[]
  derivedSignals: string[]
  educationalSignals: string[]
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function nearestHr(workout: ImportedWorkout, t: number): number | undefined {
  if (!workout.hr.length) return undefined
  let best = workout.hr[0]
  let delta = Math.abs(best.t - t)
  for (const p of workout.hr) {
    const d = Math.abs(p.t - t)
    if (d < delta) {
      best = p
      delta = d
    }
  }
  return best?.bpm
}

function activityMuscles(name: string): string[] {
  const n = name.toLowerCase()
  if (n.includes('run') || n.includes('walk') || n.includes('jog')) {
    return ['quadriceps', 'rectus femoris', 'hamstring', 'biceps femoris', 'gastrocnemius', 'soleus', 'glute']
  }
  if (n.includes('cycl') || n.includes('bike')) {
    return ['quadriceps', 'vastus', 'glute', 'hamstring', 'gastrocnemius']
  }
  if (n.includes('swim')) {
    return ['latissimus', 'deltoid', 'triceps', 'pectoralis', 'rectus abdominis']
  }
  if (n.includes('row')) {
    return ['latissimus', 'trapezius', 'biceps', 'deltoid', 'quadriceps', 'glute']
  }
  if (n.includes('strength') || n.includes('weight') || n.includes('functional')) {
    return ['quadriceps', 'glute', 'pectoralis', 'deltoid', 'latissimus', 'rectus abdominis']
  }
  return ['quadriceps', 'glute', 'deltoid', 'latissimus', 'rectus abdominis']
}

function zoneLabel(hr: number, hrMax: number) {
  const pct = hrMax > 0 ? hr / hrMax : 0
  if (pct < .60) return 'Recovery / very easy'
  if (pct < .70) return 'Aerobic base'
  if (pct < .80) return 'Tempo'
  if (pct < .90) return 'Threshold'
  return 'High intensity'
}

function narrative(progress: number, hrPct: number) {
  if (progress < .08) return {
    focus: 'whole' as const,
    title: 'The body transitions from rest to work',
    story: 'Motor drive rises first. Heart rate and ventilation follow as working muscle asks for more oxygen and substrate.',
  }
  if (progress < .30) return {
    focus: 'cardio' as const,
    title: 'Circulation ramps up',
    story: 'Cardiac output rises and blood flow is redistributed toward active skeletal muscle. The animation shows the measured heart-rate response when available.',
  }
  if (progress < .55) return {
    focus: 'muscle' as const,
    title: 'Working muscle becomes the metabolic centre',
    story: hrPct > .80
      ? 'At higher relative intensity, carbohydrate contributes a larger share of usable fuel. This fuel mix is educational physiology, not a direct metabolic measurement.'
      : 'At sustainable intensity, both fat and carbohydrate contribute to ATP production. The displayed mix is an educational estimate, not indirect calorimetry.',
  }
  if (progress < .82) return {
    focus: 'lungs' as const,
    title: 'Ventilation supports sustained demand',
    story: 'Breathing frequency is model-derived unless a respiratory sensor supplied it. Lung motion therefore represents physiology context, not a measured tidal-volume trace.',
  }
  if (progress < .97) return {
    focus: 'cardio' as const,
    title: 'The session approaches its final load',
    story: 'Accumulated cardiovascular and muscular work is highest near the end. Panacea keeps measured signals visually separate from derived physiology.',
  }
  return {
    focus: 'recovery' as const,
    title: 'Recovery begins immediately',
    story: 'After effort stops, heart rate and ventilation do not instantly return to baseline. If recovery heart-rate samples exist, they can later drive this final scene directly.',
  }
}

export function buildWorkout4DReplay(workout: ImportedWorkout, hrMaxInput?: number): Workout4DReplay {
  const duration = Math.max(60, workout.durasi || 0)
  const observedMax = Math.max(workout.maxHr ?? 0, ...workout.hr.map((p) => p.bpm), 0)
  const hrMax = Math.max(hrMaxInput ?? 0, observedMax, 180)
  const sampleCount = clamp(Math.round(duration / 90), 24, 80)
  const restingAnchor = workout.minHr && workout.minHr > 35 ? workout.minHr : Math.max(55, (workout.avgHr ?? 110) - 45)
  const muscles = activityMuscles(workout.nama)

  const frames: Workout4DFrame[] = Array.from({ length: sampleCount }, (_, index) => {
    const progress = sampleCount <= 1 ? 0 : index / (sampleCount - 1)
    const t = Math.round(progress * duration)
    const measuredHr = nearestHr(workout, t)
    const phase = Math.sin(progress * Math.PI)
    const fallbackHr = Math.round(
      restingAnchor + ((workout.avgHr ?? Math.min(hrMax * .72, 135)) - restingAnchor) * clamp(phase * 1.18, 0, 1),
    )
    const hr = measuredHr ?? fallbackHr
    const hrPct = clamp(hr / hrMax, .25, 1.08)
    const resp = Math.round(clamp(9 + hrPct * 37, 10, 52))
    const demand = Math.round(clamp((hrPct - .35) / .65, 0, 1) * 100)
    const oxygenDemand = Math.round(clamp((hrPct - .40) / .60, 0, 1) * 100)
    const carbs = Math.round(clamp(28 + Math.pow(hrPct, 2.2) * 70, 25, 96))
    const fat = 100 - carbs
    const narrativeState = narrative(progress, hrPct)

    return {
      t,
      progress,
      heartRate: {
        value: hr,
        provenance: measuredHr != null ? 'measured' : 'derived',
        label: 'Heart rate',
        detail: measuredHr != null ? 'Nearest recorded workout heart-rate sample.' : 'Estimated from session summary because no time-series HR sample exists at this point.',
      },
      respiration: {
        value: resp,
        provenance: 'derived',
        label: 'Respiration',
        detail: 'Illustrative respiratory-rate response derived from relative cardiovascular intensity; not a respiratory sensor measurement.',
      },
      intensity: {
        value: zoneLabel(hr, hrMax),
        provenance: measuredHr != null ? 'derived' : 'educational',
        label: 'Intensity domain',
        detail: 'Classified from heart rate relative to the HRmax context used by this replay.',
      },
      cardiacDemand: {
        value: demand,
        provenance: 'derived',
        label: 'Cardiac demand',
        detail: 'Normalized visualization index. It is not cardiac output, stroke volume, or myocardial oxygen consumption.',
      },
      oxygenDemand: {
        value: oxygenDemand,
        provenance: 'educational',
        label: 'Relative oxygen demand',
        detail: 'Educational relative scale. It is not measured VO₂ unless a validated VO₂ data source is connected in a future version.',
      },
      carbohydrateShare: {
        value: carbs,
        provenance: 'educational',
        label: 'Carbohydrate contribution',
        detail: 'Conceptual substrate-use visualization based on exercise intensity, not indirect calorimetry.',
      },
      fatShare: {
        value: fat,
        provenance: 'educational',
        label: 'Fat contribution',
        detail: 'Conceptual complement to carbohydrate contribution; not a measured oxidation rate.',
      },
      muscleKeywords: muscles,
      focus: narrativeState.focus,
      title: narrativeState.title,
      story: narrativeState.story,
    }
  })

  return {
    workout,
    frames,
    duration,
    hasMeasuredHr: workout.hr.length > 0,
    measuredSignals: workout.hr.length ? ['Heart-rate timeline', 'Workout duration', ...(workout.jarakKm != null ? ['Distance'] : [])] : ['Workout duration', ...(workout.jarakKm != null ? ['Distance'] : [])],
    derivedSignals: ['Respiratory animation', 'Intensity domain', 'Cardiac-demand visualization'],
    educationalSignals: ['Relative oxygen demand', 'Fuel-mix visualization', 'Muscle recruitment context'],
  }
}

export function frameAt(replay: Workout4DReplay, t: number) {
  if (!replay.frames.length) throw new Error('Workout replay has no frames')
  let best = replay.frames[0]
  let delta = Math.abs(best.t - t)
  for (const frame of replay.frames) {
    const d = Math.abs(frame.t - t)
    if (d < delta) {
      best = frame
      delta = d
    }
  }
  return best
}

export function formatWorkoutClock(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}
