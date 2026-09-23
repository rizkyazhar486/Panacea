import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/components/CardioAtlas3D.tsx', import.meta.url), 'utf8')

assert.match(source, /role="tablist"/, 'cardiovascular mode chooser must expose a tablist')
assert.equal((source.match(/role="tab"/g) ?? []).length, 2, 'both 3D modes must be tabs')
assert.match(source, /role="tabpanel"/, 'active WebGL surface must be reachable as a tabpanel')
assert.match(source, /aria-controls="cardio-panel-atlas"/, 'atlas tab must own its panel')
assert.match(source, /aria-controls="cardio-panel-cycle"/, 'cycle tab must own its panel')
assert.match(source, /ArrowRight/, 'tabs must support forward arrow navigation')
assert.match(source, /ArrowLeft/, 'tabs must support backward arrow navigation')
assert.match(source, /event\.key === 'Home'/, 'tabs must support Home navigation')
assert.match(source, /event\.key === 'End'/, 'tabs must support End navigation')
assert.equal((source.match(/min-h-11/g) ?? []).length, 2, 'both mode tabs must keep a 44px touch floor')
assert.match(source, /<AtlasViewer3D berkas="cardio\/cardio\.glb"/, 'source-backed circulation atlas must remain the atlas visualization')
assert.match(source, /<CardiacCycle3D hr=/, 'cardiac cycle WebGL must remain the cycle visualization')
assert.doesNotMatch(source, /placeholder|synthetic anatomy|fake geometry/i, 'light reachability patch must not introduce substitute anatomy')

console.log('body cardio LIGHT tab reachability invariants passed')
