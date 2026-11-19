/**
 * Cloudflare Pages Functions Edge Security, CORS, Rate-Limit & Neon RLS Helper.
 * Never logs DATABASE_URL, tokens, or raw PII/PHI.
 */

export interface EdgeEnv {
  readonly DATABASE_URL?: string
  readonly ALLOWED_ORIGIN?: string
}

const ALLOWED_ORIGINS = new Set([
  'https://panaceamed.id',
  'https://www.panaceamed.id',
])

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

export function sanitizeProfileKey(raw: unknown): string {
  const clean = typeof raw === 'string' ? raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) : ''
  return clean || 'rizkyazhar486'
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
