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

function sanitiseIdentifier(value: string, maxLength: number): string {
  const trimmed = value.trim().slice(0, maxLength)
  return SLUG.test(trimmed) ? trimmed : ''
}

export function sanitisePanaceaEvent(input: PanaceaEventEnvelope): PanaceaEventEnvelope {
  const clean: Record<string, string | number | boolean | null> = {}

  for (const [key, raw] of Object.entries(input.properties).slice(0, MAX_PROPERTIES)) {
    if (!isAllowedPanaceaEventPropertyKey(key)) continue
    if (typeof raw === 'string') clean[key] = raw.slice(0, MAX_TEXT)
    else if (typeof raw === 'number') clean[key] = Number.isFinite(raw) ? raw : null
    else clean[key] = raw
  }

  return {
    ...input,
    eventName: sanitiseIdentifier(input.eventName, MAX_EVENT_NAME),
    sessionId: input.sessionId ? sanitiseIdentifier(input.sessionId, MAX_SESSION_ID) || null : null,
    featureId: input.featureId ? sanitiseIdentifier(input.featureId, MAX_FEATURE_ID) || null : null,
    properties: clean,
  }
}

export function validatePanaceaEvent(event: PanaceaEventEnvelope): string[] {
  const problems: string[] = []
  if (event.schemaVersion !== 1) problems.push('unsupported schema version')
  if (!event.eventName.trim()) problems.push('missing event name')
  if (!SLUG.test(event.eventName)) problems.push('invalid event name')
  if (event.featureId && !SLUG.test(event.featureId)) problems.push('invalid feature id')
  if (event.sessionId && !SLUG.test(event.sessionId)) problems.push('invalid session id')
  if (Number.isNaN(Date.parse(event.occurredAt))) problems.push('invalid occurredAt')
  if (Object.keys(event.properties).length > MAX_PROPERTIES) problems.push('too many properties')
  for (const key of Object.keys(event.properties)) {
    if (!isAllowedPanaceaEventPropertyKey(key)) problems.push(`disallowed property key: ${key}`)
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
