import {
  buildContextPacket,
  projectStateToSurface,
  type LongitudinalEvent,
  type LongitudinalPatientState,
  type NumericTrend,
  type SemanticState,
} from '../../../lib/panaceaLongitudinalState.ts'
import { planCognitiveTranslation, type CognitiveTranslationPlan } from '../../../lib/cognitiveTranslationKernel.ts'
import { angka, asal, labelMetrik } from '../../../lib/perubahanLongitudinal.ts'
import type { EdenDisclosureDepth, Role } from '../../../lib/types.ts'

export type EdenLongitudinalAccess =
  | 'ready'
  | 'no-state'
  | 'patient-view-required'
  | 'identity-mismatch'

export interface EdenLongitudinalInsightSource {
  state: LongitudinalPatientState | null
  patientId: string
  viewerRole?: Role
  accountPatientId?: string
  labels?: Record<string, string>
}

export interface EdenPhysiologyReference {
  id: 'medlineplus-vital-signs' | 'fda-pulse-oximeter-basics' | 'niddk-glucose-insulin'
  title: string
  publisher: string
  url: string
  reviewedAt: '2026-10-27'
  claim: string
  limitation: string
}

interface EdenPhysiologyContext extends EdenPhysiologyReference {
  metrics: readonly string[]
}

const PHYSIOLOGY_CONTEXTS: readonly EdenPhysiologyContext[] = [
  {
    id: 'medlineplus-vital-signs',
    title: 'Vital Signs',
    publisher: 'MedlinePlus · U.S. National Library of Medicine',
    url: 'https://medlineplus.gov/vitalsigns.html',
    reviewedAt: '2026-10-27',
    metrics: [
      'systolic', 'diastolic', 'heartRate', 'restingHr', 'respiratoryRate', 'temperatureC',
      'blood-pressure-systolic', 'blood-pressure-diastolic', 'heart-rate',
      'resting-heart-rate', 'respiratory-rate', 'body-temperature',
    ],
    claim: 'Vital signs describe essential body functions. Their meaning depends on context, so this record is a starting point for understanding—not a diagnosis.',
    limitation: 'This general reference does not interpret your value, symptoms, medicines, measurement conditions, or personal clinical range.',
  },
  {
    id: 'fda-pulse-oximeter-basics',
    title: 'Pulse Oximeter Basics',
    publisher: 'U.S. Food and Drug Administration',
    url: 'https://www.fda.gov/consumers/consumer-updates/pulse-oximeter-basics',
    reviewedAt: '2026-10-27',
    metrics: ['spo2', 'spo2Pct'],
    claim: 'Pulse oximetry estimates blood oxygen saturation. The estimate belongs alongside symptoms and how you feel, not in isolation.',
    limitation: 'Accuracy can be affected by circulation, skin pigmentation, skin thickness and temperature, tobacco use, and fingernail polish. General-wellness devices are not FDA-evaluated for clinical decision-making.',
  },
  {
    id: 'niddk-glucose-insulin',
    title: 'What Is Diabetes?',
    publisher: 'National Institute of Diabetes and Digestive and Kidney Diseases',
    url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes',
    reviewedAt: '2026-10-27',
    metrics: ['glucose', 'blood-glucose', 'lab.gdp', 'review.lab.gdp'],
    claim: 'Glucose is a main energy source. Insulin, a hormone made by the pancreas, helps glucose enter cells to be used for energy.',
    limitation: 'This molecular physiology does not establish why your value changed or whether any diagnostic threshold applies; meal timing, method, and clinical context remain necessary.',
  },
] as const

const OBSERVATION_STATES = new Set<SemanticState>([
  'measured',
  'imported',
  'clinician-entered',
  'patient-reported',
  'clinician-reviewed',
])

const SEPARATED_STATES: readonly SemanticState[] = [
  'derived',
  'rule-output',
  'ai-draft',
  'model-estimated',
  'simulated',
  'counterfactual',
  'hypothesis',
  'reference',
  'stale',
  'unknown',
  'unsupported',
  'unavailable',
]

export interface EdenLongitudinalChange {
  metric: string
  label: string
  domain: LongitudinalEvent['domain']
  latestValue: number
  unit?: string
  recordedAt: string
  eventCount: number
  semanticState?: SemanticState
  observationLabel: string
  sourceLabel: string
  provenance: LongitudinalEvent['provenance']
  confidence: number
  review: LongitudinalEvent['review']
  trend: NumericTrend | null
  whyItMatters: string
  reference: EdenPhysiologyReference | null
  limitations: string[]
}

