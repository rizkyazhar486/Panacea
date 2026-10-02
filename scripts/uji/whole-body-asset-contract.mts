import assert from 'node:assert/strict'
import {
  FEMALE_HRA_UNITED_REFERENCE,
  FEMALE_PELVIS_REFERENCE,
  HRA_FEMALE_SPACE,
  PANACEA_FEMALE_PELVIS_SPACE,
  MALE_WHOLE_BODY_REFERENCE,
  WHOLE_BODY_ASSET_GAPS,
  Z_ANATOMY_MALE_SPACE,
  canOverlayReferenceAssets,
  wholeBodySourcePaths,
} from '../../src/lib/anatomy/wholeBodyAssetContract.ts'

assert.equal(MALE_WHOLE_BODY_REFERENCE.scope, 'whole-body')
assert.equal(MALE_WHOLE_BODY_REFERENCE.sex, 'male-reference')
assert.equal(MALE_WHOLE_BODY_REFERENCE.coordinateSpace, Z_ANATOMY_MALE_SPACE)

const malePaths = wholeBodySourcePaths(MALE_WHOLE_BODY_REFERENCE)
for (const required of [
  '/anatomy/surface.glb',
  '/anatomy/skeletal.glb',
  '/anatomy/muscular.glb',
  '/anatomy/cardiovascular.glb',
  '/anatomy/nervous.glb',
  '/anatomy/lymphoid.glb',
  '/anatomy/visceral.glb',
]) {
  assert.ok(malePaths.includes(required), `missing compatible whole-body layer: ${required}`)
}

assert.equal(FEMALE_PELVIS_REFERENCE.scope, 'regional')
assert.equal(FEMALE_PELVIS_REFERENCE.sex, 'female-reference')
assert.equal(FEMALE_PELVIS_REFERENCE.coordinateSpace, PANACEA_FEMALE_PELVIS_SPACE)
assert.ok(wholeBodySourcePaths(FEMALE_PELVIS_REFERENCE).includes('/atlas/obgin.glb'))

assert.equal(FEMALE_HRA_UNITED_REFERENCE.scope, 'whole-body')
assert.equal(FEMALE_HRA_UNITED_REFERENCE.sex, 'female-reference')
assert.equal(FEMALE_HRA_UNITED_REFERENCE.coordinateSpace, HRA_FEMALE_SPACE)
assert.equal(FEMALE_HRA_UNITED_REFERENCE.layers[0]?.status, 'pipeline-ready')
assert.match(FEMALE_HRA_UNITED_REFERENCE.layers[0]?.sourcePath ?? '', /united-female\/v1\.5\/assets\/3d-vh-f-united\.glb$/)
assert.deepEqual(wholeBodySourcePaths(FEMALE_HRA_UNITED_REFERENCE), [], 'pipeline-ready external source must not be treated as shipped')

assert.equal(
  canOverlayReferenceAssets(MALE_WHOLE_BODY_REFERENCE.layers[0]!, MALE_WHOLE_BODY_REFERENCE.layers[4]!),
  true,
  'surface and ocular/nervous structures share the same compatible reference space',
)
assert.equal(
  canOverlayReferenceAssets(MALE_WHOLE_BODY_REFERENCE.layers[0]!, FEMALE_PELVIS_REFERENCE.layers[0]!),
  false,
  'female HRA pelvis must not be silently overlaid on the male Z-Anatomy reference body',
)
assert.equal(
  canOverlayReferenceAssets(FEMALE_HRA_UNITED_REFERENCE.layers[0]!, FEMALE_PELVIS_REFERENCE.layers[0]!),
  false,
  'the repo-normalized pelvis module must not be assumed to retain raw HRA whole-body coordinates',
)

for (const id of [
  'female-whole-body-runtime-admission',
  'fascial-layer',
  'skin-depth',
  'female-external-genital-surface',
]) {
  assert.ok(WHOLE_BODY_ASSET_GAPS.some((gap) => gap.id === id && gap.priority === 'P0'))
}

console.log('whole-body asset contract: compatible layers may assemble; incompatible sex/reference spaces remain fail-closed')
