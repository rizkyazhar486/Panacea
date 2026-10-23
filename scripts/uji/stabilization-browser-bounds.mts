import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/stabilization-acceptance.yml', import.meta.url),
  'utf8',
)

assert.match(
  workflow,
  /name: Install mobile browser smoke runner\n\s+timeout-minutes: 22\n/,
  'stabilization browser provisioning must have its own hard runtime bound (22 min: two attempts of at most 10 min plus npm install; raised from 8 after the apt mirror timed out twice on main)',
)
assert.match(
  workflow,
  /for attempt in 1 2; do\n\s+if timeout 600 "\$PW_PREFIX\/node_modules\/\.bin\/playwright" install --with-deps chromium; then/,
  'each apt/browser attempt must be capped at 10 minutes and retried exactly once, never unbounded',
)
assert.match(
  workflow,
  /playwright --with-deps failed after 2 attempts" >&2\n\s+exit 1/,
  'a persistent provisioning failure must still fail the step after the bounded retries',
)
assert.match(
  workflow,
  /PW_PREFIX="\$\{RUNNER_TEMP\}\/panacea-playwright"/,
  'stabilization must isolate Playwright installation from the application dependency tree',
)
assert.match(
  workflow,
  /"\$PW_PREFIX\/node_modules\/\.bin\/playwright" install --with-deps chromium/,
  'stabilization must invoke the isolated Playwright binary explicitly',
)
assert.match(
  workflow,
  /nohup setsid npm run preview/,
  'stabilization preview must run in its own process group',
)
assert.match(
  workflow,
  /kill -TERM -- "-\$preview_pid"/,
  'stabilization cleanup must terminate the full preview process group',
)

console.log('stabilization CI: browser provisioning is bounded and preview cleanup is process-group safe')
