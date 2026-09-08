import assert from 'node:assert/strict'
import fs from 'node:fs'

const browser = fs.readFileSync('src/pages/bodyhub/ZAnatomySourceMeshBrowser.tsx', 'utf8')
const lab = fs.readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')

assert.match(browser, /useSyncExternalStore/)
assert.match(browser, /getEffectiveAnatomySourceNodeSnapshot/)
assert.match(browser, /resolveAllAnatomySourceNodes\(\[normalizedQuery\], sourceBundles, 12\)/)
assert.match(browser, /const MAX_RESULTS = 36/)
assert.match(browser, /\.slice\(0, MAX_RESULTS\)/)
assert.match(browser, /export default ZAnatomySourceMeshBrowser/)

for (const [file, layer] of [
  ['surface.glb', 'surface'],
  ['skeletal.glb', 'skeletal'],
  ['muscular.glb', 'muscular'],
  ['cardiovascular.glb', 'cardiovascular'],
  ['nervous.glb', 'nervous'],
  ['visceral.glb', 'visceral'],
  ['lymphoid.glb', 'lymphoid'],
] as const) {
  assert.ok(browser.includes(`'${file}': '${layer}'`), `${file} should route to ${layer}`)
}

assert.match(browser, /if \(result\.layer\) onEnableLayer\?\.\(result\.layer\)/)
assert.match(browser, /onHighlight\?\.\(\[result\.name\]\)/)
assert.match(browser, /onFocusRegion\?\.\(\[result\.name\]\)/)
assert.match(browser, /Source mesh browser/)
assert.match(browser, /source-name inventory, not anatomy coverage/i)
assert.match(browser, /generated-index match proves a named mesh exists in a shipped GLB/i)
assert.match(browser, /No conservative source-name match/)
assert.match(browser, /not evidence that an anatomical structure is absent/i)
assert.doesNotMatch(browser, /iframe/i)
assert.doesNotMatch(browser, /fetch\s*\(/i)

assert.match(lab, /import ZAnatomySourceMeshBrowser from '\.\/ZAnatomySourceMeshBrowser'/)
assert.match(lab, /<ZAnatomySourceMeshBrowser onHighlight=\{onHighlight\} onFocusRegion=\{onFocusRegion\} onEnableLayer=\{onEnableLayer\} \/>/)
assert.match(lab, /<ZAnatomyAtlasWorkbench onHighlight=\{onHighlight\} onFocusRegion=\{onFocusRegion\} onEnableLayer=\{onEnableLayer\} \/>/)

console.log('Z-Anatomy source mesh browser stays bounded, provenance-aware, exact-node routed, module-compatible, and mounted beside the curated workbench.')
