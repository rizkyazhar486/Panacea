import assert from 'node:assert/strict'
import { buildEyeRendererViewInstruction } from '../../src/lib/anatomy/eyeRendererViewBridge'
import type { EyeLearningViewState } from '../../src/lib/anatomy/eyeLearningViewContract'
const view: EyeLearningViewState = {
  id: 'eye-organ', label: 'Eye', scale: 'organ', canonicalNodeIds: ['organ:eye'], evidenceRefs: ['fixture:evidence'],
  motion: 'static', reviewStatus: 'academic-review-pending', patientSpecific: false,
  functionalInferenceAllowed: false, lesionLocalizationAllowed: false, publicationReady: false,
}
const transition = {
  status: 'eligible', blockers: [], fromViewId: null, toViewId: 'eye-organ', scaleDelta: null,
  mayRender: true, mayAnimate: true, mayInferFunction: false, mayLocalizeLesion: false, patientSpecific: false,
} as const
const ok = buildEyeRendererViewInstruction(transition, view, (canonicalNodeId) => ({ canonicalNodeId, rendererTargetId: 'mesh:eye' }))
assert.equal(ok.status, 'eligible')
assert.equal(ok.mayCreateRenderer, false)
assert.equal(ok.mayLoadAsset, false)
assert.equal(ok.mayMutateGeometry, false)
const unresolved = buildEyeRendererViewInstruction(transition, view, () => null)
assert.equal(unresolved.status, 'blocked')
assert.equal(unresolved.targets.length, 0)
console.log('Eye renderer view bridge: PASS')
