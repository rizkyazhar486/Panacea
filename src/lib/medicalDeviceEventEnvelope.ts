import {
  getMedicalDeviceIntegrationProfile,
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

export interface MedicalDeviceEventSource {
  profileId: string
  deviceId: string
  adapterId: string
  adapterVersion: string
  interface: MedicalDeviceInteropStandard
  manufacturer?: string
  model?: string
  firmware?: string
}

export interface MedicalDeviceEventProvenance {
  capturedAt: string
  receivedAt: string
  sequence: number
}

export interface MedicalDeviceExternalStorageReference {
  uri: string
  checksumSha256: string
  contentType: string
}

export interface MedicalDeviceWaveformPayload {
  shape: 'waveform'
  channels: readonly string[]
  sampleRateHz: number
  sampleCount: number
  storage: MedicalDeviceExternalStorageReference
}

export interface MedicalDeviceAlarmPayload {
  shape: 'alarm'
  code: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  state: 'active' | 'acknowledged' | 'cleared'
  message?: string
}

export interface MedicalDeviceSettingPayload {
  shape: 'setting'
  name: string
  value: string | number | boolean
  unit?: string
}

export interface MedicalDeviceTherapyDeliveryPayload {
  shape: 'therapy-delivery'
  therapyCode: string
  status: 'started' | 'delivering' | 'delivered' | 'paused' | 'stopped' | 'unknown'
  amount: number
  unit: string
  actuationRequested: false
}

export interface MedicalDeviceImageReferencePayload {
  shape: 'image-reference'
  uri: string
  studyInstanceUid?: string
  seriesInstanceUid?: string
  sopInstanceUid?: string
  contentType?: string
}

export interface MedicalDeviceReportReferencePayload {
  shape: 'report-reference'
  uri: string
  reportType: string
  contentType?: string
  checksumSha256?: string
}

export type MedicalDeviceEventPayload =
  | MedicalDeviceWaveformPayload
  | MedicalDeviceAlarmPayload
  | MedicalDeviceSettingPayload
  | MedicalDeviceTherapyDeliveryPayload
  | MedicalDeviceImageReferencePayload
  | MedicalDeviceReportReferencePayload

export interface MedicalDeviceEventEnvelope {
  id: string
  subjectId: string
  encounterId?: string
  kind: MedicalDeviceEventKind
  direction: 'inbound-read-only'
  source: MedicalDeviceEventSource
  provenance: MedicalDeviceEventProvenance
  payload: MedicalDeviceEventPayload
}

export interface MedicalDeviceEventValidation {
  accepted: boolean
  disposition: 'accepted' | 'quarantined'
  errors: readonly string[]
}

const EVENT_SHAPES = new Set<MedicalDeviceEventKind>([
  'waveform',
  'alarm',
  'setting',
  'therapy-delivery',
  'image-reference',
  'report-reference',
])
const ALARM_SEVERITIES = new Set(['low', 'medium', 'high', 'critical'])
const ALARM_STATES = new Set(['active', 'acknowledged', 'cleared'])
const THERAPY_STATUSES = new Set(['started', 'delivering', 'delivered', 'paused', 'stopped', 'unknown'])
const SHA256 = /^[a-f0-9]{64}$/i

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function nonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validIso(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function declaredShapeForKind(kind: string): readonly MedicalDeviceDataShape[] {
  if (kind === 'image-reference') return ['image', 'volume', 'video']
  if (kind === 'report-reference') return ['report']
  return [kind as MedicalDeviceDataShape]
}

/**
 * Validates the transport and provenance boundary only. Acceptance does not
 * establish clinical correctness, vendor support, diagnostic validity or
 * fitness for treatment.
 */
export function validateMedicalDeviceEvent(value: unknown): MedicalDeviceEventValidation {
  const errors: string[] = []
  const event = record(value)
  if (!event) {
    return { accepted: false, disposition: 'quarantined', errors: ['event must be an object'] }
  }

  for (const field of ['id', 'subjectId'] as const) {
    if (!nonBlank(event[field])) errors.push(`${field} must not be blank`)
  }
  if (event.encounterId !== undefined && !nonBlank(event.encounterId)) {
    errors.push('encounterId must not be blank when supplied')
  }

  const kind = typeof event.kind === 'string' ? event.kind : ''
  if (!EVENT_SHAPES.has(kind as MedicalDeviceEventKind)) {
    errors.push('kind must be a supported non-scalar device event kind')
  }
  if (event.direction !== 'inbound-read-only') {
    errors.push('direction must remain inbound-read-only')
  }

  const source = record(event.source)
  const profileId = source?.profileId
  const profile = nonBlank(profileId) ? getMedicalDeviceIntegrationProfile(profileId.trim()) : undefined
  if (!profile) errors.push('source.profileId must resolve to a medical-device catalog profile')

  for (const field of ['deviceId', 'adapterId', 'adapterVersion', 'interface'] as const) {
    if (!nonBlank(source?.[field])) errors.push(`source.${field} must not be blank`)
  }

  if (profile && nonBlank(source?.interface)) {
    const supportedInterfaces = [...profile.preferredStandards, ...profile.fallbackTransports]
    if (!supportedInterfaces.includes(source.interface as MedicalDeviceInteropStandard)) {
      errors.push('source.interface is not declared by the catalog profile')
    }
    const shapes = declaredShapeForKind(kind)
    if (EVENT_SHAPES.has(kind as MedicalDeviceEventKind) && !shapes.some((shape) => profile.dataShapes.includes(shape))) {
      errors.push(`catalog profile ${profile.id} does not declare ${kind.replace('-reference', '')} data`)
    }
  }

  const provenance = record(event.provenance)
  if (!validIso(provenance?.capturedAt)) errors.push('provenance.capturedAt must be a valid ISO timestamp')
  if (!validIso(provenance?.receivedAt)) errors.push('provenance.receivedAt must be a valid ISO timestamp')
  if (validIso(provenance?.capturedAt) && validIso(provenance?.receivedAt)
    && Date.parse(provenance.capturedAt as string) > Date.parse(provenance.receivedAt as string)) {
    errors.push('provenance.capturedAt must not be after provenance.receivedAt')
  }
  if (!Number.isSafeInteger(provenance?.sequence) || Number(provenance?.sequence) < 0) {
    errors.push('provenance.sequence must be a non-negative safe integer')
  }

  const payload = record(event.payload)
  if (!payload) {
    errors.push('payload must be an object')
  } else if (payload.shape !== kind) {
    errors.push('payload.shape must match event.kind')
  } else if (kind === 'waveform') {
    if (Object.prototype.hasOwnProperty.call(payload, 'samples')) {
      errors.push('inline waveform samples are forbidden; use an external bounded storage reference')
    }
    if (!Array.isArray(payload.channels) || payload.channels.length === 0 || payload.channels.some((channel) => !nonBlank(channel))) {
      errors.push('waveform channels must contain at least one non-blank channel')
    }
    if (typeof payload.sampleRateHz !== 'number' || !Number.isFinite(payload.sampleRateHz) || payload.sampleRateHz <= 0) {
      errors.push('waveform sampleRateHz must be finite and positive')
    }
    if (!Number.isSafeInteger(payload.sampleCount) || Number(payload.sampleCount) <= 0) {
      errors.push('waveform sampleCount must be a positive safe integer')
    }
    const storage = record(payload.storage)
    if (!nonBlank(storage?.uri)) errors.push('waveform storage uri must not be blank')
    if (!nonBlank(storage?.contentType)) errors.push('waveform storage contentType must not be blank')
    if (typeof storage?.checksumSha256 !== 'string' || !SHA256.test(storage.checksumSha256)) {
      errors.push('waveform storage checksumSha256 must be 64 hexadecimal characters')
    }
  } else if (kind === 'alarm') {
    if (!nonBlank(payload.code)) errors.push('alarm code must not be blank')
    if (!ALARM_SEVERITIES.has(String(payload.severity))) errors.push('alarm severity is invalid')
    if (!ALARM_STATES.has(String(payload.state))) errors.push('alarm state is invalid')
  } else if (kind === 'setting') {
    if (!nonBlank(payload.name)) errors.push('setting name must not be blank')
    const settingValue = payload.value
    const validValue = typeof settingValue === 'boolean'
      || (typeof settingValue === 'number' && Number.isFinite(settingValue))
      || nonBlank(settingValue)
    if (!validValue) errors.push('setting value must be a finite number, boolean or non-blank string')
  } else if (kind === 'therapy-delivery') {
    if (!nonBlank(payload.therapyCode)) errors.push('therapyCode must not be blank')
    if (!THERAPY_STATUSES.has(String(payload.status))) errors.push('therapy-delivery status is invalid')
    if (typeof payload.amount !== 'number' || !Number.isFinite(payload.amount) || payload.amount < 0) {
      errors.push('therapy-delivery amount must be finite and non-negative')
    }
    if (!nonBlank(payload.unit)) errors.push('therapy-delivery unit must not be blank')
    if (payload.actuationRequested !== false) {
      errors.push('therapy-delivery events are observations only; actuation is forbidden')
    }
  } else if (kind === 'image-reference') {
    if (!nonBlank(payload.uri)) errors.push('image reference uri must not be blank')
  } else if (kind === 'report-reference') {
    if (!nonBlank(payload.uri)) errors.push('report reference uri must not be blank')
    if (!nonBlank(payload.reportType)) errors.push('reportType must not be blank')
    if (payload.checksumSha256 !== undefined
      && (typeof payload.checksumSha256 !== 'string' || !SHA256.test(payload.checksumSha256))) {
      errors.push('report checksumSha256 must be 64 hexadecimal characters when supplied')
    }
  }

  return {
    accepted: errors.length === 0,
    disposition: errors.length === 0 ? 'accepted' : 'quarantined',
    errors,
  }
}

export function normalizeMedicalDeviceEvent<T extends MedicalDeviceEventEnvelope>(event: T): T {
  const validation = validateMedicalDeviceEvent(event)
  if (!validation.accepted) throw new Error(validation.errors.join('; '))

  const payload = { ...event.payload } as MedicalDeviceEventPayload
  if (payload.shape === 'waveform') {
    Object.assign(payload, {
      channels: payload.channels.map((channel) => channel.trim()),
      storage: {
        ...payload.storage,
        uri: payload.storage.uri.trim(),
        contentType: payload.storage.contentType.trim(),
        checksumSha256: payload.storage.checksumSha256.toLowerCase(),
      },
    })
  } else if (payload.shape === 'alarm') {
    Object.assign(payload, { code: payload.code.trim(), message: payload.message?.trim() })
  } else if (payload.shape === 'setting') {
    Object.assign(payload, { name: payload.name.trim(), unit: payload.unit?.trim() })
  } else if (payload.shape === 'therapy-delivery') {
    Object.assign(payload, { therapyCode: payload.therapyCode.trim(), unit: payload.unit.trim() })
  } else if (payload.shape === 'image-reference') {
    Object.assign(payload, { uri: payload.uri.trim(), contentType: payload.contentType?.trim() })
  } else {
    Object.assign(payload, {
      uri: payload.uri.trim(),
      reportType: payload.reportType.trim(),
      contentType: payload.contentType?.trim(),
      checksumSha256: payload.checksumSha256?.toLowerCase(),
    })
  }

  return {
    ...event,
    id: event.id.trim(),
    subjectId: event.subjectId.trim(),
    encounterId: event.encounterId?.trim(),
    source: {
      ...event.source,
      profileId: event.source.profileId.trim(),
      deviceId: event.source.deviceId.trim(),
      adapterId: event.source.adapterId.trim(),
      adapterVersion: event.source.adapterVersion.trim(),
      manufacturer: event.source.manufacturer?.trim(),
      model: event.source.model?.trim(),
      firmware: event.source.firmware?.trim(),
    },
    payload,
  } as T
}
