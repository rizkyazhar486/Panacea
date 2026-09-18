import assert from 'node:assert/strict'
import {
  buildRespiratoryMotionField,
  sampleRespiratoryMotion,
  validateRespiratoryMotionField,
} from '../../src/lib/anatomy/respiratoryMotionField.ts'

const start = sampleRespiratoryMotion(0)
const quarter = sampleRespiratoryMotion(0.25)
const half = sampleRespiratoryMotion(0.5)
const threeQuarter = sampleRespiratoryMotion(0.75)
const wrapped = sampleRespiratoryMotion(1.25)

assert.equal(start.expansion01, 0)
assert.ok(Math.abs(half.expansion01 - 1) < 1e-12)
assert.ok(quarter.signedDirection > 0, 'First half-cycle direction must point inward for animation particles.')
assert.ok(threeQuarter.signedDirection < 0, 'Second half-cycle direction must point outward for animation particles.')
assert.ok(Math.abs(wrapped.expansion01 - quarter.expansion01) < 1e-12, 'Cycle fraction must wrap deterministically.')
assert.equal(start.quantitative, false)
assert.equal(half.modelStatus, 'dimensionless-animation-reference')

for (let i = -200; i <= 200; i += 1) {
  const sample = sampleRespiratoryMotion(i / 37)
  assert.ok(sample.cycleFraction >= 0 && sample.cycleFraction < 1)
  assert.ok(sample.expansion01 >= 0 && sample.expansion01 <= 1)
  assert.ok(sample.diaphragmDescent01 >= 0 && sample.diaphragmDescent01 <= 1)
  assert.ok(sample.chestExpansion01 >= 0 && sample.chestExpansion01 <= 1)
  assert.ok(sample.acinarExpansion01 >= 0 && sample.acinarExpansion01 <= 1)
  assert.ok(sample.signedDirection >= -1 && sample.signedDirection <= 1)
}

const segmentPlan = buildRespiratoryMotionField({
  cycleFraction: 0.2,
  selectedSegmentNodeId: 'resp:segment:r-s1',
  channels: ['airway-lumen', 'lung-envelope', 'diaphragm', 'acinar-reference', 'gas-exchange-reference'],
})
assert.equal(segmentPlan.selectedSegmentNodeId, 'resp:segment:r-s1')
assert.ok(segmentPlan.airwayRoute.includes('resp:trachea'))
assert.ok(segmentPlan.airwayRoute.includes('resp:right-main-bronchus'))
assert.ok(segmentPlan.airwayRoute.includes('resp:segment:r-s1'))
assert.ok(segmentPlan.bindings.find((binding) => binding.channel === 'airway-lumen')?.nodeIds.includes('resp:segment:r-s1'))
assert.ok(segmentPlan.bindings.every((binding) => binding.quantitative === false))
assert.deepEqual(validateRespiratoryMotionField(segmentPlan), [])

const unknownSegment = buildRespiratoryMotionField({
  cycleFraction: 0.8,
  selectedSegmentNodeId: 'resp:segment:not-real',
})
assert.equal(unknownSegment.selectedSegmentNodeId, undefined)
assert.ok(unknownSegment.warnings.some((warning) => warning.includes('Unknown bronchopulmonary segment')))
assert.deepEqual(validateRespiratoryMotionField(unknownSegment), [])

console.log('Continuous respiratory motion field verified: bounded periodic animation, segment-route coupling, and explicit non-quantitative safety boundary.')
