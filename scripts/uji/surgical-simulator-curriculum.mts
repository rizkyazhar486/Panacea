import assert from 'node:assert/strict'
import { SURGICAL_SIMULATOR_BOUNDARY, SURGICAL_SIMULATOR_MODULES, getSurgicalSimulationModule } from '../../src/lib/surgicalSimulatorCurriculum.ts'

const requiredDisciplines = ['general','digestive','cardiothoracic-vascular','oncology','pediatric','plastic-reconstructive','neurosurgery','orthopaedics-trauma','urology','oral-maxillofacial','vascular','transplant','endocrine','minimally-invasive','colorectal','trauma-critical-care','ophthalmic']
for (const discipline of requiredDisciplines) assert.ok(SURGICAL_SIMULATOR_MODULES.some((entry) => entry.discipline === discipline), `${discipline} curriculum missing`)
for (const id of ['lap-appendectomy','lap-cholecystectomy','aneurysm-clipping','fracture-fixation','vascular-revascularization','organ-transplant','trauma-crisis']) {
  const entry = getSurgicalSimulationModule(id)
  assert.ok(entry, `${id} missing`)
  assert.ok(entry!.phases.length >= 4)
  assert.ok(entry!.criticalStructures.length > 0)
  assert.ok(entry!.complicationConcepts.length > 0)
  assert.ok(entry!.assessmentDomains.length > 0)
  assert.equal(entry!.boundary.educationalSimulationOnly, true)
  assert.equal(entry!.boundary.patientSpecificProcedurePlanning, false)
  assert.equal(entry!.boundary.autonomousProcedureGuidance, false)
  assert.equal(entry!.boundary.treatmentRecommendation, false)
  assert.equal(entry!.boundary.academicAccuracyGateRequired, true)
  assert.equal(entry!.boundary.qualifiedHumanReviewRequired, true)
}
const aneurysm = getSurgicalSimulationModule('aneurysm-clipping')!
assert.ok(aneurysm.criticalStructures.includes('perforators'))
assert.ok(aneurysm.physiologyOverlays.includes('territorial perfusion'))
assert.ok(aneurysm.complicationConcepts.includes('parent-vessel compromise'))
assert.equal(SURGICAL_SIMULATOR_BOUNDARY.genericAtlasIsPatientAnatomy, false)
assert.equal(SURGICAL_SIMULATOR_BOUNDARY.validatedPatientDataRequiredForPatientSpecificUse, true)
assert.equal(new Set(SURGICAL_SIMULATOR_MODULES.map((entry) => entry.id)).size, SURGICAL_SIMULATOR_MODULES.length)
console.log('Surgical simulator curriculum contract verified.')
