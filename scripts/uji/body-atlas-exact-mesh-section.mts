import assert from 'node:assert/strict'
import * as THREE from 'three'
import { intersectBodyAtlasSourceMeshesWithPlane } from '../../src/lib/bodyAtlasExactMeshSection.ts'

function namedMesh(geometry: THREE.BufferGeometry, originalName: string) {
  const mesh = new THREE.Mesh(geometry)
  mesh.userData.originalName = originalName
  return mesh
}

const boxRoot = new THREE.Group()
const box = namedMesh(new THREE.BoxGeometry(2, 2, 2), 'Synthetic box')
boxRoot.add(box)

const exact = intersectBodyAtlasSourceMeshesWithPlane({
  axis: 'x',
  coordinate: 0,
  candidates: [{ file: 'synthetic.glb', name: 'Synthetic box' }],
  sourceRoots: [{ file: 'synthetic.glb', root: boxRoot }],
})

assert.equal(exact.semantics, 'exact-source-triangle-plane-segments-not-assembled-contours')
assert.equal(exact.truncated, false)
assert.equal(exact.unresolvedCandidates.length, 0)
assert.equal(exact.sourceNodesExamined, 1)
assert.equal(exact.meshesExamined, 1)
assert.ok(exact.trianglesVisited > 0)
assert.ok(exact.segments.length > 0)
for (const segment of exact.segments) {
  assert.equal(segment.sourceFile, 'synthetic.glb')
  assert.equal(segment.sourceName, 'Synthetic box')
  assert.ok(Math.abs(segment.start[0]) <= 1e-6)
  assert.ok(Math.abs(segment.end[0]) <= 1e-6)
  assert.ok(segment.length > 0)
}

const missing = intersectBodyAtlasSourceMeshesWithPlane({
  axis: 'z',
  coordinate: 0,
  candidates: [{ file: 'synthetic.glb', name: 'Structure that does not exist' }],
  sourceRoots: [{ file: 'synthetic.glb', root: boxRoot }],
})
assert.equal(missing.segments.length, 0)
assert.deepEqual(missing.unresolvedCandidates, [{ file: 'synthetic.glb', name: 'Structure that does not exist' }])

const coplanarRoot = new THREE.Group()
const coplanar = namedMesh(new THREE.PlaneGeometry(2, 2), 'Coplanar sheet')
coplanar.rotateY(Math.PI / 2)
coplanarRoot.add(coplanar)
const coplanarResult = intersectBodyAtlasSourceMeshesWithPlane({
  axis: 'x',
  coordinate: 0,
  candidates: [{ file: 'coplanar.glb', name: 'Coplanar sheet' }],
  sourceRoots: [{ file: 'coplanar.glb', root: coplanarRoot }],
})
assert.equal(coplanarResult.segments.length, 0, 'Fully coplanar triangles must not be fabricated into a contour')
assert.ok(coplanarResult.coplanarTrianglesSkipped > 0)

const bounded = intersectBodyAtlasSourceMeshesWithPlane({
  axis: 'x',
  coordinate: 0,
  candidates: [{ file: 'synthetic.glb', name: 'Synthetic box' }],
  sourceRoots: [{ file: 'synthetic.glb', root: boxRoot }],
  maxTrianglesVisited: 1,
})
assert.equal(bounded.trianglesVisited, 1)
assert.equal(bounded.truncated, true)


for (const coordinate of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
  const invalidCoordinate = intersectBodyAtlasSourceMeshesWithPlane({
    axis: 'x',
    coordinate,
    candidates: [{ file: 'synthetic.glb', name: 'Synthetic box' }],
    sourceRoots: [{ file: 'synthetic.glb', root: boxRoot }],
  })
  assert.equal(invalidCoordinate.blockedReason, 'non-finite-coordinate')
  assert.equal(invalidCoordinate.segments.length, 0, 'Invalid coordinates must not silently render the zero plane')
  assert.equal(invalidCoordinate.sourceNodesExamined, 0)
  assert.equal(invalidCoordinate.meshesExamined, 0)
  assert.equal(invalidCoordinate.trianglesVisited, 0)
}


const corruptRoot = new THREE.Group()
const validBeforeCorrupt = namedMesh(new THREE.BoxGeometry(2, 2, 2), 'Valid before corrupt')
const corruptGeometry = new THREE.BufferGeometry()
corruptGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
  Number.NaN, -1, 0,
  1, 1, 0,
  1, -1, 0,
], 3))
const corruptMesh = namedMesh(corruptGeometry, 'Corrupt source mesh')
corruptRoot.add(validBeforeCorrupt, corruptMesh)

const corruptResult = intersectBodyAtlasSourceMeshesWithPlane({
  axis: 'x',
  coordinate: 0,
  candidates: [
    { file: 'corrupt.glb', name: 'Valid before corrupt' },
    { file: 'corrupt.glb', name: 'Corrupt source mesh' },
  ],
  sourceRoots: [{ file: 'corrupt.glb', root: corruptRoot }],
})
assert.equal(corruptResult.blockedReason, 'non-finite-source-geometry')
assert.equal(corruptResult.segments.length, 0, 'Any invalid source triangle must fail the entire section closed')
assert.deepEqual(corruptResult.blockedSource, {
  file: 'corrupt.glb',
  sourceName: 'Corrupt source mesh',
  meshName: 'Corrupt source mesh',
  triangleIndex: 0,
})
assert.equal(corruptResult.truncated, false)


console.log(`body-atlas-exact-mesh-section: ok (${exact.segments.length} raw source-triangle segments)`)
