import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const release = readFileSync(new URL('../../.github/workflows/vercel-prebuilt-production.yml', import.meta.url), 'utf8')
const audit = readFileSync(new URL('../../.github/workflows/dependency-audit.yml', import.meta.url), 'utf8')
const job = name => release.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z][a-z-]*:|$(?![\\s\\S]))`, 'm'))?.[1] ?? ''

test('production job depends on exact revision acceptance before accessing Vercel', () => {
  const preflight = job('release-gates')
  const deploy = job('deploy')
  assert.match(preflight, /ref: \$\{\{ github\.sha \}\}/)
  assert.match(preflight, /node scripts\/qa\/vercel-release-gate\.mjs/)
  assert.match(deploy, /needs: release-gates/)
  assert.doesNotMatch(deploy.split('runs-on:')[0], /always\(\)/, 'failed prerequisite must skip deployment')
  assert.match(release, /permissions:\n  contents: read\n  actions: read/)
  assert.match(preflight, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/)
  assert.doesNotMatch(preflight, /VERCEL_TOKEN|continue-on-error: true/)
})

test('recheck acceptance after build and before the deployment mutation', () => {
  const deploy = job('deploy')
  const build = deploy.indexOf('name: Build production artifact')
  const recheck = deploy.indexOf('name: Recheck exact revision acceptance')
  const publish = deploy.indexOf('name: Deploy prebuilt artifact')
  assert.ok(build >= 0 && recheck > build && publish > recheck)
  const step = deploy.slice(recheck, publish)
  assert.match(step, /node scripts\/qa\/vercel-release-gate\.mjs/)
  assert.match(step, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/)
  assert.doesNotMatch(step, /continue-on-error: true|\|\| true/)
})

test('initial release can wait for asynchronous CI while the deployment recheck is immediate', () => {
  assert.match(job('release-gates'), /timeout-minutes: 25/)
  assert.match(job('release-gates'), /RELEASE_GATE_WAIT_SECONDS: 1200/)
  assert.doesNotMatch(job('deploy'), /RELEASE_GATE_WAIT_SECONDS/)
})

test('every main revision can acquire its required dependency audit evidence', () => {
  const push = audit.match(/^  push:\n([\s\S]*?)(?=^  pull_request:)/m)?.[1] ?? ''
  assert.match(push, /branches: \[main\]/)
  assert.doesNotMatch(push, /paths:/, 'a path-filtered audit would block ordinary exact-revision releases')
  assert.match(audit, /pull_request:\n    paths:/, 'keep PR audit scope')
})

test('release policy keeps ordinary pushes batched and retains deployment quota handling', () => {
  assert.match(job('release-gates'), /if: github\.event_name != 'push' \|\| contains\(github\.event\.head_commit\.message, '\[deploy-vercel\]'\)/)
  assert.match(job('deploy'), /if: github\.event_name != 'push' \|\| contains\(github\.event\.head_commit\.message, '\[deploy-vercel\]'\)/)
  assert.match(release, /cron: '17 \*\/6 \* \* \*'/)
  assert.match(job('deploy'), /group: vercel-production/)
  assert.match(job('deploy'), /api-deployments-free-per-day/)
})
