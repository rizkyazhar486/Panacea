import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const workflow = readFileSync(new URL('../../.github/workflows/vercel-prebuilt-production.yml', import.meta.url), 'utf8')
const sha = '1'.repeat(40)
const url = 'https://release.example.test'

function runBlock(name) {
  const start = workflow.indexOf(`      - name: ${name}\n`)
  assert.ok(start >= 0, `missing workflow step: ${name}`)
  const next = workflow.indexOf('\n      - name:', start + 1)
  const step = workflow.slice(start, next === -1 ? undefined : next)
  const marker = '        run: |\n'
  assert.ok(step.includes(marker), `step has no literal run script: ${name}`)
  const lines = step.slice(step.indexOf(marker) + marker.length).split('\n')
  const end = lines.findIndex(line => line.trim() && !line.startsWith('          '))
  return lines.slice(0, end === -1 ? undefined : end).map(line => line.slice(10)).join('\n')
}

function run(script, env) {
  return execFileSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
    env: { ...process.env, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
}

const cases = [
  ['build failure', 'skipped', 'skipped', '', '', 'BLOCKED_RELEASE_GATES', 'BLOCKED', 'skipped'],
  ['deploy failure', 'failure', 'skipped', '', '', 'FAILED_OR_UNVERIFIED', 'FAILED'],
  ['cancelled deploy', 'cancelled', 'skipped', '', '', 'FAILED_OR_UNVERIFIED', 'FAILED'],
  ['failed smoke', 'success', 'failure', url, 'false', 'FAILED_OR_UNVERIFIED', 'UNVERIFIED'],
  ['missing URL', 'success', 'success', '', 'false', 'FAILED_OR_UNVERIFIED', 'UNVERIFIED'],
  ['quota deferral', 'success', 'skipped', '', 'true', 'DEFERRED_QUOTA', 'DEFERRED'],
  ['deployment smoke passed', 'success', 'success', url, 'false', 'DEPLOYED_SMOKE_VERIFIED', 'DEPLOYED'],
  ['failed acceptance recheck', 'skipped', 'skipped', '', '', 'BLOCKED_RELEASE_GATES', 'BLOCKED', 'failure'],
  ['cancelled acceptance recheck', 'skipped', 'skipped', '', '', 'BLOCKED_RELEASE_GATES', 'BLOCKED', 'cancelled'],
  ['unproven acceptance with reported deploy success', 'success', 'success', url, 'false', 'BLOCKED_RELEASE_GATES', 'BLOCKED', 'failure'],
]

for (const [label, deploy, smoke, deploymentUrl, deferred, status, summaryStatus, recheck = 'success'] of cases) {
  test(`actual release scripts report ${label} without false shipment`, () => {
    const root = mkdtempSync(join(tmpdir(), 'panacea-release-outcomes-'))
    try {
      const evidencePath = join(root, 'evidence.json')
      const summaryPath = join(root, 'summary.md')
      run(runBlock('Write machine-readable release evidence'), {
        DEPLOYMENT_SHA: sha, DEPLOYMENT_URL: deploymentUrl, DEPLOYMENT_DEFERRED: deferred,
        DEPLOY_STEP_OUTCOME: deploy, SMOKE_STEP_OUTCOME: smoke,
        RELEASE_RECHECK_OUTCOME: recheck,
        WORKFLOW_RUN_URL: 'https://github.com/example/repo/actions/runs/123', EVIDENCE_PATH: evidencePath,
      })
      const record = JSON.parse(readFileSync(evidencePath, 'utf8'))
      assert.equal(record.status, status)
      assert.equal(record.commit_sha, sha)
      assert.equal(record.deployment_url, deploymentUrl || null)
      assert.equal(record.deploy_step, deploy)
      assert.equal(record.smoke_step, smoke)
      assert.equal(record.release_recheck, recheck)
      const bindings = {
        'steps.deploy.outputs.deferred': deferred, 'steps.deploy.outcome': deploy,
        'steps.smoke.outcome': smoke, 'steps.deploy.outputs.url': deploymentUrl,
        'steps.release-recheck.outcome': recheck,
      }
      const script = runBlock('Deployment summary').replace(/\$\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
        assert.ok(Object.hasOwn(bindings, key), `unknown expression: ${key}`)
        return bindings[key]
      })
      run(script, { GITHUB_STEP_SUMMARY: summaryPath })
      const summary = readFileSync(summaryPath, 'utf8')
      assert.match(summary, new RegExp(`Status: \\*\\*${summaryStatus}`))
      if (summaryStatus !== 'DEPLOYED') assert.doesNotMatch(summary, /Status: \*\*DEPLOYED|Smoke test: passed/)
      else assert.match(summary, /Production alias \(not independently verified\)/)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}

test('batched pushes produce separate lines and explicitly do not claim deployment', () => {
  const root = mkdtempSync(join(tmpdir(), 'panacea-batched-release-'))
  try {
    const path = join(root, 'summary.md')
    run(runBlock('Batch this push for the next Vercel release'), { GITHUB_STEP_SUMMARY: path, GITHUB_SHA: sha })
    const lines = readFileSync(path, 'utf8').trim().split('\n')
    assert.ok(lines.includes(`Release status: **QUEUED — NOT DEPLOYED** for commit ${sha}.`))
    assert.ok(lines.includes('This main push was batched, not failed.'))
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('smoke outcome and retained evidence are wired into the actual deployment job', () => {
  assert.match(workflow, /name: Smoke-test deployed production artifact\n\s+id: smoke/)
  assert.match(workflow, /SMOKE_STEP_OUTCOME: \$\{\{ steps\.smoke\.outcome \}\}/)
  assert.match(workflow, /name: Upload Vercel release evidence\n\s+if: always\(\)/)
  assert.match(workflow, /if-no-files-found: error/)
})
