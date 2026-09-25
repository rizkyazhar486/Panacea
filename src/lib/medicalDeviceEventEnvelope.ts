import { getMedicalDeviceIntegrationProfile, type DeviceDataDirection } from './medicalDeviceIntegrationCatalog.ts'

/**
 * Canonical non-scalar Medical Device Fabric event envelope.
 *
 * Scalar bedside/visit measurements continue to flow through
 * visitOperatingSystem.ts / visitDeviceAdapters.ts. High-frequency waveforms,
 * alarms, settings, therapy-delivery events and image/report references do
 * not fit that scalar contract and must not be flattened into it. This module
 * is the shared, provenance-preserving boundary for those non-scalar events
 * across every device family in medicalDeviceIntegrationCatalog.ts.
 *
 * Direction stays inbound-read-only by default per
 * MEDICAL_DEVICE_OS_POLICY.directTherapyControlEnabled = false. A
 * therapy-delivery event may describe what a pump/ventilator/dialysis/ECMO
 * device already did (an observation); it must never carry a request to
 * actuate a device, regardless of the declared transport direction.
 */

export type MedicalDeviceEventKind =
  | 'waveform'
  | 'alarm'
  | 'setting'
  | 'therapy-delivery'
  | 'image-reference'
  | 'report-reference'

export type MedicalDeviceEventDirection = DeviceDataDirection

export interface MedicalDeviceEventSource {
  profileId: string
  deviceId: string
  adapterId: string
  adapterVersion: string
  interface: string
}

export interface MedicalDeviceEventProvenance {
  capturedAt: string
  receivedAt: string
  sequence: number
}

export interface WaveformEventPayload {
  shape: 'waveform'
  channels: readonly string[]
  sampleRateHz: number
  sampleCount: number
  storage: {
    uri: string
    checksumSha256: string
    contentType: string
  }
}

export interface AlarmEventPayload {
  shape: 'alarm'
  code: string
  severity: string
  state: string
}

export interface SettingEventPayload {
  shape: 'setting'
  name: string
  value: string | number | boolean
}

export interface TherapyDeliveryEventPayload {
  shape: 'therapy-delivery'
  therapyCode: string
  status: string
  amount: number
  unit: string
  actuationRequested: boolean
}

export interface ImageReferenceEventPayload {
  shape: 'image-reference'
  uri: string
  studyInstanceUid?: string
  seriesInstanceUid?: string
  sopInstanceUid?: string
  contentType?: string
}

export interface ReportReferenceEventPayload {
  shape: 'report-reference'
  uri: string
  reportType?: string
  contentType?: string
}

export type MedicalDeviceEventPayload =
  | WaveformEventPayload
  | AlarmEventPayload
  | SettingEventPayload
  | TherapyDeliveryEventPayload
  | ImageReferenceEventPayload
  | ReportReferenceEventPayload

export interface MedicalDeviceEvent {
  id: string
  subjectId: string
  encounterId: string
  kind: MedicalDeviceEventKind
  direction: MedicalDeviceEventDirection
  source: MedicalDeviceEventSource
  provenance: MedicalDeviceEventProvenance
  payload: MedicalDeviceEventPayload
}

export interface MedicalDeviceEventValidationResult {
  accepted: boolean
  errors: string[]
}

const KNOWN_KINDS: readonly MedicalDeviceEventKind[] = [
  'waveform',
  'alarm',
  'setting',
  'therapy-delivery',
  'image-reference',
  'report-reference',
]

const DATA_SHAPE_BY_KIND: Record<MedicalDeviceEventKind, string> = {
  waveform: 'waveform',
  alarm: 'alarm',
  setting: 'setting',
  'therapy-delivery': 'therapy-delivery',
  'image-reference': 'image',
  'report-reference': 'report',
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function parseIsoTimestamp(value: unknown): number | null {
  if (typeof value !== 'string' || !ISO_DATE_RE.test(value.trim())) return null
  const normalized = value.trim()
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return null
  const [datePart] = normalized.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    // Calendar overflow (e.g. 2026-02-30) or a clock component out of range
    // (e.g. T24:00:00) that Date silently rolled into the next day.
    return null
  }
  return parsed.getTime()
}

