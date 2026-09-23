import assert from 'node:assert/strict'
import {
  BODY_PROCEDURE_4D_BOUNDARY,
  BODY_PROCEDURE_4D_MODULES,
  getBodyProcedure4dModule,
} from '../../src/lib/bodyProcedure4dContract.ts'

const expectedIds = [
  'mechanical-ventilation',
  'fluid-resuscitation',
  'hemodialysis',
  'ecmo',
  'normal-vaginal-delivery',
  'endoscopy',
  'tracheal-intubation',
  'neonatal-resuscitation',
] as const

assert.equal(BODY_PROCEDURE_4D_MODULES.length, expectedIds.length)
assert.deepEqual(BODY_PROCEDURE_4D_MODULES.map((entry) => entry.id), expectedIds)
assert.equal(new Set(BODY_PROCEDURE_4D_MODULES.map((entry) => entry.id)).size, expectedIds.length)

for (const module of BODY_PROCEDURE_4D_MODULES) {
  assert.equal(module.representation, 'educational-4d-simulation-contract')
  assert.equal(module.reviewStatus, 'academic-review-pending')
  assert.equal(module.temporalModelRequired, true)
  assert.equal(module.sourceControlledGeometryRequired, true)
  assert.equal(module.patientSpecific, false)
  assert.equal(module.clinicalInferenceAllowed, false)
  assert.equal(module.treatmentRecommendationAllowed, false)
  assert.ok(module.requiredLayers.includes('anatomy'))
  assert.ok(module.requiredLayers.includes('physiology'))
  assert.ok(module.requiredLayers.includes('time-response'))
  assert.ok(module.learningFocus.length >= 4)
}

assert.deepEqual(getBodyProcedure4dModule('ecmo').variants, ['VV-ECMO', 'VA-ECMO'])
assert.deepEqual(getBodyProcedure4dModule('endoscopy').variants, ['upper-GI endoscopy', 'colonoscopy', 'bronchoscopy'])
assert.deepEqual(getBodyProcedure4dModule('tracheal-intubation').variants, ['direct laryngoscopy', 'video laryngoscopy'])

for (const id of ['mechanical-ventilation', 'hemodialysis', 'ecmo'] as const) {
  const module = getBodyProcedure4dModule(id)
  assert.ok(module.requiredLayers.includes('cell-membrane'))
  assert.ok(module.requiredLayers.includes('molecular-transport'))
}

assert.equal(BODY_PROCEDURE_4D_BOUNDARY.patientSpecificInference, false)
assert.equal(BODY_PROCEDURE_4D_BOUNDARY.diagnosisAllowed, false)
assert.equal(BODY_PROCEDURE_4D_BOUNDARY.treatmentRecommendationAllowed, false)
assert.equal(BODY_PROCEDURE_4D_BOUNDARY.autonomousProcedureGuidanceAllowed, false)
assert.equal(BODY_PROCEDURE_4D_BOUNDARY.unreviewedClinicalPublicationAllowed, false)
assert.equal(BODY_PROCEDURE_4D_BOUNDARY.geometryFabricationAllowed, false)

console.log(JSON.stringify({
  moduleCount: BODY_PROCEDURE_4D_MODULES.length,
  temporalModelRequired: true,
  sourceControlledGeometryRequired: true,
  patientSpecificInference: BODY_PROCEDURE_4D_BOUNDARY.patientSpecificInference,
  treatmentRecommendationAllowed: BODY_PROCEDURE_4D_BOUNDARY.treatmentRecommendationAllowed,
}, null, 2))
