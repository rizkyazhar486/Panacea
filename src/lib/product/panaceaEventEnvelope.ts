export type PanaceaEventArea =
  | 'home'
  | 'today'
  | 'training'
  | 'notifications'
  | 'discovery'
  | 'library'
  | 'body'
  | 'radiology'
  | 'brand'
  | 'integration'

export type PanaceaEventSource = 'user' | 'system' | 'integration'

export interface PanaceaEventEnvelope {
  schemaVersion: 1
  eventName: string
  area: PanaceaEventArea
  occurredAt: string
  sessionId: string | null
  featureId: string | null
  source: PanaceaEventSource
  properties: Record<string, string | number | boolean | null>
}

const MAX_PROPERTIES = 24
const MAX_TEXT = 160
const MAX_EVENT_NAME = 80
const MAX_FEATURE_ID = 100
const MAX_SESSION_ID = 80
const SLUG = /^[a-z0-9][a-z0-9._:-]*$/i
const ISO_8601_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/
const EVENT_AREAS = new Set<PanaceaEventArea>([
  'home',
  'today',
  'training',
  'notifications',
  'discovery',
  'library',
  'body',
  'radiology',
  'brand',
  'integration',
])
const EVENT_SOURCES = new Set<PanaceaEventSource>(['user', 'system', 'integration'])
const EVENT_FIELDS = new Set([
  'schemaVersion',
  'eventName',
  'area',
  'occurredAt',
  'sessionId',
  'featureId',
  'source',
  'properties',
])

const ALLOWED_PROPERTY_KEYS = new Set([
  'route',
  'surface',
  'mode',
  'action',
  'status',
  'result',
  'variant',
  'tab',
  'view',
  'step',
  'entryPoint',
  'capability',
  'deviceClass',
  'networkState',
  'count',
  'durationMs',
  'retryCount',
  'errorCode',
])

export function isAllowedPanaceaEventPropertyKey(key: string): boolean {
  return ALLOWED_PROPERTY_KEYS.has(key)
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function sanitiseIdentifier(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim().slice(0, maxLength)
  return SLUG.test(trimmed) ? trimmed : ''
}

function validIso(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = ISO_8601_TIMESTAMP.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const offsetHour = match[7] === undefined ? 0 : Number(match[7])
  const offsetMinute = match[8] === undefined ? 0 : Number(match[8])
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  if (month < 1 || month > 12) return false
  if (day < 1 || day > (daysInMonth[month - 1] ?? 0)) return false
  if (hour > 23 || minute > 59 || second > 59) return false
  if (offsetHour > 14 || offsetMinute > 59) return false
  if (offsetHour === 14 && offsetMinute !== 0) return false
  return Number.isFinite(Date.parse(value))
}

function allowedPropertyValue(value: unknown): value is string | number | boolean | null {
  return value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
}

export function sanitisePanaceaEvent(input: PanaceaEventEnvelope): PanaceaEventEnvelope {
  const clean: Record<string, string | number | boolean | null> = {}
  const properties = asRecord((input as unknown as Record<string, unknown>).properties)

  for (const [key, raw] of Object.entries(properties ?? {}).slice(0, MAX_PROPERTIES)) {
    if (!isAllowedPanaceaEventPropertyKey(key) || !allowedPropertyValue(raw)) continue
    if (typeof raw === 'string') clean[key] = raw.slice(0, MAX_TEXT)
    else clean[key] = raw
  }

  // Construct the canonical envelope explicitly. Never spread untrusted input:
  // unknown top-level keys may contain identifiers or clinical free text.
  return {
    schemaVersion: input.schemaVersion,
    eventName: sanitiseIdentifier(input.eventName, MAX_EVENT_NAME),
    area: input.area,
    occurredAt: input.occurredAt,
    sessionId: input.sessionId ? sanitiseIdentifier(input.sessionId, MAX_SESSION_ID) || null : null,
    featureId: input.featureId ? sanitiseIdentifier(input.featureId, MAX_FEATURE_ID) || null : null,
    source: input.source,
    properties: clean,
  }
}

export function validatePanaceaEvent(event: unknown): string[] {
  const problems: string[] = []
  const record = asRecord(event)
  if (!record) return ['event must be an object']

  for (const key of Object.keys(record)) {
    if (!EVENT_FIELDS.has(key)) problems.push(`unsupported event field: ${key}`)
  }

  if (record.schemaVersion !== 1) problems.push('unsupported schema version')

  if (typeof record.eventName !== 'string' || !record.eventName.trim()) {
    problems.push('missing event name')
  } else {
    if (record.eventName.length > MAX_EVENT_NAME || !SLUG.test(record.eventName)) problems.push('invalid event name')
  }

  if (!EVENT_AREAS.has(record.area as PanaceaEventArea)) problems.push('invalid area')
  if (!EVENT_SOURCES.has(record.source as PanaceaEventSource)) problems.push('invalid source')
  if (!validIso(record.occurredAt)) problems.push('invalid occurredAt')

  if (record.featureId !== null) {
    if (typeof record.featureId !== 'string'
      || record.featureId.length > MAX_FEATURE_ID
      || !SLUG.test(record.featureId)) {
      problems.push('invalid feature id')
    }
  }
  if (record.sessionId !== null) {
    if (typeof record.sessionId !== 'string'
      || record.sessionId.length > MAX_SESSION_ID
      || !SLUG.test(record.sessionId)) {
      problems.push('invalid session id')
    }
  }

  const properties = asRecord(record.properties)
  if (!properties) {
    problems.push('properties must be an object')
    return problems
  }
  if (Object.keys(properties).length > MAX_PROPERTIES) problems.push('too many properties')
  for (const [key, value] of Object.entries(properties)) {
    if (!isAllowedPanaceaEventPropertyKey(key)) {
      problems.push(`disallowed property key: ${key}`)
      continue
    }
    if (!allowedPropertyValue(value)) {
      problems.push(`invalid property value: ${key}`)
      continue
    }
    if (typeof value === 'string' && value.length > MAX_TEXT) {
      problems.push(`property value too long: ${key}`)
    }
  }
  return problems
}

export function featureFactoryEvent(
  featureId: string,
  eventName: string,
  area: PanaceaEventArea,
  occurredAt: string,
): PanaceaEventEnvelope {
  return sanitisePanaceaEvent({
    schemaVersion: 1,
    eventName,
    area,
    occurredAt,
    sessionId: null,
    featureId,
    source: 'system',
    properties: {},
  })
}

export const PANACEA_EVENT_BOUNDARY =
  'Product analytics events are operational telemetry, not a clinical record. Only allowlisted operational keys are accepted. Do not place patient identifiers, symptoms, diagnoses, medications, measurements, free-text notes, or other sensitive health content in this envelope.'
