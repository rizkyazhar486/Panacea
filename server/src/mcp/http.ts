import { timingSafeEqual } from 'node:crypto'
import express, { type Router } from 'express'
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node'
import { createPanaceaMcpServer } from './serverFactory.js'

export interface HttpMcpConfig {
  enabled: boolean
  bearerToken?: string
}

export class McpHttpConfigError extends Error {
  readonly code = 'invalid_input' as const

  constructor(message: string) {
    super(message)
    this.name = 'McpHttpConfigError'
  }
}

function validToken(token: string | undefined): token is string {
  return typeof token === 'string' && token.trim().length >= 32
}

export function httpMcpConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): HttpMcpConfig {
  const enabled = env.PANACEA_MCP_HTTP_ENABLED?.trim().toLowerCase() === 'true'
  if (!enabled) return { enabled: false }

  const bearerToken = env.PANACEA_MCP_HTTP_BEARER_TOKEN?.trim()
  if (!validToken(bearerToken)) {
    throw new McpHttpConfigError(
      'PANACEA_MCP_HTTP_BEARER_TOKEN must contain at least 32 characters when remote MCP is enabled',
    )
  }
  return { enabled: true, bearerToken }
}

function bearerAuthorized(header: string | undefined, expected: string): boolean {
  if (!header) return false
  const matched = header.trim().match(/^Bearer\s+(.+)$/i)
  if (!matched) return false
  const actual = Buffer.from(matched[1], 'utf8')
  const wanted = Buffer.from(expected, 'utf8')
  if (actual.byteLength !== wanted.byteLength) return false
  return timingSafeEqual(actual, wanted)
}

function validateRouterConfig(config: HttpMcpConfig): void {
  if (config.enabled && !validToken(config.bearerToken)) {
    throw new McpHttpConfigError('Enabled remote MCP requires a bearer token of at least 32 characters')
  }
}

export function createHttpMcpRouter(config: HttpMcpConfig): Router {
  validateRouterConfig(config)
  const router = express.Router()

  // Auth/default-off gate MUST run before any MCP body parser. This keeps
  // unauthenticated callers from spending CPU/memory on JSON bodies they are
  // not authorized to submit in the first place.
  router.all('/', (req, res, next) => {
    if (!config.enabled) {
      res.status(404).json({ error: 'mcp_disabled' })
      return
    }

    if (!bearerAuthorized(req.headers.authorization, config.bearerToken as string)) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="panaceamed-mcp"')
      res.status(401).json({ error: 'unauthorized' })
      return
    }

    next()
  })

  // Remote MCP payloads are deliberately much smaller than the application's
  // global 12 MB vision/body limit. Parser errors propagate to the app's normal
  // Express error boundary (or Express' default 4xx handler in isolated tests).
  router.use(express.json({ limit: '256kb' }))

  router.all('/', async (req, res) => {
    try {
      const server = createPanaceaMcpServer('http')
      const transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      })
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch {
      if (!res.headersSent) res.status(500).json({ error: 'mcp_transport_error' })
      else if (!res.writableEnded) res.end()
    }
  })

  return router
}