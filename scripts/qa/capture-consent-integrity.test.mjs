import test from 'node:test'
import assert from 'node:assert/strict'
import { isIntentConsentActive, validateIntentEvent, canProjectIntent, projectIntentToDigitalBody } from '../../src/lib/neuralIntent.ts'
import { createPersonalAvatarCaptureSession, recordPersonalAvatarFrame, preparePersonalAvatarReconstruction, PERSONAL_AVATAR_CAPTURE_VIEWS } from '../../src/lib/personalAvatar.ts'
const at = '2026-10-04T12:00:00.000Z'
const intentConsent = { granted: true, purposes: ['personal-visualization'], grantedAt: at }
const event = { id: 'e', subjectId: 'p', source: { kind: 'explicit-touch', sourceId: 's' }, action: 'reach', effector: 'right-upper-limb', evidenceClass: 'explicit', capturedAt: at, receivedAt: at, consent: intentConsent, status: 'confirmed', tags: [] }
const avatarConsent = { granted: true, allowReconstruction: true, purpose: 'personal-avatar-reconstruction', rawFrameRetention: 'ephemeral', grantedAt: at }
const input = { id: 's', subjectId: 'p', createdAt: at, consent: avatarConsent }
const frame = { id: 'f', viewId: 'front', capturedAt: at, width: 100, height: 100, source: 'rgb-camera', persisted: false }
test('neural intent requires literal consent, supported purpose arrays and valid timestamp types', () => {
  for (const patch of [{ granted: 'false' }, { granted: 1 }, { purposes: 'personal-visualization' }, { purposes: ['unsupported'] }, { grantedAt: 1 }, { revokedAt: '' }, { expiresAt: null }]) {
    const consent = { ...intentConsent, ...patch }
    assert.throws(() => validateIntentEvent({ ...event, consent }))
    assert.equal(isIntentConsentActive(consent, 'personal-visualization', Date.parse(at)), false)
  }
  assert.equal(isIntentConsentActive(intentConsent, 'personal-visualization', Date.parse(at)), true)
  assert.equal(isIntentConsentActive({ ...intentConsent, granted: false }, 'personal-visualization', Date.parse(at)), false)
  assert.equal(isIntentConsentActive({ ...intentConsent, revokedAt: at }, 'personal-visualization', Date.parse(at)), false)
  assert.equal(isIntentConsentActive(intentConsent, 'clinical-support', Date.parse(at)), false)
})
test('avatar capture consent cannot be coerced or silently change purpose and retention', () => {
  for (const patch of [{ granted: 'false' }, { allowReconstruction: 'false' }, { purpose: 'unsupported' }, { rawFrameRetention: 'persistent' }, { grantedAt: 1 }]) {
    assert.throws(() => createPersonalAvatarCaptureSession({ ...input, consent: { ...avatarConsent, ...patch } }))
    assert.throws(() => recordPersonalAvatarFrame({ ...input, status: 'capturing', frames: {}, consent: { ...avatarConsent, ...patch } }, frame))
  }
  const denied = createPersonalAvatarCaptureSession({ ...input, consent: { ...avatarConsent, granted: false } })
  assert.equal(denied.status, 'consent-required')
  assert.throws(() => recordPersonalAvatarFrame(denied, frame), /consent/)
})
test('reconstruction rechecks imported consent while preserving capture-only consent', () => {
  let session = createPersonalAvatarCaptureSession({ ...input, consent: { ...avatarConsent, allowReconstruction: false } })
  for (const view of PERSONAL_AVATAR_CAPTURE_VIEWS) session = recordPersonalAvatarFrame(session, { ...frame, id: view.id, viewId: view.id })
  assert.equal(session.status, 'capture-ready')
  assert.throws(() => preparePersonalAvatarReconstruction(session), /consent/)
  for (const patch of [{ granted: 'false' }, { allowReconstruction: 'false' }, { purpose: 'unsupported' }, { rawFrameRetention: 'persistent' }]) assert.throws(() => preparePersonalAvatarReconstruction({ ...session, consent: { ...avatarConsent, ...patch } }))
  assert.equal(preparePersonalAvatarReconstruction({ ...session, consent: avatarConsent }).captureViewIds.length, 9)
})

test('future intent evidence cannot enter an earlier clinical or visual projection', () => {
  const future = { ...event, capturedAt: '2026-10-05T12:00:00.000Z', receivedAt: '2026-10-05T12:00:00.000Z', consent: { ...intentConsent, purposes: ['personal-visualization', 'clinical-support', 'ai-context'] } }
  for (const purpose of future.consent.purposes) {
    assert.equal(canProjectIntent(future, purpose, Date.parse(at)), false)
    assert.equal(projectIntentToDigitalBody(future, purpose, Date.parse(at)), null)
    assert.equal(canProjectIntent(future, purpose, Date.parse(future.capturedAt)), true)
  }
})
