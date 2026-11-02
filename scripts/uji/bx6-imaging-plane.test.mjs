import assert from 'node:assert/strict'
import test from 'node:test'

import {
  correlateImagingPlane,
  correlateImagingPlaneWithStructures,
} from '../../src/domains/body-exposure/engine/imagingPlaneEngine.ts'

const THORAX_STRUCTURES = [
  {
    structureId: 'left-ventricle',
    fmaId: 'FMA:7101',
    minLpsMm: [-40, -30, -50],
    maxLpsMm: [40, 30, 20],
  },
  {
    structureId: 'cerebellum',
    fmaId: 'FMA:67944',
    minLpsMm: [-50, 20, 180],
    maxLpsMm: [50, 90, 240],
  },
]

test('BX-6 1. Golden case: axial thoracic plane at Z=0 intersects left-ventricle and excludes cerebellum', () => {
  const res = correlateImagingPlaneWithStructures(
    {
      originLpsMm: [0, 0, 0],
      normalVector: [0, 0, 1],
      slabThicknessMm: 5,
    },
    THORAX_STRUCTURES,
  )
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.orientation, 'axial')
  assert.deepStrictEqual(res.intersectedStructures, ['left-ventricle'])
  assert.strictEqual(res.signedCenterDistancesMm['left-ventricle'], -15)

  const legacyRes = correlateImagingPlane(
    { normal: [0, 0, 1], constant: 0 },
    [{ structureId: 'left-ventricle', min: [-40, -30, -50], max: [40, 30, 20] }],
  )
  assert.deepStrictEqual(legacyRes.intersectedStructureIds, ['left-ventricle'])
  assert.strictEqual(legacyRes.orientation, 'axial')
})

test('BX-6 2. Paired & boundary tests: degenerate normal vector, negative slab thickness, and inverted AABB fail closed', () => {
  const zeroNormal = correlateImagingPlaneWithStructures(
    { originLpsMm: [0, 0, 0], normalVector: [0, 0, 0], slabThicknessMm: 2 },
    THORAX_STRUCTURES,
  )
  assert.strictEqual(zeroNormal.ok, false)
  assert.strictEqual(zeroNormal.reason, 'degenerate-normal-vector')

  const negSlab = correlateImagingPlaneWithStructures(
    { originLpsMm: [0, 0, 0], normalVector: [1, 0, 0], slabThicknessMm: -0.001 },
    THORAX_STRUCTURES,
  )
  assert.strictEqual(negSlab.ok, false)
  assert.strictEqual(negSlab.reason, 'negative-slab-thickness')

  const invertedBox = correlateImagingPlaneWithStructures(
    { originLpsMm: [0, 0, 0], normalVector: [1, 0, 0], slabThicknessMm: 2 },
    [{ structureId: 'bad', fmaId: 'FMA:1', minLpsMm: [10, 0, 0], maxLpsMm: [-10, 5, 5] }],
  )
  assert.strictEqual(invertedBox.ok, false)
  assert.strictEqual(invertedBox.reason, 'inverted-bounding-box')
})
