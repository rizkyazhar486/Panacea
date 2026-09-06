import { zoneBreakdown, type ImportedWorkout } from './workoutImport'

export type WorkoutDnaAxisId = 'endurance' | 'intensity' | 'variability' | 'recovery' | 'volume' | 'data'

export interface WorkoutDnaAxis {
  id: WorkoutDnaAxisId
  label: string
  value: number
  meaning: string
  provenance: 'measured-derived' | 'measured' | 'unavailable'
}

export interface WorkoutDnaSignature {
  workoutId: string
  name: string
  startedAt: string
  axes: WorkoutDnaAxis[]
  archetype: string
  measuredFacts: string[]
  durationMin: number
  distanceKm?: number
  avgHr?: number
  maxHr?: number
  hrr1?: number
  zoneEasyPct?: number
  zoneHardPct?: number
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

function mean(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, value) => sum + ((value - m) ** 2), 0) / values.length)
}

function archetype(axes: WorkoutDnaAxis[]) {
  const map = Object.fromEntries(axes.map((axis) => [axis.id, axis.value])) as Record<WorkoutDnaAxisId, number>
  if (map.intensity >= 72 && map.endurance >= 55) return 'Sustained high-output session'
  if (map.intensity >= 72) return 'Intensity-dominant session'
  if (map.endurance >= 72 && map.intensity < 60) return 'Steady endurance session'
  if (map.variability >= 62) return 'Variable / interval-like session'
  if (map.volume >= 70) return 'Volume-dominant session'
  if (map.recovery >= 65) return 'Strong recorded recovery response'
  return 'Mixed aerobic session'
}

export function buildWorkoutDna(workout: ImportedWorkout, hrMax: number): WorkoutDnaSignature {
  const durationMin = workout.durasi / 60
  const hrValues = workout.hr.map((point) => point.bpm).filter((value) => value > 0)
  const zones = zoneBreakdown(workout.hr, hrMax)
  const easyPct = zones.filter((zone) => zone.zona <= 2).reduce((sum, zone) => sum + zone.pctWaktu, 0)
  const hardPct = zones.filter((zone) => zone.zona >= 4).reduce((sum, zone) => sum + zone.pctWaktu, 0)
  const weightedZone = zones.reduce((sum, zone) => sum + (zone.zona * zone.pctWaktu), 0) / 100
  const fallbackIntensity = workout.avgHr && hrMax > 0 ? (workout.avgHr / hrMax) * 100 : 0
  const intensity = hrValues.length ? clamp(((weightedZone || 1) - 1) / 4 * 100) : clamp((fallbackIntensity - 45) / 45 * 100)
  const hrMean = mean(hrValues)
  const cv = hrMean > 0 ? standardDeviation(hrValues) / hrMean : 0
  const variability = hrValues.length >= 4 ? clamp(cv * 650) : 0
  const endurance = clamp(durationMin / 90 * 100)
  const distanceSignal = workout.jarakKm != null ? clamp(workout.jarakKm / 15 * 100) : 0
  const timeSignal = clamp(durationMin / 120 * 100)
  const volume = Math.max(distanceSignal, timeSignal)
  const recovery = workout.hrr1 != null ? clamp(workout.hrr1 / 35 * 100) : 0

  const measuredFacts: string[] = []
  if (workout.hr.length) measuredFacts.push(`${workout.hr.length} HR samples`)
  if (workout.avgHr != null) measuredFacts.push(`${Math.round(workout.avgHr)} bpm average`)
  if (workout.maxHr != null) measuredFacts.push(`${Math.round(workout.maxHr)} bpm max`)
  if (workout.jarakKm != null) measuredFacts.push(`${workout.jarakKm.toFixed(2)} km`)
  if (workout.hrr1 != null) measuredFacts.push(`${Math.round(workout.hrr1)} bpm HRR1`)
  if (workout.kadens != null) measuredFacts.push(`${Math.round(workout.kadens)} spm cadence`)

  const possibleMeasured = [workout.hr.length > 0, workout.avgHr != null, workout.maxHr != null, workout.jarakKm != null, workout.hrr1 != null, workout.kadens != null]
  const dataRichness = Math.round((possibleMeasured.filter(Boolean).length / possibleMeasured.length) * 100)

  const axes: WorkoutDnaAxis[] = [
    { id: 'endurance', label: 'Endurance', value: Math.round(endurance), meaning: 'Session duration normalized for visual comparison, not a fitness rating.', provenance: 'measured-derived' },
    { id: 'intensity', label: 'Intensity', value: Math.round(intensity), meaning: hrValues.length ? 'Derived from the measured heart-rate zone distribution.' : 'Derived from the recorded average HR because no continuous trace is available.', provenance: workout.avgHr || hrValues.length ? 'measured-derived' : 'unavailable' },
    { id: 'variability', label: 'Variability', value: Math.round(variability), meaning: 'Visual normalization of how much the measured heart-rate trace varied within the session.', provenance: hrValues.length >= 4 ? 'measured-derived' : 'unavailable' },
    { id: 'recovery', label: 'Recovery', value: Math.round(recovery), meaning: workout.hrr1 != null ? 'Normalized from the recorded first-minute heart-rate recovery.' : 'No first-minute recovery sample is available for this session.', provenance: workout.hrr1 != null ? 'measured-derived' : 'unavailable' },
    { id: 'volume', label: 'Volume', value: Math.round(volume), meaning: 'Visual normalization from recorded time and distance; not a training recommendation.', provenance: 'measured-derived' },
    { id: 'data', label: 'Data richness', value: dataRichness, meaning: 'How many workout signals are actually present, not how healthy the session was.', provenance: 'measured' },
  ]

  return {
    workoutId: workout.id,
    name: workout.nama,
    startedAt: workout.mulai,
    axes,
    archetype: archetype(axes),
    measuredFacts,
    durationMin,
    distanceKm: workout.jarakKm,
    avgHr: workout.avgHr,
    maxHr: workout.maxHr,
    hrr1: workout.hrr1,
    zoneEasyPct: workout.hr.length ? easyPct : undefined,
    zoneHardPct: workout.hr.length ? hardPct : undefined,
  }
}

function axisDistance(a: WorkoutDnaSignature, b: WorkoutDnaSignature) {
  const byId = new Map(b.axes.map((axis) => [axis.id, axis.value]))
  const dimensions = a.axes.filter((axis) => axis.provenance !== 'unavailable' && b.axes.some((other) => other.id === axis.id && other.provenance !== 'unavailable'))
  if (!dimensions.length) return Number.POSITIVE_INFINITY
  const squared = dimensions.reduce((sum, axis) => {
    const delta = axis.value - (byId.get(axis.id) ?? 0)
    return sum + delta * delta
  }, 0)
  return Math.sqrt(squared / dimensions.length)
}

export function findClosestWorkoutDna(target: WorkoutDnaSignature, all: WorkoutDnaSignature[]) {
  const candidates = all.filter((item) => item.workoutId !== target.workoutId)
  if (!candidates.length) return null
  return candidates
    .map((candidate) => ({ candidate, distance: axisDistance(target, candidate) }))
    .sort((a, b) => a.distance - b.distance)[0]?.candidate ?? null
}

export function buildWorkoutDnaLibrary(workouts: ImportedWorkout[], hrMax: number) {
  return [...workouts]
    .sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
    .map((workout) => buildWorkoutDna(workout, hrMax))
}
