// SATUSEHAT integration skeleton (Kemenkes — national health data platform).
// This is the structural scaffold for FHIR R4 interoperability required by
// Permenkes 24/2022. Real credentials & ISO/SNI conformance are filled in
// during certification. Nothing here calls out unless credentials are set.

const ENV = process.env.SATUSEHAT_ENV || 'sandbox'
const BASE = ENV === 'production'
  ? 'https://api-satusehat.kemkes.go.id'
  : 'https://api-satusehat-stg.dto.kemkes.go.id'
const AUTH_URL = `${BASE}/oauth2/v1/accesstoken?grant_type=client_credentials`
const FHIR_BASE = `${BASE}/fhir-r4/v1`

export function isConfigured(): boolean {
  return Boolean(process.env.SATUSEHAT_CLIENT_ID && process.env.SATUSEHAT_CLIENT_SECRET)
}

let token: { value: string; exp: number } | null = null

// Obtain (and cache) an OAuth2 access token from SATUSEHAT.
export async function getAccessToken(): Promise<string> {
  if (!isConfigured()) throw new Error('satusehat_not_configured')
  if (token && Date.now() < token.exp) return token.value
  const body = new URLSearchParams({
    client_id: process.env.SATUSEHAT_CLIENT_ID as string,
    client_secret: process.env.SATUSEHAT_CLIENT_SECRET as string,
  })
  const r = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!r.ok) throw new Error(`satusehat_auth_${r.status}`)
  const data = (await r.json()) as { access_token: string; expires_in: number }
  token = { value: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 }
  return token.value
}

// Generic FHIR resource POST (Encounter, Observation, Condition, etc.).
export async function postResource(resourceType: string, resource: unknown): Promise<unknown> {
  const t = await getAccessToken()
  const r = await fetch(`${FHIR_BASE}/${resourceType}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
    body: JSON.stringify(resource),
  })
  if (!r.ok) throw new Error(`satusehat_post_${resourceType}_${r.status}`)
  return r.json()
}

// Build a FHIR R4 transaction Bundle from a Panaceamed EMR record.
// Minimal but valid: Patient + Encounter + Condition[] (from problems) +
// Observation[] (from vitals). Identity reconciliation (NIK/IHS) is added at
// certification; here we send local references.
export function buildEmrBundle(patient: any, record: any, practitionerName: string): any {
  const pRef = `urn:uuid:patient-${patient?.id || 'unknown'}`
  const eRef = `urn:uuid:encounter-${Date.now()}`
  const entry: any[] = []

  entry.push({
    fullUrl: pRef,
    resource: {
      resourceType: 'Patient',
      name: [{ text: patient?.name || 'Pasien' }],
      gender: patient?.sex === 'P' ? 'female' : 'male',
      birthDate: patient?.dob || undefined,
      identifier: patient?.mrn ? [{ system: 'http://panaceamed.id/mrn', value: patient.mrn }] : undefined,
    },
    request: { method: 'POST', url: 'Patient' },
  })

  entry.push({
    fullUrl: eRef,
    resource: {
      resourceType: 'Encounter',
      status: 'finished',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
      subject: { reference: pRef, display: patient?.name },
      participant: [{ individual: { display: practitionerName } }],
      period: { start: new Date().toISOString() },
    },
    request: { method: 'POST', url: 'Encounter' },
  })

  for (const p of record?.problems ?? []) {
    entry.push({
      resource: {
        resourceType: 'Condition',
        subject: { reference: pRef },
        encounter: { reference: eRef },
        code: { text: p.title },
        note: p.assessment ? [{ text: p.assessment }] : undefined,
      },
      request: { method: 'POST', url: 'Condition' },
    })
  }

  for (const v of record?.vitals ?? []) {
    if (v?.value == null) continue
    entry.push({
      resource: {
        resourceType: 'Observation',
        status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
        code: { text: v.label || v.name || 'Vital' },
        subject: { reference: pRef },
        encounter: { reference: eRef },
        valueQuantity: { value: Number(v.value), unit: v.unit || '' },
        effectiveDateTime: v.at || new Date().toISOString(),
      },
      request: { method: 'POST', url: 'Observation' },
    })
  }

  return { resourceType: 'Bundle', type: 'transaction', entry }
}

// Submit an EMR as a FHIR Bundle. Returns a preview (no network) until
// credentials are configured, then POSTs the transaction to SATUSEHAT.
export async function submitEmr(patient: any, record: any, practitionerName: string) {
  const bundle = buildEmrBundle(patient, record, practitionerName)
  const summary = {
    patient: patient?.name,
    resources: bundle.entry.length,
    conditions: (record?.problems ?? []).length,
    observations: bundle.entry.filter((e: any) => e.resource.resourceType === 'Observation').length,
  }
  if (!isConfigured()) return { configured: false, summary, preview: bundle }
  const t = await getAccessToken()
  const r = await fetch(FHIR_BASE, {
    method: 'POST',
    headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' },
    body: JSON.stringify(bundle),
  })
  if (!r.ok) throw new Error(`satusehat_${r.status}`)
  return { configured: true, summary, result: await r.json() }
}
