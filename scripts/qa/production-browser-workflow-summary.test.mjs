import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { sanitizeProductionReport } from './production-browser-report.mjs'

const workflow = readFileSync(new URL('../../.github/workflows/production-browser-check.yml', import.meta.url), 'utf8')
const step = workflow.split('      - name: Run production check\n')[1]?.split('      - name: Deployed SHA vs main (E7)\n')[0]
assert.equal(typeof step, 'string', 'production-check workflow step must exist')
const run = step.split('        run: |\n')[1]?.split('\n').map((line) => line.replace(/^          /, '')).join('\n')
assert.equal(typeof run, 'string', 'production-check workflow must retain its run block')

const privateMarker = 'SYNTHETIC_PRIVATE_MARKER'
const report = (failed) => sanitizeProductionReport({
  checkedAt: '2026-10-25T12:00:00.000Z',
  base: 'https://panaceamed.id',
  network: {
    dns: [{ address: '192.0.2.1' }],
    tls: { authorized: true },
    http: [{ status: 200, url: 'https://panaceamed.id/?token=' + privateMarker }],
  },
  server: { commit: 'a'.repeat(40), matchesExpected: !failed, api: privateMarker },
  viewports: [{
    width: 390, height: 844, status: failed ? 503 : 200,
    overflowX: failed, webgl1: true, webgl2: true,
    errors: failed ? [privateMarker] : [],
    failedRequests: failed ? [privateMarker] : [],
    assetFailures: failed ? [privateMarker] : [],
    rootErrorText: failed ? privateMarker : '',
    body: { canvasPresent: true, loaded: !failed, stats: 'loaded · 123k triangles', reviewLabel: 'Not clinically reviewed', finalUrl: privateMarker },
  }],
  findings: failed ? [{ severity: 'fail', msg: 'required asset ' + privateMarker }] : [],
})

function executeStep(exitCode, fixture) {
  const dir = mkdtempSync(path.join(tmpdir(), 'panacea-production-summary-'))
  try {
    mkdirSync(path.join(dir, 'scripts/qa'), { recursive: true })
    writeFileSync(path.join(dir, 'scripts/qa/production-browser-check.mjs'), 'process.exit(Number(process.env.SYNTHETIC_CHECKER_EXIT))\n')
    if (fixture !== undefined) {
      mkdirSync(path.join(dir, 'production-check'))
      writeFileSync(path.join(dir, 'production-check/report.json'), JSON.stringify(fixture, null, 1) + '\n')
    }
    const summaryPath = path.join(dir, 'summary.md')
    const result = spawnSync('bash', ['-c', run], {
      cwd: dir,
      encoding: 'utf8',
      timeout: 10_000,
      env: { ...process.env, GITHUB_STEP_SUMMARY: summaryPath, SYNTHETIC_CHECKER_EXIT: String(exitCode) },
    })
    assert.equal(result.error, undefined)
    return { ...result, summary: readFileSync(summaryPath, 'utf8') }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

for (const [name, exitCode, fixture] of [
  ['healthy report preserves zero counts and loaded body evidence', 0, report(false)],
  ['failed report preserves nonzero counts, HTTP status and findings', 1, report(true)],
  ['network failure preserves its named stage without viewport evidence', 2, sanitizeProductionReport({ network: { failed: { stage: 'tls', error: privateMarker } }, findings: [{ severity: 'fail', msg: 'network tls: ' + privateMarker }] })],
]) {
  test('E7 workflow summary: ' + name, () => {
    const result = executeStep(exitCode, fixture)
    assert.equal(result.status, exitCode, 'summary must preserve the original production checker exit')
    assert.equal(result.stderr, '', 'summary must consume the sanitized report without schema errors')
    assert.equal(result.stdout, '')
    assert.equal(result.summary.startsWith(`exit=${exitCode}\n`), true)
    const json = result.summary.match(/```json\n([\s\S]*?)\n```/)
    assert.notEqual(json, null, 'summary must contain JSON evidence')
    assert.deepEqual(JSON.parse(json[1]), fixture, 'summary must retain the actual sanitized evidence, including zero and unknown values')
    assert.equal(result.summary.includes(privateMarker), false, 'summary must not recover raw private diagnostics')
  })
}

test('E7 workflow summary: unavailable measurements stay null, never zero', () => {
  const fixture = sanitizeProductionReport({ viewports: [{ width: 1440, height: 900 }] })
  assert.equal(fixture.viewports[0].errorsCount, null)
  assert.equal(fixture.viewports[0].status, null)
  const result = executeStep(1, fixture)
  assert.equal(result.status, 1)
  assert.equal(result.stderr, '')
  assert.deepEqual(JSON.parse(result.summary.match(/```json\n([\s\S]*?)\n```/)[1]), fixture)
})

test('E7 workflow summary: a missing report preserves every checker exit and claims no evidence', () => {
  for (const exitCode of [0, 1, 2]) {
    const result = executeStep(exitCode)
    assert.equal(result.status, exitCode)
    assert.equal(result.stderr, '')
    assert.equal(result.summary, `exit=${exitCode}\n`)
  }
})
