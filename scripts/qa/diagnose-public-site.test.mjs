// scripts/ops/diagnose-public-site.mjs: the classifier that tells the owner WHY a public URL is down.
// Fixtures follow the page text Cloudflare showed on 2026-11-16 (Error 1033) and Cloudflare's published error codes.
// Pure data in, verdict out: no network, no clock.
import test from 'node:test'
import assert from 'node:assert/strict'
import { CLOUDFLARE_ERRORS, classifyResponse, cloudflareCodeFrom, describeDnsTarget, diagnose, formatReport, parseTarget } from '../ops/diagnose-public-site.mjs'

const CF = { server: 'cloudflare', 'cf-ray': '0123456789abcdef-CGK' }
const page = (code, headline) => `<!DOCTYPE html><html><head><title>${headline} | www.example.test | Cloudflare</title></head><body>
  <h1>Error ${code}</h1><p>Ray ID: 0123456789abcdef &bull; 2026-11-16 08:11:12 UTC</p><h2>${headline}</h2>
  <h2>What happened?</h2><p>You've requested a page on a website (www.example.test) that is on the Cloudflare network.</p></body></html>`
const PAGE_1033 = page(1033, 'Cloudflare Tunnel error').replace('</body>', '<p>The host (www.example.test) is configured as a Cloudflare Tunnel, and Cloudflare is currently unable to resolve it.</p></body>')
const APP_SHELL = '<!doctype html><html><head><title>Panaceamed.id — Longevity Medical-AI</title></head><body><div id="root"></div></body></html>'

test('names_the_1033_tunnel_failure_and_the_cloudflared_fix', () => {
  const r = classifyResponse({ status: 530, headers: CF, body: PAGE_1033 })
  assert.equal(r.verdict, 'cloudflare-error')
  assert.equal(r.code, '1033')
  assert.equal(r.rayId, '0123456789abcdef')
  assert.match(r.title, /Tunnel/)
  assert.ok(r.steps.some((s) => s.includes('cloudflared tunnel run')), 'the fix must name the command that restores the connector')
})

test('accepts_a_healthy_app_shell_only_with_http_200_and_the_root_element', () => {
  assert.equal(classifyResponse({ status: 200, headers: CF, body: APP_SHELL }).verdict, 'ok')
  // Paired: only the missing root element differs.
  assert.equal(classifyResponse({ status: 200, headers: CF, body: '<html><body>hello</body></html>' }).verdict, 'unknown')
  // Paired: only the status differs.
  assert.notEqual(classifyResponse({ status: 404, headers: CF, body: APP_SHELL }).verdict, 'ok')
})

test('a_200_that_carries_a_cloudflare_error_page_is_still_down', () => {
  const r = classifyResponse({ status: 200, headers: CF, body: PAGE_1033 })
  assert.equal(r.verdict, 'cloudflare-error')
  assert.equal(r.code, '1033')
})

test('needs_cloudflare_evidence_before_blaming_cloudflare', () => {
  // Same words, but neither a Cloudflare header nor the word Cloudflare anywhere in the page.
  const r = classifyResponse({ status: 200, headers: { server: 'nginx' }, body: '<h1>Error 1033</h1><p>custom page</p>' })
  assert.notEqual(r.verdict, 'cloudflare-error')
  assert.equal(r.verdict, 'unknown')
})

test('every_catalogued_cloudflare_error_has_a_title_cause_and_at_least_one_step', () => {
  for (const [code, entry] of Object.entries(CLOUDFLARE_ERRORS)) {
    assert.ok(entry.title && entry.cause, `${code}: title and cause`)
    assert.ok(Array.isArray(entry.steps) && entry.steps.length > 0 && entry.steps.every((s) => s.length > 10), `${code}: steps`)
  }
  for (const code of ['1033', '1016', '521', '522', '523', '524', '525', '526', '530']) assert.ok(CLOUDFLARE_ERRORS[code], `${code} is catalogued`)
})

test('maps_origin_errors_to_their_own_entry_and_unknown_codes_to_the_generic_one', () => {
  assert.equal(classifyResponse({ status: 521, headers: CF, body: page(521, 'Web server is down') }).title, CLOUDFLARE_ERRORS['521'].title)
  assert.equal(classifyResponse({ status: 525, headers: CF, body: page(525, 'SSL handshake failed') }).code, '525')
  const unknown = classifyResponse({ status: 530, headers: CF, body: page(1999, 'Something new') })
  assert.equal(unknown.verdict, 'cloudflare-error')
  assert.equal(unknown.code, '1999')
  assert.match(unknown.title, /halaman galat/)
})

test('http_530_without_a_readable_code_still_points_at_the_1xxx_page', () => {
  const r = classifyResponse({ status: 530, headers: CF, body: '' })
  assert.equal(r.verdict, 'cloudflare-error')
  assert.equal(r.code, '530')
  // Paired: the same 530 without any Cloudflare header is just an origin error.
  assert.equal(classifyResponse({ status: 530, headers: {}, body: '' }).verdict, 'origin-error')
})

