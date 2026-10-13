import { isValidIsoTimestamp } from '../shared/kernel/isoTimestamp.ts'
import {
  validateMedicalDeviceEvent,
  type MedicalDeviceEventEnvelope,
  type MedicalDeviceEventKind,
} from './medicalDeviceEventEnvelope.ts'

/**
 * Pure, read-only device-to-OS explanation prototype across historical, current
 * and emerging device generations. NOT a trusted API authorization check, a
 * device driver, a clinical observation writer, or a vendor support assertion.
 * The supplied context MUST originate from an independently verified upstream
 * identity/consent/tenant/encounter boundary before any clinical integration.
 */
export type DeviceGeneration = 'historical' | 'current' | 'emerging'
export type HistoricalSourceType =
  | 'paper-ecg'
  | 'film-imaging'
  | 'lab-printout'
  | 'manual-measurement'
  | 'legacy-device-export'
  | 'other-archive'

export type RecordedWhen =
  | { precision: 'instant'; value: string }
  | { precision: 'date'; value: string }
  | { precision: 'unknown' }

export interface HistoricalDeviceArtifactReference {
  id: string
  subjectId: string
  importedAt: string
  sourceType: HistoricalSourceType
  recordedWhen: RecordedWhen
  sourceDocument: {
    uri: string
    checksumSha256: string
  }
  extraction: 'human-attested' | 'machine-unverified' | 'direct-file-export'
}

export type MedicalDeviceTranslationInput =
  | { mode: 'device-event'; generation: DeviceGeneration; event: unknown }
  | { mode: 'historical-archive'; generation: 'historical'; artifact: unknown }

export interface TrustedDeviceProjectionScope {
  subjectId: string
  encounterId?: string
  sourceAuthorized: boolean
  consentVerified: boolean
}

export interface DeviceOsExplanation {
  sourceId: string
  subjectId: string
  generation: DeviceGeneration
  truthLane: 'device-reported' | 'archival-reference' | 'research-only'
  eventType: MedicalDeviceEventKind | HistoricalSourceType
  sourceRecordedWhen: RecordedWhen
  ingestedAt: string
  sourceReference: string
  summary: string
  limits: string
  nextAction: 'verify-original-and-clinician-review' | 'clinician-review' | 'research-review'
  clinicalPublicationEligible: false
  autonomousDeviceControlEnabled: false
}

export interface DeviceOsTranslation {
  accepted: boolean
  disposition: 'quarantined' | 'archival-reference' | 'technical-event' | 'research-only'
  errors: readonly string[]
  explanation: DeviceOsExplanation | null
}

const SOURCE_TYPES = new Set<HistoricalSourceType>([
  'paper-ecg', 'film-imaging', 'lab-printout',
  'manual-measurement', 'legacy-device-export', 'other-archive',
])
const SHA256 = /^[a-f0-9]{64}$/i
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function validCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_ONLY.test(value)) return false
  const parsed = new Date(value + 'T00:00:00.000Z')
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}

function unknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  prefix: string,
  errors: string[],
) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(prefix + ' contains unsupported field: ' + key)
  }
}

function rejected(errors: string[]): DeviceOsTranslation {
  return { accepted: false, disposition: 'quarantined', errors, explanation: null }
}

function checkScope(scope: TrustedDeviceProjectionScope): string[] {
  const errors: string[] = []
  if (!scope || !validIdentifier(scope.subjectId)) errors.push('verified subject scope is required')
  if (scope?.sourceAuthorized !== true) errors.push('verified source authorization is required')
  if (scope?.consentVerified !== true) errors.push('verified purpose-specific consent is required')
  if (scope?.encounterId !== undefined && !validIdentifier(scope.encounterId)) {
    errors.push('encounterId must be non-blank when provided')
  }
  return errors
}

function deviceExplanation(kind: MedicalDeviceEventKind): string {
  switch (kind) {
    case 'waveform': return 'An external waveform reference was received; its raw samples were not interpreted.'
    case 'alarm': return 'The device reported an alarm event; this is not a patient diagnosis.'
    case 'setting': return 'A device setting was reported; no setting change was requested.'
    case 'therapy-delivery': return 'The device reported a therapy-delivery state; administration is not clinician-confirmed.'
    case 'image-reference': return 'An imaging reference was received; the image itself was not interpreted.'
    case 'report-reference': return 'A report reference was received; the report has not been clinically reviewed.'
  }
}

function checkRecordedWhen(value: unknown, errors: string[]): RecordedWhen | null {
  const data = object(value)
  if (!data) {
    errors.push('recordedWhen must be an object preserving time precision')
    return null
  }
  if (data.precision === 'instant') {
    unknownKeys(data, ['precision', 'value'], 'recordedWhen', errors)
    if (!isValidIsoTimestamp(data.value)) errors.push('instant recordedWhen requires valid ISO timestamp')
    return errors.length === 0 ? { precision: 'instant', value: data.value as string } : null
  }
  if (data.precision === 'date') {
    unknownKeys(data, ['precision', 'value'], 'recordedWhen', errors)
    if (!validCalendarDate(data.value)) errors.push('date recordedWhen requires a real YYYY-MM-DD date')
    return errors.length === 0 ? { precision: 'date', value: data.value as string } : null
  }
  if (data.precision === 'unknown') {
    unknownKeys(data, ['precision'], 'recordedWhen', errors)
    return errors.length === 0 ? { precision: 'unknown' } : null
  }
  errors.push('recordedWhen.precision must be instant, date or unknown')
  return null
}

