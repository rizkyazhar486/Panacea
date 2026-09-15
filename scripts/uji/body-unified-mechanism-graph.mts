import assert from 'node:assert/strict'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'
import { BODY_SYSTEM_PHYSIOLOGY_BRIDGE } from '../../src/lib/bodySystemPhysiologyBridge.ts'
import { WHOLE_BODY_PHYSIOLOGY_SYSTEMS } from '../../src/lib/wholeBodyPhysiologyOS.ts'
import { BODY_PATHOPHYSIOLOGY_NETWORK } from '../../src/lib/bodyPathophysiologyNetwork.ts'
import { BODY_PHARMACOLOGY_MECHANISM_NETWORK } from '../../src/lib/bodyPharmacologyMechanismNetwork.ts'
import { BODY_MECHANISM_CAUSAL_BRIDGE } from '../../src/lib/bodyMechanismCausalBridge.ts'
import {
  BODY_UNIFIED_MECHANISM_GRAPH,
  BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY,
  atlasSystemGraphNodeId,
  getUnifiedMechanismNeighborhood,
  getUnifiedMechanismNode,
  listUnifiedMechanismNodesByKind,
  traceUnifiedMechanismRoute,
} from '../../src/lib/bodyUnifiedMechanismGraph.ts'

const graph = BODY_UNIFIED_MECHANISM_GRAPH
assert.ok(graph.nodes.length >= 80, 'unified graph must expose a substantial multiscale node set')
assert.ok(graph.edges.length >= 100, 'unified graph must expose a substantial relationship set')
assert.equal(new Set(graph.nodes.map((node) => node.id)).size, graph.nodes.length, 'graph node ids must be unique')
assert.equal(new Set(graph.edges.map((edge) => edge.id)).size, graph.edges.length, 'graph edge ids must be unique')

const nodeIds = new Set(graph.nodes.map((node) => node.id))
for (const edge of graph.edges) {
  assert.ok(nodeIds.has(edge.from), `${edge.id} references missing from-node ${edge.from}`)
  assert.ok(nodeIds.has(edge.to), `${edge.id} references missing to-node ${edge.to}`)
  assert.ok(edge.label.length >= 4, `${edge.id} needs a relationship label`)
  assert.ok(edge.note.length >= 40, `${edge.id} needs an interpretation note`)
}

assert.equal(listUnifiedMechanismNodesByKind('atlas-system').length, BODY_SYSTEM_SOURCE_WAVE.length)
assert.equal(listUnifiedMechanismNodesByKind('physiology-system').length, WHOLE_BODY_PHYSIOLOGY_SYSTEMS.length)
assert.equal(listUnifiedMechanismNodesByKind('pathophysiology-scenario').length, BODY_PATHOPHYSIOLOGY_NETWORK.length)
assert.equal(listUnifiedMechanismNodesByKind('pathophysiology-step').length, BODY_PATHOPHYSIOLOGY_NETWORK.reduce((sum, scenario) => sum + scenario.cascade.length, 0))
assert.equal(listUnifiedMechanismNodesByKind('pharmacology-class').length, BODY_PHARMACOLOGY_MECHANISM_NETWORK.length)
assert.equal(listUnifiedMechanismNodesByKind('pharmacology-step').length, BODY_PHARMACOLOGY_MECHANISM_NETWORK.reduce((sum, mechanism) => sum + mechanism.mechanismChain.length, 0))

for (const bridge of BODY_SYSTEM_PHYSIOLOGY_BRIDGE) {
  for (const physiologyId of bridge.physiologySystemIds) {
    assert.ok(
      graph.edges.some((edge) => edge.from === `atlas:${bridge.atlasSystemId}` && edge.to === `physiology:${physiologyId}` && edge.kind === 'maps-to'),
      `${bridge.atlasSystemId} → ${physiologyId} atlas/physiology bridge must survive graph compilation`,
    )
  }
}

