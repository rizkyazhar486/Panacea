import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/organ-3d-acceptance.yml', import.meta.url),
  'utf8',
)

assert.match(
  workflow,
  /PW_PREFIX="\$\{RUNNER_TEMP\}\/panacea-playwright"/,
  'Body3D browser tooling must live outside the application dependency tree',
)
assert.match(
  workflow,
  /npm install \\\n\s+--prefix "\$PW_PREFIX"/,
  'Playwright install must target the isolated prefix',
)
assert.doesNotMatch(
  workflow,
  /^\s*npm install --no-save --no-package-lock @playwright\/test@/m,
  'Body3D CI must not re-resolve the application dependency tree after npm ci',
)
assert.match(
  workflow,
  /for attempt in 1 2 3; do/,
  'transient registry failures must get a bounded retry',
)
assert.match(
  workflow,
  /ln -s "\$PW_PREFIX\/node_modules\/@playwright\/test" node_modules\/@playwright\/test/,
  'QA imports must resolve only the isolated Playwright package',
)
assert.match(
  workflow,
  /"\$PW_PREFIX\/node_modules\/\.bin\/playwright" install --with-deps chromium/,
  'browser installation must use the pinned isolated runner',
)

console.log('Body3D CI Playwright isolation: root npm tree stays immutable after npm ci; isolated runner has bounded registry retry.')
