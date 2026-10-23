// Synthetic identities and real HTTP/file persistence; not clinical approval.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startIsolatedServer } from '../support/isolatedServer.ts'
import { susunRencana, signCarePlan, isSignedCarePlan } from '../../src/domains/clinical-records/carePlan.ts'

const input = { diagnosisRefs: [{ system: 'local', code: 'SYN', display: 'Synthetic fixture' }], questions: [{ id: 'q', kind: 'boolean', prompt: 'Synthetic question?' }] }
const at = new Date('2026-10-15T01:00:00.000Z')
const draft = susunRencana(input, 'patient', 'doctor', at)
assert.equal(isSignedCarePlan(draft), false)
const approved = signCarePlan(draft, 'doctor', at)
assert.equal(isSignedCarePlan(approved), true)
assert.equal(draft.signature, undefined, 'signing must not mutate the draft')
assert.equal(approved.signature?.at, at.toISOString())
assert.equal(approved.signature?.actorId, 'doctor')
assert.throws(() => signCarePlan(draft, 'other', at), /invalid care plan signer/)
assert.throws(() => signCarePlan(draft, 'doctor', new Date(NaN)), /invalid care plan signer/)
for (const bad of [
  { ...approved, subjectId: 'other' }, { ...approved, clinicianId: 'other' },
  { ...approved, version: '2' }, { ...approved, questions: [] },
  { ...approved, signature: { ...approved.signature!, actorId: 'other' } },
  { ...approved, signature: { ...approved.signature!, at: 'invalid' } },
  { ...approved, signature: { ...approved.signature!, contentHash: 'forged' } },
]) assert.equal(isSignedCarePlan(bad), false, 'changed or malformed approval must fail closed')

