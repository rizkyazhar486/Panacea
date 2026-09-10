import assert from 'node:assert/strict'
import {
  EYE_MULTISCALE_VIEW_CONTROLLER_BOUNDARY,
  createEyeMultiscaleViewController,
  validateEyeMultiscaleViewCatalog,
} from '../../src/lib/anatomy/eyeMultiscaleViewController.ts'
import type { EyeLearningViewState } from '../../src/lib/anatomy/eyeLearningViewContract.ts'

const staticView = (
  id: string,
  scale: EyeLearningViewState['scale'],
  nodeId: string,
): EyeLearningViewState => ({
  id,
  label: id,
  scale,
  canonicalNodeIds: [nodeId],
  evidenceRefs: [`repo:test:${id}`],
  motion: 'static',
  reviewStatus: 'academic-review-pending',
  patientSpecific: false,
  functionalInferenceAllowed: false,
  lesionLocalizationAllowed: false,
  publicationReady: false,
})

const views: EyeLearningViewState[] = [
  staticView('eye-organ', 'organ', 'fixture:eye'),
  staticView('retina-suborgan', 'suborgan', 'fixture:retina'),
  staticView('retina-tissue', 'tissue', 'fixture:retinal-tissue'),
  staticView('photoreceptor-cell', 'cellular', 'fixture:photoreceptor'),
  {
    ...staticView('opsin-molecular', 'molecular', 'fixture:opsin'),
    motion: 'representational',
    conformationalEvidenceRefs: ['repo:test:opsin-conformation'],
  },
]

const canonicalNodeIds = new Set([
  'fixture:eye',
  'fixture:retina',
  'fixture:retinal-tissue',
  'fixture:photoreceptor',
  'fixture:opsin',
])

const catalog = { views, canonicalNodeIds }
assert.deepEqual(validateEyeMultiscaleViewCatalog(catalog), [])

const controller = createEyeMultiscaleViewController(catalog, 'eye-organ')
assert.equal(controller.currentViewId, 'eye-organ')

let decision = controller.transition('retina-suborgan')
assert.equal(decision.status, 'eligible')
assert.equal(decision.scaleDelta, 1)
assert.equal(controller.currentViewId, 'retina-suborgan')
assert.equal(decision.mayInferFunction, false)
assert.equal(decision.mayLocalizeLesion, false)
assert.equal(decision.patientSpecific, false)

decision = controller.transition('opsin-molecular')
assert.equal(decision.status, 'blocked')
assert.ok(decision.blockers.includes('scale-skip:suborgan->molecular'))
assert.equal(controller.currentViewId, 'retina-suborgan', 'blocked transition must not mutate controller state')

decision = controller.transition('retina-tissue')
assert.equal(decision.status, 'eligible')
decision = controller.transition('photoreceptor-cell')
assert.equal(decision.status, 'eligible')
decision = controller.transition('opsin-molecular')
assert.equal(decision.status, 'eligible')
assert.equal(decision.mayAnimate, true)
assert.equal(controller.currentViewId, 'opsin-molecular')

const unknownNodeView = staticView('unknown-node', 'organ', 'fixture:not-canonical')
const badCatalog = { views: [unknownNodeView], canonicalNodeIds }
assert.ok(validateEyeMultiscaleViewCatalog(badCatalog).includes('view:unknown-node:unknown-canonical-node:fixture:not-canonical'))

const duplicateCatalog = { views: [views[0]!, { ...views[0]! }], canonicalNodeIds }
assert.ok(validateEyeMultiscaleViewCatalog(duplicateCatalog).includes('duplicate-view-id:eye-organ'))

const unsupportedMotion: EyeLearningViewState = {
  ...staticView('unsupported-motion', 'molecular', 'fixture:opsin'),
  motion: 'representational',
}
const motionCatalog = { views: [unsupportedMotion], canonicalNodeIds }
const motionController = createEyeMultiscaleViewController(motionCatalog)
const blockedMotion = motionController.transition('unsupported-motion')
assert.equal(blockedMotion.status, 'blocked')
assert.ok(blockedMotion.blockers.some((blocker) => blocker.includes('missing-conformational-evidence')))
assert.equal(blockedMotion.mayAnimate, false)

assert.match(EYE_MULTISCALE_VIEW_CONTROLLER_BOUNDARY, /does not establish anatomical containment/)
assert.match(EYE_MULTISCALE_VIEW_CONTROLLER_BOUNDARY, /lesion localization/)
assert.match(EYE_MULTISCALE_VIEW_CONTROLLER_BOUNDARY, /academic publication readiness/)

console.log('eye-multiscale-view-controller: fail-closed adjacent scale sequencing verified')
