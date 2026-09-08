import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../../src/components/OrganModel3D.tsx', import.meta.url), 'utf8')
const models = readFileSync(new URL('../../src/lib/organModels.ts', import.meta.url), 'utf8')
const glb = readFileSync(new URL('../atlasGlb.mjs', import.meta.url), 'utf8')

// Exact structure interaction is a provenance capability, not a BodyParts3D
// brand check. Any reference atlas we explicitly support may be picked by its
// source-provided mesh name; AI surfaces remain marker-only.
assert.match(
  src,
  /!organ\.sumber \|\| organ\.sumber === 'ai' \|\| !namedMeshes\.length/,
  'exact mesh picking must reject missing provenance and AI-generated organ surfaces',
)
assert.doesNotMatch(
  src,
  /organ\.sumber !== 'bodyparts3d'/,
  'exact picking must not be artificially restricted to BodyParts3D when Z-Anatomy/HRA are reference sources too',
)
assert.match(
  models,
  /'ai' \| 'bodyparts3d' \| 'z-anatomy' \| 'hra'/,
  'organ provenance must explicitly distinguish AI, BodyParts3D, Z-Anatomy, and HRA',
)
assert.match(
  src,
  /organ\.sumber && organ\.sumber !== 'ai'/,
  'named reference anatomy UI must be available to every supported non-AI reference source',
)
assert.match(src, /ray\.intersectObjects\(namedMeshes, false\)/, 'verified reference organ meshes must be ray-pickable')
assert.match(src, /Named reference anatomy/, 'all available named reference parts must be discoverable in the UI')
assert.match(src, /partNames\.slice\(0, 12\)/, 'large part lists must stay compact by default')
assert.match(src, /setPartNames/, 'named parts must come from loaded GLB meshes rather than a fabricated UI list')
assert.match(src, /const uniqueNames = \[\.\.\.new Set\(names\)\]/, 'duplicate mesh fragments must collapse to one semantic anatomy control')
assert.match(src, /const highlighted = new Set<THREE\.Mesh>\(\)/, 'highlight state must support anatomy terms that span multiple mesh fragments')
assert.match(src, /const hits = namedMeshes\.filter\(/, 'selecting one anatomy term must collect every matching source fragment')
assert.match(src, /for \(const hit of hits\)/, 'every matching source fragment must be highlighted together')
assert.doesNotMatch(src, /const hit = namedMeshes\.find\(/, 'semantic anatomy must not stop at the first fragment with a matching name')
assert.match(src, /displayMeshName/, 'sanitized GLTF node names must be presented readably')
assert.doesNotMatch(src, /new THREE\.(SphereGeometry|BoxGeometry|CapsuleGeometry|CylinderGeometry)\(/, 'organ anatomy must not be replaced with toy primitive geometry')
assert.match(glb, /panaceaAnatomyName/, 'newly generated atlas GLBs must preserve the exact source anatomy name in node extras')

console.log('Organ close-up: reference-source picking is provenance-gated, semantic names merge duplicate fragments, all matching fragments highlight together, and AI/toy geometry cannot masquerade as exact anatomy.')