function historicalTranslation(
  value: unknown,
  scope: TrustedDeviceProjectionScope,
): DeviceOsTranslation {
  const errors: string[] = []
  const a = object(value)
  if (!a) return rejected(['historical artifact must be an object'])
  unknownKeys(
    a,
    ['id', 'subjectId', 'importedAt', 'sourceType', 'recordedWhen', 'sourceDocument', 'extraction'],
    'historical artifact',
    errors,
  )
  if (!validIdentifier(a.id)) errors.push('artifact id must not be blank')
  if (!validIdentifier(a.subjectId) || a.subjectId !== scope.subjectId) {
    errors.push('artifact subject does not match verified subject scope')
  }
  if (!isValidIsoTimestamp(a.importedAt)) errors.push('importedAt must be a valid ISO timestamp')
  if (!SOURCE_TYPES.has(a.sourceType as HistoricalSourceType)) errors.push('sourceType is unsupported')
  const recordedWhen = checkRecordedWhen(a.recordedWhen, errors)
  const doc = object(a.sourceDocument)
  if (!doc) {
    errors.push('sourceDocument must preserve an external artifact reference')
  } else {
    unknownKeys(doc, ['uri', 'checksumSha256'], 'sourceDocument', errors)
    if (!validIdentifier(doc.uri)) errors.push('sourceDocument.uri must not be blank')
    if (typeof doc.checksumSha256 !== 'string' || !SHA256.test(doc.checksumSha256)) {
      errors.push('sourceDocument.checksumSha256 must be 64 hex characters')
    }
  }
  if (!['human-attested', 'machine-unverified', 'direct-file-export'].includes(String(a.extraction))) {
    errors.push('extraction provenance is unsupported')
  }
  if (errors.length || !recordedWhen || !doc) return rejected(errors)

  // Historical imports are *references*, never reconstructed live sensor data,
  // even if a transcription has been attested by a human.
  const explanation: DeviceOsExplanation = {
    sourceId: (a.id as string).trim(),
    subjectId: scope.subjectId,
    generation: 'historical',
    truthLane: 'archival-reference',
    eventType: a.sourceType as HistoricalSourceType,
    sourceRecordedWhen: recordedWhen,
    ingestedAt: a.importedAt as string,
    sourceReference: (doc.uri as string).trim(),
    summary: 'A historical medical-device source artifact was imported as a reference; no live device reading was reconstructed.',
    limits: 'Source date precision, original calibration, transcription quality and clinical comparability require separate verification.',
    nextAction: 'verify-original-and-clinician-review',
    clinicalPublicationEligible: false,
    autonomousDeviceControlEnabled: false,
  }
  return { accepted: true, disposition: 'archival-reference', errors: [], explanation }
}

/**
 * Normalized device events still require real manufacturer adapter conformance,
 * independent server-side authz and qualified review. This function only
 * produces a deterministic, non-clinical interpretation of an event envelope.
 */
export function translateMedicalDeviceForOs(
  input: MedicalDeviceTranslationInput,
  trustedScope: TrustedDeviceProjectionScope,
): DeviceOsTranslation {
  const scopeErrors = checkScope(trustedScope)
  if (scopeErrors.length) return rejected(scopeErrors)

  if (!input || !['device-event', 'historical-archive'].includes(input.mode)) {
    return rejected(['translation mode is unsupported'])
  }
  if (input.mode === 'historical-archive') {
    if (input.generation !== 'historical') return rejected(['archival artifacts must retain historical generation'])
    return historicalTranslation(input.artifact, trustedScope)
  }
  if (!['historical', 'current', 'emerging'].includes(input.generation)) {
    return rejected(['device generation is unsupported'])
  }
  const validation = validateMedicalDeviceEvent(input.event)
  if (!validation.accepted) return rejected([...validation.errors, 'device event envelope failed structural validation'])

  const e = input.event as MedicalDeviceEventEnvelope
  if (e.subjectId !== trustedScope.subjectId) {
    return rejected(['device event subject does not match verified subject scope'])
  }
  if (e.encounterId !== undefined && e.encounterId !== trustedScope.encounterId) {
    return rejected(['device event encounter does not match verified encounter scope'])
  }

  const isEmerging = input.generation === 'emerging'
  const explanation: DeviceOsExplanation = {
    sourceId: e.id.trim(),
    subjectId: e.subjectId,
    generation: input.generation,
    truthLane: isEmerging ? 'research-only' : 'device-reported',
    eventType: e.kind,
    sourceRecordedWhen: { precision: 'instant', value: e.provenance.capturedAt },
    ingestedAt: e.provenance.receivedAt,
    sourceReference: e.source.deviceId,
    summary: deviceExplanation(e.kind),
    limits: isEmerging
      ? 'Research-only device metadata. No vendor interoperability or clinical validation is implied.'
      : 'Envelope validity is not device authenticity, interoperability certification, calibrated measurement or clinical interpretation.',
    nextAction: isEmerging ? 'research-review' : 'clinician-review',
    clinicalPublicationEligible: false,
    autonomousDeviceControlEnabled: false,
  }
  return {
    accepted: true,
    disposition: isEmerging ? 'research-only' : 'technical-event',
    errors: [],
    explanation,
  }
}
