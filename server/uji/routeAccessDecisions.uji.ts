// Alpha E2: one access decision for EVERY registered API route, enforced against the source and a real server.
// A new, removed or re-guarded route fails here until its decision is made consciously (this is the point of the table).
// Categories:
//   PUBLIC        no session needed by design
//   HANDLER_AUTH  no requireAuth, but the handler authenticates itself (session check, shared secret, signature, token)
//   SESSION       any signed-in account; data is scoped to the caller inside the handler (covered by the per-area HTTP tests)
//   CLINICIAN     verified clinician only (patients and unverified doctors are refused)
//   OWNER         the configured owner only (patients and every doctor are refused)
//   DATA_GATED    clinician-only, but the role is enforced after the target record is resolved, so an empty request answers 400/404 first;
//                 refusal of patients is proven with real data in rbacKlinis.uji.ts (encounter close) and patientIdentityContinuity.uji.ts (link codes)
// Real application over HTTP in isolated file mode; synthetic fixtures; doctor verification is a workflow fixture.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serverRoot, startIsolatedServer } from './support/isolatedServer.ts'

const PUBLIC: readonly string[] = [
  'GET /api/anatomy/drug',
  'GET /api/anatomy/images',
  'GET /api/anatomy/ontology',
  'GET /api/anatomy/structure',
  'GET /api/clubs',
  'GET /api/drug/ingredients',
  'GET /api/drug/pharmacology',
  'GET /api/facility-prices',
  'GET /api/health',
  'GET /api/health-metrics/catalog',
  'GET /api/icd/search',
  'GET /api/lingkungan',
  'GET /api/markets/instruments',
  'GET /api/markets/news',
  'GET /api/markets/quote',
  'GET /api/markets/search',
  'GET /api/markets/watchlist',
  'GET /api/meets',
  'GET /api/news',
  'GET /api/pangan',
  'GET /api/posts',
  'GET /api/push/key',
  'GET /api/sports/f1',
  'GET /api/sports/leagues',
  'GET /api/sports/motogp',
  'GET /api/sports/scores',
  'GET /api/translate/languages',
  'POST /api/auth/dev-login',
  'POST /api/auth/google',
  'POST /api/auth/otp/email/start',
  'POST /api/auth/otp/email/verify',
  'POST /api/client-errors',
  'POST /api/posts/:id/like',
]

const HANDLER_AUTH: readonly string[] = [
  'GET /api/auth/me',
  'GET /api/cron/daily-briefing',
  'GET /api/payments/status/:orderId',
  'POST /api/auth/logout',
  'POST /api/health-webhook/:token',
  'POST /api/payments/webhook',
]

const SESSION: readonly string[] = [
  'DELETE /api/clinical/link/:patientId',
  'DELETE /api/clubs/:id',
  'DELETE /api/health-series',
  'DELETE /api/lab-log/shares/:id',
  'DELETE /api/meets/:id',
  'DELETE /api/posts/:id',
  'DELETE /api/reminders/:id',
  'GET /api/care/plans',
  'GET /api/clinical',
  'GET /api/clinical-calculators/access',
  'GET /api/clinical/encounters/:patientId',
  'GET /api/clinical/links',
  'GET /api/clinical/record-history/:patientId',
  'GET /api/clinical/records/:patientId',
  'GET /api/connect/dek',
  'GET /api/connect/profil/:email',
  'GET /api/connect/saya',
  'GET /api/creator/subs',
  'GET /api/drugs/label',
  'GET /api/drugs/related',
  'GET /api/evidence/pubmed',
  'GET /api/genes/info',
  'GET /api/health-alerts/context',
  'GET /api/health-profile',
  'GET /api/health-profile/webhook-token',
  'GET /api/health-series/heart-rate',
  'GET /api/health-series/sleep',
  'GET /api/health-sync/diagnosis',
  'GET /api/hr-notifications',
  'GET /api/keadaan-longitudinal',
  'GET /api/lab-log',
  'GET /api/lab-log/fhir',
  'GET /api/lab-log/shares',
  'GET /api/notifications',
  'GET /api/promo',
  'GET /api/push/status',
  'GET /api/reminders',
  'GET /api/satusehat/status',
  'GET /api/second-opinion',
  'GET /api/settings',
  'GET /api/sports/favorites',
  'GET /api/trials',
  'GET /api/users/search',
  'GET /api/wallet',
  'GET /api/workouts',
  'PATCH /api/posts/:id',
  'PATCH /api/reminders/:id',
  'POST /api/ai/consult',
  'POST /api/ai/messages',
  'POST /api/ai/vision',
  'POST /api/applications',
  'POST /api/care/reports',
  'POST /api/clinical-calculators/unlock-pnc',
  'POST /api/clinical/education',
  'POST /api/clinical/link',
  'POST /api/clinical/patient',
  'POST /api/clinical/record',
  'POST /api/clinical/supportive',
  'POST /api/clinical/vital',
  'POST /api/clubs',
  'POST /api/clubs/:id/join',
  'POST /api/connect/blokir',
  'POST /api/connect/lapor',
  'POST /api/connect/radius',
  'POST /api/connect/tarik-persetujuan',
  'POST /api/connect/verifikasi',
  'POST /api/creator/subscribe',
  'POST /api/facility-prices',
  'POST /api/feedback',
  'POST /api/health-profile/webhook-token/rotate',
  'POST /api/lab-log/shares',
  'POST /api/meets',
  'POST /api/meets/:id/rsvp',
  'POST /api/notifications/read',
  'POST /api/payments/confirm',
  'POST /api/payments/create',
  'POST /api/posts',
  'POST /api/posts/:id/react',
  'POST /api/push/subscribe',
  'POST /api/push/test',
  'POST /api/push/unsubscribe',
  'POST /api/reminders',
  'POST /api/second-opinion',
  'POST /api/translate',
  'POST /api/wallet/topup-request',
  'POST /api/wallet/withdraw',
  'PUT /api/health-profile',
  'PUT /api/health-series/diary',
  'PUT /api/health-series/self-vitals',
  'PUT /api/health-series/vo2max',
  'PUT /api/lab-log',
  'PUT /api/ringkasan',
  'PUT /api/settings',
  'PUT /api/sports/favorites',
]