export interface EdenSeparatedTruthClass {
  semanticState: SemanticState | 'undeclared' | 'clinician-rejected'
  eventCount: number
}

export interface EdenLongitudinalInsight {
  access: EdenLongitudinalAccess
  accessMessage: string
  subjectId: string
  generatedAt: string
  depth: EdenDisclosureDepth
  cognitivePlan: CognitiveTranslationPlan
  changes: EdenLongitudinalChange[]
  headline: string
  whyItMatters: string
  unknowns: string[]
  separated: EdenSeparatedTruthClass[]
  clinicianReviewedRecordCount: number
  governance: {
    pendingClinicalReview: number
    blockedByConsent: number
    blockedByTruthClass: number
    /** Canonical body-surface records in the trend candidate lane that fail the observation/review gate. */
    nonObservationTrendInputs: number
    autonomousClinicalCommitAllowed: false
  }
  boundaries: {
    canonicalStateReused: true
    independentPatientStoreCreated: false
    consentBroadened: false
    simulationsUsedAsObservations: false
    diagnosesGenerated: false
    treatmentChangesRecommended: false
  }
}

function cognitivePlan(depth: EdenDisclosureDepth) {
  if (depth === 'explore') {
    return planCognitiveTranslation({ audience: 'public', intent: 'why', requestedDepth: 'mechanism' })
  }
  if (depth === 'deep') {
    return planCognitiveTranslation({ audience: 'public', intent: 'zoom', requestedDepth: 'quantitative' })
  }
  return planCognitiveTranslation({ audience: 'public', intent: 'see', requestedDepth: 'orientation' })
}

function emptyInsight(
  source: EdenLongitudinalInsightSource,
  at: string,
  depth: EdenDisclosureDepth,
  access: EdenLongitudinalAccess,
  accessMessage: string,
): EdenLongitudinalInsight {
  return {
    access,
    accessMessage,
    subjectId: source.patientId.trim(),
    generatedAt: at,
    depth,
    cognitivePlan: cognitivePlan(depth),
    changes: [],
    headline: accessMessage,
    whyItMatters: 'No physiological interpretation is made without an authorized observation.',
    unknowns: [accessMessage],
    separated: [],
    clinicianReviewedRecordCount: 0,
    governance: {
      pendingClinicalReview: 0,
      blockedByConsent: 0,
      blockedByTruthClass: 0,
      nonObservationTrendInputs: 0,
      autonomousClinicalCommitAllowed: false,
    },
    boundaries: {
      canonicalStateReused: true,
      independentPatientStoreCreated: false,
      consentBroadened: false,
      simulationsUsedAsObservations: false,
      diagnosesGenerated: false,
      treatmentChangesRecommended: false,
    },
  }
}

function filterState(
  state: LongitudinalPatientState,
  include: (event: LongitudinalEvent) => boolean,
): LongitudinalPatientState {
  const eventsById = Object.fromEntries(
    Object.entries(state.eventsById).filter(([, event]) => include(event)),
  )
  return {
    ...state,
    eventsById,
    metricEventIds: Object.fromEntries(
      Object.entries(state.metricEventIds).map(([metric, ids]) => [
        metric,
        ids.filter((id) => Boolean(eventsById[id])),
      ]),
    ),
  }
}

function hasObservationTruthClass(event: LongitudinalEvent) {
  return event.semanticState === undefined || OBSERVATION_STATES.has(event.semanticState)
}

function isObservation(event: LongitudinalEvent) {
  // A clinician rejection is an explicit decision to withhold the value, including
  // from descriptive trends; it is not merely a review label on a measured fact.
  return hasObservationTruthClass(event) && event.review.state !== 'rejected'
}

function visibleEventCount(
  state: LongitudinalPatientState,
  at: string,
  include: (event: LongitudinalEvent) => boolean,
) {
  const projection = projectStateToSurface(filterState(state, include), 'your-body', at)
  return projection.metrics.reduce((sum, snapshot) => sum + snapshot.eventCount, 0)
}

function observationLabel(semanticState: SemanticState | undefined) {
  const labels: Partial<Record<SemanticState, string>> = {
    measured: 'Measured record',
    imported: 'Imported record',
    'clinician-entered': 'Clinician-entered record',
    'patient-reported': 'Patient-reported record',
    'clinician-reviewed': 'Clinician-reviewed record',
  }
  return semanticState ? labels[semanticState] ?? 'Recorded observation' : 'Recorded value · truth class undeclared'
}

