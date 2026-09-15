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
assert.match(alignment, /--be-role-spatial:\s*rgb\(var\(--be-cyan\)\)/)
assert.match(alignment, /--be-role-intelligence:\s*rgb\(var\(--be-violet\)\)/)
assert.match(alignment, /--be-role-causal:\s*rgb\(var\(--be-magenta\)\)/)
assert.match(alignment, /--be-role-biologic-focus:\s*rgb\(var\(--be-emerald\)\)/)
assert.match(alignment, /--be-role-evidence:\s*rgb\(var\(--be-amber\)\)/)

// Whole-body atlas and the anatomy↔physiology handoff are part of the same
// Human Body OS visual grammar; neither may drift back into a standalone skin.
assert.match(alignment, /\[aria-label="Eleven body systems source-backed 3D atlas"\]/)
assert.match(alignment, /\[aria-label="Body systems"\] > button\[aria-selected="true"\]/)
assert.match(alignment, /\[data-atlas-physiology-bridge="v1"\]/)
assert.match(alignment, /\[aria-label="Atlas systems physiology bridge"\] > button/)
assert.match(alignment, /\[aria-label="Atlas systems physiology bridge"\] > button\[aria-selected="true"\]/)
assert.match(alignment, /rgba\(var\(--be-violet\), \.24\)/, 'active anatomy↔physiology bridge state must preserve violet intelligence emphasis')
assert.match(alignment, /prefers-reduced-motion:\s*reduce/, 'aligned spatial controls must retain reduced-motion behavior')

assert.match(atlas, /const BODY_ATLAS_LIGHT = \{/)
assert.match(atlas, /cyan:\s*0x4de7ff/, '3D cyan rim must match Panacea HIG cyan')
assert.match(atlas, /violet:\s*0x9c7cff/, '3D violet rim must match Panacea HIG violet')
assert.match(atlas, /new THREE\.DirectionalLight\(BODY_ATLAS_LIGHT\.cyan/, 'renderer must consume the canonical cyan light token')
assert.match(atlas, /new THREE\.DirectionalLight\(BODY_ATLAS_LIGHT\.violet/, 'renderer must consume the canonical violet light token')
assert.match(atlas, /standard\.emissive\.set\(BODY_ATLAS_LIGHT\.emissive\)/, 'projected anatomy must use the shared atlas emissive token')

assert.doesNotMatch(atlas, /new THREE\.DirectionalLight\(0x67e8f9/, 'legacy cyan rim must not drift back in')
assert.doesNotMatch(atlas, /new THREE\.DirectionalLight\(0xa78bfa/, 'legacy violet rim must not drift back in')

console.log('body design alignment: semantic spectrum, whole-body atlas, anatomy-physiology bridge and 3D lighting are locked to one Panacea HIG grammar')
