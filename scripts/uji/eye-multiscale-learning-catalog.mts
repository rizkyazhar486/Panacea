import assert from 'node:assert/strict'
import { EYE_VISIBLE_WAVE1 } from '../../src/lib/anatomy/eyeVisibleWave1'
import { EYE_STRUCTURAL_WAVE2 } from '../../src/lib/anatomy/eyeStructuralWave2'
import { EYE_HISTOLOGY_WAVE3 } from '../../src/lib/anatomy/eyeHistologyWave3'
import { EYE_CELL_ORGANELLE_WAVE4 } from '../../src/lib/anatomy/eyeCellOrganelleWave4'
import { EYE_MOLECULAR_WAVE5_NODES } from '../../src/lib/anatomy/eyeMolecularWave5'
import { evaluateEyeLearningView } from '../../src/lib/anatomy/eyeLearningViewContract'
import { createEyeMultiscaleViewController } from '../../src/lib/anatomy/eyeMultiscaleViewController'
import {
  EYE_MULTISCALE_CANONICAL_IDS,
  EYE_MULTISCALE_LEARNING_ROUTES,
  EYE_RETINA_MULTISCALE_CANONICAL_IDS,
  EYE_RETINA_MULTISCALE_LEARNING_ROUTE,
} from '../../src/lib/anatomy/eyeMultiscaleLearningCatalog'

const expectedScales = ['organ', 'suborgan', 'tissue', 'cellular', 'molecular']
assert.deepEqual(EYE_RETINA_MULTISCALE_LEARNING_ROUTE.map((view) => view.scale), expectedScales)

const sourceIds = new Set([
  ...EYE_VISIBLE_WAVE1.map((item) => item.id),
  ...EYE_STRUCTURAL_WAVE2.map((item) => item.id),
  ...EYE_HISTOLOGY_WAVE3.map((item) => item.id),
  ...EYE_CELL_ORGANELLE_WAVE4.map((item) => item.id),
  ...EYE_MOLECULAR_WAVE5_NODES.map((item) => item.id),
])

for (const [routeName, route] of Object.entries(EYE_MULTISCALE_LEARNING_ROUTES)) {
  assert.ok(route.length >= 2, `${routeName}: route must contain at least two learning states`)
  assert.equal(route[0]?.scale, 'organ', `${routeName}: route must begin at organ scale`)

  let previousRank = -1
  const scaleRank = new Map([
    ['organ', 0],
    ['suborgan', 1],
    ['tissue', 2],
    ['cellular', 3],
    ['molecular', 4],
  ])

  for (const view of route) {
    const rank = scaleRank.get(view.scale)
    assert.notEqual(rank, undefined, `${routeName}: unknown scale ${view.scale}`)
    assert.ok((rank ?? -1) >= previousRank, `${routeName}: scale order regressed at ${view.id}`)
    previousRank = rank ?? previousRank

    const decision = evaluateEyeLearningView(view)
    assert.equal(decision.status, 'eligible', `${routeName}:${view.id}:${decision.blockers.join(',')}`)
    assert.equal(view.reviewStatus, 'academic-review-pending')
    assert.equal(view.patientSpecific, false)
    assert.equal(view.functionalInferenceAllowed, false)
    assert.equal(view.lesionLocalizationAllowed, false)
    assert.equal(view.publicationReady, false)
    assert.ok(view.evidenceRefs.length > 0, `${routeName}:${view.id}: missing evidence`)
    for (const id of view.canonicalNodeIds) {
      assert.ok(sourceIds.has(id), `${routeName}:${view.id}: unknown existing Eye source id ${id}`)
      assert.ok(EYE_MULTISCALE_CANONICAL_IDS.has(id), `${routeName}:${view.id}: canonical index missing ${id}`)
    }
  }
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

assert.deepEqual(Object.keys(EYE_MULTISCALE_LEARNING_ROUTES).sort(), [
  'aqueousOutflow',
  'cornea',
  'lens',
  'retina',
  'visualPathway',
])
console.log('Eye multiscale learning catalog: PASS')
