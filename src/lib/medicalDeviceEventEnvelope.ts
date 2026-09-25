/**
 * Canonical non-scalar Medical Device Fabric event envelope.
 *
 * `visitDeviceAdapters.ts` / `visitOperatingSystem.ts` already normalize scalar
 * measurements (a single numeric value + unit) for Visit OS. Many real device
 * families never fit that shape: continuous waveforms, discrete alarms, setting
 * changes, therapy-delivery events, and pointers into imaging/report artifacts
 * that must stay inside the existing DICOM/report stack rather than being
 * flattened into scalar rows.
 *
 * This module is the shared contract for that non-scalar class, per
 * `DOCS/MEDICAL-DEVICE-FABRIC.md` implementation-sequence step 2. It also
 * implements the first slice of step 3's technical-QC gate — identity,
 * timestamp/clock-order, replay/dedupe, signal quality and sample-completeness
 * checks — because those checks are meaningless without this envelope shape.
 *
 * This module does not implement any vendor/model adapter and does not claim
 * device support. It also does not publish anything to the clinical record:
 * that remains the clinician-reviewed `visitFhirObservation.ts` boundary.
 */

import {
  MEDICAL_DEVICE_INTEGRATION_CATALOG,
  type MedicalDeviceDataShape,
  type MedicalDeviceInteropStandard,
} from './medicalDeviceIntegrationCatalog.ts'

export type MedicalDeviceEventKind =
  | 'waveform'
  | 'alarm'
  | 'setting'
  | 'therapy-delivery'
  | 'image-reference'
  | 'report-reference'
  | 'device-status'

/** Same truth-class discipline as `performanceTelemetryEnvelope.ts`, minus 'estimated': a device either measured, derived or relayed a non-scalar artifact. */
export type MedicalDeviceEventTruthClass = 'measured' | 'derived' | 'relayed'

export type MedicalDeviceAlarmSeverity = 'advisory' | 'low' | 'medium' | 'high' | 'crisis'
export type MedicalDeviceAlarmState = 'active' | 'acknowledged' | 'resolved'
export type MedicalDeviceReportStatus = 'preliminary' | 'final' | 'amended'
export type MedicalDeviceLiveness = 'live' | 'delayed' | 'stale'

const EVENT_KIND_TO_DATA_SHAPES: Readonly<Record<MedicalDeviceEventKind, readonly MedicalDeviceDataShape[]>> =
  Object.freeze({
    waveform: ['waveform'],
    alarm: ['alarm'],
    setting: ['setting'],
    'therapy-delivery': ['therapy-delivery'],
    'image-reference': ['image', 'volume', 'video'],
    'report-reference': ['report'],
    'device-status': ['device-status'],
  })

export interface MedicalDeviceEventBase {
  eventId: string
  visitId: string
  subjectId: string
  deviceId: string
  /** Must resolve in `MEDICAL_DEVICE_INTEGRATION_CATALOG`; ties this event to a declared device family. */
  profileId: string
  /** Must be one of that profile's declared preferred or fallback standards. */
  transport: MedicalDeviceInteropStandard
  capturedAt: string
  receivedAt: string
  /** Monotonic per (deviceId, kind); the basis for replay/dedupe protection. */
  sequence: number
  truthClass: MedicalDeviceEventTruthClass
}

export interface MedicalDeviceWaveformEvent extends MedicalDeviceEventBase {
  kind: 'waveform'
  channelLabel: string
  unit: string
  sampleRateHz: number
  samples: readonly number[]
  /** Wall-clock span this sample batch covers, in ms; basis for sample-completeness. */
  windowDurationMs: number
  signalQuality: number | null
}

export interface MedicalDeviceAlarmEvent extends MedicalDeviceEventBase {
  kind: 'alarm'
  alarmCode: string
  label: string
  severity: MedicalDeviceAlarmSeverity
  state: MedicalDeviceAlarmState
  relatedMetric?: string
}

export interface MedicalDeviceSettingEvent extends MedicalDeviceEventBase {
  kind: 'setting'
  settingName: string
  value: number | string | boolean
  unit?: string
  previousValue?: number | string | boolean
}

export interface MedicalDeviceTherapyDeliveryEvent extends MedicalDeviceEventBase {
  kind: 'therapy-delivery'
  therapyName: string
  amount: number
  unit: string
  rate?: number
  rateUnit?: string
  route?: string
}

export interface MedicalDeviceImageReferenceEvent extends MedicalDeviceEventBase {
  kind: 'image-reference'
  studyInstanceUid: string
  seriesInstanceUid?: string
  sopInstanceUid?: string
  modality: string
  /** Reference into the existing DICOM/DICOMweb path; this envelope never embeds pixel data. */
  retrieveUrl?: string
}

