import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import express from 'express'
import jwt from 'jsonwebtoken'

// Real routes/auth, synthetic users, isolated persistence and a mocked worker.
// No sequencing files or external worker requests are used by this test.
const directory = mkdtempSync(join(tmpdir(), 'panacea-genomics-boundary-'))
process.env.PANACEA_DATA_FILE = join(directory, 'store.json')
process.env.JWT_SECRET = 'synthetic-genomics-boundary-test-secret'
process.env.GENOMICS_WORKER_URL = 'https://synthetic-worker.example.test'
const { config } = await import('../src/config.js')
const { upsertUser } = await import('../src/store.js')
const { attachGenomicsComputeRoutes } = await import('../src/genomicsCompute.js')
const owner = upsertUser('genomics-owner@example.test', 'Synthetic Owner', 'pasien')
const other = upsertUser('genomics-other@example.test', 'Synthetic Other', 'pasien')
const token = (id: string) => jwt.sign({ uid: id }, config.jwtSecret, { expiresIn: '5m' })
const nativeFetch = globalThis.fetch
let workerCalls = 0
let workerResponse: () => Promise<Response> = async () => Response.json({ id: 'synthetic-worker-job', status: 'queued' })
const privatePayload = {
  id: 'synthetic-internal-job', ownerId: 'synthetic-internal-owner',
  message: 'synthetic-private-diagnostic',
  input: { uri: 's3://synthetic-private-bucket/input.pod5' },
  internalDiagnostic: 'synthetic-private-diagnostic',
}
const app = express()
app.use(express.json())
const server = createServer(app)
attachGenomicsComputeRoutes(server)
let origin = ''
let jobHandle = ''

before(async () => {
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input))
    if (url.origin === config.genomics.workerUrl) {
      workerCalls++
      return workerResponse()
    }
    assert.equal(url.origin, origin, 'tests must not make external requests')
    return nativeFetch(input, init)
  }
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const fixture = await request('/jobs', 'POST')
  assert.equal(fixture.status, 202)
  jobHandle = String(fixture.body.jobHandle)
})

beforeEach(() => {
  workerResponse = async () => Response.json({ id: 'synthetic-worker-job', status: 'queued' })
})

after(async () => {
  globalThis.fetch = nativeFetch
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  rmSync(directory, { recursive: true, force: true })
})

async function request(path: string, method = 'GET', userId: string | null = owner.id) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (userId) headers.Authorization = `Bearer ${token(userId)}`
  const response = await fetch(`${origin}/api/genomics/compute${path}`, {
    method, headers,
    ...(path === '/jobs' && method === 'POST' ? { body: JSON.stringify({ kind: 'ont-basecalling', input: { uri: 'https://example.test/synthetic.pod5' } }) } : {}),
  })
  return { status: response.status, body: await response.json() as Record<string, unknown> }
}

function assertPrivate(response: { body: Record<string, unknown> }) {
  const serialized = JSON.stringify(response.body)
  for (const marker of ['synthetic-internal-job', 'synthetic-internal-owner', 'synthetic-private-diagnostic', 'synthetic-private-bucket']) {
    assert.ok(!serialized.includes(marker), `worker error disclosed ${marker}`)
  }
  assert.ok(!Object.hasOwn(response.body, 'detail'), 'raw worker detail must not be public')
}

test('successful jobs retain signed handles and filtered public status', async () => {
  const created = await request('/jobs', 'POST')
  assert.equal(created.status, 202)
  assert.equal(created.body.status, 'queued')
  const createdHandle = String(created.body.jobHandle)
  assert.ok(createdHandle && createdHandle !== 'synthetic-worker-job')
  assert.deepEqual(created.body.job, { status: 'queued' })
  workerResponse = async () => Response.json({ id: 'synthetic-worker-job', ownerId: owner.id, status: 'running', progress: 0.5 })
  const status = await request(`/jobs/${createdHandle}`)
  assert.equal(status.status, 200)
  assert.deepEqual(status.body, { jobHandle: createdHandle, status: 'running', progress: 0.5 })
  workerResponse = async () => Response.json({ id: 'synthetic-worker-job', status: 'cancelled' })
  const cancelled = await request(`/jobs/${createdHandle}/cancel`, 'POST')
  assert.equal(cancelled.status, 200)
  assert.deepEqual(cancelled.body, { jobHandle: createdHandle, status: 'cancelled' })
})

