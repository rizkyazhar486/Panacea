import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  IMG2THREEJS_PROVENANCE,
  analyzeImageMaterialRegions,
  buildImg2ThreeJsDigitalTwinSpec,
  evaluateImg2ThreeJsSuitability,
  verifySagittalChiralityPair,
  verifySocketAttachments,
} from '../../src/domains/body-exposure/engine/img2threejsTwinEngine.ts'

// 1. Apache-2.0 provenance & epistemic invariants
assert.equal(IMG2THREEJS_PROVENANCE.upstreamRepo, 'https://github.com/img2threejs/img2threejs')
assert.equal(IMG2THREEJS_PROVENANCE.license, 'Apache-2.0')

// 2. Stage-1 suitability fail-closed gate (< 0.82 refuses to proceed)
const goodImg = evaluateImg2ThreeJsSuitability({
  widthPx: 1080,
  heightPx: 1920,
  meanLuminance01: 0.48,
  foregroundCoverage01: 0.55,
  silhouetteAspectRatio: 0.45,
})
assert.equal(goodImg.status, 'proceed')
assert.equal(goodImg.passed, true)

const badImg = evaluateImg2ThreeJsSuitability({
  widthPx: 160,
  heightPx: 160,
  meanLuminance01: 0.04,
  foregroundCoverage01: 0.05,
  silhouetteAspectRatio: 2.4,
})
assert.equal(badImg.passed, false)
assert.equal(badImg.status, 'request-input')
assert.ok(badImg.reasons.length >= 3)

// 3. Material observation gate rejects insufficient crop pixels
const mats = analyzeImageMaterialRegions([
  { regionId: 'skin-face', r01: 0.76, g01: 0.58, b01: 0.46, specularSpread01: 0.25, samplePixels: 256 },
  { regionId: 'hair-crown', r01: 0.12, g01: 0.11, b01: 0.10, specularSpread01: 0.30, samplePixels: 12 },
  { regionId: 'garment-torso', r01: 0.18, g01: 0.28, b01: 0.42, specularSpread01: 0.10, samplePixels: 512 },
])
assert.equal(mats[0].status, 'proceed')
assert.equal(mats[1].status, 'request-input')
assert.equal(mats[2].finish, 'matte-woven')

// 4. Full 1:1 Parametric Human CAD/CAE Digital Twin passes chirality, socket & mass conservation
const twin = buildImg2ThreeJsDigitalTwinSpec({
  heightCm: 172,
  weightKg: 68,
  biologicalSex: 'male',
  postureMode: 'squat',
})
assert.equal(twin.rawPhotoPurged, true)
assert.equal(twin.internalAnatomyInferred, false)
assert.equal(twin.chiralityGate.passed, true)
assert.equal(twin.chiralityGate.pairsChecked, 5)
assert.equal(twin.socketAttachmentGate.passed, true)
assert.ok(Math.abs(twin.cadCaeMetrics.totalSegmentMassKg - 68) < 1.0, `mass conservation ${twin.cadCaeMetrics.totalSegmentMassKg}`)
assert.ok(twin.cadCaeMetrics.peakKneeJointLoadN > twin.cadCaeMetrics.standingGroundReactionForceN * 2.5)

// 5. Chirality gate catches the classic 180-deg Y-rotation handedness defect (negating Z as well as X)
const brokenSegments = twin.segments.map((s) =>
  s.id === 'foot-r' ? { ...s, positionM: { ...s.positionM, z: -s.positionM.z } } : s,
)
const brokenChirality = verifySagittalChiralityPair(brokenSegments)
assert.equal(brokenChirality.passed, false)
assert.ok(brokenChirality.violations.some((v) => v.includes('180-deg Y-rotation')))

// 6. Socket attachment gate catches floating detached limb
const floating = twin.segments.map((s) =>
  s.id === 'forearm-l' ? { ...s, parentSocketId: 'missing-elbow' } : s,
)
assert.equal(verifySocketAttachments(floating).passed, false)

// 7. Three.js viewport safety & PersonalAvatarCameraCapture privacy contract intact
const vp = readFileSync('src/pages/bodyhub/Img2ThreeJsTwinViewport.tsx', 'utf8')
assert.match(vp, /buatRendererAman/)
assert.match(vp, /mulaiLoopTerjaga/)
assert.match(vp, /dark mt-3/)
assert.match(vp, /URL\.revokeObjectURL/)
assert.doesNotMatch(vp, /localStorage|sessionStorage|indexedDB/i)

const cam = readFileSync('src/pages/bodyhub/PersonalAvatarCameraCapture.tsx', 'utf8')
assert.match(cam, /Img2ThreeJsTwinViewport/)
assert.doesNotMatch(cam, /localStorage|sessionStorage|indexedDB/i)

console.log('img2threejs-digital-twin: suitability, PBR materials, sagittal chirality, socket locks, Winter mass conservation & Three.js CAD/CAE viewport PASS')
