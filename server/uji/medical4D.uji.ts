import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceMedicalTime, flowParticlePhase, medicalCameraDistance, MEDICAL_4D_DURATION } from '../../src/lib/medical4D'
import { relativeFlowIndex, relativePoiseuilleResistance, relativeVelocityIndex } from '../../src/lib/medical3DFrontier'

test('hemodynamic speed follows Q/area, not Q alone', () => {
  assert.equal(relativeFlowIndex(1, 0.5), 1 / 16)
  assert.equal(relativeVelocityIndex(1, 0.5), 1 / 4)
  assert.equal(relativeVelocityIndex(2, 1.5), 4.5)
  assert.equal(relativeVelocityIndex(0, 1.5), 0)
  assert.equal(relativeVelocityIndex(-1, 1), 0)
})
test('non-finite physiology parameters cannot enter the renderer', () => {
  for (const n of [NaN, Infinity, -Infinity]) {
    assert.throws(() => relativePoiseuilleResistance(n))
    assert.throws(() => relativeFlowIndex(n, 1))
    assert.throws(() => relativeVelocityIndex(1, n))
  }
  assert(Number.isFinite(relativeFlowIndex(Number.MAX_VALUE, Number.MIN_VALUE)))
})
test('timeline pauses exactly and bounds background gaps and playback speed', () => {
  assert.equal(advanceMedicalTime(2, 0.05, 2, true), 2.1)
  assert.equal(advanceMedicalTime(2, 0.05, 2, false), 2)
  assert.equal(advanceMedicalTime(2, 900, 20, true), 2.2)
  assert.equal(advanceMedicalTime(12, 0.1, 1, true), MEDICAL_4D_DURATION)
  assert.equal(advanceMedicalTime(0, -1, 1, true), 0)
  assert.throws(() => advanceMedicalTime(NaN, 0.1, 1, true))
})
test('particle frames can be replayed or scrubbed deterministically', () => {
  assert.equal(flowParticlePhase(2, 0.1, 1), flowParticlePhase(2, 0.1, 1))
  assert.notEqual(flowParticlePhase(2, 0.1, 1), flowParticlePhase(3, 0.1, 1))
  assert.equal(flowParticlePhase(10, 0.25, 0), 0.25)
  assert.equal(flowParticlePhase(2, 0.1, 2), flowParticlePhase(4, 0.1, 1))
  assert(flowParticlePhase(12, 0.7, 4.5) < 1)
  assert.throws(() => flowParticlePhase(1, Infinity, 1))
})
test('camera fits a bounding sphere on desktop and portrait without clipping', () => {
  for (const aspect of [3, 1.7, 1, 0.5, 0.3]) {
    const distance = medicalCameraDistance(3, aspect, 38)
    const halfAngle = Math.min(19 * Math.PI / 180, Math.atan(Math.tan(19 * Math.PI / 180) * aspect))
    assert(distance * Math.sin(halfAngle) > 3)
  }
  assert(medicalCameraDistance(3, 0.5, 38) > medicalCameraDistance(3, 1.7, 38))
  assert.throws(() => medicalCameraDistance(1, 0, 38))
})
