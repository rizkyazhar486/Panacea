// SATUSEHAT integration scaffold (Kemenkes — national health data platform).
//
// This module intentionally remains conservative: it only performs network I/O
// when credentials are configured, keeps OAuth secrets server-side, validates
// outbound FHIR resource type paths, bounds external requests with timeouts,
// and never fabricates demographic/vital data when the local record is missing
// or malformed.

import { randomUUID } from 'node:crypto'

const ENV = process.env.SATUSEHAT_ENV || 'sandbox'
const BASE = ENV === 'production'
  ? 'https://api-satusehat.kemkes.go.id'
  : 'https://api-satusehat-stg.dto.kemkes.go.id'
const AUTH_URL = `${BASE}/oauth2/v1/accesstoken?grant_type=client_credentials`
const FHIR_BASE = `${BASE}/fhir-r4/v1`
const AUTH_TIMEOUT_MS = 8_000
const FHIR_TIMEOUT_MS = 12_000
const MAX_TEXT = 500
const MAX_NOTE_TEXT = 2_000
const MAX_ITEMS_PER_KIND = 200

type FetchLike = typeof fetch

export function isConfigured(): boolean {
  return Boolean(process.env.SATUSEHAT_CLIENT_ID && process.env.SATUSEHAT_CLIENT_SECRET)
}

let token: { value: string; exp: number } | null = null

function cleanText(value: unknown, max = MAX_TEXT): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

function validBirthDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString().slice(0, 10) === value ? value : undefined
}

function fhirGender(value: unknown): 'male' | 'female' | 'unknown' {
  const normalized = cleanText(value, 32).toLowerCase()
  if (['p', 'female', 'perempuan', 'wanita'].includes(normalized)) return 'female'
  if (['l', 'male', 'laki', 'laki-laki', 'pria'].includes(normalized)) return 'male'
  return 'unknown'
}

function validateResourceType(resourceType: string): string {
  const normalized = cleanText(resourceType, 64)
  if (!/^[A-Z][A-Za-z0-9]{0,63}$/.test(normalized)) throw new Error('satusehat_invalid_resource_type')
  return normalized
}

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

// Obtain (and cache) an OAuth2 access token from SATUSEHAT. Injected fetches
// bypass the runtime cache so deterministic tests cannot poison production state.
export async function getAccessToken(fetchImpl: FetchLike = fetch): Promise<string> {
  if (!isConfigured()) throw new Error('satusehat_not_configured')
  const useRuntimeCache = fetchImpl === fetch
  if (useRuntimeCache && token && Date.now() < token.exp) return token.value

  const body = new URLSearchParams({
    client_id: process.env.SATUSEHAT_CLIENT_ID as string,
    client_secret: process.env.SATUSEHAT_CLIENT_SECRET as string,
  })
  const r = await fetchImpl(AUTH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  })
  if (!r.ok) throw new Error(`satusehat_auth_${r.status}`)

  const data = (await r.json()) as { access_token?: unknown; expires_in?: unknown }
  const value = typeof data.access_token === 'string' ? data.access_token.trim() : ''
  const expiresIn = Number(data.expires_in)
  if (!value || !Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error('satusehat_auth_invalid_payload')

  if (useRuntimeCache) {
    const usableSeconds = Math.max(5, expiresIn - 60)
    token = { value, exp: Date.now() + usableSeconds * 1000 }
  }
  return value
}

