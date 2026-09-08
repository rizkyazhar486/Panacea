import assert from 'node:assert/strict'
import { WholeBodyAtlasEngine } from '../../src/lib/anatomy/engine.ts'

const atlas = new WholeBodyAtlasEngine()
const validation = atlas.validate()
assert.equal(validation.valid, true, validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'))

for (const id of [
  'right-atrium', 'right-ventricle', 'left-atrium', 'left-ventricle',
  'tricuspid-valve', 'pulmonary-valve', 'mitral-valve', 'aortic-valve',
  'left-main-coronary-artery', 'left-anterior-descending-artery', 'right-coronary-artery',
  'brachiocephalic-trunk', 'right-internal-carotid-artery', 'right-middle-cerebral-artery',
  'right-popliteal-vein', 'right-posterior-tibial-vein', 'right-common-femoral-vein',
]) {
  assert.ok(atlas.get(id), `Missing required deep circulation structure ${id}`)
}

const coronary = atlas.tracePath('ascending-aorta', 'left-anterior-descending-artery', {
  allowedTypes: ['branches-to'],
})
assert.ok(coronary)
assert.deepEqual(coronary.nodeIds, [
  'ascending-aorta',
  'left-main-coronary-artery',
  'left-anterior-descending-artery',
])
assert.ok(coronary.edges.every((edge) => edge.type === 'branches-to'))

const cerebral = atlas.tracePath('aortic-arch', 'right-middle-cerebral-artery', {
  allowedTypes: ['branches-to'],
})
assert.ok(cerebral)
assert.deepEqual(cerebral.nodeIds, [
  'aortic-arch',
  'brachiocephalic-trunk',
  'right-common-carotid',
  'right-internal-carotid-artery',
  'right-middle-cerebral-artery',
])

const posteriorCerebral = atlas.tracePath('aortic-arch', 'right-posterior-cerebral-artery', {
  allowedTypes: ['branches-to'],
})
assert.ok(posteriorCerebral)
assert.ok(posteriorCerebral.nodeIds.includes('right-vertebral-artery'))
assert.ok(posteriorCerebral.nodeIds.includes('basilar-artery'))

const deepVenousReturn = atlas.tracePath('right-posterior-tibial-vein', 'inferior-vena-cava', {
  allowedTypes: ['drains-to'],
})
assert.ok(deepVenousReturn)
assert.deepEqual(deepVenousReturn.nodeIds, [
  'right-posterior-tibial-vein',
  'right-popliteal-vein',
  'right-common-femoral-vein',
  'inferior-vena-cava',
])
assert.ok(deepVenousReturn.edges.every((edge) => edge.type === 'drains-to'))

const cardiacFlow = atlas.tracePath('right-atrium', 'ascending-aorta', {
  allowedTypes: ['communicates-with'],
  maxHops: 12,
})
assert.equal(cardiacFlow, null, 'Pulmonary circulation must not be silently skipped when only direct chamber/valve communication edges are allowed.')

const mcaCoverage = atlas.sourceCoverageFor('right-middle-cerebral-artery')
assert.ok(mcaCoverage)
// Source coverage is deliberately allowed to be unresolved; the compiler must
// report reality instead of promoting a semantic node to fake shipped geometry.
assert.ok(mcaCoverage.status === 'resolved' || mcaCoverage.status === 'unresolved')
if (mcaCoverage.status === 'resolved') {
  assert.ok(mcaCoverage.sourceNodeCount > 0)
  assert.ok(mcaCoverage.triangles > 0)
}

console.log(`Deep circulation atlas verified: ${atlas.structures.length} total semantic structures with deterministic coronary, cerebral arterial, and lower-limb venous paths.`)
