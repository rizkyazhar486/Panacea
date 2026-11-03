// scripts/qa/kalolumen-dicom-mpr.test.mjs
// Offline deterministic unit tests for KaloLumen 3-Layer DICOM Volumetric Raymarching & MPR Engine

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  computeSubsurfacePenetrationDepth,
  computeTissueDiffuseTransmittance,
  computeDirectionalLightVector,
  classifyHounsfieldLayer,
  evaluateHounsfieldTransferFunction,
  intersectRayAabb,
  computeMprSliceCoordinates,
  createDefaultKaloLumenState,
  DIAGNOSTIC_CT_PRESETS,
} from '../../src/domains/body-exposure/engine/kaloLumenDicomEngine.ts'

test('ACR/RSNA Diagnostic CT Window Presets are medically conformant', () => {
  assert.equal(DIAGNOSTIC_CT_PRESETS.length, 7)
  const lung = DIAGNOSTIC_CT_PRESETS.find(p => p.id === 'LUNG')
  assert.ok(lung)
  assert.equal(lung.windowCenterHU, -600)
  assert.equal(lung.windowWidthHU, 1500)
  assert.equal(lung.huMin, -1350)
  assert.equal(lung.huMax, 150)

  const stroke = DIAGNOSTIC_CT_PRESETS.find(p => p.id === 'STROKE_ACUTE')
  assert.ok(stroke)
  assert.equal(stroke.windowCenterHU, 32)
  assert.equal(stroke.windowWidthHU, 30)

  const bone = DIAGNOSTIC_CT_PRESETS.find(p => p.id === 'BONE')
  assert.ok(bone)
  assert.equal(bone.windowCenterHU, 400)
  assert.equal(bone.windowWidthHU, 1800)
})

test('Hounsfield layer classification matches clinical tissue density bands', () => {
  assert.equal(classifyHounsfieldLayer(-100), 'LAYER_1_SKIN_SUBCUTANEOUS')
  assert.equal(classifyHounsfieldLayer(0), 'LAYER_1_SKIN_SUBCUTANEOUS')
  assert.equal(classifyHounsfieldLayer(45), 'LAYER_2_VISCERA_MYOCARDIUM')
  assert.equal(classifyHounsfieldLayer(120), 'LAYER_2_VISCERA_MYOCARDIUM')
  assert.equal(classifyHounsfieldLayer(450), 'LAYER_3_BONE_VASCULAR_TREE')
  assert.equal(classifyHounsfieldLayer(1200), 'LAYER_3_BONE_VASCULAR_TREE')
  assert.equal(classifyHounsfieldLayer(-950), null) // Free air
  assert.equal(classifyHounsfieldLayer(4500), null) // Extreme dental metal artifact
})

test('Optical subsurface scattering penetration depth and diffuse transmittance', () => {
  // d_pen = 1 / sqrt(3 * mu_a * (mu_a + mu_s_prime))
  const dPenSkin = computeSubsurfacePenetrationDepth(0.05, 1.2)
  assert.ok(dPenSkin > 2.0 && dPenSkin < 3.0, `Expected ~2.31 mm, got ${dPenSkin}`)

  const trans1mm = computeTissueDiffuseTransmittance(1.0, dPenSkin)
  const trans5mm = computeTissueDiffuseTransmittance(5.0, dPenSkin)
  assert.ok(trans1mm > trans5mm, 'Thicker tissue must have lower transmittance')
  assert.ok(trans1mm <= 1.0 && trans1mm >= 0.0)

  // Errors on non-physical negative optical properties
  assert.throws(() => computeSubsurfacePenetrationDepth(-0.1, 1.0), RangeError)
  assert.throws(() => computeSubsurfacePenetrationDepth(0.05, -1.0), RangeError)
})

test('3D Directional light vector conversion', () => {
  // Azimuth 0, Elevation 0 -> points forward along +Z axis
  const l0 = computeDirectionalLightVector(0, 0)
  assert.deepEqual(l0, [0, 0, 1])

  // Elevation 90 -> points straight up along +Y axis
  const lUp = computeDirectionalLightVector(0, 90)
  assert.deepEqual(lUp, [0, 1, 0])

  // Elevation -90 -> points straight down along -Y axis
  const lDown = computeDirectionalLightVector(0, -90)
  assert.deepEqual(lDown, [0, -1, 0])

  // Azimuth 90, Elevation 0 -> points right along +X axis
  const lRight = computeDirectionalLightVector(90, 0)
  assert.deepEqual(lRight, [1, 0, 0])

  // Validation boundary
  assert.throws(() => computeDirectionalLightVector(-5, 0), RangeError)
  assert.throws(() => computeDirectionalLightVector(0, 120), RangeError)
})

