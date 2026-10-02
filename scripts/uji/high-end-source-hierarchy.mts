import assert from 'node:assert/strict'
import { querySourceTopology, SHIPPED_SOURCE_TOPOLOGY } from '../../src/lib/anatomy/sourceTopologyCompiler.ts'
import {
  SHIPPED_SOURCE_HIERARCHY,
  buildSourceHierarchyFocus,
  buildSourcePairComparison,
  sourceHierarchyAncestors,
  sourceHierarchyDescendants,
  validateSourceHierarchy,
} from '../../src/lib/anatomy/sourceHierarchyCompiler.ts'

const index = SHIPPED_SOURCE_TOPOLOGY
const hierarchy = SHIPPED_SOURCE_HIERARCHY

assert.deepEqual(validateSourceHierarchy(hierarchy, index), [])
assert.equal(hierarchy.byId.get(hierarchy.rootId)?.meshCount, index.leaves.length)
assert.equal(hierarchy.byId.get(hierarchy.rootId)?.triangleCount, index.totalTriangles)

const meshNodes = hierarchy.nodes.filter((node) => node.kind === 'mesh')
assert.equal(meshNodes.length, index.leaves.length)
assert.equal(new Set(meshNodes.map((node) => node.leafId)).size, index.leaves.length)

for (const layer of ['surface', 'skeletal', 'muscular', 'cardiovascular', 'nervous', 'visceral', 'lymphoid']) {
  const layerNode = hierarchy.byId.get(`source-layer:${layer}`)
  assert.ok(layerNode, `Expected source hierarchy layer ${layer}`)
  assert.ok(layerNode!.meshCount > 0)
  assert.ok(layerNode!.triangleCount >= 0)
}

const abducens = querySourceTopology(index, { text: 'abducens nerve', systems: ['nervous'], maxResults: 20 })
const abducensLeft = abducens.find((leaf) => leaf.sourceName === 'Abducens nerve (VI).l')
const abducensRight = abducens.find((leaf) => leaf.sourceName === 'Abducens nerve (VI).r')
assert.ok(abducensLeft)
assert.ok(abducensRight)

const comparison = buildSourcePairComparison(abducensLeft!.id, index, hierarchy)
assert.ok(comparison)
assert.equal(comparison!.status, 'bilateral-pair')
assert.ok(comparison!.left.some((leaf) => leaf.id === abducensLeft!.id))
assert.ok(comparison!.right.some((leaf) => leaf.id === abducensRight!.id))
assert.equal(comparison!.midline.length, 0)
assert.ok(comparison!.triangleCount >= abducensLeft!.triangles + abducensRight!.triangles)

const focus = buildSourceHierarchyFocus(abducensLeft!.id, index, hierarchy)
assert.ok(focus)
assert.equal(focus!.leaf.id, abducensLeft!.id)
assert.equal(focus!.path[0]?.kind, 'root')
assert.equal(focus!.path.at(-1)?.kind, 'mesh')
assert.ok(focus!.path.some((node) => node.kind === 'layer' && node.layer === 'nervous'))
assert.ok(focus!.path.some((node) => node.kind === 'region' && node.sourceRegion === 'kepala'))
assert.ok(focus!.siblingMeshIds.length >= 1)

const meshNodeId = `source-mesh-node:${abducensLeft!.id}`
const ancestors = sourceHierarchyAncestors(meshNodeId, hierarchy)
assert.deepEqual(ancestors.map((node) => node.kind).slice(0, 4), ['structure', 'region', 'layer', 'root'])

const nervousDescendants = sourceHierarchyDescendants('source-layer:nervous', 3, hierarchy)
assert.ok(nervousDescendants.some(({ node }) => node.kind === 'region'))
assert.ok(nervousDescendants.some(({ node }) => node.kind === 'structure'))
assert.ok(nervousDescendants.some(({ node }) => node.kind === 'mesh'))

const aorta = querySourceTopology(index, { text: 'abdominal aorta', maxResults: 20 }).find((leaf) => leaf.sourceName === 'Abdominal aorta')
assert.ok(aorta)
const aortaComparison = buildSourcePairComparison(aorta!.id, index, hierarchy)
assert.ok(aortaComparison)
assert.equal(aortaComparison!.status, 'midline-only')
assert.equal(aortaComparison!.midline.length, 1)

console.log(`High-end source hierarchy: ${hierarchy.nodes.length} hierarchy nodes cover ${index.leaves.length} exact shipped meshes with deterministic layer/region/structure/side traversal.`)
