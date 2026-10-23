// The health webhook is unauthenticated: the opaque token in the path IS the credential.
// Only a token the server issued may be accepted, never a property of the token table object (constructor, __proto__, ...).
// Real application over HTTP in isolated file mode; synthetic fixtures.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startIsolatedServer } from './support/isolatedServer.ts'

const running = await startIsolatedServer('webhook-token', 'webhook-owner@localhost.test')
try {
  const { call, dataFile } = running
  const login = async (email: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role: 'pasien', name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const alice = await login('webhook-alice@localhost.test')
  const bob = await login('webhook-bob@localhost.test')
  const tokenOf = async (u: { token: string }) => (await call('GET', '/api/health-profile/webhook-token', u.token)).body.token as string
  const aliceToken = await tokenOf(alice), bobToken = await tokenOf(bob)
  assert.match(aliceToken, /^[0-9a-f]{48}$/); assert.notEqual(aliceToken, bobToken)
  assert.equal(await tokenOf(alice), aliceToken, 'the token is stable until rotated')

  const payload = {
    data: {
      metrics: [{ name: 'heart_rate', units: 'count/min', data: [{ Avg: 61, Min: 60, Max: 62, date: '2026-10-11 08:00:00 +0000' }] }],
      workouts: [{ name: 'Running', start: '2026-10-11 07:00:00 +0000', end: '2026-10-11 07:30:00 +0000', duration: 1800 }],
    },
  }
  const post = (token: string) => call('POST', `/api/health-webhook/${encodeURIComponent(token)}`, undefined, payload)

  // 1. Only issued tokens work. Names that exist on every plain object must behave exactly like any unknown token:
  // 404, no internal error text, and nothing written under a non-user key.
  const unknown = ['no-such-token', 'constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 'isPrototypeOf', '__defineGetter__', 'a'.repeat(48), aliceToken.toUpperCase(), aliceToken.slice(0, 47)]
  for (const token of unknown) {
    const r = await post(token)
    assert.equal(r.status, 404, `token "${token.slice(0, 20)}" must be unknown`)
    assert.deepEqual(r.body, { error: 'unknown_token' }, `token "${token.slice(0, 20)}" must not leak an internal error`)
  }
  const keysOf = (db: any, table: string) => Object.keys(db[table] ?? {})
  const db = JSON.parse(readFileSync(dataFile, 'utf8'))
  for (const table of ['hrSeries', 'deviceWorkouts', 'sleepSeries', 'hrNotifications', 'webhookDeliveries']) {
    assert.deepEqual(keysOf(db, table).filter((k: string) => !k.includes('@')), [], `${table}: nothing may be stored under a non-user key`)
  }
  assert.deepEqual(Object.keys(db.healthWebhookTokens).sort(), [aliceToken, bobToken].sort(), 'the token table holds exactly the two issued tokens')

  // 2. A real token writes only to its own account.
  const ok = await post(aliceToken)
  assert.equal(ok.status, 200)
  const aliceSamples = (await call('GET', '/api/health-series/heart-rate?since=1', alice.token)).body.samples as any[]
  const bobSamples = (await call('GET', '/api/health-series/heart-rate?since=1', bob.token)).body.samples as any[]
  assert.equal(aliceSamples.length, 1); assert.deepEqual(bobSamples, [], "alice's token never writes into bob's series")
  assert.equal((await call('GET', '/api/workouts', alice.token)).body.count, 1); assert.equal((await call('GET', '/api/workouts', bob.token)).body.count, 0)

  // 3. Rotation invalidates the old token at once and does not touch anyone else's.
  const rotated = (await call('POST', '/api/health-profile/webhook-token/rotate', alice.token)).body.token as string
  assert.notEqual(rotated, aliceToken); assert.match(rotated, /^[0-9a-f]{48}$/)
  assert.equal((await post(aliceToken)).status, 404, 'the rotated-out token no longer works')
  assert.equal((await post(rotated)).status, 200)
  assert.equal(await tokenOf(bob), bobToken, "alice's rotation does not change bob's token")
  assert.equal((await post(bobToken)).status, 200)
  assert.equal((await call('GET', '/api/health-series/heart-rate?since=1', bob.token)).body.samples.length, 1, 'bob token writes to bob')

  // 4. The token is a secret: it is not exposed by the profile, settings or diagnosis views, nor to another account.
  for (const [path, token] of [['/api/health-profile', alice.token], ['/api/settings', alice.token], ['/api/health-sync/diagnosis', alice.token], ['/api/health-profile', bob.token]] as const) {
    const body = JSON.stringify((await call('GET', path, token)).body)
    for (const secret of [aliceToken, rotated, bobToken]) assert.ok(!body.includes(secret), `${path} must not contain a webhook token`)
  }
  assert.equal((await call('GET', '/api/health-profile/webhook-token')).status, 401, 'reading a token needs a session')
  assert.equal((await call('POST', '/api/health-profile/webhook-token/rotate')).status, 401, 'rotating a token needs a session')

  console.log('healthWebhookTokenHttp: only issued tokens accepted (prototype names rejected, no pollution or error leak), per-account writes, rotation, token secrecy; passed')
} finally {
  await running.stop()
}
