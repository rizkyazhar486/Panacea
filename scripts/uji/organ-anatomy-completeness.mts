import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ORGAN_FOCUS } from '../../src/lib/organFocus'
import {
  ORGAN_ANATOMY_SCOPES,
  anatomyCoverageForOrgan,
  anatomyScopeForOrgan,
  normalizeAnatomyName,
} from '../../src/lib/organAnatomyRequirements'

const focusKeys = new Set(ORGAN_FOCUS.map((organ) => organ.key))
const scopeKeys = new Set(ORGAN_ANATOMY_SCOPES.map((scope) => scope.organKey))

assert.equal(scopeKeys.size, ORGAN_ANATOMY_SCOPES.length, 'organ anatomy scope keys must be unique')
assert.deepEqual(
  [...focusKeys].filter((key) => !scopeKeys.has(key)),
  [],
  'every Body Exposure organ/system target must have an explicit macro-anatomy scope',
)

for (const scope of ORGAN_ANATOMY_SCOPES) {
  assert.ok(scope.requirements.length > 0, `${scope.organKey} must define at least one required structure`)
  const ids = new Set<string>()
  for (const requirement of scope.requirements) {
    assert.ok(requirement.id.trim(), `${scope.organKey} has an empty requirement id`)
    assert.ok(requirement.label.trim(), `${scope.organKey}/${requirement.id} has an empty label`)
    assert.ok(requirement.aliases.length > 0, `${scope.organKey}/${requirement.id} needs a conservative source alias`)
    assert.ok(requirement.aliases.every((alias) => normalizeAnatomyName(alias).length > 0), `${scope.organKey}/${requirement.id} has an empty normalized alias`)
    assert.ok(!ids.has(requirement.id), `${scope.organKey} repeats requirement id ${requirement.id}`)
    ids.add(requirement.id)
  }
}

// Known BodyParts3D eye labels must satisfy only the concepts they actually name.
const eye = anatomyCoverageForOrgan('eye', [
  'Right corona ciliaris',
  'Left sclera',
  'Optic part of left retina',
])
assert.ok(eye.matched.some((item) => item.id === 'ciliary-body'), 'corona ciliaris must map to the ciliary-body requirement')
assert.ok(eye.matched.some((item) => item.id === 'sclera'), 'named sclera mesh must map to sclera')
assert.ok(eye.matched.some((item) => item.id === 'retina'), 'named retinal mesh must map to retina')
assert.ok(eye.missing.some((item) => item.id === 'lens'), 'unseen lens must remain a source gap')

// A single coarse organ mesh is not evidence for internal subdivisions.
const stomach = anatomyCoverageForOrgan('stomach', ['Stomach'])
assert.equal(stomach.matched.length, 0, 'a coarse Stomach mesh must not imply fundus/cardia/body/antrum/pylorus geometry')
assert.equal(stomach.missing.length, anatomyScopeForOrgan('stomach')?.requirements.length, 'all stomach subdivisions must remain explicit gaps when not individually named')

// Matching is intentionally one-way: an alias may be contained in a detailed
// source name, but a coarse source name may not satisfy a more detailed alias.
const gallbladder = anatomyCoverageForOrgan('gallbladder', ['Gallbladder', 'Cystic duct'])
assert.ok(gallbladder.matched.some((item) => item.id === 'cystic-duct'))
assert.ok(gallbladder.missing.some((item) => item.id === 'fundus'))
assert.ok(gallbladder.missing.some((item) => item.id === 'neck'))

const viewer = readFileSync('src/components/OrganModel3D.tsx', 'utf8')
assert.match(viewer, /Anatomical completeness gate/)
assert.match(viewer, /data-anatomy-completeness/)
assert.match(viewer, /Exact 3D/)
assert.match(viewer, /Source gap/)
assert.match(viewer, /does not generate a fake mesh/)
assert.doesNotMatch(viewer, /new THREE\.(SphereGeometry|BoxGeometry|CapsuleGeometry|CylinderGeometry|ConeGeometry)/)

console.log(`✓ ${ORGAN_ANATOMY_SCOPES.length} organ/system anatomy scopes are explicit; coarse meshes cannot masquerade as detailed anatomy`)
