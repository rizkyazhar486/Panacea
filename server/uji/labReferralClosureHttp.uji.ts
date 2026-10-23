// Lab & Referral Closure over real HTTP: the closing steps and every refusal, with status code, error name,
// the rejected-audit entry and "nothing changed". Synthetic fixtures; lifecycle steps are workflow fixtures, not clinical approval.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'closure-owner@localhost.test'
const running = await startIsolatedServer('lab-closure', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('closure-doctor@localhost.test', 'dokter')
  const alice = await login('closure-alice@localhost.test', 'pasien')
  const bob = await login('closure-bob@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  const pid = (u: { user: { id: string } }) => `self-u-${u.user.id}`
  for (const u of [alice, bob]) assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: pid(u), name: 'Synthetic subject' } })).status, 200)
  const item = { name: 'Synthetic observation', valueText: 'fixture only', collectedAt: '2026-01-01' }
  const newLab = async (u: typeof alice) => (await call('POST', '/api/lab-results', doctor.token, { patientId: pid(u), item, source: 'lab-intake' })).body
  const newReferral = async (u: typeof alice, kind = 'lab') => (await call('POST', '/api/referrals', doctor.token, { patientId: pid(u), kind, reason: 'Synthetic workflow fixture', toFacility: 'Synthetic facility' })).body
  const advLab = (id: string, body: Record<string, unknown>, token = doctor.token) => call('POST', `/api/lab-results/${id}/advance`, token, body)
  const advRef = (id: string, body: Record<string, unknown>, token = doctor.token) => call('POST', `/api/referrals/${id}/advance`, token, body)
  const readLab = async (id: string) => (await call('GET', `/api/lab-results/${id}`, doctor.token)).body
  const readRef = async (id: string) => (await call('GET', `/api/referrals/${id}`, doctor.token)).body
  const auditActions = async () => {
    const a = (await call('GET', '/api/audit', owner.token)).body
    return ((a.entries ?? a.audit ?? a) as any[]).map(e => e.action as string)
  }
  const count = (actions: string[], name: string) => actions.filter(a => a === name).length

  // Every refusal: exact status + error name, one rejected-audit entry of its own, and the record is untouched.
  const refuse = async (what: string, fn: () => Promise<{ status: number; body: any }>, read: () => Promise<any>, status: number, error: string, audit: string | null) => {
    const before = JSON.stringify(await read()), auditBefore = audit ? count(await auditActions(), audit) : 0
    const r = await fn()
    assert.equal(r.status, status, `${what}: status`); assert.equal(r.body.error, error, `${what}: error name`)
    assert.equal(JSON.stringify(await read()), before, `${what}: nothing changed`)
    if (audit) assert.equal(count(await auditActions(), audit), auditBefore + 1, `${what}: one ${audit} entry`)
  }

  // 1. Result: review -> communicated (needs human evidence) -> closed.
  const lab = await newLab(alice)
  assert.equal((await advLab(lab.id, { to: 'pending_review' })).status, 200)
  await refuse('skip review', () => advLab(lab.id, { to: 'closed' }), () => readLab(lab.id), 409, 'not-allowed-step', 'labresult.advanced.rejected:not-allowed-step')
  await refuse('stale expectedStatus', () => advLab(lab.id, { to: 'reviewed', expectedStatus: 'received' }), () => readLab(lab.id), 409, 'stale-status', 'labresult.advanced.rejected:stale-status')
  assert.equal((await advLab(lab.id, { to: 'reviewed', expectedStatus: 'pending_review' })).status, 200)
  const noEvidence = [['no communication', undefined], ['unknown channel', { channel: 'telepathy', note: 'x' }], ['empty note', { channel: 'phone', note: '   ' }]] as const
  for (const [label, communication] of noEvidence) {
    await refuse(`communicated with ${label}`, () => advLab(lab.id, { to: 'communicated', communication }), () => readLab(lab.id), 400, 'evidence-required', 'labresult.advanced.rejected:evidence-required')
  }
  const comm = await advLab(lab.id, { to: 'communicated', communication: { channel: 'phone', note: 'Synthetic: patient told by phone' } })
  assert.equal(comm.status, 200); assert.equal(comm.body.communication.by, doctor.user.id, 'communication author is the authenticated clinician')
  await refuse('unknown target', () => advLab(lab.id, { to: 'archived' }), () => readLab(lab.id), 400, 'invalid-input', 'labresult.advanced.rejected:invalid-input')

  // 2. Referral lab path: evidence is required to return, and the link must be a valid CLOSED result of the same patient.
  const ref = await newReferral(alice)
  for (const to of ['accepted', 'scheduled']) assert.equal((await advRef(ref.id, { to }, owner.token)).status, 200)
  await refuse('step backwards', () => advRef(ref.id, { to: 'accepted' }), () => readRef(ref.id), 409, 'not-allowed-step', 'referral.advanced.rejected:not-allowed-step')
  assert.equal((await advRef(ref.id, { to: 'completed' })).status, 200)
  await refuse('return with no evidence', () => advRef(ref.id, { to: 'result_returned' }), () => readRef(ref.id), 400, 'evidence-required', 'referral.advanced.rejected:evidence-required')
  await refuse('lab referral with a note only', () => advRef(ref.id, { to: 'result_returned', returnNote: 'Synthetic note' }), () => readRef(ref.id), 400, 'evidence-required', 'referral.advanced.rejected:evidence-required')
  const bobLab = await newLab(bob)
  await refuse('result of another patient', () => advRef(ref.id, { to: 'result_returned', resultId: bobLab.id }), () => readRef(ref.id), 422, 'linked-result-invalid', 'referral.advanced.rejected:linked-result-invalid')
  await refuse('unknown result id', () => advRef(ref.id, { to: 'result_returned', resultId: 'lab-does-not-exist' }), () => readRef(ref.id), 422, 'linked-result-invalid', 'referral.advanced.rejected:linked-result-invalid')
  await refuse('malformed result id type', () => advRef(ref.id, { to: 'result_returned', resultId: 12345 }), () => readRef(ref.id), 400, 'invalid-input', 'referral.advanced.rejected:invalid-input')
  const returned = await advRef(ref.id, { to: 'result_returned', resultId: lab.id })
  assert.equal(returned.status, 200); assert.equal(returned.body.resultId, lab.id)

  // 3. Closing re-verifies the link. The linked result is only 'communicated' -> refused; once it is closed the SAME request succeeds.
  await refuse('close while linked result is not closed', () => advRef(ref.id, { to: 'closed' }), () => readRef(ref.id), 422, 'linked-result-invalid', 'referral.advanced.rejected:linked-result-invalid')
  await // A patient account is refused before the service runs, so this refusal has no rejected-audit entry (observed, not a claim of coverage).
  await refuse('patient cannot close her own lab result', () => advLab(lab.id, { to: 'closed' }, alice.token), () => readLab(lab.id), 403, 'role-not-permitted', 'labresult.advanced.rejected:role-not-permitted')
  assert.equal((await advLab(lab.id, { to: 'closed' })).status, 200)
  await refuse('owner (admin) cannot close a referral', () => advRef(ref.id, { to: 'closed' }, owner.token), () => readRef(ref.id), 403, 'role-not-permitted', 'referral.advanced.rejected:role-not-permitted')
  const closed = await advRef(ref.id, { to: 'closed' })
  assert.equal(closed.status, 200); assert.equal(closed.body.status, 'closed')
  assert.deepEqual(closed.body.trail.map((e: any) => `${e.from}>${e.to}`), ['requested>accepted', 'accepted>scheduled', 'scheduled>completed', 'completed>result_returned', 'result_returned>closed'])
  assert.deepEqual(closed.body.trail.map((e: any) => e.seq), [1, 2, 3, 4, 5].map(n => closed.body.trail[0].seq + n - 1), 'trail is gap-free and ordered')
  assert.equal(closed.body.trail.at(-1).actorId, doctor.user.id)
  await refuse('terminal closed referral cannot move', () => advRef(ref.id, { to: 'cancelled', closeReason: 'x' }), () => readRef(ref.id), 409, 'not-allowed-step', 'referral.advanced.rejected:not-allowed-step')

  // 4. Non-lab referral may return on a note; declined and cancelled always need a stated reason.
  const consult = await newReferral(alice, 'specialist')
  for (const to of ['accepted', 'scheduled']) assert.equal((await advRef(consult.id, { to }, owner.token)).status, 200)
  assert.equal((await advRef(consult.id, { to: 'completed' })).status, 200)
  const byNote = await advRef(consult.id, { to: 'result_returned', returnNote: 'Synthetic specialist note' })
  assert.equal(byNote.status, 200); assert.equal(byNote.body.returnNote, 'Synthetic specialist note'); assert.equal(byNote.body.resultId, undefined)
  assert.equal((await advRef(consult.id, { to: 'closed' })).status, 200, 'a non-lab referral closes on its returned note')
  const toDecline = await newReferral(bob)
  await refuse('decline without a reason', () => advRef(toDecline.id, { to: 'declined' }, owner.token), () => readRef(toDecline.id), 400, 'evidence-required', 'referral.advanced.rejected:evidence-required')
  const declined = await advRef(toDecline.id, { to: 'declined', closeReason: 'Synthetic: capacity' }, owner.token)
  assert.equal(declined.status, 200); assert.equal(declined.body.closeReason, 'Synthetic: capacity')

  // 5. Closure metrics are computed from the server's verified trails only.
  const metrics = (await call('GET', '/api/lab-results/metrics', doctor.token)).body
  assert.equal(metrics.total, 2); assert.equal(metrics.closed, 1); assert.equal(metrics.closureRate, 0.5); assert.equal(metrics.corrupt, 0)
  assert.equal(metrics.overdue, null, 'no threshold given: not measured, not 0')
  assert.equal((await call('GET', '/api/lab-results/metrics?dueHours=0', doctor.token)).status, 400)
  assert.equal((await call('GET', '/api/lab-results/metrics?dueHours=abc', doctor.token)).status, 400)

  console.log('labReferralClosureHttp: result communication evidence, referral return/close evidence, linked-result re-verification, terminal states, decline reasons, closure metrics; every refusal has status, error name, rejected-audit entry and no mutation; passed')
} finally {
  await running.stop()
}
