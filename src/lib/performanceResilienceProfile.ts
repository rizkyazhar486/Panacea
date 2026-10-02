/**
 * Panacea Performance Resilience Profile
 *
 * Separates objective task-performance retention from psychometric/self-report
 * constructs. No single "mental toughness" score is inferred from wearables.
 */

export type ResilienceTaskClass =
  | 'reaction'
  | 'attention'
  | 'decision'
  | 'precision'
  | 'locomotion'
  | 'strength-power'
  | 'endurance'
  | 'team-coordination'

export interface PressureTrialObservation {
  id: string
  taskClass: ResilienceTaskClass
  metricId: string
  baselineValue: number
  pressuredValue: number
  higherIsBetter: boolean
  source: string
  capturedAt: string
  confidence: number
  contextTags: readonly string[]
}

export interface TaskRetentionResult {
  id: string
  taskClass: ResilienceTaskClass
  metricId: string
  retention: number
  deterioration: number
  confidence: number
  source: string
  capturedAt: string
  contextTags: readonly string[]
}

export function taskRetention(observation: PressureTrialObservation): TaskRetentionResult | null {
  const { baselineValue, pressuredValue, higherIsBetter, confidence } = observation
  if (
    !observation.id.trim() ||
    !observation.metricId.trim() ||
    !observation.source.trim() ||
    ![baselineValue, pressuredValue, confidence].every(Number.isFinite) ||
    baselineValue <= 0 ||
    pressuredValue <= 0 ||
    confidence <= 0 ||
    confidence > 1 ||
    !Number.isFinite(Date.parse(observation.capturedAt))
  ) return null

  const rawRetention = higherIsBetter
    ? pressuredValue / baselineValue
    : baselineValue / pressuredValue

  return Object.freeze({
    id: observation.id,
    taskClass: observation.taskClass,
    metricId: observation.metricId,
    retention: Math.max(0, Math.min(1.5, rawRetention)),
    deterioration: 1 - rawRetention,
    confidence,
    source: observation.source,
    capturedAt: observation.capturedAt,
    contextTags: Object.freeze([...observation.contextTags]),
  })
}

export interface ResilienceDimension {
  taskClass: ResilienceTaskClass
  retention: number
  confidence: number
  sampleCount: number
  sourceIds: readonly string[]
}

export interface ObservedPerformanceResilienceProfile {
  dimensions: readonly ResilienceDimension[]
  observedResilienceIndex: number | null
  coverage: number
  dataConfidence: number
  label: 'objective-performance-retention'
  interpretationBoundary: string
}

/**
 * OPRI is exposed only with >=3 distinct task classes.
 *
 * OPRI = mean(dimensionRetention) * (0.75 + 0.25*dataConfidence)
 *
 * It is a task-retention summary, not a personality trait, diagnosis,
 * employment standard or fitness-for-duty certification.
 */
export function buildObservedPerformanceResilienceProfile(
  observations: readonly PressureTrialObservation[],
): ObservedPerformanceResilienceProfile {
  const retained = observations
    .map(taskRetention)
    .filter((item): item is TaskRetentionResult => item !== null)

  const groups = new Map<ResilienceTaskClass, TaskRetentionResult[]>()
  for (const item of retained) {
    const group = groups.get(item.taskClass) ?? []
    group.push(item)
    groups.set(item.taskClass, group)
  }

  const dimensions = [...groups.entries()].map(([taskClass, items]) => {
    const totalConfidence = items.reduce((sum, item) => sum + item.confidence, 0)
    const retention = items.reduce((sum, item) => sum + item.retention * item.confidence, 0) / totalConfidence
    const confidence = totalConfidence / items.length

    return Object.freeze({
      taskClass,
      retention,
      confidence,
      sampleCount: items.length,
      sourceIds: Object.freeze(items.map((item) => item.id)),
    })
  })

  const dataConfidence = dimensions.length
    ? dimensions.reduce((sum, dimension) => sum + dimension.confidence, 0) / dimensions.length
    : 0
  const coverage = dimensions.length / 8

  const observedResilienceIndex = dimensions.length >= 3
    ? (
        dimensions.reduce((sum, dimension) => sum + dimension.retention, 0) /
        dimensions.length
      ) * (0.75 + 0.25 * dataConfidence)
    : null

  return Object.freeze({
    dimensions: Object.freeze(dimensions),
    observedResilienceIndex,
    coverage,
    dataConfidence,
    label: 'objective-performance-retention',
    interpretationBoundary:
      'This profile measures retention on tested benign tasks only. It is not mental toughness, personality, diagnosis, employability, or fitness-for-duty.',
  })
}

