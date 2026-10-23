// Alpha F1: peran perawat dan laboratorium, lewat HTTP nyata. Hak akses minimum dan deny-by-default:
// peran tidak bisa dipilih sendiri; hanya owner yang memberi peran dan penugasan per pasien; tanpa penugasan staf tidak melihat apa pun;
// penugasan dicabut = akses langsung hilang; semua perubahan diaudit. Fixture sintetis; verifikasi dokter hanyalah fixture alur kerja.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serverRoot, startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'staff-owner@localhost.test'
const running = await startIsolatedServer('staff-rbac', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; role: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('staff-doctor@localhost.test', 'dokter')
  const alice = await login('staff-alice@localhost.test', 'pasien')
  const bob = await login('staff-bob@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  // 1. Peran staf tidak bisa dipilih sendiri: permintaan perawat/lab saat login menjadi pasien.
  const nurseTry = await login('staff-nurse@localhost.test', 'perawat'); assert.equal(nurseTry.user.role, 'pasien', 'self-selecting perawat yields a patient account')
  const labTry = await login('staff-lab@localhost.test', 'lab'); assert.equal(labTry.user.role, 'pasien', 'self-selecting lab yields a patient account')
  const nurse = nurseTry, lab = labTry

  // 2. Rute pemilik: hanya owner. Anonim 401; pasien, dokter terverifikasi, dan calon staf 403.
  const source = readFileSync(join(serverRoot, 'src/index.ts'), 'utf8')
  const registered = [...source.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/owner\/staff[^']*)'/g)].map((m) => `${m[1]!.toUpperCase()} ${m[2]}`).sort()
  assert.deepEqual(registered, ['GET /api/owner/staff', 'POST /api/owner/staff-assignments', 'POST /api/owner/staff-role'], 'every staff route needs an authorization decision here')
  const ownerCalls: [string, string, unknown][] = [['GET', '/api/owner/staff', undefined], ['POST', '/api/owner/staff-role', { userId: nurse.user.id, role: 'perawat' }], ['POST', '/api/owner/staff-assignments', { userId: nurse.user.id, patientId: 'x' }]]
  for (const [m, p, b] of ownerCalls) {
    assert.equal((await call(m, p, undefined, b)).status, 401, `anonymous ${m} ${p}`)
    for (const [who, t] of [['patient', alice.token], ['verified doctor', doctor.token], ['would-be nurse', nurse.token]] as const) assert.equal((await call(m, p, t, b)).status, 403, `${who} ${m} ${p}`)
  }
  assert.equal((await call('GET', '/api/owner/staff', owner.token)).body.staff.length, 0, 'no staff before the owner grants a role')

  // 3. Pemberian peran: masukan tidak valid ditolak; hanya pasien/staf yang layak; owner dan dokter tidak disentuh.
  for (const body of [{}, { userId: nurse.user.id }, { userId: nurse.user.id, role: 'dokter' }, { userId: nurse.user.id, role: 'admin' }, { userId: nurse.user.id, role: 'owner' }, { userId: nurse.user.id, role: 5 }, { userId: '', role: 'perawat' }, { userId: 5, role: 'perawat' }, { userId: 'x'.repeat(97), role: 'perawat' }])
    assert.equal((await call('POST', '/api/owner/staff-role', owner.token, body)).status, 400, `invalid ${JSON.stringify(body)}`)
  assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: 'no-such-user', role: 'perawat' })).status, 404)
  assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: doctor.user.id, role: 'perawat' })).status, 409, 'a doctor account is not converted')
  assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: owner.user.id, role: 'perawat' })).status, 409, 'the owner account is not converted')
  assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: nurse.user.id, role: 'perawat' })).status, 200)
  assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: lab.user.id, role: 'lab' })).status, 200)
  assert.deepEqual((await call('GET', '/api/owner/staff', owner.token)).body.staff.map((s: any) => [s.role, s.patientIds.length]).sort(), [['lab', 0], ['perawat', 0]])

  // 4. Data sintetis: dua pasien, masing-masing dengan satu hasil dan satu rujukan oleh dokter terverifikasi.
  const item = { name: 'Synthetic observation', valueText: 'fixture only', collectedAt: '2026-01-01' }
  const labInput = (patientId: string) => ({ patientId, item, source: 'lab-intake' })
  const pid = (u: { user: { id: string } }) => `self-u-${u.user.id}`
  const subject: Record<string, { patientId: string; lab: any; referral: any }> = {}
  for (const [k, acct] of [['alice', alice], ['bob', bob]] as const) {
    const patientId = pid(acct)
    assert.equal((await call('POST', '/api/clinical/patient', doctor.token, { patient: { id: patientId, name: 'Synthetic subject' } })).status, 200)
    const l = await call('POST', '/api/lab-results', doctor.token, labInput(patientId)); const r = await call('POST', '/api/referrals', doctor.token, { patientId, kind: 'specialist', reason: 'Synthetic fixture', toFacility: 'Synthetic facility' })
    assert.equal(l.status, 201); assert.equal(r.status, 201)
    subject[k] = { patientId, lab: l.body, referral: r.body }
  }
  const A = subject.alice!, B = subject.bob!
  const ids = (r: any, key: string) => (r.body[key] as any[]).map((x) => x.id).sort()
  const snapshot = async () => ({ lab: (await call('GET', '/api/lab-results', doctor.token)).body, ref: (await call('GET', '/api/referrals', doctor.token)).body })
  const deny = async (method: string, path: string, token: string, body: unknown, status: number, label: string) => {
    const before = await snapshot(); assert.equal((await call(method, path, token, body)).status, status, label); assert.deepEqual(await snapshot(), before, `${label}: a refusal changes nothing`)
  }

  // 5. Tanpa penugasan: staf tidak melihat atau menulis apa pun, dan metrik seluruh tenant ditutup.
  for (const [who, t] of [['nurse', nurse.token], ['lab', lab.token]] as const) {
    assert.deepEqual((await call('GET', '/api/lab-results', t)).body.results, [], `${who} without assignment lists nothing`)
    assert.deepEqual((await call('GET', '/api/referrals', t)).body.referrals, [], `${who} without assignment sees no referrals`)
    await deny('GET', `/api/lab-results/${A.lab.id}`, t, undefined, 404, `${who} unassigned read`)
    await deny('POST', '/api/lab-results', t, labInput(A.patientId), 403, `${who} unassigned intake`)
    await deny('POST', `/api/lab-results/${A.lab.id}/advance`, t, { to: 'pending_review' }, 404, `${who} unassigned advance`)
    await deny('GET', '/api/lab-results/metrics', t, undefined, 403, `${who} tenant-wide metrics`)
    await deny('GET', `/api/referrals/${A.referral.id}`, t, undefined, 404, `${who} unassigned referral read`)
  }

  // 6. Penugasan: hanya pasien yang ditugaskan; id warisan objek dan akun non-staf ditolak.
  const assign = (userId: string, patientId: unknown, revoke?: unknown) => call('POST', '/api/owner/staff-assignments', owner.token, { userId, patientId, ...(revoke === undefined ? {} : { revoke }) })
  for (const bad of ['__proto__', 'constructor', 'toString', '', 5, null]) assert.equal((await assign(nurse.user.id, bad)).status, 400, `patientId ${String(bad)}`)
  assert.equal((await assign(nurse.user.id, A.patientId, 'yes')).status, 400, 'revoke must be a boolean'); assert.equal((await assign(alice.user.id, A.patientId)).status, 404, 'a patient account cannot be assigned'); assert.equal((await assign('no-such-user', A.patientId)).status, 404)
  assert.deepEqual((await assign(nurse.user.id, A.patientId)).body, { ok: true, changed: true }); assert.deepEqual((await assign(nurse.user.id, A.patientId)).body, { ok: true, changed: false }, 'assigning twice is a no-op')
  assert.deepEqual((await assign(lab.user.id, B.patientId)).body, { ok: true, changed: true })

  // 7. Perawat ditugaskan ke Alice: hanya Alice terlihat; menulis hanya untuk Alice; lab hanya untuk Bob.
  const nurseList = await call('GET', '/api/lab-results', nurse.token); assert.deepEqual(ids(nurseList, 'results'), [A.lab.id], 'the nurse lists only the assigned patient')
  assert.equal((await call('GET', `/api/lab-results/${A.lab.id}`, nurse.token)).status, 200); await deny('GET', `/api/lab-results/${B.lab.id}`, nurse.token, undefined, 404, 'nurse reads an unassigned patient')
  await deny('POST', '/api/lab-results', nurse.token, labInput(B.patientId), 403, 'nurse intake for an unassigned patient'); await deny('POST', `/api/lab-results/${B.lab.id}/advance`, nurse.token, { to: 'pending_review' }, 404, 'nurse advance on an unassigned patient')
  await deny('GET', '/api/lab-results/metrics', nurse.token, undefined, 403, 'assigned nurse still has no tenant-wide metrics')
  const intake = await call('POST', '/api/lab-results', nurse.token, labInput(A.patientId)); assert.equal(intake.status, 201); assert.equal(intake.body.provenance.recordedBy, nurse.user.id, 'provenance names the nurse'); assert.equal(intake.body.patientId, A.patientId)
  assert.equal((await call('POST', `/api/lab-results/${A.lab.id}/advance`, nurse.token, { to: 'pending_review' })).status, 200, 'a nurse may move a received result to pending_review')
  await deny('POST', `/api/lab-results/${A.lab.id}/advance`, nurse.token, { to: 'reviewed' }, 403, 'a nurse cannot review (clinician-only step)')
  assert.deepEqual(ids(await call('GET', '/api/lab-results', lab.token), 'results'), [B.lab.id], 'the lab account lists only its assigned patient')
  assert.equal((await call('POST', '/api/lab-results', lab.token, labInput(B.patientId))).status, 201); await deny('POST', '/api/lab-results', lab.token, labInput(A.patientId), 403, 'lab intake for an unassigned patient')
  await deny('POST', '/api/referrals', nurse.token, { patientId: A.patientId, kind: 'specialist', reason: 'x', toFacility: 'y' }, 403, 'staff cannot create referrals')
  await deny('POST', `/api/referrals/${A.referral.id}/advance`, nurse.token, { to: 'accepted' }, 403, 'a nurse cannot accept a referral (clinician/admin step)')
  // Dokter dan pasien tidak terpengaruh: dokter tetap melihat semua; pasien hanya miliknya.
  assert.equal((await call('GET', '/api/lab-results', doctor.token)).body.results.length >= 4, true, 'the clinician view is unchanged'); assert.ok((await call('GET', '/api/lab-results', bob.token)).body.results.every((r: any) => r.patientId === B.patientId), 'a patient sees only own results')
  assert.ok(!(await call('GET', '/api/lab-results', bob.token)).body.results.some((r: any) => r.patientId === A.patientId), 'a patient never sees another patient')

  // 8. Pencabutan penugasan berlaku seketika dan idempoten; pencabutan peran mencabut semua penugasan; token lama tidak menyimpan hak.
  assert.deepEqual((await assign(nurse.user.id, A.patientId, true)).body, { ok: true, changed: true }); assert.deepEqual((await assign(nurse.user.id, A.patientId, true)).body, { ok: true, changed: false })
  assert.deepEqual((await call('GET', '/api/lab-results', nurse.token)).body.results, [], 'after unassignment the same session sees nothing'); await deny('GET', `/api/lab-results/${A.lab.id}`, nurse.token, undefined, 404, 'unassigned again')
  assert.deepEqual((await assign(lab.user.id, A.patientId)).body, { ok: true, changed: true })
  assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: lab.user.id, role: 'pasien' })).status, 200)
  assert.deepEqual((await call('GET', '/api/owner/staff', owner.token)).body.staff.map((s: any) => s.role), ['perawat'], 'the demoted account is no longer staff')
  assert.deepEqual((await call('GET', '/api/lab-results', lab.token)).body.results, [], 'a revoked role with an old token sees no lab data (it is a plain patient account again)')
  await deny('POST', '/api/lab-results', lab.token, labInput(A.patientId), 403, 'a revoked lab account cannot ingest'); assert.equal((await call('POST', '/api/owner/staff-role', owner.token, { userId: lab.user.id, role: 'lab' })).status, 200)
  assert.deepEqual((await call('GET', '/api/owner/staff', owner.token)).body.staff.find((s: any) => s.id === lab.user.id).patientIds, [], 're-granting the role does not resurrect old assignments')

  // 9. Setiap perubahan diaudit dengan aktor dan sasaran.
  const audit = (await call('GET', '/api/audit', owner.token)).body.entries as { action: string; target?: string; userId: string }[]
  for (const action of ['staff.role:perawat', 'staff.role:lab', 'staff.role:pasien', 'staff.assign', 'staff.unassign']) assert.ok(audit.some((e) => e.action === action && e.userId === owner.user.id), `audit records ${action}`)
  assert.ok(audit.some((e) => e.action === 'staff.role.rejected:not-eligible' && e.target === doctor.user.id), 'a refused role change is audited too')
  assert.ok(audit.some((e) => e.action === 'staff.assign' && e.target === `${nurse.user.id}:${A.patientId}`), 'the audit target names the staff account and the patient')

  console.log('staffRbacHttp: perawat/lab roles are owner-granted only, patient-scoped by explicit assignment, refuse everything unassigned, revoke instantly and are audited')
} finally {
  await running.stop()
}
