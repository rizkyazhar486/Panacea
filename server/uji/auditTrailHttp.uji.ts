// Alpha E3 characterization: every clinical change leaves an audit entry with the authenticated actor and a server timestamp.
// Real HTTP in isolated file mode; synthetic fixtures; doctor verification is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'audit-owner@localhost.test'
const running = await startIsolatedServer('audit-trail', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('audit-doctor@localhost.test', 'dokter')
  const alice = await login('audit-alice@localhost.test', 'pasien')
  const bob = await login('audit-bob@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  type Entry = { id: string; at: string; userId: string; userEmail: string; action: string; target?: string }
  const entries = async () => (await call('GET', '/api/audit', owner.token)).body.entries as Entry[]
  // Each step is timed around the call, so the server timestamp must fall inside that window (plus a small clock-read slack).
  const step = async <T>(run: () => Promise<T>) => {
    const from = Date.now() - 2000
    const result = await run()
    return { result, from, to: Date.now() + 2000 }
  }
  async function expectEntry(who: { user: { id: string; email: string } }, action: string, target: string | undefined, window: { from: number; to: number }) {
    const hits = (await entries()).filter(e => e.action === action && e.target === target && e.userId === who.user.id)
    assert.equal(hits.length, 1, `exactly one "${action}" entry for ${target} by ${who.user.email}, found ${hits.length}`)
    const e = hits[0]!
    assert.equal(e.userEmail, who.user.email, `${action}: actor email is the authenticated account`)
    const at = Date.parse(e.at)
    assert.ok(Number.isFinite(at) && new Date(at).toISOString() === e.at, `${action}: timestamp is ISO`)
    assert.ok(at >= window.from && at <= window.to, `${action}: timestamp comes from the server clock at the time of the call`)
  }

  const alicePid = `self-u-${alice.user.id}`
  const practicePid = 'audit-practice-patient'
  const forgedActor = { userEmail: 'forged@localhost.test', userId: 'forged-id', actor: 'forged', at: '1999-01-01T00:00:00.000Z' }

  // 1. Patient and record writes: actor and time are the session's, never the request's.
  let s = await step(() => call('POST', '/api/clinical/patient', alice.token, { patient: { id: alicePid, name: 'Synthetic audit patient' }, ...forgedActor }))
  assert.equal(s.result.status, 200)
  await expectEntry(alice, 'clinical.patient.create', alicePid, { from: s.from, to: s.to })
  s = await step(() => call('POST', '/api/clinical/patient', doctor.token, { patient: { id: practicePid, name: 'Synthetic practice patient' } }))
  assert.equal(s.result.status, 200)
  await expectEntry(doctor, 'clinical.patient.create', practicePid, { from: s.from, to: s.to })

  const record = (patientId: string, extra: Record<string, unknown> = {}) => ({
    id: `rec-${patientId}`, patientId, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    anamnesis: { keluhanUtama: 'Synthetic complaint' }, physicalExam: { general: 'Synthetic exam text' }, problems: [], plan: [], references: [], ...extra,
  })
  s = await step(() => call('POST', '/api/clinical/record', doctor.token, { patientId: alicePid, record: record(alicePid, { signedAt: 'sign-intent' }), ...forgedActor }))
  assert.equal(s.result.status, 200); assert.ok(s.result.body.record.signedAt, 'the doctor signed the record')
  await expectEntry(doctor, 'emr.save', alicePid, { from: s.from, to: s.to })
  // Editing a signed record archives the signed version: both the archive and the save are attributed to the editor.
  s = await step(() => call('POST', '/api/clinical/record', alice.token, { patientId: alicePid, record: { ...s.result.body.record, anamnesis: { keluhanUtama: 'Synthetic patient edit' } } }))
  assert.equal(s.result.status, 200)
  await expectEntry(alice, 'emr.signed_version_archived', alicePid, { from: s.from, to: s.to })
  assert.equal((await entries()).filter(e => e.action === 'emr.save' && e.target === alicePid).length, 2, 'both saves are recorded')

  // 2. Vitals, supportive results and education sheets are attributed to who recorded them.
  s = await step(() => call('POST', '/api/clinical/vital', doctor.token, { patientId: alicePid, vital: { hr: 70 } }))
  assert.equal(s.result.status, 200); await expectEntry(doctor, 'clinical.vital.add', alicePid, { from: s.from, to: s.to })
  s = await step(() => call('POST', '/api/clinical/supportive', alice.token, { patientId: alicePid, result: { type: 'synthetic' } }))
  assert.equal(s.result.status, 200); await expectEntry(alice, 'clinical.supportive.add', alicePid, { from: s.from, to: s.to })
  s = await step(() => call('POST', '/api/clinical/education', doctor.token, { patientId: alicePid, sheet: { title: 'Synthetic sheet' } }))
  assert.equal(s.result.status, 200); await expectEntry(doctor, 'clinical.education.save', alicePid, { from: s.from, to: s.to })

  // 3. Encounter close, and the link lifecycle (issue, failed redemption, redemption, unlink).
  const current = (await call('GET', `/api/clinical/records/${alicePid}`, doctor.token)).body.records[0]
  assert.equal((await call('POST', '/api/clinical/record', doctor.token, { patientId: alicePid, record: { ...current, signedAt: 'sign-intent' } })).status, 200)
  s = await step(() => call('POST', '/api/clinical/encounter/close', doctor.token, { patientId: alicePid }))
  assert.equal(s.result.status, 200); await expectEntry(doctor, 'emr.encounter_closed', alicePid, { from: s.from, to: s.to })
  s = await step(() => call('POST', `/api/clinical/patient/${practicePid}/link-code`, doctor.token, {}))
  assert.equal(s.result.status, 200); await expectEntry(doctor, 'emr.link_code_issued', practicePid, { from: s.from, to: s.to })
  const code = s.result.body.code as string
  s = await step(() => call('POST', '/api/clinical/link', bob.token, { code: 'NOT-A-REAL-CODE' }))
  assert.equal(s.result.status, 404); await expectEntry(bob, 'emr.link_failed', 'invalid', { from: s.from, to: s.to })
  s = await step(() => call('POST', '/api/clinical/link', bob.token, { code }))
  assert.equal(s.result.status, 200); await expectEntry(bob, 'emr.linked', practicePid, { from: s.from, to: s.to })
  s = await step(() => call('DELETE', `/api/clinical/link/${practicePid}`, bob.token))
  assert.equal(s.result.status, 200); await expectEntry(bob, 'emr.unlinked', practicePid, { from: s.from, to: s.to })

  // 4. Lab and referral lifecycle: successes are attributed to the actor, and refusals are audited too.
  const lab = await call('POST', '/api/lab-results', doctor.token, { patientId: alicePid, item: { name: 'Synthetic observation', valueText: 'fixture only', collectedAt: '2026-01-01' }, source: 'lab-intake' })
  assert.equal(lab.status, 201)
  const received = (await entries()).filter(e => e.action === 'labresult.received' && e.target === lab.body.id)
  assert.equal(received.length, 1); assert.equal(received[0]!.userId, doctor.user.id); assert.equal(received[0]!.userEmail, doctor.user.email)
  const adv = await call('POST', `/api/lab-results/${lab.body.id}/advance`, doctor.token, { to: 'pending_review' })
  assert.equal(adv.status, 200)
  assert.equal((await entries()).filter(e => e.action === 'labresult.advanced' && e.userId === doctor.user.id && e.target?.startsWith(lab.body.id)).length, 1)
  const referral = await call('POST', '/api/referrals', doctor.token, { patientId: alicePid, kind: 'specialist', reason: 'Synthetic workflow fixture', toFacility: 'Synthetic facility' })
  assert.equal(referral.status, 201)
  assert.equal((await entries()).filter(e => e.action === 'referral.created' && e.target === referral.body.id && e.userId === doctor.user.id).length, 1)
  const refused = await call('POST', '/api/lab-results', bob.token, { patientId: alicePid, item: { name: 'Synthetic forged observation', valueText: 'forged', collectedAt: '2026-01-01' }, source: 'lab-intake' })
  assert.ok(refused.status === 403, 'a patient cannot record a lab result on another patient')
  assert.ok((await entries()).some(e => e.userId === bob.user.id && e.action.startsWith('labresult.received.rejected:')), 'a refused lab write is audited with the reason')

  // 5. Forged identity or time in a request body never reaches the log.
  const all = await entries()
  assert.ok(all.every(e => e.userEmail !== forgedActor.userEmail && e.userId !== forgedActor.userId && !e.at.startsWith('1999')), 'no entry carries a client-supplied actor or time')
  assert.equal(new Set(all.map(e => e.id)).size, all.length, 'entry ids are unique')
  assert.deepEqual(all.map(e => e.at), [...all.map(e => e.at)].sort().reverse(), 'entries are stored newest first')

  // 6. Reads of the log are owner-only: clinicians, patients and anonymous callers cannot read or alter it.
  assert.equal((await call('GET', '/api/audit', doctor.token)).status, 403)
  assert.equal((await call('GET', '/api/audit', alice.token)).status, 403)
  assert.equal((await call('GET', '/api/audit')).status, 401)
  for (const method of ['POST', 'PUT', 'DELETE'] as const) assert.ok([404, 405].includes((await call(method, '/api/audit', owner.token, {})).status), `no ${method} route can alter the audit log`)

  // 7. The log survives a restart unchanged.
  const before = await entries()
  await running.restart()
  assert.deepEqual((await entries()).map(e => e.id), before.map(e => e.id), 'every entry persists across a restart')

  // 8. KNOWN LIMITS against the written acceptance "every clinical change is recorded with actor and time" (documented so they cannot change silently):
  //    a. An EMR write refused with 403 leaves NO audit entry (lab/referral refusals do). Whether refused EMR writes must be audited is an owner decision (see A6).
  const sawBefore = (await entries()).length
  assert.equal((await call('POST', '/api/clinical/record', bob.token, { patientId: alicePid, record: record(alicePid) })).status, 403)
  assert.equal((await entries()).filter(e => e.userId === bob.user.id && e.action === 'emr.save').length, 0, 'a refused EMR save is not recorded as a save')
  assert.equal((await entries()).length, sawBefore + 0, 'KNOWN LIMIT: a refused EMR write adds no audit entry at all')
  //    b. An entry names who did what to which patient; it does not store the before/after content (signed versions live in record-history).
  assert.ok(all.every(e => Object.keys(e).every(k => ['id', 'at', 'userId', 'userEmail', 'action', 'target'].includes(k))), 'KNOWN LIMIT: entries carry no content diff')
  //    c. The log is a plain array in the data file (newest 5000 kept, newest 300 returned): it is not hash-chained or tamper-evident.
  //    This test does not claim tamper evidence or long-term retention.

  // 9. Route guard: every state-changing clinical route must write an audit entry, so a new route cannot ship unaudited.
  const root = fileURLToPath(new URL('..', import.meta.url))
  const chunks = (file: string) => readFileSync(join(root, file), 'utf8').split(/\n(?=\s*app\.(?:get|post|put|patch|delete)\()/)
  const mutating = (chunk: string, prefix: RegExp) => new RegExp(`^\\s*app\\.(?:post|put|patch|delete)\\('(${prefix.source}[^']*)'`).exec(chunk)?.[1]
  const unaudited: string[] = []
  for (const chunk of chunks('src/index.ts')) {
    const route = mutating(chunk, /\/api\/(?:clinical\/|lab-log|clinician\/lab-shares|care\/|second-opinion)/)
    if (route && !/add(?:Lab)?Audit\(/.test(chunk)) unaudited.push(route)
  }
  for (const chunk of chunks('src/modules/labResults/http/routes.ts')) {
    const route = mutating(chunk, /\/api\/(?:lab-results|referrals)/)
    if (route && !/balas\(/.test(chunk)) unaudited.push(route)
  }
  assert.deepEqual(unaudited, [], `state-changing clinical routes without an audit entry: ${unaudited.join(', ')}`)
  console.log('auditTrailHttp: clinical, link, lab and referral writes are audited with the session actor and server time; forged identity/time ignored; owner-only; persists; known limits recorded; passed')
} finally {
  await running.stop()
}

await import('./careWriteAuditHttp.uji.js')
