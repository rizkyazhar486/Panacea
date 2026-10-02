import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync(
  new URL('../../.github/workflows/organ-3d-acceptance.yml', import.meta.url),
  'utf8',
)

assert.ok(
  workflow.includes("group: body-3d-acceptance-${{ github.event.pull_request.number || github.sha }}"),
  'Body3D must share one cancellation lane per PR while isolating every non-PR exact commit SHA',
)
assert.ok(
  workflow.includes('cancel-in-progress: true'),
  'new PR heads may supersede stale PR evidence because canonical main SHAs use distinct groups',
)
assert.doesNotMatch(
  workflow,
  /group: body-3d-acceptance-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/,
  'canonical main runs must not share a ref-level pending slot that can replace earlier merged-SHA evidence',
)

assert.match(
  workflow,
  /render-proof:[\s\S]*?timeout-minutes: 60/,
  'the Body3D job must retain enough bounded headroom for setup plus the serial proof stage',
)
assert.match(
  workflow,
  /name: Install browser smoke runner\n\s+timeout-minutes: 15/,
  'browser provisioning must not consume the whole job indefinitely',
)
assert.match(
  workflow,
  /name: Prove every 3D panel renders[\s\S]*?timeout-minutes: 38/,
  'the serial Body3D proof stage must have a coherent hard stop above the sum of its per-gate bounds',
)
assert.match(
  workflow,
  /batas=180/,
  'Body3D smoke gates must default to a finite 180s runtime bound',
)
assert.match(
  workflow,
  /if \[ "\$gerbang" = 'qa:organ-3d' \]; then[\s\S]*?batas=240/,
  'the heavier organ proof must receive only its evidence-based 240s exception',
)
assert.match(
  workflow,
  /timeout --signal=TERM --kill-after=15s "\$\{batas\}s" npm run "\$gerbang"/,
  'every Body3D smoke command must execute through its selected hard runtime bound',
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
  /::error::\$gerbang timeout setelah \$\{durasi\}s \(batas \$\{batas\}s\)/,
  'timeout diagnostics must identify the affected gate and selected configured bound',
)
assert.match(
  workflow,
  /nohup setsid npm run preview/,
  'the production preview must run in its own process group for reliable cleanup',
)
assert.match(
  workflow,
  /kill -TERM -- "-\$preview_pid"/,
  'cleanup must terminate the preview process group, not only the npm parent',
)
assert.doesNotMatch(
  workflow,
  /gagal=/,
  'Body3D smoke failures must fail fast instead of queueing the remaining gates',
)

const aggregateBoundSeconds = 240 + (11 * 180)
assert.equal(aggregateBoundSeconds, 2220, 'declared per-gate Body3D bounds must total 37 minutes')
assert.ok(
  38 * 60 > aggregateBoundSeconds,
  'the stage hard stop must not pre-empt any individually bounded serial gate',
)
assert.ok(
  60 * 60 > (38 * 60) + (15 * 60),
  'the job hard stop must leave bounded headroom for browser provisioning plus the proof stage',
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
const loopMatch = workflow.match(/for gerbang in ([\s\S]*?); do/)
assert.ok(loopMatch, 'Body3D smoke loop declaration must exist')
const loopDeclaration = loopMatch[1]

let previous = -1
for (const gate of ordered) {
  const index = loopDeclaration.indexOf(gate)
  assert.ok(index > previous, `Body3D smoke gate missing or reordered unexpectedly: ${gate}`)
  previous = index
}

assert.match(
  workflow,
  /# Fail fast\.[\s\S]*?exit 1\n\s+fi\n\s+done/,
  'a failed or timed-out gate must stop the serial queue immediately',
)

console.log(
  'Body3D CI: serial proofs are individually bounded with a 240s organ exception, fail fast, and retain stage/job/process-group hard stops',
)
