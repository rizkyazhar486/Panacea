// Alpha E2: real HTTP authorization for the patient lab log and the clinician lab-share routes.
// Synthetic fixtures; clinician verification is a workflow fixture, not clinical approval.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serverRoot, startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'lab-share-owner@localhost.test'
const running = await startIsolatedServer('lab-share-rbac', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctorA = await login('lab-share-doctor-a@localhost.test', 'dokter')
  const doctorB = await login('lab-share-doctor-b@localhost.test', 'dokter')
  const unverified = await login('lab-share-unverified@localhost.test', 'dokter')
  const alice = await login('lab-share-alice@localhost.test', 'pasien')
  const bob = await login('lab-share-bob@localhost.test', 'pasien')
  for (const doctor of [doctorA, doctorB]) {
    assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)
  }

  // 1. Route coverage: every registered lab-log / lab-shares route needs an explicit decision below.
  const source = readFileSync(join(serverRoot, 'src/index.ts'), 'utf8')
  const registered = [...source.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/(?:lab-log|clinician\/lab-shares)[^']*)'/g)].map(m => `${m[1]!.toUpperCase()} ${m[2]}`).sort()
  const decided = [
    'GET /api/lab-log', 'PUT /api/lab-log', 'GET /api/lab-log/fhir', 'GET /api/lab-log/shares', 'POST /api/lab-log/shares', 'DELETE /api/lab-log/shares/:id',
    'GET /api/clinician/lab-shares', 'GET /api/clinician/lab-shares/:id/fhir', 'POST /api/clinician/lab-shares/:id/review',
    'POST /api/clinician/lab-shares/:id/care-plan', 'GET /api/clinician/lab-shares/:id/care/fhir', 'GET /api/clinician/lab-shares/:id/care',
  ].sort()
  assert.deepEqual(registered, decided, 'every registered lab-log / lab-share route needs an HTTP authorization decision')

  // 2. Anonymous: 401 on every route, with a real share id so a 404 could not mask a missing auth check.
  const now = new Date().toISOString()
  const labLog = { gdp: [{ id: 'g1', tanggal: '2026-01-02', nilai: 93.7 }] }
  assert.equal((await call('PUT', '/api/lab-log', alice.token, { log: labLog, diperbaruiPada: now })).status, 200)
  const shared = await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: 'lab-share-doctor-a@localhost.test', hari: 7 })
  assert.equal(shared.status, 200)
  const shareId: string = shared.body.id
  const concrete = (route: string) => route.replace(':id', shareId).split(' ') as [string, string]
  const bodies: Record<string, unknown> = {
    'PUT /api/lab-log': { log: {}, diperbaruiPada: now }, 'POST /api/lab-log/shares': { dokterEmail: 'x@localhost.test', hari: 1 },
    'POST /api/clinician/lab-shares/:id/review': { tes: 'gdp' }, 'POST /api/clinician/lab-shares/:id/care-plan': {},
  }
  for (const route of decided) {
    const [method, path] = concrete(route)
    assert.equal((await call(method, path, undefined, bodies[route])).status, 401, `anonymous ${route}`)
  }

  // 3. Patient lab log is scoped to the session owner: no id in the path, no cross-account read.
  assert.deepEqual((await call('GET', '/api/lab-log', alice.token)).body.log, labLog)
  assert.deepEqual((await call('GET', '/api/lab-log', bob.token)).body, { log: {}, diperbaruiPada: null }, 'bob does not see alice results')
  // Identity comes only from the session: a client-supplied email, id or patient field never redirects the read.
  for (const probe of ['?email=lab-share-alice@localhost.test', `?patientId=${alice.user.id}`, `?pasienEmail=lab-share-alice@localhost.test`]) {
    assert.deepEqual((await call('GET', `/api/lab-log${probe}`, bob.token)).body, { log: {}, diperbaruiPada: null }, `lab-log ${probe}`)
    const fhir = await call('GET', `/api/lab-log/fhir${probe}`, bob.token)
    assert.ok(!JSON.stringify(fhir.body).includes('93.7'), `lab-log/fhir ${probe}`)
    assert.deepEqual((await call('GET', `/api/lab-log/shares${probe}`, bob.token)).body.shares, [], `lab-log/shares ${probe}`)
  }
  const bobFhir = await call('GET', '/api/lab-log/fhir', bob.token)
  assert.equal(bobFhir.status, 200)
  assert.ok(!JSON.stringify(bobFhir.body).includes('gdp') && !JSON.stringify(bobFhir.body).includes('93.7'), 'bob FHIR export carries none of alice data')
  assert.ok((await call('GET', '/api/lab-log/fhir', alice.token)).body.entry?.length > 0 || JSON.stringify((await call('GET', '/api/lab-log/fhir', alice.token)).body).includes('93.7'), 'alice FHIR export carries her own result')
  // A stale write cannot resurrect older data (409) and malformed bodies are rejected (400), neither mutating the stored log.
  const stored = (await call('GET', '/api/lab-log', alice.token)).body
  assert.equal((await call('PUT', '/api/lab-log', alice.token, { log: {}, diperbaruiPada: '2000-01-01T00:00:00.000Z' })).status, 409)
  assert.equal((await call('PUT', '/api/lab-log', alice.token, { log: { gdp: [{ id: 'g2', tanggal: '2026-02-30', nilai: 90 }] }, diperbaruiPada: now })).status, 400)
  assert.equal((await call('PUT', '/api/lab-log', alice.token, { log: { gdp: [{ id: 'g2', tanggal: '2026-01-03', nilai: -1 }] }, diperbaruiPada: now })).status, 400)
  assert.equal((await call('PUT', '/api/lab-log', alice.token, { log: labLog, diperbaruiPada: new Date(Date.now() + 3600e3).toISOString() })).status, 400, 'future timestamp rejected')
  assert.deepEqual((await call('GET', '/api/lab-log', alice.token)).body, stored, 'rejected writes leave the stored log untouched')

  // 4. Shares: private to the patient; a patient cannot see or revoke another patient's share.
  assert.deepEqual((await call('GET', '/api/lab-log/shares', bob.token)).body.shares, [], 'bob sees none of alice shares')
  assert.equal((await call('DELETE', `/api/lab-log/shares/${shareId}`, bob.token)).status, 404, 'foreign revoke concealed')
  assert.equal((await call('GET', '/api/lab-log/shares', alice.token)).body.shares.find((s: any) => s.id === shareId)?.dicabut, undefined, 'foreign revoke did not revoke')
  for (const bad of [{ dokterEmail: 'not-an-email', hari: 7 }, { dokterEmail: 'lab-share-alice@localhost.test', hari: 7 }, { dokterEmail: 'lab-share-doctor-b@localhost.test', hari: 0 }, { dokterEmail: 'lab-share-doctor-b@localhost.test', hari: 100000 }]) {
    assert.equal((await call('POST', '/api/lab-log/shares', alice.token, bad)).status, 400, JSON.stringify(bad))
  }

  // 5. Clinician routes: only a verified doctor named by an active share, never a patient or an unverified doctor.
  const clinicianRoutes = decided.filter(r => r.includes('/api/clinician/'))
  for (const route of clinicianRoutes) {
    const [method, path] = concrete(route)
    for (const [who, account] of [['patient', bob], ['owner as patient role', alice], ['unverified doctor', unverified]] as const) {
      assert.equal((await call(method, path, account.token, bodies[route])).status, 403, `${who} ${route}`)
    }
    if (path !== '/api/clinician/lab-shares') assert.equal((await call(method, path, doctorB.token, bodies[route])).status, 404, `unnamed verified doctor ${route}`)
  }
  assert.deepEqual((await call('GET', '/api/clinician/lab-shares', doctorB.token)).body.shares, [], 'unnamed doctor lists nothing')
  assert.deepEqual((await call('GET', '/api/clinician/lab-shares', doctorA.token)).body.shares.map((s: any) => s.id), [shareId])

  // 6. The named doctor reads only through the share, and the read is audited on the patient side.
  const read = await call('GET', `/api/clinician/lab-shares/${shareId}/fhir`, doctorA.token)
  assert.equal(read.status, 200)
  assert.ok(JSON.stringify(read.body.bundle).includes('93.7'), 'named doctor receives the shared result')
  assert.deepEqual(read.body.verifiedVitals, [], 'no patient-entered vitals leak through the lab share')
  const audit = (await call('GET', '/api/lab-log/shares', alice.token)).body.audit as Array<{ aktor: string; aksi: string }>
  assert.ok(audit.some(a => a.aksi === 'dibaca-dokter' && a.aktor === 'lab-share-doctor-a@localhost.test'), 'doctor read is recorded in the patient audit')
  assert.ok(!(await call('GET', '/api/lab-log/shares', bob.token)).body.audit.some((a: any) => a.aksi === 'dibaca-dokter'), 'audit is private to the patient')

  // 7. A clinician review is authored by the named doctor, never edits the patient numbers, and is bounded.
  const before = (await call('GET', '/api/lab-log', alice.token)).body
  const review = await call('POST', `/api/clinician/lab-shares/${shareId}/review`, doctorA.token, { tes: 'gdp', catatan: 'Synthetic fixture note' })
  assert.equal(review.status, 200); assert.equal(review.body.dokterEmail, 'lab-share-doctor-a@localhost.test')
  assert.deepEqual((await call('GET', '/api/lab-log', alice.token)).body, before, 'a review never changes patient lab values')
  assert.equal((await call('POST', `/api/clinician/lab-shares/${shareId}/review`, doctorA.token, { tes: '__proto__' })).status, 400)
  assert.equal((await call('POST', `/api/clinician/lab-shares/${shareId}/review`, doctorA.token, { tes: 'gdp', cekUlangSebelum: '2000-01-01' })).status, 400, 'past recheck date rejected')
  assert.ok((await call('GET', '/api/lab-log/shares', alice.token)).body.reviews.some((t: any) => t.id === review.body.id), 'patient sees the review')
  assert.deepEqual((await call('GET', '/api/lab-log/shares', bob.token)).body.reviews, [], 'reviews are private to the patient')

  // 8. Care routes inherit the same share: no plan yet -> empty for the named doctor, still concealed from others.
  const care = await call('GET', `/api/clinician/lab-shares/${shareId}/care`, doctorA.token)
  assert.equal(care.status, 200); assert.equal(care.body.plan, null)
  assert.equal((await call('GET', `/api/clinician/lab-shares/${shareId}/care/fhir`, doctorA.token)).status, 404, 'no plan -> no care export')

  // 9. Revocation is immediate for every clinician route and cannot be undone by the doctor.
  assert.equal((await call('DELETE', `/api/lab-log/shares/${shareId}`, alice.token)).status, 200)
  for (const route of clinicianRoutes.filter(r => r !== 'GET /api/clinician/lab-shares')) {
    const [method, path] = concrete(route)
    assert.equal((await call(method, path, doctorA.token, bodies[route])).status, 404, `revoked share ${route}`)
  }
  assert.deepEqual((await call('GET', '/api/clinician/lab-shares', doctorA.token)).body.shares, [], 'revoked share disappears from the doctor list')
  assert.equal((await call('DELETE', `/api/lab-log/shares/nonexistent`, alice.token)).status, 404)
  // Re-sharing the same doctor replaces the old grant instead of stacking two active ones.
  const first = (await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: 'lab-share-doctor-a@localhost.test', hari: 1 })).body
  const second = (await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: 'lab-share-doctor-a@localhost.test', hari: 1 })).body
  assert.deepEqual((await call('GET', '/api/clinician/lab-shares', doctorA.token)).body.shares.map((s: any) => s.id), [second.id])
  assert.equal((await call('GET', `/api/clinician/lab-shares/${first.id}/fhir`, doctorA.token)).status, 404, 'replaced grant stops working')

  console.log('labShareHttpRbac: twelve real lab-log / lab-share routes, anonymous 401, own-only patient data, named-verified-doctor-only clinician access, audit, review bounds and immediate revocation; passed')
} finally {
  await running.stop()
}