const ownerEmail = 'approval-owner@localhost.test'
const server = await startIsolatedServer('care-approval', ownerEmail)
try {
  const { call } = server
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200); return r.body
  }
  const owner = await login(ownerEmail, 'pasien')
  const patient = await login('approval-patient@localhost.test', 'pasien')
  const other = await login('approval-other@localhost.test', 'pasien')
  const doctor = await login('approval-doctor@localhost.test', 'dokter')
  const unverified = await login('approval-unverified@localhost.test', 'dokter')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const share = (await call('POST', '/api/lab-log/shares', patient.token, { dokterEmail: doctor.user.email, hari: 7 })).body
  const path = `/api/clinician/lab-shares/${share.id}/care-plan`
  const plans = () => JSON.parse(readFileSync(server.dataFile, 'utf8')).carePlans ?? []
  const audit = async () => { const r = await call('GET', '/api/audit', owner.token); assert.equal(r.status, 200); return r.body.entries ?? r.body.audit ?? r.body }
  assert.equal((await call('POST', path, undefined, { ...input, signIntent: true })).status, 401)
  for (const actor of [patient, owner, unverified, other]) {
    assert.equal((await call('POST', path, actor.token, { ...input, signIntent: true })).status, 403)
    assert.deepEqual(plans(), [])
  }
  const refusals = [undefined, false, 'true', 1, {}, null]
  for (const signIntent of refusals) {
    const result = await call('POST', path, doctor.token, { ...input, signIntent, signature: approved.signature })
    assert.equal(result.status, 409)
    assert.equal(result.body.error, 'explicit clinician signature required')
    assert.deepEqual(plans(), [], 'refused signing must not persist a clinical plan')
  }
  assert.equal((await audit()).filter((e: any) => e.action === 'care.plan.signature_refused' && e.userId === doctor.user.id).length, refusals.length)
  const signed = (await call('POST', path, doctor.token, { ...input, signIntent: true, signature: approved.signature, clinicianId: 'forged' })).body
  assert.equal(signed.signature.actorId, doctor.user.id)
  assert.notEqual(signed.signature.at, at.toISOString())
  assert.equal(isSignedCarePlan(signed), true)
  assert.equal(signed.clinically_reviewed, undefined)
  assert.equal((await call('GET', '/api/care/plans', patient.token)).body.plans[0].plan.id, signed.id)
  assert.deepEqual((await call('GET', '/api/care/plans', other.token)).body.plans, [])
  await server.restart()
  assert.deepEqual((await call('GET', '/api/care/plans', patient.token)).body.plans[0].plan, signed)
  const snapshot = plans()
  assert.equal((await call('POST', path, doctor.token, input)).status, 409)
  assert.deepEqual(plans(), snapshot, 'failed replacement must leave the signed plan active')
  // Simulate a legacy unsigned plan; no invented historical signer or timestamp.
  await server.restart(data => { delete data.carePlans[0].rencana.signature })
  assert.deepEqual((await call('GET', '/api/care/plans', patient.token)).body.plans, [])
  assert.equal((await call('GET', '/api/keadaan-longitudinal', patient.token)).body.care.plans.length, 0)
  assert.equal((await call('POST', '/api/care/reports', patient.token, { planId: signed.id, scheduledFor: new Date().toISOString().slice(0, 10), answers: [{ questionId: 'q', value: true }] })).status, 404)
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/care/fhir`, doctor.token)).status, 404)
  const review = (await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctor.token)).body
  assert.equal(review.plan, null)
  assert.equal(review.unsignedPlan.id, signed.id, 'legacy content remains reviewable by its clinician')
  const resumed = await call('POST', path, doctor.token, { existingPlanId: signed.id, signIntent: true, questions: [] })
  assert.equal(resumed.status, 200)
  assert.deepEqual(resumed.body.questions, signed.questions, 'reapproval uses stored content, ignoring client replacements')
  assert.equal(resumed.body.id, signed.id)
  assert.equal(isSignedCarePlan(resumed.body), true)
  const signedEvents = (await audit()).filter((e: any) => e.action === 'care.plan.signed')
  assert.equal(signedEvents.length, 2)
  assert.equal(signedEvents.every((e: any) => e.userId === doctor.user.id && Number.isFinite(Date.parse(e.at))), true)
  // A7: the signed daily plan is the scheduled follow-up in its owner's worklist.
  const scheduled = (await call('GET', '/api/care/plans', patient.token)).body.plans[0].plan
  assert.equal(scheduled.id, resumed.body.id)
  assert.equal(scheduled.schedule.cadence, 'daily')
  assert.equal(Number.isFinite(Date.parse(scheduled.activeFrom)), true)
  assert.deepEqual((await call('GET', '/api/care/plans', other.token)).body.plans, [])
  const worklist = await call('GET', '/api/clinician/lab-shares', doctor.token)
  assert.equal(worklist.status, 200)
  assert.equal(worklist.body.shares.some((s: any) => s.id === share.id), true)
  const followup = await call('POST', '/api/care/reports', patient.token, {
    planId: scheduled.id, clientId: 'approval-followup', scheduledFor: new Date().toISOString().slice(0, 10),
    answers: [{ questionId: 'q', value: true }], subjectId: other.user.id,
  })
  assert.equal(followup.status, 200)
  assert.equal(followup.body.subjectId, patient.user.id)
  const clinicianReview = (await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctor.token)).body
  assert.equal(clinicianReview.plan.id, scheduled.id)
  assert.deepEqual(clinicianReview.reports, [followup.body])
  await server.restart()
  assert.deepEqual((await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctor.token)).body.reports, [followup.body])
  assert.equal((await call('POST', '/api/care/reports', other.token, { planId: scheduled.id })).status, 404)
  await server.restart(data => {
    for (const p of data.carePlans) if (p.rencana.id === scheduled.id && !p.dicabut) {
      p.rencana.subjectId = other.user.id; delete p.rencana.signature
    }
  })
  const mismatched = plans()
  assert.equal((await call('POST', path, doctor.token, { existingPlanId: scheduled.id, signIntent: true })).status, 404)
  assert.deepEqual(plans(), mismatched, 'legacy subject mismatch cannot be signed into another patient')
  assert.equal((await call('DELETE', '/api/lab-log/shares/' + share.id, patient.token)).status, 200)
  assert.deepEqual((await call('GET', '/api/care/plans', patient.token)).body.plans, [])
  console.log('carePlanApproval: explicit signature, authenticated signer, content binding, refusal audit, no unsigned activation, preserved legacy review, restart, signed-plan scheduled follow-up/owner worklists and consent; passed')
} finally { await server.stop() }
