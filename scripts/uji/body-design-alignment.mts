import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const alignment = readFileSync(resolve('src/pages/bodyExposureDesignAlignment.css'), 'utf8')
const atlas = readFileSync(resolve('src/components/BodyAllSystems3D.tsx'), 'utf8')

// Global Panacea spectrum: navigation/spatial = cyan, intelligence = violet,
// causal cross-layer accents = magenta, biological selection = green,
// evidence/boundaries = amber. These are visual semantics, not clinical states.
assert.match(alignment, /--be-cyan:\s*77,\s*231,\s*255/)
assert.match(alignment, /--be-violet:\s*156,\s*124,\s*255/)
assert.match(alignment, /--be-magenta:\s*255,\s*99,\s*216/)
assert.match(alignment, /--be-emerald:\s*0,\s*216,\s*121/)
assert.match(alignment, /--be-amber:\s*255,\s*210,\s*120/)

assert.match(atlas, /const BODY_ATLAS_LIGHT = \{/)
assert.match(atlas, /cyan:\s*0x4de7ff/, '3D cyan rim must match Panacea HIG cyan')
assert.match(atlas, /violet:\s*0x9c7cff/, '3D violet rim must match Panacea HIG violet')
assert.match(atlas, /new THREE\.DirectionalLight\(BODY_ATLAS_LIGHT\.cyan/, 'renderer must consume the canonical cyan light token')
assert.match(atlas, /new THREE\.DirectionalLight\(BODY_ATLAS_LIGHT\.violet/, 'renderer must consume the canonical violet light token')
assert.match(atlas, /standard\.emissive\.set\(BODY_ATLAS_LIGHT\.emissive\)/, 'projected anatomy must use the shared atlas emissive token')

assert.doesNotMatch(atlas, /new THREE\.DirectionalLight\(0x67e8f9/, 'legacy cyan rim must not drift back in')
assert.doesNotMatch(atlas, /new THREE\.DirectionalLight\(0xa78bfa/, 'legacy violet rim must not drift back in')

console.log('body design alignment: Panacea spectral semantics and 3D atlas cyan/violet lighting are locked to the shared HIG palette')
