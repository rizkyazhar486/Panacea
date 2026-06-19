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

// TODO (certification phase): map Panaceamed EMR → FHIR R4 Bundle
// (Patient, Encounter, Observation[vitals/labs], Condition, MedicationRequest)
// and reconcile patient identity with NIK/IHS number.
