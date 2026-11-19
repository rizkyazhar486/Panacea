import {
  authorizeProfileRequest,
  jsonResponse,
  preflightResponse,
  runNeonParameterizedSql,
  sanitizeProfileKey,
  type EdgeEnv,
} from './_edgeGuard.ts'

const ALLOWED_FUNNEL_STEPS = new Set([
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
  let body: {
    profileKey?: string
    events?: Array<{
      eventId?: string
      entityType?: string
      idempotencyKey?: string
      payloadJson?: Record<string, unknown>
    }>
    funnelEvents?: Array<{
      eventId?: string
      stepName?: string
    }>
  }
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Malformed JSON body.' })
  }

  const profileKey = sanitizeProfileKey(body?.profileKey ?? context.request.headers.get('X-Profile-Key'), '')
  if (!profileKey) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Valid profileKey is required.' })
  }

  const auth = await authorizeProfileRequest(context.request, context.env, profileKey)
  if (!auth.ok) {
    return jsonResponse(context.request, context.env, auth.status, { ok: false, error: auth.error })
  }

  const events = Array.isArray(body?.events) ? body.events.slice(0, 50) : []
  const funnelEvents = Array.isArray(body?.funnelEvents) ? body.funnelEvents.slice(0, 20) : []
  if (events.length === 0 && funnelEvents.length === 0) {
    return jsonResponse(context.request, context.env, 400, {
      ok: false,
      error: 'At least one outbox or funnel event is required.',
    })
  }

  const dbUrl = context.env?.DATABASE_URL?.trim()
  if (!dbUrl) {
    return jsonResponse(context.request, context.env, 202, {
      ok: true,
      mode: 'local_first_sovereign',
      authMode: auth.authMode,
      profileKey,
      acceptedCount: events.length + funnelEvents.length,
      note: 'Edge DATABASE_URL unbound; events remain safely queued in browser outbox.',
    })
  }

  let synced = 0
  for (const ev of events) {
    if (!ev?.eventId || !ev?.entityType || !ev?.idempotencyKey) continue
    const res = await runNeonParameterizedSql(
      dbUrl,
      profileKey,
      `INSERT INTO panacea_sync_outbox (event_id, profile_key, entity_type, idempotency_key, payload_json, status, synced_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, 'synced', NOW())
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [
        String(ev.eventId).slice(0, 64),
        profileKey,
        String(ev.entityType).slice(0, 64),
        String(ev.idempotencyKey).slice(0, 128),
        JSON.stringify(ev.payloadJson ?? {}),
      ],
    )
    if (!res.ok) {
      return jsonResponse(context.request, context.env, res.status, { ok: false, error: res.error, synced })
    }
    synced += 1
  }

  for (const fe of funnelEvents) {
    if (!fe?.eventId || !fe?.stepName || !ALLOWED_FUNNEL_STEPS.has(fe.stepName)) continue
    const res = await runNeonParameterizedSql(
      dbUrl,
      profileKey,
      `INSERT INTO panacea_beta_funnel_events (event_id, profile_key, step_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id) DO NOTHING`,
      [String(fe.eventId).slice(0, 64), profileKey, fe.stepName],
    )
    if (!res.ok) {
      return jsonResponse(context.request, context.env, res.status, { ok: false, error: res.error, synced })
    }
    synced += 1
  }

  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    mode: 'neon_rls',
    authMode: auth.authMode,
    profileKey,
    syncedCount: synced,
  })
}
