import { Buffer } from 'node:buffer'
import { buildEmrBundle } from '../satusehat.js'
import {
  LOCAL_DERIVED_SYSTEM,
  LOINC_SYSTEM,
  OBS_CATEGORY_SYSTEM,
  UCUM_SYSTEM,
  verifiedMetricByKey,
} from './verifiedTerminologyRegistry.js'

const MAX_MESSAGE_BYTES = 128 * 1024
const MAX_SEGMENTS = 256
const MAX_FIELDS = 256
const MAX_FIELD_CHARS = 4096
const RESOURCE_TYPE = /^[A-Z][A-Za-z0-9]{0,63}$/

export interface FhirInspection {
  resourceType: string
  bundleType?: string
  entryCount?: number
  warnings: string[]
  fullValidator: false
}

export interface ObservationBundlePreviewInput {
  patient?: {
    name?: string
    sex?: string
    birthDate?: string
  }
  observedAt?: string
  values?: Record<string, unknown>
}

export interface SatusehatPreviewInput {
  patient?: unknown
  record?: unknown
  practitionerName?: string
  now?: string
  uuids?: readonly string[]
}

export interface Hl7PreviewSegment {
  type: 'MSH' | 'PID' | 'PV1' | 'OBR' | 'OBX'
  fields: readonly string[]
  index: number
}

export interface Hl7Preview {
  separators: {
    field: string
    component: string
    repetition: string
    escape: string
    subcomponent: string
  }
  messageType?: string
  version?: string
  segments: readonly Hl7PreviewSegment[]
  warnings: readonly string[]
}

export interface Hl7UnmappedCoding {
  segmentIndex: number
  code: string
  codeSystem: string
  text?: string
}

