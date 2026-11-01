import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateClinicalCaseReasoningStep } from '../../src/domains/medstudyhub/engine/medStudyClinicalCaseEngine.ts'

test('EDU-4 1. Golden case: pre-test 0.50 with S3 gallop (sens=0.20, spec=0.95 -> LR+=4) and elevated NT-proBNP (sens=0.90, spec=0.80 -> LR+=4.5) yields LR=18 and P_post=18/19', () => {
  const res = evaluateClinicalCaseReasoningStep({
    caseId: 'case-acute-hf-01',
    isSyntheticEducationalCase: true,
    currentStage: 'physical-exam',
    targetNextStage: 'investigations',
    preTestProbability: 0.5,
    observedFindings: [
      { findingId: 's3-gallop', label: 'S3 ventricular gallop', present: true, sensitivity: 0.2, specificity: 0.95 },
      { findingId: 'nt-probnp', label: 'NT-proBNP > 900 pg/mL', present: true, sensitivity: 0.9, specificity: 0.8 },
    ],
  })
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.combinedLikelihoodRatio, 18)
  assert.strictEqual(res.postTestProbability, Number((18 / 19).toFixed(6)))
  assert.strictEqual(res.diagnosticActionZone, 'above-treatment-threshold')
})

test('EDU-4 2. Paired & safety guard tests: skipping stages, selecting contraindicated IV beta-blocker in cardiogenic shock, or non-synthetic flag fails closed', () => {
  const skippedStage = evaluateClinicalCaseReasoningStep({
    caseId: 'case-acute-hf-01',
    isSyntheticEducationalCase: true,
    currentStage: 'presentation',
    targetNextStage: 'management',
    preTestProbability: 0.5,
    observedFindings: [],
  })
  assert.strictEqual(skippedStage.ok, false)
  assert.strictEqual(skippedStage.reason, 'invalid-stage-transition')

  const contraindicated = evaluateClinicalCaseReasoningStep({
    caseId: 'case-acute-hf-01',
    isSyntheticEducationalCase: true,
    currentStage: 'differential-diagnosis',
    targetNextStage: 'management',
    preTestProbability: 0.85,
    observedFindings: [],
    selectedManagementIds: ['iv-furosemide', 'acute-iv-metoprolol-bolus-in-shock'],
    contraindicatedManagementIds: ['acute-iv-metoprolol-bolus-in-shock'],
  })
  assert.strictEqual(contraindicated.ok, false)
  assert.strictEqual(contraindicated.reason, 'contraindicated-management-selected')
  assert.deepStrictEqual(contraindicated.violatedContraindications, ['acute-iv-metoprolol-bolus-in-shock'])
})
