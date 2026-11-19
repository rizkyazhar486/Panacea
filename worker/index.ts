/**
 * Cloudflare Worker Full-Stack Entrypoint for PanaceaMed.id OS.
 *
 * Unlocks Worker Secrets/Variables (`DATABASE_URL`, `PANACEA_SESSION_SECRET`,
 * `ALLOWED_ORIGIN`) while serving the React SPA bundle via `env.ASSETS`.
 * Reuses `functions/api/v1/*` handlers with fail-closed non-PHI error responses.
 */
import {
  jsonResponse,
  preflightResponse,
  type EdgeEnv,
} from '../functions/api/v1/_edgeGuard.ts'
import {
  onRequestGet as healthGet,
  onRequestOptions as healthOptions,
} from '../functions/api/v1/health.ts'
import {
  onRequestGet as sessionGet,
  onRequestOptions as sessionOptions,
  onRequestPost as sessionPost,
} from '../functions/api/v1/session.ts'
import {
  onRequestOptions as syncOptions,
  onRequestPost as syncPost,
} from '../functions/api/v1/sync.ts'
import {
  onRequestOptions as exportOptions,
  onRequestPost as exportPost,
} from '../functions/api/v1/export.ts'
import {
  onRequestOptions as feedbackOptions,
  onRequestPost as feedbackPost,
} from '../functions/api/v1/feedback.ts'
import {
  onRequestOptions as wearableOptions,
  onRequestPost as wearablePost,
} from '../functions/api/v1/wearables/webhook.ts'

export interface WorkerAssetsBinding {
  fetch(request: Request): Promise<Response>
}

export interface WorkerEnv extends EdgeEnv {
  readonly ASSETS?: WorkerAssetsBinding
}

type RouteHandler = (context: { request: Request; env: EdgeEnv }) => Promise<Response>

const API_ROUTES: Readonly<Record<string, Readonly<Record<string, RouteHandler>>>> = {
  '/api/v1/health': {
    OPTIONS: healthOptions,
    GET: healthGet,
  },
  '/api/v1/session': {
    OPTIONS: sessionOptions,
    GET: sessionGet,
    POST: sessionPost,
  },
  '/api/v1/sync': {
    OPTIONS: syncOptions,
    POST: syncPost,
  },
  '/api/v1/export': {
    OPTIONS: exportOptions,
    POST: exportPost,
  },
  '/api/v1/feedback': {
    OPTIONS: feedbackOptions,
    POST: feedbackPost,
  },
  '/api/v1/wearables/webhook': {
    OPTIONS: wearableOptions,
    POST: wearablePost,
  },
}

function normalizePathname(rawPath: string): string {
  if (rawPath.length > 1 && rawPath.endsWith('/')) {
    return rawPath.replace(/\/+$/, '') || '/'
  }
  return rawPath
}

export default {
  async fetch(request: Request, env: WorkerEnv, _ctx?: unknown): Promise<Response> {
    const pathname = normalizePathname(new URL(request.url).pathname)

    if (pathname.startsWith('/api/')) {
      try {
        const routeMethods = API_ROUTES[pathname]
        const method = request.method.toUpperCase()
        if (!routeMethods) {
          if (method === 'OPTIONS') return preflightResponse(request, env)
          return jsonResponse(request, env, 404, { ok: false, error: 'Unknown API route.' })
        }
        const handler = routeMethods[method]
        if (!handler) {
          return jsonResponse(request, env, 405, { ok: false, error: 'Method not allowed.' })
        }
        return await handler({ request, env })
      } catch {
        return jsonResponse(request, env, 500, {
          ok: false,
          error: 'Edge API internal error.',
        })
      }
    }

    if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') {
      return jsonResponse(request, env, 503, {
        ok: false,
        error: 'Static ASSETS binding unavailable.',
      })
    }
    return env.ASSETS.fetch(request)
  },
}
