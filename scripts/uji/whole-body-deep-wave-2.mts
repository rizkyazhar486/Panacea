import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  atlasDescendants,
  atlasLineage,
  atlasSectionHits,
  buildAtlasExposurePlan,
  buildAtlasMetadataCoverage,
  buildCrossScaleDrilldown,
  buildExplicitAtlasFlowNetwork,
  compileAtlasTopology,
} from '../../src/lib/anatomy/atlasExposureOrchestrator.ts'
import {
  WHOLE_BODY_DEEP_WAVE_2_NODES,
  WHOLE_BODY_DEEP_WAVE_2_SCALES,
  WHOLE_BODY_DEEP_WAVE_2_SYSTEMS,
} from '../../src/lib/anatomy/wholeBodyDeepWave2.ts'
import type { AtlasManifest } from '../../src/lib/anatomy/atlasKernel.ts'

// This suite validates engineering topology only. It deliberately does not turn
// academic-review-required reference metadata into reviewed anatomy.
assert.ok(WHOLE_BODY_DEEP_WAVE_2_NODES.length >= 50, 'deep wave must add a material whole-body expansion')
assert.equal(WHOLE_BODY_DEEP_WAVE_2_SYSTEMS.length, 14, 'deep wave must span every canonical atlas system')
assert.ok(WHOLE_BODY_DEEP_WAVE_2_SCALES.includes('organ'))
assert.ok(WHOLE_BODY_DEEP_WAVE_2_SCALES.includes('suborgan'))
assert.ok(WHOLE_BODY_DEEP_WAVE_2_SCALES.includes('tissue'))
assert.ok(WHOLE_BODY_DEEP_WAVE_2_SCALES.includes('microstructure'))

for (const node of WHOLE_BODY_DEEP_WAVE_2_NODES) {
  assert.equal(node.geometryStatus, 'reference-only', `${node.id} must remain non-rendering until verified geometry is mapped`)
  assert.equal(node.provenance.reviewStatus, 'academic-review-required', `${node.id} must retain the human academic review gate`)
  assert.ok(node.parentId, `${node.id} must participate in explicit hierarchy`)
  assert.ok(node.source.nodeHints.length > 0, `${node.id} must have curated source-node hints`)
}

const topology = compileAtlasTopology(COMPLETE_WHOLE_BODY_ATLAS)
for (const node of WHOLE_BODY_DEEP_WAVE_2_NODES) {
  assert.ok(topology.byId.has(node.id), `complete atlas must compose deep-wave node ${node.id}`)
  assert.ok(node.parentId && topology.byId.has(node.parentId), `deep-wave parent must exist: ${node.id} -> ${node.parentId}`)
}

const coverage = buildAtlasMetadataCoverage(COMPLETE_WHOLE_BODY_ATLAS)
assert.equal(coverage.systemCount, 14)
assert.equal(coverage.scaleCount, 6)
assert.ok(coverage.populatedCellCount > 0)
assert.ok(coverage.metadataCoverageRatio > 0 && coverage.metadataCoverageRatio <= 1)
assert.ok(coverage.referenceOnlyNodeCount >= WHOLE_BODY_DEEP_WAVE_2_NODES.length)
assert.ok(coverage.warnings.some((warning) => warning.includes('not a claim of anatomical completeness')))

const cochlearLineage = atlasLineage(COMPLETE_WHOLE_BODY_ATLAS, 'he2:organ-of-corti')
assert.deepEqual(cochlearLineage.slice(-2), ['he:cochlea', 'he2:organ-of-corti'])

// Cross-scale drilldown deliberately selects the strongest candidate at each finer
// scale, so it must be tested by semantic scale coverage rather than one fixed
// anatomical identity. Specific structures remain independently verifiable through
// the canonical hierarchy/descendant traversal.
const ocularDescendants = atlasDescendants(COMPLETE_WHOLE_BODY_ATLAS, 'he:ocular-globe', 4)
assert.ok(ocularDescendants.some(({ nodeId }) => nodeId === 'he:retina'), 'ocular hierarchy must preserve retina as a descendant')
assert.ok(ocularDescendants.some(({ nodeId }) => nodeId === 'he:retinal-photoreceptor-unit'), 'ocular hierarchy must reach retinal photoreceptor microstructure')

