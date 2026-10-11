// Alpha E1: actual HTTP middleware with isolated synthetic identities; no external auth provider.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import jwt from 'jsonwebtoken'

const root = fileURLToPath(new URL('..', import.meta.url))
async function withServer(mode: string, run: (base: string, secret: string) => Promise<void>) {
  const port = await new Promise<number>(resolve => {
    const s = createServer().listen(0, '127.0.0.1', () => {
      const p = (s.address() as { port: number }).port; s.close(() => resolve(p))
    })
  })
  const dir = mkdtempSync(join(tmpdir(), 'panacea-auth-http-')), secret = randomBytes(32).toString('hex')
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: root, stdio: 'ignore', env: { ...process.env, NODE_ENV: mode, PORT: String(port), JWT_SECRET: secret,
      ALLOW_DEV_LOGIN: 'true', PANACEA_DATA_FILE: join(dir, 'data.json'), MONGODB_URI: '',
      GOOGLE_CLIENT_ID: '', SMTP_HOST: '', SMTP_USER: '', RESEND_API_KEY: '', OWNER_EMAIL: '', COOKIE_SECURE: 'false' },
  })
  const exited = new Promise<void>(resolve => child.once('exit', () => resolve()))
  let failed = false; child.once('error', () => { failed = true })
  const base = `http://127.0.0.1:${port}`
  try {
    let ready = false
    for (let i = 0; i < 120 && !ready; i++) {
      assert.ok(!failed && child.exitCode === null, 'isolated auth server exited before readiness')
      try { ready = (await fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) })).ok } catch { /* startup */ }
      if (!ready) await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(ready, 'isolated auth server must start'); await run(base, secret)
  } finally {
    child.kill('SIGTERM')
    let timer: ReturnType<typeof setTimeout> | undefined
    try { await Promise.race([exited, new Promise<void>(resolve => { timer = setTimeout(resolve, 5000) })]) }
    finally { if (timer) clearTimeout(timer) }
    if (!failed && child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited }
    rmSync(dir, { recursive: true, force: true })
  }
}
await withServer('development', async (base, secret) => {
  const login = async (email: string) => {
    const r = await fetch(base + '/api/auth/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, name: 'Synthetic auth fixture', role: 'pasien' }), signal: AbortSignal.timeout(5000) })
    assert.equal(r.status, 200, 'fixture login succeeds')
    assert.match(r.headers.get('set-cookie') ?? '', /pmd_session=.*HttpOnly/i)
    return await r.json() as { token: string; user: { id: string } }
  }
  const alice = await login('alice-auth@localhost.test'), bob = await login('bob-auth@localhost.test')
  assert.notEqual(alice.user.id, bob.user.id)
  const headersFor = (transport: string, token: string): Record<string, string> => transport === 'bearer'
    ? { authorization: `Bearer ${token}` } : { cookie: `pmd_session=${token}` }
  const request = (path: string, headers: Record<string, string> = {}) => fetch(base + path, { headers, signal: AbortSignal.timeout(5000) })
  for (const path of ['/api/auth/me', '/api/clinical']) {
    assert.equal((await request(path)).status, 401, `anonymous: ${path}`)
    for (const transport of ['bearer', 'cookie']) assert.equal((await request(path, headersFor(transport, alice.token))).status, 200, `valid ${transport}: ${path}`)
  }
  for (const actor of [alice, bob]) {
    const r = await request('/api/auth/me', headersFor('bearer', actor.token))
    assert.equal((await r.json()).user.id, actor.user.id, 'valid session resolves its actual stored identity')
  }
  const parts = alice.token.split('.'), payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
  const tampered = [parts[0], Buffer.from(JSON.stringify({ ...payload, uid: bob.user.id })).toString('base64url'), parts[2]].join('.')
  const negative = [
    ['malformed', 'not-a-jwt'], ['truncated signature', `${parts[0]}.${parts[1]}`],
    ['existing identity substituted', tampered],
    ['wrong signing key', jwt.sign({ uid: alice.user.id }, randomBytes(32).toString('hex'))],
    ['unsigned algorithm none', jwt.sign({ uid: alice.user.id }, undefined, { algorithm: 'none' })],
    ['expired signed token', jwt.sign({ uid: alice.user.id }, secret, { expiresIn: -60 })],
    ['valid signature missing principal', jwt.sign({}, secret)],
    ['valid signature unknown principal', jwt.sign({ uid: 'nonexistent-synthetic-user' }, secret)],
  ]
  for (const [name, token] of negative) for (const transport of ['bearer', 'cookie']) for (const path of ['/api/auth/me', '/api/clinical']) {
    const r = await request(path, headersFor(transport, token))
    assert.equal(r.status, 401, `${name} via ${transport}: ${path}`)
    assert.deepEqual(await r.json(), { error: 'unauthorized' }, 'rejection reveals no identity')
  }
  assert.equal((await request('/api/auth/me', { authorization: 'Bearer invalid', cookie: `pmd_session=${alice.token}` })).status, 401, 'invalid bearer must not fall back to valid cookie')
  assert.equal((await request('/api/auth/me', headersFor('bearer', alice.token))).status, 200, 'negative attempts preserve valid session')
  console.log(`authSessionHttp: anonymous and ${negative.length} invalid-session classes rejected over real HTTP; cookie/bearer; valid identities preserved`)
})
await withServer('production', async base => {
  const r = await fetch(base + '/api/auth/dev-login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'production-fixture@localhost.test', role: 'owner' }), signal: AbortSignal.timeout(5000) })
  assert.equal(r.status, 404, 'production dev login remains disabled even with ALLOW_DEV_LOGIN=true')
  assert.equal(r.headers.get('set-cookie'), null, 'disabled production login cannot issue a session cookie')
  assert.deepEqual(await r.json(), { error: 'dev_login_disabled' })
  assert.equal((await fetch(base + '/api/auth/me', { signal: AbortSignal.timeout(5000) })).status, 401)
  console.log('authSessionHttp: production dev-login bypass rejected')
})
