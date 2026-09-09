import assert from 'node:assert/strict'
import {
  EYE_RENDERER_VIEW_BRIDGE_BOUNDARY,
  buildEyeRendererViewInstruction,
  type EyeRendererCanonicalResolver,
} from '../../src/lib/anatomy/eyeRendererViewBridge.ts'
import type { EyeLearningViewState } from '../../src/lib/anatomy/eyeLearningViewContract.ts'
import type { EyeMultiscaleTransitionDecision } from '../../src/lib/anatomy/eyeMultiscaleViewController.ts'

const view: EyeLearningViewState = {
  id: 'fixture-retina-view',
  label: 'Fixture retina view',
  scale: 'suborgan',
  canonicalNodeIds: ['fixture:retina', 'fixture:optic-disc'],
  evidenceRefs: ['repo:test:retina-view'],
  motion: 'static',
  reviewStatus: 'academic-review-pending',
  patientSpecific: false,
  functionalInferenceAllowed: false,
  lesionLocalizationAllowed: false,
  publicationReady: false,
}

const eligibleTransition: EyeMultiscaleTransitionDecision = {
  status: 'eligible',
  blockers: [],
  fromViewId: 'fixture-eye-view',
  toViewId: view.id,
  scaleDelta: 1,
  mayRender: true,
  mayAnimate: true,
  mayInferFunction: false,
  mayLocalizeLesion: false,
  patientSpecific: false,
}

const exactTargets = new Map([
  ['fixture:retina', { canonicalNodeId: 'fixture:retina', rendererTargetId: 'renderer:retina', exactSourceIdentity: 'fixture-source:retina' }],
  ['fixture:optic-disc', { canonicalNodeId: 'fixture:optic-disc', rendererTargetId: 'renderer:optic-disc', exactSourceIdentity: 'fixture-source:optic-disc' }],
])
const exactResolver: EyeRendererCanonicalResolver = (id) => exactTargets.get(id) ?? null

let instruction = buildEyeRendererViewInstruction(eligibleTransition, view, exactResolver)
assert.equal(instruction.status, 'eligible')
assert.deepEqual(instruction.targets.map((target) => target.canonicalNodeId), view.canonicalNodeIds)
assert.equal(instruction.cameraIntent, 'fit-resolved-targets')
assert.equal(instruction.motion, 'none')
assert.equal(instruction.mayCreateRenderer, false)
assert.equal(instruction.mayLoadAsset, false)
assert.equal(instruction.mayMutateGeometry, false)
assert.equal(instruction.mayInferFunction, false)
assert.equal(instruction.mayLocalizeLesion, false)
assert.equal(instruction.patientSpecific, false)
assert.equal(instruction.publicationReady, false)

instruction = buildEyeRendererViewInstruction(
  { ...eligibleTransition, status: 'blocked', mayRender: false, blockers: ['fixture-block'] },
  view,
  exactResolver,
)
assert.equal(instruction.status, 'blocked')
assert.ok(instruction.blockers.includes('transition-not-renderable'))
assert.deepEqual(instruction.targets, [])

instruction = buildEyeRendererViewInstruction(eligibleTransition, view, (id) =>
  id === 'fixture:retina' ? exactTargets.get(id) ?? null : null,
)
assert.equal(instruction.status, 'blocked')
assert.ok(instruction.blockers.includes('unresolved-canonical-target:fixture:optic-disc'))
assert.ok(instruction.blockers.includes('incomplete-render-target-set'))
assert.deepEqual(instruction.targets, [])

instruction = buildEyeRendererViewInstruction(eligibleTransition, view, (id) => ({
  canonicalNodeId: id === 'fixture:retina' ? 'fixture:wrong-node' : id,
  rendererTargetId: `renderer:${id}`,
}))
assert.equal(instruction.status, 'blocked')
assert.ok(instruction.blockers.includes('resolver-identity-mismatch:fixture:retina'))

const molecularView: EyeLearningViewState = {
  ...view,
  id: 'fixture-opsin-view',
  scale: 'molecular',
  canonicalNodeIds: ['fixture:opsin'],
  motion: 'representational',
  conformationalEvidenceRefs: ['repo:test:opsin-conformation'],
}
const molecularTransition: EyeMultiscaleTransitionDecision = {
  ...eligibleTransition,
  fromViewId: 'fixture-photoreceptor-view',
  toViewId: molecularView.id,
  mayAnimate: true,
}
instruction = buildEyeRendererViewInstruction(molecularTransition, molecularView, (id) => ({
  canonicalNodeId: id,
  rendererTargetId: 'renderer:opsin',
}))
assert.equal(instruction.status, 'eligible')
assert.equal(instruction.motion, 'representational')

instruction = buildEyeRendererViewInstruction(
  { ...molecularTransition, mayAnimate: false },
  molecularView,
  (id) => ({ canonicalNodeId: id, rendererTargetId: 'renderer:opsin' }),
)
assert.equal(instruction.status, 'blocked')
assert.ok(instruction.blockers.includes('representational-motion-not-authorized'))
assert.equal(instruction.motion, 'none')

assert.match(EYE_RENDERER_VIEW_BRIDGE_BOUNDARY, /exact Panacea-resolved canonical identities/)
assert.match(EYE_RENDERER_VIEW_BRIDGE_BOUNDARY, /Camera framing is presentation only, never evidence/)

console.log('eye-renderer-view-bridge: exact fail-closed renderer-neutral instructions verified')
