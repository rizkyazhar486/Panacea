import assert from 'node:assert/strict'
import {
  BODY3D_MAX_DPR,
  BODY3D_MAX_RENDER_PIXELS,
  Body3dLayerLoadGeneration,
  body3dDissectionMaterialState,
  body3dHasActiveMotion,
  body3dPixelRatio,
  body3dSliceCoordinate,
} from '../../src/lib/body3dQuality.ts'

assert.equal(BODY3D_MAX_DPR, 2)
assert.equal(BODY3D_MAX_RENDER_PIXELS, 4_500_000)

// iPhone-width viewer: tetap Retina 2x walaupun device DPR lebih tinggi.
assert.equal(body3dPixelRatio(390, 574, 3), 2)
// Tablet Retina masih berada di bawah anggaran fill-rate.
assert.equal(body3dPixelRatio(1024, 768, 2), 2)
// Desktop besar menurunkan supersampling secara bertahap, bukan kualitas CSS.
const desktop = body3dPixelRatio(1440, 900, 2)
assert.ok(desktop > 1.8 && desktop < 1.9, `unexpected desktop DPR ${desktop}`)
// CSS 4K tidak pernah diturunkan di bawah native 1x.
assert.equal(body3dPixelRatio(3840, 2160, 2), 1)
assert.equal(body3dPixelRatio(0, 0, Number.NaN), 1)

assert.equal(body3dHasActiveMotion({ heartRate: 0, respRate: 0, contractionRate: 0 }), false)
assert.equal(body3dHasActiveMotion({ heartRate: 70, respRate: 0, contractionRate: 0 }), true)
assert.equal(body3dHasActiveMotion({ heartRate: 0, respRate: 14, contractionRate: 0 }), true)
assert.equal(body3dHasActiveMotion({ heartRate: 0, respRate: 0, contractionRate: 30 }), true)
assert.equal(body3dHasActiveMotion({ heartRate: 0, respRate: 0, contractionRate: 0, peristalsisRate: 8 }), true)

const generations = new Body3dLayerLoadGeneration()
const first = generations.begin('cardiovascular')
assert.equal(generations.isCurrent('cardiovascular', first), true)
generations.invalidate('cardiovascular')
assert.equal(generations.isCurrent('cardiovascular', first), false)
const second = generations.begin('cardiovascular')
assert.equal(generations.isCurrent('cardiovascular', second), true)
assert.notEqual(first, second)

assert.deepEqual(body3dDissectionMaterialState('xray', 0.27, 1), {
  opacity: 0.27,
  transparent: true,
  depthWrite: false,
})
assert.deepEqual(body3dDissectionMaterialState('xray', 0.27, 0.5), {
  opacity: 0.135,
  transparent: true,
  depthWrite: false,
})
assert.deepEqual(body3dDissectionMaterialState('ct', 1, 0.4), {
  opacity: 0.4,
  transparent: true,
  depthWrite: false,
})

const body = { min: { x: -1, y: -2, z: -0.5 }, max: { x: 1, y: 2, z: 0.5 } }
assert.equal(body3dSliceCoordinate(body, 'axial', 0), -2)
assert.equal(body3dSliceCoordinate(body, 'axial', 0.5), 0)
assert.equal(body3dSliceCoordinate(body, 'axial', 1), 2)
assert.equal(body3dSliceCoordinate(body, 'sagittal', 0.2), -0.6)
assert.notEqual(body3dSliceCoordinate(body, 'coronal', 0.2), body3dSliceCoordinate(body, 'coronal', 0.8))

console.log('Body3D quality: DPR, idle motion, stale loads, X-ray dissection, and slice guards passed')
