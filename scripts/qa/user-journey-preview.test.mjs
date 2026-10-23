import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(new URL('../../.github/workflows/user-journey-acceptance.yml', import.meta.url), 'utf8')

test('F1 runs real UI journeys against production-built Vite preview, not lazily transformed dev modules', () => {
  assert.match(workflow, /VITE_API_URL=http:\/\/127\.0\.0\.1:18790 npx vite build/)
  assert.match(workflow, /npx vite preview --host 127\.0\.0\.1 --port 5190 --strictPort/)
  assert.doesNotMatch(workflow, /npx vite --host 127\.0\.0\.1 --port 5190 --strictPort/)
})
test('F1 preview keeps genuine API, multiple roles, recovery and fail-to-pass negative controls', () => {
  for (const marker of ['ALLOW_DEV_LOGIN=true', 'CORS_ORIGINS=http://localhost:5190',
    'node scripts/qa/user-journey-e2e.mjs', 'node scripts/qa/user-journey-staff.mjs',
    'node scripts/qa/user-journey-resilience.mjs', 'fresh_server resilience',
    'for mode in bocor overflow', 'Kontrol negatif', 'rc=1']) {
    assert.ok(workflow.includes(marker), `required F1 coverage missing: ${marker}`)
  }
})
