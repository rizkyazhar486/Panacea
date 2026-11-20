// Staged rollout (50 -> 200 -> 1000), kill-switches, and non-PHI observability /api/status over real HTTP.
import assert from 'node:assert/strict'
import { evaluateServiceAlerts } from '../src/domains/observability/alertEvaluator.js'
import { startIsolatedServer } from './support/isolatedServer.ts'

// Pure unit tests for alert thresholds
{
  const ok = evaluateServiceAlerts({ storageHealthy: true, consecutiveSaveFailures: 0, http: { total: 50, s2xx: 50, s4xx: 0, s5xx: 0, lambat: 0, p50Ms: 10, p95Ms: 45 } })
  assert.equal(ok.status, 'operational')
  assert.equal(ok.alerts.length, 0)

  const deg = evaluateServiceAlerts({ storageHealthy: false, consecutiveSaveFailures: 3, http: { total: 100, s2xx: 98, s4xx: 0, s5xx: 2, lambat: 2, p50Ms: 50, p95Ms: 1800 } })
  assert.equal(deg.status, 'degraded')
  assert.deepEqual(deg.alerts.map((a) => a.code).sort(), ['high_5xx_rate', 'high_p95_latency', 'save_failures_consecutive', 'storage_unhealthy'])

  const maint = evaluateServiceAlerts({ storageHealthy: true, consecutiveSaveFailures: 0, http: { total: 10, s2xx: 10, s4xx: 0, s5xx: 0, lambat: 0, p50Ms: 5, p95Ms: 10 }, readOnlyMode: true, signupKillSwitch: true })
  assert.equal(maint.status, 'maintenance')
}

const ownerEmail = 'rollout-owner@localhost.test'
const running = await startIsolatedServer('rollout-http', ownerEmail)
try {
  const { call } = running
  const st0 = await call('GET', '/api/status')
  assert.equal(st0.status, 200)
  assert.equal(st0.body.status, 'operational')
  assert.equal(typeof st0.body.support?.email, 'string')

  const login = async (email: string) => call('POST', '/api/auth/dev-login', undefined, { email, name: email, role: 'pasien' })
  const owner = await login(ownerEmail)
  assert.equal(owner.status, 200)
  const u1 = await login('rollout-u1@localhost.test')
  assert.equal(u1.status, 200)

  assert.equal((await call('GET', '/api/owner/rollout', u1.body.token)).status, 403)
  assert.equal((await call('POST', '/api/owner/rollout', u1.body.token, { signupKillSwitch: true })).status, 403)

  // Cap at 2 total accounts (owner + u1): 3rd new account blocked, existing u1 still logs in
  const capRes = await call('POST', '/api/owner/rollout', owner.body.token, { stage: 'stage-50', maxAccounts: 2 })
  assert.equal(capRes.status, 200)
  assert.equal(capRes.body.currentAccountCount, 2)
  const u2Blocked = await login('rollout-u2@localhost.test')
  assert.equal(u2Blocked.status, 503)
  assert.equal(u2Blocked.body.error, 'beta_capacity_reached')
  assert.equal((await login('rollout-u1@localhost.test')).status, 200)

  // Raise cap -> signup kill switch pauses new users
  await call('POST', '/api/owner/rollout', owner.body.token, { stage: 'stage-200', maxAccounts: 200, signupKillSwitch: true })
  const u2Kill = await login('rollout-u2@localhost.test')
  assert.equal(u2Kill.status, 503)
  assert.equal(u2Kill.body.error, 'signup_paused')

  // Read-only kill switch blocks writes while status turns maintenance and owner can still recover
  await call('POST', '/api/owner/rollout', owner.body.token, { readOnlyMode: true })
  assert.equal((await call('GET', '/api/status')).body.status, 'maintenance')
  const roWrite = await call('PUT', '/api/health-profile', u1.body.token, { profile: { restingHr: 60 } })
  assert.equal(roWrite.status, 503)
  assert.equal(roWrite.body.error, 'service_read_only')

  const recovered = await call('POST', '/api/owner/rollout', owner.body.token, { stage: 'stage-1000', signupKillSwitch: false, readOnlyMode: false })
  assert.equal(recovered.status, 200)
  assert.equal((await call('PUT', '/api/health-profile', u1.body.token, { profile: { restingHr: 60 } })).status, 200)

  // Persisted rollout config survives process restart
  await call('POST', '/api/owner/rollout', owner.body.token, { stage: 'stage-200', maxAccounts: 200, signupKillSwitch: true })
  await running.restart()
  const afterRestart = await running.call('GET', '/api/owner/rollout', owner.body.token)
  assert.equal(afterRestart.status, 200)
  assert.equal(afterRestart.body.stage, 'stage-200')
  assert.equal(afterRestart.body.signupKillSwitch, true)

  console.log('rolloutKillSwitchHttp: status alerts, stage caps, signup kill switch, read-only recovery passed')
} finally {
  await running.stop()
}
