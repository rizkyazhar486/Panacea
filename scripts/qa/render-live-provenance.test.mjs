import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { verifyRenderDeployment } from './verify-render-revision.mjs'
const workflow = readFileSync(new URL('../../.github/workflows/render-live-smoke.yml', import.meta.url), 'utf8')

test('live smoke verifies the checked-out canonical server source and keeps capability and auth checks', () => {
  assert.match(workflow, /uses: actions\/checkout@v4[\s\S]*fetch-depth:\s*0/)
  assert.match(workflow, /expected_sha="\$\(git rev-parse HEAD\)"/)
  assert.match(workflow, /if \[ -z "\$expected_sha" \]; then[\s\S]*exit 1[\s\S]*fi/)
  assert.match(workflow, /\[ "\$code" = '200' \] && \[ "\$health_code" = '200' \]/)
  assert.match(workflow, /node scripts\/qa\/verify-render-revision\.mjs \/tmp\/capabilities\.json \/tmp\/health\.json "\$expected_sha"/)
  assert.match(workflow, /test "\$unauth_code" = '401'/)
  assert.match(workflow, /grep -q '\"unauthorized\"'/)
})

test('merged server revisions and later frontend commits verify by approved ancestry and identical server tree', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'panacea-render-provenance-'))
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const commit = message => { git('add', '.'); git('commit', '-m', message); return git('rev-parse', 'HEAD') }
  try {
    git('init', '-b', 'main'); git('config', 'user.email', 'qa@localhost.test'); git('config', 'user.name', 'QA')
    mkdirSync(join(cwd, 'server')); writeFileSync(join(cwd, 'server/app.ts'), 'v1'); commit('baseline')
    git('checkout', '-b', 'server-fix'); writeFileSync(join(cwd, 'server/app.ts'), 'v2'); const source = commit('server fix')
    git('checkout', 'main'); writeFileSync(join(cwd, 'frontend.ts'), 'v1'); commit('frontend')
    git('merge', '--no-ff', 'server-fix', '-m', 'approved server merge'); const merged = git('rev-parse', 'HEAD')
    // This reproduces the old gate: the source commit is not the deployed main merge SHA.
    assert.equal(git('log', '-1', '--format=%H', '--', 'server'), source)
    assert.notEqual(source, merged)
    const capabilities = revision => ({ backend: 'render-control-plane', configured: false, runtime: { revision }, jobKinds: ['ont-basecalling', 'pharmcat', 'sv-calling'] })
    const verify = (revision, body = capabilities(revision), health = { build: { commit: revision } }, expectedSha = git('rev-parse', 'HEAD')) => verifyRenderDeployment(body, health, { cwd, expectedSha })
    assert.equal(verify(merged).deployedRevision, merged)
    writeFileSync(join(cwd, 'frontend.ts'), 'v2'); const frontend = commit('frontend only')
    assert.equal(verify(merged).canonicalRevision, frontend)
    git('checkout', '-b', 'unapproved'); writeFileSync(join(cwd, 'unapproved.txt'), 'branch'); const unapproved = commit('unapproved identical server')
    git('checkout', 'main'); assert.throws(() => verify(unapproved))
    writeFileSync(join(cwd, 'server/app.ts'), 'v3'); const current = commit('new server')
    assert.throws(() => verify(merged), /server source/)
    assert.equal(verify(current).deployedRevision, current)
    assert.throws(() => verify(current, capabilities(merged)), /same deployment/)
    assert.throws(() => verify(current, capabilities(current), { build: {} }), /provenance/)
    assert.throws(() => verify(current, capabilities(current), { build: { commit: 'bad' } }), /provenance/)
    assert.throws(() => verify(current, { ...capabilities(current), jobKinds: [] }), /job kind/)
    assert.throws(() => verify(current, { ...capabilities(current), backend: 'other' }))
    assert.throws(() => verify(current, capabilities(current), undefined, merged), /checkout/)
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})
