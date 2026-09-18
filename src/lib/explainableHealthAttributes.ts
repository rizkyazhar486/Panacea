import type {
  LongitudinalTwinSignal,
  LongitudinalTwinSnapshot,
} from './longitudinalDigitalTwin'

export type HealthAttributeId =
  | 'cardio-fitness'
  | 'sleep'
  | 'recovery'
  | 'mobility'
  | 'strength'
  | 'endurance'
  | 'metabolic'

export type AttributeEvidenceRole = 'primary' | 'supporting'

export interface HealthAttributeMetricDefinition {
  metric: string
  label: string
  role: AttributeEvidenceRole
}

export interface HealthAttributeDefinition {
  id: HealthAttributeId
  label: string
  description: string
  metrics: readonly HealthAttributeMetricDefinition[]
}

export interface HealthAttributeEvidence {
  metric: string
  label: string
  role: AttributeEvidenceRole
  available: boolean
  signal?: LongitudinalTwinSignal
}

export type HealthAttributeEvidenceState =
  | 'primary-observed'
  | 'supporting-only'
  | 'insufficient-evidence'

export interface ExplainableHealthAttribute {
  id: HealthAttributeId
  label: string
  description: string
  subjectId: string
  at: string
  sourceRevision: number
  evidenceState: HealthAttributeEvidenceState
  evidence: readonly HealthAttributeEvidence[]
  coverage: {
    available: number
    total: number
    primaryAvailable: number
    primaryTotal: number
    ratio: number
  }
  boundary: {
    descriptiveOnly: true
    diagnosticScore: false
    validatedCompositeScore: false
    treatmentRecommendation: false
    coverageIsHealthQuality: false
    higherIsAlwaysBetter: false
  }
}

/**
 * These definitions identify which observed measurements are relevant to each
 * human-readable attribute. They intentionally DO NOT assign weights,
 * thresholds, percentiles, "overall health" scores, or game-like ratings.
 *
 * A future numerical score may only be added per attribute when a versioned,
 * validated calculation with an explicit population/use case is available.
 */
export const HEALTH_ATTRIBUTE_DEFINITIONS: readonly HealthAttributeDefinition[] = [
  {
    id: 'cardio-fitness',
    label: 'Cardio fitness',
    description: 'Observed aerobic-capacity and cardiovascular-performance evidence.',
    metrics: [
      { metric: 'vo2max', label: 'VO₂max', role: 'primary' },
      { metric: 'six-minute-walk-distance', label: '6-minute walk', role: 'primary' },
      { metric: 'resting-heart-rate', label: 'Resting heart rate', role: 'supporting' },
      { metric: 'cardio-recovery', label: 'Heart-rate recovery', role: 'supporting' },
    ],
  },
  {
    id: 'sleep',
    label: 'Sleep',
    description: 'Observed sleep duration, timing consistency and stage evidence.',
    metrics: [
      { metric: 'sleep-duration', label: 'Sleep duration', role: 'primary' },
      { metric: 'wellness-sleep-duration', label: 'Wellness sleep duration', role: 'primary' },
      { metric: 'bedtime-consistency', label: 'Bedtime consistency', role: 'supporting' },
      { metric: 'sleep-deep-duration', label: 'Deep sleep', role: 'supporting' },
      { metric: 'sleep-rem-duration', label: 'REM sleep', role: 'supporting' },
      { metric: 'sleep-awake-duration', label: 'Awake time', role: 'supporting' },
    ],
  },
  {
    id: 'recovery',
    label: 'Recovery',
    description: 'Observed recovery-related physiology without collapsing it into one opaque readiness score.',
    metrics: [
      { metric: 'hrv', label: 'HRV', role: 'primary' },
      { metric: 'recovery-score', label: 'Device recovery score', role: 'primary' },
      { metric: 'resting-heart-rate', label: 'Resting heart rate', role: 'supporting' },
      { metric: 'cardio-recovery', label: 'Heart-rate recovery', role: 'supporting' },
      { metric: 'body-temperature', label: 'Body temperature', role: 'supporting' },
    ],
  },
  {
    id: 'mobility',
    label: 'Mobility',
    description: 'Observed walking function and gait evidence.',
    metrics: [
      { metric: 'walking-speed', label: 'Walking speed', role: 'primary' },
      { metric: 'six-minute-walk-distance', label: '6-minute walk', role: 'primary' },
      { metric: 'walking-asymmetry', label: 'Walking asymmetry', role: 'supporting' },
      { metric: 'walking-double-support', label: 'Double-support time', role: 'supporting' },
      { metric: 'walking-step-length', label: 'Step length', role: 'supporting' },
    ],
  },
  {
    id: 'strength',
    label: 'Strength',
    description: 'Direct strength evidence is preferred; body composition alone is not treated as strength.',
    metrics: [
      { metric: 'grip-strength', label: 'Grip strength', role: 'primary' },
      { metric: 'skeletal-muscle-mass', label: 'Skeletal muscle mass', role: 'supporting' },
      { metric: 'lean-mass', label: 'Lean mass', role: 'supporting' },
    ],
  },
  {
    id: 'endurance',
    label: 'Endurance',
    description: 'Observed sustained-exercise capacity and workload evidence.',
    metrics: [
      { metric: 'vo2max', label: 'VO₂max', role: 'primary' },
      { metric: 'six-minute-walk-distance', label: '6-minute walk', role: 'primary' },
      { metric: 'active-minutes', label: 'Active minutes', role: 'supporting' },
      { metric: 'activity-duration', label: 'Activity duration', role: 'supporting' },
      { metric: 'exercise-duration', label: 'Exercise duration', role: 'supporting' },
      { metric: 'distance', label: 'Device distance', role: 'supporting' },
      { metric: 'activity-distance', label: 'GPS activity distance', role: 'supporting' },
      { metric: 'running-power', label: 'Running power', role: 'supporting' },
    ],
  },
  {
    id: 'metabolic',
    label: 'Metabolic',
    description: 'Observed metabolic and body-composition evidence; not a diagnosis or metabolic-syndrome score.',
    metrics: [
      { metric: 'glucose', label: 'Glucose', role: 'primary' },
      { metric: 'bmi', label: 'BMI', role: 'primary' },
      { metric: 'weight', label: 'Weight', role: 'supporting' },
      { metric: 'body-fat', label: 'Body fat', role: 'supporting' },
      { metric: 'skeletal-muscle-mass', label: 'Skeletal muscle mass', role: 'supporting' },
    ],
  },
] as const

