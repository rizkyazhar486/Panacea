/**
 * Panacea Tactical Athlete OS
 *
 * Public-source human-performance analytics inspired by open military /
 * law-enforcement fitness systems. This is a sport/performance layer only:
 * no weapons optimization, targeting, surveillance, pursuit/evasion,
 * covert tracking, or operational mission planning.
 */

export type TacticalPerformanceDomain =
  | 'aerobic-capacity'
  | 'anaerobic-capacity'
  | 'strength'
  | 'power'
  | 'muscular-endurance'
  | 'loaded-mobility'
  | 'agility'
  | 'movement-quality'
  | 'cognitive-performance'
  | 'sleep'
  | 'nutrition'
  | 'heat-environment'
  | 'recovery'
  | 'team-readiness'
  | 'precision-under-fatigue'

export type TacticalMetricAuthority =
  | 'wearable'
  | 'manual-test'
  | 'lab'
  | 'environment-source'
  | 'timing-gate'
  | 'camera'
  | 'self-report'
  | 'official-public-standard'

export interface TacticalMetricDefinition {
  id: string
  label: string
  unit: string
  domain: TacticalPerformanceDomain
  authority: TacticalMetricAuthority
  notes: string
}

const metric = (
  id: string,
  label: string,
  unit: string,
  domain: TacticalPerformanceDomain,
  authority: TacticalMetricAuthority,
  notes: string,
): TacticalMetricDefinition => Object.freeze({ id, label, unit, domain, authority, notes })

export const TACTICAL_ATHLETE_METRICS = Object.freeze([
  metric('loaded-distance', 'Loaded distance', 'm', 'loaded-mobility', 'wearable', 'Distance while carrying a documented external load.'),
  metric('load-mass', 'External load', 'kg', 'loaded-mobility', 'manual-test', 'Pack/protective-equipment/training load; retain configuration.'),
  metric('relative-load', 'Relative external load', '% body mass', 'loaded-mobility', 'manual-test', 'External load divided by body mass.'),
  metric('loaded-pace', 'Loaded pace', 'min/km', 'loaded-mobility', 'wearable', 'Do not compare directly with unloaded pace.'),
  metric('loaded-speed', 'Loaded speed', 'm/s', 'loaded-mobility', 'wearable', 'Keep terrain and grade context.'),
  metric('agility-time', 'Agility course time', 's', 'agility', 'timing-gate', 'Course definition must be versioned.'),
  metric('sprint-300m', '300 m sprint', 's', 'anaerobic-capacity', 'manual-test', 'FBI-style public mixed-fitness benchmark event.'),
  metric('run-1p5mi', '1.5 mile run', 's', 'aerobic-capacity', 'manual-test', 'FBI-style public endurance benchmark event.'),
  metric('continuous-pullups', 'Continuous pull-ups/chin-ups', 'reps', 'strength', 'manual-test', 'Technique standard must be explicit.'),
  metric('continuous-pushups', 'Continuous push-ups', 'reps', 'muscular-endurance', 'manual-test', 'Technique standard must be explicit.'),
  metric('vertical-jump', 'Vertical jump', 'cm', 'power', 'timing-gate', 'Optional lower-body power proxy.'),
  metric('broad-jump', 'Standing broad jump', 'cm', 'power', 'manual-test', 'Optional horizontal power proxy.'),
  metric('reaction-time', 'Reaction time', 'ms', 'cognitive-performance', 'camera', 'Use validated task and repeated-trial distribution, not one tap.'),
  metric('decision-accuracy', 'Decision-task accuracy', '%', 'cognitive-performance', 'manual-test', 'Generic validated cognitive task only; not tactical targeting.'),
  metric('precision-task-accuracy', 'Precision-task accuracy', '%', 'precision-under-fatigue', 'manual-test', 'Use benign hand-eye/target-tapping or sport precision tasks; no weapon-use instruction.'),
  metric('sleep-duration', 'Sleep duration', 'h', 'sleep', 'wearable', 'Compare against individual need and recent trend.'),
  metric('sleep-continuity', 'Sleep continuity', '%', 'sleep', 'wearable', 'Device-specific; keep source algorithm identity.'),
  metric('rpe', 'RPE', '0-10', 'recovery', 'self-report', 'Explicit subjective exertion.'),
  metric('hr', 'Heart rate', 'bpm', 'recovery', 'wearable', 'Interpret with task, load, heat and altitude context.'),
  metric('hrv', 'HRV', 'ms', 'recovery', 'wearable', 'Metric definition must be retained.'),
  metric('wbgt', 'WBGT', '°C', 'heat-environment', 'environment-source', 'Use measured/authoritative WBGT, not a guessed heat-risk score.'),
  metric('air-temp', 'Air temperature', '°C', 'heat-environment', 'environment-source', 'Environment source and timestamp required.'),
  metric('humidity', 'Relative humidity', '%', 'heat-environment', 'environment-source', 'Environment source and timestamp required.'),
  metric('terrain-grade', 'Terrain grade', '%', 'loaded-mobility', 'environment-source', 'Map/measurement source required.'),
])

