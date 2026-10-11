// Alpha A1: one patient identity across encounter, anamnesis, lab results, referrals and the longitudinal read model.
// Real application over HTTP in isolated file mode; synthetic fixtures; doctor verification is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'identity-owner@localhost.test'
const running = await startIsolatedServer('patient-identity', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string, name = email) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string; name: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('identity-doctor@localhost.test', 'dokter', 'Synthetic identity doctor')
  const alice = await login('identity-alice@localhost.test', 'pasien')
  const bob = await login('identity-bob@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  // The server-stable identity: the primary clinical id is derived from the account id, never from a client-chosen value.
  const self = (id: string) => `self-u-${id}`
  const aliceSelf = self(alice.user.id), bobSelf = self(bob.user.id)
  assert.notEqual(aliceSelf, bobSelf)
  const me = await call('GET', '/api/auth/me', alice.token)
  assert.equal(me.body.user.id, alice.user.id, 'session identity is the account id')

  // 1. Doctor creates ONE patient under alice's primary id; creating it again updates in place and never forks a second patient.
  const patientBody = { id: aliceSelf, name: 'Synthetic identity patient', sex: 'P', dob: '1991-02-03', mrn: 'synthetic-identity-mrn', allergies: [], chronicConditions: [], riskFlags: [] }
  assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: patientBody })).status, 200)
  assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { ...patientBody, name: 'Synthetic identity patient (edited)' } })).status, 200)
  const practice = await call('GET', '/api/clinical', doctor.token)
  assert.equal(practice.status, 200)
  assert.equal(practice.body.patients.filter((p: any) => p.id === aliceSelf).length, 1, 'exactly one patient record for one identity')

  // 2. Encounter + anamnesis under the same patientId, signed with the authenticated doctor's identity.
  const record = {
    id: 'synthetic-identity-record', patientId: aliceSelf, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    anamnesis: { keluhanUtama: 'Synthetic identity fixture; no clinical judgement' }, physicalExam: { general: 'Synthetic' },
    problems: [], plan: [], references: [], clinically_reviewed: false,
    // Client-supplied signer fields are forged on purpose: the server must replace them with the authenticated identity.
    signedAt: 'sign-intent', signedById: 'client-forged-signer', signedBy: 'Client-forged signer',
  }
  const signed = await call('POST', '/api/clinical/record', doctor.token, { patientId: aliceSelf, record })
  assert.equal(signed.status, 200)
  assert.equal(signed.body.record.patientId, aliceSelf)
  assert.equal(signed.body.record.signedById, doctor.user.id, 'signer identity is the authenticated doctor, not the client claim')
  assert.notEqual(signed.body.record.signedBy, 'Client-forged signer')
  assert.equal(signed.body.record.asalIsian['anamnesis.keluhanUtama'].olehId, doctor.user.id, 'anamnesis answer keeps its author')
  assert.equal((await call('POST', '/api/clinical/record', doctor.token, { patientId: aliceSelf, record: { ...record, patientId: bobSelf } })).status, 400, 'a record cannot be filed under a different identity')
  const closed = await call('POST', '/api/clinical/encounter/close', doctor.token, { patientId: aliceSelf })
  assert.equal(closed.status, 200)
  assert.equal(closed.body.encounter.patientId, aliceSelf, 'encounter refers to the same identity')
  assert.equal(closed.body.record.patientId, aliceSelf, 'successor record refers to the same identity')

  // 3. Lab result and referral under the same patientId.
  const lab = await call('POST', '/api/lab-results', doctor.token, { patientId: aliceSelf, item: { name: 'Synthetic observation', valueText: 'fixture only', collectedAt: '2026-01-01' }, source: 'lab-intake' })
  const referral = await call('POST', '/api/referrals', doctor.token, { patientId: aliceSelf, kind: 'specialist', reason: 'Synthetic workflow fixture', toFacility: 'Synthetic facility' })
  assert.equal(lab.status, 201); assert.equal(referral.status, 201)
  assert.equal(lab.body.patientId, aliceSelf); assert.equal(referral.body.patientId, aliceSelf)

  // 4. The patient's own session sees all of it under one identity, and only that identity.
  const own = await call('GET', '/api/clinical', alice.token)
  assert.equal(own.status, 200)
  assert.deepEqual(own.body.patients.map((p: any) => p.id), [aliceSelf])
  assert.deepEqual(Object.keys(own.body.records), [aliceSelf])
  assert.deepEqual(Object.keys(own.body.encounters ?? {}), [aliceSelf])
  assert.deepEqual((await call('GET', '/api/lab-results', alice.token)).body.results.map((r: any) => r.patientId), [aliceSelf])
  assert.deepEqual((await call('GET', '/api/referrals', alice.token)).body.referrals.map((r: any) => r.patientId), [aliceSelf])
  assert.equal((await call('GET', `/api/clinical/encounters/${aliceSelf}`, alice.token)).status, 200)
  assert.equal((await call('GET', `/api/clinical/records/${aliceSelf}`, alice.token)).status, 200)

  // 5. Care anamnesis (daily check-in) uses the account id as its subject, and the unified read model joins every path on that one id.
  const share = await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: doctor.user.email, hari: 7 })
  assert.equal(share.status, 200)
  const plan = await call('POST', `/api/clinician/lab-shares/${share.body.id}/care-plan`, doctor.token, {
    diagnosisRefs: [{ system: 'local', code: 'SYN-1', display: 'Synthetic fixture condition', verificationStatus: 'provisional' }],
    questions: [{ id: 'sym1', kind: 'boolean', prompt: 'Synthetic symptom present today?', required: true }],
  })
  assert.equal(plan.status, 200, JSON.stringify(plan.body))
  assert.equal(plan.body.subjectId, alice.user.id, 'care plan subject is the account id')
  const today = new Date().toISOString().slice(0, 10)
  const report = await call('POST', '/api/care/reports', alice.token, { planId: plan.body.id, scheduledFor: today, clientId: 'identity-report-1', answers: [{ questionId: 'sym1', value: true }] })
  assert.equal(report.status, 200, JSON.stringify(report.body))
  const state = (await call('GET', '/api/keadaan-longitudinal', alice.token)).body
  assert.equal(state.subjectId, alice.user.id, 'longitudinal read model is keyed by the same account id')
  assert.equal(aliceSelf, self(state.subjectId), 'clinical primary id and longitudinal subject are the same identity')
  assert.deepEqual(Object.keys(state.clinical.records), [aliceSelf])
  assert.deepEqual(Object.keys(state.clinical.encounters), [aliceSelf])
  assert.equal(state.care.plans.length, 1)
  assert.equal(state.care.plans[0].plan.subjectId, alice.user.id)
  assert.equal(state.care.plans[0].reports.length, 1, 'the patient answer is stored against the same plan and identity')

  // 6. Another account sees none of it and cannot reach alice's identity through any path.
  const bobView = await call('GET', '/api/clinical', bob.token)
  assert.deepEqual(bobView.body.patients, []); assert.deepEqual(bobView.body.records, {})
  assert.deepEqual((await call('GET', '/api/lab-results', bob.token)).body, { results: [] })
  assert.deepEqual((await call('GET', '/api/referrals', bob.token)).body, { referrals: [] })
  for (const path of [`/api/clinical/records/${aliceSelf}`, `/api/clinical/encounters/${aliceSelf}`]) assert.equal((await call('GET', path, bob.token)).status, 403, `bob ${path}`)
  const bobState = (await call('GET', '/api/keadaan-longitudinal', bob.token)).body
  assert.equal(bobState.subjectId, bob.user.id)
  assert.deepEqual(bobState.clinical.records, {}); assert.deepEqual(bobState.care.plans, [])
  assert.equal((await call('POST', '/api/care/reports', bob.token, { planId: plan.body.id, scheduledFor: today, answers: [] })).status, 404, "bob cannot answer alice's check-in")

  // 7. A patient session can create only its OWN primary record: another account's id and arbitrary ids are refused, and the
  // refusals leave alice's patient untouched.
  const aliceBefore = (await call('GET', '/api/clinical', doctor.token)).body.patients.find((p: any) => p.id === aliceSelf)
  assert.equal((await call('POST', '/api/clinical/patient', bob.token, { patient: { ...patientBody, id: aliceSelf, name: 'Hijacked' } })).status, 403, "bob cannot write alice's identity")
  assert.equal((await call('POST', '/api/clinical/patient', bob.token, { patient: { ...patientBody, id: 'made-up-identity' } })).status, 403, 'a patient cannot mint an arbitrary identity')
  assert.deepEqual((await call('GET', '/api/clinical', doctor.token)).body.patients.find((p: any) => p.id === aliceSelf), aliceBefore, 'refused writes do not change alice')
  assert.equal((await call('POST', '/api/clinical/patient', bob.token, { patient: { ...patientBody, id: bobSelf, name: 'Synthetic bob self record' } })).status, 200, 'bob may create his own primary record')
  assert.deepEqual((await call('GET', '/api/clinical', bob.token)).body.patients.map((p: any) => p.id), [bobSelf], "bob's session sees only his own identity")
  assert.deepEqual((await call('GET', '/api/clinical', alice.token)).body.patients.map((p: any) => p.id), [aliceSelf], 'and alice still sees only hers')

  // 8. A practice patient (random id) joins exactly one account, only by an explicit one-time code the clinician issued.
  const practiceId = 'synthetic-practice-patient'
  assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { ...patientBody, id: practiceId, mrn: 'synthetic-practice-mrn' } })).status, 200)
  assert.equal((await call('GET', `/api/clinical/records/${practiceId}`, alice.token)).status, 403, 'not linked yet: no access by guessing the id')
  assert.equal((await call('POST', `/api/clinical/patient/${practiceId}/link-code`, alice.token)).status, 403, 'a patient cannot issue link codes')
  const code = await call('POST', `/api/clinical/patient/${practiceId}/link-code`, doctor.token)
  assert.equal(code.status, 200)
  assert.equal((await call('POST', '/api/clinical/link', alice.token, { code: 'not-the-code' })).status, 404)
  const linked = await call('POST', '/api/clinical/link', alice.token, { code: code.body.code })
  assert.equal(linked.status, 200); assert.equal(linked.body.patientId, practiceId)
  assert.deepEqual((await call('GET', '/api/clinical/links', alice.token)).body.links.map((l: any) => l.patientId), [practiceId])
  assert.equal((await call('GET', `/api/clinical/records/${practiceId}`, alice.token)).status, 200, 'linked: alice reads her practice patient')
  assert.equal((await call('POST', '/api/clinical/link', bob.token, { code: code.body.code })).status, 409, 'a used code cannot link a second account')
  assert.equal((await call('GET', `/api/clinical/records/${practiceId}`, bob.token)).status, 403, 'bob is not linked')
  assert.deepEqual((await call('GET', '/api/clinical/links', bob.token)).body.links, [])
  // A fresh code for an already-linked patient still cannot attach a second account.
  const secondCode = await call('POST', `/api/clinical/patient/${practiceId}/link-code`, doctor.token)
  assert.equal(secondCode.status, 200)
  assert.equal((await call('POST', '/api/clinical/link', bob.token, { code: secondCode.body.code })).status, 409, 'a linked practice patient cannot join a second account')
  assert.deepEqual((await call('GET', '/api/clinical/links', bob.token)).body.links, [])
  assert.equal((await call('DELETE', `/api/clinical/link/${practiceId}`, bob.token)).status, 403, 'another account cannot unlink it')
  assert.equal((await call('DELETE', `/api/clinical/link/${practiceId}`, alice.token)).status, 200)
  assert.equal((await call('GET', `/api/clinical/records/${practiceId}`, alice.token)).status, 403, 'unlinked: access ends immediately')
  // A redeemed code stays spent even after the link is removed; access needs a new clinician-issued code.
  assert.equal((await call('POST', '/api/clinical/link', alice.token, { code: code.body.code })).status, 409, 'a spent code cannot be reused')
  assert.equal((await call('GET', `/api/clinical/records/${practiceId}`, alice.token)).status, 403, 'still unlinked after the reuse attempt')

  console.log('patientIdentityContinuity: one account id <-> one clinical id across patient, record, encounter, lab, referral, care and longitudinal read model; no cross-identity reads; explicit one-time practice link; passed')
} finally {
  await running.stop()
}
