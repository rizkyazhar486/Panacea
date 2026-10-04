import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** A production revision must be approved history with exactly the checked-out server source. */
export function verifyRenderDeployment(body, health, { cwd = process.cwd(), expectedSha } = {}) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const canonical = git('rev-parse', 'HEAD')
  assert.match(expectedSha || '', /^[a-f0-9]{40}$/, 'canonical revision is required')
  assert.equal(expectedSha, canonical, 'expected revision must match the checkout under test')
  const deployed = health?.build?.commit
  assert.match(deployed || '', /^[a-f0-9]{40}$/, 'deployed health build provenance is required')
  assert.equal(body?.runtime?.revision, deployed, 'health and capabilities must describe the same deployment')
  git('merge-base', '--is-ancestor', deployed, canonical)
  const expectedTree = git('rev-parse', `${canonical}:server`)
  assert.equal(git('rev-parse', `${deployed}:server`), expectedTree, 'deployed server source differs from canonical source')
  assert.equal(body.backend, 'render-control-plane')
  for (const kind of ['ont-basecalling', 'pharmcat', 'sv-calling']) assert.ok(Array.isArray(body.jobKinds) && body.jobKinds.includes(kind), `missing job kind: ${kind}`)
  return { canonicalRevision: canonical, deployedRevision: deployed, serverSourceTree: expectedTree, backend: body.backend, configured: body.configured, provider: body.provider, runtime: body.runtime, jobKinds: body.jobKinds }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [capabilitiesPath, healthPath, expectedSha] = process.argv.slice(2)
  console.log(JSON.stringify(verifyRenderDeployment(JSON.parse(readFileSync(capabilitiesPath, 'utf8')), JSON.parse(readFileSync(healthPath, 'utf8')), { expectedSha })))
}
