import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { sanitizeProductionReport } from './production-browser-report.mjs'

const workflow = readFileSync(new URL('../../.github/workflows/production-browser-check.yml', import.meta.url), 'utf8')
const formatter = new URL('./production-browser-summary.mjs', import.meta.url)
const privateValue = ['synthetic', 'private', 'marker'].join('-')
const privateEmail = ['synthetic-owner', 'localhost.test'].join('@')
const privateUrl = `https://panaceamed.id/private?token=${privateValue}`
const report = () => sanitizeProductionReport({
  network: { dns: [privateValue], tls: { authorized: true }, http: [{ status: 200, url: privateUrl }] },
  server: { commit: 'a'.repeat(40), matchesExpected: true },
  viewports: [{ width: 390, height: 844, status: 200, overflowX: false, webgl1: true, webgl2: true,
    errors: [], failedRequests: [privateUrl], assetFailures: [], rootErrorText: '',
    body: { canvasPresent: true, loaded: true, finalUrl: privateUrl, text: privateEmail } }],
  findings: [{ severity: 'warn', msg: `server melaporkan commit ${privateValue}` }],
})
const redactedError = 'production browser summary unavailable: invalid or unreadable report\n'

function runBlock() {
  const start = workflow.indexOf('      - name: Run production check\n')
  assert.ok(start >= 0)
  const next = workflow.indexOf('\n      - name:', start + 1)
  const step = workflow.slice(start, next)
  const marker = '        run: |\n'
  assert.ok(step.includes(marker))
  return step.slice(step.indexOf(marker) + marker.length).split('\n').map(line => line.slice(10)).join('\n')
}

// Jalankan shell asli; hanya pemeriksa browser diganti agar tidak membuka peramban/jaringan.
function runWorkflow({ checkerCode = 0, contents = JSON.stringify(report()), missing = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'panacea-production-summary-'))
  try {
    mkdirSync(join(root, 'scripts/qa'), { recursive: true })
    mkdirSync(join(root, 'production-check'))
    writeFileSync(join(root, 'scripts/qa/production-browser-check.mjs'), 'process.exit(Number(process.env.SYNTHETIC_CHECKER_EXIT))\n')
    if (existsSync(formatter)) writeFileSync(join(root, 'scripts/qa/production-browser-summary.mjs'), readFileSync(formatter))
    if (!missing) writeFileSync(join(root, 'production-check/report.json'), contents)
    const summaryPath = join(root, 'summary.md')
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', runBlock()], {
      cwd: root, encoding: 'utf8', env: { ...process.env, SYNTHETIC_CHECKER_EXIT: String(checkerCode), GITHUB_STEP_SUMMARY: summaryPath },
    })
    assert.equal(result.error, undefined)
    assert.equal(result.signal, null)
    return { ...result, summary: existsSync(summaryPath) ? readFileSync(summaryPath, 'utf8') : '' }
  } finally { rmSync(root, { recursive: true, force: true }) }
}

function runCli(contents, { missing = false, directory = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'panacea-production-summary-cli-'))
  try {
    const path = join(root, `${privateValue}.json`)
    if (directory) mkdirSync(path)
    else if (!missing) writeFileSync(path, contents)
    const result = spawnSync(process.execPath, [fileURLToPath(formatter), path], { encoding: 'utf8' })
    assert.equal(result.error, undefined)
    assert.equal(result.signal, null)
    return result
  } finally { rmSync(root, { recursive: true, force: true }) }
}

function noPrivateOutput(text) {
  for (const secret of [privateValue, privateEmail, privateUrl]) assert.equal(text.includes(secret), false, 'diagnostics must omit private fixture data')
}

test('real workflow formats the actual sanitized report without the obsolete errors array', () => {
  const result = runWorkflow()
  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
  assert.equal(result.stdout, '')
  assert.ok(result.summary.startsWith('exit=0\n```json\n'))
  assert.ok(result.summary.endsWith('\n```\n'))
  const summary = JSON.parse(result.summary.split('```json\n')[1].split('\n```')[0])
  assert.equal(summary.viewports[0].errorsCount, 0)
  assert.equal(summary.viewports[0].bodyCanvasPresent, true)
  assert.equal(summary.viewports[0].bodyLoaded, true)
  noPrivateOutput(result.summary)
})

test('real workflow refuses a missing report even when the checker exits zero', () => {
  const result = runWorkflow({ missing: true })
  assert.equal(result.status, 1)
  assert.equal(result.stderr, redactedError)
  assert.equal(result.stdout, '')
  noPrivateOutput(result.summary + result.stderr)
})

test('real workflow refuses malformed report JSON without echoing its contents', () => {
  const result = runWorkflow({ contents: `{${privateValue}` })
  assert.equal(result.status, 1)
  assert.equal(result.stderr, redactedError)
  assert.equal(result.stdout, '')
  noPrivateOutput(result.summary + result.stderr)
})

