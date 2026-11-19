import { jsonResponse, preflightResponse, type EdgeEnv } from './_edgeGuard.ts'

export async function onRequestOptions(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  return preflightResponse(context.request, context.env)
}

export async function onRequestGet(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  const hasNeon = Boolean(context.env?.DATABASE_URL && context.env.DATABASE_URL.trim().length > 0)
  const hasSessionSecret = Boolean(
    context.env?.PANACEA_SESSION_SECRET && context.env.PANACEA_SESSION_SECRET.trim().length > 0,
  )
  const edgeRegion = (context.request as { cf?: { colo?: string } }).cf?.colo || 'edge-local'
  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    neonConfigured: hasNeon,
    edgeRegion,
    sessionSecretConfigured: hasSessionSecret,
    service: 'panaceamed-edge-api-v1',
    persistenceMode: hasNeon ? 'neon_rls' : 'local_first_sovereign',
    humanitarianFreeCoreLocked: true,
    clinicallyReviewed: false,
  })
}
