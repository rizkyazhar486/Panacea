import assert from 'node:assert/strict'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'
import {
  atlasAncestors,
  buildAtlasRenderPlan,
  validateAtlasManifest,
  type AtlasDeviceBudget,
} from '../../src/lib/anatomy/atlasKernel.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { atlasSubgraph, searchAtlas, traceAtlasPath } from '../../src/lib/anatomy/atlasGraph.ts'
import { RESPIRATORY_SEGMENT_IDS } from '../../src/lib/anatomy/respiratoryAtlas.ts'

const issues = validateAtlasManifest(COMPLETE_WHOLE_BODY_ATLAS)
assert.deepEqual(issues, [], `Complete atlas manifest must remain internally coherent:\n${JSON.stringify(issues, null, 2)}`)

const ids = COMPLETE_WHOLE_BODY_ATLAS.nodes.map((node) => node.id)
assert.equal(new Set(ids).size, ids.length, 'Every atlas node id must be globally unique.')
assert.equal(RESPIRATORY_SEGMENT_IDS.length, 18, 'Respiratory atlas must expose the reviewed 18 segment labels used by this scaffold.')
assert.equal(new Set(RESPIRATORY_SEGMENT_IDS).size, RESPIRATORY_SEGMENT_IDS.length, 'Respiratory segment ids must be unique.')

for (const required of [
  'system:skeletal',
  'system:muscular',
  'system:cardiovascular',
  'system:nervous',
  'system:respiratory',
  'system:digestive',
  'system:urinary',
  'system:endocrine',
  'resp:trachea',
  'resp:carina',
  'resp:right-main-bronchus',
  'resp:left-main-bronchus',
  'resp:alveolar-capillary-unit',
  'cv:heart',
  'neuro:brain',
  'urinary:kidneys',
]) {
  assert.ok(ids.includes(required), `Missing required atlas node: ${required}`)
}

const segmentAncestors = atlasAncestors(COMPLETE_WHOLE_BODY_ATLAS, 'resp:segment:r-s1').map((node) => node.id)
assert.deepEqual(segmentAncestors.slice(0, 4), [
  'resp:right-upper-lobe',
  'resp:right-lung',
  'resp:lungs',
  'system:respiratory',
])

const airwayPath = traceAtlasPath(COMPLETE_WHOLE_BODY_ATLAS, 'resp:segment:r-s1', 'resp:trachea')
assert.ok(airwayPath)
assert.deepEqual(airwayPath.nodeIds, [
  'resp:segment:r-s1',
  'resp:right-main-bronchus',
  'resp:carina',
  'resp:trachea',
])
assert.equal(airwayPath.edges[0]?.kind, 'continuous-with')

const gasExchangeToPulmonaryVessel = traceAtlasPath(
  COMPLETE_WHOLE_BODY_ATLAS,
  'resp:alveolar-capillary-unit',
  'cv:pulmonary-trunk',
)
assert.ok(gasExchangeToPulmonaryVessel)
assert.deepEqual(gasExchangeToPulmonaryVessel.nodeIds, ['resp:alveolar-capillary-unit', 'cv:pulmonary-trunk'])

const coronarySearch = searchAtlas(COMPLETE_WHOLE_BODY_ATLAS, 'coronary', { systems: ['cardiovascular'] })
assert.equal(coronarySearch[0]?.node.id, 'cv:coronary')

const carinaSearch = searchAtlas(COMPLETE_WHOLE_BODY_ATLAS, 'carina', { regions: ['thorax'], surgicalLandmarkOnly: true })
assert.equal(carinaSearch[0]?.node.id, 'resp:carina')

const respiratoryNeighborhood = atlasSubgraph(COMPLETE_WHOLE_BODY_ATLAS, 'resp:carina', 2)
assert.ok(respiratoryNeighborhood.nodeIds.includes('resp:trachea'))
assert.ok(respiratoryNeighborhood.nodeIds.includes('resp:right-main-bronchus'))
assert.ok(respiratoryNeighborhood.nodeIds.includes('resp:left-main-bronchus'))

const budget: AtlasDeviceBudget = {
  triangleBudget: 1_000_000,
  textureBudgetMegabytes: 256,
  nodeBudget: 24,
  devicePixelRatio: 2,
  viewportWidth: 1440,
  viewportHeight: 900,
}

const plan = buildAtlasRenderPlan(
  COMPLETE_WHOLE_BODY_ATLAS,
  INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
  {
    selectedNodeId: 'resp:trachea',
    systems: ['respiratory'],
    regions: ['thorax'],
    projectedPixelsByNodeId: {
      'resp:trachea': 420,
      'resp:lungs': 360,
      'resp:right-lung': 320,
      'resp:left-lung': 320,
    },
  },
  budget,
)

const trachea = plan.nodes.find((entry) => entry.node.id === 'resp:trachea')
assert.ok(trachea, 'Shipped trachea must resolve to at least one indexed GLB source node.')
assert.ok(trachea.sourceMatches.length > 0)
assert.ok(trachea.score > 0)
assert.ok(plan.totalEstimatedTriangles <= budget.triangleBudget)
assert.ok(plan.totalEstimatedTextureMegabytes <= budget.textureBudgetMegabytes)
assert.ok(plan.nodes.length <= budget.nodeBudget)

console.log(`Whole-body atlas kernel: ${COMPLETE_WHOLE_BODY_ATLAS.nodes.length} nodes, ${RESPIRATORY_SEGMENT_IDS.length} respiratory segments, graph/search/LOD/source-binding invariants verified.`)
