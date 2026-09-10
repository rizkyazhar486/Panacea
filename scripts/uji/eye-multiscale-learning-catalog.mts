import assert from 'node:assert/strict'
import { EYE_VISIBLE_WAVE1 } from '../../src/lib/anatomy/eyeVisibleWave1'
import { EYE_HISTOLOGY_WAVE3 } from '../../src/lib/anatomy/eyeHistologyWave3'
import { EYE_CELL_ORGANELLE_WAVE4 } from '../../src/lib/anatomy/eyeCellOrganelleWave4'
import { EYE_MOLECULAR_WAVE5_NODES } from '../../src/lib/anatomy/eyeMolecularWave5'
import { evaluateEyeLearningView } from '../../src/lib/anatomy/eyeLearningViewContract'
import { createEyeMultiscaleViewController } from '../../src/lib/anatomy/eyeMultiscaleViewController'
import {
  EYE_RETINA_MULTISCALE_CANONICAL_IDS,
  EYE_RETINA_MULTISCALE_LEARNING_ROUTE,
} from '../../src/lib/anatomy/eyeMultiscaleLearningCatalog'

const expectedScales = ['organ', 'suborgan', 'tissue', 'cellular', 'molecular']
assert.deepEqual(EYE_RETINA_MULTISCALE_LEARNING_ROUTE.map((view) => view.scale), expectedScales)

const sourceIds = new Set([
  ...EYE_VISIBLE_WAVE1.map((item) => item.id),
  ...EYE_HISTOLOGY_WAVE3.map((item) => item.id),
  ...EYE_CELL_ORGANELLE_WAVE4.map((item) => item.id),
  ...EYE_MOLECULAR_WAVE5_NODES.map((item) => item.id),
])
for (const view of EYE_RETINA_MULTISCALE_LEARNING_ROUTE) {
  assert.equal(evaluateEyeLearningView(view).status, 'eligible')
  assert.equal(view.reviewStatus, 'academic-review-pending')
  assert.equal(view.patientSpecific, false)
  assert.equal(view.functionalInferenceAllowed, false)
  assert.equal(view.lesionLocalizationAllowed, false)
  assert.equal(view.publicationReady, false)
  for (const id of view.canonicalNodeIds) assert.ok(sourceIds.has(id), `Unknown existing Eye source id: ${id}`)
}

const controller = createEyeMultiscaleViewController({
  views: EYE_RETINA_MULTISCALE_LEARNING_ROUTE,
  canonicalNodeIds: EYE_RETINA_MULTISCALE_CANONICAL_IDS,
})
for (const view of EYE_RETINA_MULTISCALE_LEARNING_ROUTE) {
  const transition = controller.transition(view.id)
  assert.equal(transition.status, 'eligible', transition.blockers.join(','))
}
assert.equal(controller.currentViewId, 'eye-route-rhodopsin')
console.log('Eye multiscale learning catalog: PASS')
