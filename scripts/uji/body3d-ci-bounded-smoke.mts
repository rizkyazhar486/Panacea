import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/organ-3d-acceptance.yml', import.meta.url),
  'utf8',
)

assert.match(
  workflow,
  /timeout --signal=TERM --kill-after=15s 150s npm run "\$gerbang"/,
  'every Body3D smoke command must have its own hard runtime bound',
)
assert.match(
  workflow,
  /if \[ "\$kode" = '124' \] \|\| \[ "\$kode" = '137' \]; then/,
  'Body3D CI must distinguish timeout termination from an ordinary assertion failure',
)
assert.match(
  workflow,
  /::notice::\$gerbang lulus dalam \$\{durasi\}s/,
  'successful Body3D smoke proofs must expose per-gate duration',
)
assert.match(
  workflow,
  /::error::\$gerbang timeout setelah \$\{durasi\}s \(batas 150s\)/,
  'timeout diagnostics must identify the affected gate and configured bound',
)

const ordered = [
  'qa:organ-3d',
  'qa:wilayah-3d',
  'qa:ventilasi-3d',
  'qa:arteri-3d',
  'qa:limfe-3d',
  'qa:kerangka-3d',
  'qa:lesi-3d',
  'qa:kelenjar-3d',
  'qa:bergerak',
  'qa:kendali',
  'qa:bilah-atas',
  'qa:share-card',
]
const loopMatch = workflow.match(/for gerbang in ([\\s\\S]*?); do/)
assert.ok(loopMatch, 'Body3D smoke loop declaration must exist')
const loopDeclaration = loopMatch[1]

let previous = -1
for (const gate of ordered) {
  const index = loopDeclaration.indexOf(gate)
  assert.ok(index > previous, `Body3D smoke gate missing or reordered unexpectedly: ${gate}`)
  previous = index
}

console.log('Body3D CI: 12 serial proofs retain order and each has a 150s hard timeout with duration diagnostics')
