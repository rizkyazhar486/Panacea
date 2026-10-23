// Alpha A8: one scripted journey from identity to follow-up, with real persistence across a process restart.
// Real application over HTTP in isolated file mode (no UI, no mocks); synthetic fixtures; doctor verification is a workflow
// fixture, not clinical approval. The journey records what the product does today; it does not claim clinical validity.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'journey-owner@localhost.test'
const running = await startIsolatedServer('care-journey', ownerEmail)
try {
  const { call, restart } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string; name: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('journey-doctor@localhost.test', 'dokter')
  const alice = await login('journey-alice@localhost.test', 'pasien')
  const bob = await login('journey-bob@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const patientId = `self-u-${alice.user.id}`

  // ── 1. Identity: one patient, one id, created by the verified clinician.
  assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: patientId, name: 'Synthetic journey patient', sex: 'P', dob: '1991-02-03', mrn: 'synthetic-journey-mrn', allergies: [], chronicConditions: [], riskFlags: [] } })).status, 200)

  // ── 2. Encounter: anamnesis + exam, signed by the authenticated clinician, then closed into an immutable snapshot.
  const record = { id: 'journey-record', patientId, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    anamnesis: { keluhanUtama: 'Synthetic complaint', rps: 'Synthetic history' }, physicalExam: { general: 'Synthetic exam' },
    problems: [], plan: [], references: [], clinically_reviewed: false, signedAt: 'sign-intent', signedById: 'client-forged', signedBy: 'Client forged' }
  const signed = await call('POST', '/api/clinical/record', doctor.token, { patientId, record })
  assert.equal(signed.status, 200)
  assert.equal(signed.body.record.signedById, doctor.user.id, 'the signer is the authenticated clinician')
  const closed = await call('POST', '/api/clinical/encounter/close', doctor.token, { patientId })
  assert.equal(closed.status, 200); assert.equal(closed.body.encounter.patientId, patientId)

  // ── 3. Results and referral: both under the same patient id, advanced by the clinician with authenticated provenance.
  const lab = (await call('POST', '/api/lab-results', doctor.token, { patientId, item: { name: 'Synthetic observation', valueText: 'fixture only', collectedAt: '2026-01-01' }, source: 'lab-intake' })).body
  assert.equal(lab.patientId, patientId)
  for (const to of ['pending_review', 'reviewed']) assert.equal((await call('POST', `/api/lab-results/${lab.id}/advance`, doctor.token, { to })).status, 200, `lab -> ${to}`)
  const referral = (await call('POST', '/api/referrals', doctor.token, { patientId, kind: 'specialist', reason: 'Synthetic workflow fixture', toFacility: 'Synthetic facility' })).body
  assert.equal(referral.patientId, patientId)
  for (const to of ['accepted', 'scheduled', 'completed']) assert.equal((await call('POST', `/api/referrals/${referral.id}/advance`, doctor.token, { to })).status, 200, `referral -> ${to}`)

  // ── 4. Follow-up: the patient shares with her clinician and records a lab value; the clinician sets a daily check-in; the patient answers it.
  const gdp = [{ id: 'g1', tanggal: '2026-01-02', nilai: 93.7 }]
  assert.equal((await call('PUT', '/api/lab-log', alice.token, { log: { gdp }, diperbaruiPada: new Date().toISOString() })).status, 200)
  const share = (await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: doctor.user.email, hari: 7 })).body
  const plan = await call('POST', `/api/clinician/lab-shares/${share.id}/care-plan`, doctor.token, {
    signIntent: true, diagnosisRefs: [{ system: 'local', code: 'SYN-1', display: 'Synthetic fixture condition', verificationStatus: 'provisional' }],
    questions: [{ id: 'sym', kind: 'boolean', prompt: 'Synthetic symptom today?' }, { id: 'pain', kind: 'number', prompt: 'Synthetic pain score?' }],
  })
  assert.equal(plan.status, 200); assert.equal(plan.body.subjectId, alice.user.id)
  const today = new Date().toISOString().slice(0, 10)
  const report1 = await call('POST', '/api/care/reports', alice.token, { planId: plan.body.id, scheduledFor: today, clientId: 'journey-report-1', answers: [{ questionId: 'sym', value: true }, { questionId: 'pain', value: 3 }] })
  assert.equal(report1.status, 200); assert.equal(report1.body.subjectId, alice.user.id)

  // ── 5. Everything the journey produced, read back through the product's own read routes, captured before the restart.
  const readAll = async () => ({
    records: (await call('GET', `/api/clinical/records/${patientId}`, doctor.token)).body,
    encounters: (await call('GET', `/api/clinical/encounters/${patientId}`, doctor.token)).body,
    history: (await call('GET', `/api/clinical/record-history/${patientId}`, doctor.token)).body,
    lab: (await call('GET', `/api/lab-results/${lab.id}`, doctor.token)).body,
    referral: (await call('GET', `/api/referrals/${referral.id}`, doctor.token)).body,
    alicePlans: (await call('GET', '/api/care/plans', alice.token)).body,
    clinicianCare: (await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctor.token)).body,
    aliceLabLog: (await call('GET', '/api/lab-log', alice.token)).body,
    aliceShares: (await call('GET', '/api/lab-log/shares', alice.token)).body.shares,
    aliceOwnLab: (await call('GET', '/api/lab-results', alice.token)).body,
    aliceOwnReferrals: (await call('GET', '/api/referrals', alice.token)).body,
    aliceState: (await call('GET', '/api/keadaan-longitudinal', alice.token)).body,
  })
  const before = await readAll()
  assert.equal(before.lab.status, 'reviewed'); assert.equal(before.referral.status, 'completed')
  assert.equal(before.referral.trail.at(-1).actorId, doctor.user.id, 'transitions carry the authenticated actor')
  assert.equal(before.alicePlans.plans[0].reports.length, 1)
  assert.deepEqual(Object.keys(before.aliceState.clinical.records), [patientId])

  // ── 6. The LAST write happens immediately before the kill (reads above append audit entries, and every audit write saves the whole
  // file, so only a final write with nothing after it proves that write itself was persisted). Then the process is killed and a new
  // one starts on the same file. Tokens issued before stay valid.
  const report2 = await call('POST', '/api/care/reports', alice.token, { planId: plan.body.id, scheduledFor: today, clientId: 'journey-report-2', answers: [{ questionId: 'sym', value: false }] })
  assert.equal(report2.status, 200)
  await restart()

  // ── 7. After the restart nothing is lost, nothing changed, and every item still belongs to the right owner only.
  const after = await readAll()
  for (const key of Object.keys(before) as Array<keyof typeof before>) {
    if (key === 'aliceState' || key === 'alicePlans' || key === 'clinicianCare') continue   // generatedAt / the final write differ by design; compared below
    assert.deepEqual(after[key], before[key], `${key} is identical after the restart`)
  }
  assert.deepEqual(after.alicePlans.plans[0].plan, before.alicePlans.plans[0].plan, 'the care plan is identical after the restart')
  assert.deepEqual(after.alicePlans.plans[0].reports, [...before.alicePlans.plans[0].reports, report2.body], 'the first check-in is unchanged and the last one written before the kill survived')
  assert.deepEqual(after.clinicianCare.reports, [...before.clinicianCare.reports, report2.body], 'the clinician sees the same reports')
  assert.equal(after.aliceState.subjectId, alice.user.id)
  assert.deepEqual(after.aliceState.clinical, before.aliceState.clinical, 'the longitudinal clinical path is identical after the restart')
  assert.deepEqual(after.aliceState.care.plans[0].plan, before.aliceState.care.plans[0].plan, 'the longitudinal care plan is identical after the restart')
  assert.equal(after.aliceState.care.plans[0].reports.length, 2)
  assert.deepEqual(after.aliceState.lab, before.aliceState.lab, 'the longitudinal lab path is identical after the restart')
  const snapshot = after.encounters.encounters[0]
  assert.equal(snapshot.encounterId, 'journey-record')
  assert.equal(snapshot.signedById, doctor.user.id, 'the clinician signature on the closed encounter survived')
  assert.equal(snapshot.asalIsian['anamnesis.keluhanUtama'].olehId, doctor.user.id, 'answer provenance survived')
  assert.equal(snapshot.patientId, patientId)
  assert.equal(after.records.records.length, 2, 'the signed encounter record and its unsigned successor draft')
  assert.deepEqual(after.records.records.map((r: any) => Boolean(r.signedAt)).sort(), [false, true], 'exactly one is signed: the closed encounter; the live successor draft is not')
  assert.equal(after.lab.trail.length, before.lab.trail.length)

  // Scoping after the restart: another patient and an unrelated clinician-less session see nothing of it.
  const bobView = await call('GET', '/api/clinical', bob.token)
  assert.deepEqual(bobView.body.patients, []); assert.deepEqual(bobView.body.records, {})
  assert.deepEqual((await call('GET', '/api/care/plans', bob.token)).body.plans, [])
  assert.deepEqual((await call('GET', '/api/lab-results', bob.token)).body, { results: [] })
  assert.deepEqual((await call('GET', '/api/referrals', bob.token)).body, { referrals: [] })
  for (const path of [`/api/clinical/records/${patientId}`, `/api/clinical/record-history/${patientId}`, `/api/lab-results/${lab.id}`, `/api/referrals/${referral.id}`]) {
    assert.ok([403, 404].includes((await call('GET', path, bob.token)).status), `bob ${path}`)
  }
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/care`, bob.token)).status, 403)

  // ── 8. The journey keeps working on the restarted process: a new follow-up answer is stored, then revoking the share ends the check-in
  // while the signed record and results stay readable by their patient.
  const report3 = await call('POST', '/api/care/reports', alice.token, { planId: plan.body.id, scheduledFor: today, clientId: 'journey-report-3', answers: [{ questionId: 'sym', value: true }] })
  assert.equal(report3.status, 200)
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctor.token)).body.reports.length, 3, 'the clinician sees all three check-ins')
  assert.equal((await call('POST', '/api/care/reports', alice.token, { planId: plan.body.id, scheduledFor: today, clientId: 'journey-report-1', answers: [{ questionId: 'sym', value: true }, { questionId: 'pain', value: 3 }] })).body.id, report1.body.id, 'a resent check-in is still idempotent after the restart')
  assert.equal((await call('DELETE', `/api/lab-log/shares/${share.id}`, alice.token)).status, 200)
  assert.deepEqual((await call('GET', '/api/care/plans', alice.token)).body.plans, [], 'revoking the share ends the follow-up')
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctor.token)).status, 404)
  const ownRecords = (await call('GET', `/api/clinical/records/${patientId}`, alice.token)).body.records as any[]
  assert.ok(ownRecords.some(r => r.signedById === doctor.user.id), 'the patient still reads her own signed record')
  assert.equal((await call('GET', `/api/lab-results/${lab.id}`, alice.token)).body.status, 'reviewed', 'and her own result')

  console.log('careJourneyRestart: identity -> signed encounter -> lab and referral lifecycle -> care follow-up, killed and restarted on the same file: nothing lost or changed, scoping intact, follow-up continues, revocation ends it; passed')
} finally {
  await running.stop()
}
