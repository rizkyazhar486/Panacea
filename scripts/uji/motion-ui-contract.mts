import assert from 'node:assert/strict'
import {
  PANACEA_MOTION_RULES,
  getMotionPreset,
  listMotionPresets,
  validateMotionPreset,
} from '../../src/lib/motionUiContract.ts'

const presets = listMotionPresets()
assert.equal(presets.length, 5)
assert.ok(presets.every(validateMotionPreset))
assert.equal(PANACEA_MOTION_RULES.functionalOnly, true)
assert.equal(PANACEA_MOTION_RULES.decorativeInfiniteMotionAllowed, false)
assert.equal(PANACEA_MOTION_RULES.reducedMotionRequired, true)

for (const preset of presets) {
  const reduced = getMotionPreset(preset.intent, true)
  assert.equal(reduced.durationSeconds, 0)
  assert.equal(reduced.spring, undefined)
  assert.deepEqual(Object.keys(reduced.enter), ['opacity'])
  assert.deepEqual(Object.keys(reduced.exit), ['opacity'])
}

const manipulation = getMotionPreset('direct-manipulation')
assert.ok(manipulation.spring)
assert.ok(manipulation.functionalPurpose.includes('user input'))
const feedback = getMotionPreset('feedback')
assert.ok((feedback.durationSeconds ?? 1) <= 0.12)

console.log('Motion UI contract verified: functional intents only, bounded timing, spring-based direct manipulation, spatial continuity, progressive disclosure, feedback, and reduced-motion fallbacks.')
