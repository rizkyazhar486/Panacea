import {
  isConsentActive,
  type ConsentEnvelope,
  type LongitudinalDomain,
  type LongitudinalEvent,
} from './panaceaLongitudinalState.ts'

/**
 * Panacea Visit Operating System
 *
 * One visit state coordinates:
 * - doctor/patient camera + microphone transport (WebRTC metadata only here);
 * - continuous medical-device observations;
 * - a live, explicitly uncommitted AI-EMR context;
 * - clinician-reviewed promotion of selected observations into the longitudinal record.
 *
 * Raw camera/audio payloads are intentionally outside this kernel. The existing
 * realtime service performs WebRTC signaling; this module only carries consent,
 * connection state and clinically relevant metadata. Device adapters must
 * normalize vendor payloads into the canonical metric + unit contract below.
 */

export type VisitPhase = 'consent-required' | 'ready' | 'live' | 'paused' | 'ended'
export type VisitMediaStatus = 'off' | 'connecting' | 'live' | 'degraded'
export type VisitDeviceConnectionStatus = 'registered' | 'connecting' | 'live' | 'degraded' | 'offline'
export type VisitDeviceTransport =
  | 'bluetooth-le'
  | 'usb'
  | 'local-network'
  | 'vendor-cloud'
  | 'fhir'
  | 'manual-bridge'

export type VisitDeviceClass =
  | 'vital-signs-monitor'
  | 'pulse-oximeter'
  | 'blood-pressure-monitor'
  | 'thermometer'
  | 'ecg'
  | 'glucose-meter'
  | 'spirometer'
  | 'weight-scale'
  | 'other'

export type DeviceEvidenceClass = 'unknown' | 'consumer' | 'clinical'

export const VISIT_DEVICE_METRICS = {
  'heart-rate': { unit: 'bpm', domain: 'vital' as const },
  spo2: { unit: '%', domain: 'vital' as const },
  'respiratory-rate': { unit: '/min', domain: 'vital' as const },
  'blood-pressure-systolic': { unit: 'mmHg', domain: 'vital' as const },
  'blood-pressure-diastolic': { unit: 'mmHg', domain: 'vital' as const },
  temperature: { unit: '°C', domain: 'vital' as const },
  glucose: { unit: 'mg/dL', domain: 'vital' as const },
  weight: { unit: 'kg', domain: 'device' as const },
  'ecg-heart-rate': { unit: 'bpm', domain: 'device' as const },
  'peak-expiratory-flow': { unit: 'L/min', domain: 'device' as const },
} as const

export type VisitDeviceMetric = keyof typeof VISIT_DEVICE_METRICS

export interface VisitMediaConsent {
  camera: boolean
  microphone: boolean
  ambientAi: boolean
  acknowledgedAt: string
}

export interface VisitConsent {
  clinicalData: ConsentEnvelope
  media: VisitMediaConsent
}

export interface VisitDeviceDescriptor {
  id: string
  label: string
  deviceClass: VisitDeviceClass
  evidenceClass: DeviceEvidenceClass
  transport: VisitDeviceTransport
  manufacturer?: string
  model?: string
  firmwareVersion?: string
  supports: readonly VisitDeviceMetric[]
}

export interface VisitDeviceConnection extends VisitDeviceDescriptor {
  status: VisitDeviceConnectionStatus
  registeredAt: string
  lastSeenAt?: string
}

export interface VisitDeviceObservation {
  id: string
  visitId: string
  subjectId: string
  deviceId: string
  metric: VisitDeviceMetric
  value: number
  unit: string
  capturedAt: string
  receivedAt: string
  signalQuality: number | null
  standardCode?: {
    system: 'loinc' | 'ieee-11073' | 'vendor'
    code: string
  }
}

export interface VisitMediaState {
  transport: 'webrtc'
  camera: VisitMediaStatus
  microphone: VisitMediaStatus
  peerCount: number
  rawMediaPersisted: false
  recording: 'disabled'
  ambientAi: 'disabled' | 'consented'
}