test('Hounsfield transfer function evaluates linear contrast ramps', () => {
  // Soft tissue window: center 40, width 400 (lower: -160, upper: 240)
  const tfBelow = evaluateHounsfieldTransferFunction(-200, 40, 400)
  assert.equal(tfBelow.normalizedIntensity, 0)
  assert.equal(tfBelow.opacity, 0)

  const tfCenter = evaluateHounsfieldTransferFunction(40, 40, 400)
  assert.equal(tfCenter.normalizedIntensity, 0.5)

  const tfAbove = evaluateHounsfieldTransferFunction(300, 40, 400)
  assert.equal(tfAbove.normalizedIntensity, 1.0)
  assert.equal(tfAbove.opacity, 1.0)

  assert.throws(() => evaluateHounsfieldTransferFunction(40, 40, 0), RangeError)
})

test('Ray-AABB slab intersection algorithm computes accurate volumetric hit bounds', () => {
  // Ray shot straight from z = -2 towards box [-0.5, 0.5]^3 along +Z
  const hitStraight = intersectRayAabb([0, 0, -2], [0, 0, 1])
  assert.ok(hitStraight.hit)
  assert.equal(hitStraight.tNear, 1.5)
  assert.equal(hitStraight.tFar, 2.5)

  // Ray shot completely missing box
  const hitMiss = intersectRayAabb([5, 5, -2], [0, 0, 1])
  assert.equal(hitMiss.hit, false)

  // Ray starting inside box
  const hitInside = intersectRayAabb([0, 0, 0], [1, 0, 0])
  assert.ok(hitInside.hit)
  assert.equal(hitInside.tNear, 0)
  assert.equal(hitInside.tFar, 0.5)
})

test('Multi-Planar Reconstruction slice coordinates and orientations', () => {
  const axial = computeMprSliceCoordinates('AXIAL', 0.5, [512, 512, 256], [0.75, 0.75, 1.25])
  assert.equal(axial.sliceIndex, 128)
  assert.equal(axial.sliceMm, 160) // 128 * 1.25
  assert.equal(axial.planeName, 'Transverse / Axial (XY)')

  const coronal = computeMprSliceCoordinates('CORONAL', 0.25, [512, 512, 256], [0.75, 0.75, 1.25])
  assert.equal(coronal.sliceIndex, 128)
  assert.equal(coronal.sliceMm, 96) // 128 * 0.75
  assert.equal(coronal.planeName, 'Coronal (XZ)')

  const sagittal = computeMprSliceCoordinates('SAGITTAL', 0.8, [512, 512, 256], [0.75, 0.75, 1.25])
  assert.equal(sagittal.sliceIndex, 409)
  assert.equal(sagittal.planeName, 'Sagittal (YZ)')
})

test('createDefaultKaloLumenState initializes governed truthClass and presets', () => {
  const state = createDefaultKaloLumenState('2026-11-03T12:00:00.000Z')
  assert.equal(state.truthClass, 'volumetric_imaging_optical_proxy')
  assert.equal(state.clinically_reviewed, false)
  assert.equal(state.neverManufacturesBiomarkers, true)
  assert.equal(state.selectedPresetId, 'MEDIASTINUM_SOFT_TISSUE')
  assert.ok(state.layers.LAYER_1_SKIN_SUBCUTANEOUS.isVisible)
  assert.ok(state.layers.LAYER_2_VISCERA_MYOCARDIUM.isVisible)
  assert.ok(state.layers.LAYER_3_BONE_VASCULAR_TREE.isVisible)

  assert.throws(() => createDefaultKaloLumenState('not-an-iso-date'), TypeError)
  assert.throws(() => createDefaultKaloLumenState('2026-11-03T12:00:00.000Z', 100, 100), RangeError)
})
