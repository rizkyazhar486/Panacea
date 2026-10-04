import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/render-live-smoke.yml', import.meta.url),
  'utf8',
)

test('live Render smoke binds provenance to the latest canonical server-source commit', () => {
  assert.match(
    workflow,
    /uses: actions\/checkout@v4[\s\S]*fetch-depth:\s*0/,
    'provenance resolution needs full canonical history, not a shallow checkout',
  )
  assert.match(
    workflow,
    /expected_sha="\$\(git log -1 --format=%H -- server\)"/,
    'expected deployment provenance must resolve from the latest commit that changed server source',
  )
  assert.match(
    workflow,
    /if \[ -z "\$expected_sha" \]; then[\s\S]*exit 1[\s\S]*fi/,
    'missing server-source provenance must fail closed',
  )
  assert.doesNotMatch(
    workflow,
    /EXPECTED_SHA:\s*\$\{\{\s*github\.sha\s*\}\}/,
    'workflow-only or frontend-only commits must not be misidentified as backend deployment revisions',
  )
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
    'the deployed build commit must exactly equal the resolved server-source SHA and missing provenance must fail closed',
  )
})