export interface MedicalDeviceReportReferenceEvent extends MedicalDeviceEventBase {
  kind: 'report-reference'
  reportId: string
  reportType: string
  status: MedicalDeviceReportStatus
  retrieveUrl?: string
}

export interface MedicalDeviceStatusEvent extends MedicalDeviceEventBase {
  kind: 'device-status'
  statusCode: string
  label: string
  connected: boolean
  batteryPercent?: number
}

export type MedicalDeviceEvent =
  | MedicalDeviceWaveformEvent
  | MedicalDeviceAlarmEvent
  | MedicalDeviceSettingEvent
  | MedicalDeviceTherapyDeliveryEvent
  | MedicalDeviceImageReferenceEvent
  | MedicalDeviceReportReferenceEvent
  | MedicalDeviceStatusEvent

export interface MedicalDeviceEventValidation {
  valid: boolean
  errors: readonly string[]
  ageMs: number | null
  transportDelayMs: number | null
  /** Percentage 0-100, only computed for waveform events with a positive window. */
  sampleCompletenessPercent: number | null
}

function nonBlank(value: unknown, field: string, errors: string[]) {
  if (typeof value !== 'string' || !value.trim()) errors.push(field)
}

function finite(value: unknown, field: string, errors: string[]) {
  if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(field)
}

/** `completeness = valid_samples / expected_samples × 100%`, capped at 100. */
export function computeWaveformSampleCompleteness(event: MedicalDeviceWaveformEvent): number | null {
  if (!Number.isFinite(event.windowDurationMs) || event.windowDurationMs <= 0) return null
  if (!Number.isFinite(event.sampleRateHz) || event.sampleRateHz <= 0) return null
  const expected = (event.windowDurationMs / 1000) * event.sampleRateHz
  if (expected <= 0) return null
  const valid = event.samples.filter((sample) => Number.isFinite(sample)).length
  return Math.min(100, (valid / expected) * 100)
}

export function validateMedicalDeviceEvent(
  event: MedicalDeviceEvent,
  nowMs = Date.now(),
): MedicalDeviceEventValidation {
  const errors: string[] = []

  nonBlank(event.eventId, 'eventId', errors)
  nonBlank(event.visitId, 'visitId', errors)
  nonBlank(event.subjectId, 'subjectId', errors)
  nonBlank(event.deviceId, 'deviceId', errors)
  nonBlank(event.profileId, 'profileId', errors)
  if (!Number.isInteger(event.sequence) || event.sequence < 0) errors.push('sequence')

  const profile = MEDICAL_DEVICE_INTEGRATION_CATALOG.find((entry) => entry.id === event.profileId)
  if (!profile) {
    errors.push('profileId:unknown')
  } else {
    const allowedShapes = EVENT_KIND_TO_DATA_SHAPES[event.kind]
    if (!allowedShapes.some((shape) => profile.dataShapes.includes(shape))) {
      errors.push('profileId:kind-mismatch')
    }
    if (!profile.preferredStandards.includes(event.transport) && !profile.fallbackTransports.includes(event.transport)) {
      errors.push('transport:undeclared-for-profile')
    }
  }

  const capturedMs = Date.parse(event.capturedAt)
  const receivedMs = Date.parse(event.receivedAt)
  if (!Number.isFinite(capturedMs)) errors.push('capturedAt')
  if (!Number.isFinite(receivedMs)) errors.push('receivedAt')
  if (Number.isFinite(capturedMs) && Number.isFinite(receivedMs) && receivedMs < capturedMs) {
    errors.push('clock-order')
  }

  let sampleCompletenessPercent: number | null = null

  switch (event.kind) {
    case 'waveform': {
      nonBlank(event.channelLabel, 'channelLabel', errors)
      nonBlank(event.unit, 'unit', errors)
      finite(event.sampleRateHz, 'sampleRateHz', errors)
      if (typeof event.sampleRateHz === 'number' && event.sampleRateHz <= 0) errors.push('sampleRateHz:non-positive')
      finite(event.windowDurationMs, 'windowDurationMs', errors)
      if (typeof event.windowDurationMs === 'number' && event.windowDurationMs <= 0) errors.push('windowDurationMs:non-positive')
      if (!Array.isArray(event.samples) || event.samples.length === 0) errors.push('samples:empty')
      if (event.signalQuality != null && (!Number.isFinite(event.signalQuality) || event.signalQuality < 0 || event.signalQuality > 1)) {
        errors.push('signalQuality:out-of-range')
      }
      if (errors.length === 0 || (!errors.includes('samples:empty') && !errors.includes('windowDurationMs:non-positive'))) {
        sampleCompletenessPercent = computeWaveformSampleCompleteness(event)
      }
      break
    }
    case 'alarm': {
      nonBlank(event.alarmCode, 'alarmCode', errors)
      nonBlank(event.label, 'label', errors)
      break
    }
    case 'setting': {
      nonBlank(event.settingName, 'settingName', errors)
      if (event.value === undefined || event.value === null) errors.push('value:missing')
      break
    }
    case 'therapy-delivery': {
      nonBlank(event.therapyName, 'therapyName', errors)
      nonBlank(event.unit, 'unit', errors)
      finite(event.amount, 'amount', errors)
      if (typeof event.amount === 'number' && event.amount < 0) errors.push('amount:negative')
      if (event.rate !== undefined && !Number.isFinite(event.rate)) errors.push('rate')
      break
    }
    case 'image-reference': {
      nonBlank(event.studyInstanceUid, 'studyInstanceUid', errors)
      nonBlank(event.modality, 'modality', errors)
      break
    }
    case 'report-reference': {
      nonBlank(event.reportId, 'reportId', errors)
      nonBlank(event.reportType, 'reportType', errors)
      break
    }
    case 'device-status': {
      nonBlank(event.statusCode, 'statusCode', errors)
      nonBlank(event.label, 'label', errors)
      if (typeof event.connected !== 'boolean') errors.push('connected')
      if (event.batteryPercent !== undefined && (!Number.isFinite(event.batteryPercent) || event.batteryPercent < 0 || event.batteryPercent > 100)) {
        errors.push('batteryPercent:out-of-range')
      }
      break
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    ageMs: Number.isFinite(capturedMs) ? Math.max(0, nowMs - capturedMs) : null,
    transportDelayMs: Number.isFinite(capturedMs) && Number.isFinite(receivedMs)
      ? Math.max(0, receivedMs - capturedMs)
      : null,
    sampleCompletenessPercent,
  })
}

