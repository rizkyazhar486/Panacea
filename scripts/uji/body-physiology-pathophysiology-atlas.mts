import assert from 'node:assert/strict'
import {
  PATHOPHYSIOLOGY_MODULES,
  PHYSIOLOGY_ATLAS_BOUNDARY,
  getMechanismStep,
  getPathophysiologyForDomain,
  getPathophysiologyModule,
} from '../../src/lib/bodyPhysiologyPathophysiologyAtlas.ts'

for (const id of ['atherosclerosis','ischemic-stroke','hemorrhagic-stroke','heart-failure','deep-vein-thrombosis','coronary-artery-disease']) {
  const module = getPathophysiologyModule(id)
  assert.ok(module, `${id} module missing`)
  assert.ok(module.steps.length >= 4, `${id} should have a multi-step mechanism chain`)
  assert.equal(module.interpretationBoundary.educationalOnly, true)
  assert.equal(module.interpretationBoundary.patientSpecificInference, false)
  assert.equal(module.interpretationBoundary.diagnosisOrTreatment, false)
  assert.equal(module.interpretationBoundary.academicAccuracyGateRequiredForClinicalUse, true)
  assert.equal(module.interpretationBoundary.qualifiedHumanReviewRequired, true)
  const orders = module.steps.map((entry) => entry.order)
  assert.deepEqual(orders, [...orders].sort((a,b) => a-b), `${id} steps must remain ordered`)
  for (const entry of module.steps) {
    assert.ok(entry.structures.length > 0, `${entry.id} requires structures`)
    assert.ok(entry.mechanisms.length > 0, `${entry.id} requires mechanisms`)
    assert.ok(entry.explanation.length > 40, `${entry.id} explanation too thin`)
  }
}

const athero = getPathophysiologyModule('atherosclerosis')!
assert.ok(athero.steps.some((entry) => entry.layer === 'endothelium'))
assert.ok(athero.steps.some((entry) => entry.layer === 'tunica-intima'))
assert.ok(athero.steps.some((entry) => entry.layer === 'tunica-media'))
assert.ok(athero.steps.some((entry) => entry.mechanisms.includes('platelet-activation')))
assert.ok(athero.steps.some((entry) => entry.mechanisms.includes('coagulation')))

const ischemic = getPathophysiologyModule('ischemic-stroke')!
for (const id of ['ischemic-stroke-occlusion','ischemic-stroke-collateral','ischemic-stroke-energy','ischemic-stroke-excitotoxic','ischemic-stroke-edema']) assert.ok(getMechanismStep(id), `${id} missing`)
assert.ok(ischemic.steps.some((entry) => entry.structures.includes('blood-brain barrier')))
assert.ok(ischemic.steps.some((entry) => entry.scale === 'organelle'))
assert.ok(ischemic.steps.some((entry) => entry.scale === 'molecular-pathway'))

const heartFailure = getPathophysiologyModule('heart-failure')!
assert.ok(heartFailure.domainIds.includes('respiratory'))
assert.ok(heartFailure.domainIds.includes('renal-urinary'))
assert.ok(heartFailure.domainIds.includes('endocrine'))
assert.ok(heartFailure.steps.some((entry) => entry.mechanisms.includes('neurohumoral')))
assert.ok(heartFailure.steps.some((entry) => entry.mechanisms.includes('edema')))

const dvt = getPathophysiologyModule('deep-vein-thrombosis')!
assert.ok(dvt.steps.some((entry) => entry.structures.includes('venous valve pocket')))
assert.ok(dvt.steps.some((entry) => entry.mechanisms.includes('embolization')))
assert.ok(dvt.clinicalConsequences.includes('pulmonary embolism'))

const cardio = getPathophysiologyForDomain('cardiovascular')
assert.ok(cardio.length >= 5)
assert.ok(cardio.some((module) => module.id === 'atherosclerosis'))
assert.ok(cardio.some((module) => module.id === 'ischemic-stroke'))
assert.ok(cardio.some((module) => module.id === 'heart-failure'))
assert.ok(cardio.some((module) => module.id === 'deep-vein-thrombosis'))

assert.equal(PHYSIOLOGY_ATLAS_BOUNDARY.educationalOnly, true)
assert.equal(PHYSIOLOGY_ATLAS_BOUNDARY.genericAtlasGeometryOnly, true)
assert.equal(PHYSIOLOGY_ATLAS_BOUNDARY.patientSpecificInference, false)
assert.equal(PHYSIOLOGY_ATLAS_BOUNDARY.diagnosticDecisionSupport, false)
assert.equal(PHYSIOLOGY_ATLAS_BOUNDARY.treatmentRecommendation, false)
assert.equal(PHYSIOLOGY_ATLAS_BOUNDARY.validatedQuantitationRequiredBeforeDisplayingPatientMetrics, true)
assert.equal(PHYSIOLOGY_ATLAS_BOUNDARY.highRiskClinicalUseRequiresAcademicAccuracyGate, true)
assert.equal(PHYSIOLOGY_ATLAS_BOUNDARY.highRiskClinicalUseRequiresQualifiedHumanReview, true)

assert.equal(new Set(PATHOPHYSIOLOGY_MODULES.map((module) => module.id)).size, PATHOPHYSIOLOGY_MODULES.length)
console.log('Body physiology/pathophysiology atlas contract verified.')
