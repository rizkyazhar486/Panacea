import assert from 'node:assert/strict'
import { INDEKS_TUBUH, type StrukturTubuh } from '../../src/lib/bodyIndex.gen.ts'
import {
  BODY_ATLAS_GRAPH,
  BODY_ATLAS_LAYER_FILES,
  bodyAtlasLodTier,
  compileBodyAtlasGraph,
  planBodyAtlasResidency,
  searchBodyAtlas,
  validateBodyAtlasGraph,
} from '../../src/lib/bodyAtlasGraph.ts'

const validation = validateBodyAtlasGraph()
assert.equal(validation.valid, true, validation.reasons.join('\n'))
assert.equal(BODY_ATLAS_GRAPH.nodes.length, INDEKS_TUBUH.length)
assert.equal(BODY_ATLAS_GRAPH.stats.nodeCount, INDEKS_TUBUH.length)
assert.equal(BODY_ATLAS_GRAPH.nodeById.size, BODY_ATLAS_GRAPH.nodes.length)
assert.deepEqual(Object.keys(BODY_ATLAS_LAYER_FILES).sort(), [
  'cardiovascular', 'lymphoid', 'muscular', 'nervous', 'skeletal', 'surface', 'visceral',
])

assert.equal(bodyAtlasLodTier(1_000), 'micro')
assert.equal(bodyAtlasLodTier(1_001), 'low')
assert.equal(bodyAtlasLodTier(5_001), 'medium')
assert.equal(bodyAtlasLodTier(25_001), 'high')
assert.equal(bodyAtlasLodTier(100_001), 'ultra')

const synthetic: StrukturTubuh[] = [
  { n: 'Test artery.l', b: 'Test artery', l: 'cardiovascular', s: 'kiri', y: 0.6, r: 0.2, w: 'toraks', t: 4_000 },
  { n: 'Test artery.r', b: 'Test artery', l: 'cardiovascular', s: 'kanan', y: 0.6, r: 0.2, w: 'toraks', t: 4_000 },
  { n: 'Hippocampus.l', b: 'Hippocampus', l: 'nervous', s: 'kiri', y: 0.9, r: 0.1, w: 'kepala', t: 30_000 },
  { n: 'Hip joint.l', b: 'Hip joint', l: 'skeletal', s: 'kiri', y: 0.45, r: 0.3, w: 'pelvis', t: 80_000 },
]
const graph = compileBodyAtlasGraph(synthetic)
assert.equal(graph.nodes.length, synthetic.length)
assert.equal(graph.edges.filter((edge) => edge.kind === 'contralateral').length, 1)

const artery = searchBodyAtlas('test artery', { limit: 10 }, graph)
assert.equal(artery.length, 2)
assert.equal(artery.every((result) => result.score >= 950), true)

const hip = searchBodyAtlas('hip', { limit: 10 }, graph)
assert.equal(hip.length, 1)
assert.equal(hip[0].node.baseName, 'Hip joint')
assert.equal(hip.some((result) => result.node.baseName === 'Hippocampus'), false)

const leftArtery = graph.nodes.find((node) => node.sourceName === 'Test artery.l')
assert.ok(leftArtery)
const tinyBudgetPlan = planBodyAtlasResidency({
  triangleBudget: 1,
  maxNodes: 4,
  focusNodeIds: [leftArtery.id],
  includeContralateralOfFocus: true,
}, graph)
assert.equal(tinyBudgetPlan.selected.length, 2)
assert.equal(tinyBudgetPlan.budgetExceededByMandatoryFocus, true)
assert.equal(tinyBudgetPlan.selected.some((node) => node.sourceName === 'Test artery.r'), true)

const boundedPlan = planBodyAtlasResidency({
  triangleBudget: 90_000,
  maxNodes: 3,
  focusNodeIds: [leftArtery.id],
  activeRegions: ['toraks'],
}, graph)
assert.ok(boundedPlan.selected.length <= 3)
assert.ok(boundedPlan.trianglesSelected >= 8_000)

console.log(`Body atlas graph: ${BODY_ATLAS_GRAPH.stats.nodeCount} source meshes, ${BODY_ATLAS_GRAPH.stats.edgeCount} explicit structural edges, deterministic search + LOD + residency guards verified.`)
