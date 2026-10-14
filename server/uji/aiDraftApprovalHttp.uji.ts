// A5: deterministic AI-labelled draft fixture through real HTTP and persistence.
// No provider response or human clinical approval is fabricated.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'
const running = await startIsolatedServer('ai-draft-approval', 'draft-owner@localhost.test')
try {
  const { call, restart } = running
  const login = async (email: string, role: string) => (await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })).body
  const owner = await login('draft-owner@localhost.test', 'pasien')
  const doctor = await login('draft-doctor@localhost.test', 'dokter')
  const patient = await login('draft-patient@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const patientId = `self-u-${patient.user.id}`
  const save = (token: string, record: any) => call('POST', '/api/clinical/record', token, { patientId, record })
  const read = async () => (await call('GET', `/api/clinical/records/${patientId}`, patient.token)).body.records.find((r: any) => r.id === 'ai-draft')
  const fixture = { id: 'ai-draft', patientId, anamnesis: { keluhanUtama: 'Synthetic AI draft, not clinical evidence' },
    asalIsian: { 'anamnesis.keluhanUtama': { asal: 'AI' } }, physicalExam: {}, problems: [], references: [],
    plan: [{ id: 'proposal', category: 'Follow-up', text: 'Synthetic proposal only', source: 'AI', status: 'usulan' }], clinically_reviewed: false }
  for (const token of [patient.token, doctor.token]) {
    const draft = await save(token, fixture)
    assert.equal(draft.status, 200)
    assert.equal(draft.body.record.signedAt, undefined, 'saving an AI draft never signs it, even in a clinician session')
    assert.equal(draft.body.record.plan[0].status, 'usulan')
    assert.equal(draft.body.record.asalIsian['anamnesis.keluhanUtama'].asal, 'AI')
  }
  await restart()
  const persisted = await read()
  assert.equal(persisted.signedAt, undefined, 'draft remains unsigned after a process restart')
  assert.equal(persisted.plan[0].status, 'usulan')
  assert.equal((await call('POST', '/api/clinical/encounter/close', doctor.token, { patientId })).status, 409, 'unsigned AI draft cannot become a closed signed encounter')
  const forged = await save(patient.token, { ...persisted, signedAt: 'forged', signedById: doctor.user.id })
  assert.equal(forged.body.record.signedAt, undefined, 'patient cannot approve an AI draft')
  const approved = await save(doctor.token, { ...persisted, signedAt: 'explicit-sign-intent', signedById: 'client-forged', clinically_reviewed: true })
  assert.equal(approved.status, 200)
  assert.equal(approved.body.record.signedById, doctor.user.id, 'approval is attributed to the authenticated verified clinician')
  assert.ok(Number.isFinite(Date.parse(approved.body.record.signedAt)))
  assert.equal(approved.body.record.asalIsian['anamnesis.keluhanUtama'].asal, 'AI', 'signature does not turn AI text into observed clinical evidence')
  assert.notEqual(approved.body.record.clinically_reviewed, true, 'fixture signature is not human clinical validation')
  await restart()
  assert.equal((await read()).signedById, doctor.user.id, 'explicit authenticated signature persists')
  console.log('aiDraftApprovalHttp: patient/clinician AI drafts persist unsigned across restart; unsigned closure and forged approval blocked; only explicit identified clinician signs; passed')
} finally { await running.stop() }