test('real workflow preserves original nonzero checker status with valid, missing or malformed summaries', () => {
  for (const checkerCode of [1, 2, 7]) {
    for (const options of [{}, { missing: true }, { contents: `{${privateValue}` }]) {
      const result = runWorkflow({ checkerCode, ...options })
      assert.equal(result.status, checkerCode)
      assert.ok(result.summary.startsWith(`exit=${checkerCode}\n`))
      assert.equal(result.stderr, Object.keys(options).length ? redactedError : '')
      noPrivateOutput(result.stdout + result.stderr + result.summary)
    }
  }
})

test('summary CLI preserves known counts and legitimate nulls from the real sanitizer', () => {
  const result = runCli(JSON.stringify(report()))
  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
  assert.deepEqual(JSON.parse(result.stdout), {
    network: { dnsAddressCount: 1, tls: { authorized: true }, httpStatuses: [200], failed: null },
    server: { commit: 'a'.repeat(40), matchesExpected: true },
    findings: [{ severity: 'warn', category: 'server_sha_mismatch' }],
    viewports: [{ width: 390, height: 844, status: 200, overflowX: false, webgl2: true,
      errorsCount: 0, bodyCanvasPresent: true, bodyLoaded: true }],
  })
  const nullable = runCli(JSON.stringify(sanitizeProductionReport({ viewports: [{}] })))
  assert.equal(nullable.status, 0)
  assert.equal(nullable.stderr, '')
  assert.deepEqual(JSON.parse(nullable.stdout), {
    network: { dnsAddressCount: null, tls: null, httpStatuses: [], failed: null },
    server: null, findings: [],
    viewports: [{ width: null, height: null, status: null, overflowX: false, webgl2: false,
      errorsCount: null, bodyCanvasPresent: false, bodyLoaded: false }],
  })
  const unavailable = runCli(JSON.stringify(sanitizeProductionReport({
    network: { failed: { stage: 'tls', error: privateUrl } }, server: { commit: null, matchesExpected: false },
  })))
  assert.equal(unavailable.status, 0)
  assert.equal(unavailable.stderr, '')
  assert.deepEqual(JSON.parse(unavailable.stdout), {
    network: { dnsAddressCount: null, tls: null, httpStatuses: [], failed: { stage: 'tls' } },
    server: { commit: null, matchesExpected: false }, findings: [], viewports: [],
  })
  noPrivateOutput(unavailable.stdout)
})

test('summary CLI projects only sanitized allowlisted fields, including when unknown raw fields are present', () => {
  const value = report()
  value.raw = privateEmail
  value.network.error = privateValue
  value.server.headers = { authorization: privateValue }
  value.viewports[0].errors = [privateValue]
  value.viewports[0].body = { finalUrl: privateUrl, text: privateEmail }
  value.findings[0].msg = privateValue
  const result = runCli(JSON.stringify(value))
  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
  noPrivateOutput(result.stdout)
  assert.deepEqual(JSON.parse(result.stdout), JSON.parse(runCli(JSON.stringify(report())).stdout))
})

test('summary CLI rejects missing, malformed and unreadable reports with fixed diagnostics', () => {
  for (const result of [runCli('', { missing: true }), runCli('', { directory: true }), runCli(`{${privateValue}`)]) {
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.equal(result.stderr, redactedError)
    noPrivateOutput(result.stderr)
  }
})

test('summary CLI refuses malformed sanitized fields instead of printing private values', () => {
  const invalid = [null, [], {}, { ...report(), network: null }, { ...report(), server: [] },
    { ...report(), viewports: null }, { ...report(), findings: null }]
  for (const field of ['width', 'height', 'errorsCount']) {
    for (const bad of [-1, 0.5, privateValue]) {
      const value = report(); value.viewports[0][field] = bad; invalid.push(value)
    }
  }
  for (const [group, field, bad] of [
    ['network', 'dnsAddressCount', privateValue], ['network', 'tls', { authorized: privateValue }],
    ['network', 'httpStatuses', [privateValue]], ['network', 'failed', { stage: privateValue }],
    ['server', 'commit', privateValue], ['server', 'matchesExpected', privateValue],
    ['viewport', 'status', 600], ['viewport', 'overflowX', privateValue], ['viewport', 'webgl2', privateValue],
    ['viewport', 'bodyCanvasPresent', privateValue], ['viewport', 'bodyLoaded', privateValue],
    ['finding', 'severity', privateValue], ['finding', 'category', privateValue],
  ]) {
    const value = report()
    const target = group === 'viewport' ? value.viewports[0] : group === 'finding' ? value.findings[0] : value[group]
    target[field] = bad; invalid.push(value)
  }
  for (const value of invalid) {
    const result = runCli(JSON.stringify(value))
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.equal(result.stderr, redactedError)
    noPrivateOutput(result.stderr)
  }
})

test('workflow path filter includes the summary implementation and regression suite', () => {
  assert.ok(workflow.includes("'scripts/qa/production-browser-summary*'"))
})
