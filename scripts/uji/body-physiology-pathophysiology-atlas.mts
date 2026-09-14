import assert from 'node:assert/strict'
import {
  BODY_PHYSIOLOGY_PATHOPHYSIOLOGY_ATLAS,
  getBodyPathophysiologyModule,
} from '../../src/lib/bodyPhysiologyPathophysiologyAtlas.ts'

assert.equal(BODY_PHYSIOLOGY_PATHOPHYSIOLOGY_ATLAS.length, 6)
assert.equal(new Set(BODY_PHYSIOLOGY_PATHOPHYSIOLOGY_ATLAS.map((m) => m.id)).size, 6)

for (const module of BODY_PHYSIOLOGY_PATHOPHYSIOLOGY_ATLAS) {
  assert.equal(module.educationalOnly, true)
  assert.equal(module.patientSpecificInference, false)
  assert.equal(module.diagnosisOrTreatment, false)
  assert.equal(module.academicAccuracyGateRequiredForClinicalUse, true)
  assert.equal(module.qualifiedHumanReviewRequired, true)
  assert.ok(module.steps.length >= 4)
  assert.deepEqual(module.steps.map((step) => step.order), [1, 2, 3, 4])
  assert.equal(new Set(module.steps.map((step) => step.id)).size, module.steps.length)
  assert.ok(module.steps.every((step) => step.structures.length > 0))
  assert.ok(module.steps.every((step) => step.mechanism.length > 20))
}

assert.ok(getBodyPathophysiologyModule('atherosclerosis'))
assert.ok(getBodyPathophysiologyModule('ischemic-stroke'))
assert.ok(getBodyPathophysiologyModule('intracerebral-hemorrhage'))
assert.ok(getBodyPathophysiologyModule('heart-failure'))
assert.ok(getBodyPathophysiologyModule('deep-vein-thrombosis'))
assert.ok(getBodyPathophysiologyModule('coronary-artery-disease'))
assert.equal(getBodyPathophysiologyModule('not-a-real-module'), undefined)

const stroke = getBodyPathophysiologyModule('ischemic-stroke')!
assert.ok(stroke.domainIds.includes('nervous-system'))
assert.ok(stroke.steps.some((step) => step.scale === 'organelle'))
assert.ok(stroke.steps.some((step) => step.scale === 'molecular-pathway'))

const heartFailure = getBodyPathophysiologyModule('heart-failure')!
assert.ok(heartFailure.domainIds.includes('endocrine'))
assert.ok(heartFailure.steps.some((step) => step.scale === 'endocrine-signal'))

const dvt = getBodyPathophysiologyModule('deep-vein-thrombosis')!
assert.ok(dvt.steps.some((step) => step.title === 'Potential embolic pathway'))

const serialized = JSON.stringify(BODY_PHYSIOLOGY_PATHOPHYSIOLOGY_ATLAS)
assert.doesNotMatch(serialized, /patient-specific measurement/i)
assert.doesNotMatch(serialized, /diagnose this patient/i)
assert.doesNotMatch(serialized, /treatment recommendation/i)

console.log('Body physiology/pathophysiology atlas contract verified on six bounded educational modules.')
