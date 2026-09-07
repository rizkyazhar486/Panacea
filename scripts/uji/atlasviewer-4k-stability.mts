import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

// Specialty atlas must use the same 4K/adaptive pixel budget as Body3D.
assert.match(source, /body3dPixelRatio/)
assert.doesNotMatch(source, /setPixelRatio\(Math\.min\(window\.devicePixelRatio,\s*2\)\)/)
assert.match(source, /w\s*<\s*2\s*\|\|\s*h\s*<\s*2/)

// Heavy GLBs must stop consuming GPU when the atlas is not visible.
assert.match(source, /IntersectionObserver/)
assert.match(source, /visibilitychange/)
assert.match(source, /stopRendering/)
assert.match(source, /startRendering/)

// WebGL recovery and deterministic GPU cleanup are required for repeated lab switching.
assert.match(source, /webglcontextlost/)
assert.match(source, /webglcontextrestored/)
assert.match(source, /renderLists\.dispose\(\)/)
assert.match(source, /forceContextLoss\(\)/)

// Structure names must still be restored from generated atlas metadata, not invented from display text.
assert.match(source, /namaBersih/)
assert.match(source, /bagianRef\.current/)
assert.match(source, /takDikenal/)

console.log('AtlasViewer3D 4K/stability/name guards verified.')
