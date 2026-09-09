import assert from 'node:assert/strict'
import * as THREE from 'three'
import type { StrukturTubuh } from '../../src/lib/bodyIndex.gen.ts'
import { compileBodyAtlasGraph } from '../../src/lib/bodyAtlasGraph.ts'
import {
  buildAnatomySpatialIndex,
  extractAnatomySpatialNodes,
  nearestAnatomySpatialNodes,
  queryAnatomyNormalizedPlane,
  queryAnatomyPlane,
  unionAnatomySpatialBounds,
  validateAnatomySpatialIndex,
} from '../../src/lib/anatomySpatialRegistry.ts'
import {
  bindAnatomySpatialIndexToAtlas,
  computeBodyAtlasCameraFrameForNodes,
  queryBodyAtlasCrossSection,
  queryBodyAtlasNeighborhood,
  validateBodyAtlasSpatialBinding,
} from '../../src/lib/bodyAtlasSpatialEngine.ts'

function namedBox(name: string, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  const group = new THREE.Group()
  group.userData.originalName = name
  group.position.set(x, y, z)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshBasicMaterial())
  group.add(mesh)
  return group
}

const root = new THREE.Group()
root.add(namedBox('Synthetic lung.l', -2, 0, 0, 2, 4, 3))
root.add(namedBox('Synthetic lung.r', 2, 0, 0, 2, 4, 3))
const nestedParent = new THREE.Group()
nestedParent.userData.originalName = 'Synthetic airway tree'
nestedParent.position.set(0, 2.5, 0)
nestedParent.add(namedBox('Synthetic main bronchus.l', -0.6, 0, 0, 0.5, 1, 0.5))
nestedParent.add(namedBox('Synthetic main bronchus.r', 0.6, 0, 0, 0.5, 1, 0.5))
root.add(nestedParent)
root.add(namedBox('HOW TO USE THIS MODEL', 0, 100, 0, 10, 10, 10))

const spatialNodes = extractAnatomySpatialNodes(root, 'visceral.glb')
assert.equal(spatialNodes.some((node) => node.name.startsWith('HOW TO')), false)
assert.equal(spatialNodes.length, 5)
const spatialIndex = buildAnatomySpatialIndex(spatialNodes)
const spatialValidation = validateAnatomySpatialIndex(spatialIndex)
assert.equal(spatialValidation.valid, true, spatialValidation.reasons.join('\n'))
assert.ok(spatialIndex.bounds)
assert.ok(spatialIndex.bounds.max[1] < 10, 'Instruction geometry must not contaminate atlas bounds.')

const leftLung = spatialNodes.find((node) => node.name === 'Synthetic lung.l')
const rightLung = spatialNodes.find((node) => node.name === 'Synthetic lung.r')
const airwayTree = spatialNodes.find((node) => node.name === 'Synthetic airway tree')
assert.ok(leftLung)
assert.ok(rightLung)
assert.ok(airwayTree)
assert.ok(airwayTree.min[0] < 0)
assert.ok(airwayTree.max[0] > 0)
assert.ok(airwayTree.size[0] > 1)

const leftPlaneHits = queryAnatomyPlane({ axis: 'x', coordinate: -2, tolerance: 0 }, spatialIndex)
assert.equal(leftPlaneHits.some((hit) => hit.node.name === 'Synthetic lung.l'), true)
assert.equal(leftPlaneHits.some((hit) => hit.node.name === 'Synthetic lung.r'), false)
const normalizedMid = queryAnatomyNormalizedPlane('x', 0.5, {}, spatialIndex)
assert.ok(Math.abs(normalizedMid.coordinate) < 1e-9)
assert.equal(normalizedMid.hits.some((hit) => hit.node.name === 'Synthetic airway tree'), true)
const nearestLeft = nearestAnatomySpatialNodes([-2, 0, 0], { maxDistance: 10, limit: 2 }, spatialIndex)
assert.equal(nearestLeft[0].node.name, 'Synthetic lung.l')
assert.equal(nearestLeft[0].distance, 0)

const union = unionAnatomySpatialBounds([leftLung, rightLung])
assert.ok(union)
assert.ok(Math.abs(union.center[0]) < 1e-9)
assert.ok(union.size[0] >= 6)

const structures: StrukturTubuh[] = [
  { n: 'Synthetic lung.l', b: 'Synthetic lung', l: 'visceral', s: 'kiri', y: 0.7, r: 0.2, w: 'toraks', t: 100 },
  { n: 'Synthetic lung.r', b: 'Synthetic lung', l: 'visceral', s: 'kanan', y: 0.7, r: 0.2, w: 'toraks', t: 100 },
  { n: 'Synthetic airway tree', b: 'Synthetic airway tree', l: 'visceral', s: 'tengah', y: 0.76, r: 0.05, w: 'toraks', t: 100 },
  { n: 'Synthetic main bronchus.l', b: 'Synthetic main bronchus', l: 'visceral', s: 'kiri', y: 0.75, r: 0.08, w: 'toraks', t: 100 },
  { n: 'Synthetic main bronchus.r', b: 'Synthetic main bronchus', l: 'visceral', s: 'kanan', y: 0.75, r: 0.08, w: 'toraks', t: 100 },
]
const graph = compileBodyAtlasGraph(structures)
const binding = bindAnatomySpatialIndexToAtlas(spatialIndex, graph)
assert.equal(binding.boundCount, 5)
assert.equal(binding.unboundCount, 0)
const bindingValidation = validateBodyAtlasSpatialBinding(spatialIndex, graph)
assert.equal(bindingValidation.valid, true, bindingValidation.reasons.join('\n'))

const crossSection = queryBodyAtlasCrossSection({ axis: 'x', normalizedPosition: 0.5, layers: ['visceral'], regions: ['toraks'], limit: 10 }, spatialIndex, graph)
assert.equal(crossSection.candidateSemantics, 'aabb-plane-candidate-not-exact-mesh-contour')
assert.equal(crossSection.hits.some((hit) => hit.atlasNode?.sourceName === 'Synthetic airway tree'), true)
assert.equal(crossSection.hits.every((hit) => hit.atlasNode?.region === 'toraks'), true)

const leftGraphNode = graph.nodes.find((node) => node.sourceName === 'Synthetic lung.l')
assert.ok(leftGraphNode)
const neighborhood = queryBodyAtlasNeighborhood(leftGraphNode.id, { maxDistance: 10, limit: 4, sameRegion: true }, spatialIndex, graph)
assert.ok(neighborhood)
assert.equal(neighborhood.center.atlasNode?.sourceName, 'Synthetic lung.l')
assert.equal(neighborhood.neighbors.some((neighbor) => neighbor.atlasNode?.sourceName === 'Synthetic lung.r'), true)
const camera = computeBodyAtlasCameraFrameForNodes([leftLung, rightLung], { verticalFovDeg: 35, aspect: 16 / 9, padding: 1.2 })
assert.ok(camera)
assert.ok(camera.distance > camera.boundingRadius)
assert.ok(camera.far > camera.near)
assert.ok(camera.horizontalFovDeg > camera.verticalFovDeg)

console.log('Body spatial registry: source AABBs, broad-phase sections, exact graph binding, neighborhood and camera-fit verified.')