const ocularDrilldown = buildCrossScaleDrilldown(COMPLETE_WHOLE_BODY_ATLAS, 'he:ocular-globe')
const ocularDrilldownScales = ocularDrilldown
  .map((id) => topology.byId.get(id)?.scale)
  .filter((scale): scale is NonNullable<typeof scale> => Boolean(scale))
assert.ok(ocularDrilldownScales.includes('tissue'), 'organ drilldown must expose at least one tissue-scale candidate')
assert.ok(ocularDrilldownScales.includes('microstructure'), 'organ drilldown must expose at least one microstructure-scale candidate')
assert.equal(new Set(ocularDrilldownScales).size, ocularDrilldownScales.length, 'drilldown must select at most one best candidate per finer scale')

const respiratoryFlow = buildExplicitAtlasFlowNetwork(COMPLETE_WHOLE_BODY_ATLAS, 'he2:terminal-bronchiole', {
  systems: ['respiratory'],
  allowedKinds: ['continuous-with'],
  maxDepth: 8,
})
assert.ok(respiratoryFlow.edges.some((edge) => edge.from === 'he2:terminal-bronchiole' && edge.to === 'he2:respiratory-bronchiole'))
assert.ok(respiratoryFlow.edges.some((edge) => edge.from === 'he2:respiratory-bronchiole' && edge.to === 'he2:alveolar-duct'))
assert.ok(respiratoryFlow.edges.some((edge) => edge.from === 'he2:alveolar-duct' && edge.to === 'he2:alveolar-sac'))
assert.equal(respiratoryFlow.truncated, false)

const exposure = buildAtlasExposurePlan(COMPLETE_WHOLE_BODY_ATLAS, {
  intent: 'cross-scale',
  focusNodeId: 'he:ocular-globe',
  maxDetailDepth: 4,
  includeReferenceMetadata: true,
})
assert.equal(exposure.focusNodeId, 'he:ocular-globe')
assert.ok(exposure.nodes.some((plan) => plan.node.id === 'he:ocular-globe' && plan.role === 'focus'))
assert.ok(exposure.nodes.some((plan) => plan.node.id === 'he:retina'))
assert.ok(exposure.nodes.some((plan) => plan.node.id === 'he:retinal-photoreceptor-unit'))
assert.ok(exposure.warnings.some((warning) => warning.includes('reference metadata')))
assert.ok(exposure.warnings.some((warning) => warning.includes('academic review')))

const heart = topology.byId.get('cv:heart')
const lungs = topology.byId.get('resp:lungs')
assert.ok(heart)
assert.ok(lungs)
const spatialFixture: AtlasManifest = {
  id: 'spatial-fixture',
  revision: 'test-fixture-1',
  nodes: [
    { ...heart, spatial: { center: [0, 0, 0], radius: 0.3 } },
    { ...lungs, spatial: { center: [0.7, 0, 0], radius: 0.2 } },
  ],
}
const section = atlasSectionHits(spatialFixture, { origin: [0.1, 0, 0], normal: [1, 0, 0], thickness: 0.02 })
assert.equal(section.length, 1)
assert.equal(section[0].nodeId, 'cv:heart')
assert.ok(Math.abs(section[0].signedDistance + 0.1) < 1e-9)

console.log(`Whole-body deep wave 2: ${WHOLE_BODY_DEEP_WAVE_2_NODES.length} reference nodes across ${WHOLE_BODY_DEEP_WAVE_2_SYSTEMS.length} systems, multiscale orchestration, explicit respiratory flow, and fail-closed spatial section planning verified.`)
