import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CARDIAC_GOLDEN_JOURNEY_STEPS,
  verifyGoldenEducationalJourney,
  CANONICAL_LV_BOOKMARK,
} from '../../src/domains/medstudyhub/engine/medStudyGoldenJourneyEngine.ts'
import {
  simulateCardiovascularHemodynamics,
} from '../../src/domains/medstudyhub/engine/medStudyPhysiologySandboxEngine.ts'
import {
  evaluateClinicalCaseReasoningStep,
} from '../../src/domains/medstudyhub/engine/medStudyClinicalCaseEngine.ts'
import {
  evaluateAdaptiveAssessmentStep,
} from '../../src/domains/medstudyhub/engine/medStudyAssessmentPsychometricsEngine.ts'
import {
  scheduleSpacedRetrievalReview,
} from '../../src/domains/medstudyhub/engine/medStudySpacedRetrievalEngine.ts'

test('T-EDU-GOLDEN-01: 15-step cardiac Golden Journey orchestrator contract and strict sequential verification', () => {
  assert.strictEqual(CARDIAC_GOLDEN_JOURNEY_STEPS.length, 15)
  for (let i = 0; i < 15; i += 1) {
    assert.strictEqual(CARDIAC_GOLDEN_JOURNEY_STEPS[i].stepNumber, i + 1)
  }

  // Golden run: all 15 steps completed, exact bookmark restored
  const res = verifyGoldenEducationalJourney({
    journeyId: 'journey-lv-golden-01',
    isSyntheticEducationalJourney: true,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    savedViewportBookmark: CANONICAL_LV_BOOKMARK,
    restoredViewportBookmark: { ...CANONICAL_LV_BOOKMARK },
    conceptFmaId: 'FMA:7101',
  })
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.stepsCompletedCount, 15)
  assert.strictEqual(res.viewportRestoredExactly, true)
  assert.strictEqual(res.truthClass, 'reference')

  // Adversarial: non-synthetic attempt must fail closed
  const nonSynthetic = verifyGoldenEducationalJourney({
    journeyId: 'journey-lv-golden-fail',
    isSyntheticEducationalJourney: false,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    savedViewportBookmark: CANONICAL_LV_BOOKMARK,
    restoredViewportBookmark: { ...CANONICAL_LV_BOOKMARK },
    conceptFmaId: 'FMA:7101',
  })
  assert.strictEqual(nonSynthetic.ok, false)
  assert.strictEqual(nonSynthetic.reason, 'patient-record-contamination-blocked')

  // Adversarial: camera coordinate drift fails closed
  const drifted = verifyGoldenEducationalJourney({
    journeyId: 'journey-lv-golden-drift',
    isSyntheticEducationalJourney: true,
    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    savedViewportBookmark: CANONICAL_LV_BOOKMARK,
    restoredViewportBookmark: {
      ...CANONICAL_LV_BOOKMARK,
      cameraTargetLpsMm: [12.5, -18.0, 5.0],
    },
    conceptFmaId: 'FMA:7101',
  })
  assert.strictEqual(drifted.ok, false)
  assert.strictEqual(drifted.reason, 'viewport-restoration-drift')
})

test('T-EDU-GOLDEN-02: Step 9 Frank-Starling & hemodynamic sandbox mathematical determinism', () => {
  const hemo = simulateCardiovascularHemodynamics({
    heartRateBpm: 72,
    edvMl: 120,
    esvMl: 50,
    systolicBpMmHg: 120,
    diastolicBpMmHg: 80,
    cvpMmHg: 5,
    lvedpMmHg: 8,
  })

  assert.strictEqual(hemo.ok, true)
  if (!hemo.ok) return

  assert.strictEqual(hemo.strokeVolumeMl, 70)
  assert.ok(Math.abs(hemo.ejectionFraction - 70 / 120) < 1e-4)
  assert.ok(Math.abs(hemo.cardiacOutputLMin - 5.04) < 1e-2)
  assert.ok(Math.abs(hemo.meanArterialPressureMmHg - 93.33) < 1e-2)
  assert.strictEqual(hemo.hemodynamicProfile, 'normodynamic')
})

