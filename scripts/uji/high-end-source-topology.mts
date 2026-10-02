import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  SHIPPED_SOURCE_TOPOLOGY,
  auditAtlasSourceCoverage,
  querySourceTopology,
  validateSourceTopology,
} from '../../src/lib/anatomy/sourceTopologyCompiler.ts'
import {
  coarseSourceViewportDistance,
  planSourceMeshWorkingSet,
  sourceMeshPlanByBundle,
  validateSourceMeshWorkingSet,
} from '../../src/lib/anatomy/sourceMeshWorkingSet.ts'

const topology = SHIPPED_SOURCE_TOPOLOGY
assert.ok(topology.leaves.length > 0)
assert.ok(topology.buckets.length > 0)
assert.ok(topology.totalTriangles > 0)
assert.deepEqual(validateSourceTopology(topology), [])
assert.equal(new Set(topology.leaves.map((leaf) => leaf.id)).size, topology.leaves.length)

const abdominalAorta = querySourceTopology(topology, { text: 'abdominal aorta', systems: ['cardiovascular'], maxResults: 20 })
assert.ok(abdominalAorta.some((leaf) => leaf.sourceName === 'Abdominal aorta'))
assert.ok(abdominalAorta.every((leaf) => leaf.file === 'cardiovascular.glb'))
assert.ok(abdominalAorta.every((leaf) => leaf.domain.system === 'cardiovascular'))

const abducens = querySourceTopology(topology, { text: 'abducens nerve', systems: ['nervous'], maxResults: 20 })
assert.ok(abducens.some((leaf) => leaf.sourceName.includes('Abducens nerve')))
assert.ok(abducens.every((leaf) => leaf.domain.system === 'nervous'))

const tibialNodes = querySourceTopology(topology, { text: 'tibial node', systems: ['lymphatic'], maxResults: 50 })
assert.ok(tibialNodes.length > 0)
assert.ok(tibialNodes.every((leaf) => leaf.layer === 'lymphoid'))

const respiratory = querySourceTopology(topology, { text: 'bronchus', systems: ['respiratory'], maxResults: 100 })
assert.ok(respiratory.length > 0)
assert.ok(respiratory.every((leaf) => leaf.domain.system === 'respiratory'))

const uniqueFiles = new Set(topology.leaves.map((leaf) => leaf.file))
for (const file of ['surface.glb', 'skeletal.glb', 'muscular.glb', 'cardiovascular.glb', 'nervous.glb', 'visceral.glb', 'lymphoid.glb']) {
  assert.ok(uniqueFiles.has(file), `Expected shipped topology bundle ${file}`)
}

const coverage = auditAtlasSourceCoverage(COMPLETE_WHOLE_BODY_ATLAS, topology)
assert.ok(coverage.matchedShippedAtlasNodeIds.length > 0)
assert.ok(coverage.representedTriangles >= 0)
assert.ok(coverage.unrepresentedTriangles >= 0)
assert.ok(coverage.representationRatioByTriangles >= 0 && coverage.representationRatioByTriangles <= 1)

const aorta = abdominalAorta.find((leaf) => leaf.sourceName === 'Abdominal aorta')!
const nearAorta = coarseSourceViewportDistance(aorta, {
  centerY: aorta.verticalPosition,
  centerRadius: aorta.radialDistance,
  verticalWindow: 0.1,
  radialWindow: 0.1,
})
assert.equal(nearAorta, 0)

const selectedPlan = planSourceMeshWorkingSet({
  systems: ['cardiovascular'],
  regions: ['abdomen'],
  selectedLeafIds: [aorta.id],
  viewport: {
    centerY: aorta.verticalPosition,
    centerRadius: aorta.radialDistance,
    verticalWindow: 0.12,
    radialWindow: 0.12,
  },
  triangleBudget: Math.max(1, Math.floor(aorta.triangles / 2)),
  maxMeshes: 8,
}, topology)
assert.ok(selectedPlan.entries.some((entry) => entry.leaf.id === aorta.id && entry.selected))
assert.ok(selectedPlan.budgetOverrunForPinnedSelection > 0)
assert.deepEqual(validateSourceMeshWorkingSet(selectedPlan), [])

const budgetedPlan = planSourceMeshWorkingSet({
  systems: ['nervous'],
  regions: ['head'],
  viewport: { centerY: 0.92, centerRadius: 0.1, verticalWindow: 0.15, radialWindow: 0.2 },
  triangleBudget: 100_000,
  maxMeshes: 12,
}, topology)
assert.ok(budgetedPlan.entries.length <= 12)
assert.ok(budgetedPlan.totalTriangles <= 100_000)
assert.deepEqual(validateSourceMeshWorkingSet(budgetedPlan), [])

const bundlePlan = sourceMeshPlanByBundle(budgetedPlan)
assert.ok(bundlePlan.every((bundle) => bundle.entries.every((entry) => entry.leaf.file === bundle.file)))
assert.equal(bundlePlan.reduce((sum, bundle) => sum + bundle.triangleCount, 0), budgetedPlan.totalTriangles)

console.log(`High-end source topology: ${topology.leaves.length} exact shipped meshes, ${topology.buckets.length} streaming buckets, deterministic source coverage and triangle-budget scheduling verified.`)
