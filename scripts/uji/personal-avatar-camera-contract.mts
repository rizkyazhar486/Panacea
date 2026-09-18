import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  PERSONAL_AVATAR_CAPTURE_VIEWS,
  PERSONAL_AVATAR_TRUTH_BOUNDARY,
  anthropometricErrorPercent,
  buildPersonalAvatarQaGrid,
  createPersonalAvatarCaptureSession,
  personalAvatarMissingViews,
  preparePersonalAvatarReconstruction,
  recordPersonalAvatarFrame,
  weightedPersonalAvatarSimilarity,
} from '../../src/lib/personalAvatar.ts'

assert.equal(PERSONAL_AVATAR_CAPTURE_VIEWS.length, 9, 'camera avatar QA must remain a 3×3 nine-view contract')
assert.equal(new Set(PERSONAL_AVATAR_CAPTURE_VIEWS.map((view) => view.id)).size, 9, 'all nine camera views must be unique')

let session = createPersonalAvatarCaptureSession({
  id: 'scan-1',
  subjectId: 'patient-1',
  createdAt: '2026-09-19T00:00:00.000Z',
  consent: {
    granted: true,
    grantedAt: '2026-09-19T00:00:00.000Z',
    purpose: 'personal-avatar-reconstruction',
    rawFrameRetention: 'ephemeral',
    allowReconstruction: true,
  },
})

for (const [index, view] of PERSONAL_AVATAR_CAPTURE_VIEWS.entries()) {
  session = recordPersonalAvatarFrame(session, {
    id: `frame-${index}`,
    viewId: view.id,
    capturedAt: new Date(Date.parse('2026-09-19T00:00:00.000Z') + index * 1000).toISOString(),
    width: 1920,
    height: 1080,
    source: 'rgb-camera',
    persisted: false,
  })
}

assert.equal(session.status, 'reconstruction-ready')
assert.deepEqual(personalAvatarMissingViews(session), [])
const grid = buildPersonalAvatarQaGrid(session)
assert.equal(grid.length, 9)
assert.deepEqual(grid.map((slot) => [slot.row, slot.column]), [
  [0, 0], [0, 1], [0, 2],
  [1, 0], [1, 1], [1, 2],
  [2, 0], [2, 1], [2, 2],
])

const request = preparePersonalAvatarReconstruction(session)
assert.equal(request.source, 'monocular-rgb-multiframe')
assert.equal(request.outputTarget, 'rigged-personal-surface-avatar')
assert.equal(request.governance.rawFramesAreClinicalRecord, false)
assert.equal(request.governance.cameraAvatarIsPatientSpecificInternalAnatomy, false)
assert.equal(request.governance.cameraAvatarIsClinicalMeasurement, false)
assert.equal(request.governance.patientSpecificInternalAnatomyRequiresVerifiedImaging, true)

const denied = createPersonalAvatarCaptureSession({
  id: 'scan-2',
  subjectId: 'patient-2',
  createdAt: '2026-09-19T00:00:00.000Z',
  consent: {
    granted: false,
    grantedAt: '2026-09-19T00:00:00.000Z',
    purpose: 'personal-avatar-reconstruction',
    rawFrameRetention: 'ephemeral',
    allowReconstruction: false,
  },
})
assert.throws(() => preparePersonalAvatarReconstruction(denied), /explicit avatar-reconstruction consent/i)

assert.equal(anthropometricErrorPercent(98, 100), 2)
assert.equal(
  weightedPersonalAvatarSimilarity(
    { faceSimilarity: 1, bodyProportionSimilarity: 0.8, postureSimilarity: 0.8, textureSimilarity: 0.6, motionSimilarity: 0.6 },
    { faceSimilarity: 0.3, bodyProportionSimilarity: 0.3, postureSimilarity: 0.15, textureSimilarity: 0.15, motionSimilarity: 0.1 },
  ),
  0.8,
)

assert.match(PERSONAL_AVATAR_TRUTH_BOUNDARY, /external appearance/i)
assert.match(PERSONAL_AVATAR_TRUTH_BOUNDARY, /must not be presented as patient-specific internal anatomy/i)

const camera = readFileSync('src/pages/bodyhub/PersonalAvatarCameraCapture.tsx', 'utf8')
assert.match(camera, /navigator\.mediaDevices\.getUserMedia/)
assert.match(camera, /audio:\s*false/)
assert.match(camera, /facingMode:\s*'user'/)
assert.match(camera, /URL\.revokeObjectURL/)
assert.doesNotMatch(camera, /localStorage|sessionStorage|indexedDB/i)
assert.match(camera, /data-raw-frame-persistence="ephemeral"/)
assert.match(camera, /data-patient-specific-internal-anatomy="not-inferred"/)

const projector = readFileSync('src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', 'utf8')
assert.match(projector, /'personal-avatar'/)
assert.match(projector, /PersonalAvatarCameraCapture/)
assert.match(projector, /label:\s*'My Body'/)

console.log('personal-avatar camera contract: one RGB camera, 3x3 QA, consent, privacy and medical truth boundaries locked')
