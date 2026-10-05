import { isValidIsoTimestamp as validIso } from '../shared/kernel/isoTimestamp.ts'
import {
  evaluatePanacea99,
  type Panacea99DecisionReceipt,
} from './panacea99Policy.ts'
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
  constitutional: Panacea99DecisionReceipt
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
const DETERMINISTIC_VALIDATION_FALLBACK = '1970-01-01T00:00:00.000Z'

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function nonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function rejectUnexpectedFields(
  value: Record<string, unknown>,
  allowed: readonly string[],
  field: string,
  errors: string[],
) {
  const allowedFields = new Set(allowed)
  for (const key of Object.keys(value)) {
    if (!allowedFields.has(key)) errors.push(`${field} contains unsupported field: ${key}`)
  }
}



function constitutionalMedicalDeviceReceipt(
  value: unknown,
  errors: readonly string[],
  evaluatedAt: string,
) {
  const event = record(value)
  const source = record(event?.source)
  const payload = record(event?.payload)
  const therapyActuationContained = event?.kind !== 'therapy-delivery' || payload?.actuationRequested === false
  const trustBoundaryExplicit = Boolean(
    event
      && nonBlank(event.id)
      && nonBlank(event.subjectId)
      && source
      && nonBlank(source.profileId)
      && nonBlank(source.deviceId)
      && nonBlank(source.adapterId)
      && nonBlank(source.adapterVersion)
      && nonBlank(source.interface),
  )
  const readOnlyBoundary = event?.direction === 'inbound-read-only'
  const minimumExposure = readOnlyBoundary
    && !Boolean(payload && Object.prototype.hasOwnProperty.call(payload, 'samples'))
  const containment = readOnlyBoundary && therapyActuationContained
  const validationPassed = errors.length === 0

  const evidence = (id: string, sourceName: string) => [{
    id,
    kind: 'runtime' as const,
    source: sourceName,
    capturedAt: evaluatedAt,
  }]

  return evaluatePanacea99({
    actionId: 'medical-device-ingress',
    evaluatedAt,
    assessments: [
      {
        axiomId: 'A06',
        applicability: 'applicable',
        status: trustBoundaryExplicit ? 'pass' : 'fail',
        evidence: evidence('device-trust-boundary', 'medicalDeviceEventEnvelope:identity-and-source-boundary'),
      },
      {
        axiomId: 'A15',
        applicability: 'applicable',
        status: containment ? 'pass' : 'fail',
        evidence: evidence('device-containment', 'medicalDeviceEventEnvelope:read-only-no-actuation'),
      },
      {
        axiomId: 'A20',
        applicability: 'applicable',
        status: minimumExposure ? 'pass' : 'fail',
        evidence: evidence('device-minimum-exposure', 'medicalDeviceEventEnvelope:bounded-envelope'),
      },
      {
        axiomId: 'A90',
        applicability: 'applicable',
        status: validationPassed ? 'pass' : 'fail',
        evidence: evidence('device-preexecution-validation', 'medicalDeviceEventEnvelope:schema-validation'),
      },
    ],
  })
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
export function validateMedicalDeviceEvent(
  value: unknown,
  evaluatedAt?: string,
): MedicalDeviceEventValidation {
  const errors: string[] = []
  const event = record(value)
  const receivedAtForReceipt = record(event?.provenance)?.receivedAt
  const requestedEvaluatedAt = evaluatedAt
    ?? (validIso(receivedAtForReceipt) ? receivedAtForReceipt : DETERMINISTIC_VALIDATION_FALLBACK)
  if (!validIso(requestedEvaluatedAt)) errors.push('evaluatedAt must be a valid ISO timestamp')
  const receiptAt = validIso(requestedEvaluatedAt)
    ? requestedEvaluatedAt
    : DETERMINISTIC_VALIDATION_FALLBACK

  if (!event) {
    errors.push('event must be an object')
    const constitutional = constitutionalMedicalDeviceReceipt(value, errors, receiptAt)
    return {
      accepted: false,
      disposition: 'quarantined',
      errors,
      constitutional,
    }
  }

  rejectUnexpectedFields(
    event,
    ['id', 'subjectId', 'encounterId', 'kind', 'direction', 'source', 'provenance', 'payload'],
    'event',
    errors,
  )
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
  if (source) {
    rejectUnexpectedFields(
      source,
      ['profileId', 'deviceId', 'adapterId', 'adapterVersion', 'interface', 'manufacturer', 'model', 'firmware'],
      'source',
      errors,
    )
  }
  const profileId = source?.profileId
  const profile = nonBlank(profileId) ? getMedicalDeviceIntegrationProfile(profileId.trim()) : undefined
  if (!profile) errors.push('source.profileId must resolve to a medical-device catalog profile')

  for (const field of ['deviceId', 'adapterId', 'adapterVersion', 'interface'] as const) {
    if (!nonBlank(source?.[field])) errors.push(`source.${field} must not be blank`)
  }
  for (const field of ['manufacturer', 'model', 'firmware'] as const) {
    if (source?.[field] !== undefined && !nonBlank(source[field])) {
      errors.push(`source.${field} must be a non-blank string when supplied`)
    }
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
  if (provenance) {
    rejectUnexpectedFields(provenance, ['capturedAt', 'receivedAt', 'sequence'], 'provenance', errors)
  }
  const capturedAt = provenance?.capturedAt
  const receivedAt = provenance?.receivedAt
  if (!validIso(capturedAt)) errors.push('provenance.capturedAt must be a valid ISO timestamp')
  if (!validIso(receivedAt)) errors.push('provenance.receivedAt must be a valid ISO timestamp')
  if (validIso(capturedAt) && validIso(receivedAt) && Date.parse(capturedAt) > Date.parse(receivedAt)) {
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
    rejectUnexpectedFields(payload, ['shape', 'channels', 'sampleRateHz', 'sampleCount', 'storage', 'samples'], 'waveform payload', errors)
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
    if (storage) {
      rejectUnexpectedFields(storage, ['uri', 'checksumSha256', 'contentType'], 'waveform storage', errors)
    }
    if (!nonBlank(storage?.uri)) errors.push('waveform storage uri must not be blank')
    if (!nonBlank(storage?.contentType)) errors.push('waveform storage contentType must not be blank')
    if (typeof storage?.checksumSha256 !== 'string' || !SHA256.test(storage.checksumSha256)) {
      errors.push('waveform storage checksumSha256 must be 64 hexadecimal characters')
    }
  } else if (kind === 'alarm') {
    rejectUnexpectedFields(payload, ['shape', 'code', 'severity', 'state', 'message'], 'alarm payload', errors)
    if (!nonBlank(payload.code)) errors.push('alarm code must not be blank')
    if (!ALARM_SEVERITIES.has(String(payload.severity))) errors.push('alarm severity is invalid')
    if (!ALARM_STATES.has(String(payload.state))) errors.push('alarm state is invalid')
    if (payload.message !== undefined && !nonBlank(payload.message)) {
      errors.push('alarm message must be a non-blank string when supplied')
    }
  } else if (kind === 'setting') {
    rejectUnexpectedFields(payload, ['shape', 'name', 'value', 'unit'], 'setting payload', errors)
    if (!nonBlank(payload.name)) errors.push('setting name must not be blank')
    const settingValue = payload.value
    const validValue = typeof settingValue === 'boolean'
      || (typeof settingValue === 'number' && Number.isFinite(settingValue))
      || nonBlank(settingValue)
    if (!validValue) errors.push('setting value must be a finite number, boolean or non-blank string')
    if (payload.unit !== undefined && !nonBlank(payload.unit)) {
      errors.push('setting unit must be a non-blank string when supplied')
    }
  } else if (kind === 'therapy-delivery') {
    rejectUnexpectedFields(
      payload,
      ['shape', 'therapyCode', 'status', 'amount', 'unit', 'actuationRequested'],
      'therapy-delivery payload',
      errors,
    )
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
    rejectUnexpectedFields(
      payload,
      ['shape', 'uri', 'studyInstanceUid', 'seriesInstanceUid', 'sopInstanceUid', 'contentType'],
      'image-reference payload',
      errors,
    )
    if (!nonBlank(payload.uri)) errors.push('image reference uri must not be blank')
    for (const field of ['studyInstanceUid', 'seriesInstanceUid', 'sopInstanceUid', 'contentType'] as const) {
      if (payload[field] !== undefined && !nonBlank(payload[field])) {
        errors.push(`image reference ${field} must be a non-blank string when supplied`)
      }
    }
  } else if (kind === 'report-reference') {
    rejectUnexpectedFields(
      payload,
      ['shape', 'uri', 'reportType', 'contentType', 'checksumSha256'],
      'report-reference payload',
      errors,
    )
    if (!nonBlank(payload.uri)) errors.push('report reference uri must not be blank')
    if (!nonBlank(payload.reportType)) errors.push('reportType must not be blank')
    if (payload.contentType !== undefined && !nonBlank(payload.contentType)) {
      errors.push('report contentType must be a non-blank string when supplied')
    }
    if (payload.checksumSha256 !== undefined
      && (typeof payload.checksumSha256 !== 'string' || !SHA256.test(payload.checksumSha256))) {
      errors.push('report checksumSha256 must be 64 hexadecimal characters when supplied')
    }
  }

  const constitutional = constitutionalMedicalDeviceReceipt(value, errors, receiptAt)
  const accepted = errors.length === 0 && constitutional.executionGate === 1

  return {
    accepted,
    disposition: accepted ? 'accepted' : 'quarantined',
    errors,
    constitutional,
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
    Object.assign(payload, {
      uri: payload.uri.trim(),
      studyInstanceUid: payload.studyInstanceUid?.trim(),
      seriesInstanceUid: payload.seriesInstanceUid?.trim(),
      sopInstanceUid: payload.sopInstanceUid?.trim(),
      contentType: payload.contentType?.trim(),
    })
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
