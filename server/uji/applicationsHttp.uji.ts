// Professional-role applications over real HTTP: only the owner lists and decides, a grant is what makes a doctor account act as a
// clinician, each application is decided once, and re-deciding never leaves a rejected application on a verified account.
// Synthetic accounts; "granted" is a workflow fixture, not credential verification.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'applications-owner@localhost.test'
const running = await startIsolatedServer('applications', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const docA = await login('applications-doc-a@localhost.test', 'dokter')
  const docB = await login('applications-doc-b@localhost.test', 'dokter')
  const patient = await login('applications-patient@localhost.test', 'pasien')
  // A clinician-gated route that needs no fixtures: the validation study list is open to verified doctor accounts only.
  const actsAsClinician = async (a: { token: string }) => (await call('GET', '/api/validation/studies', a.token)).status === 200
  const list = async () => (await call('GET', '/api/applications', owner.token)).body.applications as any[]
  const decide = (token: string | undefined, body: Record<string, unknown>) => call('POST', '/api/applications/decide', token, body)
  const submit = (a: { token: string }, body: Record<string, unknown> = {}) => call('POST', '/api/applications', a.token, { str: 'SYN-STR-0001', gelar: 'dr.', keahlian: 'Synthetic', universitas: 'Synthetic University', tahunLulus: '2015', ...body })
  const actions = async () => ((await call('GET', '/api/audit', owner.token)).body.entries ?? []) .map((e: any) => e.action as string)
  const count = (a: string[], n: string) => a.filter(x => x === n).length

  // 1. Anonymous and non-owner callers.
  assert.equal((await call('POST', '/api/applications', undefined, {})).status, 401)
  assert.equal((await call('GET', '/api/applications')).status, 401)
  assert.equal((await decide(undefined, { id: 'x', grant: true })).status, 401)
  for (const [who, t] of [['patient', patient.token], ['the applicant', docA.token]] as const) {
    assert.equal((await call('GET', '/api/applications', t)).status, 403, `${who} cannot list`)
    const r = await decide(t, { id: 'x', grant: true }); assert.equal(r.status, 403, `${who} cannot decide`); assert.deepEqual(r.body, { error: 'forbidden' })
  }

  // 2. Submitting does not grant anything; a second submission replaces the pending one (still one pending row per user and role).
  assert.equal(await actsAsClinician(docA), false, 'unverified doctor account is not a clinician')
  const first = await submit(docA); assert.equal(first.status, 200); assert.equal(first.body.application.status, 'pending')
  assert.equal(await actsAsClinician(docA), false, 'submitting grants nothing')
  const again = await submit(docA, { str: 'SYN-STR-0002' })
  assert.notEqual(again.body.application.id, first.body.application.id)
  let rows = await list(); assert.equal(rows.filter(r => r.userId === docA.user.id && r.status === 'pending').length, 1, 'one pending row per user and role')
  assert.equal(rows.find(r => r.userId === docA.user.id).str, 'SYN-STR-0002')

  // 3. Unknown or missing ids are 404 and change nothing.
  for (const body of [{ id: 'no-such-id', grant: true }, { grant: true }, { id: 12345, grant: true }]) assert.deepEqual((await decide(owner.token, body)).status, 404)
  assert.equal(await actsAsClinician(docA), false)

  // 4. Grant: the applicant now acts as a clinician; the decision is audited.
  const appA = again.body.application.id
  const granted = await decide(owner.token, { id: appA, grant: true })
  assert.equal(granted.status, 200); assert.equal(granted.body.application.status, 'granted'); assert.ok(Number.isFinite(Date.parse(granted.body.application.decidedAt)))
  assert.equal(await actsAsClinician(docA), true, 'a granted application is what verifies the account')

  // 5. Paired: a rejected application grants nothing.
  const appB = (await submit(docB)).body.application.id
  const rejected = await decide(owner.token, { id: appB, grant: false })
  assert.equal(rejected.status, 200); assert.equal(rejected.body.application.status, 'rejected'); assert.equal(await actsAsClinician(docB), false)

  // 6. Each application is decided once. Re-deciding is 409 and leaves the status, the account's access and the audit trail as they were.
  const before = await actions()
  for (const [label, id, grant, status] of [['grant again', appA, true, 'granted'], ['reject after grant', appA, false, 'granted'], ['grant after reject', appB, true, 'rejected'], ['reject again', appB, false, 'rejected']] as const) {
    const r = await decide(owner.token, { id, grant }); assert.equal(r.status, 409, label); assert.deepEqual(r.body, { error: 'already_decided' }, label)
    assert.equal((await list()).find(x => x.id === id).status, status, `${label}: status unchanged`)
  }
  assert.equal(await actsAsClinician(docA), true, 'a refused reject does not revoke, and does not contradict the granted record')
  assert.equal(await actsAsClinician(docB), false, 'a refused grant does not verify a rejected applicant')
  const after = await actions()
  for (const n of ['application.grant', 'application.reject']) assert.equal(count(after, n), count(before, n), `${n}: refused re-decisions are not audited as decisions`)
  assert.equal(count(after, 'application.grant'), 1); assert.equal(count(after, 'application.reject'), 1); assert.equal(count(after, 'application.submit'), 3)

  // 7. Revocation stays an explicit, separate owner action.
  assert.equal((await call('POST', `/api/doctors/${docA.user.id}/verify`, docA.token, { status: 'pending' })).status, 403, 'a doctor cannot revoke or grant by themselves')
  assert.equal((await call('POST', `/api/doctors/${docA.user.id}/verify`, owner.token, { status: 'pending' })).status, 200)
  assert.equal(await actsAsClinician(docA), false, 'owner revocation takes effect')

  console.log('applicationsHttp: 401/403 gates, submit grants nothing and replaces the pending row, 404 for unknown ids, grant verifies and reject does not, each application decided once (409 already_decided, no contradictory state, no extra audit), revocation is separate; passed')
} finally {
  await running.stop()
}
