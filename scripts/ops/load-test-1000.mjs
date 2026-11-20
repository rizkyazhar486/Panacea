#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SERVER_DIR = path.join(ROOT, 'server')
const SERVER_ENTRY = path.join(SERVER_DIR, 'dist', 'index.js')
const STAGES = [50, 200, 1000]
const CONCURRENCY = 20

const pct = (sorted, p) => sorted.length ? Number(sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))].toFixed(1)) : 0

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close((e) => (e ? reject(e) : resolve(port)))
    })
  })
}

async function startServer(port, env) {
  const t0 = performance.now()
  const child = spawn(process.execPath, [SERVER_ENTRY], { cwd: SERVER_DIR, stdio: 'ignore', env })
  const exited = new Promise((resolve) => child.once('exit', (code, sig) => resolve({ code, sig })))
  const base = `http://127.0.0.1:${port}`
  for (let i = 0; i < 200; i++) {
    if (child.exitCode !== null) throw new Error(`Server exited early with ${child.exitCode}`)
    try {
      const r = await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(1000) })
      if (r.ok) return { base, coldStartMs: Number((performance.now() - t0).toFixed(1)), child, exited }
    } catch { /* retrying */ }
    await new Promise((r) => setTimeout(r, 50))
  }
  child.kill('SIGKILL')
  throw new Error('Server cold-start timeout')
}

async function stopServer(proc) {
  if (proc.child.exitCode !== null) return
  proc.child.kill('SIGTERM')
  await Promise.race([proc.exited, new Promise((r) => setTimeout(r, 8000))])
  if (proc.child.exitCode === null) { proc.child.kill('SIGKILL'); await proc.exited }
}

