import assert from 'node:assert/strict'
import test from 'node:test'

import { classifyPathologicalGaitCycle } from '../../src/domains/body-exposure/engine/pathologicalGaitEngine.ts'

test('BX-3 1. Golden case: physiological 60/40 gait vs steppage foot-drop gait (common fibular nerve)', () => {
  const normal = classifyPathologicalGaitCycle({
    stancePhasePercent: 60,
    swingPhasePercent: 40,
    cadenceStepsPerMin: 110,
    stepWidthCm: 9,
    swingAnkleDorsiflexionDeg: 2,
    swingKneeFlexionPeakDeg: 60,
    contralateralPelvicDropDeg: 1.5,
    stepTimingVariabilityCvPercent: 2.5,
  })
  assert.strictEqual(normal.ok, true)
  assert.strictEqual(normal.primaryPattern, 'normal-physiological-gait')
  assert.strictEqual(normal.stanceToSwingRatio, 1.5)

  const steppage = classifyPathologicalGaitCycle({
    stancePhasePercent: 60,
    swingPhasePercent: 40,
    cadenceStepsPerMin: 95,
    stepWidthCm: 10,
    swingAnkleDorsiflexionDeg: -12,
    swingKneeFlexionPeakDeg: 75,
    contralateralPelvicDropDeg: 2,
    stepTimingVariabilityCvPercent: 3.5,
  })
  assert.strictEqual(steppage.ok, true)
  assert.strictEqual(steppage.primaryPattern, 'steppage-foot-drop-gait')
})

test('BX-3 2. Paired test: changing swingKneeFlexionPeakDeg from 75 deg (steppage LMN) to 30 deg (stiff-knee UMN) shifts classification to hemiplegic-circumduction-gait', () => {
  const hemiplegic = classifyPathologicalGaitCycle({
    stancePhasePercent: 65,
    swingPhasePercent: 35,
    cadenceStepsPerMin: 80,
    stepWidthCm: 12,
    swingAnkleDorsiflexionDeg: -10,
    swingKneeFlexionPeakDeg: 30,
    contralateralPelvicDropDeg: 2,
    stepTimingVariabilityCvPercent: 4,
  })
  assert.strictEqual(hemiplegic.ok, true)
  assert.strictEqual(hemiplegic.primaryPattern, 'hemiplegic-circumduction-gait')
})

test('BX-3 3. Boundary +-epsilon on stance+swing=100% +- 0.5% and invalid inputs fail closed', () => {
  const atTolerance = classifyPathologicalGaitCycle({
    stancePhasePercent: 60.5,
    swingPhasePercent: 40.0,
    cadenceStepsPerMin: 110,
    stepWidthCm: 9,
    swingAnkleDorsiflexionDeg: 2,
    swingKneeFlexionPeakDeg: 60,
    contralateralPelvicDropDeg: 1.5,
    stepTimingVariabilityCvPercent: 2.5,
  })
  assert.strictEqual(atTolerance.ok, true)

  const beyondTolerance = classifyPathologicalGaitCycle({
    stancePhasePercent: 60.51,
    swingPhasePercent: 40.0,
    cadenceStepsPerMin: 110,
    stepWidthCm: 9,
    swingAnkleDorsiflexionDeg: 2,
    swingKneeFlexionPeakDeg: 60,
    contralateralPelvicDropDeg: 1.5,
    stepTimingVariabilityCvPercent: 2.5,
  })
  assert.strictEqual(beyondTolerance.ok, false)
  assert.strictEqual(beyondTolerance.reason, 'phase-percentage-sum-mismatch')
})
