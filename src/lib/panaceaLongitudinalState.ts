export type PanaceaSurface = 'your-body' | 'clinical' | 'for-you' | 'ai-emr' | 'ai-chatbot'

export type LongitudinalDomain =
  | 'vital'
  | 'activity'
  | 'sleep'
  | 'recovery'
  | 'longevity'
  | 'readiness'
  | 'fitness'
  | 'nutrition'
  | 'lab'
  | 'symptom'
  | 'medication'
  | 'clinical-note'
  | 'device'
  | 'intent'
  | 'other'

export type ReviewState = 'not-required' | 'pending' | 'accepted' | 'rejected'
export type ConsentPurpose = 'personal-visualization' | 'clinical-support' | 'ai-context' | 'research-export' | 'rehab-tracking'

export interface LongitudinalProvenance {
  sourceKind: 'manual' | 'wearable' | 'clinical-system' | 'device' | 'derived' | 'import'
  sourceId: string
  capturedAt: string
  receivedAt: string
  method?: string
  version?: string
}

export interface ConsentEnvelope {
  granted: boolean
  purposes: readonly ConsentPurpose[]
  grantedAt: string
  expiresAt?: string
  revokedAt?: string
}

export interface ClinicianReviewEnvelope {
  state: ReviewState
  reviewerId?: string
  reviewedAt?: string
  note?: string
}

export interface LongitudinalEvent<T = unknown> {
  id: string
  subjectId: string
  domain: LongitudinalDomain
  metric: string
  value: T
  unit?: string
  recordedAt: string
  confidence: number
  provenance: LongitudinalProvenance
  consent: ConsentEnvelope
  review: ClinicianReviewEnvelope
  tags?: readonly string[]
}

export interface LongitudinalMetricSnapshot<T = unknown> {
  metric: string
  domain: LongitudinalDomain
  latest: LongitudinalEvent<T>
  previous?: LongitudinalEvent<T>
  eventCount: number
}

export interface NumericTrend {
  metric: string
  unit?: string
  sampleCount: number
  firstRecordedAt: string
  lastRecordedAt: string
  slopePerDay: number
  absoluteDelta: number
  relativeDelta: number | null
  direction: 'rising' | 'stable' | 'falling'
}

export interface SurfaceProjection {
  surface: PanaceaSurface
  subjectId: string
  generatedAt: string
  metrics: readonly LongitudinalMetricSnapshot[]
  pendingClinicalReview: number
  blockedByConsent: number
}

export interface LongitudinalPatientState {
  subjectId: string
  revision: number
  updatedAt: string
  eventsById: Readonly<Record<string, LongitudinalEvent>>
  metricEventIds: Readonly<Record<string, readonly string[]>>
}

export interface IngestResult {
  state: LongitudinalPatientState
  status: 'inserted' | 'duplicate'
}

export interface PublishResult {
  delivered: number
  rejected: number
}

export type LongitudinalSubscriber = (event: LongitudinalEvent) => void

const DOMAIN_BY_SURFACE: Readonly<Record<PanaceaSurface, readonly LongitudinalDomain[]>> = {
  'your-body': ['vital', 'activity', 'sleep', 'recovery', 'longevity', 'readiness', 'fitness', 'nutrition', 'device', 'intent'],
  clinical: ['vital', 'lab', 'symptom', 'medication', 'clinical-note', 'device', 'intent', 'other'],
  'for-you': ['activity', 'sleep', 'recovery', 'readiness', 'fitness', 'nutrition', 'other'],
  'ai-emr': ['vital', 'lab', 'symptom', 'medication', 'clinical-note', 'device', 'intent', 'other'],
  'ai-chatbot': ['vital', 'activity', 'sleep', 'recovery', 'longevity', 'readiness', 'fitness', 'nutrition', 'lab', 'symptom', 'medication', 'clinical-note', 'device', 'intent', 'other'],
}

const CLINICIAN_REVIEW_DOMAINS = new Set<LongitudinalDomain>(['lab', 'symptom', 'medication', 'clinical-note', 'intent'])
const DAY_MS = 86_400_000
const NUMERIC_EPSILON = 1e-9

