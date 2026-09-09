import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { WHOLE_BODY_BIOSCALE_ATLAS } from '../../src/lib/anatomy/wholeBodyBioScaleAtlas.ts'
import {
  compileFunctionalTopologyScene,
  functionalPathwayById,
  functionalTopologySystemCoverage,
  validateFunctionalTopologyManifest,
} from '../../src/lib/anatomy/atlasFunctionalTopology.ts'
import { WHOLE_BODY_FUNCTIONAL_TOPOLOGY } from '../../src/lib/anatomy/wholeBodyFunctionalTopology.ts'
import { HIGH_END_ATLAS_SYSTEMS } from '../../src/lib/anatomy/highEndAtlasRuntime.ts'

const issues = validateFunctionalTopologyManifest(
  COMPLETE_WHOLE_BODY_ATLAS,
  WHOLE_BODY_BIOSCALE_ATLAS,
  WHOLE_BODY_FUNCTIONAL_TOPOLOGY,
)
assert.deepEqual(
  issues,
  [],
  `Functional topology issues:\n${issues.map((issue) => `${issue.code}:${issue.pathwayId ?? 'manifest'}:${issue.edgeId ?? '-'}:${issue.message}`).join('\n')}`,
)

assert.deepEqual(
  functionalTopologySystemCoverage(WHOLE_BODY_FUNCTIONAL_TOPOLOGY),
  [...HIGH_END_ATLAS_SYSTEMS].sort(),
  'Functional topology must cover every high-end whole-body atlas system.',
)
assert.ok(WHOLE_BODY_FUNCTIONAL_TOPOLOGY.pathways.length >= HIGH_END_ATLAS_SYSTEMS.length)
for (const pathway of WHOLE_BODY_FUNCTIONAL_TOPOLOGY.pathways) {
  assert.equal(pathway.qualitativeOnly, true)
  assert.equal(pathway.patientSpecificAllowed, false)
  assert.equal(pathway.provenance.reviewStatus, 'academic-review-required')
  assert.ok(pathway.entryRefs.length >= 1)
  assert.ok(pathway.terminalRefs.length >= 1)
}

const respiratory = functionalPathwayById(WHOLE_BODY_FUNCTIONAL_TOPOLOGY, 'functional:respiratory-airflow-gas-exchange')
assert.ok(respiratory)
const respiratoryPlan = compileFunctionalTopologyScene(COMPLETE_WHOLE_BODY_ATLAS, WHOLE_BODY_BIOSCALE_ATLAS, respiratory!)
assert.equal(respiratoryPlan.qualitativeOnly, true)
assert.ok(respiratoryPlan.atlasPinNodeIds.includes('resp:carina'))
assert.ok(respiratoryPlan.atlasPinNodeIds.includes('resp:right-main-bronchus'))
assert.ok(respiratoryPlan.atlasPinNodeIds.includes('resp:left-main-bronchus'))
assert.ok(respiratoryPlan.atlasPinNodeIds.includes('he:alveolar-blood-gas-barrier'))
assert.ok(respiratoryPlan.bioReferenceNodeIds.includes('bio:respiratory:type-i-pneumocyte'))
assert.ok(respiratoryPlan.bioReferenceNodeIds.includes('bio:respiratory:gas-diffusion-interface'))
assert.ok(respiratoryPlan.overlayEdges.some((edge) => edge.id === 'air:carina-right'))
assert.ok(respiratoryPlan.overlayEdges.some((edge) => edge.id === 'air:carina-left'))
assert.ok(respiratoryPlan.waves.some((wave) => {
  const ids = new Set(wave.refs.map((ref) => ref.ref.id))
  return ids.has('resp:right-main-bronchus') && ids.has('resp:left-main-bronchus')
}), 'Airflow propagation should expose the authored carinal branch as one graph wave.')

const renal = functionalPathwayById(WHOLE_BODY_FUNCTIONAL_TOPOLOGY, 'functional:renal-filtration-urinary-flow')
assert.ok(renal)
const renalPlan = compileFunctionalTopologyScene(COMPLETE_WHOLE_BODY_ATLAS, WHOLE_BODY_BIOSCALE_ATLAS, renal!)
assert.ok(renalPlan.atlasPinNodeIds.includes('he:glomerulus'))
assert.ok(renalPlan.atlasPinNodeIds.includes('urinary:bladder'))
assert.ok(renalPlan.bioReferenceNodeIds.includes('bio:urinary:podocyte'))
assert.ok(renalPlan.bioReferenceNodeIds.includes('bio:urinary:nephrin-podocin-complex'))
assert.ok(renalPlan.waves.some((wave) => wave.refs.length > 1), 'Renal topology should preserve authored macroscopic/microscopic branching.')

const portal = functionalPathwayById(WHOLE_BODY_FUNCTIONAL_TOPOLOGY, 'functional:portal-hepatic-interface')
assert.ok(portal)
assert.equal(portal?.crossSystemAllowed, true)
const portalPlan = compileFunctionalTopologyScene(COMPLETE_WHOLE_BODY_ATLAS, WHOLE_BODY_BIOSCALE_ATLAS, portal!)
assert.deepEqual(portalPlan.systems, ['cardiovascular', 'digestive'])
assert.ok(portalPlan.atlasPinNodeIds.includes('he:portal-venous-system'))
assert.ok(portalPlan.atlasPinNodeIds.includes('he:hepatic-lobule'))
assert.ok(portalPlan.bioReferenceNodeIds.includes('bio:digestive:cytochrome-p450-system'))

const systemic = functionalPathwayById(WHOLE_BODY_FUNCTIONAL_TOPOLOGY, 'functional:systemic-perfusion')
assert.ok(systemic)
const systemicPlan = compileFunctionalTopologyScene(COMPLETE_WHOLE_BODY_ATLAS, WHOLE_BODY_BIOSCALE_ATLAS, systemic!)
assert.deepEqual(systemicPlan.bioReferenceNodeIds, [])
assert.deepEqual(systemicPlan.atlasPinNodeIds, ['cv:heart', 'cv:aorta', 'he:systemic-arterial-tree', 'he:systemic-capillary-bed'])

// Graph depth is deliberately qualitative. No time-like field is permitted in the output contract.
for (const plan of [respiratoryPlan, renalPlan, portalPlan, systemicPlan]) {
  for (const wave of plan.waves) {
    assert.equal(typeof wave.depth, 'number')
    assert.equal('timeMs' in wave, false)
    assert.equal('velocity' in wave, false)
    assert.equal('pressure' in wave, false)
  }
  assert.ok(plan.warnings.some((warning) => warning.includes('not time')))
}

console.log(`Whole-body functional topology: ${WHOLE_BODY_FUNCTIONAL_TOPOLOGY.pathways.length} qualitative pathways across ${functionalTopologySystemCoverage(WHOLE_BODY_FUNCTIONAL_TOPOLOGY).length} systems; branching airflow, renal filtration, portal interface, and systemic perfusion verified.`)