const CLINICIAN: readonly string[] = [
  'GET /api/clinical/patient/:patientId/link-status',
  'GET /api/clinician/follow-ups',
  'GET /api/clinician/lab-shares',
  'GET /api/clinician/lab-shares/:id/care',
  'GET /api/clinician/lab-shares/:id/care/fhir',
  'GET /api/clinician/lab-shares/:id/fhir',
  'GET /api/validation/:id/cases',
  'GET /api/validation/:id/disagreements',
  'GET /api/validation/studies',
  'POST /api/clinician/care-plans/:planId/follow-ups',
  'POST /api/clinician/lab-shares/:id/care-plan',
  'POST /api/clinician/lab-shares/:id/review',
  'POST /api/satusehat/encounter',
  'POST /api/second-opinion/:id/complete',
  'POST /api/validation/:id/assessments',
  'POST /api/validation/:id/usability',
  'POST /api/validation/adjudications',
  'POST /api/validation/safety-events',
]

const OWNER: readonly string[] = [
  'GET /api/applications',
  'GET /api/audit',
  'GET /api/connect/tinjau',
  'GET /api/doctors',
  'GET /api/feedback',
  'GET /api/owner/client-errors',
  'GET /api/owner/users',
  'GET /api/stats',
  'GET /api/validation/ledger',
  'GET /api/wallet/topups',
  'POST /api/ai/operator',
  'POST /api/applications/decide',
  'POST /api/connect/tinjau/kredit',
  'POST /api/connect/tinjau/laporan',
  'POST /api/connect/tinjau/verifikasi',
  'POST /api/doctors/:id/verify',
  'POST /api/feedback/:id/read',
  'POST /api/notify/user',
  'POST /api/push/broadcast',
  'POST /api/wallet/topups/decide',
]

const DATA_GATED: readonly string[] = [
  'POST /api/clinical/encounter/close',
  'POST /api/clinical/patient/:patientId/link-code',
]

const ownerEmail = 'route-owner@localhost.test'
const source = readFileSync(join(serverRoot, 'src/index.ts'), 'utf8')
const pattern = /^app\.(get|post|put|patch|delete)\('([^']+)'(.*)$/gm
const matches = [...source.matchAll(pattern)]
const routes = matches.map((m, i) => ({
  key: `${m[1]!.toUpperCase()} ${m[2]}`, requireAuth: m[3]!.includes('requireAuth'),
  head: source.slice(m.index!, matches[i + 1]?.index ?? source.length).split('\n').slice(0, 10).join('\n'),
}))