/**
 * Replay protection + dedupe: keeps one event per (deviceId, kind, sequence),
 * preferring the copy with the latest receivedAt, then orders by capturedAt.
 * Invalid events are dropped rather than silently accepted.
 */
export function sortAndDedupeMedicalDeviceEvents(events: readonly MedicalDeviceEvent[]): MedicalDeviceEvent[] {
  const byKey = new Map<string, MedicalDeviceEvent>()
  for (const event of events) {
    if (!validateMedicalDeviceEvent(event).valid) continue
    const key = `${event.deviceId}:${event.kind}:${event.sequence}`
    const existing = byKey.get(key)
    if (!existing || Date.parse(event.receivedAt) > Date.parse(existing.receivedAt)) {
      byKey.set(key, event)
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const time = Date.parse(a.capturedAt) - Date.parse(b.capturedAt)
    return time !== 0 ? time : a.sequence - b.sequence
  })
}

/**
 * Transport freshness, not clinical severity — same boundary and thresholds
 * convention as Visit OS: `ageMs = max(0, now - capturedAt)`;
 * <= freshAfterMs is live, <= staleAfterMs is delayed, otherwise stale.
 */
export function assessMedicalDeviceEventLiveness(
  capturedAtIso: string,
  nowMs = Date.now(),
  freshAfterMs = 30_000,
  staleAfterMs = 120_000,
): MedicalDeviceLiveness {
  const capturedMs = Date.parse(capturedAtIso)
  if (!Number.isFinite(capturedMs)) return 'stale'
  const ageMs = Math.max(0, nowMs - capturedMs)
  if (ageMs <= freshAfterMs) return 'live'
  if (ageMs <= staleAfterMs) return 'delayed'
  return 'stale'
}

export const MEDICAL_DEVICE_EVENT_ENVELOPE_POLICY = Object.freeze({
  waveformMustNotFlattenToScalarFhir: true as const,
  imageAndReportRemainReferencesOnly: true as const,
  replayProtectionRequired: true as const,
  transportMustBeDeclaredByProfile: true as const,
  freshAfterMs: 30_000 as const,
  staleAfterMs: 120_000 as const,
})

export const MEDICAL_DEVICE_EVENT_ENVELOPE_BOUNDARY =
  'Waveform samples and image/report references normalized through this envelope are not clinical-record publications and are never flattened into ordinary FHIR scalar Observation rows. Waveforms belong in bounded time-series/waveform storage; images and reports stay referenced through the existing DICOM/DICOMweb and report identifiers. Only a clinician-reviewed scalar summary derived from these events may cross into visitFhirObservation.ts, through that existing review boundary — this module performs no publication.'
