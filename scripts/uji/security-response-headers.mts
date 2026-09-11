import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers?: Array<{ source?: string; headers?: Array<{ key?: string; value?: string }> }>
}

const globalRule = config.headers?.find((rule) => rule.source === '/(.*)')
assert.ok(globalRule, 'Vercel config must keep a global response-header rule.')

const headerMap = new Map((globalRule.headers ?? []).map((header) => [header.key?.toLowerCase(), header.value]))
assert.equal(headerMap.get('x-content-type-options'), 'nosniff', 'Prevent MIME-type sniffing on production responses.')
assert.equal(
  headerMap.get('referrer-policy'),
  'strict-origin-when-cross-origin',
  'Cross-origin requests must not receive full path/query referrers.',
)

// Keep this hardening deliberately narrow. CSP, Permissions-Policy, COOP/COEP and
// frame restrictions can break OAuth, media, embedded tools or cross-origin assets
// and require a separate compatibility audit before promotion.
assert.equal(headerMap.size, 2, 'Do not silently expand security headers without a compatibility-reviewed batch.')

console.log('security-response-headers: ok')
