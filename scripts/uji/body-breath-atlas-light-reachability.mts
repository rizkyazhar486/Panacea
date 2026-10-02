import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/pages/bodyhub/BreathAtlasLab.tsx', 'utf8')

assert.match(source, /aria-controls="breath-atlas-3d-panel"/, '3D disclosure button must reference the mounted panel')
assert.match(source, /id="breath-atlas-3d-panel"/, '3D panel must expose a stable reachable id')
assert.match(source, /role="region" aria-label="Interactive respiratory airflow 3D panel"/, '3D panel must be announced as a labelled region')
assert.match(source, /role="status" aria-live="polite"/, 'open/loading phase state must be exposed accessibly')
assert.match(source, /min-h-11/, 'interactive mobile controls must keep a 44px touch floor')
assert.match(source, /min-h-\[260px\]/, '390x844 fallback viewport must stay compact rather than forcing desktop height')
assert.match(source, /sm:min-h-\[300px\]/, 'larger viewports must retain the previous breathing-render floor')
assert.match(source, /RespiratoryFlow3D phase=\{flowPhase\}/, 'the real WebGL respiratory visualization must remain mounted')
assert.match(source, /Source-backed respiratory WebGL viewport/, 'the 3D viewport must expose explicit accessible state')
assert.match(source, /interaction reference only · license check required/, 'reference provenance boundary must remain visible')

console.log('body-breath-atlas-light-reachability: mobile reachability and visualization-first invariants hold')