test('separates_origin_errors_redirects_and_missing_answers', () => {
  const bad = classifyResponse({ status: 502, headers: { server: 'nginx' }, body: 'Bad gateway' })
  assert.equal(bad.verdict, 'origin-error'); assert.equal(bad.code, '502')
  const moved = classifyResponse({ status: 301, headers: { location: 'https://www.example.test/' }, body: '' })
  assert.equal(moved.verdict, 'redirect'); assert.match(moved.cause, /www\.example\.test/)
  assert.equal(classifyResponse({ status: 404, headers: {}, body: 'nope' }).verdict, 'origin-error')
  for (const status of [Number.NaN, undefined, 0, 99]) assert.equal(classifyResponse({ status, headers: {}, body: '' }).verdict, 'unreachable')
})

test('reads_headers_from_a_fetch_Headers_object_as_well_as_a_plain_object', () => {
  const headers = new Headers({ Server: 'cloudflare' })
  assert.equal(classifyResponse({ status: 530, headers, body: PAGE_1033 }).verdict, 'cloudflare-error')
  assert.equal(cloudflareCodeFrom('Error code 521'), '521')
  assert.equal(cloudflareCodeFrom('Error 1033'), '1033')
  assert.equal(cloudflareCodeFrom('Error 404'), null)
  assert.equal(cloudflareCodeFrom(''), null)
})

test('describes_where_a_visible_dns_target_leads', () => {
  assert.equal(describeDnsTarget(['4f0c.cfargotunnel.com']).kind, 'cloudflare-tunnel')
  assert.equal(describeDnsTarget(['Owner.GitHub.io.']).kind, 'github-pages')
  assert.equal(describeDnsTarget(['cname.vercel-dns.com']).kind, 'vercel')
  assert.equal(describeDnsTarget(['site.pages.dev']).kind, 'cloudflare-pages')
  assert.equal(describeDnsTarget(['api.onrender.com']).kind, 'render')
  assert.equal(describeDnsTarget(['host.example.test']).kind, 'lain')
  assert.equal(describeDnsTarget([]).kind, 'tersembunyi')
  assert.equal(describeDnsTarget(undefined).kind, 'tersembunyi')
  // Boundary: a lookalike suffix is not the real one.
  assert.equal(describeDnsTarget(['evilcfargotunnel.com']).kind, 'lain')
})

test('refuses_targets_that_are_not_plain_http_urls_before_any_request', () => {
  for (const bad of ['', '   ', 'file:///etc/passwd', 'javascript:alert(1)', 'ftp://host.test/', 'https://user:pw@host.test/', 'https://', 'https://exa mple.test', null, undefined]) {
    assert.equal(parseTarget(bad).ok, false, `must refuse ${JSON.stringify(bad)}`)
  }
  assert.equal(parseTarget('www.example.test').url, 'https://www.example.test/')
  assert.equal(parseTarget('http://localhost:4040/').hostname, 'localhost')
})

test('diagnose_refuses_without_touching_the_network_and_reports_failures_by_layer', async () => {
  let calls = 0
  const spy = async () => { calls += 1; throw new Error('must not be called') }
  const refused = await diagnose('file:///etc/passwd', { fetchImpl: spy, dns: { resolveCname: spy, resolve4: spy } })
  assert.equal(refused.ok, false); assert.equal(refused.refused, 'skema-ditolak'); assert.equal(calls, 0)
  assert.match(formatReport(refused), /Ditolak/)

  const dns = { resolveCname: async () => ['4f0c.cfargotunnel.com'], resolve4: async () => [] }
  const down = await diagnose('https://www.example.test/', { dns, fetchImpl: async () => new Response(PAGE_1033, { status: 530, headers: CF }) })
  assert.equal(down.ok, false); assert.equal(down.result.code, '1033'); assert.equal(down.dns.target.kind, 'cloudflare-tunnel')
  const text = formatReport(down)
  assert.match(text, /kode 1033/); assert.match(text, /Langkah 2/); assert.match(text, /cloudflared tunnel run/)

  const up = await diagnose('https://www.example.test/', { dns: { resolveCname: async () => [], resolve4: async () => ['203.0.113.7'] }, fetchImpl: async () => new Response(APP_SHELL, { status: 200 }) })
  assert.equal(up.ok, true)

  const offline = await diagnose('https://www.example.test/', { dns: { resolveCname: async () => { throw new Error('ENOTFOUND') }, resolve4: async () => { throw new Error('ENOTFOUND') } }, fetchImpl: async () => { throw new TypeError('fetch failed') } })
  assert.equal(offline.ok, false); assert.equal(offline.result.verdict, 'unreachable')
  assert.ok(offline.result.steps[0].includes('DNS'), 'with no DNS answer the first step is the DNS record')
})
