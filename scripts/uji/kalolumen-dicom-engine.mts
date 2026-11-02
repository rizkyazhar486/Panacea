// scripts/uji/kalolumen-dicom-engine.mts
// Tests for KaloLumen 3-Layer Volumetric CT/MRI DICOM 3DCG Engine
import assert from 'node:assert/strict'
import {
  computeSubsurfacePenetrationDepth,
  computeDirectionalLightVector,
  classifyHounsfieldLayer,
  createDefaultKaloLumenState,
} from '../../src/domains/body-exposure/engine/kaloLumenDicomEngine.ts'

// 1. Subsurface Scattering Optical Penetration Depth
// mu_a = 0.05 mm^-1, mu_s_prime = 1.2 mm^-1
// atten = sqrt(3 * 0.05 * 1.25) = sqrt(0.1875) = 0.433 mm^-1
// d_pen = 1 / 0.433 = 2.31 mm
const skinPen = computeSubsurfacePenetrationDepth(0.05, 1.2)
assert.equal(skinPen, 2.31)

// 2. Light Direction Vector Conversion
// Azimuth 90 (pointing +X), Elevation 0 -> [1, 0, 0]
const vecX = computeDirectionalLightVector(90, 0)
assert.equal(vecX[0], 1)
assert.equal(vecX[1], 0)
assert.equal(vecX[2], 0)

// Overhead light: Elevation 90 -> [0, 1, 0]
const vecOverhead = computeDirectionalLightVector(0, 90)
assert.equal(vecOverhead[0], 0)
assert.equal(vecOverhead[1], 1)
assert.equal(vecOverhead[2], 0)

// 3. Hounsfield Unit Layer Classification
assert.equal(classifyHounsfieldLayer(-100), 'LAYER_1_SKIN_SUBCUTANEOUS')
assert.equal(classifyHounsfieldLayer(45), 'LAYER_2_VISCERA_MYOCARDIUM')
assert.equal(classifyHounsfieldLayer(800), 'LAYER_3_BONE_VASCULAR_TREE')
assert.equal(classifyHounsfieldLayer(-800), null) // air outside tissue

// 4. Engine Default State & Reconstruction Benchmark (<10s)
const state = createDefaultKaloLumenState('2026-11-02T12:00:00Z', 1920, 1080)
assert.equal(state.viewportWidthPx, 1920)
assert.equal(state.viewMode, 'VOLUMETRIC_3D')
assert.ok(state.reconstructionTimeMs < 10000, 'Reconstruction time must meet <10s clinical benchmark')
assert.equal(state.layers.LAYER_1_SKIN_SUBCUTANEOUS.hounsfieldMinHU, -300)
assert.equal(state.layers.LAYER_2_VISCERA_MYOCARDIUM.hounsfieldMinHU, 20)
assert.equal(state.layers.LAYER_3_BONE_VASCULAR_TREE.hounsfieldMinHU, 200)
assert.equal(state.truthClass, 'volumetric_imaging_optical_proxy')
assert.equal(state.clinically_reviewed, false)
assert.equal(state.neverManufacturesBiomarkers, true)

// 5. Negative controls
assert.throws(() => computeSubsurfacePenetrationDepth(-0.05, 1.2), /Absorption coefficient mu_a must be > 0/)
assert.throws(() => computeDirectionalLightVector(400, 0), /Azimuth must be 0\.\.360/)
assert.throws(() => computeDirectionalLightVector(0, -120), /Elevation must be -90\.\.90/)
assert.throws(() => createDefaultKaloLumenState('bad-timestamp'), /Invalid evaluation ISO timestamp/)

console.log('KaloLumen 3-Layer Volumetric CT/MRI DICOM 3DCG Engine verified.')
