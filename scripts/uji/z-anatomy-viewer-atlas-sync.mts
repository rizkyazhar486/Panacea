import assert from 'node:assert/strict'
import {
  clearAnatomySourceSelection,
  findReviewedAtlasTargetsForSourceSelection,
  getAnatomySourceSelectionSnapshot,
  publishAnatomySourceSelection,
  resolveReviewedAtlasTargetForSourceSelection,
  subscribeAnatomySourceSelection,
} from '../../src/lib/anatomySourceNodeRegistry.ts'

clearAnatomySourceSelection()
let updates = 0
const unsubscribe = subscribeAnatomySourceSelection(() => { updates += 1 })
publishAnatomySourceSelection('Patella.r', 'skeletal.glb')
assert.equal(updates, 1)
assert.equal(getAnatomySourceSelectionSnapshot().name, 'Patella.r')
assert.equal(getAnatomySourceSelectionSnapshot().file, 'skeletal.glb')
unsubscribe()

const patella = resolveReviewedAtlasTargetForSourceSelection({ name: 'Patella.r', file: 'skeletal.glb' })
assert.equal(patella?.structureId, 'knee-complex')
assert.equal(patella?.region, 'lower-limb')

const heart = resolveReviewedAtlasTargetForSourceSelection({ name: 'Heart', file: 'cardiovascular.glb' })
assert.equal(heart?.structureId, 'heart-great-vessels')
assert.equal(heart?.region, 'thorax')

const wrongLayer = resolveReviewedAtlasTargetForSourceSelection({ name: 'Heart', file: 'skeletal.glb' })
assert.equal(wrongLayer, null, 'source-file provenance must constrain reviewed-target resolution')

const femurTargets = findReviewedAtlasTargetsForSourceSelection({ name: 'Femur.r', file: 'skeletal.glb' })
assert.deepEqual(
  femurTargets.map((target) => target.structureId).sort(),
  ['hip-complex', 'knee-complex'],
  'femur participates in more than one reviewed teaching target',
)
assert.equal(
  resolveReviewedAtlasTargetForSourceSelection({ name: 'Femur.r', file: 'skeletal.glb' }),
  null,
  'an ambiguous exact source mesh must not be forced into one teaching context',
)

assert.equal(
  resolveReviewedAtlasTargetForSourceSelection({ name: 'Hippocampus', file: 'skeletal.glb' }),
  null,
  'short-token matching must not invent a hip mapping from hippocampus',
)

clearAnatomySourceSelection()
console.log('Z-Anatomy viewer picks synchronize only when one reviewed atlas target is unambiguous.')
