import { jsonResponse, preflightResponse, type EdgeEnv } from './_edgeGuard'

export async function onRequestOptions(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  return preflightResponse(context.request, context.env)
}

export async function onRequestGet(context: { request: Request; env: EdgeEnv }): Promise<Response> {
  const hasNeon = Boolean(context.env?.DATABASE_URL && context.env.DATABASE_URL.trim().length > 0)
  return jsonResponse(context.request, context.env, 200, {
    ok: true,
    service: 'panaceamed-edge-api-v1',
    persistenceMode: hasNeon ? 'neon_rls' : 'local_first_sovereign',
    humanitarianFreeCoreLocked: true,
    clinicallyReviewed: false,
  })
}