function definitionById(id: HealthAttributeId): HealthAttributeDefinition {
  const definition = HEALTH_ATTRIBUTE_DEFINITIONS.find((item) => item.id === id)
  if (!definition) throw new Error(`unknown health attribute: ${id}`)
  return definition
}

function evidenceState(evidence: readonly HealthAttributeEvidence[]): HealthAttributeEvidenceState {
  const primaryAvailable = evidence.some((item) => item.role === 'primary' && item.available)
  if (primaryAvailable) return 'primary-observed'
  if (evidence.some((item) => item.available)) return 'supporting-only'
  return 'insufficient-evidence'
}

/**
 * Build one explainable attribute from a governed Digital Twin snapshot.
 *
 * Coverage answers "how much of this attribute's expected evidence is present?"
 * It never answers "how healthy is the patient?".
 */
export function buildExplainableHealthAttribute(
  snapshot: LongitudinalTwinSnapshot,
  id: HealthAttributeId,
): ExplainableHealthAttribute {
  const definition = definitionById(id)
  const signalsByMetric = new Map(snapshot.signals.map((signal) => [signal.metric, signal]))

  const evidence = definition.metrics.map((metric) => {
    const signal = signalsByMetric.get(metric.metric)
    return {
      ...metric,
      available: Boolean(signal),
      signal,
    } satisfies HealthAttributeEvidence
  })

  const primary = evidence.filter((item) => item.role === 'primary')
  const available = evidence.filter((item) => item.available).length
  const primaryAvailable = primary.filter((item) => item.available).length

  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    subjectId: snapshot.subjectId,
    at: snapshot.at,
    sourceRevision: snapshot.sourceRevision,
    evidenceState: evidenceState(evidence),
    evidence,
    coverage: {
      available,
      total: evidence.length,
      primaryAvailable,
      primaryTotal: primary.length,
      ratio: evidence.length ? available / evidence.length : 0,
    },
    boundary: {
      descriptiveOnly: true,
      diagnosticScore: false,
      validatedCompositeScore: false,
      treatmentRecommendation: false,
      coverageIsHealthQuality: false,
      higherIsAlwaysBetter: false,
    },
  }
}

export function buildExplainableHealthAttributes(
  snapshot: LongitudinalTwinSnapshot,
): readonly ExplainableHealthAttribute[] {
  return HEALTH_ATTRIBUTE_DEFINITIONS.map((definition) =>
    buildExplainableHealthAttribute(snapshot, definition.id),
  )
}
