import type { ImportedWorkout } from './workoutImport'
import { workoutDurationSeconds } from '../shared/kernel/workoutDurationEvidence'
import { buildWorkoutDna, type WorkoutDnaSignature } from './workoutDNA'

export interface HumanReplayEpoch {
  key: string
  label: string
  startedAt: string
  endedAt: string
  sessions: number
  activeMinutes: number | null
  distanceKm: number | null
  kcal: number | null
  avgHr?: number
  maxHr?: number
  cumulativeSessions: number
  cumulativeMinutes: number | null
  cumulativeDistanceKm: number | null
  dominantArchetype?: string
  representativeDna?: WorkoutDnaSignature
  measuredHrSessions: number
}

export interface HumanReplaySummary {
  epochs: HumanReplayEpoch[]
  firstActivity?: string
  latestActivity?: string
  totalSessions: number
  totalMinutes: number | null
  totalDistanceKm: number | null
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
  const valid = values.filter((item): item is { value: number; weight: number } => typeof item.value === 'number' && Number.isFinite(item.value) && Number.isFinite(item.weight) && item.weight > 0)
  const denominator = valid.reduce((sum, item) => sum + item.weight, 0)
  if (!Number.isFinite(denominator) || denominator <= 0) return undefined
  const numerator = valid.reduce((sum, item) => sum + item.value * item.weight, 0)
  return Number.isFinite(numerator) ? numerator / denominator : undefined
}

function dominant(values: string[]) {
  if (!values.length) return undefined
  const counts = new Map<string, number>()
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
}

// A complete total requires evidence for every included session. Missing
// measurements cannot silently contribute zero to monthly, cumulative or poster values.
function measuredTotal(workouts: ImportedWorkout[], read: (workout: ImportedWorkout) => number | null | undefined): number | null {
  if (!workouts.length) return null
  let total = 0
  for (const workout of workouts) {
    const value = read(workout)
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
    total += value
    if (!Number.isFinite(total)) return null
  }
  return total
}

function durationMinutes(workouts: ImportedWorkout[]): number | null {
  return measuredTotal(workouts, workout => {
    const seconds = workoutDurationSeconds(workout)
    return seconds === null ? null : seconds / 60
  })
}

function cumulativeTotal(previous: number | null, current: number | null): number | null {
  if (previous === null || current === null) return null
  const sum = previous + current
  return Number.isFinite(sum) ? sum : null
}

export function buildHumanReplay(workouts: ImportedWorkout[], hrMax: number): HumanReplaySummary {
  const sorted = [...workouts].sort((a, b) => Date.parse(a.mulai) - Date.parse(b.mulai))
  const groups = new Map<string, ImportedWorkout[]>()
  sorted.forEach((workout) => {
    const key = monthKey(workout.mulai)
    groups.set(key, [...(groups.get(key) ?? []), workout])
  })

  let cumulativeSessions = 0
  let cumulativeMinutes: number | null = 0
  let cumulativeDistanceKm: number | null = 0

  const epochs = [...groups.entries()].map(([key, group]) => {
    const dna = group.map((workout) => buildWorkoutDna(workout, hrMax))
    const activeMinutes = durationMinutes(group)
    const distanceKm = measuredTotal(group, workout => workout.jarakKm)
    const kcal = measuredTotal(group, workout => workout.kcal)
    const avgHr = weightedAverage(group.map((workout) => ({ value: workout.avgHr, weight: workoutDurationSeconds(workout) ?? 0 })))
    const maxHrValues = group.map((workout) => workout.maxHr).filter((value): value is number => typeof value === 'number')
    const representativeDna = dna.slice().sort((a, b) => b.durationMin - a.durationMin)[0]

    cumulativeSessions += group.length
    cumulativeMinutes = cumulativeTotal(cumulativeMinutes, activeMinutes)
    cumulativeDistanceKm = cumulativeTotal(cumulativeDistanceKm, distanceKm)

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
    totalMinutes: durationMinutes(sorted),
    totalDistanceKm: measuredTotal(sorted, workout => workout.jarakKm),
    spanMonths,
  }
}

function measurementDelta(current: number | null, previous: number | null, scale: number): number | null {
  if (current === null || previous === null) return null
  const scaled = (current - previous) * scale
  return Number.isFinite(scaled) ? Math.round(scaled) / scale : null
}

export function compareReplayEpochs(current: HumanReplayEpoch, previous?: HumanReplayEpoch) {
  if (!previous) return []
  return [
    { label: 'sessions', delta: current.sessions - previous.sessions, unit: '' },
    { label: 'active time', delta: measurementDelta(current.activeMinutes, previous.activeMinutes, 1), unit: 'min' },
    { label: 'distance', delta: measurementDelta(current.distanceKm, previous.distanceKm, 10), unit: 'km' },
  ]
}