export interface VisitOperatingState {
  visitId: string
  subjectId: string
  clinicianId: string
  scheduledAt?: string
  startedAt?: string
  endedAt?: string
  phase: VisitPhase
  consent: VisitConsent
  media: VisitMediaState
  devices: Readonly<Record<string, VisitDeviceConnection>>
  latestByMetric: Readonly<Partial<Record<VisitDeviceMetric, VisitDeviceObservation>>>
  sampleCountByMetric: Readonly<Partial<Record<VisitDeviceMetric, number>>>
  seenSampleIds: Readonly<Record<string, true>>
  quarantinedSampleCount: number
}

export interface CreateVisitOperatingSessionInput {
  visitId: string
  subjectId: string
  clinicianId: string
  consent: VisitConsent
  createdAt: string
  scheduledAt?: string
}

export type VisitSampleDropReason =
  | 'visit-not-running'
  | 'subject-mismatch'
  | 'visit-mismatch'
  | 'unknown-device'
  | 'device-not-streaming'
  | 'unsupported-metric'
  | 'unit-mismatch'
  | 'invalid-value'
  | 'invalid-time'
  | 'stale-on-arrival'
  | 'low-signal-quality'
  | 'duplicate'
  | 'clinical-consent-inactive'

export interface VisitSampleIngestResult {
  state: VisitOperatingState
  accepted: boolean
  reason?: VisitSampleDropReason
}

export type VisitFreshness = 'fresh' | 'delayed' | 'stale'

export interface VisitObservationContext {
  metric: VisitDeviceMetric
  value: number
  unit: string
  capturedAt: string
  receivedAt: string
  deviceId: string
  signalQuality: number | null
  freshness: VisitFreshness
  ageMs: number
}

export interface AiEmrVisitContext {
  visitId: string
  subjectId: string
  clinicianId: string
  phase: VisitPhase
  generatedAt: string
  media: VisitMediaState
  connectedDevices: Array<{
    id: string
    label: string
    deviceClass: VisitDeviceClass
    evidenceClass: DeviceEvidenceClass
    status: VisitDeviceConnectionStatus
    lastSeenAt?: string
  }>
  observations: VisitObservationContext[]
  governance: {
    liveDeviceDataIsPermanentRecord: false
    selectedObservationRequiresClinicianPromotion: true
    rawMediaPersisted: false
    autonomousDiagnosisAllowed: false
    autonomousTreatmentAllowed: false
  }
}

const LIVE_ARRIVAL_MAX_MS = 5 * 60_000
const FRESH_MS = 30_000
const DELAYED_MS = 2 * 60_000

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} must not be blank`)
}

function parseIso(value: string, field: string) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid ISO timestamp`)
  return parsed
}

function assertQuality(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error('signalQuality must be a finite value in [0, 1]')
  }
}

function consentReady(consent: VisitConsent, at: number) {
  const clinical = isConsentActive(consent.clinicalData, 'clinical-support', at)
  const media = consent.media.camera || consent.media.microphone
  return clinical && media
}

function canonicalMetric(metric: VisitDeviceMetric) {
  return VISIT_DEVICE_METRICS[metric]
}

function cloneState(state: VisitOperatingState): VisitOperatingState {
  return {
    ...state,
    consent: {
      clinicalData: {
        ...state.consent.clinicalData,
        purposes: [...state.consent.clinicalData.purposes],
      },
      media: { ...state.consent.media },
    },
    media: { ...state.media },
    devices: { ...state.devices },
    latestByMetric: { ...state.latestByMetric },
    sampleCountByMetric: { ...state.sampleCountByMetric },
    seenSampleIds: { ...state.seenSampleIds },
  }
}

export function createVisitOperatingSession(
  input: CreateVisitOperatingSessionInput,
): VisitOperatingState {
  assertNonBlank(input.visitId, 'visitId')
  assertNonBlank(input.subjectId, 'subjectId')
  assertNonBlank(input.clinicianId, 'clinicianId')
  const createdMs = parseIso(input.createdAt, 'createdAt')
  parseIso(input.consent.media.acknowledgedAt, 'consent.media.acknowledgedAt')
  if (input.scheduledAt) parseIso(input.scheduledAt, 'scheduledAt')

  return {
    visitId: input.visitId.trim(),
    subjectId: input.subjectId.trim(),
    clinicianId: input.clinicianId.trim(),
    scheduledAt: input.scheduledAt,
    phase: consentReady(input.consent, createdMs) ? 'ready' : 'consent-required',
    consent: {
      clinicalData: {
        ...input.consent.clinicalData,
        purposes: [...input.consent.clinicalData.purposes],
      },
      media: { ...input.consent.media },
    },
    media: {
      transport: 'webrtc',
      camera: 'off',
      microphone: 'off',
      peerCount: 0,
      rawMediaPersisted: false,
      recording: 'disabled',
      ambientAi: input.consent.media.ambientAi ? 'consented' : 'disabled',
    },
    devices: {},
    latestByMetric: {},
    sampleCountByMetric: {},
    seenSampleIds: {},
    quarantinedSampleCount: 0,
  }
}