function referenceFor(metric: string): EdenPhysiologyReference | null {
  const context = PHYSIOLOGY_CONTEXTS.find((candidate) => candidate.metrics.includes(metric))
  if (!context) return null
  const { metrics: _metrics, ...reference } = context
  return reference
}

function directionLabel(direction: NumericTrend['direction']) {
  return direction === 'rising' ? 'rising' : direction === 'falling' ? 'falling' : 'broadly stable'
}

function sortChanges(left: EdenLongitudinalChange, right: EdenLongitudinalChange) {
  const leftRank = left.trend?.relativeDelta == null ? -1 : Math.abs(left.trend.relativeDelta)
  const rightRank = right.trend?.relativeDelta == null ? -1 : Math.abs(right.trend.relativeDelta)
  return rightRank - leftRank || Date.parse(right.recordedAt) - Date.parse(left.recordedAt) || left.metric.localeCompare(right.metric)
}

/**
 * Read-only patient-education projection over the canonical longitudinal state.
 * It never adds consent, never writes state, and never turns a simulation or
 * undeclared legacy value into a labelled measurement. Trends are inferred
 * display patterns over admitted numeric observations, not clinical thresholds.
 */
export function deriveEdenLongitudinalInsight(input: {
  source: EdenLongitudinalInsightSource
  at: string
  depth: EdenDisclosureDepth
  limit?: number
}): EdenLongitudinalInsight {
  const { source, at, depth } = input
  const patientId = source.patientId.trim()
  if (!patientId) throw new Error('patientId is required')
  if (!Number.isFinite(Date.parse(at))) throw new Error('at must be a valid timestamp')

  if (source.viewerRole !== 'pasien') {
    return emptyInsight(source, at, depth, 'patient-view-required', 'Personal longitudinal insights are available only in the patient’s own view; no observations are joined to this episode.')
  }
  if (!source.accountPatientId || source.accountPatientId !== patientId) {
    return emptyInsight(source, at, depth, 'identity-mismatch', 'The signed-in patient and active episode do not match, so no longitudinal observations are shown.')
  }
  if (!source.state) {
    return emptyInsight(source, at, depth, 'no-state', 'No canonical longitudinal state is available for this patient yet.')
  }
  if (source.state.subjectId !== patientId) {
    return emptyInsight(source, at, depth, 'identity-mismatch', 'The longitudinal subject does not match the active episode, so no observations are shown.')
  }

  // Additional restriction before the canonical projection: inferred, simulated,
  // draft, reference, stale, and unknown events cannot contaminate observation trends.
  const observationState = filterState(source.state, isObservation)
  const projection = projectStateToSurface(observationState, 'your-body', at)
  const packet = buildContextPacket(observationState, 'your-body', at)
  const nonObservationTrendInputs = visibleEventCount(
    observationState,
    at,
    (event) => !isObservation(event),
  )
  const snapshots = new Map(projection.metrics.map((snapshot) => [snapshot.metric, snapshot]))

  const changes = packet.signals.flatMap((signal): EdenLongitudinalChange[] => {
    if (typeof signal.value !== 'number' || !Number.isFinite(signal.value)) return []
    const snapshot = snapshots.get(signal.metric)
    if (!snapshot) return []
    const reference = referenceFor(signal.metric)
    const limitations = [
      'A direction is a descriptive pattern, not a clinical threshold, cause, or diagnosis.',
      ...(reference ? [reference.limitation] : ['No curated physiological explanation is available for this metric; its clinical meaning remains unknown here.']),
    ]
    if (snapshot.eventCount < 2) {
      limitations.push('Only one authorized observation is available, so change over time is unknown.')
    } else if (!signal.trend) {
      limitations.push('Earlier values are not all numerically comparable; mixed units or non-numeric history prevent a trend.')
    }
    if (signal.trend?.relativeDelta == null && signal.trend) {
      limitations.push('Relative change is withheld because the first value is near zero; absolute change remains inspectable.')
    }
    if (snapshot.latest.semanticState === undefined) {
      limitations.push('This legacy record has no declared truth class and is not relabelled as measured.')
    }

    return [{
      metric: signal.metric,
      label: labelMetrik(signal.metric, source.labels),
      domain: signal.domain,
      latestValue: signal.value,
      unit: signal.unit,
      recordedAt: signal.recordedAt,
      eventCount: snapshot.eventCount,
      semanticState: snapshot.latest.semanticState,
      observationLabel: observationLabel(snapshot.latest.semanticState),
      sourceLabel: asal(signal.provenance.method, signal.provenance.sourceKind, 'pasien'),
      provenance: { ...signal.provenance },
      confidence: signal.confidence,
      review: { ...snapshot.latest.review },
      trend: signal.trend ? { ...signal.trend } : null,
      whyItMatters: reference?.claim ?? 'This is a pattern within your own records. It can help frame a better conversation, but it does not explain the cause or establish a diagnosis.',
      reference,
      limitations,
    }]
  }).sort(sortChanges).slice(0, Math.max(1, Math.min(5, input.limit ?? 3)))

  const separated = SEPARATED_STATES.flatMap((semanticState): EdenSeparatedTruthClass[] => {
    const eventCount = visibleEventCount(source.state!, at, (event) => event.semanticState === semanticState)
    return eventCount > 0 ? [{ semanticState, eventCount }] : []
  })
  const undeclaredEventCount = visibleEventCount(
    source.state,
    at,
    (event) => event.semanticState === undefined && event.review.state !== 'rejected',
  )
  if (undeclaredEventCount > 0) separated.push({ semanticState: 'undeclared', eventCount: undeclaredEventCount })
  const clinicianRejectedRecordCount = visibleEventCount(
    source.state,
    at,
    (event) => hasObservationTruthClass(event) && event.review.state === 'rejected',
  )
  if (clinicianRejectedRecordCount > 0) {
    separated.push({ semanticState: 'clinician-rejected', eventCount: clinicianRejectedRecordCount })
  }

  const clinicianReviewedRecordCount = visibleEventCount(
    source.state,
    at,
    (event) => event.semanticState === 'clinician-reviewed',
  )
  const first = changes[0]
  const headline = first
    ? first.trend
      ? `${first.label}: a ${directionLabel(first.trend.direction)} inferred pattern across ${first.trend.sampleCount} authorized observations.`
      : `${first.label} is recorded, but there is not enough compatible history to describe change.`
    : 'No authorized numeric observations are available for this personal view.'

  const unknowns = [
    ...changes.flatMap((change) => change.limitations.slice(1)),
    ...(projection.blockedByConsent > 0 ? [`${projection.blockedByConsent} metric group(s) remain hidden by consent boundaries.`] : []),
    ...(projection.blockedByTruthClass > 0 ? [`${projection.blockedByTruthClass} metric group(s) remain hidden because event provenance, timing, or governance is invalid.`] : []),
    ...(projection.pendingClinicalReview > 0 ? [`${projection.pendingClinicalReview} metric group(s) await required clinical review.`] : []),
    ...(clinicianRejectedRecordCount > 0 ? [`${clinicianRejectedRecordCount} clinician-rejected record(s) remain visible only as a separated review state and are excluded from values and trends.`] : []),
    ...(separated.some((item) => item.semanticState === 'undeclared') ? ['Some legacy records have no declared truth class and are not called measured.'] : []),
    ...(clinicianReviewedRecordCount === 0 ? ['No clinician-reviewed conclusion is inferred from this view.'] : []),
  ]

  return {
    access: 'ready',
    accessMessage: 'Canonical personal observations joined by exact patient identity.',
    subjectId: patientId,
    generatedAt: at,
    depth,
    cognitivePlan: cognitivePlan(depth),
    changes,
    headline,
    whyItMatters: first?.whyItMatters ?? 'Without an authorized observation, physiology and molecular context remain general education rather than a personal interpretation.',
    unknowns: [...new Set(unknowns)],
    separated,
    clinicianReviewedRecordCount,
    governance: {
      pendingClinicalReview: packet.governance.pendingClinicalReview,
      blockedByConsent: packet.governance.blockedByConsent,
      blockedByTruthClass: packet.governance.blockedByTruthClass,
      nonObservationTrendInputs,
      autonomousClinicalCommitAllowed: false,
    },
    boundaries: {
      canonicalStateReused: true,
      independentPatientStoreCreated: false,
      consentBroadened: false,
      simulationsUsedAsObservations: false,
      diagnosesGenerated: false,
      treatmentChangesRecommended: false,
    },
  }
}

export function formatEdenInsightValue(value: number, unit?: string) {
  return `${angka(value)}${unit ? ` ${unit}` : ''}`
}

export function formatEdenInsightDelta(trend: NumericTrend) {
  const absolute = `${trend.absoluteDelta > 0 ? '+' : ''}${angka(trend.absoluteDelta)}${trend.unit ? ` ${trend.unit}` : ''}`
  if (trend.relativeDelta == null) return `${absolute} · relative change unknown`
  const relative = `${trend.relativeDelta > 0 ? '+' : ''}${angka(trend.relativeDelta * 100)}%`
  return `${absolute} · ${relative}`
}
