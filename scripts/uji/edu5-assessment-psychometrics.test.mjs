import assert from 'node:assert/strict'
import test from 'node:test'

import {
  compute3PlProbability,
  evaluateAdaptiveAssessmentStep,
} from '../../src/domains/medstudyhub/engine/medStudyAssessmentPsychometricsEngine.ts'

const ITEM_EASY = {
  itemId: 'item-sarcomere-1',
  conceptId: 'med-cv-01-sarcomere-ultrastructure',
  discriminationA: 1.2,
  difficultyB: -1.0,
  guessingC: 0.2,
  angoffCutProbability: 0.6,
}

const ITEM_MATCHED = {
  itemId: 'item-cicr-2',
  conceptId: 'med-cv-02-excitation-contraction-cicr',
  discriminationA: 1.8,
  difficultyB: 0.5,
  guessingC: 0.2,
  angoffCutProbability: 0.65,
}

const ITEM_HARD = {
  itemId: 'item-hfref-3',
  conceptId: 'med-cv-04-acute-hfref-management',
  discriminationA: 1.0,
  difficultyB: 2.5,
  guessingC: 0.2,
  angoffCutProbability: 0.55,
}

test('EDU-5 1. Golden case: at theta === difficultyB, 3PL probability equals (1 + c) / 2 = 0.60 exactly', () => {
  const pAtB = compute3PlProbability(0.5, ITEM_MATCHED)
  assert.strictEqual(Number(pAtB.toFixed(6)), 0.6)

  const catStep = evaluateAdaptiveAssessmentStep({
    learnerTheta: 0.0,
    administeredResponses: [{ item: ITEM_EASY, correct: true }],
    candidatePool: [ITEM_EASY, ITEM_MATCHED, ITEM_HARD],
  })
  assert.strictEqual(catStep.ok, true)
  assert.strictEqual(catStep.updatedTheta > 0.0, true)
  assert.strictEqual(catStep.nextOptimalItemId, 'item-cicr-2')
})

test('EDU-5 2. Paired & boundary tests: incorrect response decreases theta; guessingC > 0.35 or |theta| > 4.0 fails closed', () => {
  const wrongStep = evaluateAdaptiveAssessmentStep({
    learnerTheta: 0.0,
    administeredResponses: [{ item: ITEM_EASY, correct: false }],
    candidatePool: [ITEM_EASY, ITEM_MATCHED],
  })
  assert.strictEqual(wrongStep.ok, true)
  assert.strictEqual(wrongStep.updatedTheta < 0.0, true)

  const badTheta = evaluateAdaptiveAssessmentStep({
    learnerTheta: 4.0001,
    administeredResponses: [],
    candidatePool: [],
  })
  assert.strictEqual(badTheta.ok, false)
  assert.strictEqual(badTheta.reason, 'theta-out-of-bounds')

  const badGuessing = evaluateAdaptiveAssessmentStep({
    learnerTheta: 0,
    administeredResponses: [],
    candidatePool: [{ ...ITEM_EASY, guessingC: 0.36 }],
  })
  assert.strictEqual(badGuessing.ok, false)
  assert.strictEqual(badGuessing.reason, 'invalid-item-parameters')
})
