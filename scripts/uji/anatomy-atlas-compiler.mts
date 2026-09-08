import assert from 'node:assert/strict'
import { ANATOMY_SYSTEMS, getAncestorIds, validateAtlasManifest, type AtlasManifest, type AtlasNode } from '../../src/lib/anatomyAtlasGraph.ts'
import { WHOLE_BODY_ATLAS } from '../../src/lib/anatomyWholeBodyManifest.ts'
import { compileAnatomyScene } from '../../src/lib/anatomySceneCompiler.ts'
import { planAnatomyAtlasStreaming } from '../../src/lib/anatomyAtlasStreaming.ts'

const validation = validateAtlasManifest(WHOLE_BODY_ATLAS)
assert.equal(validation.valid, true, validation.errors.join('\n'))

for (const system of ANATOMY_SYSTEMS) {
  assert.ok(
    WHOLE_BODY_ATLAS.nodes.some((node) => node.primarySystem === system && !node.parentId),
    `missing system root: ${system}`,
  )
}

const ids = new Set(WHOLE_BODY_ATLAS.nodes.map((node) => node.id))
for (const required of [
  'right-main-bronchus', 'left-main-bronchus',
  'right-upper-lobe', 'right-middle-lobe', 'right-lower-lobe',
  'left-upper-lobe', 'left-lower-lobe',
  'pleura', 'diaphragm',
]) assert.ok(ids.has(required), `respiratory atlas missing ${required}`)

assert.deepEqual(
  getAncestorIds(WHOLE_BODY_ATLAS, 'right-upper-lobe'),
  ['right-lung', 'respiratory-system'],
)

assert.ok(WHOLE_BODY_ATLAS.nodes.every((node) => node.academicReview.status === 'pending'))

// Fail-closed direction: a generic fragment cannot bind to a more specific atlas hint.
const genericArtery = compileAnatomyScene(WHOLE_BODY_ATLAS, [{ name: 'artery', uuid: 'generic-artery' }])
assert.equal(genericArtery.bindings.some((binding) => binding.atlasNodeId === 'pulmonary-circulation'), false)
assert.ok(genericArtery.unclaimedSourceNodes.some((source) => source.uuid === 'generic-artery'))

// A source label may be more specific than a whole reviewed hint.
const specificPulmonary = compileAnatomyScene(WHOLE_BODY_ATLAS, [{ name: 'left pulmonary artery branch', uuid: 'pa-1' }])
assert.equal(specificPulmonary.bindings.some((binding) => binding.atlasNodeId === 'pulmonary-circulation'), true)

const mk = (id: string, name: string, weight: number, aliases: string[] = []): AtlasNode => ({
  id,
  canonicalName: name,
  aliases,
  sourceHints: [],
  primarySystem: 'surface',
  systems: ['surface'],
  regions: ['whole-body'],
  relations: [],
  importanceWeight: weight,
  estimatedCostUnits: 1,
  academicReview: { status: 'pending' },
})

const weightedManifest: AtlasManifest = {
  id: 'weighted-fixture',
  version: '1',
  sourceRegistryRefs: [],
  nodes: [mk('heavy', 'Heavy structure', 3), mk('light', 'Light structure', 1)],
}
const weighted = compileAnatomyScene(weightedManifest, [{ name: 'Heavy structure', uuid: 'heavy-source' }])
assert.equal(weighted.weightedCoverage, 0.75)

const ambiguousManifest: AtlasManifest = {
  id: 'ambiguity-fixture',
  version: '1',
  sourceRegistryRefs: [],
  nodes: [mk('alpha', 'Alpha', 1, ['shared landmark']), mk('beta', 'Beta', 1, ['shared landmark'])],
}
const ambiguous = compileAnatomyScene(ambiguousManifest, [{ name: 'shared landmark', uuid: 'ambiguous-source' }])
assert.equal(ambiguous.bindings.length, 0)
assert.equal(ambiguous.ambiguities.length, 1)
assert.deepEqual(ambiguous.ambiguities[0].atlasNodeIds, ['alpha', 'beta'])

const sourceA = [
  { name: 'Heart', uuid: 'heart-source' },
  { name: 'Right lung', uuid: 'right-lung-source' },
  { name: 'Trachea', uuid: 'trachea-source' },
]
const sourceB = [...sourceA].reverse()
assert.deepEqual(compileAnatomyScene(WHOLE_BODY_ATLAS, sourceA), compileAnatomyScene(WHOLE_BODY_ATLAS, sourceB))

const feasible = planAnatomyAtlasStreaming(WHOLE_BODY_ATLAS, {
  maxBudgetUnits: 20,
  activeSystems: ['respiratory'],
  activeRegions: ['thorax'],
  focusNodeIds: ['right-upper-lobe'],
})
assert.equal(feasible.overBudget, false)
assert.ok(feasible.usedBudgetUnits <= feasible.maxBudgetUnits)
for (const mandatory of ['right-upper-lobe', 'right-lung', 'respiratory-system']) {
  assert.ok(feasible.residentNodeIds.includes(mandatory), `mandatory node was evicted: ${mandatory}`)
}

const impossible = planAnatomyAtlasStreaming(WHOLE_BODY_ATLAS, {
  maxBudgetUnits: 5,
  focusNodeIds: ['right-upper-lobe'],
})
assert.equal(impossible.overBudget, true)
assert.equal(impossible.minimumRequiredBudget, 11)
for (const mandatory of ['right-upper-lobe', 'right-lung', 'respiratory-system']) {
  assert.ok(impossible.residentNodeIds.includes(mandatory), `mandatory node was silently evicted: ${mandatory}`)
}
assert.ok(impossible.usedBudgetUnits > impossible.maxBudgetUnits)

console.log('High-end whole-body atlas: graph integrity, respiratory hierarchy, fail-closed binding, weighted coverage, deterministic compilation, and mandatory-residency streaming invariants verified.')