export interface PublicTacticalFramework {
  id: string
  name: string
  source: string
  domains: readonly TacticalPerformanceDomain[]
  publicElements: readonly string[]
}

export const PUBLIC_TACTICAL_FRAMEWORKS = Object.freeze([
  {
    id: 'us-army-h2f',
    name: 'U.S. Army Holistic Health and Fitness (H2F)',
    source: 'https://h2f.army.mil/',
    domains: ['aerobic-capacity','anaerobic-capacity','strength','power','movement-quality','cognitive-performance','sleep','nutrition','recovery','team-readiness'],
    publicElements: [
      'Physical readiness',
      'Mental/cognitive readiness',
      'Nutritional readiness',
      'Sleep readiness',
      'Embedded strength, rehab, nutrition, occupational and cognitive performance support',
    ],
  },
  {
    id: 'usmc-force-fitness',
    name: 'U.S. Marine Corps Force Fitness',
    source: 'https://www.fitness.marines.mil/Force-Fitness-Instructor/',
    domains: ['aerobic-capacity','anaerobic-capacity','strength','power','muscular-endurance','movement-quality','recovery','team-readiness'],
    publicElements: [
      'Holistic and progressive conditioning',
      'Structured functional exercise science',
      'Injury reduction and unit physical readiness',
      'PFT/CFT integration as public fitness benchmarks',
    ],
  },
  {
    id: 'fbi-pft',
    name: 'FBI Special Agent Physical Fitness Test',
    source: 'https://fbijobs.gov/special-agents/physical-requirements',
    domains: ['strength','anaerobic-capacity','muscular-endurance','aerobic-capacity'],
    publicElements: [
      'Continuous pull-ups/chin-ups',
      '300 m sprint',
      'Continuous push-ups',
      '1.5 mile run',
      'Short rest periods between events',
    ],
  },
])

export interface PerformanceRetentionInput {
  unloadedOrFreshValue: number
  loadedOrFatiguedValue: number
  higherIsBetter: boolean
}

/**
 * Retention compares the same task before/after load or fatigue.
 * Higher-is-better: loaded / baseline.
 * Lower-is-better: baseline / loaded.
 */
export function performanceRetention(input: PerformanceRetentionInput): number | null {
  const { unloadedOrFreshValue: baseline, loadedOrFatiguedValue: current, higherIsBetter } = input
  if (![baseline, current].every(Number.isFinite) || baseline <= 0 || current <= 0) return null
  const ratio = higherIsBetter ? current / baseline : baseline / current
  return Math.max(0, Math.min(1.5, ratio))
}

export function relativeExternalLoad(externalLoadKg: number, bodyMassKg: number): number | null {
  if (![externalLoadKg, bodyMassKg].every(Number.isFinite) || externalLoadKg < 0 || bodyMassKg <= 0) return null
  return externalLoadKg / bodyMassKg
}

