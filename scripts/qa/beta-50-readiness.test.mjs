import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FUNNEL_STEPS,
  buildFounderDemoAccount,
  buildIsolatedBetaAccount,
  computeFirstRunMissionState,
  deriveBetaProfileKey,
  extractProfileKeyFromAccount,
  FOUNDER_EMAIL,
  FOUNDER_MRN,
  FOUNDER_NAME,
  FOUNDER_PROFILE_KEY,
  formatDisplayNameForAccount,
  formatMrnForAccount,
  isBetaAccount,
  isBetaProfileKey,
  validateBetaFeedbackInput,
  validateBetaFunnelEvent,
} from '../../src/domains/beta/index.ts'
import { signSessionToken, verifySessionToken } from '../../functions/api/v1/_edgeGuard.ts'
import worker from '../../worker/index.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

test('beta onboarding creates distinct isolated profile_keys for strangers while preserving Founder identity', () => {
  const keyA = deriveBetaProfileKey({ name: 'Alya Tester', role: 'patient', nonceHex: 'a1b2c3' })
  const keyB = deriveBetaProfileKey({ name: 'Alya Tester', role: 'patient', nonceHex: 'd4e5f6' })
  assert.equal(isBetaProfileKey(keyA), true)
  assert.equal(isBetaProfileKey(keyB), true)
  assert.notEqual(keyA, keyB)
  assert.notEqual(keyA, FOUNDER_PROFILE_KEY)

  assert.equal(
    deriveBetaProfileKey({ name: 'Founder', email: FOUNDER_EMAIL, nonceHex: '111111' }),
    FOUNDER_PROFILE_KEY,
  )

  const accRes = buildIsolatedBetaAccount({
    name: 'dr. Budi Beta',
    role: 'doctor',
    pin6: '123456',
    inviteCode: 'JKT-01',
    nonceHex: '9988aa',
    nowIso: '2026-11-20T04:00:00.000Z',
  })
  assert.equal(accRes.ok, true)
  if (accRes.ok) {
    assert.equal(accRes.account.role, 'dokter')
    assert.equal(accRes.account.isOwner, false)
    assert.equal(isBetaAccount(accRes.account), true)
    assert.equal(extractProfileKeyFromAccount(accRes.account), accRes.profileKey)
    assert.equal(formatDisplayNameForAccount(accRes.account), 'dr. Budi Beta')
    assert.match(formatMrnForAccount(accRes.account, null), /^PMD-B-/)
  }

  // Fail-closed checks
  assert.equal(
    buildIsolatedBetaAccount({ name: 'A', role: 'patient', nonceHex: '112233', nowIso: '2026-11-20T04:00:00.000Z' }).ok,
    false,
  )
  assert.equal(
    buildIsolatedBetaAccount({ name: 'Valid Name', role: 'patient', pin6: '12ab', nonceHex: '112233', nowIso: '2026-11-20T04:00:00.000Z' }).ok,
    false,
  )
  assert.equal(
    buildIsolatedBetaAccount({ name: 'Intruder', email: FOUNDER_EMAIL, role: 'doctor', nonceHex: '112233', nowIso: '2026-11-20T04:00:00.000Z' }).ok,
    false,
  )

  const founder = buildFounderDemoAccount('2026-11-20T04:00:00.000Z')
  assert.equal(founder.isOwner, true)
  assert.equal(extractProfileKeyFromAccount(founder), FOUNDER_PROFILE_KEY)
  assert.equal(formatDisplayNameForAccount(founder), FOUNDER_NAME)
  assert.equal(formatMrnForAccount(founder, null), FOUNDER_MRN)
})