export function startVisit(state: VisitOperatingState, startedAt: string): VisitOperatingState {
  const startedMs = parseIso(startedAt, 'startedAt')
  if (state.phase === 'ended') throw new Error('ended visit cannot be restarted')
  if (!consentReady(state.consent, startedMs)) throw new Error('active clinical + media consent is required')
  return {
    ...cloneState(state),
    phase: 'live',
    startedAt,
  }
}

export function pauseVisit(state: VisitOperatingState): VisitOperatingState {
  if (state.phase !== 'live') throw new Error('only a live visit can be paused')
  return { ...cloneState(state), phase: 'paused' }
}

export function resumeVisit(state: VisitOperatingState, at: string): VisitOperatingState {
  const atMs = parseIso(at, 'at')
  if (state.phase !== 'paused') throw new Error('only a paused visit can resume')
  if (!consentReady(state.consent, atMs)) throw new Error('active clinical + media consent is required')
  return { ...cloneState(state), phase: 'live' }
}

export function endVisit(state: VisitOperatingState, endedAt: string): VisitOperatingState {
  parseIso(endedAt, 'endedAt')
  if (state.phase === 'ended') return state
  return {
    ...cloneState(state),
    phase: 'ended',
    endedAt,
    media: {
      ...state.media,
      camera: 'off',
      microphone: 'off',
      peerCount: 0,
    },
    devices: Object.fromEntries(
      Object.entries(state.devices).map(([id, device]) => [id, { ...device, status: 'offline' as const }]),
    ),
  }
}

export function updateVisitMedia(
  state: VisitOperatingState,
  patch: Partial<Pick<VisitMediaState, 'camera' | 'microphone' | 'peerCount'>>,
): VisitOperatingState {
  if (state.phase !== 'live' && state.phase !== 'paused') {
    throw new Error('media can only change during a live or paused visit')
  }
  if (patch.camera && patch.camera !== 'off' && !state.consent.media.camera) {
    throw new Error('camera consent is not granted')
  }
  if (patch.microphone && patch.microphone !== 'off' && !state.consent.media.microphone) {
    throw new Error('microphone consent is not granted')
  }
  if (patch.peerCount != null && (!Number.isInteger(patch.peerCount) || patch.peerCount < 0)) {
    throw new Error('peerCount must be a non-negative integer')
  }
  return {
    ...cloneState(state),
    media: { ...state.media, ...patch },
  }
}

export function registerMedicalDevice(
  state: VisitOperatingState,
  device: VisitDeviceDescriptor,
  registeredAt: string,
): VisitOperatingState {
  assertNonBlank(device.id, 'device.id')
  assertNonBlank(device.label, 'device.label')
  parseIso(registeredAt, 'registeredAt')
  if (state.phase === 'ended') throw new Error('cannot register a device after the visit ended')
  if (device.supports.length === 0) throw new Error('device.supports must not be empty')
  for (const metric of device.supports) canonicalMetric(metric)

  return {
    ...cloneState(state),
    devices: {
      ...state.devices,
      [device.id]: {
        ...device,
        supports: [...new Set(device.supports)],
        status: 'registered',
        registeredAt,
      },
    },
  }
}

export function setMedicalDeviceConnection(
  state: VisitOperatingState,
  deviceId: string,
  status: VisitDeviceConnectionStatus,
  at: string,
): VisitOperatingState {
  parseIso(at, 'at')
  const device = state.devices[deviceId]
  if (!device) throw new Error('unknown medical device')
  if (state.phase === 'ended' && status !== 'offline') {
    throw new Error('ended visit devices must remain offline')
  }
  return {
    ...cloneState(state),
    devices: {
      ...state.devices,
      [deviceId]: {
        ...device,
        status,
        lastSeenAt: status === 'live' || status === 'degraded' ? at : device.lastSeenAt,
      },
    },
  }
}