export interface FatigueDeltaInput {
  baseline: number
  postTask: number
  higherIsBetter: boolean
}

/**
 * Positive fatigueDelta means performance worsened.
 */
export function fatigueDelta(input: FatigueDeltaInput): number | null {
  const { baseline, postTask, higherIsBetter } = input
  if (![baseline, postTask].every(Number.isFinite) || baseline <= 0) return null
  const raw = higherIsBetter
    ? (baseline - postTask) / baseline
    : (postTask - baseline) / baseline
  return raw
}

export interface TacticalReadinessComponents {
  physicalCapacity: number
  loadedMobility: number
  recoverySleep: number
  cognitiveRetention: number
  environmentTolerance: number
  dataConfidence: number
}

/**
 * Transparent training-readiness proxy, not a military/police fitness-for-duty
 * determination.
 *
 * Index =
 * 0.30 physical +
 * 0.20 loaded mobility +
 * 0.20 recovery/sleep +
 * 0.15 cognitive retention +
 * 0.10 environment tolerance +
 * 0.05 data confidence
 */
export function tacticalAthleteReadinessIndex(components: TacticalReadinessComponents): number | null {
  const values = Object.values(components)
  if (!values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) return null
  return (
    0.30 * components.physicalCapacity +
    0.20 * components.loadedMobility +
    0.20 * components.recoverySleep +
    0.15 * components.cognitiveRetention +
    0.10 * components.environmentTolerance +
    0.05 * components.dataConfidence
  )
}

export interface TacticalAnalyzerGraph {
  id: string
  title: string
  x: string
  y: readonly string[]
  interpretation: string
}

export const TACTICAL_ANALYZER_GRAPHS = Object.freeze([
  {
    id: 'loaded-vs-unloaded-pace',
    title: 'Loaded vs unloaded locomotion',
    x: 'distance-or-time',
    y: ['loaded-pace','heart-rate','terrain-grade','load-mass'],
    interpretation: 'Shows physiological cost of external load across terrain; compare matched sessions.',
  },
  {
    id: 'agility-load-retention',
    title: 'Agility retention under load',
    x: 'external-load',
    y: ['agility-time','performance-retention'],
    interpretation: 'Quantifies how protective/training load changes movement quality without implying operational capability.',
  },
  {
    id: 'power-after-march',
    title: 'Power retention after prolonged load carriage',
    x: 'time',
    y: ['vertical-jump','broad-jump','performance-retention'],
    interpretation: 'Tracks lower-body power before and after loaded endurance work.',
  },
  {
    id: 'cognition-after-fatigue',
    title: 'Cognitive retention after physical fatigue',
    x: 'task-phase',
    y: ['reaction-time','decision-accuracy','fatigue-delta'],
    interpretation: 'Generic cognitive performance under fatigue; no operational decision/targeting content.',
  },
  {
    id: 'precision-after-fatigue',
    title: 'Benign precision-task retention',
    x: 'fatigue-state',
    y: ['precision-task-accuracy','heart-rate','rpe'],
    interpretation: 'Hand-eye or sport precision consistency after exertion; excludes weapon-use coaching.',
  },
  {
    id: 'sleep-readiness',
    title: 'Sleep and next-day performance',
    x: 'date',
    y: ['sleep-duration','sleep-continuity','reaction-time','rpe'],
    interpretation: 'Longitudinal recovery context; Army H2F publicly identifies sleep as a readiness domain.',
  },
  {
    id: 'heat-load-strain',
    title: 'Heat + load + physiological strain',
    x: 'time',
    y: ['wbgt','heart-rate','loaded-pace','rpe'],
    interpretation: 'Environmental context for training load; not a heat-illness diagnosis.',
  },
])

export interface EvidenceObservation {
  id: string
  metricId: string
  capturedAt: string
  source: string
  value: number
  unit: string
  confidence: number
}

export interface FusedEvidenceNode {
  metricId: string
  value: number
  unit: string
  confidence: number
  sourceIds: readonly string[]
  capturedAt: string
}