// Generic FHIR resource POST. `resourceType` is path-validated before any auth
// or network request so arbitrary path injection cannot reach the upstream API.
export async function postResource(
  resourceType: string,
  resource: unknown,
  fetchImpl: FetchLike = fetch,
): Promise<unknown> {
  const type = validateResourceType(resourceType)
  if (!resource || typeof resource !== 'object') throw new Error('satusehat_invalid_resource')
  const declaredType = cleanText((resource as { resourceType?: unknown }).resourceType, 64)
  if (declaredType && declaredType !== type) throw new Error('satusehat_resource_type_mismatch')

  const t = await getAccessToken(fetchImpl)
  const r = await fetchImpl(`${FHIR_BASE}/${type}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
    body: JSON.stringify(resource),
    signal: AbortSignal.timeout(FHIR_TIMEOUT_MS),
  })
  if (!r.ok) throw new Error(`satusehat_post_${type}_${r.status}`)
  return r.json()
}

export interface BuildEmrOptions {
  now?: Date
  uuid?: () => string
}

// Build a FHIR R4 transaction Bundle from a Panaceamed EMR record.
// Identity reconciliation (NIK/IHS, practitioner IHS, organization/location)
// remains a certification task; this preview uses transaction-local UUID refs.
export function buildEmrBundle(
  patient: any,
  record: any,
  practitionerName: string,
  options: BuildEmrOptions = {},
): any {
  const now = options.now instanceof Date && !Number.isNaN(options.now.getTime())
    ? options.now
    : new Date()
  const uuid = options.uuid ?? randomUUID
  const pRef = `urn:uuid:${uuid()}`
  const eRef = `urn:uuid:${uuid()}`
  const at = now.toISOString()
  const entry: any[] = []

  const patientName = cleanText(patient?.name, 200) || 'Pasien'
  const mrn = cleanText(patient?.mrn, 128)
  entry.push({
    fullUrl: pRef,
    resource: {
      resourceType: 'Patient',
      name: [{ text: patientName }],
      gender: fhirGender(patient?.sex),
      birthDate: validBirthDate(patient?.dob),
      identifier: mrn ? [{ system: 'https://panaceamed.id/mrn', value: mrn }] : undefined,
    },
    request: { method: 'POST', url: 'Patient' },
  })

  const practitioner = cleanText(practitionerName, 200)
  entry.push({
    fullUrl: eRef,
    resource: {
      resourceType: 'Encounter',
      status: 'finished',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
      subject: { reference: pRef, display: patientName },
      participant: practitioner ? [{ individual: { display: practitioner } }] : undefined,
      period: { start: at },
    },
    request: { method: 'POST', url: 'Encounter' },
  })

  const problems = Array.isArray(record?.problems) ? record.problems.slice(0, MAX_ITEMS_PER_KIND) : []
  for (const p of problems) {
    const title = cleanText(p?.title, 500)
    if (!title) continue
    const assessment = cleanText(p?.assessment, MAX_NOTE_TEXT)
    entry.push({
      resource: {
        resourceType: 'Condition',
        subject: { reference: pRef },
        encounter: { reference: eRef },
        code: { text: title },
        note: assessment ? [{ text: assessment }] : undefined,
      },
      request: { method: 'POST', url: 'Condition' },
    })
  }

  const vitals = Array.isArray(record?.vitals) ? record.vitals.slice(0, MAX_ITEMS_PER_KIND) : []
  for (const v of vitals) {
    const value = finiteNumber(v?.value)
    if (value == null) continue
    const label = cleanText(v?.label || v?.name, 200) || 'Vital'
    const unit = cleanText(v?.unit, 64)
    const effective = typeof v?.at === 'string' && !Number.isNaN(Date.parse(v.at))
      ? new Date(v.at).toISOString()
      : at
    entry.push({
      resource: {
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
        code: { text: label },
        subject: { reference: pRef },
        encounter: { reference: eRef },
        valueQuantity: { value, unit },
        effectiveDateTime: effective,
      },
      request: { method: 'POST', url: 'Observation' },
    })
  }

  return { resourceType: 'Bundle', type: 'transaction', entry }
}

// Submit an EMR as a FHIR Bundle. With no credentials this returns a preview and
// performs no network I/O. With credentials it reuses the canonical POST helper
// so auth, validation, timeout and error semantics stay in one place.
export async function submitEmr(
  patient: any,
  record: any,
  practitionerName: string,
  fetchImpl: FetchLike = fetch,
) {
  const bundle = buildEmrBundle(patient, record, practitionerName)
  const summary = {
    patient: cleanText(patient?.name, 200),
    resources: bundle.entry.length,
    conditions: bundle.entry.filter((e: any) => e.resource?.resourceType === 'Condition').length,
    observations: bundle.entry.filter((e: any) => e.resource?.resourceType === 'Observation').length,
  }
  if (!isConfigured()) return { configured: false, summary, preview: bundle }
  const result = await postResource('Bundle', bundle, fetchImpl)
  return { configured: true, summary, result }
}
