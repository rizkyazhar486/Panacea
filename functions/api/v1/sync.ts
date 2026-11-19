import {
  jsonResponse,
  preflightResponse,
  runNeonParameterizedSql,
  sanitizeProfileKey,
  type EdgeEnv,
} from './_edgeGuard'

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
  }
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Malformed JSON body.' })
  }

  const profileKey = sanitizeProfileKey(body?.profileKey ?? context.request.headers.get('X-Profile-Key'))
  const events = Array.isArray(body?.events) ? body.events.slice(0, 50) : []
  if (events.length === 0) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'At least one outbox event is required.' })
  }

  const dbUrl = context.env?.DATABASE_URL?.trim()
  if (!dbUrl) {
    return jsonResponse(context.request, context.env, 202, {
      ok: true,
      mode: 'local_first_sovereign',
      acceptedCount: events.length,
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

  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    mode: 'neon_rls',
    profileKey,
    syncedCount: synced,
  })
}
