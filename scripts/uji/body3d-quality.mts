import assert from 'node:assert/strict'
import {
  BODY3D_DESKTOP_MAX_DPR,
  BODY3D_MOBILE_MAX_DPR,
  BODY3D_MAX_RENDER_PIXELS,
  Body3dLayerLoadGeneration,
  body3dDissectionMaterialState,
  body3dPixelRatio,
  body3dSliceCoordinate,
} from '../../src/lib/body3dQuality.ts'

assert.equal(BODY3D_DESKTOP_MAX_DPR, 2)
assert.equal(BODY3D_MOBILE_MAX_DPR, 1.5)
assert.equal(BODY3D_MAX_RENDER_PIXELS, 5_250_000)

// Phone: preserve the conservative 1.5x cap already validated by mobile WebGL smoke.
assert.equal(body3dPixelRatio(390, 574, 3, true), 1.5)
// Tablet Retina stays at the established 2x ceiling.
assert.equal(body3dPixelRatio(1024, 768, 2, false), 2)
// Common 1440×900 Retina desktop now has enough guarded budget for full 2x HD.
assert.equal(body3dPixelRatio(1440, 900, 2, false), 2)
// Larger 1080p desktop still scales down supersampling instead of exceeding the budget.
const fullHd = body3dPixelRatio(1920, 1080, 2, false)
assert.ok(fullHd > 1.59 && fullHd < 1.60, `unexpected 1080p DPR ${fullHd}`)
// CSS 4K never falls below native 1x.
assert.equal(body3dPixelRatio(3840, 2160, 2, false), 1)
assert.equal(body3dPixelRatio(0, 0, Number.NaN, false), 1)

const generations = new Body3dLayerLoadGeneration()
const first = generations.begin('skeletal')
assert.equal(generations.isCurrent('skeletal', first), true)
generations.invalidate('skeletal')
assert.equal(generations.isCurrent('skeletal', first), false)
const second = generations.begin('skeletal')
assert.equal(generations.isCurrent('skeletal', second), true)

assert.deepEqual(
  body3dDissectionMaterialState('xray', 0.45, 0.5),
  { opacity: 0.225, transparent: true, depthWrite: false },
)
assert.deepEqual(
  body3dDissectionMaterialState('anatomy', 1, 0.4),
  { opacity: 0.4, transparent: true, depthWrite: false },
)
assert.deepEqual(
  body3dDissectionMaterialState('ct', 1, 1),
  { opacity: 1, transparent: false, depthWrite: true },
)

const bounds = { min: { x: -2, y: -1, z: -4 }, max: { x: 2, y: 9, z: 6 } }
assert.equal(body3dSliceCoordinate(bounds, 'axial', 0.5), 4)
assert.equal(body3dSliceCoordinate(bounds, 'coronal', 0.25), -1.5)
assert.equal(body3dSliceCoordinate(bounds, 'sagittal', 1.5), 2)

console.log('Body3D quality/lifecycle guards verified.')
