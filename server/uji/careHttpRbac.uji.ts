// Alpha E2: real HTTP authorization and integrity for the daily check-in (care plan / report) routes.
// Synthetic fixtures; clinician verification is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serverRoot, startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'care-owner@localhost.test'
const running = await startIsolatedServer('care-rbac', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctorA = await login('care-doctor-a@localhost.test', 'dokter')
  const doctorB = await login('care-doctor-b@localhost.test', 'dokter')
  const alice = await login('care-alice@localhost.test', 'pasien')
  const bob = await login('care-bob@localhost.test', 'pasien')
  for (const d of [doctorA, doctorB]) assert.equal((await call('POST', `/api/doctors/${d.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  // 1. Route coverage: every /api/care route needs an explicit decision here.
  const source = readFileSync(join(serverRoot, 'src/index.ts'), 'utf8')
  const registered = [...source.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/care[^']*)'/g)].map(m => `${m[1]!.toUpperCase()} ${m[2]}`).sort()
  assert.deepEqual(registered, ['GET /api/care/plans', 'POST /api/care/reports'], 'every registered /api/care route needs an authorization decision')
  assert.equal((await call('GET', '/api/care/plans')).status, 401); assert.equal((await call('POST', '/api/care/reports', undefined, {})).status, 401)

  const share = (await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: doctorA.user.email, hari: 7 })).body
  const diagnosis = { system: 'local', code: 'SYN-1', display: 'Synthetic fixture condition', verificationStatus: 'provisional' }
  const questions = [
    { id: 'sym', kind: 'boolean', prompt: 'Synthetic symptom today?' }, { id: 'pain', kind: 'number', prompt: 'Synthetic pain score?' },
    { id: 'note', kind: 'text', prompt: 'Synthetic note?' }, { id: 'mood', kind: 'choice', prompt: 'Synthetic mood?', choices: ['low', 'ok', 'high'] },
  ]
  const plan = (token: string, body: unknown, id = share.id) => call('POST', `/api/clinician/lab-shares/${id}/care-plan`, token, body)

  // 2. Plan bounds: bad plans are rejected and leave the active plan untouched.
  const created = await plan(doctorA.token, { diagnosisRefs: [diagnosis], questions })
  assert.equal(created.status, 200)
  const planId: string = created.body.id
  assert.equal(created.body.subjectId, alice.user.id, 'plan subject is the account id from the server, not the client')
  const activeAfter = async () => (await call('GET', '/api/care/plans', alice.token)).body.plans
  const snapshot = await activeAfter()
  assert.equal(snapshot.length, 1)
  for (const [label, body] of [
    ['no diagnosis', { diagnosisRefs: [], questions }],
    ['six diagnoses', { diagnosisRefs: Array(6).fill(diagnosis), questions }],
    ['no questions', { diagnosisRefs: [diagnosis], questions: [] }],
    ['twenty-one questions', { diagnosisRefs: [diagnosis], questions: Array.from({ length: 21 }, (_, i) => ({ id: `q${i}`, kind: 'boolean', prompt: 'x' })) }],
    ['duplicate question id', { diagnosisRefs: [diagnosis], questions: [questions[0], questions[0]] }],
    ['unknown question kind', { diagnosisRefs: [diagnosis], questions: [{ id: 'x', kind: 'file', prompt: 'x' }] }],
    ['choice without choices', { diagnosisRefs: [diagnosis], questions: [{ id: 'x', kind: 'choice', prompt: 'x' }] }],
  ] as const) {
    assert.equal((await plan(doctorA.token, body)).status, 400, label)
    assert.deepEqual(await activeAfter(), snapshot, `${label}: rejected plan leaves the active plan unchanged`)
  }

  // 3. Who sees the plan: only the patient it belongs to. A doctor's own account is a different subject.
  assert.equal(snapshot[0].plan.subjectId, alice.user.id); assert.equal(snapshot[0].dokterEmail, doctorA.user.email); assert.deepEqual(snapshot[0].reports, [])
  for (const [who, token] of [['bob', bob.token], ['doctor A as account', doctorA.token], ['doctor B as account', doctorB.token]] as const) {
    assert.deepEqual((await call('GET', '/api/care/plans', token)).body.plans, [], `${who} sees no plans of alice`)
  }

  // 4. Reports: only the plan's patient may answer; the subject comes from the plan, never the client.
  const today = new Date().toISOString().slice(0, 10)
  const answers = [{ questionId: 'sym', value: true }, { questionId: 'pain', value: 3 }, { questionId: 'note', value: 'synthetic' }, { questionId: 'mood', value: 'ok' }]
  const report = (token: string, body: Record<string, unknown>) => call('POST', '/api/care/reports', token, { planId, scheduledFor: today, answers, ...body })
  const first = await report(alice.token, { clientId: 'care-report-0001', subjectId: bob.user.id, patientId: bob.user.id, pasienEmail: bob.user.email })
  assert.equal(first.status, 200, JSON.stringify(first.body))
  assert.equal(first.body.subjectId, alice.user.id, 'client-supplied subject/patient/email fields are ignored')
  assert.equal(first.body.planId, planId); assert.equal(first.body.answers.length, 4)
  for (const [who, token] of [['bob', bob.token], ['doctor A', doctorA.token], ['doctor B', doctorB.token]] as const) {
    assert.equal((await report(token, {})).status, 404, `${who} cannot answer alice's check-in`)
  }
  assert.equal((await call('POST', '/api/care/reports', undefined, { planId, scheduledFor: today, answers })).status, 401)
  const stored = async () => (await call('GET', '/api/care/plans', alice.token)).body.plans[0].reports as any[]
  assert.equal((await stored()).length, 1, 'only alice report stored so far')

  // 5. Report validation: every rejection leaves the stored reports unchanged.
  const before = await stored()
  const day = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10)
  for (const [label, body] of [
    ['unknown question', { answers: [{ questionId: 'nope', value: true }] }],
    ['duplicate answer', { answers: [answers[0], answers[0]] }],
    ['string for boolean', { answers: [{ questionId: 'sym', value: 'yes' }] }],
    ['string for number', { answers: [{ questionId: 'pain', value: '3' }] }],
    ['choice outside the list', { answers: [{ questionId: 'mood', value: 'ecstatic' }] }],
    ['text longer than 1000', { answers: [{ questionId: 'note', value: 'x'.repeat(1001) }] }],
    ['date before the plan', { scheduledFor: '2000-01-01' }],
    ['date two days ahead', { scheduledFor: day(2) }],
    ['malformed date', { scheduledFor: '12/10/2026' }],
    ['invalid client id', { clientId: 'short' }],
  ] as const) {
    assert.equal((await report(alice.token, body)).status, 400, label)
    assert.deepEqual(await stored(), before, `${label}: rejection stores nothing`)
  }

  // 6. A resent report (same clientId) is idempotent; a new clientId is a new report.
  const again = await report(alice.token, { clientId: 'care-report-0001' })
  assert.equal(again.status, 200); assert.equal(again.body.id, first.body.id, 'same clientId returns the original report')
  assert.equal((await stored()).length, 1, 'no duplicate stored')
  assert.equal((await report(alice.token, { clientId: 'care-report-0002' })).status, 200)
  assert.equal((await stored()).length, 2)

  // 7. Offline authoring time is accepted only when plausible; otherwise the server time is used.
  const hourAgo = new Date(Date.now() - 36e5).toISOString(), longAgo = new Date(Date.now() - 30 * 864e5).toISOString(), future = new Date(Date.now() + 36e5).toISOString()
  const plausible = await report(alice.token, { clientId: 'care-report-0003', authoredAt: hourAgo })
  assert.equal(plausible.body.authoredAt, hourAgo, 'a plausible offline time is kept')
  for (const [label, claimed] of [['30 days ago', longAgo], ['future', future]] as const) {
    const r = await report(alice.token, { clientId: `care-report-${label === 'future' ? '0005' : '0004'}`, authoredAt: claimed })
    assert.notEqual(r.body.authoredAt, claimed, `${label}: implausible authoring time is replaced`)
    assert.ok(Math.abs(Date.parse(r.body.authoredAt) - Date.now()) < 60e3, `${label}: replaced by server time`)
  }

  // 8. The named doctor sees reports through the share only; other doctors and patients do not.
  const clinicianView = await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctorA.token)
  assert.equal(clinicianView.body.plan.id, planId); assert.equal(clinicianView.body.reports.length, 5)
  assert.ok(clinicianView.body.reports.every((r: any) => r.subjectId === alice.user.id))
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctorB.token)).status, 404)
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/care`, bob.token)).status, 403)

  // 9. A new plan from the same doctor replaces the old one: the old plan stops accepting answers and its reports do not carry over.
  const replacement = await plan(doctorA.token, { diagnosisRefs: [diagnosis], questions: [questions[0]] })
  assert.equal(replacement.status, 200); assert.notEqual(replacement.body.id, planId)
  const active = (await call('GET', '/api/care/plans', alice.token)).body.plans
  assert.deepEqual(active.map((p: any) => p.plan.id), [replacement.body.id]); assert.deepEqual(active[0].reports, [])
  assert.equal((await report(alice.token, { clientId: 'care-report-0006' })).status, 404, 'answers to the replaced plan are refused')

  // 10. Revoking the share ends the check-in for everyone at once, and re-sharing does not resurrect the old plan.
  assert.equal((await call('DELETE', `/api/lab-log/shares/${share.id}`, alice.token)).status, 200)
  assert.deepEqual((await call('GET', '/api/care/plans', alice.token)).body.plans, [], 'revoked share: no active plan')
  assert.equal((await call('POST', '/api/care/reports', alice.token, { planId: replacement.body.id, scheduledFor: today, answers: [{ questionId: 'sym', value: true }] })).status, 404)
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/care`, doctorA.token)).status, 404)
  const reshare = (await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: doctorA.user.email, hari: 7 })).body
  assert.deepEqual((await call('GET', '/api/care/plans', alice.token)).body.plans, [], 're-sharing needs a new plan: the old one is not resurrected')
  assert.equal((await plan(doctorA.token, { diagnosisRefs: [diagnosis], questions: [questions[0]] }, reshare.id)).status, 200)
  assert.equal((await call('GET', '/api/care/plans', alice.token)).body.plans.length, 1)

  console.log('careHttpRbac: two real /api/care routes plus plan creation bounds, patient-only answers with server-derived subject, validation and idempotency, offline-time clamp, replacement and revocation; passed')
} finally {
  await running.stop()
}
