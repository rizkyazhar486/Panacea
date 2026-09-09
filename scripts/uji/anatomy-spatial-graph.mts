import assert from 'node:assert/strict'
import {
  anatomyAncestors,
  anatomyDescendants,
  buildAnatomyAliasIndex,
  findAnatomyPath,
  resolveAnatomyNodeExact,
  validateAnatomySpatialGraph,
  type AnatomySpatialGraph,
} from '../../src/lib/anatomySpatialGraph.ts'
import { WHOLE_BODY_ATLAS_GRAPH, WHOLE_BODY_SYSTEM_ROOTS } from '../../src/lib/wholeBodyAtlasCore.ts'

const validation = validateAnatomySpatialGraph(WHOLE_BODY_ATLAS_GRAPH)
assert.deepEqual(validation.errors, [])
assert.equal(validation.valid, true)

assert.equal(Object.keys(WHOLE_BODY_SYSTEM_ROOTS).length, 14)
for (const rootId of Object.values(WHOLE_BODY_SYSTEM_ROOTS)) {
  assert.ok(WHOLE_BODY_ATLAS_GRAPH.nodes.some((node) => node.id === rootId), `Missing whole-body system root ${rootId}`)
}

assert.equal(resolveAnatomyNodeExact(WHOLE_BODY_ATLAS_GRAPH, '  CORONARY??? ')?.id, undefined)
assert.equal(resolveAnatomyNodeExact(WHOLE_BODY_ATLAS_GRAPH, 'Heart')?.id, 'heart')
assert.equal(resolveAnatomyNodeExact(WHOLE_BODY_ATLAS_GRAPH, 'right mainstem bronchus')?.id, 'right-main-bronchus')
assert.equal(resolveAnatomyNodeExact(WHOLE_BODY_ATLAS_GRAPH, 'heartburn')?.id, undefined)
assert.equal(resolveAnatomyNodeExact(WHOLE_BODY_ATLAS_GRAPH, 'bronch')?.id, undefined)

const rightAirwayPath = findAnatomyPath(
  WHOLE_BODY_ATLAS_GRAPH,
  'nasal-cavity',
  'r-s10-posterior-basal',
  ['airwayTo'],
)
assert.deepEqual(rightAirwayPath, [
  'nasal-cavity',
  'nasopharynx',
  'oropharynx',
  'laryngopharynx',
  'larynx',
  'trachea',
  'carina',
  'right-main-bronchus',
  'right-lower-lobar-bronchus',
  'r-s10-posterior-basal',
])

const respiratoryDescendants = anatomyDescendants(WHOLE_BODY_ATLAS_GRAPH, 'respiratory-system')
assert.ok(respiratoryDescendants.length >= 40)
assert.ok(respiratoryDescendants.some((node) => node.id === 'l-s10-posterior-basal'))

const segmentAncestors = anatomyAncestors(WHOLE_BODY_ATLAS_GRAPH, 'l-s4-superior-lingular').map((node) => node.id)
assert.deepEqual(segmentAncestors.slice(0, 4), ['lingula', 'left-upper-lobe', 'left-lung', 'respiratory-system'])

const collisionGraph: AnatomySpatialGraph = {
  nodes: [
    { ...WHOLE_BODY_ATLAS_GRAPH.nodes[0], id: 'collision-a', label: 'Collision A', aliases: ['shared alias'] },
    { ...WHOLE_BODY_ATLAS_GRAPH.nodes[1], id: 'collision-b', label: 'Collision B', aliases: ['shared-alias'], parentId: undefined },
  ],
  edges: [],
}
assert.throws(() => buildAnatomyAliasIndex(collisionGraph), /alias collision/i)
assert.equal(validateAnatomySpatialGraph(collisionGraph).valid, false)

const deterministicA = anatomyDescendants(WHOLE_BODY_ATLAS_GRAPH, 'digestive-system').map((node) => node.id)
const deterministicB = anatomyDescendants(WHOLE_BODY_ATLAS_GRAPH, 'digestive-system').map((node) => node.id)
assert.deepEqual(deterministicA, deterministicB)

console.log(`Whole-body spatial graph verified: ${WHOLE_BODY_ATLAS_GRAPH.nodes.length} nodes, ${WHOLE_BODY_ATLAS_GRAPH.edges.length} typed relationships, exact-only alias resolution, deterministic traversal, and containment safety.`)