async function timedReq(base, method, route, headers, body) {
  const t0 = performance.now()
  try {
    const r = await fetch(`${base}${route}`, {
      method,
      headers: { 'content-type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    })
    const ms = performance.now() - t0
    const json = r.headers.get('content-type')?.includes('json') ? await r.json().catch(() => null) : await r.text().catch(() => null)
    return { ok: r.status >= 200 && r.status < 300, status: r.status, ms, json }
  } catch {
    return { ok: false, status: 0, ms: performance.now() - t0, json: null }
  }
}

async function runStage(base, count, offset) {
  const lat = []; const perRoute = { login: [], me: [], profilePut: [], profileGet: [], status: [] }
  let errors = 0; let nextIdx = 0; const tStart = performance.now()
  const samples = []

  async function worker() {
    while (true) {
      const i = nextIdx++
      if (i >= count) break
      const uid = offset + i
      const ip = `10.42.${Math.floor(uid / 250) + 1}.${(uid % 250) + 1}`
      const email = `load-${uid}@localhost.test`
      const h = { 'x-forwarded-for': ip }

      const login = await timedReq(base, 'POST', '/api/auth/dev-login', h, { email, name: `Load ${uid}`, role: 'pasien' })
      lat.push(login.ms); perRoute.login.push(login.ms); if (!login.ok) { errors++; continue }
      const tok = login.json?.token
      const authH = { ...h, authorization: `Bearer ${tok}` }

      const me = await timedReq(base, 'GET', '/api/auth/me', authH)
      const put = await timedReq(base, 'PUT', '/api/health-profile', authH, { profile: { restingHr: 55 + (uid % 25), steps: 8000 } })
      const get = await timedReq(base, 'GET', '/api/health-profile', authH)
      const st = await timedReq(base, 'GET', '/api/status', h)

      for (const [k, res] of [['me', me], ['profilePut', put], ['profileGet', get], ['status', st]]) {
        lat.push(res.ms); perRoute[k].push(res.ms)
        if (!res.ok) errors++
      }
      if (i < 5) samples.push({ email, token: tok, expectedHr: 55 + (uid % 25) })
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  const elapsedMs = performance.now() - tStart
  const totalReqs = lat.length
  const sorted = [...lat].sort((a, b) => a - b)
  const routeP95 = Object.fromEntries(Object.entries(perRoute).map(([k, v]) => [k, pct([...v].sort((a, b) => a - b), 95)]))
  return {
    users: count, totalReqs, errors, errorRatePct: Number(((errors / Math.max(1, totalReqs)) * 100).toFixed(3)),
    throughputRps: Number(((totalReqs / elapsedMs) * 1000).toFixed(1)),
    p50Ms: pct(sorted, 50), p95Ms: pct(sorted, 95), p99Ms: pct(sorted, 99), maxMs: pct(sorted, 100),
    routeP95Ms: routeP95, samples,
  }
}

async function main() {
  if (!fs.existsSync(SERVER_ENTRY)) throw new Error('server/dist/index.js missing; run cd server && npm run build first')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'panacea-load1000-'))
  const dataFile = path.join(tmpDir, 'data.json')
  const ownerEmail = 'load-owner@localhost.test'
  const env = {
    ...process.env, NODE_ENV: 'development', PORT: '0', JWT_SECRET: crypto.randomBytes(32).toString('hex'),
    ALLOW_DEV_LOGIN: 'true', OWNER_EMAIL: ownerEmail, COOKIE_SECURE: 'false',
    PANACEA_ROLLOUT_STAGE: 'open', PANACEA_DATA_FILE: dataFile, PANACEA_ARCHIVE_DIR: path.join(tmpDir, 'archive'),
    MONGODB_URI: '', GOOGLE_CLIENT_ID: '', RESEND_API_KEY: '', VAPID_PUBLIC_KEY: '', MIDTRANS_SERVER_KEY: '',
  }

  let proc
  try {
    const port1 = await freePort()
    proc = await startServer(port1, { ...env, PORT: String(port1) })
    const initialColdStartMs = proc.coldStartMs
    const ownerRes = await timedReq(proc.base, 'POST', '/api/auth/dev-login', { 'x-forwarded-for': '10.42.0.1' }, { email: ownerEmail, name: 'Load Owner', role: 'pasien' })
    assert.equal(ownerRes.ok, true)

    const stages = []
    let offset = 1
    for (const count of STAGES) {
      const res = await runStage(proc.base, count, offset)
      offset += count
      stages.push(res)
    }

    // Restart durability verification on exact same data file
    await stopServer(proc)
    const port2 = await freePort()
    proc = await startServer(port2, { ...env, PORT: String(port2) })
    const rolloutAfter = await timedReq(proc.base, 'GET', '/api/owner/rollout', { 'x-forwarded-for': '10.42.0.2', authorization: `Bearer ${ownerRes.json.token}` })
    assert.equal(rolloutAfter.ok, true)
    const expectedAccounts = 1 + STAGES.reduce((a, b) => a + b, 0)
    const persistedAccounts = rolloutAfter.json.currentAccountCount
    let sampleMismatch = 0
    for (const st of stages) {
      for (const s of st.samples) {
        const prof = await timedReq(proc.base, 'GET', '/api/health-profile', { authorization: `Bearer ${s.token}` })
        if (!prof.ok || prof.json?.profile?.restingHr !== s.expectedHr) sampleMismatch++
      }
    }
    const lostUsers = Math.max(0, expectedAccounts - persistedAccounts) + sampleMismatch
    const pass = stages.every((s) => s.errorRatePct < 1 && s.p95Ms < 1500) && lostUsers === 0
    console.log(JSON.stringify({
      status: pass ? 'LOAD_TEST_PASSED' : 'LOAD_TEST_FAILED',
      initialColdStartMs,
      restartColdStartMs: proc.coldStartMs,
      stages: stages.map(({ samples: _s, ...rest }) => rest),
      durability: { expectedAccounts, persistedAccounts, sampleMismatch, lostUsers },
    }, null, 2))
    if (!pass) process.exitCode = 1
  } finally {
    if (proc) await stopServer(proc)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

main().catch((err) => {
  console.error(`load-test-1000 FAILED: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
