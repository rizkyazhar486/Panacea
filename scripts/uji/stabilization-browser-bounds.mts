import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/stabilization-acceptance.yml', import.meta.url),
  'utf8',
)

assert.match(
  workflow,
  /name: Install mobile browser smoke runner\n\s+timeout-minutes: 22\n/,
  'stabilization browser provisioning must have its own hard runtime bound (22 min; raised from 8 after the slow apt mirror needed ~10 min and timed out twice on main)',
)
// Pelajaran #2704: membungkus langkah apt dengan `timeout` + retry membunuh playwright tetapi apt-get anaknya tetap memegang
// kunci dpkg, sehingga percobaan kedua langsung gagal ("Could not get lock"). Satu percobaan dengan anggaran lebih besar.
assert.doesNotMatch(
  workflow,
  /timeout \d+ "\$PW_PREFIX\/node_modules\/\.bin\/playwright" install/,
  'do not kill the playwright/apt install with timeout: the orphaned apt-get keeps the dpkg lock and any retry fails at once',
)
assert.equal(
  (workflow.match(/"\$PW_PREFIX\/node_modules\/\.bin\/playwright" install --with-deps chromium/g) ?? []).length,
  1,
  'exactly one apt/browser provisioning invocation inside the 22 minute step budget',
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
