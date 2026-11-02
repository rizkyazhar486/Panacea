import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CARDIAC_GOLDEN_JOURNEY_STEPS,
  verifyGoldenEducationalJourney,
} from '../../src/domains/medstudyhub/engine/medStudyGoldenJourneyEngine.ts'

const SAVED_BOOKMARK = {
  fmaId: 'FMA:7101',
  uberonId: 'UBERON:0002084',
  isolatedStructureId: 'heart-left-ventricle',
  scaleLevel: 'L3',
  cameraTargetLpsMm: [12.5, -18.0, 4.2],
  crossSectionNormalLps: [0, 0, 1],
}

test('EDU-6 1. Golden case: 15-step cardiac Golden Journey verifies sequence, FMA:7101 binding, and exact 3D viewport restoration', () => {
  assert.strictEqual(CARDIAC_GOLDEN_JOURNEY_STEPS.length, 15)
  const res = verifyGoldenEducationalJourney({
    journeyId: 'journey-lv-hfref-01',
    isSyntheticEducationalJourney: true,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    savedViewportBookmark: SAVED_BOOKMARK,
    restoredViewportBookmark: { ...SAVED_BOOKMARK },
    conceptFmaId: 'FMA:7101',
  })
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.stepsCompletedCount, 15)
  assert.strictEqual(res.viewportRestoredExactly, true)
})

test('EDU-6 2. Paired & adversarial tests: out-of-order steps, FMA ontology mismatch, and camera drift fail closed', () => {
  const outOfOrder = verifyGoldenEducationalJourney({
    journeyId: 'journey-lv-hfref-01',
    isSyntheticEducationalJourney: true,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 10, 12, 13, 14, 15],
    savedViewportBookmark: SAVED_BOOKMARK,
    restoredViewportBookmark: { ...SAVED_BOOKMARK },
    conceptFmaId: 'FMA:7101',
  })
  assert.strictEqual(outOfOrder.ok, false)
  assert.strictEqual(outOfOrder.reason, 'non-sequential-or-incomplete-steps')

  const driftedCamera = verifyGoldenEducationalJourney({
    journeyId: 'journey-lv-hfref-01',
    isSyntheticEducationalJourney: true,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    savedViewportBookmark: SAVED_BOOKMARK,
    restoredViewportBookmark: { ...SAVED_BOOKMARK, cameraTargetLpsMm: [12.5, -18.0, 9.9] },
    conceptFmaId: 'FMA:7101',
  })
  assert.strictEqual(driftedCamera.ok, false)
  assert.strictEqual(driftedCamera.reason, 'viewport-restoration-drift')
})
