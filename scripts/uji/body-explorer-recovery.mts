import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const body = readFileSync('src/pages/BodyExplorer.tsx', 'utf8')
const precision = readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')

assert.match(body, /FeatureErrorBoundary/, 'Body Explorer must isolate heavy panel failures')
assert.match(body, /onBack=\{\(\) => setPanelTab\('layers'\)\}/, 'recovery must return to stable layers panel')
assert.match(body, /onFocusRegion=\{\(keywords\).*setFocusKeywords\(keywords\)/s, 'precision atlas must drive shared Body3D focus')
assert.match(body, /onOpenSurgical=\{\(\) => setPanelTab\('bedah'\)\}/)
assert.match(body, /onOpenMovement=\{\(\) => setPanelTab\('workout-sim'\)\}/)
assert.doesNotMatch(body, /figure is beating|see it move →|ankle beats later than the chest/, 'copy must not imply source meshes still deform')

assert.match(precision, /MiniBodyMap\(\{ region, onSelect \}/, 'mini navigator must accept real selection callback')
assert.match(precision, /onClick=\{\(\) => onSelect\(key\)\}/, 'mini navigator regions must be interactive')
assert.match(precision, /onFocusRegion\?\.\(hints\)/, 'region selection must focus the shared viewer')
assert.match(precision, /Open surgical layers →/)
assert.match(precision, /Open movement simulator →/)
assert.doesNotMatch(precision, /scaffold|next visual agent|Final visual pass|Bind this to/i, 'user-facing internal handoff language must be removed')

console.log('Body Explorer recovery boundary and Whole-Body Precision integration are wired')
