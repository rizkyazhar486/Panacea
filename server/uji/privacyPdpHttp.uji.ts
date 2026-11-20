// UU PDP No. 27/2022 technical controls over HTTP: explicit consent, isolated export, fail-closed account deletion + token revocation.
import assert from 'node:assert/strict'
import { startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'pdp-owner@localhost.test'
const running = await startIsolatedServer('pdp-http', ownerEmail, { captureLogs: true })
try {
  const { call, logs } = running
  for (const [m, p] of [['GET', '/api/privacy/consent'], ['POST', '/api/privacy/consent'], ['GET', '/api/privacy/export'], ['DELETE', '/api/privacy/account']] as const) {
    assert.equal((await call(m, p)).status, 401, `anonymous ${m} ${p}`)
  }

  const login = async (email: string, name: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, name, role: 'pasien' })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const alice = await login('pdp-alice@localhost.test', 'Alice PDP')
  const bob = await login('pdp-bob@localhost.test', 'Bob SecretMarker')

  assert.equal((await call('POST', '/api/privacy/consent', alice.token, { purpose: '', granted: true })).status, 400)
  const g1 = await call('POST', '/api/privacy/consent', alice.token, { purpose: 'health_sync', policyVersion: '2026-11', granted: true })
  assert.equal(g1.status, 201)
  assert.equal(g1.body.record.granted, true)
  assert.equal((await call('POST', '/api/privacy/consent', alice.token, { purpose: 'health_sync', policyVersion: '2026-11', granted: false })).status, 201)
  const cList = await call('GET', '/api/privacy/consent', alice.token)
  assert.equal(cList.status, 200)
  assert.equal(cList.body.consents.length, 2)
  assert.equal(cList.body.legalReviewRequired, true)

  await call('PUT', '/api/health-profile', alice.token, { profile: { restingHr: 58 } })
  await call('PUT', '/api/health-profile', bob.token, { profile: { restingHr: 74, secretTag: 'BOB-ONLY-DATA' } })

  const exp = await call('GET', '/api/privacy/export', alice.token)
  assert.equal(exp.status, 200)
  assert.equal(exp.body.schema, 'panacea-uu-pdp-export-v1')
  assert.equal(exp.body.account.email, 'pdp-alice@localhost.test')
  assert.equal(exp.body.healthProfile.restingHr, 58)
  assert.equal(JSON.stringify(exp.body).includes('pdp-bob@localhost.test'), false)
  assert.equal(JSON.stringify(exp.body).includes('BOB-ONLY-DATA'), false)

  assert.equal((await call('DELETE', '/api/privacy/account', alice.token, { confirm: 'NOPE' })).status, 400)
  const del = await call('DELETE', '/api/privacy/account', alice.token, { confirm: 'HAPUS_AKUN_SAYA' })
  assert.equal(del.status, 200)
  assert.equal(del.body.ok, true)

  assert.equal((await call('GET', '/api/auth/me', alice.token)).status, 401, 'deleted session token revoked')
  const bobExp = await call('GET', '/api/privacy/export', bob.token)
  assert.equal(bobExp.status, 200)
  assert.equal(bobExp.body.healthProfile.restingHr, 74)

  const written = logs()
  for (const sensitive of ['pdp-alice@localhost.test', 'pdp-bob@localhost.test', 'Alice PDP', 'BOB-ONLY-DATA']) {
    assert.equal(written.includes(sensitive), false, `log leaked sensitive string: ${sensitive}`)
  }
  console.log('privacyPdpHttp: consent, isolated export, fail-closed erasure, token revocation, zero log leak passed')
} finally {
  await running.stop()
}
