import { Buffer } from 'node:buffer'
import { buildEmrBundle } from '../satusehat.js'

const MAX_HL7_BYTES = 128 * 1024
const MAX_HL7_SEGMENTS = 256
const MAX_HL7_FIELDS = 256
const MAX_HL7_FIELD_CHARS = 4096
const SAFE_FHIR_RESOURCE_TYPE = /^[A-Z][A-Za-z0-9]{0,63}$/

type FhirResource = Record<string, any>

export interface FhirInspection {
  resourceType: string
  bundleType?: string
  entryCount?: number
  warnings: string[]
  fullValidator: false
}

export interface ObservationBundlePreviewInput {
  patient?: { name?: string; sex?: string; birthDate?: string }
  observedAt?: string
  values?: Record<string, unknown>
}

const OBSERVATION_CODES: Readonly<Record<string, {
  system: string
  code: string
  display: string
  unit?: string
  unitSystem?: string
  unitCode?: string
}>> = {
  weightKg: { system: 'http://loinc.org', code: '29463-7', display: 'Body weight', unit: 'kg', unitSystem: 'http://unitsofmeasure.org', unitCode: 'kg' },
  systolic: { system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure', unit: 'mmHg', unitSystem: 'http://unitsofmeasure.org', unitCode: 'mm[Hg]' },
  diastolic: { system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure', unit: 'mmHg', unitSystem: 'http://unitsofmeasure.org', unitCode: 'mm[Hg]' },
  heartRate: { system: 'http://loinc.org', code: '8867-4', display: 'Heart rate', unit: '/min', unitSystem: 'http://unitsofmeasure.org', unitCode: '/min' },
  respiratoryRate: { system: 'http://loinc.org', code: '9279-1', display: 'Respiratory rate', unit: '/min', unitSystem: 'http://unitsofmeasure.org', unitCode: '/min' },
  temperatureC: { system: 'http://loinc.org', code: '8310-5', display: 'Body temperature', unit: '°C', unitSystem: 'http://unitsofmeasure.org', unitCode: 'Cel' },
  spo2: { system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation', unit: '%', unitSystem: 'http://unitsofmeasure.org', unitCode: '%' },
  phenoAge: { system: 'https://panaceamed.id/fhir/CodeSystem/derived', code: 'phenoAge', display: 'Phenotypic age', unit: 'years' },
}

function finiteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

function cleanText(value: unknown, max = MAX_HL7_FIELD_CHARS): string {
  return typeof value === 'string' ? value.replace(/[\u0000]/g, '').trim().slice(0, max) : ''
}

function fhirGender(value: unknown): 'male' | 'female' | 'unknown' {
  const normalized = cleanText(value, 32).toLowerCase()
  if (['f', 'female', 'p', 'perempuan', 'wanita'].includes(normalized)) return 'female'
  if (['m', 'male', 'l', 'laki', 'laki-laki', 'pria'].includes(normalized)) return 'male'
  return 'unknown'
}

function validDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : undefined
}

export function inspectFhirResource(input: unknown): FhirInspection {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('FHIR resource must be an object')
  const resource = input as FhirResource
  if (typeof resource.resourceType !== 'string' || !SAFE_FHIR_RESOURCE_TYPE.test(resource.resourceType)) {
    throw new Error('FHIR resourceType must be a safe syntactic resource type')
  }
  const warnings: string[] = []
  const result: FhirInspection = { resourceType: resource.resourceType, warnings, fullValidator: false }
  if (resource.resourceType === 'Bundle') {
    if (typeof resource.type === 'string') result.bundleType = resource.type
    if (Array.isArray(resource.entry)) result.entryCount = resource.entry.length
    else if (resource.entry !== undefined) warnings.push('Bundle.entry is not an array')
  }
  return result
}

export function fhirPreviewCapabilities() {
  return {
    fhirVersion: 'R4-preview',
    fullValidator: false as const,
    networkSubmission: false as const,
    patientDatastoreRetrieval: false as const,
    supported: [
      'structural-resource-inspection',
      'bounded-observation-bundle-preview',
      'satusehat-transaction-bundle-preview',
      'bounded-hl7v2-parse-preview',
      'partial-hl7v2-to-fhir-preview',
    ] as const,
  }
}

export function buildObservationBundlePreview(input: ObservationBundlePreviewInput): FhirResource {
  const values = input.values && typeof input.values === 'object' ? input.values : {}
  const observedAt = typeof input.observedAt === 'string' && !Number.isNaN(Date.parse(input.observedAt))
    ? new Date(input.observedAt).toISOString()
    : undefined
  const patientRef = 'urn:uuid:panacea-preview-patient'
  const entry: Array<{ fullUrl?: string; resource: FhirResource }> = [{
    fullUrl: patientRef,
    resource: {
      resourceType: 'Patient',
      name: cleanText(input.patient?.name, 200) ? [{ text: cleanText(input.patient?.name, 200) }] : undefined,
      gender: fhirGender(input.patient?.sex),
      birthDate: validDate(input.patient?.birthDate),
    },
  }]

  for (const [key, definition] of Object.entries(OBSERVATION_CODES)) {
    const value = finiteNumber(values[key])
    if (value === null) continue
    entry.push({
      resource: {
        resourceType: 'Observation',
        status: 'final',
        code: { coding: [{ system: definition.system, code: definition.code, display: definition.display }], text: definition.display },
        subject: { reference: patientRef },
        effectiveDateTime: observedAt,
        valueQuantity: {
          value,
          unit: definition.unit,
          system: definition.unitSystem,
          code: definition.unitCode,
        },
      },
    })
  }
  return { resourceType: 'Bundle', type: 'collection', entry }
}

export function buildSatusehatPreview(input: {
  patient: any
  record: any
  practitionerName?: string
  now?: string
  uuids?: string[]
}) {
  if (!input || typeof input !== 'object') throw new Error('SATUSEHAT preview input must be an object')
  const supplied = Array.isArray(input.uuids) ? input.uuids.filter((value) => typeof value === 'string' && value.trim()) : []
  let uuidIndex = 0
  const now = typeof input.now === 'string' && !Number.isNaN(Date.parse(input.now)) ? new Date(input.now) : undefined
  const bundle = buildEmrBundle(input.patient ?? {}, input.record ?? {}, cleanText(input.practitionerName, 200), {
    now,
    uuid: supplied.length ? () => supplied[uuidIndex++] ?? `preview-${uuidIndex}` : undefined,
  })
  const resources = Array.isArray(bundle.entry) ? bundle.entry : []
  return {
    bundle,
    summary: {
      resources: resources.length,
      conditions: resources.filter((entry: any) => entry.resource?.resourceType === 'Condition').length,
      observations: resources.filter((entry: any) => entry.resource?.resourceType === 'Observation').length,
    },
    networkSubmission: false as const,
    fullFhirValidation: false as const,
    identityReconciliationComplete: false as const,
  }
}

export interface Hl7Separators {
  field: string
  component: string
  repetition: string
  escape: string
  subcomponent: string
}

export interface Hl7PreviewSegment {
  type: 'MSH' | 'PID' | 'PV1' | 'OBR' | 'OBX'
  fields: string[]
}

export interface Hl7Preview {
  separators: Hl7Separators
  segments: Hl7PreviewSegment[]
  warnings: string[]
  unsupportedSegments: string[]
}

const SUPPORTED_SEGMENTS = new Set(['MSH', 'PID', 'PV1', 'OBR', 'OBX'])

function normalizeHl7Segments(message: string): string[] {
  if (typeof message !== 'string') throw new Error('HL7 message must be a string')
  if (Buffer.byteLength(message, 'utf8') > MAX_HL7_BYTES) throw new Error('HL7 message is too large')
  const segments = message.split(/\r\n|\n|\r/).map((segment) => segment.trimEnd()).filter(Boolean)
  if (!segments.length || !segments[0].startsWith('MSH')) throw new Error('HL7 message must start with MSH')
  if (segments.length > MAX_HL7_SEGMENTS) throw new Error('HL7 message has too many segments')
  return segments
}

export function parseHl7v2Preview(message: string): Hl7Preview {
  const rawSegments = normalizeHl7Segments(message)
  const msh = rawSegments[0]
  const field = msh.charAt(3)
  if (!field || /[A-Za-z0-9\r\n]/.test(field)) throw new Error('HL7 MSH-1 field separator is invalid')
  const mshFields = msh.split(field)
  const encoding = mshFields[1] ?? ''
  if (encoding.length < 4) throw new Error('HL7 MSH-2 encoding characters are incomplete')
  const separators: Hl7Separators = {
    field,
    component: encoding[0],
    repetition: encoding[1],
    escape: encoding[2],
    subcomponent: encoding[3],
  }
  const segments: Hl7PreviewSegment[] = []
  const warnings: string[] = []
  const unsupportedSegments: string[] = []
  for (const raw of rawSegments) {
    const fields = raw.split(field)
    if (fields.length > MAX_HL7_FIELDS) throw new Error('HL7 segment has too many fields')
    if (fields.some((value) => value.length > MAX_HL7_FIELD_CHARS)) throw new Error('HL7 field is too large')
    const type = fields[0]
    if (!SUPPORTED_SEGMENTS.has(type)) {
      unsupportedSegments.push(type)
      warnings.push(`Unsupported HL7 segment preserved only as a warning: ${type}`)
      continue
    }
    segments.push({ type: type as Hl7PreviewSegment['type'], fields })
  }
  return { separators, segments, warnings, unsupportedSegments }
}

function components(value: string | undefined, separator: string): string[] {
  return (value ?? '').split(separator)
}

function hl7Date(value: string | undefined): string | undefined {
  if (!value || !/^\d{8}$/.test(value)) return undefined
  const date = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  return validDate(date)
}

export function hl7v2ToFhirPreview(message: string) {
  const parsed = parseHl7v2Preview(message)
  const { component } = parsed.separators
  const entry: Array<{ resource: FhirResource }> = []
  const mapped: Array<Record<string, unknown>> = []
  const unmapped: Array<Record<string, unknown>> = []
  const pid = parsed.segments.find((segment) => segment.type === 'PID')

  if (pid) {
    const identifierParts = components(pid.fields[3], component)
    const nameParts = components(pid.fields[5], component)
    const patient: FhirResource = {
      resourceType: 'Patient',
      identifier: identifierParts[0] ? [{ value: identifierParts[0], assigner: identifierParts[3] ? { display: identifierParts[3] } : undefined }] : undefined,
      name: (nameParts[0] || nameParts[1]) ? [{ family: nameParts[0] || undefined, given: nameParts[1] ? [nameParts[1]] : undefined }] : undefined,
      birthDate: hl7Date(pid.fields[7]),
      gender: fhirGender(pid.fields[8]),
    }
    entry.push({ resource: patient })
    mapped.push({ segment: 'PID', resourceType: 'Patient' })
  }

  for (const segment of parsed.segments.filter((item) => item.type === 'OBX')) {
    const codeParts = components(segment.fields[3], component)
    const valueType = (segment.fields[2] ?? '').toUpperCase()
    const value = segment.fields[5] ?? ''
    const unitParts = components(segment.fields[6], component)
    const sourceSystem = (codeParts[2] ?? '').trim()
    const explicitLoinc = /^(LN|LOINC)$/i.test(sourceSystem)
    const code = cleanText(codeParts[0], 128)
    const display = cleanText(codeParts[1], 500)
    const observation: FhirResource = {
      resourceType: 'Observation',
      status: 'final',
      code: explicitLoinc && code
        ? { coding: [{ system: 'http://loinc.org', code, display: display || undefined }], text: display || undefined }
        : { text: display || code || 'Unmapped observation' },
    }
    const numeric = valueType === 'NM' ? Number(value) : Number.NaN
    if (valueType === 'NM' && Number.isFinite(numeric)) {
      observation.valueQuantity = {
        value: numeric,
        unit: cleanText(unitParts[1] || unitParts[0], 64) || undefined,
        system: /^(UCUM)$/i.test(unitParts[2] ?? '') ? 'http://unitsofmeasure.org' : undefined,
        code: /^(UCUM)$/i.test(unitParts[2] ?? '') ? cleanText(unitParts[0], 64) || undefined : undefined,
      }
    } else {
      observation.valueString = cleanText(value)
    }
    entry.push({ resource: observation })
    if (explicitLoinc && code) {
      mapped.push({ segment: 'OBX', resourceType: 'Observation', system: 'http://loinc.org', code })
    } else {
      unmapped.push({
        segment: 'OBX',
        code,
        codeSystem: sourceSystem || 'unspecified',
        display: display || undefined,
        preserved: true,
      })
    }
  }

  return {
    bundle: { resourceType: 'Bundle', type: 'collection', entry },
    mapped,
    unmapped,
    warnings: parsed.warnings,
    partialConversion: true as const,
    networkSubmission: false as const,
  }
}