test('T-EDU-GOLDEN-03: Step 11 Bayesian diagnostic case reasoning and safety contraindication intercept', () => {
  const normalCase = evaluateClinicalCaseReasoningStep({
    caseId: 'case-lv-hfref-golden',
    isSyntheticEducationalCase: true,
    currentStage: 'investigations',
    targetNextStage: 'differential-diagnosis',
    preTestProbability: 0.50,
    observedFindings: [
      { findingId: 'f_s3', label: 'S3 gallop', present: true, sensitivity: 0.20, specificity: 0.95 },
      { findingId: 'f_bnp', label: 'NT-proBNP', present: true, sensitivity: 0.90, specificity: 0.80 },
    ],
    selectedManagementIds: ['m_arni', 'm_sglt2i'],
    contraindicatedManagementIds: ['m_high_dose_iv_bb'],
  })

  assert.strictEqual(normalCase.ok, true)
  if (!normalCase.ok) return

  assert.strictEqual(normalCase.combinedLikelihoodRatio, 18.0)
  assert.ok(Math.abs(normalCase.postTestProbability - 18 / 19) < 1e-4)
  assert.strictEqual(normalCase.diagnosticActionZone, 'above-treatment-threshold')

  // Safety gate: Selecting contraindicated IV beta-blocker in decompensated heart failure fails closed
  const safetyBreach = evaluateClinicalCaseReasoningStep({
    caseId: 'case-lv-hfref-golden',
    isSyntheticEducationalCase: true,
    currentStage: 'investigations',
    targetNextStage: 'differential-diagnosis',
    preTestProbability: 0.50,
    observedFindings: [],
    selectedManagementIds: ['m_high_dose_iv_bb'],
    contraindicatedManagementIds: ['m_high_dose_iv_bb'],
  })

  assert.strictEqual(safetyBreach.ok, false)
  if (!safetyBreach.ok) {
    assert.strictEqual(safetyBreach.reason, 'contraindicated-management-selected')
    assert.deepStrictEqual(safetyBreach.violatedContraindications, ['m_high_dose_iv_bb'])
  }
})

test('T-EDU-GOLDEN-04: Step 12 Adaptive 3PL IRT & Step 14 FSRS-v4.5 spaced-retrieval progression', () => {
  const cat = evaluateAdaptiveAssessmentStep({
    learnerTheta: 0.0,
    administeredResponses: [
      {
        item: { itemId: 'item-1', conceptId: 'pcg:sarcomere', discriminationA: 1.5, difficultyB: -0.5, guessingC: 0.2, angoffCutProbability: 0.6 },
        correct: true,
      },
    ],
    candidatePool: [
      { itemId: 'item-2', conceptId: 'pcg:ec_coupling', discriminationA: 1.8, difficultyB: 0.5, guessingC: 0.2, angoffCutProbability: 0.6 },
    ],
  })

  assert.strictEqual(cat.ok, true)
  if (cat.ok) {
    assert.ok(cat.updatedTheta > 0.0)
    assert.ok(cat.testFisherInformation > 0)
  }

  // FSRS-v4.5: at t = S = 10 days, retrievability must be exactly 0.90
  const spaced = scheduleSpacedRetrievalReview({
    conceptId: 'pcg:left_ventricle',
    stabilityDays: 10,
    difficulty: 4.5,
    elapsedDays: 10,
    rating: 3,
    desiredRetention: 0.90,
  })

  assert.strictEqual(spaced.ok, true)
  if (spaced.ok) {
    assert.ok(Math.abs(spaced.retrievabilityBeforeReview - 0.90) < 1e-4)
    assert.ok(spaced.nextStabilityDays > 10)
    assert.strictEqual(spaced.isLapse, false)
  }
})

test('T-EDU-GOLDEN-05: Step 15 Viewport bookmark ontology integrity and spatial preservation', () => {
  assert.strictEqual(CANONICAL_LV_BOOKMARK.fmaId, 'FMA:7101')
  assert.strictEqual(CANONICAL_LV_BOOKMARK.uberonId, 'UBERON:0002084')
  assert.strictEqual(CANONICAL_LV_BOOKMARK.isolatedStructureId, 'heart-left-ventricle')
  assert.strictEqual(CANONICAL_LV_BOOKMARK.scaleLevel, 'L3')
  assert.deepStrictEqual(CANONICAL_LV_BOOKMARK.cameraTargetLpsMm, [12.5, -18.0, 4.2])
  assert.deepStrictEqual(CANONICAL_LV_BOOKMARK.crossSectionNormalLps, [0, 0, 1])
})
