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
  const byPatient = await save(alice.token, record({ ...forged }))
  assert.equal(byPatient.status, 200)
  assert.notEqual(byPatient.body.record.clinically_reviewed, true, 'a patient cannot persist a clinical-review claim')
  const byDoctor = await save(doctor.token, { ...byPatient.body.record, clinically_reviewed: true, signedAt: 'sign-intent', signedById: 'forged-id', signedBy: 'Forged Doctor', physicalExam: { ...byPatient.body.record.physicalExam, doctorVerified: true } })
  assert.equal(byDoctor.status, 200)
  assert.notEqual(byDoctor.body.record.clinically_reviewed, true, 'a clinician signature is not a clinical review either')
  const stored = (await call('GET', `/api/clinical/records/${patientId}`, doctor.token)).body.records as any[]
  assert.ok(stored.every(r => r.clinically_reviewed !== true), 'no stored record carries a review claim')

  // 2. A patient can never produce signed or clinician-verified state, however the request is forged.
  const p = byPatient.body.record
  assert.equal(p.signedAt, undefined); assert.equal(p.signedById, undefined); assert.equal(p.signedBy, undefined)
  assert.equal(p.physicalExam.doctorVerified, false); assert.equal(p.physicalExam.verifiedBy, undefined); assert.equal(p.physicalExam.verifiedById, undefined)
  assert.equal(p.primaryDiagnosis.source, 'AI', 'a patient cannot label a diagnosis as clinician-authored')
  for (const key of ['anamnesis.keluhanUtama', 'physicalExam.general']) assert.equal(p.asalIsian[key].asal, 'AI', `${key} from a non-clinician is labelled as not clinician-authored`)

  // 3. Only a verified clinician signs: the signer is the authenticated identity, the exam verification is theirs, the time is the server's.
  const d = byDoctor.body.record
  assert.equal(d.signedById, doctor.user.id); assert.notEqual(d.signedBy, 'Forged Doctor'); assert.ok(Number.isFinite(Date.parse(d.signedAt)))
  assert.equal(d.physicalExam.doctorVerified, true); assert.equal(d.physicalExam.verifiedById, doctor.user.id)

  // 4. A clinician who signs content still labelled AI keeps that label per answer: signing does not relabel AI text as clinician-authored.
  const aiText = await save(doctor.token, { ...d, anamnesis: { keluhanUtama: 'Synthetic AI-generated text' }, asalIsian: { 'anamnesis.keluhanUtama': { asal: 'AI' } }, signedAt: 'sign-intent' })
  assert.equal(aiText.body.record.signedById, doctor.user.id)
  assert.equal(aiText.body.record.asalIsian['anamnesis.keluhanUtama'].asal, 'AI'); assert.equal(aiText.body.record.asalIsian['anamnesis.keluhanUtama'].olehId, undefined)

  // 5. Editing a signed record as a patient removes the signature and exam verification (the signed version is archived).
  const edited = await save(alice.token, { ...aiText.body.record, physicalExam: { ...aiText.body.record.physicalExam, general: 'Synthetic patient rewrite' } })
  assert.equal(edited.body.record.signedAt, undefined); assert.equal(edited.body.record.physicalExam.doctorVerified, false)
  assert.ok((await call('GET', `/api/clinical/record-history/${patientId}?recordId=signing-record`, doctor.token)).body.history.length >= 1, 'the signed version was archived')

  // 6. Other accounts cannot write at all.
  assert.equal((await save(bob.token, record())).status, 403); assert.equal((await call('POST', '/api/clinical/record', undefined, { patientId, record: record() })).status, 401)

  // 7. KNOWN LIMITS against the written acceptance of A4 and A6 (documented so they cannot change silently):
  // A4 says examination entries may only be created or changed by an authorised clinician and other roles rejected. Today a patient CAN write exam text
  // and a plan on her own record; the server labels it (not clinician-authored, unverified) instead of rejecting it.
  assert.equal(edited.status, 200, 'KNOWN LIMIT A4: a patient write to her own exam is accepted and labelled, not rejected')
  const withPlan = await save(alice.token, { ...edited.body.record, plan: [{ id: 'p1', text: 'Synthetic patient-entered plan item' }] })
  assert.equal(withPlan.status, 200); assert.equal(withPlan.body.record.plan.length, 1, 'KNOWN LIMIT A4/A6: a patient can store a plan item on her own unsigned record')
  assert.equal(withPlan.body.record.signedAt, undefined, 'it is never signed, so it is not an active signed plan')
  // A6 says an unsigned signing attempt is rejected AND logged. Today it is silently stripped and only a generic save is logged.
  const audit = (await call('GET', '/api/audit', owner.token)).body
  const actions = new Set((audit.entries ?? audit.audit ?? audit).map((a: any) => a.action))
  assert.ok(actions.has('emr.save') && actions.has('emr.signed_version_archived'))
  assert.ok(![...actions].some(a => /sign.*(reject|denied|refus)|reject.*sign/i.test(String(a))), 'KNOWN LIMIT A6: a refused signing attempt has no audit entry of its own')

  console.log('clinicalSigningIntegrity: no client-asserted review claim persists; only a verified clinician produces signed state; AI labels survive signing; patient edits drop signatures; KNOWN LIMITS A4/A6 recorded; passed')
} finally {
  await running.stop()
}
