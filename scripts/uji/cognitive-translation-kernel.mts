import assert from 'node:assert/strict'
import {
  cognitiveProjectionPreservesAllAdmittedFields,
  planCognitiveTranslation,
  projectPhysiologyForCognition,
} from '../../src/lib/cognitiveTranslationKernel.ts'
import type { HumanStateProjection } from '../../src/lib/humanStateProjection.ts'

const field = (name: string, lane: 'observed' | 'estimated' | 'simulated') => ({
  name,
  unit: '1',
  value: lane === 'observed' ? 1 : lane === 'estimated' ? 2 : 3,
  sigma: lane === 'observed' ? null : 0.1,
  truthClass: lane === 'observed' ? 'measured' : lane === 'estimated' ? 'model-derived' : 'simulated',
  lane,
  provenanceId: `prov:${name}`,
  sourceEventIds: [`evt:${name}`],
}) as const

const physiology: HumanStateProjection['physiology'] = {
  observed: [field('observed.hr', 'observed')],
  estimated: [field('estimated.cardiac-output', 'estimated')],
  simulated: [field('simulated.after-intervention', 'simulated')],
  blocked: [],
}

const publicSee = projectPhysiologyForCognition(physiology, {
  audience: 'public',
  intent: 'see',
})
assert.equal(publicSee.plan.visibleDepth, 'orientation')
assert.deepEqual(publicSee.visible.observed.map((item) => item.name), ['observed.hr'])
assert.equal(publicSee.visible.estimated.length, 0)
assert.equal(publicSee.visible.simulated.length, 0)
assert.deepEqual(publicSee.recoverable.estimated.map((item) => item.name), ['estimated.cardiac-output'])
assert.deepEqual(publicSee.recoverable.simulated.map((item) => item.name), ['simulated.after-intervention'])
assert.equal(cognitiveProjectionPreservesAllAdmittedFields(physiology, publicSee), true)

const clinicianWhy = projectPhysiologyForCognition(physiology, {
  audience: 'clinician',
  intent: 'why',
})
assert.equal(clinicianWhy.plan.visibleDepth, 'quantitative')
assert.equal(clinicianWhy.visible.observed.length, 1)
assert.equal(clinicianWhy.visible.estimated.length, 1)
assert.equal(clinicianWhy.visible.simulated.length, 0)
assert.equal(clinicianWhy.recoverable.simulated.length, 1)
assert.equal(cognitiveProjectionPreservesAllAdmittedFields(physiology, clinicianWhy), true)

const publicWhatIf = projectPhysiologyForCognition(physiology, {
  audience: 'public',
  intent: 'what-if',
})
assert.equal(publicWhatIf.plan.visibleDepth, 'mechanism')
assert.deepEqual(publicWhatIf.plan.visibleTruthLanes, ['observed', 'estimated', 'simulated'])
assert.equal(publicWhatIf.visible.simulated[0].lane, 'simulated')
assert.equal(publicWhatIf.visible.simulated[0].provenanceId, 'prov:simulated.after-intervention')
assert.equal(cognitiveProjectionPreservesAllAdmittedFields(physiology, publicWhatIf), true)

const researcher = planCognitiveTranslation({ audience: 'researcher', intent: 'zoom' })
assert.equal(researcher.visibleDepth, 'research')
assert.equal(researcher.recoverableDepth, 'research')
assert.equal(researcher.requirements.preserveScientificState, true)
assert.equal(researcher.requirements.surfaceMayOwnIndependentHumanState, false)
assert.equal(researcher.requirements.translationMayInventScientificState, false)
assert.equal(researcher.requirements.counterfactualIsolation, true)

console.log('cognitive translation kernel: maximum scientific depth stays recoverable while first-view complexity adapts without mutating human truth')
