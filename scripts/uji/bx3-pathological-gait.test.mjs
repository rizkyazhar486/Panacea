import test from 'node:test'
import assert from 'node:assert/strict'
import { getPathologicalGaitClip } from '../../src/domains/body-exposure/engine/gaitLibraryEngine.ts'

test('BX-3 Golden Case: Trendelenburg clip returns simulated truth class and loop continuity', () => {
  const clip = getPathologicalGaitClip('trendelenburg')
  assert.equal(clip.truthClass, 'simulated')
  assert.equal(clip.loopContinuous, true)
  assert.ok(clip.editedJointChannels.length > 0)
})

test('BX-3 Negative Case: Unknown clip id returns not available safely', () => {
  const clip = getPathologicalGaitClip('invalid-gait')
  assert.equal(clip.pathologyName, 'not available')
  assert.equal(clip.loopContinuous, false)
})