function quarantine(state: VisitOperatingState, reason: VisitSampleDropReason): VisitSampleIngestResult {
  return {
    state: {
      ...cloneState(state),
      quarantinedSampleCount: state.quarantinedSampleCount + 1,
    },
    accepted: false,
    reason,
  }
}

/**
 * Ingest one already-normalized device reading into the live visit context.
 *
 * This does NOT commit the reading to AI-EMR. Continuous streams are ephemeral
 * until a clinician explicitly promotes a selected observation via
 * promoteObservationToClinicalRecord(). This prevents noisy/duplicated sensor
 * traffic from silently becoming a signed medical record.
 */
export function ingestVisitDeviceObservation(
  state: VisitOperatingState,
  sample: VisitDeviceObservation,
): VisitSampleIngestResult {
  if (state.phase !== 'live' && state.phase !== 'paused') return quarantine(state, 'visit-not-running')
  if (sample.subjectId !== state.subjectId) return quarantine(state, 'subject-mismatch')
  if (sample.visitId !== state.visitId) return quarantine(state, 'visit-mismatch')
  if (state.seenSampleIds[sample.id]) return { state, accepted: false, reason: 'duplicate' }

  const device = state.devices[sample.deviceId]
  if (!device) return quarantine(state, 'unknown-device')
  if (device.status !== 'live' && device.status !== 'degraded') return quarantine(state, 'device-not-streaming')
  if (!device.supports.includes(sample.metric)) return quarantine(state, 'unsupported-metric')

  const definition = canonicalMetric(sample.metric)
  if (sample.unit !== definition.unit) return quarantine(state, 'unit-mismatch')
  if (!Number.isFinite(sample.value)) return quarantine(state, 'invalid-value')

  let capturedMs: number
  let receivedMs: number
  try {
    capturedMs = parseIso(sample.capturedAt, 'sample.capturedAt')
    receivedMs = parseIso(sample.receivedAt, 'sample.receivedAt')
    if (sample.signalQuality != null) assertQuality(sample.signalQuality)
  } catch {
    return quarantine(state, 'invalid-time')
  }
  if (capturedMs > receivedMs) return quarantine(state, 'invalid-time')
  if (receivedMs - capturedMs > LIVE_ARRIVAL_MAX_MS) return quarantine(state, 'stale-on-arrival')
  if (!isConsentActive(state.consent.clinicalData, 'clinical-support', receivedMs)) {
    return quarantine(state, 'clinical-consent-inactive')
  }
  if (sample.signalQuality != null && sample.signalQuality < 0.5) return quarantine(state, 'low-signal-quality')

  const next = cloneState(state)
  next.latestByMetric = {
    ...state.latestByMetric,
    [sample.metric]: { ...sample, standardCode: sample.standardCode ? { ...sample.standardCode } : undefined },
  }
  next.sampleCountByMetric = {
    ...state.sampleCountByMetric,
    [sample.metric]: (state.sampleCountByMetric[sample.metric] ?? 0) + 1,
  }
  next.seenSampleIds = { ...state.seenSampleIds, [sample.id]: true }
  next.devices = {
    ...state.devices,
    [sample.deviceId]: {
      ...device,
      lastSeenAt: sample.receivedAt,
      status: sample.signalQuality != null && sample.signalQuality < 0.75 ? 'degraded' : 'live',
    },
  }

  return { state: next, accepted: true }
}

/**
 * Freshness formula used by the command surface:
 * ageMs = max(0, now - receivedAt)
 *
 * <30 s = fresh, 30-120 s = delayed, >120 s = stale.
 * This is transport freshness only, never a clinical severity classification.
 */
export function visitObservationFreshness(receivedAt: string, now: string): {
  freshness: VisitFreshness
  ageMs: number
} {
  const receivedMs = parseIso(receivedAt, 'receivedAt')
  const nowMs = parseIso(now, 'now')
  const ageMs = Math.max(0, nowMs - receivedMs)
  return {
    ageMs,
    freshness: ageMs <= FRESH_MS ? 'fresh' : ageMs <= DELAYED_MS ? 'delayed' : 'stale',
  }
}

