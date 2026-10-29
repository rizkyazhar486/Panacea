import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateEducationalMastery } from '../../src/domains/scientific-research/model/prometheusEducationalContract.ts'

test('Prometheus Educational Contract validates evidence persistence and learning progression', () => {
  const sampleContract = {
    learnerId: 'USR-STUDENT-01',
    conceptId: 'CARDIO-CORONARY-01',
    learningObjectiveId: 'OBJ-MYOCARDIAL-OXYGEN-01',
    sessionId: 'SES-2026-1029-01',
    anatomyContext: {
      region: 'Left Anterior Descending Artery',
      vesselSegment: 'Proximal LAD',
      perfusionStatus: 'ISCHEMIC_RISK'
    },
    simulationReference: {
      modelType: 'ILLUSTRATIVE_CARDIAC_FLOW',
      reproducibleSeed: 4242,
      oxygenDeliveryIndex: 0.78
    },
    assessmentEvidence: {
      completed: true,
      score: 92.0,
      attempts: 1
    },
    misconceptionEvidence: {
      identifiedMisconception: 'Confusing systemic blood pressure with local coronary perfusion pressure during diastole.',
      remediated: true
    },
    masteryEstimate: 0.91,
    uncertainty: 0.05,
    sourceProvenance: ['PMID:28491022', 'DOI:10.1016/j.jacc.2021'],
    version: '1.0.0'
  }

  const evaluation = evaluateEducationalMastery(sampleContract)
  assert.equal(evaluation.status, 'MASTERY_ACHIEVED')
  assert.ok(evaluation.verifiedConfidence > 0.8)
  console.log('✅ Directive 008 Prometheus Educational Contract Verified:', evaluation)
})
