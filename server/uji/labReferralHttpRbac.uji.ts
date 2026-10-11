// Alpha E2: real HTTP lab/referral authorization; synthetic workflow evidence only.
// Isolated file mode; account verification and lifecycle steps are workflow fixtures, not clinical approval.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = mkdtempSync(join(tmpdir(), 'panacea-lab-rbac-'))
const dataFile = join(directory, 'data.json')
const secret = randomBytes(32).toString('hex')
const ownerEmail = 'lab-rbac-owner@localhost.test'
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
      assert.ok(!failed && child.exitCode === null && child.signalCode === null, 'isolated lab/referral server exited before readiness')
      try {
        const response = await fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) })
        if (response.ok) {
          const health = await response.json() as { penyimpanan: string }
          assert.equal(health.penyimpanan, 'berkas', 'E2 fixture must exercise explicit isolated file mode')
          ready = true
        }
      } catch (error) { if (error instanceof assert.AssertionError) throw error }
      if (!ready) await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(ready, 'isolated lab/referral server must start')
    return { child, call, stop }
  } catch (error) { await stop(); throw error }
}

let running: Awaited<ReturnType<typeof start>> | undefined
try {
  running = await start()
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('lab-rbac-doctor@localhost.test', 'dokter')
  const alice = await login('lab-rbac-alice@localhost.test', 'pasien')
  const bob = await login('lab-rbac-bob@localhost.test', 'pasien')
  const unverified = await login('lab-rbac-unverified@localhost.test', 'dokter')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, alice.token, { status: 'verified' })).status, 403)
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const pid = (u: { user: { id: string } }) => `self-u-${u.user.id}`
  const item = { name: 'Synthetic private observation', valueText: 'fixture only', collectedAt: '2026-01-01' }
  const labInput = (patientId: string) => ({ patientId, item, source: 'lab-intake' })
  const referralInput = (patientId: string) => ({ patientId, kind: 'specialist', reason: 'Synthetic workflow fixture', toFacility: 'Synthetic facility' })
  const subjects = []
  for (const account of [alice, unverified]) {
    const patientId = pid(account)
    assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: patientId, name: 'Synthetic isolated subject' } })).status, 200)
    const lab = await call('POST', '/api/lab-results', doctor.token, labInput(patientId))
    const referral = await call('POST', '/api/referrals', doctor.token, referralInput(patientId))
    assert.equal(lab.status, 201); assert.equal(referral.status, 201)
    assert.equal(lab.body.patientId, patientId); assert.equal(lab.body.provenance.recordedBy, doctor.user.id)
    assert.ok(Number.isFinite(Date.parse(lab.body.provenance.recordedAt)))
    assert.equal(lab.body.status, 'received'); assert.equal(referral.body.status, 'requested')
    subjects.push({ account, patientId, lab: lab.body, referral: referral.body })
  }
  const first = subjects[0]!
  const matrix: Record<string, { path: string; body?: unknown }> = {
    'POST /api/lab-results': { path: '/api/lab-results', body: labInput(first.patientId) },
    'GET /api/lab-results': { path: '/api/lab-results' },
    'GET /api/lab-results/metrics': { path: '/api/lab-results/metrics' },
    'GET /api/lab-results/:id': { path: `/api/lab-results/${first.lab.id}` },
    'POST /api/lab-results/:id/advance': { path: `/api/lab-results/${first.lab.id}/advance`, body: { to: 'pending_review' } },
    'POST /api/referrals': { path: '/api/referrals', body: referralInput(first.patientId) },
    'GET /api/referrals': { path: '/api/referrals' },
    'GET /api/referrals/:id': { path: `/api/referrals/${first.referral.id}` },
    'POST /api/referrals/:id/advance': { path: `/api/referrals/${first.referral.id}/advance`, body: { to: 'accepted' } },
  }
  const source = readFileSync(join(root, 'src/modules/labResults/http/routes.ts'), 'utf8')
  const routes = [...source.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/(?:lab-results|referrals)[^']*)'/g)].map(m => `${m[1]!.toUpperCase()} ${m[2]}`)
  assert.deepEqual([...routes].sort(), Object.keys(matrix).sort(), 'all registered lab/referral routes require an HTTP authorization decision')
  const snapshot = async () => {
    const lab = await call('GET', '/api/lab-results', doctor.token)
    const referrals = await call('GET', '/api/referrals', doctor.token)
    assert.equal(lab.status, 200); assert.equal(referrals.status, 200)
    return { lab: lab.body, referrals: referrals.body }
  }
  const deny = async (method: string, path: string, token: string | undefined, body: unknown, status: number, label: string) => {
    const before = await snapshot()
    assert.equal((await call(method, path, token, body)).status, status, label)
    assert.deepEqual(await snapshot(), before, `${label}: denial preserves exact authorized clinical collections`)
  }
  for (const [route, request] of Object.entries(matrix)) {
    await deny(route.split(' ')[0]!, request.path, undefined, request.body, 401, `anonymous ${route}`)
  }
  for (const subject of subjects) {
    const { account, patientId, lab, referral } = subject
    assert.deepEqual((await call('GET', `/api/lab-results/${lab.id}`, account.token)).body, lab, 'own existing lab readable exactly')
    assert.deepEqual((await call('GET', `/api/referrals/${referral.id}`, account.token)).body, referral, 'own existing referral readable exactly')
    const labs = await call('GET', '/api/lab-results', account.token)
    const referrals = await call('GET', '/api/referrals', account.token)
    assert.equal(labs.status, 200); assert.equal(referrals.status, 200)
    assert.deepEqual(labs.body.results, [lab], 'patient lab list excludes other populated subjects'); assert.deepEqual(referrals.body.referrals, [referral], 'patient referral list excludes other populated subjects')
    await deny('POST', '/api/lab-results', account.token, labInput(patientId), 403, 'patient/effective unverified doctor intake denied')
    await deny('POST', '/api/referrals', account.token, referralInput(patientId), 403, 'patient/effective unverified doctor referral create denied')
    await deny('POST', `/api/lab-results/${lab.id}/advance`, account.token, { to: 'pending_review' }, 403, 'own lab does not grant transition role')
    await deny('POST', `/api/referrals/${referral.id}/advance`, account.token, { to: 'accepted' }, 403, 'own referral does not grant transition role')
    await deny('GET', '/api/lab-results/metrics', account.token, undefined, 403, 'patient/effective unverified doctor metrics denied')
  }
  for (const subject of subjects) {
    await deny('GET', `/api/lab-results/${subject.lab.id}`, bob.token, undefined, 404, 'foreign existing lab concealed')
    await deny('GET', `/api/referrals/${subject.referral.id}`, bob.token, undefined, 404, 'foreign existing referral concealed')
    await deny('POST', `/api/lab-results/${subject.lab.id}/advance`, bob.token, { to: 'pending_review' }, 404, 'foreign lab transition concealed')
    await deny('POST', `/api/referrals/${subject.referral.id}/advance`, bob.token, { to: 'accepted' }, 404, 'foreign referral transition concealed')
  }
  assert.deepEqual((await call('GET', '/api/lab-results', bob.token)).body, { results: [] })
  assert.deepEqual((await call('GET', '/api/referrals', bob.token)).body, { referrals: [] })
  assert.deepEqual((await call('GET', `/api/lab-results?patientId=${first.patientId}`, bob.token)).body, { results: [] })
  assert.deepEqual((await call('GET', `/api/referrals?patientId=${first.patientId}`, bob.token)).body, { referrals: [] })
  const pending = await call('POST', `/api/lab-results/${first.lab.id}/advance`, doctor.token, { to: 'pending_review', actorId: owner.user.id })
  assert.equal(pending.status, 200); assert.equal(pending.body.status, 'pending_review')
  assert.equal(pending.body.trail[0].actorId, doctor.user.id, 'transition provenance is authenticated, not client-selected')
  assert.equal(pending.body.trail[0].role, 'clinician'); assert.ok(Number.isFinite(Date.parse(pending.body.trail[0].at)))
  await deny('POST', `/api/lab-results/${first.lab.id}/advance`, owner.token, { to: 'reviewed' }, 403, 'owner cannot substitute for clinician review')
  assert.equal((await call('POST', `/api/lab-results/${first.lab.id}/advance`, doctor.token, { to: 'reviewed' })).status, 200)
  // Lifecycle "reviewed" is a synthetic authorization fixture, not medical validation.
  const adminLab = await call('POST', '/api/lab-results', owner.token, labInput(first.patientId))
  assert.equal(adminLab.status, 201); assert.equal(adminLab.body.provenance.recordedBy, owner.user.id)
  assert.equal((await call('POST', `/api/lab-results/${adminLab.body.id}/advance`, owner.token, { to: 'pending_review' })).status, 200)
  await deny('POST', `/api/lab-results/${adminLab.body.id}/advance`, owner.token, { to: 'reviewed' }, 403, 'admin intake cannot grant clinical review')
  assert.equal((await call('POST', `/api/referrals/${first.referral.id}/advance`, owner.token, { to: 'accepted' })).status, 200)
  assert.equal((await call('POST', `/api/referrals/${first.referral.id}/advance`, owner.token, { to: 'scheduled' })).status, 200)
  await deny('POST', `/api/referrals/${first.referral.id}/advance`, owner.token, { to: 'completed' }, 403, 'admin scheduling cannot grant clinical completion')
  const completed = await call('POST', `/api/referrals/${first.referral.id}/advance`, doctor.token, { to: 'completed' })
  assert.equal(completed.status, 200); assert.equal(completed.body.trail.at(-1).actorId, doctor.user.id)
  assert.equal((await call('GET', '/api/lab-results/metrics', doctor.token)).status, 200)
  console.log('labReferralHttpRbac: nine real HTTP routes, populated own/foreign subjects, unverified doctor and admin limits, authenticated transitions and exact no-mutation denials; passed')
} finally {
  try { await running?.stop() } finally { rmSync(directory, { recursive: true, force: true }) }
}
