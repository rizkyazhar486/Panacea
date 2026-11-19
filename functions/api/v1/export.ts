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
  let body: { profileKey?: string; format?: string; sha256?: string; byteLength?: number }
  try {
    body = await context.request.json()
  } catch {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Malformed JSON body.' })
  }

  const profileKey = sanitizeProfileKey(body?.profileKey ?? context.request.headers.get('X-Profile-Key'))
  const format = typeof body?.format === 'string' ? body.format.slice(0, 16) : ''
  const digest = typeof body?.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(body.sha256) ? body.sha256.toLowerCase() : ''

  if (!format || !digest) {
    return jsonResponse(context.request, context.env, 400, { ok: false, error: 'Valid export format and 64-char SHA-256 digest required.' })
  }

  const dbUrl = context.env?.DATABASE_URL?.trim()
  if (!dbUrl) {
    return jsonResponse(context.request, context.env, 202, {
      ok: true,
      mode: 'local_first_sovereign',
      format,
      sha256: digest,
      clinicallyReviewed: false,
    })
  }

  const res = await runNeonParameterizedSql(
    dbUrl,
    profileKey,
    `INSERT INTO panacea_audit_trail (actor_type, actor_ref, profile_key, action_name, resource_type, resource_id, payload_digest)
     VALUES ('patient', $1, $1, 'export_snapshot', $2, $3, $4)`,
    [profileKey, `export_${format}`, `${profileKey}:${format}:${digest.slice(0, 12)}`, digest],
  )
  if (!res.ok) {
    return jsonResponse(context.request, context.env, res.status, { ok: false, error: res.error })
  }

  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    mode: 'neon_rls',
    format,
    sha256: digest,
    clinicallyReviewed: false,
  })
}
