import {
  extractBearerToken,
  jsonResponse,
  preflightResponse,
  runNeonParameterizedSql,
  sanitizeProfileKey,
  signSessionToken,
  verifySessionToken,
  type EdgeEnv,
} from './_edgeGuard.ts'

const SESSION_TTL_MS = 7 * 86_400_000
const ALLOWED_ROLES = new Set(['patient', 'doctor', 'athlete', 'pasien', 'dokter', 'owner'])

export async function onRequestOptions(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  return preflightResponse(context.request, context.env)
}

export async function onRequestGet(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  const secret = context.env?.PANACEA_SESSION_SECRET?.trim() ?? ''
  if (!secret) {
    const hdrProfile = sanitizeProfileKey(context.request.headers.get('X-Profile-Key'), '')
    return jsonResponse(context.request, context.env, 200, {
      ok: true,
      verified: false,
      profileKey: hdrProfile || null,
      mode: 'local_only_unsigned',
    })
  }
  const token = extractBearerToken(context.request)
  if (!token) {
    return jsonResponse(context.request, context.env, 401, {
      ok: false,
      verified: false,
      error: 'Missing Bearer token.',
    })
  }
  const res = await verifySessionToken(token, secret)
  if (!res.ok) {
    return jsonResponse(context.request, context.env, 401, {
      ok: false,
      verified: false,
      error: res.reason,
    })
  }
  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    verified: true,
    profileKey: res.profileKey,
    role: res.role,
    mode: 'hmac_verified',
  })
}

export async function onRequestPost(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  let body: {
    profileKey?: string
    name?: string
    role?: string
    inviteCode?: string
    mode?: string
  }
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Malformed JSON body.' })
  }

  const profileKey = sanitizeProfileKey(body?.profileKey, '')
  if (!profileKey || profileKey.length < 4) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Valid profileKey is required.' })
  }

  const mode = typeof body?.mode === 'string' ? body.mode.trim() : 'beta_pass'
  if (profileKey === 'rizkyazhar486' && mode !== 'founder_demo') {
    return jsonResponse(context.request, context.env, 403, {
      ok: false,
      error: 'Canonical founder profileKey is restricted to founder_demo mode.',
    })
  }

  const fullName = typeof body?.name === 'string' ? body.name.trim().slice(0, 64) : ''
  if (fullName.length < 2) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Name must be at least 2 characters.' })
  }

  const rawRole = typeof body?.role === 'string' ? body.role.trim().toLowerCase() : 'patient'
  const safeRole = ALLOWED_ROLES.has(rawRole) ? rawRole : 'patient'
  const dbRole =
    safeRole === 'doctor' || safeRole === 'dokter'
      ? 'doctor'
      : safeRole === 'owner' && profileKey === 'rizkyazhar486'
        ? 'owner'
        : 'patient'
  const mrn =
    profileKey === 'rizkyazhar486'
      ? 'PMD-000486'
      : `PMD-B-${profileKey.slice(-6).toUpperCase().padStart(6, '0')}`
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('') || 'PM'
  const inviteNote =
    typeof body?.inviteCode === 'string' && body.inviteCode.trim()
      ? `Beta cohort · Invite ${body.inviteCode.trim().slice(0, 24)}`
      : '50-User Real-World Beta Cohort'

  const secret = context.env?.PANACEA_SESSION_SECRET?.trim() ?? ''
  const nowMs = Date.now()
  const token = secret
    ? await signSessionToken(
        {
          profileKey,
          role: safeRole,
          iatMs: nowMs,
          expMs: nowMs + SESSION_TTL_MS,
        },
        secret,
      )
    : null
  const authMode = secret ? 'hmac_verified' : 'local_only_unsigned'

  const dbUrl = context.env?.DATABASE_URL?.trim()
  if (!dbUrl) {
    return jsonResponse(context.request, context.env, 202, {
      ok: true,
      profileKey,
      mrn,
      role: safeRole,
      token,
      authMode,
      persistenceMode: 'local_first_sovereign',
    })
  }

  const upsertProfile = await runNeonParameterizedSql(
    dbUrl,
    profileKey,
    `INSERT INTO panacea_profiles (profile_key, mrn, full_name, username, clinical_title, bio, website, avatar_initials, verified_clinician, role)
     VALUES ($1, $2, $3, $4, $5, $6, 'panaceamed.id', $7, FALSE, $8)
     ON CONFLICT (profile_key) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       role = EXCLUDED.role,
       updated_at = NOW()`,
    [profileKey, mrn, fullName, profileKey, safeRole === 'athlete' ? 'Athlete · Beta Cohort' : safeRole, inviteNote, initials, dbRole],
  )
  if (!upsertProfile.ok) {
    return jsonResponse(context.request, context.env, upsertProfile.status, {
      ok: false,
      error: upsertProfile.error,
      token,
      authMode,
    })
  }

  const eventId = `FUN-${profileKey.slice(0, 24)}-onboarded`
  await runNeonParameterizedSql(
    dbUrl,
    profileKey,
    `INSERT INTO panacea_beta_funnel_events (event_id, profile_key, step_name)
     VALUES ($1, $2, 'onboarded')
     ON CONFLICT (event_id) DO NOTHING`,
    [eventId, profileKey],
  )

  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    profileKey,
    mrn,
    role: safeRole,
    token,
    authMode,
    persistenceMode: 'neon_rls',
  })
}
