import assert from 'node:assert/strict'
import { createEyeMultiscaleViewController } from '../../src/lib/anatomy/eyeMultiscaleViewController'
import type { EyeLearningViewState } from '../../src/lib/anatomy/eyeLearningViewContract'
const make = (id: string, scale: EyeLearningViewState['scale'], node: string): EyeLearningViewState => ({
  id, label: id, scale, canonicalNodeIds: [node], evidenceRefs: ['fixture:evidence'], motion: 'static',
  reviewStatus: 'academic-review-pending', patientSpecific: false, functionalInferenceAllowed: false,
  lesionLocalizationAllowed: false, publicationReady: false,
})
const organ = make('organ', 'organ', 'organ:eye')
const suborgan = make('suborgan', 'suborgan', 'suborgan:retina')
const molecular = make('molecular', 'molecular', 'molecule:opsin')
const controller = createEyeMultiscaleViewController({ views: [organ, suborgan, molecular], canonicalNodeIds: new Set(['organ:eye', 'suborgan:retina', 'molecule:opsin']) })
assert.equal(controller.transition('organ').status, 'eligible')
assert.equal(controller.transition('suborgan').status, 'eligible')
const skip = controller.transition('molecular')
assert.equal(skip.status, 'blocked')
assert.ok(skip.blockers.some((item) => item.startsWith('scale-skip:')))
assert.equal(controller.currentViewId, 'suborgan')
console.log('Eye multiscale view controller: PASS')
