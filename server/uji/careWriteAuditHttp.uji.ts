import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'
// E3 write gaps: real HTTP, authenticated actors, server timestamps, restart persistence.
const running = await startIsolatedServer('care-write-audit', 'audit-care-owner@localhost.test')
try {
  const { call } = running
  const login = async (email: string, role: string) => (await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })).body
  const owner = await login('audit-care-owner@localhost.test', 'pasien')
  const doctor = await login('audit-care-doctor@localhost.test', 'dokter')
  const patient = await login('audit-care-patient@localhost.test', 'pasien')
  const bob = await login('audit-care-bob@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const entries = async () => {
    const body = (await call('GET', '/api/audit', owner.token)).body
    return (body.entries ?? body.audit ?? body) as any[]
  }
  const start = Date.now()
  const stamp = new Date().toISOString()
  const forged = { userId: 'forged', userEmail: 'forged@localhost.test', at: '1999-01-01T00:00:00Z' }
  const write = await call('PUT', '/api/lab-log', patient.token, { log: { gdp: [{ id: 'fixture', tanggal: stamp.slice(0, 10), nilai: 93.7 }] }, diperbaruiPada: stamp, ...forged })
  assert.equal(write.status, 200)
  let log = await entries()
  const labAudit = log.filter(e => e.action === 'lab.log.updated')
  assert.equal(labAudit.length, 1, 'accepted lab-log update has one audit event')
  assert.equal(labAudit[0].userId, patient.user.id)
  assert.equal(labAudit[0].target, patient.user.id)
  assert.ok(Date.parse(labAudit[0].at) >= start && Date.parse(labAudit[0].at) <= Date.now())
  assert.equal((await call('PUT', '/api/lab-log', patient.token, { log: {}, diperbaruiPada: '2000-01-01T00:00:00.000Z' })).status, 409)
  assert.equal((await entries()).filter(e => e.action === 'lab.log.updated').length, 1, 'rejected stale write is not recorded as an update')
  const share = (await call('POST', '/api/lab-log/shares', patient.token, { dokterEmail: doctor.user.email, hari: 7 })).body
  const plan = await call('POST', `/api/clinician/lab-shares/${share.id}/care-plan`, doctor.token, { diagnosisRefs: [{ system: 'local', code: 'SYN', display: 'Synthetic fixture', verificationStatus: 'provisional' }], questions: [{ id: 'q', kind: 'boolean', prompt: 'Synthetic?' }] })
  assert.equal(plan.status, 200)
  const report = { planId: plan.body.id, scheduledFor: stamp.slice(0, 10), clientId: 'audit-report', answers: [{ questionId: 'q', value: true }], ...forged }
  assert.equal((await call('POST', '/api/care/reports', bob.token, report)).status, 404)
  assert.equal((await call('POST', '/api/care/reports', patient.token, report)).status, 200)
  assert.equal((await call('POST', '/api/care/reports', patient.token, report)).status, 200)
  log = await entries()
  const reportAudit = log.filter(e => e.action === 'care.report.created')
  assert.equal(reportAudit.length, 1, 'idempotent retry does not create another write audit')
  assert.equal(reportAudit[0].userId, patient.user.id)
  assert.equal(reportAudit[0].target, plan.body.id)
  assert.ok(Date.parse(reportAudit[0].at) >= start && Date.parse(reportAudit[0].at) <= Date.now())
  assert.ok(log.every(e => e.userId !== forged.userId && e.userEmail !== forged.userEmail))
  await running.restart()
  assert.deepEqual((await entries()).filter(e => ['lab.log.updated', 'care.report.created'].includes(e.action)), [...reportAudit, ...labAudit], 'authenticated write audits persist across process restart')
  console.log('careWriteAuditHttp: accepted lab-log and new report writes audited with session actor/server time; stale and foreign writes do not become successes; retries do not duplicate; restart persists; passed')
} finally { await running.stop() }
