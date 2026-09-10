import assert from 'node:assert/strict'
import { evaluateEyeLearningView, type EyeLearningViewState } from '../../src/lib/anatomy/eyeLearningViewContract'
const base: EyeLearningViewState = {
  id: 'eye-organ', label: 'Eye', scale: 'organ', canonicalNodeIds: ['organ:eye'], evidenceRefs: ['fixture:evidence'],
  motion: 'static', reviewStatus: 'academic-review-pending', patientSpecific: false,
  functionalInferenceAllowed: false, lesionLocalizationAllowed: false, publicationReady: false,
}
assert.equal(evaluateEyeLearningView(base).status, 'eligible')
assert.equal(evaluateEyeLearningView({ ...base, id: '' }).status, 'blocked')
assert.equal(evaluateEyeLearningView({ ...base, evidenceRefs: [] }).status, 'blocked')
assert.equal(evaluateEyeLearningView({ ...base, motion: 'representational' }).status, 'blocked')
assert.equal(evaluateEyeLearningView({ ...base, motion: 'representational', conformationalEvidenceRefs: ['fixture:motion'] }).mayAnimate, true)
console.log('Eye learning view contract: PASS')
