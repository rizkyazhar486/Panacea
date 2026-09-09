import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const smoke = readFileSync(new URL('../qa/body3d-mobile-smoke.mjs', import.meta.url), 'utf8')
const inspector = readFileSync(new URL('../../src/pages/bodyhub/WholeBodyMotionInspector.tsx', import.meta.url), 'utf8')

assert.match(inspector, /Inspect \$\{exactSourceNames\.length\} exact source nodes in shared 3D/)
assert.match(inspector, /disabled\s*=\s*\{\s*!exactSourceNames\.length\s*\}/)
assert.match(inspector, /No exact represented geometry to inspect/)

assert.doesNotMatch(smoke, /Inspect this motion in shared 3D/)
assert.match(smoke, /Inspect \\d\+ exact source nodes in shared 3D/)
assert.match(smoke, /No exact represented geometry to inspect/)
assert.match(smoke, /exactSourceButton\.isVisible/)
assert.match(smoke, /exactSourceButton\.isEnabled/)
assert.match(smoke, /exactSourceCount/)
assert.match(smoke, /exactSourceCount <= 0/)
assert.match(smoke, /Shared 3D motion inspection lost the WebGL context/)

console.log('body3d-mobile-smoke-source-handoff: exact source-node handoff contract guarded')
