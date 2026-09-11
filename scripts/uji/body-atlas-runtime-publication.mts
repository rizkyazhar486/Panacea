import assert from 'node:assert/strict'
import * as THREE from 'three'
import {
  anatomySourceNodeOrigin,
  getAnatomySourceNodeSnapshot,
} from '../../src/lib/anatomySourceNodeRegistry.ts'
import {
  getAnatomySpatialIndex,
  validateAnatomySpatialIndex,
} from '../../src/lib/anatomySpatialRegistry.ts'
import {
  clearBodyAtlasRuntimeLayer,
  publishBodyAtlasRuntimeLayer,
} from '../../src/lib/bodyAtlasRuntimePublication.ts'

const root = new THREE.Group()
const named = new THREE.Group()
named.userData.originalName = 'Synthetic spatial organ'
named.position.set(1, 2, 3)
named.add(new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6), new THREE.MeshBasicMaterial()))
root.add(named)

const groupingOnly = new THREE.Group()
groupingOnly.userData.originalName = 'Grouping only without geometry'
root.add(groupingOnly)

const file = 'synthetic-runtime.glb'
const publication = publishBodyAtlasRuntimeLayer(file, root)
assert.equal(publication.namedNodeCount, 1)
assert.equal(publication.spatialNodeCount, 1)
assert.equal(publication.sourceSpatialParity, true)
assert.deepEqual(publication.sourceNames, ['Synthetic spatial organ'])
assert.equal(publication.spatialNodes[0].file, file)
assert.deepEqual(publication.spatialNodes[0].center.map((value) => Number(value.toFixed(6))), [1, 2, 3])
assert.deepEqual(publication.spatialNodes[0].size.map((value) => Number(value.toFixed(6))), [2, 4, 6])

const runtimeBundle = getAnatomySourceNodeSnapshot().find((bundle) => bundle.file === file)
assert.ok(runtimeBundle)
assert.deepEqual(runtimeBundle.names, ['Synthetic spatial organ'])
assert.equal(anatomySourceNodeOrigin(file), 'runtime')

const spatialIndex = getAnatomySpatialIndex()
assert.equal(spatialIndex.nodes.length, 1)
assert.equal(spatialIndex.nodes[0].name, 'Synthetic spatial organ')
const spatialValidation = validateAnatomySpatialIndex(spatialIndex)
assert.equal(spatialValidation.valid, true, spatialValidation.reasons.join('\n'))

clearBodyAtlasRuntimeLayer(file)
assert.equal(getAnatomySourceNodeSnapshot().some((bundle) => bundle.file === file), false)
assert.equal(getAnatomySpatialIndex().nodes.length, 0)
assert.equal(anatomySourceNodeOrigin(file), 'generated-index')

named.traverse((child) => {
  if (!(child instanceof THREE.Mesh)) return
  child.geometry.dispose()
  const materials = Array.isArray(child.material) ? child.material : [child.material]
  for (const material of materials) material.dispose()
})

console.log('Body atlas runtime publication: source-name and source-space AABB registries publish/clear atomically from one loaded GLTF layer.')