test('unauthenticated and wrong-owner requests never reach the worker', async () => {
  const beforeCalls = workerCalls
  for (const [path, method] of [['/jobs', 'POST'], [`/jobs/${jobHandle}`, 'GET'], [`/jobs/${jobHandle}/cancel`, 'POST']]) {
    assert.equal((await request(path, method, null)).status, 401)
  }
  for (const [path, method] of [[`/jobs/${jobHandle}`, 'GET'], [`/jobs/${jobHandle}/cancel`, 'POST']]) {
    assert.equal((await request(path, method, other.id)).status, 404)
  }
  assert.equal(workerCalls, beforeCalls)
})

for (const status of [400, 500, 502]) {
  test(`worker HTTP ${status} failures do not disclose diagnostics on any route`, async () => {
    for (const text of [JSON.stringify(privatePayload), 'synthetic-private-diagnostic s3://synthetic-private-bucket/input.pod5']) {
      workerResponse = async () => new Response(text, { status })
      for (const [path, method] of [['/jobs', 'POST'], [`/jobs/${jobHandle}`, 'GET'], [`/jobs/${jobHandle}/cancel`, 'POST']]) {
        const response = await request(path, method)
        assert.equal(response.status, status)
        assert.equal(response.body.error, 'genomics_worker_error')
        assertPrivate(response)
      }
    }
  })
}

test('malformed successful submit responses do not disclose worker details', async () => {
  workerResponse = async () => Response.json({ ...privatePayload, id: undefined })
  const response = await request('/jobs', 'POST')
  assert.equal(response.status, 502)
  assert.equal(response.body.error, 'invalid_genomics_worker_response')
  assertPrivate(response)
})

test('network exceptions do not disclose worker URLs or diagnostics', async () => {
  workerResponse = async () => { throw new Error('synthetic-private-diagnostic s3://synthetic-private-bucket/input.pod5') }
  const response = await request('/jobs', 'POST')
  assert.equal(response.status, 502)
  assert.equal(response.body.error, 'genomics_worker_unreachable')
  assertPrivate(response)
})

test('an unconfigured worker remains an explicit unavailable response', async () => {
  const previous = config.genomics.workerUrl
  const beforeCalls = workerCalls
  config.genomics.workerUrl = ''
  try {
    const response = await request('/jobs', 'POST')
    assert.equal(response.status, 503)
    assert.equal(response.body.error, 'genomics_worker_not_configured')
    assert.equal(response.body.configured, false)
    assert.equal(workerCalls, beforeCalls)
  } finally {
    config.genomics.workerUrl = previous
  }
})

test('worker timeouts retain the controlled gateway-timeout response', async () => {
  workerResponse = async () => { throw new DOMException('synthetic-private-diagnostic', 'AbortError') }
  const response = await request('/jobs', 'POST')
  assert.equal(response.status, 504)
  assert.equal(response.body.error, 'genomics_worker_timeout')
  assertPrivate(response)
})

test('malformed successful worker bodies fail closed on every route', async () => {
  for (const text of ['synthetic-private-diagnostic s3://synthetic-private-bucket/input.pod5', '"synthetic-private-diagnostic"', 'null', '[]', '42', 'false', '']) {
    workerResponse = async () => new Response(text, { status: 200 })
    for (const [path, method] of [['/jobs', 'POST'], [`/jobs/${jobHandle}`, 'GET'], [`/jobs/${jobHandle}/cancel`, 'POST']]) {
      const response = await request(path, method)
      assert.equal(response.status, 502, `${path}: ${text}`)
      assert.equal(response.body.error, 'invalid_genomics_worker_response')
      assertPrivate(response)
    }
  }
})
