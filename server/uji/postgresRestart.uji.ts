// Multi-process real Neon Postgres persistence + restart + UU PDP erasure proof (isolated temp schema).
import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const serverRoot = fileURLToPath(new URL('..', import.meta.url))
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim()
  const envFile = join(repoRoot, '.env.local')
  if (!existsSync(envFile)) return ''
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const idx = t.indexOf('=')
    if (t.slice(0, idx).trim() === 'DATABASE_URL') return t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '')
  }
  return ''
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => { const p = (s.address() as { port: number }).port; s.close((e) => e ? reject(e) : resolve(p)) })
  })
}

async function boot(port: number, env: Record<string, string>) {
  const child: ChildProcess = spawn(process.execPath, [join(serverRoot, 'dist', 'index.js')], { cwd: serverRoot, stdio: 'ignore', env })
  const exited = new Promise<void>((r) => child.once('exit', () => r()))
  const base = `http://127.0.0.1:${port}`
  for (let i = 0; i < 80; i++) {
    assert.equal(child.exitCode, null, 'postgres server exited prematurely')
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1500) })
      if (res.ok) {
        const h = await res.json() as { penyimpanan: string }
        assert.equal(h.penyimpanan, 'postgres', 'must run in postgres storage mode')
        return { base, child, exited }
      }
    } catch { /* retrying */ }
    await new Promise((r) => setTimeout(r, 250))
  }
  child.kill('SIGKILL')
  throw new Error('Postgres server boot timeout')
}

async function shutdown(proc: { child: ChildProcess; exited: Promise<void> }) {
  if (proc.child.exitCode !== null) return
  proc.child.kill('SIGTERM')
  await Promise.race([proc.exited, new Promise((r) => setTimeout(r, 8000))])
  if (proc.child.exitCode === null) { proc.child.kill('SIGKILL'); await proc.exited }
}

const dbUrl = resolveDatabaseUrl()
assert.ok(dbUrl, 'DATABASE_URL required for live postgresRestart verification')
const isoSchema = `panacea_pg_restart_${Date.now()}`
const dir = mkdtempSync(join(tmpdir(), 'panacea-pg-restart-'))
const pool = new pg.Pool({ connectionString: dbUrl, max: 3, connectionTimeoutMillis: 10_000 })
const secret = randomBytes(32).toString('hex')
const ownerEmail = 'pg-owner@localhost.test'

let proc: { base: string; child: ChildProcess; exited: Promise<void> } | null = null
try {
  const baseEnv: Record<string, string> = {
    ...process.env as Record<string, string>,
    NODE_ENV: 'development',
    JWT_SECRET: secret,
    ALLOW_DEV_LOGIN: 'true',
    OWNER_EMAIL: ownerEmail,
    COOKIE_SECURE: 'false',
    DATABASE_URL: dbUrl,
    PANACEA_STORAGE_BACKEND: 'postgres',
    PANACEA_PG_SCHEMA: isoSchema,
    PANACEA_DATA_FILE: join(dir, 'ephemeral-1.json'),
    PANACEA_ARCHIVE_DIR: join(dir, 'archive'),
    MONGODB_URI: '',
  }

  const p1 = await freePort()
  proc = await boot(p1, { ...baseEnv, PORT: String(p1) })
  const call = async (m: string, p: string, token?: string, body?: unknown) => {
    const r = await fetch(`${proc!.base}${p}`, {
      method: m,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return { status: r.status, body: await r.json().catch(() => null) }
  }

  const owner = await call('POST', '/api/auth/dev-login', undefined, { email: ownerEmail, name: 'PG Owner', role: 'pasien' })
  const alice = await call('POST', '/api/auth/dev-login', undefined, { email: 'pg-alice@localhost.test', name: 'Alice PG', role: 'pasien' })
  assert.equal(owner.status, 200)
  assert.equal(alice.status, 200)
  assert.equal((await call('PUT', '/api/health-profile', alice.body.token, { profile: { restingHr: 61 } })).status, 200)
  assert.equal((await call('POST', '/api/privacy/consent', alice.body.token, { purpose: 'neon_sync', policyVersion: 'v1', granted: true })).status, 201)
  assert.equal((await call('POST', '/api/owner/rollout', owner.body.token, { stage: 'stage-200', maxAccounts: 200, signupKillSwitch: true })).status, 200)

  await shutdown(proc)
  rmSync(join(dir, 'ephemeral-1.json'), { force: true })

  // Boot fresh Process 2 on an empty local file path -> must recover 100% from Neon Postgres
  const p2 = await freePort()
  proc = await boot(p2, { ...baseEnv, PORT: String(p2), PANACEA_DATA_FILE: join(dir, 'ephemeral-2.json') })
  const prof = await call('GET', '/api/health-profile', alice.body.token)
  assert.equal(prof.status, 200)
  assert.equal(prof.body.profile.restingHr, 61)
  const cons = await call('GET', '/api/privacy/consent', alice.body.token)
  assert.equal(cons.body.consents.length, 1)
  const rollout = await call('GET', '/api/owner/rollout', owner.body.token)
  assert.equal(rollout.body.stage, 'stage-200')
  assert.equal(rollout.body.signupKillSwitch, true)
  assert.equal(rollout.body.currentAccountCount, 2)

  // Erase Alice via UU PDP endpoint -> verify Postgres relational account table pruned
  assert.equal((await call('DELETE', '/api/privacy/account', alice.body.token, { confirm: 'HAPUS_AKUN_SAYA' })).status, 200)
  await shutdown(proc); proc = null

  const cntRes = await pool.query(`SELECT count(*)::int AS n FROM "${isoSchema}"."panacea_app_accounts"`)
  assert.equal(cntRes.rows[0].n, 1, 'only owner account must remain in panacea_app_accounts after erasure')
  console.log(`postgresRestart: Neon multi-process restart, persisted kill-switch, and UU PDP account pruning passed (schema=${isoSchema})`)
} finally {
  if (proc) await shutdown(proc)
  await pool.query(`DROP SCHEMA IF EXISTS "${isoSchema}" CASCADE`).catch(() => {})
  await pool.end()
  rmSync(dir, { recursive: true, force: true })
}
