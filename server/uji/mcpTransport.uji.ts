// Uji transport MCP resmi: stdio untuk host lokal dan Streamable HTTP yang
// default-off + bearer-auth untuk remote-safe tools.

import { once } from 'node:events'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import express from 'express'
import { McpServer } from '@modelcontextprotocol/server'
import { createPanaceaMcpServer } from '../src/mcp/serverFactory.js'
import { createHttpMcpRouter, httpMcpConfigFromEnv } from '../src/mcp/http.js'
import { executePanaceaTool } from '../src/mcp/tools.js'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

function throwsInvalid(nama: string, fn: () => unknown) {
  try {
    fn()
    ok(nama, false, 'tidak melempar error')
  } catch (error) {
    ok(
      nama,
      error instanceof Error && 'code' in error && (error as Error & { code?: string }).code === 'invalid_input',
      error instanceof Error ? error.message : String(error),
    )
  }
}

const stdioServer = createPanaceaMcpServer('stdio', { repoRoot: '/workspace/Panacea' })
ok('factory membangun McpServer untuk stdio', stdioServer instanceof McpServer)

const httpServer = createPanaceaMcpServer('http')
ok('factory membangun McpServer untuk HTTP', httpServer instanceof McpServer)

const defaultConfig = httpMcpConfigFromEnv({})
ok('remote HTTP default-off', defaultConfig.enabled === false)
throwsInvalid('HTTP enabled tanpa bearer token ditolak', () =>
  httpMcpConfigFromEnv({ PANACEA_MCP_HTTP_ENABLED: 'true' }),
)

const remoteCapabilities = await executePanaceaTool(
  'panacea_capabilities',
  {},
  { transport: 'http', requestId: 'transport-capabilities' },
)
ok('remote capability discovery masih berhasil', remoteCapabilities.ok)
if (remoteCapabilities.ok) {
  const data = remoteCapabilities.data as { tools: Array<{ name: string }> }
  ok('remote transport tidak mengekspos QA runner', !data.tools.some((tool) => tool.name === 'panacea_repo_qa_run'))
  ok('remote transport tidak mengekspos QA planner', !data.tools.some((tool) => tool.name === 'panacea_repo_qa_plan'))
}

async function requestAgainstRouter(
  config: { enabled: boolean; bearerToken?: string },
  authorization?: string,
) {
  const app = express()
  app.use(express.json({ limit: '256kb' }))
  app.use('/', createHttpMcpRouter(config))
  const nodeServer = createServer(app)
  nodeServer.listen(0, '127.0.0.1')
  await once(nodeServer, 'listening')
  const address = nodeServer.address() as AddressInfo

  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    }
    if (authorization) headers.authorization = authorization
    const response = await fetch(`http://127.0.0.1:${address.port}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2026-07-28',
          capabilities: {},
          clientInfo: { name: 'panacea-mcp-test', version: '1.0.0' },
        },
      }),
    })
    const body = await response.text()
    return { status: response.status, body }
  } finally {
    await new Promise<void>((resolve, reject) => {
      nodeServer.close((error) => error ? reject(error) : resolve())
    })
  }
}

const disabled = await requestAgainstRouter({ enabled: false })
ok('router disabled menjawab 404', disabled.status === 404, disabled.body)

const token = '0123456789abcdef0123456789abcdef'
const noAuth = await requestAgainstRouter({ enabled: true, bearerToken: token })
ok('router enabled tanpa auth menjawab 401', noAuth.status === 401, noAuth.body)

const wrongAuth = await requestAgainstRouter(
  { enabled: true, bearerToken: token },
  'Bearer wrong-token-wrong-token-wrong-token',
)
ok('bearer salah menjawab 401', wrongAuth.status === 401, wrongAuth.body)

const initialized = await requestAgainstRouter(
  { enabled: true, bearerToken: token },
  `Bearer ${token}`,
)
ok('bearer benar mencapai MCP initialize', initialized.status === 200, initialized.body)
ok('initialize mengembalikan JSON-RPC result', initialized.body.includes('"result"'), initialized.body)
ok('initialize menyebut Panaceamed MCP server', initialized.body.includes('panaceamed-mcp'), initialized.body)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
