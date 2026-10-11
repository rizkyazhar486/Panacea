// Alpha A2: synthetic HTTP encounter creation and application-process restart.
// File persistence only; signing is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = mkdtempSync(join(tmpdir(), 'panacea-encounter-http-'))
const dataFile = join(directory, 'data.json')
const secret = randomBytes(32).toString('hex')
const ownerEmail = 'encounter-owner@localhost.test'
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
      assert.ok(!failed && child.exitCode === null && child.signalCode === null, 'isolated encounter server exited before readiness')
      try {
        const response = await fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) })
        if (response.ok) {
          const health = await response.json() as { penyimpanan: string }
          assert.equal(health.penyimpanan, 'berkas', 'A2 fixture must exercise explicit isolated file mode')
          ready = true
        }
      } catch (error) { if (error instanceof assert.AssertionError) throw error }
      if (!ready) await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(ready, 'isolated encounter server must start')
    return { child, call, stop }
  } catch (error) { await stop(); throw error }
}

let running: Awaited<ReturnType<typeof start>> | undefined
try {
  running = await start()
  let call = running.call
  const login = async (email: string, role: string, name: string) => {
    const response = await call('POST', '/api/auth/dev-login', undefined, { email, role, name })
    assert.equal(response.status, 200, 'synthetic identity login succeeds')
    return response.body as { token: string; user: { id: string; name: string } }
  }
  const owner = await login(ownerEmail, 'pasien', 'Synthetic fixture owner')
  const doctor = await login('encounter-doctor@localhost.test', 'dokter', 'Synthetic fixture doctor')
  const unrelated = await login('encounter-unrelated@localhost.test', 'pasien', 'Synthetic unrelated patient')
  const unverified = await login('encounter-unverified@localhost.test', 'dokter', 'Synthetic unverified doctor')
  const patientId = 'synthetic-encounter-patient'
  const recordId = 'synthetic-encounter-record'
  const record = {
    id: recordId, patientId, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    anamnesis: { keluhanUtama: 'Synthetic restart fixture; no clinical judgement' },
    physicalExam: { general: 'Synthetic workflow fixture', doctorVerified: true },
    problems: [], plan: [], references: [],
    signedAt: 'sign-intent', signedById: 'client-forged-signer', signedBy: 'Client-forged signer',
    clinically_reviewed: false,
  }
  assert.equal((await call('GET', '/api/clinical/records/' + patientId, doctor.token)).status, 403, 'doctor without STR cannot read practice records')
  assert.equal((await call('POST', '/api/clinical/record', doctor.token, { patientId, record })).status, 403, 'doctor without STR cannot write practice records')
  assert.equal((await call('POST', '/api/doctors/' + doctor.user.id + '/verify', unrelated.token, { status: 'verified' })).status, 403, 'patient cannot grant clinician verification')
  assert.equal((await call('POST', '/api/doctors/' + doctor.user.id + '/verify', owner.token, { status: 'verified' })).status, 200, 'owner verifies doctor through actual API')
  assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: {
    id: patientId, name: 'Synthetic encounter patient', sex: 'L', dob: '1990-01-01',
    mrn: 'synthetic-mrn', allergies: [], chronicConditions: [], riskFlags: [],
  } })).status, 200, 'verified doctor creates synthetic patient through API')
  const signed = await call('POST', '/api/clinical/record', doctor.token, { patientId, record })
  assert.equal(signed.status, 200, 'verified doctor creates and signs encounter record through API')
  assert.equal(signed.body.record.id, recordId)
  assert.equal(signed.body.record.signedById, doctor.user.id, 'signer identity comes from authenticated doctor')
  assert.equal(signed.body.record.signedBy, doctor.user.name)
  assert.ok(Number.isFinite(Date.parse(signed.body.record.signedAt)), 'signature time is server-stamped')
  assert.notEqual(signed.body.record.signedAt, record.signedAt)
  assert.equal(signed.body.record.physicalExam.verifiedById, doctor.user.id)
  assert.equal(signed.body.record.asalIsian['anamnesis.keluhanUtama'].olehId, doctor.user.id)
  assert.equal(signed.body.record.asalIsian['anamnesis.keluhanUtama'].asal, 'Dokter')
  assert.equal(signed.body.record.clinically_reviewed, false, 'synthetic signing cannot imply clinical review')
  const readRecords = async () => {
    const response = await call('GET', '/api/clinical/records/' + patientId, doctor.token)
    assert.equal(response.status, 200, 'authorized doctor reads persisted encounter records')
    return response.body.records as any[]
  }
  assert.deepEqual(await readRecords(), [signed.body.record], 'created signed record reads back exactly')
  const beforeMismatch = await readRecords()
  const mismatch = await call('POST', '/api/clinical/record', doctor.token, { patientId, record: { ...record, patientId: 'different-synthetic-patient' } })
  assert.equal(mismatch.status, 400)
  assert.deepEqual(mismatch.body, { error: 'record_patient_mismatch' })
  assert.deepEqual(await readRecords(), beforeMismatch, 'mismatched patient cannot mutate encounter')
  const closed = await call('POST', '/api/clinical/encounter/close', doctor.token, { patientId })
  assert.equal(closed.status, 200, 'verified doctor closes a server-signed encounter')
  const snapshot = closed.body.encounter, successor = closed.body.record
  assert.equal(snapshot.encounterId, recordId)
  assert.equal(snapshot.patientId, patientId)
  assert.equal(snapshot.signedById, doctor.user.id)
  assert.equal(snapshot.closedById, doctor.user.id)
  assert.equal(snapshot.closedBy, doctor.user.name)
  assert.ok(Number.isFinite(Date.parse(snapshot.closedAt)))
  assert.equal(snapshot.clinically_reviewed, false)
  assert.notEqual(successor.id, recordId, 'successor has a distinct encounter identity')
  assert.equal(successor.patientId, patientId)
  assert.equal(successor.previousEncounterId, recordId)
  assert.equal(successor.signedAt, undefined, 'successor is unsigned')
  assert.equal(successor.signedById, undefined)
  assert.equal(successor.physicalExam.doctorVerified, false)
  assert.deepEqual(successor.plan, [])
  const firstProcess = running.child.pid
  await running.stop()
  running = undefined
  running = await start()
  assert.notEqual(running.child.pid, firstProcess, 'read occurs in a genuinely new application process')
  call = running.call // Original doctor/patient tokens are deliberately reused after reload.
  const identity = await call('GET', '/api/auth/me', doctor.token)
  assert.equal(identity.status, 200)
  assert.equal(identity.body.user.id, doctor.user.id, 'doctor identity and verification persist after restart')
  const persisted = await call('GET', '/api/clinical/encounters/' + patientId, doctor.token)
  assert.equal(persisted.status, 200, 'authorized original token reads encounter after process restart')
  assert.deepEqual(persisted.body.encounters, [snapshot], 'closed encounter and complete provenance survive actual restart unchanged')
  const records = await readRecords()
  assert.equal(records.length, 2, 'restart preserves original signed record and distinct successor draft')
  assert.deepEqual(records.find(r => r.id === recordId), signed.body.record)
  assert.deepEqual(records.find(r => r.id === successor.id), successor)
  const clinical = await call('GET', '/api/clinical', doctor.token)
  assert.equal(clinical.status, 200)
  assert.equal(clinical.body.patients.filter((p: any) => p.id === patientId).length, 1, 'patient identity persists without duplication')
  assert.deepEqual(clinical.body.records[patientId], successor, 'current pointer remains the unsigned successor')
  const unsignedClose = await call('POST', '/api/clinical/encounter/close', doctor.token, { patientId })
  assert.equal(unsignedClose.status, 409, 'even a verified doctor cannot close the unsigned successor')
  assert.deepEqual(unsignedClose.body, { error: 'not-signed' })
  for (const [label, token, expected] of [['anonymous', undefined, 401], ['unrelated patient', unrelated.token, 403], ['unverified doctor', unverified.token, 403]] as const) {
    for (const path of ['/api/clinical/encounters/' + patientId, '/api/clinical/records/' + patientId]) {
      assert.equal((await call('GET', path, token)).status, expected, `${label} cannot read encounter after restart`)
    }
    assert.equal((await call('POST', '/api/clinical/record', token, { patientId, record })).status, expected, `${label} cannot write encounter after restart`)
    assert.equal((await call('POST', '/api/clinical/encounter/close', token, { patientId })).status, expected, `${label} cannot close encounter after restart`)
  }
  assert.deepEqual((await call('GET', '/api/clinical/encounters/' + patientId, doctor.token)).body.encounters, [snapshot], 'rejected requests cannot mutate closed snapshot')
  assert.deepEqual(await readRecords(), records, 'rejected requests cannot mutate persisted encounter records')
  console.log('encounterHttpRestart: real HTTP verified-clinician signing/close, file-mode process restart, exact encounter provenance and unsigned successor, paired access/identity rejections; passed')
} finally {
  try { await running?.stop() } finally { rmSync(directory, { recursive: true, force: true }) }
}