test('HMAC-SHA256 stateless session token signs, verifies, and rejects tampering/expiry', async () => {
  const secret = 'test-session-secret-50-beta-001'
  const nowMs = Date.parse('2026-11-20T04:00:00.000Z')
  const token = await signSessionToken(
    {
      profileKey: 'beta_alya_a1b2c3',
      role: 'patient',
      iatMs: nowMs,
      expMs: nowMs + 60_000,
    },
    secret,
  )

  const ok = await verifySessionToken(token, secret, nowMs + 1_000)
  assert.equal(ok.ok, true)
  if (ok.ok) {
    assert.equal(ok.profileKey, 'beta_alya_a1b2c3')
    assert.equal(ok.role, 'patient')
  }

  const wrongSecret = await verifySessionToken(token, 'wrong-secret', nowMs + 1_000)
  assert.equal(wrongSecret.ok, false)

  const parts = token.split('.')
  const tampered = `${parts[0]}.${parts[1].slice(0, -2)}xx.${parts[2]}`
  assert.equal((await verifySessionToken(tampered, secret, nowMs + 1_000)).ok, false)

  const expired = await verifySessionToken(token, secret, nowMs + 120_000)
  assert.equal(expired.ok, false)
})

test('Cloudflare Worker worker/index.ts routes /api/v1/* handlers, enforces session scope, and delegates assets', async () => {
  const secret = 'worker-edge-test-secret-50'
  const env = {
    PANACEA_SESSION_SECRET: secret,
    ASSETS: {
      async fetch(req) {
        return new Response(`SPA_ASSET:${new URL(req.url).pathname}`, { status: 200 })
      },
    },
  }

  // Health
  const healthRes = await worker.fetch(
    new Request('https://panaceamed.id/api/v1/health', { headers: { Origin: 'https://panaceamed.id' } }),
    env,
  )
  assert.equal(healthRes.status, 200)
  assert.equal(healthRes.headers.get('access-control-allow-origin'), 'https://panaceamed.id')
  const healthBody = await healthRes.json()
  assert.equal(healthBody.ok, true)
  assert.equal(healthBody.neonConfigured, false)
  assert.equal(healthBody.sessionSecretConfigured, true)

  // Session creation + founder hijack guard
  const hijackRes = await worker.fetch(
    new Request('https://panaceamed.id/api/v1/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileKey: 'rizkyazhar486', name: 'Stranger', role: 'doctor', mode: 'beta_pass' }),
    }),
    env,
  )
  assert.equal(hijackRes.status, 403)

  const sessionRes = await worker.fetch(
    new Request('https://panaceamed.id/api/v1/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileKey: 'beta_alya_a1b2c3', name: 'Alya Beta', role: 'patient', mode: 'beta_pass' }),
    }),
    env,
  )
  assert.equal(sessionRes.status, 202)
  const sessJson = await sessionRes.json()
  assert.equal(sessJson.authMode, 'hmac_verified')
  assert.ok(sessJson.token.split('.').length === 3)

  // Sync rejects unauthenticated & cross-profile writes, allows matching token
  const noAuthSync = await worker.fetch(
    new Request('https://panaceamed.id/api/v1/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileKey: 'beta_alya_a1b2c3',
        events: [{ eventId: 'e1', entityType: 'vitals', idempotencyKey: 'k1', payloadJson: {} }],
      }),
    }),
    env,
  )
  assert.equal(noAuthSync.status, 401)

  const crossProfileSync = await worker.fetch(
    new Request('https://panaceamed.id/api/v1/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessJson.token}` },
      body: JSON.stringify({
        profileKey: 'beta_other_999999',
        events: [{ eventId: 'e1', entityType: 'vitals', idempotencyKey: 'k1', payloadJson: {} }],
      }),
    }),
    env,
  )
  assert.equal(crossProfileSync.status, 403)

  const validSync = await worker.fetch(
    new Request('https://panaceamed.id/api/v1/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessJson.token}` },
      body: JSON.stringify({
        profileKey: 'beta_alya_a1b2c3',
        events: [{ eventId: 'e1', entityType: 'vitals', idempotencyKey: 'k1', payloadJson: {} }],
      }),
    }),
    env,
  )
  assert.equal(validSync.status, 202)

  // Feedback validation + happy path
  const badFeedback = await worker.fetch(
    new Request('https://panaceamed.id/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessJson.token}` },
      body: JSON.stringify({ profileKey: 'beta_alya_a1b2c3', rating1To5: 9, category: 'love', note: 'Great' }),
    }),
    env,
  )
  assert.equal(badFeedback.status, 400)

  const okFeedback = await worker.fetch(
    new Request('https://panaceamed.id/api/v1/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessJson.token}` },
      body: JSON.stringify({
        feedbackId: 'FB-test-1',
        profileKey: 'beta_alya_a1b2c3',
        routeHash: '#/profile',
        rating1To5: 5,
        category: 'love',
        note: 'Super crisp on mobile Safari.',
      }),
    }),
    env,
  )
  assert.equal(okFeedback.status, 202)

  // Unknown API vs static asset fallback
  const unknownApi = await worker.fetch(new Request('https://panaceamed.id/api/v1/does-not-exist'), env)
  assert.equal(unknownApi.status, 404)

  const assetRes = await worker.fetch(new Request('https://panaceamed.id/scan'), env)
  assert.equal(assetRes.status, 200)
  assert.equal(await assetRes.text(), 'SPA_ASSET:/scan')
})

