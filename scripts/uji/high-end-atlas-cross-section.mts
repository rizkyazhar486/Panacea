import assert from 'node:assert/strict'
import {
  CANONICAL_GENERIC_ATLAS_FRAME,
  atlasToWorld,
  validateAtlasCoordinateFrame,
  worldAabbToAtlas,
  worldToAtlas,
  type AtlasCoordinateFrame,
} from '../../src/lib/anatomy/atlasCoordinateFrame.ts'
import {
  createAtlasSectionPlane,
  moveSectionPlane,
  planeBasis,
  pointInPlaneCoordinates,
  queryNodesForSection,
  sectionIntersectsAabb,
  sectionNormalLength,
} from '../../src/lib/anatomy/atlasCrossSection.ts'
import { atlasGeometryEntitlement, planAtlasNavigation } from '../../src/lib/anatomy/atlasNavigation.ts'
import { PANACEA_ANATOMY_ATLAS } from '../../src/lib/anatomy/atlasRegistry.ts'
import type { AnatomyAssetDescriptor, AnatomyProvenance } from '../../src/lib/anatomy/atlasTypes.ts'

const canonicalValidation = validateAtlasCoordinateFrame(CANONICAL_GENERIC_ATLAS_FRAME)
assert.equal(canonicalValidation.valid, true)

const rotatedFrame: AtlasCoordinateFrame = {
  id: 'fixture-rotated-frame',
  origin: { x: 10, y: 20, z: 30 },
  right: { x: 0, y: 0, z: 1 },
  superior: { x: 0, y: 1, z: 0 },
  anterior: { x: -1, y: 0, z: 0 },
  scope: 'generic-atlas',
  note: 'Fixture only.',
}
assert.equal(validateAtlasCoordinateFrame(rotatedFrame).valid, true)
const worldPoint = { x: 8, y: 23, z: 34 }
const atlasPoint = worldToAtlas(worldPoint, rotatedFrame)
const roundTrip = atlasToWorld(atlasPoint, rotatedFrame)
assert.ok(Math.abs(roundTrip.x - worldPoint.x) < 1e-9)
assert.ok(Math.abs(roundTrip.y - worldPoint.y) < 1e-9)
assert.ok(Math.abs(roundTrip.z - worldPoint.z) < 1e-9)

const invalidLeftHanded: AtlasCoordinateFrame = {
  ...CANONICAL_GENERIC_ATLAS_FRAME,
  id: 'fixture-left-handed',
  anterior: { x: 0, y: 0, z: -1 },
}
const invalidValidation = validateAtlasCoordinateFrame(invalidLeftHanded)
assert.equal(invalidValidation.valid, false)
assert.ok(invalidValidation.errors.some((error) => error.includes('right-handed')))

const transformedBounds = worldAabbToAtlas({
  min: { x: 8, y: 19, z: 29 },
  max: { x: 12, y: 21, z: 31 },
}, rotatedFrame)
assert.ok(transformedBounds.min.x <= transformedBounds.max.x)
assert.ok(transformedBounds.min.y <= transformedBounds.max.y)
assert.ok(transformedBounds.min.z <= transformedBounds.max.z)

const axial = createAtlasSectionPlane('axial', 0, 0.2)
const coronal = createAtlasSectionPlane('coronal', 0)
const sagittal = createAtlasSectionPlane('sagittal', 0)
const oblique = createAtlasSectionPlane('oblique', 0, 0.5, { x: 1, y: 1, z: 1 })
assert.ok(Math.abs(sectionNormalLength(oblique) - 1) < 1e-9)
for (const plane of [axial, coronal, sagittal, oblique]) {
  const basis = planeBasis(plane)
  const dot = basis.u.x * basis.v.x + basis.u.y * basis.v.y + basis.u.z * basis.v.z
  assert.ok(Math.abs(dot) < 1e-9)
}

