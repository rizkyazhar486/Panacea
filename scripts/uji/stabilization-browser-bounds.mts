import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/stabilization-acceptance.yml', import.meta.url),
  'utf8',
)

assert.match(
  workflow,
  /name: Install mobile browser smoke runner\n\s+timeout-minutes: 8/,
  'stabilization browser provisioning must have its own hard runtime bound',
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
