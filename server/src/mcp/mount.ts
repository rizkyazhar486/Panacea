import type { Express } from 'express'
import {
  createHttpMcpRouter,
  httpMcpConfigFromEnv,
  type HttpMcpConfig,
} from './http.js'

/**
 * Mount the remote MCP endpoint behind its dedicated fail-closed configuration.
 *
 * The endpoint is intentionally mounted even when disabled so callers receive a
 * deterministic 404 from the MCP boundary. Enabling remote MCP without a valid
 * bearer token throws during server startup rather than creating an unprotected
 * endpoint.
 */
export function mountHttpMcp(
  app: Express,
  env: Record<string, string | undefined> = process.env,
): HttpMcpConfig {
  const config = httpMcpConfigFromEnv(env)
  app.use('/api/mcp', createHttpMcpRouter(config))
  return config
}