export interface PsychometricEvidence {
  instrumentId: string
  instrumentVersion: string
  populationValidation: string
  construct:
    | 'mental-toughness'
    | 'resilience'
    | 'mindfulness'
    | 'stress'
    | 'self-efficacy'
  administeredAt: string
  score?: number
  scoreUnit?: string
  sourceCitation: string
  userReported: true
}

export const PSYCHOMETRIC_POLICY = Object.freeze({
  validatedInstrumentRequired: true as const,
  instrumentVersionRequired: true as const,
  populationValidationRequired: true as const,
  selfReportKeptSeparateFromObjectivePerformance: true as const,
  noWearableInferenceOfMentalState: true as const,
  noUnvalidatedCompositeMentalToughnessScore: true as const,
})

export interface SafeCapabilityMapping {
  requestedCapability:
    | 'weapon-optimization'
    | 'human-targeting'
    | 'covert-surveillance'
    | 'pursuit-evasion'
    | 'operational-mission-planning'
    | 'mental-toughness-score'
  safePerformanceCapability: string
  measurableOutputs: readonly string[]
}

export const SAFE_TACTICAL_PERFORMANCE_MAPPINGS = Object.freeze([
  {
    requestedCapability: 'weapon-optimization',
    safePerformanceCapability: 'sport precision, hand-eye coordination, reaction and stability analysis',
    measurableOutputs: ['reaction-time', 'precision-task-accuracy', 'postural-stability', 'fatigue-retention'],
  },
  {
    requestedCapability: 'human-targeting',
    safePerformanceCapability: 'benign visual-search, anticipation and target-selection tasks used in sport',
    measurableOutputs: ['visual-search-time', 'decision-accuracy', 'false-positive-rate', 'reaction-time'],
  },
  {
    requestedCapability: 'covert-surveillance',
    safePerformanceCapability: 'authorized situational awareness for consenting team members, devices and rescue assets',
    measurableOutputs: ['authorized-position', 'link-quality', 'last-known-fix', 'team-connectivity'],
  },
  {
    requestedCapability: 'pursuit-evasion',
    safePerformanceCapability: 'agility, obstacle-course navigation and route-choice under fatigue',
    measurableOutputs: ['course-time', 'direction-change-count', 'route-error-rate', 'fatigue-retention'],
  },
  {
    requestedCapability: 'operational-mission-planning',
    safePerformanceCapability: 'sport event, expedition and search-and-rescue planning with environmental constraints',
    measurableOutputs: ['route-cost', 'weather-risk', 'communication-risk', 'uncertainty'],
  },
  {
    requestedCapability: 'mental-toughness-score',
    safePerformanceCapability: 'separate psychometric profile plus objective performance-retention profile',
    measurableOutputs: ['validated-self-report-score', 'task-retention', 'coverage', 'data-confidence'],
  },
] satisfies readonly SafeCapabilityMapping[])

export const PERFORMANCE_RESILIENCE_SOURCE_REGISTRY = Object.freeze([
  {
    id: 'mental-toughness-psychometrics-2012',
    url: 'https://pubmed.ncbi.nlm.nih.gov/22369040/',
    note: 'Psychometric examination of sport mental-toughness instruments; instrument properties must be validated rather than assumed.',
  },
  {
    id: 'firefighter-mental-toughness-2024',
    url: 'https://pubmed.ncbi.nlm.nih.gov/39062346/',
    note: 'Concurrent validity/reliability work in firefighting demonstrates instrument and population context matter.',
  },
  {
    id: 'esports-mental-toughness-resilience-2026',
    url: 'https://pubmed.ncbi.nlm.nih.gov/41203224/',
    note: 'Recent evidence that mental-toughness/resilience predictors may fall short for performance, supporting separation from objective outcomes.',
  },
])
