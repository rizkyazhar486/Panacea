import type { Vitals } from './healthVitals'
import type { ImportedWorkout } from './workoutImport'

export type PassportConstellation = {
  id: 'move' | 'recover' | 'capacity' | 'body' | 'learn' | 'prevent'
  label: string
  symbol: string
  unlocked: boolean
  headline: string
  detail: string
  evidence: string[]
}

export type PassportSummary = {
  sessions: number
  distanceKm: number
  activeMinutes: number
  distinctLearningRoutes: number
  constellations: PassportConstellation[]
  unlockedCount: number
  firstActivity?: string
  latestActivity?: string
  dataSource?: string
}

export type UsageCounts = Record<string, number>

const LEARNING_PREFIXES = [
  '/med-study', '/learn', '/rujukan', '/drug-info', '/body-explorer', '/radiology',
  '/knowledge-bridge', '/clinical-scores', '/clinical-calculators', '/osce-ukmppd',
]

function rounded(value: number, digits = 1) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function presentNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function isLearningRoute(path: string) {
  return LEARNING_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`))
}

export function buildHumanPassport(vitals: Vitals, workouts: ImportedWorkout[], usage: UsageCounts): PassportSummary {
  const sessions = workouts.length
  const distanceKm = rounded(workouts.reduce((sum, workout) => sum + (workout.jarakKm ?? 0), 0), 1)
  const activeMinutes = Math.round(workouts.reduce((sum, workout) => sum + Math.max(0, workout.durasi) / 60, 0))
  const learningRoutes = Object.entries(usage)
    .filter(([path, visits]) => visits > 0 && isLearningRoute(path))
    .map(([path]) => path)
  const distinctLearningRoutes = new Set(learningRoutes).size

  const recoveryEvidence = [
    presentNumber(vitals.sleepH) ? `${rounded(vitals.sleepH, 1)} h sleep recorded` : null,
    presentNumber(vitals.hrvMs) ? `${Math.round(vitals.hrvMs)} ms HRV recorded` : null,
    presentNumber(vitals.restingHr) ? `${Math.round(vitals.restingHr)} bpm resting HR recorded` : null,
  ].filter((value): value is string => Boolean(value))

  const capacityEvidence = [
    presentNumber(vitals.vo2max) ? `VO₂max ${rounded(vitals.vo2max, 1)} mL/kg/min` : null,
    presentNumber(vitals.sixMinWalkM) ? `6-minute walk ${Math.round(vitals.sixMinWalkM)} m` : null,
    presentNumber(vitals.runningPowerW) ? `running power ${Math.round(vitals.runningPowerW)} W` : null,
  ].filter((value): value is string => Boolean(value))

  const bodyEvidence = [
    presentNumber(vitals.weightKg) ? `${rounded(vitals.weightKg, 1)} kg measured` : null,
    presentNumber(vitals.bodyFatPct) ? `${rounded(vitals.bodyFatPct, 1)}% body fat measured` : null,
    presentNumber(vitals.skeletalMuscleKg) ? `${rounded(vitals.skeletalMuscleKg, 1)} kg skeletal muscle measured` : null,
  ].filter((value): value is string => Boolean(value))

  const preventionEvidence = [
    presentNumber(vitals.systolic) && presentNumber(vitals.diastolic) ? `blood pressure ${Math.round(vitals.systolic)}/${Math.round(vitals.diastolic)} recorded` : null,
    presentNumber(vitals.spo2Pct) ? `SpO₂ ${rounded(vitals.spo2Pct, 1)}% recorded` : null,
    presentNumber(vitals.respRate) ? `respiratory rate ${rounded(vitals.respRate, 1)} /min recorded` : null,
    presentNumber(vitals.bodyTempC) ? `temperature ${rounded(vitals.bodyTempC, 1)} °C recorded` : null,
  ].filter((value): value is string => Boolean(value))

  const constellations: PassportConstellation[] = [
    {
      id: 'move', label: 'Movement', symbol: 'ORBIT', unlocked: sessions > 0,
      headline: sessions > 0 ? `${sessions} sessions · ${distanceKm} km` : 'Waiting for your first movement log',
      detail: sessions > 0 ? `${activeMinutes} active minutes have become part of your longitudinal story.` : 'Import or log one activity to begin the movement chapter.',
      evidence: sessions > 0 ? [`${sessions} recorded sessions`, `${distanceKm} km recorded`, `${activeMinutes} active minutes`] : [],
    },
    {
      id: 'recover', label: 'Recovery', symbol: 'MOON', unlocked: recoveryEvidence.length > 0,
      headline: recoveryEvidence.length > 0 ? 'Recovery signals observed' : 'Recovery chapter not measured yet',
      detail: recoveryEvidence.length > 0 ? 'Sleep and autonomic signals stay factual and source-aware; Panacea does not convert them into a fictional universal readiness score.' : 'Connect sleep, HRV or resting-heart-rate data to illuminate this chapter.',
      evidence: recoveryEvidence,
    },
    {
      id: 'capacity', label: 'Capacity', symbol: 'PULSE', unlocked: capacityEvidence.length > 0,
      headline: capacityEvidence.length > 0 ? 'Cardiorespiratory capacity has a measured anchor' : 'Capacity chapter not measured yet',
      detail: capacityEvidence.length > 0 ? 'Measured capacity can be revisited over time without pretending that one number defines health.' : 'A VO₂max, 6-minute walk or running-power observation can anchor this chapter.',
      evidence: capacityEvidence,
    },
    {
      id: 'body', label: 'Body', symbol: 'FORM', unlocked: bodyEvidence.length > 0,
      headline: bodyEvidence.length > 0 ? 'Body composition has a measured anchor' : 'Body chapter not measured yet',
      detail: bodyEvidence.length > 0 ? 'The Passport records what was measured and when; it does not treat reference anatomy as your personal anatomy.' : 'Weight or body-composition data can populate this chapter.',
      evidence: bodyEvidence,
    },
    {
      id: 'learn', label: 'Knowledge', symbol: 'MIND', unlocked: distinctLearningRoutes > 0,
      headline: distinctLearningRoutes > 0 ? `${distinctLearningRoutes} learning spaces explored` : 'Knowledge chapter waiting to begin',
      detail: distinctLearningRoutes > 0 ? 'Your learning footprint becomes part of the Passport without exposing the topics publicly unless you choose to share them.' : 'Explore medicine, anatomy, radiology or drug references to start this constellation.',
      evidence: distinctLearningRoutes > 0 ? [`${distinctLearningRoutes} distinct learning routes visited`] : [],
    },
    {
      id: 'prevent', label: 'Prevention', symbol: 'SHIELD', unlocked: preventionEvidence.length > 0,
      headline: preventionEvidence.length > 0 ? `${preventionEvidence.length} preventive signal groups recorded` : 'Prevention chapter not measured yet',
      detail: preventionEvidence.length > 0 ? 'This records observed signals only. It is not a diagnosis and not a replacement for appropriate screening or clinical care.' : 'Basic measured signals can populate this chapter while keeping interpretation separate.',
      evidence: preventionEvidence,
    },
  ]

  const dates = workouts.map((workout) => Date.parse(workout.mulai)).filter(Number.isFinite).sort((a, b) => a - b)
  return {
    sessions,
    distanceKm,
    activeMinutes,
    distinctLearningRoutes,
    constellations,
    unlockedCount: constellations.filter((item) => item.unlocked).length,
    firstActivity: dates.length ? new Date(dates[0]).toISOString() : undefined,
    latestActivity: dates.length ? new Date(dates[dates.length - 1]).toISOString() : undefined,
    dataSource: typeof vitals.source === 'string' ? vitals.source : undefined,
  }
}

export function nextPassportQuest(summary: PassportSummary): { title: string; detail: string; to: string } {
  const firstLocked = summary.constellations.find((item) => !item.unlocked)
  if (!firstLocked) return { title: 'Build a deeper story', detail: 'All six constellations have a real-data anchor. Continue longitudinally rather than chasing a fictional perfect score.', to: '/harian' }
  switch (firstLocked.id) {
    case 'move': return { title: 'Start the movement chapter', detail: 'Log or import one real workout.', to: '/latihan' }
    case 'recover': return { title: 'Illuminate recovery', detail: 'Connect sleep, HRV or resting-heart-rate data.', to: '/health-data' }
    case 'capacity': return { title: 'Anchor capacity', detail: 'Record a measured capacity signal such as VO₂max when available.', to: '/health-data' }
    case 'body': return { title: 'Anchor body composition', detail: 'Add a real measurement rather than a placeholder.', to: '/health-data' }
    case 'learn': return { title: 'Explore one human system', detail: 'Open the 4D atlas or a medical learning path.', to: '/body-explorer' }
    case 'prevent': return { title: 'Build a preventive baseline', detail: 'Connect measured basic health signals with provenance.', to: '/health-data' }
  }
}
