import type { ImportedWorkout } from './workoutImport'
import { buildWorkoutDna, type WorkoutDnaSignature } from './workoutDNA'

export interface HumanReplayEpoch {
  key: string
  label: string
  startedAt: string
  endedAt: string
  sessions: number
  activeMinutes: number
  distanceKm: number
  kcal: number
  avgHr?: number
  maxHr?: number
  cumulativeSessions: number
  cumulativeMinutes: number
  cumulativeDistanceKm: number
  dominantArchetype?: string
  representativeDna?: WorkoutDnaSignature
  measuredHrSessions: number
}

export interface HumanReplaySummary {
  epochs: HumanReplayEpoch[]
  firstActivity?: string
  latestActivity?: string
  totalSessions: number
  totalMinutes: number
  totalDistanceKm: number
  spanMonths: number
}

function monthKey(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  if (key === 'unknown') return 'Recorded activity'
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function weightedAverage(values: Array<{ value?: number; weight: number }>) {
  const valid = values.filter((item): item is { value: number; weight: number } => typeof item.value === 'number' && Number.isFinite(item.value) && item.weight > 0)
  const denominator = valid.reduce((sum, item) => sum + item.weight, 0)
  if (!denominator) return undefined
  return valid.reduce((sum, item) => sum + item.value * item.weight, 0) / denominator
}

function dominant(values: string[]) {
  if (!values.length) return undefined
  const counts = new Map<string, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

export function buildHumanReplay(workouts: ImportedWorkout[], hrMax: number): HumanReplaySummary {
  const sorted = [...workouts].sort((a, b) => Date.parse(a.mulai) - Date.parse(b.mulai))
  const groups = new Map<string, ImportedWorkout[]>()
  sorted.forEach((workout) => {
    const key = monthKey(workout.mulai)
    groups.set(key, [...(groups.get(key) ?? []), workout])
  })

  let cumulativeSessions = 0
  let cumulativeMinutes = 0
  let cumulativeDistanceKm = 0

  const epochs = [...groups.entries()].map(([key, group]) => {
    const dna = group.map((workout) => buildWorkoutDna(workout, hrMax))
    const activeMinutes = group.reduce((sum, workout) => sum + workout.durasi / 60, 0)
    const distanceKm = group.reduce((sum, workout) => sum + (workout.jarakKm ?? 0), 0)
    const kcal = group.reduce((sum, workout) => sum + (workout.kcal ?? 0), 0)
    const avgHr = weightedAverage(group.map((workout) => ({ value: workout.avgHr, weight: Math.max(1, workout.durasi) })))
    const maxHrValues = group.map((workout) => workout.maxHr).filter((value): value is number => typeof value === 'number')
    const representativeDna = dna.slice().sort((a, b) => b.durationMin - a.durationMin)[0]

    cumulativeSessions += group.length
    cumulativeMinutes += activeMinutes
    cumulativeDistanceKm += distanceKm

    return {
      key,
      label: monthLabel(key),
      startedAt: group[0]?.mulai ?? '',
      endedAt: group[group.length - 1]?.mulai ?? '',
      sessions: group.length,
      activeMinutes,
      distanceKm,
      kcal,
      avgHr,
      maxHr: maxHrValues.length ? Math.max(...maxHrValues) : undefined,
      cumulativeSessions,
      cumulativeMinutes,
      cumulativeDistanceKm,
      dominantArchetype: dominant(dna.map((signature) => signature.archetype)),
      representativeDna,
      measuredHrSessions: group.filter((workout) => workout.hr.length > 0 || workout.avgHr != null).length,
    } satisfies HumanReplayEpoch
  })

  const first = sorted[0]?.mulai
  const latest = sorted[sorted.length - 1]?.mulai
  const firstDate = first ? new Date(first) : null
  const latestDate = latest ? new Date(latest) : null
  const spanMonths = firstDate && latestDate && !Number.isNaN(firstDate.getTime()) && !Number.isNaN(latestDate.getTime())
    ? Math.max(1, (latestDate.getFullYear() - firstDate.getFullYear()) * 12 + latestDate.getMonth() - firstDate.getMonth() + 1)
    : epochs.length

  return {
    epochs,
    firstActivity: first,
    latestActivity: latest,
    totalSessions: sorted.length,
    totalMinutes: sorted.reduce((sum, workout) => sum + workout.durasi / 60, 0),
    totalDistanceKm: sorted.reduce((sum, workout) => sum + (workout.jarakKm ?? 0), 0),
    spanMonths,
  }
}

export function compareReplayEpochs(current: HumanReplayEpoch, previous?: HumanReplayEpoch) {
  if (!previous) return []
  return [
    { label: 'sessions', delta: current.sessions - previous.sessions, unit: '' },
    { label: 'active time', delta: Math.round(current.activeMinutes - previous.activeMinutes), unit: 'min' },
    { label: 'distance', delta: Math.round((current.distanceKm - previous.distanceKm) * 10) / 10, unit: 'km' },
  ]
}