function parseIso(value: string, field: string) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid ISO timestamp`)
  return timestamp
}

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

function uniqueNonBlank(values: readonly string[] = []) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function normalizedPurposeList(purposes: readonly ConsentPurpose[]) {
  return [...new Set(purposes)]
}

function cloneEvent<T>(event: LongitudinalEvent<T>): LongitudinalEvent<T> {
  return {
    ...event,
    metric: event.metric.trim(),
    subjectId: event.subjectId.trim(),
    provenance: { ...event.provenance, sourceId: event.provenance.sourceId.trim() },
    consent: { ...event.consent, purposes: normalizedPurposeList(event.consent.purposes) },
    review: { ...event.review },
    tags: uniqueNonBlank(event.tags),
  }
}

/**
 * Fail-closed validation shared by all ingestion paths.
 * This validates transport/governance shape only; it does not establish that a
 * measurement is clinically correct, diagnostic, or appropriate for treatment.
 */
export function validateLongitudinalEvent(event: LongitudinalEvent) {
  assertNonBlank(event.id, 'event.id')
  assertNonBlank(event.subjectId, 'event.subjectId')
  assertNonBlank(event.metric, 'event.metric')
  assertNonBlank(event.provenance.sourceId, 'event.provenance.sourceId')

  if (!Number.isFinite(event.confidence) || event.confidence < 0 || event.confidence > 1) {
    throw new Error('event.confidence must be a finite value in [0, 1]')
  }

  const recordedAt = parseIso(event.recordedAt, 'event.recordedAt')
  const capturedAt = parseIso(event.provenance.capturedAt, 'event.provenance.capturedAt')
  const receivedAt = parseIso(event.provenance.receivedAt, 'event.provenance.receivedAt')
  const grantedAt = parseIso(event.consent.grantedAt, 'event.consent.grantedAt')

  if (capturedAt > receivedAt) throw new Error('provenance.capturedAt must not be after provenance.receivedAt')
  if (recordedAt > receivedAt + 5 * 60_000) throw new Error('event.recordedAt is implausibly after provenance.receivedAt')

  if (event.consent.expiresAt && parseIso(event.consent.expiresAt, 'event.consent.expiresAt') <= grantedAt) {
    throw new Error('consent.expiresAt must be after consent.grantedAt')
  }
  if (event.consent.revokedAt && parseIso(event.consent.revokedAt, 'event.consent.revokedAt') < grantedAt) {
    throw new Error('consent.revokedAt must not be before consent.grantedAt')
  }

  if (event.review.state === 'accepted' || event.review.state === 'rejected') {
    assertNonBlank(event.review.reviewerId ?? '', 'review.reviewerId')
    parseIso(event.review.reviewedAt ?? '', 'review.reviewedAt')
  }

  return true
}

export function createLongitudinalPatientState(subjectId: string, at = new Date().toISOString()): LongitudinalPatientState {
  assertNonBlank(subjectId, 'subjectId')
  parseIso(at, 'at')
  return {
    subjectId: subjectId.trim(),
    revision: 0,
    updatedAt: at,
    eventsById: {},
    metricEventIds: {},
  }
}

export function isConsentActive(consent: ConsentEnvelope, purpose: ConsentPurpose, at = Date.now()) {
  if (!consent.granted || !consent.purposes.includes(purpose)) return false
  const grantedAt = parseIso(consent.grantedAt, 'consent.grantedAt')
  if (at < grantedAt) return false
  if (consent.revokedAt && at >= parseIso(consent.revokedAt, 'consent.revokedAt')) return false
  if (consent.expiresAt && at >= parseIso(consent.expiresAt, 'consent.expiresAt')) return false
  return true
}

export function requiresClinicianReview(event: LongitudinalEvent) {
  return CLINICIAN_REVIEW_DOMAINS.has(event.domain)
}

export function canEnterClinicalRecord(event: LongitudinalEvent, at = Date.now()) {
  if (!isConsentActive(event.consent, 'clinical-support', at)) return false
  if (!requiresClinicianReview(event)) return true
  return event.review.state === 'accepted'
}

export function canEnterAiContext(event: LongitudinalEvent, at = Date.now()) {
  if (!isConsentActive(event.consent, 'ai-context', at)) return false
  if (event.review.state === 'rejected') return false
  return true
}

export function ingestLongitudinalEvent(
  current: LongitudinalPatientState,
  incoming: LongitudinalEvent,
): IngestResult {
  validateLongitudinalEvent(incoming)
  if (incoming.subjectId.trim() !== current.subjectId) throw new Error('event.subjectId does not match state.subjectId')

  if (current.eventsById[incoming.id]) return { state: current, status: 'duplicate' }

  const event = cloneEvent(incoming)
  const eventsById: Record<string, LongitudinalEvent> = { ...current.eventsById, [event.id]: event }
  const metricEventIds: Record<string, readonly string[]> = { ...current.metricEventIds }
  const existingIds = current.metricEventIds[event.metric] ?? []
  metricEventIds[event.metric] = [...existingIds, event.id].sort((leftId, rightId) => {
    const left = eventsById[leftId]
    const right = eventsById[rightId]
    return Date.parse(left.recordedAt) - Date.parse(right.recordedAt) || left.id.localeCompare(right.id)
  })

  return {
    status: 'inserted',
    state: {
      subjectId: current.subjectId,
      revision: current.revision + 1,
      updatedAt: event.provenance.receivedAt,
      eventsById,
      metricEventIds,
    },
  }
}

export function ingestLongitudinalBatch(
  current: LongitudinalPatientState,
  events: readonly LongitudinalEvent[],
) {
  return events.reduce((state, event) => ingestLongitudinalEvent(state, event).state, current)
}

export function eventsForMetric(state: LongitudinalPatientState, metric: string) {
  const ids = state.metricEventIds[metric.trim()] ?? []
  return ids.map((id) => state.eventsById[id]).filter((event): event is LongitudinalEvent => Boolean(event))
}

export function metricSnapshot(state: LongitudinalPatientState, metric: string): LongitudinalMetricSnapshot | null {
  const events = eventsForMetric(state, metric)
  const latest = events[events.length - 1]
  if (!latest) return null
  return {
    metric: latest.metric,
    domain: latest.domain,
    latest,
    previous: events.length > 1 ? events[events.length - 2] : undefined,
    eventCount: events.length,
  }
}

/**
 * Ordinary least-squares trend over time.
 * Formula: b = Σ((x−x̄)(y−ȳ)) / Σ((x−x̄)^2), with x measured in days.
 * Direction is a display classification only; it is not a clinical threshold.
 */
export function numericMetricTrend(
  state: LongitudinalPatientState,
  metric: string,
  since?: string,
): NumericTrend | null {
  const sinceMs = since ? parseIso(since, 'since') : Number.NEGATIVE_INFINITY
  const events = eventsForMetric(state, metric).filter((event) => {
    return typeof event.value === 'number' && Number.isFinite(event.value) && Date.parse(event.recordedAt) >= sinceMs
  }) as LongitudinalEvent<number>[]

  if (events.length < 2) return null

  const firstTime = Date.parse(events[0].recordedAt)
  const points = events.map((event) => ({
    x: (Date.parse(event.recordedAt) - firstTime) / DAY_MS,
    y: event.value,
  }))
  const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length
  const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length
  const numerator = points.reduce((sum, point) => sum + (point.x - xMean) * (point.y - yMean), 0)
  const denominator = points.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0)
  const slopePerDay = denominator <= NUMERIC_EPSILON ? 0 : numerator / denominator
  const firstValue = events[0].value
  const lastValue = events[events.length - 1].value
  const absoluteDelta = lastValue - firstValue
  const relativeDelta = Math.abs(firstValue) <= NUMERIC_EPSILON ? null : absoluteDelta / Math.abs(firstValue)
  const displayScale = Math.max(Math.abs(yMean), 1)
  const normalizedSlope = slopePerDay / displayScale
  const direction: NumericTrend['direction'] = normalizedSlope > 0.001
    ? 'rising'
    : normalizedSlope < -0.001
      ? 'falling'
      : 'stable'

  return {
    metric: events[0].metric,
    unit: events[events.length - 1]?.unit,
    sampleCount: events.length,
    firstRecordedAt: events[0].recordedAt,
    lastRecordedAt: events[events.length - 1].recordedAt,
    slopePerDay,
    absoluteDelta,
    relativeDelta,
    direction,
  }
}

function consentPurposeForSurface(surface: PanaceaSurface): ConsentPurpose {
  if (surface === 'clinical' || surface === 'ai-emr') return 'clinical-support'
  if (surface === 'ai-chatbot') return 'ai-context'
  return 'personal-visualization'
}

export function projectStateToSurface(
  state: LongitudinalPatientState,
  surface: PanaceaSurface,
  at = new Date().toISOString(),
): SurfaceProjection {
  const atMs = parseIso(at, 'at')
  const domains = new Set(DOMAIN_BY_SURFACE[surface])
  const purpose = consentPurposeForSurface(surface)
  const snapshots: LongitudinalMetricSnapshot[] = []
  let blockedByConsent = 0
  let pendingClinicalReview = 0

  for (const metric of Object.keys(state.metricEventIds).sort()) {
    const snapshot = metricSnapshot(state, metric)
    if (!snapshot || !domains.has(snapshot.domain)) continue

    if (!isConsentActive(snapshot.latest.consent, purpose, atMs)) {
      blockedByConsent += 1
      continue
    }

    if ((surface === 'clinical' || surface === 'ai-emr') && requiresClinicianReview(snapshot.latest)) {
      if (snapshot.latest.review.state !== 'accepted') {
        pendingClinicalReview += 1
        continue
      }
    }

    if (surface === 'ai-chatbot' && snapshot.latest.review.state === 'rejected') continue
    snapshots.push(snapshot)
  }

  return {
    surface,
    subjectId: state.subjectId,
    generatedAt: at,
    metrics: snapshots,
    pendingClinicalReview,
    blockedByConsent,
  }
}

export function buildContextPacket(
  state: LongitudinalPatientState,
  surface: PanaceaSurface,
  at = new Date().toISOString(),
) {
  const projection = projectStateToSurface(state, surface, at)
  return {
    subjectId: projection.subjectId,
    surface,
    generatedAt: projection.generatedAt,
    stateRevision: state.revision,
    signals: projection.metrics.map((snapshot) => ({
      metric: snapshot.metric,
      domain: snapshot.domain,
      value: snapshot.latest.value,
      unit: snapshot.latest.unit,
      recordedAt: snapshot.latest.recordedAt,
      confidence: snapshot.latest.confidence,
      provenance: snapshot.latest.provenance,
      reviewState: snapshot.latest.review.state,
      trend: typeof snapshot.latest.value === 'number' ? numericMetricTrend(state, snapshot.metric) : null,
    })),
    governance: {
      pendingClinicalReview: projection.pendingClinicalReview,
      blockedByConsent: projection.blockedByConsent,
      autonomousClinicalCommitAllowed: false as const,
    },
  }
}

/**
 * Small in-memory event bus for near-real-time same-session orchestration.
 * Transport persistence, retries, authentication and cross-device delivery must
 * be supplied by the production backend rather than being implied here.
 */
export function createLongitudinalEventBus() {
  const subscribers = new Map<string, Set<LongitudinalSubscriber>>()

  function subscribe(topic: string, subscriber: LongitudinalSubscriber) {
    assertNonBlank(topic, 'topic')
    const key = topic.trim()
    const bucket = subscribers.get(key) ?? new Set<LongitudinalSubscriber>()
    bucket.add(subscriber)
    subscribers.set(key, bucket)
    return () => {
      const current = subscribers.get(key)
      current?.delete(subscriber)
      if (current?.size === 0) subscribers.delete(key)
    }
  }

  function publish(topic: string, event: LongitudinalEvent): PublishResult {
    validateLongitudinalEvent(event)
    assertNonBlank(topic, 'topic')
    const bucket = subscribers.get(topic.trim())
    if (!bucket?.size) return { delivered: 0, rejected: 0 }

    let delivered = 0
    let rejected = 0
    for (const subscriber of bucket) {
      try {
        subscriber(event)
        delivered += 1
      } catch {
        rejected += 1
      }
    }
    return { delivered, rejected }
  }

  function subscriberCount(topic?: string) {
    if (topic) return subscribers.get(topic.trim())?.size ?? 0
    return [...subscribers.values()].reduce((sum, bucket) => sum + bucket.size, 0)
  }

  return { subscribe, publish, subscriberCount }
}