for (const link of BODY_MECHANISM_CAUSAL_BRIDGE) {
  for (const stepId of link.scenarioStepIds) {
    assert.ok(
      graph.edges.some(
        (edge) =>
          edge.from === `pathophysiology-step:${link.scenarioId}:${stepId}` &&
          edge.to === `pharmacology:${link.pharmacologyMechanismId}` &&
          edge.kind === 'mechanistically-intersects',
      ),
      `${link.id}/${stepId} causal intersection must survive graph compilation`,
    )
  }
}

const cardioSeed = atlasSystemGraphNodeId('cardiovascular')
assert.equal(getUnifiedMechanismNode(cardioSeed).kind, 'atlas-system')
const cardioDepth0 = getUnifiedMechanismNeighborhood(cardioSeed, 0)
assert.deepEqual(cardioDepth0.nodes.map((node) => node.id), [cardioSeed], 'depth 0 must contain only the seed')
assert.equal(cardioDepth0.edges.length, 0, 'depth 0 must not invent local edges')
const cardioDepth2 = getUnifiedMechanismNeighborhood(cardioSeed, 2)
assert.ok(cardioDepth2.nodes.some((node) => node.id === 'physiology:cardiovascular'), 'depth 2 should preserve direct cardiovascular physiology context')
assert.ok(cardioDepth2.nodes.length > cardioDepth0.nodes.length, 'larger neighborhood depth should expand navigation context')
const clampedDepth = getUnifiedMechanismNeighborhood(cardioSeed, 99)
const depth3 = getUnifiedMechanismNeighborhood(cardioSeed, 3)
assert.deepEqual(clampedDepth.nodes.map((node) => node.id).sort(), depth3.nodes.map((node) => node.id).sort(), 'neighborhood depth must clamp to 3')

const statinRoute = traceUnifiedMechanismRoute(cardioSeed, 'pharmacology:statin-hmgcr')
assert.ok(statinRoute, 'cardiovascular atlas should have a curated navigational route to statin mechanism')
assert.equal(statinRoute?.nodeIds[0], cardioSeed)
assert.equal(statinRoute?.nodeIds.at(-1), 'pharmacology:statin-hmgcr')
assert.equal((statinRoute?.nodeIds.length ?? 0) - 1, statinRoute?.edgeIds.length, 'route edge count must equal node hops')
assert.ok(statinRoute?.nodeIds.some((id) => id.startsWith('pathophysiology')), 'atlas-to-pharmacology route should traverse curated disease context rather than inventing a direct treatment edge')

const vteRoute = traceUnifiedMechanismRoute(cardioSeed, 'pharmacology:factor-xa-inhibition')
assert.ok(vteRoute, 'cardiovascular atlas should connect through curated VTE biology to factor Xa mechanism')
assert.ok(vteRoute?.nodeIds.some((id) => id.includes('venous-thromboembolism')), 'factor Xa route should preserve VTE context')

const identityRoute = traceUnifiedMechanismRoute(cardioSeed, cardioSeed)
assert.deepEqual(identityRoute, { nodeIds: [cardioSeed], edgeIds: [] })

assert.throws(() => getUnifiedMechanismNode('invented:clinical-node'), /Unknown unified mechanism graph node/)
assert.throws(() => traceUnifiedMechanismRoute(cardioSeed, 'invented:target'), /Unknown unified mechanism graph node/)

assert.match(BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY, /educational graph-navigation layer/i)
assert.match(BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY, /path length/i)
assert.match(BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY, /not diagnostic probability/i)
assert.match(BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY, /not.*treatment priority/i)
assert.match(BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY, /dose-response/i)
assert.match(BODY_UNIFIED_MECHANISM_GRAPH_BOUNDARY, /patient-specific clinical inference/i)

console.log(`body unified mechanism graph: ${graph.nodes.length} nodes / ${graph.edges.length} edges validated with bounded BFS navigation and no clinical-score semantics`)
