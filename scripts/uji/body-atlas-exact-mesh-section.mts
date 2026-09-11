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

console.log(`body-atlas-exact-mesh-section: ok (${exact.segments.length} raw source-triangle segments)`)