/**
 * Palantir-like only in the benign sense of multi-source evidence fusion:
 * same metric + unit, weighted by source confidence, with provenance retained.
 */
export function fusePerformanceEvidence(
  observations: readonly EvidenceObservation[],
  metricId: string,
  unit: string,
): FusedEvidenceNode | null {
  const valid = observations.filter((item) =>
    item.metricId === metricId &&
    item.unit === unit &&
    Number.isFinite(item.value) &&
    Number.isFinite(item.confidence) &&
    item.confidence > 0 &&
    item.confidence <= 1 &&
    Number.isFinite(Date.parse(item.capturedAt)),
  )
  if (!valid.length) return null

  const weight = valid.reduce((sum, item) => sum + item.confidence, 0)
  const value = valid.reduce((sum, item) => sum + item.value * item.confidence, 0) / weight
  const confidence = Math.min(1, weight / valid.length)
  const capturedAt = valid
    .map((item) => item.capturedAt)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0]

  return Object.freeze({
    metricId,
    value,
    unit,
    confidence,
    sourceIds: Object.freeze(valid.map((item) => item.id)),
    capturedAt,
  })
}

export const TACTICAL_ATHLETE_OS_POLICY = Object.freeze({
  publicHumanPerformanceSourcesOnly: true as const,
  operationalMissionPlanningAllowed: false as const,
  weaponsOptimizationAllowed: false as const,
  targetingOrSurveillanceAllowed: false as const,
  pursuitEvasionCoachingAllowed: false as const,
  covertTrackingAllowed: false as const,
  fitnessForDutyCertificationAllowed: false as const,
  medicalDiagnosisAllowed: false as const,
  mentalToughnessScoreAllowed: false as const,
  evidenceProvenanceRequired: true as const,
  environmentContextRequiredForLoadedPerformance: true as const,
})

export const TACTICAL_ATHLETE_SOURCE_REGISTRY = Object.freeze([
  {
    id: 'army-h2f',
    url: 'https://h2f.army.mil/',
    note: 'U.S. Army H2F: integrated physical, mental/cognitive, nutrition and sleep readiness with multidisciplinary performance teams.',
  },
  {
    id: 'army-h2f-sleep',
    url: 'https://h2f.army.mil/Domains/Sleep-Domain/',
    note: 'Army H2F publicly recommends 7–9 hours of sleep per day for health/performance and treats sleep as a readiness domain.',
  },
  {
    id: 'usmc-force-fitness',
    url: 'https://www.fitness.marines.mil/Force-Fitness-Instructor/',
    note: 'Marine Force Fitness Instructor program: positive, holistic, progressive and structured functional exercise science.',
  },
  {
    id: 'fbi-pft',
    url: 'https://fbijobs.gov/special-agents/physical-requirements',
    note: 'FBI PFT public event sequence: pull-ups/chin-ups, 300 m sprint, push-ups, 1.5 mile run.',
  },
  {
    id: 'load-carriage-risk',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26506174/',
    note: 'Load carriage increases injury and tactical-performance risk.',
  },
  {
    id: 'load-carriage-gait',
    url: 'https://pubmed.ncbi.nlm.nih.gov/33540208/',
    note: 'Systematic review: heavy military load carriage changes gait and increases injury risk.',
  },
  {
    id: 'load-carriage-power-agility',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29316674/',
    note: 'Review: tactical load can reduce power/agility performance.',
  },
  {
    id: 'foot-march-cognition-2026',
    url: 'https://pubmed.ncbi.nlm.nih.gov/42127345/',
    note: '2026 systematic review/meta-analysis on cognitive effects following military foot marches.',
  },
  {
    id: 'military-heat-illness-2026',
    url: 'https://www.health.mil/News/Articles/2026/05/01/MSMR-Heat-Illness-2026',
    note: 'Military Health System surveillance identifies heat illness as a major training/operational hazard requiring situational awareness and risk management.',
  },
])
