import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/components/Cell3D.tsx', import.meta.url), 'utf8')

assert.match(source, /body3dPixelRatio/)
assert.doesNotMatch(source, /setPixelRatio\(Math\.min\(window\.devicePixelRatio,\s*2\)\)/)
assert.match(source, /w\s*<\s*2\s*\|\|\s*h\s*<\s*2/)

// The educational cell has no evidence-bearing motion; static views must render on demand.
assert.match(source, /requestRenderRef/)
assert.match(source, /controls\.addEventListener\('change', requestRender\)/)
assert.doesNotMatch(source, /requestAnimationFrame\(putar\)/)
assert.doesNotMatch(source, /const\s+putar\s*=/)

assert.match(source, /IntersectionObserver/)
assert.match(source, /visibilitychange/)
assert.match(source, /webglcontextlost/)
assert.match(source, /webglcontextrestored/)
assert.match(source, /renderLists\.dispose\(\)/)
assert.match(source, /forceContextLoss\(\)/)

// Never present the primitive reconstruction as microscopy-derived anatomy.
assert.match(source, /rekonstruksi edukasi berbasis SKALA REFERENSI/)
assert.match(source, /bukan segmentasi\s+mikroskopi/)

console.log('Cell3D 4K/runtime/scientific-boundary guards verified.')