// 1. The table and the source agree exactly: every route has exactly one decision.
const decisions = new Map<string, string>()
for (const [category, list] of Object.entries({ PUBLIC, HANDLER_AUTH, SESSION, CLINICIAN, DATA_GATED, OWNER })) {
  for (const key of list) { assert.ok(!decisions.has(key), `${key} has two decisions`); decisions.set(key, category) }
}
assert.deepEqual(routes.map(r => r.key).sort(), [...decisions.keys()].sort(), 'every registered route needs exactly one access decision (add, remove or re-classify it in the table)')
assert.equal(new Set(routes.map(r => r.key)).size, routes.length, 'a route is registered twice')

// 2. The registration matches the decision: only PUBLIC and HANDLER_AUTH routes may skip requireAuth; OWNER routes check the owner up front.
for (const route of routes) {
  const category = decisions.get(route.key)!
  if (category === 'PUBLIC' || category === 'HANDLER_AUTH') assert.equal(route.requireAuth, false, `${route.key} is ${category} but registers requireAuth`)
  else assert.equal(route.requireAuth, true, `${route.key} is ${category} and must register requireAuth`)
  if (category === 'OWNER') assert.match(route.head, /isOwner\(\w+\)/, `${route.key} is OWNER-only and must check the owner at the top of its handler`)
}

const running = await startIsolatedServer('route-decisions', ownerEmail)
try {
  const { call } = running
  const login = async (email: string, role: string) => {
    const r = await call('POST', '/api/auth/dev-login', undefined, { email, role, name: email })
    assert.equal(r.status, 200)
    return r.body as { token: string; user: { id: string } }
  }
  const owner = await login(ownerEmail, 'pasien')
  const doctor = await login('route-doctor@localhost.test', 'dokter')
  const unverified = await login('route-unverified@localhost.test', 'dokter')
  const patient = await login('route-patient@localhost.test', 'pasien')
  assert.equal((await call('POST', `/api/doctors/${doctor.user.id}/verify`, owner.token, { status: 'verified' })).status, 200)

  const concrete = (key: string) => {
    const [method, path] = key.split(' ') as [string, string]
    return { method, path: path.replace(/:[A-Za-z]+/g, 'x'), body: ['POST', 'PUT', 'PATCH'].includes(method) ? {} : undefined }
  }
  const status = async (key: string, token?: string) => { const { method, path, body } = concrete(key); return (await call(method, path, token, body)).status }

  // 3. SESSION, CLINICIAN and OWNER routes refuse an anonymous caller at runtime, not just in the source text.
  for (const key of [...SESSION, ...CLINICIAN, ...DATA_GATED, ...OWNER]) assert.equal(await status(key), 401, `anonymous ${key}`)

  // 4. OWNER routes refuse every non-owner account: a patient, an unverified doctor and even a verified doctor.
  for (const key of OWNER) {
    for (const [who, account] of [['patient', patient], ['unverified doctor', unverified], ['verified doctor', doctor]] as const) {
      assert.equal(await status(key, account.token), 403, `${who} ${key}`)
    }
  }

  // 5. CLINICIAN routes refuse patients and unverified doctors; a verified doctor passes the role gate (any other outcome, e.g. 400/404 for the empty body).
  for (const key of CLINICIAN) {
    for (const [who, account] of [['patient', patient], ['unverified doctor', unverified]] as const) {
      assert.equal(await status(key, account.token), 403, `${who} ${key}`)
    }
    const passed = await status(key, doctor.token)
    assert.ok(passed !== 401 && passed !== 403, `verified doctor must pass the role gate of ${key} (got ${passed})`)
  }

  // 6. HANDLER_AUTH routes that can be probed anonymously refuse without credentials.
  assert.equal(await status('GET /api/auth/me'), 401)
  assert.equal(await status('GET /api/payments/status/:orderId'), 401)
  assert.equal(await status('GET /api/cron/daily-briefing'), 403, 'the cron route refuses a caller without the shared secret')
  assert.equal(await status('POST /api/health-webhook/:token'), 404, 'the webhook refuses an unknown token')
  assert.ok([400, 401, 403].includes(await status('POST /api/payments/webhook')), 'the payment webhook refuses an unsigned notification')

  console.log(`routeAccessDecisions: ${routes.length} registered routes each have one access decision (public ${PUBLIC.length}, handler-auth ${HANDLER_AUTH.length}, session ${SESSION.length}, clinician ${CLINICIAN.length}, data-gated ${DATA_GATED.length}, owner ${OWNER.length}); anonymous, patient, unverified and verified doctor checked against a real server; passed`)
} finally {
  await running.stop()
}
