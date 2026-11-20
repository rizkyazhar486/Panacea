import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  PRODUCTION_API_ORIGIN,
  isProductionEdgeHost,
  resolveApiOrigin,
} from '../../src/domains/identity/apiOrigin.ts'

const apiSource = readFileSync(new URL('../../src/lib/api.ts', import.meta.url), 'utf8')
const loginSource = readFileSync(new URL('../../src/pages/landing/Login.tsx', import.meta.url), 'utf8')

export function auditGoogleAuthWiring({ api, login }: { api: string; login: string }): string[] {
  const problems: string[] = []
  if (!api.includes('resolveApiOrigin(import.meta.env.VITE_API_URL')) {
    problems.push('src/lib/api.ts does not resolve production API origin via resolveApiOrigin')
  }
  if (!api.includes('gisPromise = null')) {
    problems.push('src/lib/api.ts does not clear failed GIS script promise on error')
  }
  if (!api.includes("el.innerHTML = ''")) {
    problems.push('src/lib/api.ts does not clear Google button container before re-rendering')
  }
  if (!login.includes('data-testid="google-signin-slot"')) {
    problems.push('Login.tsx missing real Google Identity Services slot')
  }
  if (!login.includes('data-testid="google-signin-retry"')) {
    problems.push('Login.tsx missing cold-start retry control for real Google Sign-In')
  }
  if (!login.includes('renderGoogleButton(') || !login.includes('api.googleLogin(')) {
    problems.push('Login.tsx disconnected from server-verified Google OAuth')
  }
  return problems
}

// ── 1. POSITIVE: production Cloudflare edge hosts default to live Render API when VITE_API_URL is unset.
for (const host of ['panaceamed.id', 'www.panaceamed.id', 'app.panaceamed.id', 'PANACEAMED.ID.', 'panacea.rizky.workers.dev']) {
  assert.equal(isProductionEdgeHost(host), true, `expected production edge host: ${host}`)
  assert.equal(resolveApiOrigin(undefined, host), PRODUCTION_API_ORIGIN)
  assert.equal(resolveApiOrigin('', host), PRODUCTION_API_ORIGIN)
}

// ── 2. BOUNDARY: explicit VITE_API_URL ALWAYS takes precedence (strips trailing slashes).
assert.equal(resolveApiOrigin('http://127.0.0.1:18790/', 'panaceamed.id'), 'http://127.0.0.1:18790')
assert.equal(resolveApiOrigin('  https://staging.panaceamed.id/// ', 'localhost'), 'https://staging.panaceamed.id')
assert.equal(resolveApiOrigin('   ', 'panaceamed.id'), PRODUCTION_API_ORIGIN)

// ── 3. NEGATIVE (PAIRED): localhost, unknown, empty, and suffix-spoofed hosts fail closed to ''.
for (const badHost of ['', '   ', 'localhost', '127.0.0.1', 'example.com', 'evil-panaceamed.id', '.panaceamed.id', '.workers.dev', 'notpanaceamed.id']) {
  assert.equal(isProductionEdgeHost(badHost), false, `spoofed/non-prod host accepted: ${badHost}`)
  assert.equal(resolveApiOrigin(undefined, badHost), '', `must fail closed for host: ${badHost}`)
}

// ── 4. REAL SOURCE AUDIT & SABOTAGED GATE VERIFICATION.
assert.deepEqual(auditGoogleAuthWiring({ api: apiSource, login: loginSource }), [])
{
  const brokenApi = apiSource.replace('resolveApiOrigin(import.meta.env.VITE_API_URL', 'String(import.meta.env.VITE_API_URL')
  assert.notEqual(brokenApi, apiSource)
  assert.ok(auditGoogleAuthWiring({ api: brokenApi, login: loginSource }).some((p) => p.includes('resolveApiOrigin')))

  const stuckGis = apiSource.replace('gisPromise = null', '// stuck')
  assert.notEqual(stuckGis, apiSource)
  assert.ok(auditGoogleAuthWiring({ api: stuckGis, login: loginSource }).some((p) => p.includes('GIS script promise')))

  const noRetry = loginSource.replace('data-testid="google-signin-retry"', 'data-testid="removed"')
  assert.notEqual(noRetry, loginSource)
  assert.ok(auditGoogleAuthWiring({ api: apiSource, login: noRetry }).some((p) => p.includes('retry control')))
}

console.log('google-auth-live-origin: production edge origin resolution, anti-spoofing, GIS recovery, and Login wiring PASS')
