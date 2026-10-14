// Alpha A4-A6 characterization + review-claim integrity, over real HTTP in isolated file mode.
// The server never reads or writes a "clinically reviewed" status for a patient record: no qualified reviewer is registered.
// So a record must never carry a client-asserted review claim, and only a verified clinician can produce signed state.
// Synthetic fixtures; doctor verification is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'signing-owner@localhost.test'
const running = await startIsolatedServer('signing-integrity', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('signing-doctor@localhost.test', 'dokter')
  const alice = await login('signing-alice@localhost.test', 'pasien')
  const bob = await login('signing-bob@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const patientId = `self-u-${alice.user.id}`
  assert.equal((await call('POST', '/api/clinical/patient', alice.token, { patient: { id: patientId, name: 'Synthetic signing patient', sex: 'P', dob: '1990-01-01', mrn: 'synthetic-signing-mrn', allergies: [], chronicConditions: [], riskFlags: [] } })).status, 200, 'a patient creates only her own primary record')

  const record = (extra: Record<string, unknown> = {}) => ({
    id: 'signing-record', patientId, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    anamnesis: { keluhanUtama: 'Synthetic complaint' }, physicalExam: { general: 'Synthetic exam text' }, problems: [], plan: [], references: [], ...extra,
  })
  const save = (token: string, body: Record<string, unknown>) => call('POST', '/api/clinical/record', token, { patientId, record: body })
  const forged = { signedAt: 'sign-intent', signedById: 'forged-id', signedBy: 'Forged Doctor', clinically_reviewed: true,
    physicalExam: { general: 'Synthetic exam text', doctorVerified: true, verifiedBy: 'Forged Doctor', verifiedById: 'forged-id' }, primaryDiagnosis: { source: 'Dokter', name: 'Synthetic dx' } }

  // 1. A client-asserted review claim never persists, whoever sends it (patient or verified clinician, draft or signed).
  assert.equal((await save(alice.token, record({ ...forged }))).status, 403, 'patient examination creation rejected')
  const byPatient = await save(alice.token, record({ ...forged, physicalExam: {} }))
  assert.equal(byPatient.status, 200)
  assert.notEqual(byPatient.body.record.clinically_reviewed, true, 'a patient cannot persist a clinical-review claim')
  const byDoctor = await save(doctor.token, { ...byPatient.body.record, clinically_reviewed: true, signedAt: 'sign-intent', signedById: 'forged-id', signedBy: 'Forged Doctor', physicalExam: { general: 'Synthetic exam text', doctorVerified: true } })
  assert.equal(byDoctor.status, 200)
  assert.notEqual(byDoctor.body.record.clinically_reviewed, true, 'a clinician signature is not a clinical review either')
  const stored = (await call('GET', `/api/clinical/records/${patientId}`, doctor.token)).body.records as any[]
  assert.ok(stored.every(r => r.clinically_reviewed !== true), 'no stored record carries a review claim')

  // 2. A patient can never produce signed or clinician-verified state, however the request is forged.
  const p = byPatient.body.record
  assert.equal(p.signedAt, undefined); assert.equal(p.signedById, undefined); assert.equal(p.signedBy, undefined)
  assert.equal(p.physicalExam.doctorVerified, false); assert.equal(p.physicalExam.verifiedBy, undefined); assert.equal(p.physicalExam.verifiedById, undefined)
  assert.equal(p.primaryDiagnosis.source, 'AI', 'a patient cannot label a diagnosis as clinician-authored')
  for (const key of ['anamnesis.keluhanUtama']) assert.equal(p.asalIsian[key].asal, 'AI', `${key} from a non-clinician is labelled as not clinician-authored`)

  // 3. Only a verified clinician signs: the signer is the authenticated identity, the exam verification is theirs, the time is the server's.
  const d = byDoctor.body.record
  assert.equal(d.signedById, doctor.user.id); assert.notEqual(d.signedBy, 'Forged Doctor'); assert.ok(Number.isFinite(Date.parse(d.signedAt)))
  assert.equal(d.physicalExam.doctorVerified, true); assert.equal(d.physicalExam.verifiedById, doctor.user.id)

  // 4. A clinician who signs content still labelled AI keeps that label per answer: signing does not relabel AI text as clinician-authored.
  const aiText = await save(doctor.token, { ...d, anamnesis: { keluhanUtama: 'Synthetic AI-generated text' }, asalIsian: { 'anamnesis.keluhanUtama': { asal: 'AI' } }, signedAt: 'sign-intent' })
  assert.equal(aiText.body.record.signedById, doctor.user.id)
  assert.equal(aiText.body.record.asalIsian['anamnesis.keluhanUtama'].asal, 'AI'); assert.equal(aiText.body.record.asalIsian['anamnesis.keluhanUtama'].olehId, undefined)

  // 5. Editing a signed record as a patient removes the signature and exam verification (the signed version is archived).
  const edited = await save(alice.token, { ...aiText.body.record, anamnesis: { keluhanUtama: 'Synthetic patient history rewrite' } })
  assert.equal(edited.body.record.signedAt, undefined); assert.equal(edited.body.record.physicalExam.verifiedById, doctor.user.id, 'unchanged clinician examination retains its author')
  assert.ok((await call('GET', `/api/clinical/record-history/${patientId}?recordId=signing-record`, doctor.token)).body.history.length >= 1, 'the signed version was archived')

  // 6. Other accounts cannot write at all.
  assert.equal((await save(bob.token, record())).status, 403); assert.equal((await call('POST', '/api/clinical/record', undefined, { patientId, record: record() })).status, 401)

  // 7. A4 examination writes are rejected for non-clinicians; patient anamnesis remains editable.
  assert.equal((await save(alice.token, { ...edited.body.record, physicalExam: { ...edited.body.record.physicalExam, general: 'Synthetic patient rewrite' } })).status, 403)
  const withPlan = await save(alice.token, { ...edited.body.record, plan: [{ id: 'p1', text: 'Synthetic patient-entered plan item' }] })
  assert.equal(withPlan.status, 200); assert.equal(withPlan.body.record.plan.length, 1, 'KNOWN LIMIT A6: a patient can store a plan item on her own unsigned record')
  assert.equal(withPlan.body.record.signedAt, undefined, 'it is never signed, so it is not an active signed plan')
  // A6 says an unsigned signing attempt is rejected AND logged. The server strips the claim (checked above) and now records the refusal on its own
  // audit action. It is still saved with 200 and stripped, not answered with an error: that part of A6 stays a KNOWN LIMIT.
  const auditEntries = ((await call('GET', '/api/audit', owner.token)).body as any)
  const entries = (auditEntries.entries ?? auditEntries.audit ?? auditEntries) as any[]
  const refused = entries.filter(a => a.action === 'emr.signature_refused')
  assert.equal(refused.length, 1, 'exactly one refusal: the forged patient save. The clinician save, the identical carry-over and the plain patient edits are not refusals')
  assert.equal(refused[0].userId, alice.user.id); assert.equal(refused[0].target, patientId)
  assert.ok(entries.some(a => a.action === 'emr.save') && entries.some(a => a.action === 'emr.signed_version_archived'))
  assert.equal(byPatient.status, 200, 'KNOWN LIMIT A6: the refused attempt is stripped and the save returns 200, not an error')

  console.log('clinicalSigningIntegrity: no client-asserted review claim persists; only a verified clinician produces signed state; AI labels survive signing; patient edits drop signatures; refused signing attempts are audited; A4 examination writes rejected; KNOWN LIMIT A6 (stripped with 200, not an error) recorded; passed')
} finally {
  await running.stop()
}
