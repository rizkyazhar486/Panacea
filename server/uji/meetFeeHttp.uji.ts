// Real isolated HTTP fee validation; no live services, payments or patient data.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = mkdtempSync(join(tmpdir(), 'panacea-meet-fee-'))
const dataFile = join(directory, 'data.json')
const secret = randomBytes(32).toString('hex')
const ownerEmail = 'meet-fee-owner@localhost.test'
const root = fileURLToPath(new URL('..', import.meta.url))

async function start() {
  const port = await new Promise<number>((resolve, reject) => {
    const listener = createServer()
    listener.once('error', reject)
    listener.listen(0, '127.0.0.1', () => {
      const port = (listener.address() as { port: number }).port
      listener.close(error => error ? reject(error) : resolve(port))
    })
  })
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: root, stdio: 'ignore', env: {
      ...process.env, NODE_ENV: 'development', PORT: String(port), JWT_SECRET: secret,
      ALLOW_DEV_LOGIN: 'true', OWNER_EMAIL: ownerEmail, COOKIE_SECURE: 'false',
      PANACEA_DATA_FILE: dataFile, PANACEA_ARCHIVE_DIR: join(directory, 'archive'), MONGODB_URI: '',
      GOOGLE_CLIENT_ID: '', RESEND_API_KEY: '', SMTP_HOST: '', SMTP_USER: '',
      VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', MIDTRANS_SERVER_KEY: '', MIDTRANS_CLIENT_KEY: '',
      IRIS_API_KEY: '', IRIS_CREATOR_KEY: '', ANTHROPIC_API_KEY: '', OPENROUTER_API_KEY: '',
      GENOMICS_WORKER_URL: '', WHO_ICD_CLIENT_ID: '', WHO_ICD_CLIENT_SECRET: '',
    },
  })
  let failed = false
  const exited = new Promise<void>(resolve => {
    child.once('exit', () => resolve())
    child.once('error', () => { failed = true; resolve() })
  })
  const stop = async () => {
    if (failed || child.exitCode !== null || child.signalCode !== null) return
    child.kill('SIGTERM')
    let timer: ReturnType<typeof setTimeout> | undefined
    try { await Promise.race([exited, new Promise<void>(resolve => { timer = setTimeout(resolve, 5000) })]) }
    finally { if (timer) clearTimeout(timer) }
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited }
  }
  const base = `http://127.0.0.1:${port}`
  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const response = await fetch(base + path, {
      method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(5000),
    })
    return { status: response.status, body: await response.json() as any }
  }
  try {
    let ready = false
    for (let i = 0; i < 120 && !ready; i++) {
      assert.ok(!failed && child.exitCode === null && child.signalCode === null, 'isolated meet server exited before readiness')
      try {
        const response = await fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) })
        if (response.ok) {
          const health = await response.json() as { penyimpanan: string }
          assert.equal(health.penyimpanan, 'berkas', 'Meet fixture must exercise explicit isolated file mode')
          ready = true
        }
      } catch (error) { if (error instanceof assert.AssertionError) throw error }
      if (!ready) await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(ready, 'isolated meet server must start')
    return { child, call, stop }
  } catch (error) { await stop(); throw error }
}

let running: Awaited<ReturnType<typeof start>> | undefined
try {
  running = await start()
  const { call } = running
  const login = await call('POST', '/api/auth/dev-login', undefined, {
    email: 'meet-host@localhost.test', role: 'pasien', name: 'Synthetic meet host',
  })
  assert.equal(login.status, 200)
  const token = login.body.token as string
  const input = { title: 'Synthetic fee fixture', venue: 'Synthetic venue', time: '10:00' }
  assert.equal((await call('POST', '/api/meets', undefined, { ...input, feeRp: 0 })).status, 401)
  const initial = (await call('GET', '/api/meets')).body
  for (const feeRp of [undefined, null, '', ' ', '0', '1000', true, false, [], {}, -1, 0.5, 10_000_001, Number.MAX_SAFE_INTEGER]) {
    const response = await call('POST', '/api/meets', token, { ...input, feeRp })
    assert.equal(response.status, 400, `invalid fee ${JSON.stringify(feeRp)} must not publish a meet`)
    assert.equal(response.body.error, 'invalid_fee')
    assert.deepEqual((await call('GET', '/api/meets')).body, initial, 'invalid fee must leave shared meets unchanged')
  }
  const created = []
  for (const feeRp of [0, 1, 25_000, 10_000_000]) {
    const response = await call('POST', '/api/meets', token, { ...input, feeRp, hostEmail: 'forged@localhost.test' })
    assert.equal(response.status, 200)
    assert.equal(response.body.meet.feeRp, feeRp, 'explicit zero and whole rupiah must persist unchanged')
    assert.equal(response.body.meet.hostEmail, 'meet-host@localhost.test', 'host identity remains server-controlled')
    created.push(response.body.meet)
  }
  const expected = [...created].reverse().concat(initial.meets)
  assert.deepEqual((await call('GET', '/api/meets')).body.meets, expected)
  // The actual file-mode persistence must contain the same values, not only an in-memory response.
  const stored = JSON.parse(readFileSync(dataFile, 'utf8'))
  assert.deepEqual(stored.meets, expected)
  console.log('Meet HTTP fees reject invalid input without writes; explicit free/paid values persist exactly.')
} finally {
  await running?.stop()
  rmSync(directory, { recursive: true, force: true })
}
