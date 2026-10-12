// Real HTTP authorization and integrity for personal health data: settings, health profile, health series,
// webhook token management and medication reminders. Isolated file mode; synthetic fixtures.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serverRoot, startIsolatedServer } from './support/isolatedServer.ts'

const ownerEmail = 'personal-owner@localhost.test'
const running = await startIsolatedServer('personal-data', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role = 'pasien') => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string; role: string } }
  }
  const alice = await login('personal-alice@localhost.test')
  const bob = await login('personal-bob@localhost.test')
  const source = readFileSync(join(serverRoot, 'src/index.ts'), 'utf8')

  // 1. Route coverage and anonymous access.
  const decided = [
    'GET /api/settings', 'PUT /api/settings', 'GET /api/health-profile', 'PUT /api/health-profile',
    'PUT /api/health-series/self-vitals', 'PUT /api/health-series/vo2max', 'PUT /api/health-series/diary',
    'GET /api/health-series/heart-rate', 'GET /api/health-series/sleep', 'DELETE /api/health-series',
    'GET /api/health-sync/diagnosis', 'GET /api/health-alerts/context',
    'GET /api/health-profile/webhook-token', 'POST /api/health-profile/webhook-token/rotate',
    'GET /api/reminders', 'POST /api/reminders', 'PATCH /api/reminders/:id', 'DELETE /api/reminders/:id',
  ].sort()
  const registered = [...source.matchAll(/app\.(get|post|put|patch|delete)\('(\/api\/(?:settings|health-profile|health-series|health-sync|health-alerts|reminders)[^']*)'/g)].map(m => `${m[1]!.toUpperCase()} ${m[2]}`).sort()
  assert.deepEqual(registered, decided, 'every registered personal-data route needs an authorization decision')
  for (const route of decided) {
    const [method, path] = route.replace(':id', 'any').split(' ') as [string, string]
    assert.equal((await call(method, path, undefined, ['POST', 'PUT', 'PATCH'].includes(method) ? {} : undefined)).status, 401, `anonymous ${route}`)
  }

  // 2. Settings: own only; server-owned keys can never be written by a client (entitlements, verification, alert guards).
  const ownedBlock = source.length && readFileSync(join(serverRoot, 'src/store.ts'), 'utf8').match(/SERVER_OWNED_SETTING_KEYS: readonly string\[\] = \[([\s\S]*?)\n\]/)![1]!
  const owned = [...ownedBlock.matchAll(/'([A-Za-z0-9_]+)'/g)].map(m => m[1]!)
  assert.ok(owned.length >= 12 && owned.includes('strStatus') && owned.includes('chronicLifetime'), 'the server-owned key list was read from the source')
  const attempt: Record<string, unknown> = { theme: 'dark', apiKey: 'sk-should-never-be-stored', ...Object.fromEntries(owned.map(k => [k, 'client-forged'])) }
  const put = await call('PUT', '/api/settings', alice.token, { settings: attempt })
  assert.equal(put.status, 200)
  assert.deepEqual([...put.body.rejected].sort(), [...owned].sort(), 'every server-owned key is reported as rejected')
  const stored = (await call('GET', '/api/settings', alice.token)).body.settings
  assert.equal(stored.theme, 'dark', 'ordinary settings are stored')
  for (const key of [...owned, 'apiKey']) assert.equal(stored[key], undefined, `${key} was not stored`)
  assert.deepEqual((await call('GET', '/api/settings', bob.token)).body.settings, {}, "bob does not see alice's settings")
  assert.equal((await call('PUT', '/api/settings', alice.token, { settings: [1, 2] })).status, 400, 'a non-object payload is refused')
  // A self-asserted professional status has no effect on what the account may do.
  assert.equal((await call('GET', '/api/auth/me', alice.token)).body.user.role, 'pasien')
  assert.equal((await call('GET', '/api/clinician/lab-shares', alice.token)).status, 403, 'strStatus in settings does not make a patient a clinician')

  // 3. Health profile: own only, diary keys cannot be set through the generic write, bad payloads change nothing.
  assert.equal((await call('PUT', '/api/health-profile', alice.token, { profile: { weightKg: 61, diarySleep: [{ id: 'forged', date: '2026-01-01', hours: 5 }] }, email: 'personal-bob@localhost.test' })).status, 200)
  const aliceProfile = (await call('GET', '/api/health-profile', alice.token)).body.profile
  assert.equal(aliceProfile.weightKg, 61); assert.equal(aliceProfile.diarySleep, undefined, 'diary keys cannot be written through the generic profile route')
  assert.deepEqual((await call('GET', '/api/health-profile', bob.token)).body.profile, {}, "a body email cannot redirect a write to bob; bob sees nothing of alice's")
  for (const bad of [{ profile: [1] }, { profile: { blob: 'x'.repeat(70 * 1024) } }]) {
    assert.equal((await call('PUT', '/api/health-profile', alice.token, bad)).status, 400)
  }
  assert.deepEqual((await call('GET', '/api/health-profile', alice.token)).body.profile, aliceProfile, 'rejected writes leave the profile unchanged')

  // 4. Series: validation, own-only storage, and deletion that touches only the caller.
  const goodVitals = [{ id: 'a1', at: '2026-09-28T10:00:00.000Z', systolic: 120, diastolic: 80, heartRate: 72, spo2: 98, tempC: 36.8 }]
  assert.equal((await call('PUT', '/api/health-series/self-vitals', alice.token, { selfVitals: goodVitals })).status, 200)
  const vitalsBefore = (await call('GET', '/api/health-profile', alice.token)).body.profile.selfVitalsLog
  assert.equal(vitalsBefore.length, 1)
  for (const bad of [[{ ...goodVitals[0], systolic: -1 }], [{ ...goodVitals[0], at: 'nope' }], 'not-a-list']) {
    assert.equal((await call('PUT', '/api/health-series/self-vitals', alice.token, { selfVitals: bad })).status, 400)
  }
  assert.deepEqual((await call('GET', '/api/health-profile', alice.token)).body.profile.selfVitalsLog, vitalsBefore, 'a rejected series write changes nothing')
  assert.equal((await call('GET', '/api/health-profile', bob.token)).body.profile.selfVitalsLog, undefined, "bob has none of alice's vitals")
  const webhook = (token: string) => call('POST', `/api/health-webhook/${token}`, undefined, { data: { metrics: [{ name: 'heart_rate', units: 'count/min', data: [{ Avg: 61, Min: 60, Max: 62, date: '2026-10-11 08:00:00 +0000' }] }] } })
  for (const user of [alice, bob]) {
    const token = (await call('GET', '/api/health-profile/webhook-token', user.token)).body.token
    assert.equal((await webhook(token)).status, 200)
  }
  const samples = async (u: { token: string }) => (await call('GET', '/api/health-series/heart-rate?since=1', u.token)).body.samples as unknown[]
  assert.equal((await samples(alice)).length, 1); assert.equal((await samples(bob)).length, 1)
  assert.equal((await call('DELETE', '/api/health-series', alice.token)).status, 200)
  assert.equal((await samples(alice)).length, 0, 'alice series cleared'); assert.equal((await samples(bob)).length, 1, "alice's delete never touches bob's series")

  // 5. Medication reminders: validated input, a field whitelist, and strict ownership.
  const soon = new Date(Date.now() + 36e5).toISOString()
  const good = { medName: '  Synthetic drug  ', dose: ' 5 mg ', timeOfDay: '08:30', nextFireAt: soon }
  const made = await call('POST', '/api/reminders', alice.token, good)
  assert.equal(made.status, 200)
  const reminder = made.body.reminder
  assert.equal(reminder.medName, 'Synthetic drug'); assert.equal(reminder.dose, '5 mg'); assert.equal(reminder.active, true); assert.equal(reminder.nextFireAt, soon)
  const normalised = await call('POST', '/api/reminders', alice.token, { ...good, nextFireAt: new Date(Date.parse(soon)).toISOString().replace('Z', '+00:00') })
  assert.equal(normalised.body.reminder.nextFireAt, soon, 'a valid offset time is stored as a UTC instant')
  const list = async (u: { token: string }) => (await call('GET', '/api/reminders', u.token)).body.reminders as any[]
  const before = await list(alice)
  assert.equal(before.length, 2)
  for (const [label, body] of [
    ['no name', { ...good, medName: '   ' }], ['name not text', { ...good, medName: 42 }], ['name too long', { ...good, medName: 'x'.repeat(121) }],
    ['dose too long', { ...good, dose: 'x'.repeat(61) }], ['dose not text', { ...good, dose: { a: 1 } }],
    ['time not HH:MM', { ...good, timeOfDay: '8am' }], ['time out of range', { ...good, timeOfDay: '24:00' }], ['no time', { ...good, timeOfDay: undefined }],
    ['next time not a date', { ...good, nextFireAt: 'soon' }], ['next time missing', { ...good, nextFireAt: undefined }],
    ['next time a year away', { ...good, nextFireAt: new Date(Date.now() + 400 * 864e5).toISOString() }],
    ['body not an object', [good]],
  ] as const) {
    const r = await call('POST', '/api/reminders', alice.token, body)
    assert.equal(r.status, 400, label); assert.ok(typeof r.body.error === 'string' && r.body.error.length > 0, `${label}: a readable reason is returned`)
    assert.deepEqual(await list(alice), before, `${label}: a rejected reminder is not stored`)
  }
  // PATCH changes only known, validated fields; id, createdAt and unknown keys are never taken from the client.
  const patched = await call('PATCH', `/api/reminders/${reminder.id}`, alice.token, { active: false, id: 'forged-id', createdAt: '1999-01-01T00:00:00.000Z', userId: bob.user.id, extra: 'x' })
  assert.equal(patched.status, 200)
  assert.equal(patched.body.reminder.active, false); assert.equal(patched.body.reminder.id, reminder.id); assert.equal(patched.body.reminder.createdAt, reminder.createdAt)
  assert.equal('extra' in patched.body.reminder || 'userId' in patched.body.reminder, false, 'unknown keys are not stored')
  for (const [label, body] of [['only unknown keys', { foo: 1 }], ['active not boolean', { active: 'yes' }], ['bad time', { timeOfDay: '99:99' }], ['bad next time', { nextFireAt: 'x' }], ['empty body', {}], ['array body', [1]]] as const) {
    assert.equal((await call('PATCH', `/api/reminders/${reminder.id}`, alice.token, body)).status, 400, `patch: ${label}`)
  }
  // Ownership: another account cannot see, change or remove it.
  assert.deepEqual(await list(bob), [], "bob sees none of alice's reminders")
  assert.equal((await call('PATCH', `/api/reminders/${reminder.id}`, bob.token, { active: true })).status, 404, "bob cannot change alice's reminder")
  await call('DELETE', `/api/reminders/${reminder.id}`, bob.token)
  assert.equal((await list(alice)).some(r => r.id === reminder.id), true, "bob's delete does not remove alice's reminder")
  assert.equal((await list(alice)).find(r => r.id === reminder.id).active, false, 'and it is unchanged')
  assert.equal((await call('DELETE', `/api/reminders/${reminder.id}`, alice.token)).status, 200)
  assert.equal((await list(alice)).some(r => r.id === reminder.id), false, 'the owner can remove it')

  console.log('personalDataHttpRbac: 18 personal-data routes anonymous 401, server-owned settings never writable, own-only profile and series, validated and whitelisted medication reminders with strict ownership; passed')
} finally {
  await running.stop()
}
