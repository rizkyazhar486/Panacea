// Uji mount MCP ke backend Express tanpa menjalankan seluruh server produksi.
// Kontrak: /api/mcp tetap default-off, config remote fail-closed, dan bearer
// auth tetap menjadi boundary sebelum request mencapai transport MCP.

import { once } from 'node:events'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import express from 'express'
import { mountHttpMcp } from '../src/mcp/mount.js'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

async function requestMounted(
  env: Record<string, string | undefined>,
  authorization?: string,
) {
  const app = express()
  app.use(express.json({ limit: '256kb' }))
  mountHttpMcp(app, env)
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
    const response = await fetch(`http://127.0.0.1:${address.port}/api/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2026-07-28',
          capabilities: {},
          clientInfo: { name: 'panacea-mcp-mount-test', version: '1.0.0' },
        },
      }),
    })
    return { status: response.status, body: await response.text() }
  } finally {
    await new Promise<void>((resolve, reject) => {
      nodeServer.close((error) => error ? reject(error) : resolve())
    })
  }
}

const disabled = await requestMounted({})
ok('backend mount default-off menjawab 404', disabled.status === 404, disabled.body)

let configRejected = false
try {
  const app = express()
  mountHttpMcp(app, { PANACEA_MCP_HTTP_ENABLED: 'true' })
} catch (error) {
  configRejected = error instanceof Error && 'code' in error && (error as Error & { code?: string }).code === 'invalid_input'
}
ok('backend mount enabled tanpa bearer gagal saat konfigurasi', configRejected)

const token = '0123456789abcdef0123456789abcdef'
const noAuth = await requestMounted({
  PANACEA_MCP_HTTP_ENABLED: 'true',
  PANACEA_MCP_HTTP_BEARER_TOKEN: token,
})
ok('backend mount enabled tanpa authorization menjawab 401', noAuth.status === 401, noAuth.body)

const initialized = await requestMounted(
  {
    PANACEA_MCP_HTTP_ENABLED: 'true',
    PANACEA_MCP_HTTP_BEARER_TOKEN: token,
  },
  `Bearer ${token}`,
)
ok('backend mount bearer benar mencapai initialize', initialized.status === 200, initialized.body)
ok('backend mount initialize menyebut Panaceamed MCP', initialized.body.includes('panaceamed-mcp'), initialized.body)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
