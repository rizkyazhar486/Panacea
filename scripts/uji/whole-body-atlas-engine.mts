import assert from 'node:assert/strict'
import { WholeBodyAtlasEngine } from '../../src/lib/anatomy/engine.ts'

const atlas = new WholeBodyAtlasEngine()
const validation = atlas.validate()
assert.equal(validation.valid, true, validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'))
assert.ok(atlas.structures.length >= 200, `Expected >=200 whole-body structures, got ${atlas.structures.length}`)

assert.equal(atlas.resolve('left lower lobe').candidates[0]?.structure.id, 'left-lower-lobe')
const genericLung = atlas.resolve('lung')
assert.equal(genericLung.status, 'ambiguous')
assert.deepEqual(genericLung.candidates.map((candidate) => candidate.structure.id), ['left-lung', 'right-lung'])
const bothLungs = atlas.resolve('lung', { mode: 'composite' })
assert.equal(bothLungs.status, 'resolved')
assert.deepEqual(bothLungs.candidates.map((candidate) => candidate.structure.id), ['left-lung', 'right-lung'])
const rightKidney = atlas.resolve('kidney', { laterality: 'right' })
assert.equal(rightKidney.status, 'resolved')
assert.equal(rightKidney.candidates[0]?.structure.id, 'right-kidney')

const respiratoryDescendants = new Set(atlas.descendants('respiratory-system').map((structure) => structure.id))
for (const expected of ['nasal-cavity','trachea','right-main-bronchus','left-main-bronchus','right-upper-lobe','left-lower-lobe','rll-posterior-basal-segment','lll-posterior-basal-segment','alveolus']) {
  assert.ok(respiratoryDescendants.has(expected), `Respiratory hierarchy is missing ${expected}`)
}
const airwayNeighbors = atlas.neighbors('carina', ['branches-to']).map((structure) => structure.id)
assert.deepEqual(airwayNeighbors, ['left-main-bronchus', 'right-main-bronchus'])
assert.equal(atlas.resolve('right B10 bronchus').candidates[0]?.structure.id, 'rll-posterior-basal-segmental-bronchus')

const firstPlan = atlas.buildLoadPlan({
  visibleStructureIds: ['right-lung','left-lung','heart'],
  clinicalFocusStructureIds: ['right-lung'],
  pinnedStructureIds: ['heart'],
})
const secondPlan = atlas.buildLoadPlan({
  visibleStructureIds: ['right-lung','left-lung','heart'],
  clinicalFocusStructureIds: ['right-lung'],
  pinnedStructureIds: ['heart'],
})
assert.ok(firstPlan.length >= 2)
assert.deepEqual(firstPlan.map((item) => [item.asset.id,item.score]), secondPlan.map((item) => [item.asset.id,item.score]))
assert.ok(firstPlan.every((item,index) => index === 0 || firstPlan[index - 1].score >= item.score))

const pulmonaryBridge = atlas.resolveProjectionTargetById('pulmonary-core')
assert.ok(pulmonaryBridge)
assert.ok(pulmonaryBridge.structures.some((structure) => structure.id === 'trachea'))
assert.ok(pulmonaryBridge.structures.some((structure) => structure.id === 'right-lung'))
assert.ok(pulmonaryBridge.structures.some((structure) => structure.id === 'left-lung'))

console.log(`Whole Body Atlas Engine verified: ${atlas.structures.length} structures, ${atlas.assets.length} progressive asset groups, deterministic fail-closed resolution, respiratory hierarchy, graph traversal, and load planning.`)
