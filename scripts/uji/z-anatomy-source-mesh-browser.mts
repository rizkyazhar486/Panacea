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

// Structural peer visualization must use only explicit graph edges and exact
// source-file/source-name identity. It must not turn the engineering graph into
// an unsupported anatomical-neighborhood claim.
assert.match(browser, /import \{ BODY_ATLAS_GRAPH \} from '\.\.\/\.\.\/lib\/bodyAtlasGraph'/)
assert.match(browser, /node\.sourceFile === selectedResult\.file && node\.sourceName === selectedResult\.name/)
assert.match(browser, /for \(const edge of BODY_ATLAS_GRAPH\.edges\)/)
assert.match(browser, /edge\.source === selectedGraphNode\.id/)
assert.match(browser, /edge\.target === selectedGraphNode\.id/)
assert.match(browser, /edge\.kind/)
assert.match(browser, /Structural peers/)
assert.match(browser, /contralateral/)
assert.match(browser, /same structure/)
assert.match(browser, /They are not anatomical adjacency, innervation, vascular territory, surgical safety, or biomechanical coupling\./)
assert.doesNotMatch(browser, /safe surgical path/i)
assert.doesNotMatch(browser, /injury risk/i)

assert.match(lab, /import ZAnatomySourceMeshBrowser from '\.\/ZAnatomySourceMeshBrowser'/)
assert.match(lab, /<ZAnatomySourceMeshBrowser\b/)
assert.match(lab, /<ZAnatomyAtlasWorkbench\b/)

// Keep the original shared-viewer wiring, while allowing additive callbacks
// such as curated surgery/biomechanics navigation on the workbench.
for (const callback of [
  'onHighlight={onHighlight}',
  'onFocusRegion={onFocusRegion}',
  'onEnableLayer={onEnableLayer}',
]) {
  assert.ok(lab.includes(callback), `WholeBodyPrecisionLab must preserve ${callback}`)
}

console.log('Z-Anatomy source mesh browser stays bounded, provenance-aware, exact-node routed, explicit-graph constrained, module-compatible, and mounted beside the curated workbench with additive callbacks allowed.')