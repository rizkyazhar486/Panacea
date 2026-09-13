export type PanaceaEventArea = 'home' | 'today' | 'training' | 'notifications' | 'discovery' | 'library' | 'body' | 'radiology' | 'brand' | 'integration'

export interface PanaceaEventEnvelope {
  schemaVersion: 1
  eventName: string
  area: PanaceaEventArea
  occurredAt: string
  sessionId: string | null
  featureId: string | null
  source: 'user' | 'system' | 'integration'
  properties: Record<string, string | number | boolean | null>
}

const DISALLOWED_KEYS = [/name/i, /email/i, /phone/i, /address/i, /diagnos/i, /symptom/i, /medication/i, /patient/i, /dob/i, /birth/i]
const MAX_PROPERTIES = 24
const MAX_TEXT = 160

export function sanitisePanaceaEvent(input: PanaceaEventEnvelope): PanaceaEventEnvelope {
  const clean: Record<string, string | number | boolean | null> = {}
  for (const [key, raw] of Object.entries(input.properties).slice(0, MAX_PROPERTIES)) {
    if (DISALLOWED_KEYS.some((pattern) => pattern.test(key))) continue
    if (typeof raw === 'string') clean[key] = raw.slice(0, MAX_TEXT)
    else if (typeof raw === 'number') clean[key] = Number.isFinite(raw) ? raw : null
    else clean[key] = raw
  }
  return {
    ...input,
    eventName: input.eventName.trim().slice(0, 80),
    sessionId: input.sessionId?.slice(0, 80) ?? null,
    featureId: input.featureId?.slice(0, 100) ?? null,
    properties: clean,
  }
}

export function validatePanaceaEvent(event: PanaceaEventEnvelope): string[] {
  const problems: string[] = []
  if (event.schemaVersion !== 1) problems.push('unsupported schema version')
  if (!event.eventName.trim()) problems.push('missing event name')
  if (Number.isNaN(Date.parse(event.occurredAt))) problems.push('invalid occurredAt')
  if (Object.keys(event.properties).length > MAX_PROPERTIES) problems.push('too many properties')
  for (const key of Object.keys(event.properties)) {
    if (DISALLOWED_KEYS.some((pattern) => pattern.test(key))) problems.push(`disallowed property key: ${key}`)
  }
  return problems
}

export function featureFactoryEvent(featureId: string, eventName: string, area: PanaceaEventArea, occurredAt: string): PanaceaEventEnvelope {
  return {
    schemaVersion: 1,
    eventName,
    area,
    occurredAt,
    sessionId: null,
    featureId,
    source: 'system',
    properties: {},
  }
}

export const PANACEA_EVENT_BOUNDARY = 'Product analytics events are operational telemetry, not a clinical record. Do not place patient identifiers, symptoms, diagnoses, medication details, free-text notes, or other sensitive health content in this envelope.'
