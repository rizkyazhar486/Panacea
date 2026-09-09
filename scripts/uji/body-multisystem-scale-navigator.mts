import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const navigatorSource = readFileSync('src/pages/bodyhub/BodyMultisystemScaleNavigator.tsx', 'utf8')
const precisionLabSource = readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')

assert.match(navigatorSource, /listBodyMultisystemScaleViews/)
assert.match(navigatorSource, /getBodyMultisystemScaleView/)
assert.match(navigatorSource, /listBodyMultisystemDomains/)
assert.match(navigatorSource, /Explore 15 scales/)
assert.match(navigatorSource, /Lazy non-3D representation; no extra renderer loaded/)
assert.match(navigatorSource, /measured RNA expression/)
assert.match(navigatorSource, /deterministic thought\/personality/)
assert.doesNotMatch(navigatorSource, /from ['"]three['"]/)
assert.doesNotMatch(navigatorSource, /Canvas|WebGLRenderer|GLTFLoader/)

assert.match(precisionLabSource, /import BodyMultisystemScaleNavigator from '\.\/BodyMultisystemScaleNavigator'/)
assert.match(precisionLabSource, /<BodyMultisystemScaleNavigator \/>/)
assert.equal((precisionLabSource.match(/<BodyMultisystemScaleNavigator \/>/g) ?? []).length, 1)

console.log('Body multisystem scale navigator: adapter reuse, compact mount, lazy non-3D policy, and no duplicate renderer verified.')