const centeredBounds = { min: { x: -1, y: -1, z: -1 }, max: { x: 1, y: 1, z: 1 } }
assert.equal(sectionIntersectsAabb(axial, centeredBounds), true)
assert.equal(sectionIntersectsAabb(moveSectionPlane(axial, 5), centeredBounds), false)
const coordinates = pointInPlaneCoordinates({ x: 2, y: 3, z: 4 }, axial)
assert.equal(coordinates.signedDistance, 3)

const heart = PANACEA_ANATOMY_ATLAS.get('cardiovascular-heart')!
const rightLung = PANACEA_ANATOMY_ATLAS.get('resp-right-lung')!
const sectionHits = queryNodesForSection([
  { ...heart, spatialBounds: centeredBounds },
  { ...rightLung, spatialBounds: { min: { x: 3, y: -0.5, z: -1 }, max: { x: 5, y: 0.5, z: 1 } } },
], sagittal)
assert.deepEqual(sectionHits.map((hit) => hit.node.id), ['cardiovascular-heart'])

const heartNavigation = planAtlasNavigation({ query: 'heart' })
assert.equal(heartNavigation.status, 'resolved')
if (heartNavigation.status === 'resolved') {
  assert.equal(heartNavigation.node.id, 'cardiovascular-heart')
  assert.equal(heartNavigation.geometryEntitlement, 'source-candidate')
  assert.deepEqual(heartNavigation.lineage.map((node) => node.id), ['system-cardiovascular', 'cardiovascular-heart'])
}

const alveolarNavigation = planAtlasNavigation({ query: 'alveoli' })
assert.equal(alveolarNavigation.status, 'resolved')
if (alveolarNavigation.status === 'resolved') {
  assert.equal(alveolarNavigation.node.id, 'resp-alveolar-layer')
  assert.equal(alveolarNavigation.geometryEntitlement, 'conceptual-only')
  assert.ok(alveolarNavigation.lineage.some((node) => node.id === 'resp-gas-exchange-zone'))
}
assert.equal(planAtlasNavigation({ query: 'alveolar' }).status, 'unresolved', 'Partial search terms must not silently choose an anatomy target.')
assert.equal(atlasGeometryEntitlement(heart), 'source-candidate')

const draftProvenance: AnatomyProvenance = {
  sourceId: 'fixture',
  sourceVersion: 'fixture-v1',
  sourceLocator: 'fixture://asset',
  evidenceKind: 'internal-structural',
  academicReview: 'pending',
  modelAssetReview: 'pending',
}
const heartAsset: AnatomyAssetDescriptor = {
  id: 'heart-runtime-fixture',
  nodeId: 'cardiovascular-heart',
  system: 'cardiovascular',
  regions: ['thorax'],
  diameterWorldUnits: 2,
  compression: 'meshopt',
  provenance: draftProvenance,
  lods: [
    { level: 0, resourceKey: 'heart-runtime-lod0', minProjectedPixels: 0, estimatedGpuBytes: 1_000_000 },
    { level: 1, resourceKey: 'heart-runtime-lod1', minProjectedPixels: 120, estimatedGpuBytes: 2_000_000 },
  ],
}
const plannedRuntime = planAtlasNavigation({
  query: 'heart',
  assets: [heartAsset],
  camera: { distanceToTarget: 5, verticalFovRadians: Math.PI / 3, viewportHeightPx: 844 },
  gpuBudgetBytes: 4_000_000,
})
assert.equal(plannedRuntime.status, 'resolved')
if (plannedRuntime.status === 'resolved') {
  assert.ok(plannedRuntime.loadPlan)
  assert.equal(plannedRuntime.loadPlan?.load.length, 1)
  assert.equal(plannedRuntime.loadPlan?.load[0].nodeId, 'cardiovascular-heart')
  assert.notEqual(plannedRuntime.geometryEntitlement, 'verified-anatomy')
}

console.log('High-end atlas cross-section: generic coordinate frames, orthonormality/right-handedness, plane/AABB slicing, cross-scale navigation, source entitlement, and LOD handoff verified.')
