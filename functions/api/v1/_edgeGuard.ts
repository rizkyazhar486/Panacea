/**
 * Cloudflare Pages Functions Edge Security, CORS, Rate-Limit, HMAC Session & Neon RLS Helper.
 * Never logs DATABASE_URL, session secrets, tokens, or raw PII/PHI.
 */

export interface EdgeEnv {
  readonly DATABASE_URL?: string
  readonly ALLOWED_ORIGIN?: string
  readonly PANACEA_SESSION_SECRET?: string
}

const ALLOWED_ORIGINS = new Set([
  'https://panaceamed.id',
  'https://www.panaceamed.id',
])

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i])
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(input: string): Uint8Array | null {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4)
    const bin = atob(padded)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i += 1) {
      out[i] = bin.charCodeAt(i)
    }
    return out
  } catch {
    return null
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

export async function signSessionToken(
  payload: {
    readonly profileKey: string
    readonly role: string
    readonly iatMs: number
    readonly expMs: number
  },
  secret: string,
): Promise<string> {
  const cleanSecret = secret.trim()
  if (!cleanSecret) throw new Error('Missing session signing secret.')
  const headerB64 = toBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'PMD-BETA' })))
  const bodyB64 = toBase64Url(
    encoder.encode(
      JSON.stringify({
        sub: payload.profileKey,
        role: payload.role,
        iat: payload.iatMs,
        exp: payload.expMs,
      }),
    ),
  )
  const unsigned = `${headerB64}.${bodyB64}`
  const key = await importHmacKey(cleanSecret)
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned)))
  return `${unsigned}.${toBase64Url(sig)}`
}

export async function verifySessionToken(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): Promise<
  | { readonly ok: true; readonly profileKey: string; readonly role: string; readonly expMs: number }
  | { readonly ok: false; readonly reason: string }
> {
  const cleanSecret = secret.trim()
  if (!cleanSecret) return { ok: false, reason: 'secret_unconfigured' }
  const parts = typeof token === 'string' ? token.trim().split('.') : []
  if (parts.length !== 3) return { ok: false, reason: 'malformed_token' }

  const [headerB64, bodyB64, sigB64] = parts
  const providedSig = fromBase64Url(sigB64)
  if (!providedSig) return { ok: false, reason: 'invalid_signature_encoding' }

  const key = await importHmacKey(cleanSecret)
  const expectedSig = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${headerB64}.${bodyB64}`)))
  if (!timingSafeEqual(providedSig, expectedSig)) {
    return { ok: false, reason: 'invalid_signature' }
  }

  const bodyBytes = fromBase64Url(bodyB64)
  if (!bodyBytes) return { ok: false, reason: 'invalid_payload' }
  try {
    const parsed = JSON.parse(decoder.decode(bodyBytes)) as {
      sub?: unknown
      role?: unknown
      exp?: unknown
    }
    const sub = typeof parsed.sub === 'string' ? parsed.sub : ''
    const role = typeof parsed.role === 'string' ? parsed.role : 'pasien'
    const exp = typeof parsed.exp === 'number' && Number.isFinite(parsed.exp) ? parsed.exp : 0
    if (!sub) return { ok: false, reason: 'missing_subject' }
    if (exp <= nowMs) return { ok: false, reason: 'expired' }
    return { ok: true, profileKey: sub, role, expMs: exp }
  } catch {
    return { ok: false, reason: 'malformed_payload_json' }
  }
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) return null
  const token = auth.slice(7).trim()
  return token || null
}

export async function authorizeProfileRequest(
  request: Request,
  env: EdgeEnv | undefined,
  requestedProfileKey: string,
  nowMs?: number,
): Promise<
  | { readonly ok: true; readonly authMode: 'hmac_verified' | 'local_only_unsigned' }
  | { readonly ok: false; readonly status: 401 | 403; readonly error: string }
> {
  const secret = env?.PANACEA_SESSION_SECRET?.trim() ?? ''
  if (!secret) {
    return { ok: true, authMode: 'local_only_unsigned' }
  }
  const token = extractBearerToken(request)
  if (!token) {
    return { ok: false, status: 401, error: 'Missing Bearer session token.' }
  }
  const verified = await verifySessionToken(token, secret, nowMs)
  if (!verified.ok) {
    return { ok: false, status: 401, error: `Invalid session token (${verified.reason}).` }
  }
  if (verified.profileKey !== requestedProfileKey) {
    return { ok: false, status: 403, error: 'Profile key scope mismatch.' }
  }
  return { ok: true, authMode: 'hmac_verified' }
}

export function corsHeadersFor(request: Request, env?: EdgeEnv): Record<string, string> {
  const origin = request.headers.get('origin') || ''
  const custom = env?.ALLOWED_ORIGIN?.trim()
  const isLocalDev = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  const allowOrigin =
    ALLOWED_ORIGINS.has(origin) || (custom && origin === custom) || isLocalDev
      ? origin
      : 'https://panaceamed.id'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Profile-Key',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-RateLimit-Limit': '120',
    'X-RateLimit-Window': '60s',
    'Cache-Control': 'no-store',
  }
}

export function preflightResponse(request: Request, env?: EdgeEnv): Response {
  return new Response(null, { status: 204, headers: corsHeadersFor(request, env) })
}

export function jsonResponse(
  request: Request,
  env: EdgeEnv | undefined,
  status: number,
  body: Record<string, unknown>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeadersFor(request, env),
    },
  })
}

export function sanitizeProfileKey(raw: unknown, fallback = 'rizkyazhar486'): string {
  const clean = typeof raw === 'string' ? raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) : ''
  return clean || fallback
}

export async function runNeonParameterizedSql(
  databaseUrl: string,
  profileKey: string,
  query: string,
  params: readonly unknown[] = [],
): Promise<{ readonly ok: true; readonly result: unknown } | { readonly ok: false; readonly status: number; readonly error: string }> {
  let hostname = ''
  try {
    hostname = new URL(databaseUrl).hostname
  } catch {
    return { ok: false, status: 500, error: 'Database configuration invalid.' }
  }
  const endpoint = `https://${hostname}/sql`
  try {
    const rlsRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Neon-Connection-String': databaseUrl,
      },
      body: JSON.stringify({
        transaction: [
          { query: "SELECT set_config('app.current_profile_key', $1, true)", params: [sanitizeProfileKey(profileKey)] },
          { query, params: [...params] },
        ],
      }),
    })
    if (!rlsRes.ok) {
      return { ok: false, status: 503, error: `Neon backend unavailable (HTTP ${rlsRes.status}). Local-first fallback active.` }
    }
    const payload = await rlsRes.json()
    return { ok: true, result: payload }
  } catch {
    return { ok: false, status: 503, error: 'Upstream database unreachable; retry or continue in Local-First Sovereign Mode.' }
  }
}
