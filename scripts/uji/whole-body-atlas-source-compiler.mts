import assert from 'node:assert/strict'
import { WholeBodyAtlasEngine } from '../../src/lib/anatomy/engine.ts'

const atlas = new WholeBodyAtlasEngine()
const compilation = atlas.compileSources()

assert.equal(compilation.totals.structureCount, atlas.structures.length)
assert.equal(
  compilation.totals.resolvedStructureCount + compilation.totals.unresolvedStructureCount,
  compilation.totals.structureCount,
)
assert.ok(compilation.totals.resolvedStructureCount > 0, 'At least some semantic atlas structures must bind to shipped GLB source nodes.')
assert.ok(compilation.totals.uniqueSourceNodeCount > 0, 'Compiler must expose real indexed source-node names.')
assert.ok(compilation.totals.uniqueTriangles > 0, 'Compiler must calculate a non-zero triangle footprint from bodyIndex.gen.ts.')
assert.ok(compilation.totals.resolutionRatio > 0 && compilation.totals.resolutionRatio <= 1)

const abdominalAorta = atlas.sourceCoverageFor('abdominal-aorta')
assert.ok(abdominalAorta, 'Expected abdominal-aorta semantic structure in the whole-body catalogue.')
assert.equal(abdominalAorta.status, 'resolved', 'Abdominal aorta is present in the shipped cardiovascular GLB index and must resolve.')
assert.ok(abdominalAorta.sourceNodeNames.includes('Abdominal aorta'))
assert.ok(abdominalAorta.triangles > 0)
assert.ok(abdominalAorta.indexedRegions.includes('abdomen'))
assert.equal(abdominalAorta.mismatches.some((entry) => entry.code === 'laterality-mismatch'), false)

const respiratoryAsset = compilation.assets.find((entry) => entry.asset.id === 'respiratory-deep-atlas')
assert.ok(respiratoryAsset, 'Expected respiratory-deep-atlas logical asset group.')
assert.ok(respiratoryAsset.declaredLod0Triangles > 0)
assert.ok(Number.isFinite(respiratoryAsset.triangleBudgetRatio))

// Missing bindings and LOD underflow are surfaced as explicit engineering data,
// not silently converted into fake geometry or a false "complete" status.
for (const entry of compilation.structures) {
  if (entry.status === 'unresolved') assert.equal(entry.sourceNodeNames.length, 0)
  if (entry.status === 'resolved') assert.ok(entry.sourceNodeNames.length > 0)
}
for (const entry of compilation.assets) {
  for (const mismatch of entry.mismatches) {
    assert.equal(mismatch.code, 'declared-budget-underflow')
    assert.ok(entry.actualTriangles > entry.declaredLod0Triangles)
  }
}

const context = {
  visibleStructureIds: ['abdominal-aorta', 'heart', 'right-lung', 'left-lung'],
  clinicalFocusStructureIds: ['right-lung'],
  interactionStructureIds: ['abdominal-aorta'],
  pinnedStructureIds: ['heart'],
  transferBudgetMB: 64,
} as const

const firstPlan = atlas.buildMeasuredLoadPlan(context)
const secondPlan = atlas.buildMeasuredLoadPlan(context)
assert.ok(firstPlan.length > 0)
assert.deepEqual(
  firstPlan.map((entry) => [entry.asset.id, entry.score, entry.measuredTriangles, entry.estimatedTransferMB]),
  secondPlan.map((entry) => [entry.asset.id, entry.score, entry.measuredTriangles, entry.estimatedTransferMB]),
  'Measured source planning must be deterministic for the same atlas/context.',
)
assert.ok(firstPlan.every((entry, index) => index === 0 || firstPlan[index - 1].score >= entry.score))
assert.ok(firstPlan.reduce((sum, entry) => sum + entry.estimatedTransferMB, 0) <= context.transferBudgetMB || firstPlan.length === 1)
assert.ok(firstPlan.some((entry) => entry.measuredTriangles > 0), 'At least one planned asset must use measured/indexed triangle cost.')

console.log(
  `Whole-body source compiler verified: ${compilation.totals.resolvedStructureCount}/${compilation.totals.structureCount} semantic structures resolve to ${compilation.totals.uniqueSourceNodeCount} indexed nodes (${compilation.totals.uniqueTriangles.toLocaleString()} unique triangles); measured load planning is deterministic.`,
)