test('feedback, funnel validators, and 3-step mission state behave deterministically', () => {
  assert.equal(BETA_FEEDBACK_CATEGORIES.includes('bug'), true)
  assert.equal(BETA_FUNNEL_STEPS.includes('completed_export'), true)
  assert.equal(
    validateBetaFeedbackInput({
      feedbackId: 'FB-1',
      profileKey: 'beta_x_1',
      routeHash: '#/sync',
      rating1To5: 0,
      category: 'bug',
      note: 'Broken',
      nowIso: '2026-11-20T04:00:00.000Z',
    }).ok,
    false,
  )
  assert.equal(
    validateBetaFunnelEvent({
      eventId: 'EV-1',
      profileKey: 'beta_x_1',
      stepName: 'completed_export',
      nowIso: '2026-11-20T04:00:00.000Z',
    }).ok,
    true,
  )

  const m1 = computeFirstRunMissionState(['profile'], false)
  assert.equal(m1.visible, true)
  assert.equal(m1.completedCount, 1)
  const mDone = computeFirstRunMissionState(['profile', 'body_or_scan', 'sync_or_export'], false)
  assert.equal(mDone.visible, false)
  assert.equal(mDone.completedCount, 3)
  const mDismissed = computeFirstRunMissionState([], true)
  assert.equal(mDismissed.visible, false)
})

test('sql/003, wrangler.toml Worker config, beta-cohort-report --dry-run, and domain purity pass', () => {
  const sql003 = readFileSync(join(ROOT, 'sql/003_panaceamed_beta_50.sql'), 'utf8')
  assert.match(sql003, /CREATE TABLE IF NOT EXISTS panacea_beta_feedback/)
  assert.match(sql003, /CREATE TABLE IF NOT EXISTS panacea_beta_funnel_events/)
  assert.match(sql003, /ENABLE ROW LEVEL SECURITY/)

  const wrangler = readFileSync(join(ROOT, 'wrangler.toml'), 'utf8')
  assert.match(wrangler, /main = "worker\/index\.ts"/)
  assert.match(wrangler, /binding = "ASSETS"/)
  assert.match(wrangler, /not_found_handling = "single-page-application"/)
  assert.match(wrangler, /run_worker_first = \["\/api\/\*"\]/)

  const cohortOut = execFileSync(process.execPath, ['scripts/ops/beta-cohort-report.mjs', '--dry-run'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  const parsed = JSON.parse(cohortOut)
  assert.equal(parsed.targetCohortSize, 50)
  assert.equal(parsed.progressLabel, '0 / 50')

  const domainSrc = readFileSync(join(ROOT, 'src/domains/beta/betaOnboardingEngine.ts'), 'utf8')
  const codeOnly = domainSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  assert.doesNotMatch(codeOnly, /\b(window|document|localStorage|sessionStorage|Math\.random|Date\.now|fetch)\b/)
  assert.doesNotMatch(codeOnly, /new\s+Date\s*\(\s*\)/)
})
