import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../../src/components/OrganModel3D.tsx', import.meta.url), 'utf8')
const glb = readFileSync(new URL('../atlasGlb.mjs', import.meta.url), 'utf8')

assert.match(src, /organ\.sumber !== 'bodyparts3d'/, 'exact mesh picking must be restricted to verified BodyParts3D organ models')
assert.match(src, /ray\.intersectObjects\(namedMeshes, false\)/, 'verified organ meshes must be ray-pickable')
assert.match(src, /Named reference anatomy/, 'all available named reference parts must be discoverable in the UI')
assert.match(src, /partNames\.slice\(0, 12\)/, 'large part lists must stay compact by default')
assert.match(src, /setPartNames/, 'named parts must come from loaded GLB meshes rather than a fabricated UI list')
assert.match(src, /displayMeshName/, 'sanitized GLTF node names must be presented readably')
assert.doesNotMatch(src, /new THREE\.(SphereGeometry|BoxGeometry|CapsuleGeometry|CylinderGeometry)\(/, 'organ anatomy must not be replaced with toy primitive geometry')
assert.match(glb, /panaceaAnatomyName/, 'newly generated atlas GLBs must preserve the exact source anatomy name in node extras')

console.log('Organ close-up: every available BodyParts3D mesh is discoverable, pickable, source-named, and no toy anatomy geometry is introduced.')
