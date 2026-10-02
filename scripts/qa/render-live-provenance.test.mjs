import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/render-live-smoke.yml', import.meta.url),
  'utf8',
)

test('live Render smoke fails closed unless /api/health reports the exact deployed commit', () => {
  assert.match(
    workflow,
    /health_endpoint="\$\{base%\/\}\/api\/health"/,
    'live smoke must fetch the canonical health endpoint',
  )
  assert.match(
    workflow,
    /\[ "\$code" = '200' \] && \[ "\$health_code" = '200' \]/,
    'capability success alone must not prove the deployment is current',
  )
  assert.match(
    workflow,
    /if \(!expected \|\| health\.build\?\.commit !== expected\) process\.exit\(4\)/,
    'the deployed build commit must exactly equal github.sha and missing provenance must fail closed',
  )
})