function validatePayload(kind: MedicalDeviceEventKind, payload: unknown, errors: string[]): void {
  if (typeof payload !== 'object' || payload === null) {
    errors.push('payload must be an object')
    return
  }
  const record = payload as Record<string, unknown>
  const expectedShape = DATA_SHAPE_BY_KIND[kind]
  if (record.shape !== expectedShape) {
    errors.push(`payload.shape must equal "${expectedShape}" for kind "${kind}"`)
  }

  switch (kind) {
    case 'waveform': {
      if ('samples' in record || 'data' in record) {
        errors.push(
          'payload must not embed inline waveform samples; store high-frequency waveform data externally and reference it via payload.storage',
        )
      }
      if (!Array.isArray(record.channels) || record.channels.length === 0) {
        errors.push('payload.channels must be a non-empty array of channel labels')
      }
      if (!Number.isFinite(record.sampleRateHz) || (record.sampleRateHz as number) <= 0) {
        errors.push('payload.sampleRateHz must be a positive finite number')
      }
      if (!Number.isFinite(record.sampleCount) || (record.sampleCount as number) <= 0) {
        errors.push('payload.sampleCount must be a positive finite number')
      }
      const storage = record.storage as Record<string, unknown> | undefined
      if (typeof storage !== 'object' || storage === null) {
        errors.push('payload.storage is required so waveform samples stay out of the event envelope')
      } else {
        if (!isNonBlankString(storage.uri)) errors.push('payload.storage.uri is required')
        if (!isNonBlankString(storage.checksumSha256) || !/^[0-9a-f]{64}$/i.test(String(storage.checksumSha256).trim())) {
          errors.push('payload.storage.checksumSha256 must be a 64-character hex SHA-256 digest')
        }
        if (!isNonBlankString(storage.contentType)) errors.push('payload.storage.contentType is required')
      }
      break
    }
    case 'alarm': {
      if (!isNonBlankString(record.code)) errors.push('payload.code is required for an alarm event')
      if (!isNonBlankString(record.severity)) errors.push('payload.severity is required for an alarm event')
      if (!isNonBlankString(record.state)) errors.push('payload.state is required for an alarm event')
      break
    }
    case 'setting': {
      if (!isNonBlankString(record.name)) errors.push('payload.name is required for a setting event')
      const value = record.value
      const validValue =
        (typeof value === 'string' && value.trim().length > 0) ||
        (typeof value === 'number' && Number.isFinite(value)) ||
        typeof value === 'boolean'
      if (!validValue) errors.push('payload.value must be a non-empty string, finite number or boolean')
      break
    }
    case 'therapy-delivery': {
      if (!isNonBlankString(record.therapyCode)) errors.push('payload.therapyCode is required for a therapy-delivery event')
      if (!isNonBlankString(record.status)) errors.push('payload.status is required for a therapy-delivery event')
      if (!Number.isFinite(record.amount)) errors.push('payload.amount must be a finite number')
      if (!isNonBlankString(record.unit)) errors.push('payload.unit is required for a therapy-delivery event')
      if (record.actuationRequested === true) {
        errors.push(
          'payload.actuationRequested must remain false: Panacea therapy-delivery events are inbound-read-only observations and must never request actuation',
        )
      } else if (typeof record.actuationRequested !== 'boolean') {
        errors.push('payload.actuationRequested must be a boolean')
      }
      break
    }
    case 'image-reference':
    case 'report-reference': {
      if (!isNonBlankString(record.uri)) {
        errors.push(`payload.uri is required as the image/report reference uri for kind "${kind}"`)
      }
      break
    }
  }
}

