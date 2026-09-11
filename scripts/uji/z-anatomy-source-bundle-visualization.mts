import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/pages/bodyhub/ZAnatomySourceMeshBrowser.tsx', 'utf8')

assert.match(source, /Source bundle composition/)
assert.match(source, /Named geometry inventory/)
assert.match(source, /named source nodes/)
assert.match(source, /bar length = relative named-node count/)
assert.match(source, /loaded runtime/)
assert.match(source, /generated GLB index/)
assert.match(source, /onEnableLayer\?\.\(layer\)/)
assert.match(source, /not anatomical completeness/i)
assert.match(source, /not anatomy coverage/i)
assert.doesNotMatch(source, /human body coverage/i)
assert.doesNotMatch(source, /anatomical coverage percentage/i)

console.log('Z-Anatomy source bundle visualization stays provenance-aware, layer-routed, and explicitly non-coverage.')