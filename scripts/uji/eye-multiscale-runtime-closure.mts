import assert from 'node:assert/strict'
import { evaluateEyeLearningView, type EyeLearningViewState } from '../../src/lib/anatomy/eyeLearningViewContract'
import { createEyeMultiscaleViewController } from '../../src/lib/anatomy/eyeMultiscaleViewController'
import { buildEyeRendererViewInstruction } from '../../src/lib/anatomy/eyeRendererViewBridge'

const organ: EyeLearningViewState = {
  id: 'eye-organ', label: 'Eye', scale: 'organ', canonicalNodeIds: ['organ:eye'], evidenceRefs: ['fixture:evidence'],
  motion: 'static', reviewStatus: 'academic-review-pending', patientSpecific: false,
  functionalInferenceAllowed: false, lesionLocalizationAllowed: false, publicationReady: false,
}
const tissue: EyeLearningViewState = { ...organ, id: 'eye-tissue', scale: 'tissue', canonicalNodeIds: ['tissue:retina'] }
assert.equal(evaluateEyeLearningView(organ).status, 'eligible')
const controller = createEyeMultiscaleViewController({ views: [organ, tissue], canonicalNodeIds: new Set(['organ:eye', 'tissue:retina']) })
const first = controller.transition('eye-organ')
assert.equal(first.status, 'eligible')
const skipped = controller.transition('eye-tissue')
assert.equal(skipped.status, 'blocked')
assert.ok(skipped.blockers.some((item) => item.startsWith('scale-skip:')))
const instruction = buildEyeRendererViewInstruction(first, organ, (canonicalNodeId) => ({ canonicalNodeId, rendererTargetId: 'fixture:renderer-eye' }))
assert.equal(instruction.status, 'eligible')
assert.equal(instruction.targets.length, 1)
assert.equal(instruction.mayCreateRenderer, false)
assert.equal(instruction.mayInferFunction, false)
assert.equal(instruction.mayLocalizeLesion, false)
console.log('Eye multiscale runtime closure: PASS')
