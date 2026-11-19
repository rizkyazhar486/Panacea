import {
  authorizeProfileRequest,
  jsonResponse,
  preflightResponse,
  runNeonParameterizedSql,
  sanitizeProfileKey,
  type EdgeEnv,
} from './_edgeGuard.ts'

const ALLOWED_CATEGORIES = new Set(['bug', 'confusing', 'slow', 'love', 'request'])
const ALLOWED_STEPS = new Set([
  'landed',
  'onboarded',
  'opened_body_exposure',
  'completed_scan',
  'completed_sync',
  'completed_export',
])

export async function onRequestOptions(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  return preflightResponse(context.request, context.env)
}

export async function onRequestPost(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  let body: Record<string, unknown>
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Malformed JSON body.' })
  }

  const profileKey = sanitizeProfileKey(body?.profileKey ?? context.request.headers.get('X-Profile-Key'), '')
  if (!profileKey) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Valid profileKey is required.' })
  }

  const kind = body?.kind === 'funnel' ? 'funnel' : 'feedback'
  // Anonymous pre-onboarding 'landed' events are permitted; all other events enforce session authorization when secret is set.
  if (!(kind === 'funnel' && body?.stepName === 'landed')) {
    const auth = await authorizeProfileRequest(context.request, context.env, profileKey)
    if (!auth.ok) {
      return jsonResponse(context.request, context.env, auth.status, { ok: false, error: auth.error })
    }
  }

  const dbUrl = context.env?.DATABASE_URL?.trim()

  if (kind === 'funnel') {
    const stepName = typeof body?.stepName === 'string' ? body.stepName.trim() : ''
    const eventId = sanitizeProfileKey(body?.eventId, '') || `FUN-${profileKey.slice(0, 24)}-${stepName}`
    if (!ALLOWED_STEPS.has(stepName)) {
      return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Unsupported funnel step_name.' })
    }
    if (!dbUrl) {
      return jsonResponse(context.request, context.env, 202, {
        ok: true,
        mode: 'local_first_sovereign',
        queuedLocally: true,
        eventId,
        stepName,
      })
    }
    const res = await runNeonParameterizedSql(
      dbUrl,
      profileKey,
      `INSERT INTO panacea_beta_funnel_events (event_id, profile_key, step_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId.slice(0, 64), profileKey, stepName],
    )
    if (!res.ok) {
      return jsonResponse(context.request, context.env, res.status, { ok: false, error: res.error })
    }
    return jsonResponse(context.request, context.env, 200, {
      ok: true,
      mode: 'neon_rls',
      eventId,
      stepName,
    })
  }

  const feedbackId = sanitizeProfileKey(body?.feedbackId, '') || `FB-${profileKey.slice(0, 16)}-${Date.now()}`
  const ratingRaw = Number(body?.rating1To5 ?? body?.rating_1_to_5)
  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return jsonResponse(context.request, context.env, 400, {
      ok: false,
      error: 'rating_1_to_5 must be an integer between 1 and 5.',
    })
  }
  const category = typeof body?.category === 'string' ? body.category.trim().toLowerCase() : ''
  if (!ALLOWED_CATEGORIES.has(category)) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Unsupported feedback category.' })
  }
  const note =
    typeof body?.note === 'string' ? body.note.trim().replace(/\s+/g, ' ').slice(0, 400) : ''
  if (note.length < 1) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Feedback note cannot be empty.' })
  }
  const routeHash =
    typeof body?.routeHash === 'string' && body.routeHash.trim()
      ? body.routeHash.trim().slice(0, 80)
      : '/'
  const viewport =
    typeof body?.viewport === 'string' && body.viewport.trim()
      ? body.viewport.trim().slice(0, 32)
      : 'unknown'
  const uaShort =
    typeof body?.userAgentShort === 'string' && body.userAgentShort.trim()
      ? body.userAgentShort.trim().slice(0, 80)
      : 'browser'

  if (!dbUrl) {
    return jsonResponse(context.request, context.env, 202, {
      ok: true,
      mode: 'local_first_sovereign',
      queuedLocally: true,
      feedbackId,
      profileKey,
    })
  }

  const res = await runNeonParameterizedSql(
    dbUrl,
    profileKey,
    `INSERT INTO panacea_beta_feedback (feedback_id, profile_key, route_hash, rating_1_to_5, category, note, viewport, user_agent_short)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (feedback_id) DO NOTHING`,
    [feedbackId.slice(0, 64), profileKey, routeHash, ratingRaw, category, note, viewport, uaShort],
  )
  if (!res.ok) {
    return jsonResponse(context.request, context.env, res.status, { ok: false, error: res.error })
  }

  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    mode: 'neon_rls',
    feedbackId,
    profileKey,
  })
}
