// Share expiry over real HTTP in isolated file mode. Time is controlled without a fake clock: the process is stopped, the persisted
// share's end time is moved into the past, and a new process starts on the same file. Synthetic fixtures; doctor verification is a fixture.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'expiry-owner@localhost.test'
const running = await startIsolatedServer('share-expiry', ownerEmail)
try {
  const { call, restart } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; email: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('expiry-doctor@localhost.test', 'dokter')
  const alice = await login('expiry-alice@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  const gdp = [{ id: 'g1', tanggal: '2026-01-02', nilai: 93.7 }]
  assert.equal((await call('PUT', '/api/lab-log', alice.token, { log: { gdp }, diperbaruiPada: new Date().toISOString() })).status, 200)
  const share = (await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: doctor.user.email, hari: 7 })).body
  const diagnosis = { system: 'local', code: 'SYN-1', display: 'Synthetic fixture condition', verificationStatus: 'provisional' }
  const questions = [{ id: 'sym', kind: 'boolean', prompt: 'Synthetic symptom today?' }]
  const plan = (await call('POST', `/api/clinician/lab-shares/${share.id}/care-plan`, doctor.token, { signIntent: true, diagnosisRefs: [diagnosis], questions })).body
  const today = new Date().toISOString().slice(0, 10)
  const answer = (id: string, planId: string) => call('POST', '/api/care/reports', alice.token, { planId, scheduledFor: today, clientId: id, answers: [{ questionId: 'sym', value: true }] })
  assert.equal((await answer('expiry-report-1', plan.id)).status, 200)
  assert.equal((await call('POST', `/api/clinician/lab-shares/${share.id}/review`, doctor.token, { tes: 'gdp', catatan: 'Synthetic review before expiry' })).status, 200)

  // The doctor-side routes that depend on an active share, each with the status it must return.
  const doctorRoutes = (id: string): Array<[string, string, unknown]> => [
    ['GET', `/api/clinician/lab-shares/${id}/fhir`, undefined], ['GET', `/api/clinician/lab-shares/${id}/care`, undefined], ['GET', `/api/clinician/lab-shares/${id}/care/fhir`, undefined],
    ['POST', `/api/clinician/lab-shares/${id}/review`, { tes: 'gdp' }], ['POST', `/api/clinician/lab-shares/${id}/care-plan`, { signIntent: true, diagnosisRefs: [diagnosis], questions }],
  ]

  // 1. While active (7 days left) every dependent route works for the named doctor and the patient's follow-up is live.
  assert.deepEqual((await call('GET', '/api/clinician/lab-shares', doctor.token)).body.shares.map((s: any) => s.id), [share.id])
  for (const [method, path, body] of doctorRoutes(share.id).slice(0, 3)) assert.equal((await call(method, path, doctor.token, body)).status, 200, `active ${method} ${path}`)
  assert.equal((await call('GET', '/api/care/plans', alice.token)).body.plans.length, 1)

  // 2. Move the end time into the past while the process is down, then start a new process on the same file.
  const past = new Date(Date.now() - 1000).toISOString()
  await restart((data) => {
    const entry = data.labShares.find((s: any) => s.id === share.id)
    assert.ok(entry, 'the share is in the persisted file'); assert.equal(entry.dicabut, undefined, 'it was not revoked')
    entry.berakhir = past
  })

  // 3. Expiry is enforced on every dependent route, not just the list: nothing of the patient's is readable or writable through the old share.
  assert.deepEqual((await call('GET', '/api/clinician/lab-shares', doctor.token)).body.shares, [], 'an expired share is not listed')
  for (const [method, path, body] of doctorRoutes(share.id)) assert.equal((await call(method, path, doctor.token, body)).status, 404, `expired ${method} ${path}`)
  assert.deepEqual((await call('GET', '/api/care/plans', alice.token)).body.plans, [], 'the follow-up stops when the share expires')
  assert.equal((await answer('expiry-report-2', plan.id)).status, 404, 'the patient can no longer answer the expired check-in')
  const state = (await call('GET', '/api/keadaan-longitudinal', alice.token)).body
  assert.deepEqual(state.care.plans, [], 'the longitudinal read model excludes the expired follow-up')
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/fhir`, undefined)).status, 401)

  // 4. The patient's own data is untouched by the expiry, and her own view still records what happened.
  assert.deepEqual((await call('GET', '/api/lab-log', alice.token)).body.log, { gdp }, 'her lab log is unchanged')
  const shares = (await call('GET', '/api/lab-log/shares', alice.token)).body
  assert.equal(shares.shares.find((s: any) => s.id === share.id)?.berakhir, past, 'the expired share is still listed to its owner with its end time')
  assert.equal(shares.reviews.length, 1, 'the review written while the share was active stays visible to the patient')
  assert.ok(shares.audit.some((a: any) => a.aksi === 'dibaca-dokter'), 'the audit of what the doctor read while it was active is kept')

  // 5. Renewing is explicit: a new share works for the doctor, but the expired plan is not resurrected until a clinician sets a new one.
  const renewed = (await call('POST', '/api/lab-log/shares', alice.token, { dokterEmail: doctor.user.email, hari: 7 })).body
  assert.notEqual(renewed.id, share.id)
  assert.deepEqual((await call('GET', '/api/clinician/lab-shares', doctor.token)).body.shares.map((s: any) => s.id), [renewed.id])
  assert.equal((await call('GET', `/api/clinician/lab-shares/${renewed.id}/fhir`, doctor.token)).status, 200, 'the renewed share works')
  assert.equal((await call('GET', `/api/clinician/lab-shares/${share.id}/fhir`, doctor.token)).status, 404, 'the old share stays expired')
  assert.deepEqual((await call('GET', '/api/care/plans', alice.token)).body.plans, [], 'the old plan is not resurrected by a new share')
  assert.equal((await answer('expiry-report-3', plan.id)).status, 404)
  assert.equal((await call('POST', `/api/clinician/lab-shares/${renewed.id}/care-plan`, doctor.token, { signIntent: true, diagnosisRefs: [diagnosis], questions })).status, 200)
  assert.equal((await call('GET', '/api/care/plans', alice.token)).body.plans.length, 1, 'a new plan on the new share is active')

  console.log('shareExpiryHttp: an expired share (end time moved into the past across a process restart) is refused on every dependent clinician, care and read-model route, patient data is untouched, and renewing is explicit without resurrecting the old plan; passed')
} finally {
  await running.stop()
}
