import assert from 'node:assert/strict'
import { WholeBodyAtlasEngine } from '../../src/lib/anatomy/engine.ts'

const atlas = new WholeBodyAtlasEngine()
const validation = atlas.validate()
assert.equal(validation.valid, true, validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'))

for (const id of [
  'right-frontal-lobe', 'left-frontal-lobe',
  'right-insula', 'left-insula',
  'right-thalamus', 'left-thalamus',
  'right-internal-capsule', 'left-internal-capsule',
  'midbrain', 'pons', 'medulla-oblongata',
  'right-mca-m1', 'right-mca-m2', 'right-mca-m3', 'right-mca-m4',
  'right-aca-a1', 'right-aca-a5',
  'right-pca-p1', 'right-pca-p4',
  'right-pica', 'right-aica', 'right-superior-cerebellar-artery',
]) {
  assert.ok(atlas.get(id), `Missing neurovascular structure ${id}`)
}

assert.equal(atlas.resolve('right M1').candidates[0]?.structure.id, 'right-mca-m1')
assert.equal(atlas.resolve('left P4').candidates[0]?.structure.id, 'left-pca-p4')
assert.equal(atlas.resolve('right A2').candidates[0]?.structure.id, 'right-aca-a2')

const mcaSegmentPath = atlas.tracePath('right-internal-carotid-artery', 'right-mca-m4', {
  allowedTypes: ['branches-to'],
})
assert.ok(mcaSegmentPath)
assert.deepEqual(mcaSegmentPath.nodeIds, [
  'right-internal-carotid-artery',
  'right-middle-cerebral-artery',
  'right-mca-m1',
  'right-mca-m2',
  'right-mca-m3',
  'right-mca-m4',
])

const pcaSegmentPath = atlas.tracePath('basilar-artery', 'right-pca-p4', {
  allowedTypes: ['branches-to'],
})
assert.ok(pcaSegmentPath)
assert.deepEqual(pcaSegmentPath.nodeIds.slice(0, 2), ['basilar-artery', 'right-posterior-cerebral-artery'])
assert.equal(pcaSegmentPath.nodeIds.at(-1), 'right-pca-p4')

const rightMcaTerritory = new Set(atlas.neighbors('right-middle-cerebral-artery', ['supplies']).map((node) => node.id))
for (const expected of [
  'right-lateral-frontal-cortex',
  'right-lateral-parietal-cortex',
  'right-lateral-temporal-cortex',
  'right-insula',
]) {
  assert.ok(rightMcaTerritory.has(expected), `Right MCA educational territory is missing ${expected}`)
}
assert.equal(rightMcaTerritory.has('left-insula'), false, 'Territory mapping must preserve laterality.')

const rightPcaTerritory = new Set(atlas.neighbors('right-posterior-cerebral-artery', ['supplies']).map((node) => node.id))
assert.ok(rightPcaTerritory.has('right-visual-occipital-cortex'))
assert.ok(rightPcaTerritory.has('right-medial-temporal-cortex'))
assert.ok(rightPcaTerritory.has('right-thalamus'))

const picaTerritory = atlas.neighbors('right-pica', ['supplies']).map((node) => node.id)
assert.deepEqual(picaTerritory, ['right-posteroinferior-cerebellar-surface'])

const m1Coverage = atlas.sourceCoverageFor('right-mca-m1')
assert.ok(m1Coverage)
assert.ok(m1Coverage.status === 'resolved' || m1Coverage.status === 'unresolved')
if (m1Coverage.status === 'resolved') {
  assert.ok(m1Coverage.sourceNodeCount > 0)
  assert.ok(m1Coverage.triangles > 0)
}

console.log(`Neurovascular atlas verified: ${atlas.structures.length} total structures with ACA/MCA/PCA segment chains, posterior circulation branches, and laterality-preserving educational territory anchors.`)
