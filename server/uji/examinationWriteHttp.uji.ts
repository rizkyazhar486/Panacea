import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'
// A4: real application HTTP, synthetic fixtures; no clinical approval implied.
const running = await startIsolatedServer('examination-write', 'exam-owner@localhost.test')
try {
  const { call } = running
  const login = async (email: string, role: string) => (await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })).body
  const owner = await login('exam-owner@localhost.test', 'pasien')
  const doctor = await login('exam-doctor@localhost.test', 'dokter')
  const patient = await login('exam-patient@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const patientId = `self-u-${patient.user.id}`
  const save = (token: string, record: any) => call('POST', '/api/clinical/record', token, { patientId, record })
  const base = { id: 'exam-record', patientId, anamnesis: { keluhanUtama: 'Synthetic' }, physicalExam: {}, plan: [], problems: [], references: [] }
  assert.equal((await save(patient.token, { ...base, physicalExam: { general: 'Patient-created examination' } })).status, 403, 'patient cannot create examination')
  const draft = await save(patient.token, { ...base, physicalExam: { general: '', vitalsNote: '', perSystem: '', doctorVerified: false }, aiExamDraft: { vitalsNote: 'Patient-reported context', perSystem: 'AI proposal, not examined' } })
  assert.equal(draft.status, 200, 'patient can create anamnesis without examination')
  assert.equal(draft.body.record.aiExamDraft.perSystem, 'AI proposal, not examined', 'proposals remain separate and preserved')
  const examined = await save(doctor.token, { ...draft.body.record, physicalExam: { general: 'Synthetic clinician exam', chest: 'Synthetic', doctorVerified: true } })
  assert.equal(examined.status, 200)
  const read = async () => (await call('GET', `/api/clinical/records/${patientId}`, patient.token)).body.records
  const before = await read()
  assert.equal((await save(owner.token, { ...examined.body.record, physicalExam: { general: 'Administrative owner is not a clinician' } })).status, 403, 'administrative ownership does not authorize examination writes')
  assert.equal((await call('POST', '/api/clinical/record', undefined, { patientId, record: examined.body.record })).status, 401)
  for (const physicalExam of [{ ...examined.body.record.physicalExam, general: 'Forged' }, {}, null, { ...examined.body.record.physicalExam, verifiedById: 'forged' }]) {
    assert.equal((await save(patient.token, { ...examined.body.record, physicalExam })).status, 403, 'patient cannot change, delete or forge examination metadata')
    assert.deepEqual(await read(), before, 'denied write leaves persistence unchanged')
  }
  const reordered = Object.fromEntries(Object.entries(examined.body.record.physicalExam).reverse())
  assert.equal((await save(patient.token, { ...examined.body.record, physicalExam: reordered, anamnesis: { keluhanUtama: 'Patient history update' } })).status, 200, 'unchanged exam echo permits history edits independent of key order')
  const latest = (await read())[0]
  assert.equal(latest.physicalExam.verifiedById, doctor.user.id, 'key reordering cannot erase clinician examination provenance')
  assert.equal((await save(doctor.token, { ...latest, physicalExam: { ...latest.physicalExam, general: 'Updated clinician exam' } })).status, 200)
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'pending' })).status, 200)
  assert.equal((await save(doctor.token, { ...latest, physicalExam: { general: 'Revoked clinician attempt' } })).status, 403, 'revoked clinician session cannot write examination')
  const audit = (await call('GET', '/api/audit', owner.token)).body
  const entries = audit.entries ?? audit.audit ?? audit
  assert.ok(entries.some((e: any) => e.action === 'emr.examination_write_refused' && e.userId === patient.user.id && e.target === patientId))
  console.log('examinationWriteHttp: clinician writes succeed; patient create/change/delete/metadata forgery rejected without mutation; unchanged echoes preserve history edits; passed')
} finally { await running.stop() }