function asObject(value: unknown, field = 'input'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object`)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, max = 500): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : ''
}

function validDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? undefined : value
}

function normalizedInstant(value: unknown): string {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return new Date().toISOString()
  return new Date(value).toISOString()
}

function fhirGender(value: unknown): 'male' | 'female' | 'unknown' {
  const normalized = text(value, 32).toLowerCase()
  if (['f', 'female', 'perempuan', 'wanita', 'p'].includes(normalized)) return 'female'
  if (['m', 'male', 'l', 'laki-laki', 'laki', 'pria'].includes(normalized)) return 'male'
  return 'unknown'
}

export function inspectFhirResource(input: unknown): FhirInspection {
  const resource = asObject(input, 'resource')
  const resourceType = text(resource.resourceType, 64)
  if (!RESOURCE_TYPE.test(resourceType)) throw new Error('resourceType must be a syntactically valid FHIR resource type')

  const warnings: string[] = [
    'Structural inspection only; this is not full FHIR profile, terminology, cardinality, or invariant validation.',
  ]
  if (resourceType !== 'Bundle') {
    return { resourceType, warnings, fullValidator: false }
  }

  const bundleType = text(resource.type, 64) || undefined
  const entries = Array.isArray(resource.entry) ? resource.entry : []
  if (!bundleType) warnings.push('Bundle.type is missing or blank.')
  if (!Array.isArray(resource.entry)) warnings.push('Bundle.entry is absent or not an array.')

  return {
    resourceType,
    bundleType,
    entryCount: entries.length,
    warnings,
    fullValidator: false,
  }
}

export function buildObservationBundlePreview(input: ObservationBundlePreviewInput) {
  const values = input.values && typeof input.values === 'object' && !Array.isArray(input.values)
    ? input.values
    : {}
  const patient = input.patient ?? {}
  const effectiveDateTime = normalizedInstant(input.observedAt)
  const patientId = 'panaceamed-preview-patient'
  const entries: Array<Record<string, unknown>> = []

  entries.push({
    fullUrl: `urn:uuid:${patientId}`,
    resource: {
      resourceType: 'Patient',
      id: patientId,
      name: text(patient.name, 200) ? [{ text: text(patient.name, 200) }] : undefined,
      gender: fhirGender(patient.sex),
      birthDate: validDate(patient.birthDate),
    },
  })

  for (const [key, raw] of Object.entries(values)) {
    if (typeof raw !== 'number' || !Number.isFinite(raw)) continue
    const term = verifiedMetricByKey(key)
    if (!term) continue

    const observationId = `preview-${term.key}`
    const resource: Record<string, unknown> = {
      resourceType: 'Observation',
      id: observationId,
      status: 'final',
      category: [{
        coding: [{
          system: OBS_CATEGORY_SYSTEM,
          code: term.category,
          display: term.category,
        }],
      }],
      code: {
        coding: [{
          system: term.system,
          code: term.code,
          display: term.display,
        }],
        text: term.display,
      },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime,
      valueQuantity: {
        value: raw,
        unit: term.unit,
        system: UCUM_SYSTEM,
        code: term.ucum,
      },
    }
    if (term.note) resource.note = [{ text: term.note }]
    entries.push({ fullUrl: `urn:uuid:${observationId}`, resource })
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: effectiveDateTime,
    entry: entries,
  }
}

function deterministicUuidFactory(uuids: readonly string[] | undefined): (() => string) | undefined {
  if (!uuids?.length) return undefined
  const cleaned = uuids
    .map((value) => text(value, 64))
    .filter((value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
  if (!cleaned.length) throw new Error('uuids must contain valid UUID values when provided')
  let index = 0
  return () => {
    if (index >= cleaned.length) throw new Error('not enough deterministic uuids supplied for SATUSEHAT preview')
    const value = cleaned[index]
    index += 1
    return value
  }
}

export function buildSatusehatPreview(input: SatusehatPreviewInput) {
  const now = input.now && !Number.isNaN(Date.parse(input.now)) ? new Date(input.now) : undefined
  const uuid = deterministicUuidFactory(input.uuids)
  const bundle = buildEmrBundle(
    input.patient ?? {},
    input.record ?? {},
    text(input.practitionerName, 200),
    { now, uuid },
  )

  const resources = Array.isArray(bundle.entry) ? bundle.entry : []
  const count = (kind: string) => resources.filter((entry: any) => entry?.resource?.resourceType === kind).length
  return {
    bundle,
    summary: {
      resources: resources.length,
      patients: count('Patient'),
      encounters: count('Encounter'),
      conditions: count('Condition'),
      observations: count('Observation'),
    },
    networkSubmission: false as const,
    boundary: 'Preview only. This function never calls SATUSEHAT OAuth or resource submission.',
  }
}

const SUPPORTED_SEGMENTS = new Set(['MSH', 'PID', 'PV1', 'OBR', 'OBX'])

export function parseHl7v2Preview(message: string): Hl7Preview {
  if (typeof message !== 'string') throw new Error('HL7 message must be a string')
  if (Buffer.byteLength(message, 'utf8') > MAX_MESSAGE_BYTES) {
    throw new Error(`HL7 message too large; maximum is ${MAX_MESSAGE_BYTES} bytes`)
  }

  const lines = message
    .replace(/\r\n/g, '\r')
    .replace(/\n/g, '\r')
    .split('\r')
    .map((line) => line.trimEnd())
    .filter(Boolean)

  if (!lines.length || !lines[0].startsWith('MSH') || lines[0].length < 8) {
    throw new Error('HL7 message must begin with a valid MSH segment')
  }
  if (lines.length > MAX_SEGMENTS) throw new Error(`HL7 message exceeds ${MAX_SEGMENTS} segments`)

  const field = lines[0][3]
  if (!field || /[A-Za-z0-9\r\n]/.test(field)) throw new Error('MSH-1 field separator is invalid')
  const mshFields = lines[0].split(field)
  const encoding = mshFields[1] ?? ''
  if (encoding.length < 4) throw new Error('MSH-2 encoding characters are incomplete')

  const separators = {
    field,
    component: encoding[0],
    repetition: encoding[1],
    escape: encoding[2],
    subcomponent: encoding[3],
  }
  const warnings: string[] = []
  const segments: Hl7PreviewSegment[] = []

  lines.forEach((line, index) => {
    const fields = line.split(field)
    const type = fields[0]
    if (fields.length - 1 > MAX_FIELDS) throw new Error(`HL7 segment ${type || index + 1} exceeds ${MAX_FIELDS} fields`)
    for (const value of fields.slice(1)) {
      if (value.length > MAX_FIELD_CHARS) throw new Error(`HL7 field in segment ${type || index + 1} exceeds ${MAX_FIELD_CHARS} characters`)
    }

    if (!SUPPORTED_SEGMENTS.has(type)) {
      warnings.push(`Unsupported segment ${type || '(blank)'} at index ${index}; preserved only as a warning.`)
      return
    }
    segments.push({ type: type as Hl7PreviewSegment['type'], fields, index })
  })

  const msh = segments.find((segment) => segment.type === 'MSH')
  return {
    separators,
    messageType: msh?.fields[8] || undefined,
    version: msh?.fields[11] || undefined,
    segments,
    warnings,
  }
}

function components(value: string | undefined, separator: string): string[] {
  return typeof value === 'string' ? value.split(separator) : []
}

function hl7BirthDate(value: string | undefined): string | undefined {
  if (!value || !/^\d{8}$/.test(value)) return undefined
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  return validDate(iso)
}

export function hl7v2ToFhirPreview(message: string) {
  const parsed = parseHl7v2Preview(message)
  const component = parsed.separators.component
  const entry: Array<{ resource: Record<string, unknown> }> = []
  const mapped: Array<{ segmentIndex: number; code: string; system: string }> = []
  const unmapped: Hl7UnmappedCoding[] = []

  const pid = parsed.segments.find((segment) => segment.type === 'PID')
  if (pid) {
    const nameParts = components(pid.fields[5], component)
    const mrnParts = components(pid.fields[3], component)
    const gender = text(pid.fields[8], 16)
    entry.push({
      resource: {
        resourceType: 'Patient',
        identifier: mrnParts[0] ? [{ value: mrnParts[0] }] : undefined,
        name: nameParts.some(Boolean)
          ? [{ family: nameParts[0] || undefined, given: nameParts.slice(1).filter(Boolean) }]
          : undefined,
        birthDate: hl7BirthDate(pid.fields[7]),
        gender: gender ? fhirGender(gender) : undefined,
      },
    })
  }

  for (const segment of parsed.segments.filter((item) => item.type === 'OBX')) {
    const valueType = text(segment.fields[2], 16).toUpperCase()
    const identifier = components(segment.fields[3], component)
    const code = text(identifier[0], 128)
    const display = text(identifier[1], 300)
    const sourceSystem = text(identifier[2], 128)
    const rawValue = segment.fields[5] ?? ''
    const unitParts = components(segment.fields[6], component)
    const explicitLoinc = sourceSystem.toUpperCase() === 'LN' || sourceSystem.toUpperCase() === 'LOINC'
    const coding = code && explicitLoinc
      ? [{ system: LOINC_SYSTEM, code, display: display || undefined }]
      : undefined

    if (code && explicitLoinc) {
      mapped.push({ segmentIndex: segment.index, code, system: LOINC_SYSTEM })
    } else if (code) {
      unmapped.push({
        segmentIndex: segment.index,
        code,
        codeSystem: sourceSystem,
        text: display || undefined,
      })
    }

    const resource: Record<string, unknown> = {
      resourceType: 'Observation',
      status: 'final',
      code: {
        coding,
        text: display || code || 'Unmapped HL7 observation',
      },
    }

    if (valueType === 'NM') {
      const numeric = Number(rawValue)
      if (Number.isFinite(numeric)) {
        const ucumDeclared = (unitParts[2] ?? '').toUpperCase() === 'UCUM'
        resource.valueQuantity = {
          value: numeric,
          unit: text(unitParts[1] || unitParts[0], 128) || undefined,
          system: ucumDeclared ? UCUM_SYSTEM : undefined,
          code: text(unitParts[0], 64) || undefined,
        }
      } else {
        resource.valueString = rawValue
      }
    } else {
      resource.valueString = rawValue
    }

    entry.push({ resource })
  }

  return {
    bundle: { resourceType: 'Bundle', type: 'collection', entry },
    mapped,
    unmapped,
    warnings: [
      ...parsed.warnings,
      'Preview conversion supports only bounded PID demographics and OBX observations; unsupported semantics remain unmapped.',
    ],
    networkSubmission: false as const,
  }
}

export function fhirMcpCapabilities() {
  return {
    fhirVersion: 'R4',
    structuralInspection: true,
    fullValidation: false,
    satusehatPreviewOnly: true,
    hl7v2: {
      supportedSegments: [...SUPPORTED_SEGMENTS],
      maxMessageBytes: MAX_MESSAGE_BYTES,
      maxSegments: MAX_SEGMENTS,
      conversion: 'partial-preview-only',
    },
    codingBoundary: {
      explicitLoincOnly: true,
      localDerivedSystem: LOCAL_DERIVED_SYSTEM,
      guessedCrosswalks: false,
    },
    networkSubmission: false,
  }
}
