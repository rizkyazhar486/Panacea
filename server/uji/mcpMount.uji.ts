// Uji mount MCP ke backend Express tanpa menjalankan seluruh server produksi.
// Kontrak: /api/mcp tetap default-off, config remote fail-closed, bearer auth
// terjadi sebelum badan JSON dibaca, payload remote dibatasi ketat, dan wiring
// produksi memasang MCP sesudah limiter tetapi sebelum parser JSON global 12 MB.

import { once } from 'node:events'
import { readFileSync } from 'node:fs'
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

const initializeBody = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2026-07-28',
    capabilities: {},
    clientInfo: { name: 'panacea-mcp-mount-test', version: '1.0.0' },
  },
})

async function requestMounted(
  env: Record<string, string | undefined>,
  authorization?: string,
  body = initializeBody,
) {
  const app = express()
  // Sengaja TIDAK memasang express.json di sini. Boundary MCP wajib memiliki
  // parser terbatasnya sendiri setelah auth; kalau test menambahkan parser di
  // depan mount, regresi parse-before-auth di produksi tidak pernah terlihat.
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
      body,
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

const malformedNoAuth = await requestMounted(
  {
    PANACEA_MCP_HTTP_ENABLED: 'true',
    PANACEA_MCP_HTTP_BEARER_TOKEN: token,
  },
  undefined,
  `{${'x'.repeat(300 * 1024)}`,
)
ok(
  'request tanpa bearer ditolak sebelum parser mencoba membaca JSON besar/malformed',
  malformedNoAuth.status === 401,
  malformedNoAuth.body,
)

const initialized = await requestMounted(
  {
    PANACEA_MCP_HTTP_ENABLED: 'true',
    PANACEA_MCP_HTTP_BEARER_TOKEN: token,
  },
  `Bearer ${token}`,
)
ok('backend mount bearer benar mencapai initialize', initialized.status === 200, initialized.body)
ok('backend mount initialize menyebut Panaceamed MCP', initialized.body.includes('panaceamed-mcp'), initialized.body)

const oversized = await requestMounted(
  {
    PANACEA_MCP_HTTP_ENABLED: 'true',
    PANACEA_MCP_HTTP_BEARER_TOKEN: token,
  },
  `Bearer ${token}`,
  JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'initialize',
    params: {
      protocolVersion: '2026-07-28',
      capabilities: {},
      clientInfo: { name: 'panacea-mcp-oversize-test', version: '1.0.0' },
      filler: 'x'.repeat(300 * 1024),
    },
  }),
)
ok(
  'remote MCP menolak payload >256 KiB setelah bearer tervalidasi',
  oversized.status === 413,
  `status=${oversized.status} body=${oversized.body.slice(0, 240)}`,
)

const backendSource = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
const limiterPosition = backendSource.indexOf("app.use('/api', globalLimiter)")
const mountPosition = backendSource.indexOf('mountHttpMcp(app)')
const globalParserPosition = backendSource.indexOf("app.use(express.json({ limit: '12mb' }))")
ok(
  'backend produksi mengimpor mount MCP',
  backendSource.includes("import { mountHttpMcp } from './mcp/mount.js'"),
)
ok(
  'backend produksi memasang MCP setelah global limiter',
  limiterPosition >= 0 && mountPosition > limiterPosition,
  `limiter=${limiterPosition}, mount=${mountPosition}`,
)
ok(
  'backend produksi memasang MCP sebelum parser JSON global 12 MB',
  mountPosition >= 0 && globalParserPosition >= 0 && mountPosition < globalParserPosition,
  `mount=${mountPosition}, globalParser=${globalParserPosition}`,
)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)