export function buildAiEmrVisitContext(
  state: VisitOperatingState,
  generatedAt: string,
): AiEmrVisitContext {
  parseIso(generatedAt, 'generatedAt')
  const observations = Object.values(state.latestByMetric)
    .filter((observation): observation is VisitDeviceObservation => Boolean(observation))
    .map((observation) => {
      const freshness = visitObservationFreshness(observation.receivedAt, generatedAt)
      return {
        metric: observation.metric,
        value: observation.value,
        unit: observation.unit,
        capturedAt: observation.capturedAt,
        receivedAt: observation.receivedAt,
        deviceId: observation.deviceId,
        signalQuality: observation.signalQuality,
        ...freshness,
      }
    })
    .sort((left, right) => left.metric.localeCompare(right.metric))

  return {
    visitId: state.visitId,
    subjectId: state.subjectId,
    clinicianId: state.clinicianId,
    phase: state.phase,
    generatedAt,
    media: { ...state.media },
    connectedDevices: Object.values(state.devices)
      .map((device) => ({
        id: device.id,
        label: device.label,
        deviceClass: device.deviceClass,
        evidenceClass: device.evidenceClass,
        status: device.status,
        lastSeenAt: device.lastSeenAt,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    observations,
    governance: {
      liveDeviceDataIsPermanentRecord: false,
      selectedObservationRequiresClinicianPromotion: true,
      rawMediaPersisted: false,
      autonomousDiagnosisAllowed: false,
      autonomousTreatmentAllowed: false,
    },
  }
}

function sourceMethod(device: VisitDeviceConnection, sample: VisitDeviceObservation) {
  const code = sample.standardCode ? `;${sample.standardCode.system}:${sample.standardCode.code}` : ''
  return `visit-os;${device.transport}${code}`
}

/**
 * Explicit human promotion boundary.
 *
 * Only the selected, clinician-reviewed reading becomes a longitudinal event
 * suitable for permanent clinical-record workflows. Continuous raw stream
 * traffic remains outside the permanent record.
 */
export function promoteObservationToClinicalRecord(
  state: VisitOperatingState,
  metric: VisitDeviceMetric,
  reviewerId: string,
  reviewedAt: string,
): LongitudinalEvent<number> {
  assertNonBlank(reviewerId, 'reviewerId')
  parseIso(reviewedAt, 'reviewedAt')
  const sample = state.latestByMetric[metric]
  if (!sample) throw new Error(`no live observation is available for ${metric}`)
  const device = state.devices[sample.deviceId]
  if (!device) throw new Error('observation device is no longer registered')

  const definition = canonicalMetric(metric)
  if (sample.signalQuality == null) {
    throw new Error('observation signal quality is unknown; promotion requires adapter-provided quality')
  }
  return {
    id: `visit:${state.visitId}:${sample.id}`,
    subjectId: state.subjectId,
    domain: definition.domain as LongitudinalDomain,
    metric,
    value: sample.value,
    unit: sample.unit,
    recordedAt: sample.capturedAt,
    confidence: sample.signalQuality,
    provenance: {
      sourceKind: 'device',
      sourceId: `visit-os:${sample.deviceId}`,
      capturedAt: sample.capturedAt,
      receivedAt: sample.receivedAt,
      method: sourceMethod(device, sample),
      version: device.firmwareVersion,
    },
    consent: {
      ...state.consent.clinicalData,
      purposes: [...state.consent.clinicalData.purposes],
    },
    review: {
      state: 'accepted',
      reviewerId: reviewerId.trim(),
      reviewedAt,
      note: `Promoted from live visit ${state.visitId}; continuous stream itself remains uncommitted.`,
    },
    tags: [
      'visit-os',
      'clinician-reviewed',
      `visit:${state.visitId}`,
      `device-class:${device.deviceClass}`,
      `evidence-class:${device.evidenceClass}`,
    ],
  }
}

export const VISIT_OS_BOUNDARY =
  'Camera/audio transport and continuous device readings provide live encounter context. Raw media is not persisted by this kernel, device streams are not silently written into the permanent AI-EMR, and no observation creates an autonomous diagnosis, treatment, prescription, order, procedure target, or emergency disposition.'