function validateSource(source: unknown, kind: MedicalDeviceEventKind, errors: string[]): void {
  if (typeof source !== 'object' || source === null) {
    errors.push('source must be an object')
    return
  }
  const record = source as Record<string, unknown>
  if (!isNonBlankString(record.deviceId)) errors.push('source.deviceId is required')
  if (!isNonBlankString(record.adapterId)) errors.push('source.adapterId is required')
  if (!isNonBlankString(record.adapterVersion)) errors.push('source.adapterVersion is required')
  if (!isNonBlankString(record.interface)) errors.push('source.interface is required')

  if (!isNonBlankString(record.profileId)) {
    errors.push('source.profileId is required')
    return
  }
  const profileId = record.profileId.trim()
  const profile = getMedicalDeviceIntegrationProfile(profileId)
  if (!profile) {
    errors.push(`source.profileId "${profileId}" is not a recognized medical device integration catalog profile`)
    return
  }
  const expectedShape = DATA_SHAPE_BY_KIND[kind]
  if (!(profile.dataShapes as readonly string[]).includes(expectedShape)) {
    errors.push(`catalog profile "${profileId}" does not declare ${expectedShape} as a supported data shape for kind "${kind}"`)
  }
}

function validateProvenance(provenance: unknown, errors: string[]): void {
  if (typeof provenance !== 'object' || provenance === null) {
    errors.push('provenance must be an object')
    return
  }
  const record = provenance as Record<string, unknown>

  const capturedAtMs = parseIsoTimestamp(record.capturedAt)
  if (capturedAtMs === null) errors.push('provenance.capturedAt must be a valid ISO 8601 UTC timestamp')

  const receivedAtMs = parseIsoTimestamp(record.receivedAt)
  if (receivedAtMs === null) errors.push('provenance.receivedAt must be a valid ISO 8601 UTC timestamp')

  if (capturedAtMs !== null && receivedAtMs !== null && capturedAtMs > receivedAtMs) {
    errors.push('provenance.capturedAt must not be after provenance.receivedAt; data cannot be received before it was captured')
  }

  if (!Number.isInteger(record.sequence) || (record.sequence as number) < 0) {
    errors.push('provenance.sequence must be a non-negative integer')
  }
}

export function validateMedicalDeviceEvent(event: unknown): MedicalDeviceEventValidationResult {
  const errors: string[] = []

  if (typeof event !== 'object' || event === null) {
    return { accepted: false, errors: ['event must be an object'] }
  }
  const record = event as Record<string, unknown>

  if (!isNonBlankString(record.id)) errors.push('id is required')
  if (!isNonBlankString(record.subjectId)) errors.push('subjectId is required')
  if (!isNonBlankString(record.encounterId)) errors.push('encounterId is required')

  const kind = record.kind as MedicalDeviceEventKind
  if (!KNOWN_KINDS.includes(kind)) {
    errors.push(`kind must be one of ${KNOWN_KINDS.join(', ')}`)
  }

  if (record.direction !== 'inbound-read-only' && record.direction !== 'bidirectional-regulated') {
    errors.push('direction must be "inbound-read-only" or "bidirectional-regulated"')
  }

  if (KNOWN_KINDS.includes(kind)) {
    validateSource(record.source, kind, errors)
    validatePayload(kind, record.payload, errors)
  }

  validateProvenance(record.provenance, errors)

  return { accepted: errors.length === 0, errors }
}

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value
}

/**
 * Normalizes surface whitespace on identity fields. This does not validate
 * the event; call validateMedicalDeviceEvent (directly, or by re-validating
 * the normalized result) before accepting it.
 */
export function normalizeMedicalDeviceEvent<T extends Record<string, unknown>>(event: T): T {
  const normalized: Record<string, unknown> = { ...event }
  for (const field of ['id', 'subjectId', 'encounterId'] as const) {
    if (field in normalized) normalized[field] = trimmed(normalized[field])
  }
  if (typeof normalized.source === 'object' && normalized.source !== null) {
    const source: Record<string, unknown> = { ...(normalized.source as Record<string, unknown>) }
    for (const field of ['profileId', 'deviceId', 'adapterId', 'adapterVersion', 'interface'] as const) {
      if (field in source) source[field] = trimmed(source[field])
    }
    normalized.source = source
  }
  return normalized as T
}
