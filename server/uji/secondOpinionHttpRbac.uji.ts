// Alpha E2: real HTTP authorization and integrity for the second-opinion routes.
// Model under test: a shared pending queue for verified clinicians; the patient sees only their own requests and never the AI draft.
// Synthetic fixtures; clinician verification is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serverRoot, startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'opinion-owner@localhost.test'
const running = await startIsolatedServer('second-opinion-rbac', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctorA = await login('opinion-doctor-a@localhost.test', 'dokter')
  const doctorB = await login('opinion-doctor-b@localhost.test', 'dokter')
  const unverified = await login('opinion-unverified@localhost.test', 'dokter')
  const alice = await login('opinion-alice@localhost.test', 'pasien')
  const bob = await login('opinion-bob@localhost.test', 'pasien')
  for (const d of [doctorA, doctorB]) assert.equal((await call('POST', `/api/doctors/${d.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  // 1. Route coverage and anonymous access.
  const source = readFileSync(join(serverRoot, 'src/index.ts'), 'utf8')
  const registered = [...source.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/second-opinion[^']*)'/g)].map(m => `${m[1]!.toUpperCase()} ${m[2]}`).sort()
  assert.deepEqual(registered, ['GET /api/second-opinion', 'POST /api/second-opinion', 'POST /api/second-opinion/:id/complete'], 'every registered second-opinion route needs an authorization decision')
  for (const [method, path, body] of [['GET', '/api/second-opinion', undefined], ['POST', '/api/second-opinion', { symptoms: 'x' }], ['POST', '/api/second-opinion/any/complete', { finalOpinion: 'x' }]] as const) {
    assert.equal((await call(method, path, undefined, body)).status, 401, `anonymous ${method} ${path}`)
  }

  // 2. A patient submits a request: the response never carries the AI draft, identity comes from the session, and input is bounded.
  const submit = (token: string, body: Record<string, unknown>) => call('POST', '/api/second-opinion', token, body)
  assert.equal((await submit(alice.token, {})).status, 400, 'an empty request is rejected')
  const made = await submit(alice.token, { currentDiagnosis: 'Synthetic dx', symptoms: 'Synthetic symptoms', history: 'Synthetic history',
    patientEmail: bob.user.email, patientName: 'Forged name', status: 'completed', finalOpinion: 'forged', doctorEmail: doctorA.user.email })
  assert.equal(made.status, 200)
  const request = made.body.request
  assert.equal(request.patientEmail, alice.user.email, 'the requester comes from the session, not the body')
  assert.equal(request.status, 'pending_doctor', 'a client cannot create a completed request'); assert.equal(request.finalOpinion, undefined); assert.equal(request.doctorEmail, undefined)
  assert.equal(request.aiDraft, undefined, 'the submit response never carries the AI draft')
  const long = await submit(alice.token, { symptoms: 'x'.repeat(5000), history: 'y'.repeat(5000) })
  assert.equal(long.body.request.symptoms.length, 1000); assert.equal(long.body.request.history.length, 1000)
  const bobRequest = (await submit(bob.token, { symptoms: 'Synthetic bob symptoms' })).body.request

  // 3. Patients see only their own requests, and never the AI draft.
  const aliceList = (await call('GET', '/api/second-opinion', alice.token)).body.requests as any[]
  assert.deepEqual(aliceList.map(r => r.patientEmail), [alice.user.email, alice.user.email]); assert.ok(aliceList.every(r => r.aiDraft === undefined))
  assert.deepEqual((await call('GET', '/api/second-opinion', bob.token)).body.requests.map((r: any) => r.id), [bobRequest.id], 'bob sees only his own')
  const unverifiedList = (await call('GET', '/api/second-opinion', unverified.token)).body.requests as any[]
  assert.deepEqual(unverifiedList, [], 'an unverified doctor is treated as a patient: no queue, only their own (none)')

  // 4. Verified doctors share the pending queue (the documented model), including the AI draft meant for them.
  for (const doctor of [doctorA, doctorB]) {
    const queue = (await call('GET', '/api/second-opinion', doctor.token)).body.requests as any[]
    assert.equal(queue.length, 3); assert.ok(queue.every(r => r.status === 'pending_doctor'))
    assert.ok(queue.every(r => typeof r.aiDraft === 'string' && r.aiDraft.length > 0), 'the clinician queue carries the AI draft')
  }

  // 5. Completing: only verified clinicians, only a pending request, bounded and non-empty, once.
  const complete = (token: string, id: string, body: unknown) => call('POST', `/api/second-opinion/${id}/complete`, token, body)
  for (const [who, token] of [['patient', alice.token], ['other patient', bob.token], ['unverified doctor', unverified.token]] as const) {
    assert.equal((await complete(token, request.id, { finalOpinion: 'Synthetic opinion' })).status, 403, `${who} cannot complete`)
  }
  const queueBefore = (await call('GET', '/api/second-opinion', doctorA.token)).body.requests
  assert.equal((await complete(doctorA.token, request.id, { finalOpinion: '   ' })).status, 400, 'a blank opinion is rejected')
  assert.equal((await complete(doctorA.token, request.id, {})).status, 400)
  assert.equal((await complete(doctorA.token, 'does-not-exist', { finalOpinion: 'Synthetic opinion' })).status, 404)
  assert.deepEqual((await call('GET', '/api/second-opinion', doctorA.token)).body.requests, queueBefore, 'rejected completions change nothing')
  const done = await complete(doctorA.token, request.id, { finalOpinion: 'Synthetic opinion ' + 'z'.repeat(5000), status: 'pending_doctor', patientEmail: bob.user.email, doctorEmail: doctorB.user.email, doctorName: 'Forged doctor' })
  assert.equal(done.status, 200)
  assert.equal(done.body.request.status, 'completed'); assert.equal(done.body.request.doctorEmail, doctorA.user.email, 'the completing doctor comes from the session')
  assert.equal(done.body.request.finalOpinion.length, 4000, 'the final opinion is bounded')
  assert.equal(done.body.request.patientEmail, alice.user.email, 'a client body cannot reassign the patient')
  assert.notEqual(done.body.request.doctorName, 'Forged doctor', 'a client body cannot rename the completing doctor')
  assert.equal((await complete(doctorB.token, request.id, { finalOpinion: 'A second doctor overwrites' })).status, 404, 'a completed request cannot be completed again or overwritten')

  // 6. After completion: out of every queue, visible to its patient with the final opinion and still without the AI draft.
  for (const doctor of [doctorA, doctorB]) assert.ok(!(await call('GET', '/api/second-opinion', doctor.token)).body.requests.some((r: any) => r.id === request.id), 'completed request leaves the queue')
  const mine = ((await call('GET', '/api/second-opinion', alice.token)).body.requests as any[]).find(r => r.id === request.id)
  assert.equal(mine.status, 'completed'); assert.equal(mine.doctorEmail, doctorA.user.email); assert.equal(mine.finalOpinion.length, 4000); assert.equal(mine.aiDraft, undefined)
  assert.ok(!((await call('GET', '/api/second-opinion', bob.token)).body.requests as any[]).some(r => r.id === request.id), "bob never sees alice's request or opinion")

  console.log('secondOpinionHttpRbac: three real routes, anonymous 401, session-derived requester, patient-only view without AI draft, shared verified-clinician queue, single bounded completion; passed')
} finally {
  await running.stop()
}
