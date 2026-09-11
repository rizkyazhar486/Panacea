import assert from 'node:assert/strict'
import { HD_MESH_QUALITY_BUDGETS, evaluateHdMeshQuality } from '../../src/lib/anatomy/hdMeshQuality.ts'

assert.deepEqual(HD_MESH_QUALITY_BUDGETS.map((budget) => budget.lod), ['overview', 'organ', 'detail'])
for (const budget of HD_MESH_QUALITY_BUDGETS) {
  assert.ok(budget.maxSimplificationErrorFraction > 0)
  assert.ok(budget.maxDegenerateTriangleFraction >= 0)
  assert.equal(budget.minNamedBoundaryRetention, 1)
}
assert.ok(
  HD_MESH_QUALITY_BUDGETS.find((budget) => budget.lod === 'detail')!.maxSimplificationErrorFraction
    < HD_MESH_QUALITY_BUDGETS.find((budget) => budget.lod === 'organ')!.maxSimplificationErrorFraction,
  'Detail LOD must have a stricter geometric-error budget than organ LOD.',
)

const passing = evaluateHdMeshQuality({
  assetId: 'synthetic-lung-detail',
  lod: 'detail',
  vertexCount: 180_000,
  triangleCount: 360_000,
  sourceBoundingDiagonal: 500,
  maxSurfaceError: 0.5,
  degenerateTriangleCount: 0,
  invalidNormalCount: 0,
  selfIntersectionCount: 0,
  unintendedBoundaryEdgeCount: 0,
  namedBoundaryCount: 5,
  retainedNamedBoundaryCount: 5,
  leftRightIdentityPreserved: true,
  anatomicalAxesPreserved: true,
  sourceTransformPreserved: true,
})
assert.equal(passing.passesTechnicalHdGate, true, passing.reasons.join('\n'))
assert.ok(Math.abs(passing.simplificationErrorFraction - 0.001) < 1e-12)
assert.equal(passing.namedBoundaryRetention, 1)

const broken = evaluateHdMeshQuality({
  assetId: 'synthetic-broken-lung',
  lod: 'detail',
  vertexCount: 200,
  triangleCount: 100,
  sourceBoundingDiagonal: 100,
  maxSurfaceError: 10,
  degenerateTriangleCount: 10,
  invalidNormalCount: 3,
  selfIntersectionCount: 2,
  unintendedBoundaryEdgeCount: 8,
  namedBoundaryCount: 5,
  retainedNamedBoundaryCount: 3,
  leftRightIdentityPreserved: false,
  anatomicalAxesPreserved: false,
  sourceTransformPreserved: false,
})
assert.equal(broken.passesTechnicalHdGate, false)
assert.match(broken.reasons.join('\n'), /Surface simplification error/i)
assert.match(broken.reasons.join('\n'), /Degenerate-triangle fraction/i)
assert.match(broken.reasons.join('\n'), /invalid normals/i)
assert.match(broken.reasons.join('\n'), /self-intersections/i)
assert.match(broken.reasons.join('\n'), /open boundary edges/i)
assert.match(broken.reasons.join('\n'), /named anatomical boundaries were lost/i)
assert.match(broken.reasons.join('\n'), /Left\/right identity/i)
assert.match(broken.reasons.join('\n'), /Anatomical axes/i)
assert.match(broken.reasons.join('\n'), /voxel\/world transform/i)

const noNamedBoundaries = evaluateHdMeshQuality({
  assetId: 'synthetic-trachea-overview',
  lod: 'overview',
  vertexCount: 3_000,
  triangleCount: 5_000,
  sourceBoundingDiagonal: 200,
  maxSurfaceError: 2,
  degenerateTriangleCount: 0,
  invalidNormalCount: 0,
  selfIntersectionCount: 0,
  unintendedBoundaryEdgeCount: 0,
  namedBoundaryCount: 0,
  retainedNamedBoundaryCount: 0,
  leftRightIdentityPreserved: true,
  anatomicalAxesPreserved: true,
  sourceTransformPreserved: true,
})
assert.equal(noNamedBoundaries.passesTechnicalHdGate, true, noNamedBoundaries.reasons.join('\n'))
assert.equal(noNamedBoundaries.namedBoundaryRetention, 1)

console.log('HD mesh technical fidelity, topology, boundary-retention and orientation gates verified without promoting medical validation.')
