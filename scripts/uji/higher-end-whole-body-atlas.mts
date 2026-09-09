import assert from 'node:assert/strict'
import {
  atlasCrossSectionCandidates,
  buildAtlasCoverageMatrix,
  buildAtlasPrefetchPlan,
  buildAtlasRuntimeIndex,
  buildAtlasScaleRoute,
  findAtlasPath,
  searchAtlasRuntime,
} from '../../src/lib/anatomy/atlasHigherEndRuntime.ts'
import { validateAtlasManifest } from '../../src/lib/anatomy/atlasKernel.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  HIGHER_END_WHOLE_BODY_NODES,
  HIGHER_END_WHOLE_BODY_REGIONS,
  HIGHER_END_WHOLE_BODY_SYSTEMS,
} from '../../src/lib/anatomy/higherEndWholeBodyAtlas.ts'

const expectedSystems = new Set([
  'surface',
  'skeletal',
  'articular',
  'muscular',
  'cardiovascular',
  'lymphatic',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
  'sensory',
  'fascial',
])

const expectedRegions = new Set([
  'whole-body', 'head', 'neck', 'thorax', 'abdomen', 'pelvis', 'back',
  'upper-limb', 'hand', 'lower-limb', 'foot',
])

assert.ok(HIGHER_END_WHOLE_BODY_NODES.length >= 65, 'Higher-end expansion must remain a substantial whole-body graph, not a cosmetic patch.')
assert.deepEqual(new Set(HIGHER_END_WHOLE_BODY_SYSTEMS), expectedSystems)
assert.deepEqual(new Set(HIGHER_END_WHOLE_BODY_REGIONS), expectedRegions)
assert.ok(COMPLETE_WHOLE_BODY_ATLAS.revision.includes('higher-end'))

// Every added structure is deliberately fail-closed until reviewed geometry is admitted.
for (const node of HIGHER_END_WHOLE_BODY_NODES) {
  assert.equal(node.geometryStatus, 'reference-only', `${node.id} must not masquerade as shipped geometry.`)
  assert.equal(node.provenance.reviewStatus, 'academic-review-required', `${node.id} must keep the human-review boundary explicit.`)
  assert.ok(node.provenance.sourceRevision && !['latest', 'main', 'head', 'current'].includes(node.provenance.sourceRevision.toLowerCase()))
  if (node.spatial) {
    assert.ok(node.spatial.radius > 0, `${node.id} spatial radius must be positive.`)
    for (const coordinate of node.spatial.center) assert.ok(Math.abs(coordinate) <= 1.2, `${node.id} spatial anchor must stay in normalized educational model space.`)
  }
}

const validationIssues = validateAtlasManifest(COMPLETE_WHOLE_BODY_ATLAS)
assert.deepEqual(validationIssues, [], `Canonical atlas must remain structurally valid: ${JSON.stringify(validationIssues, null, 2)}`)

const index = buildAtlasRuntimeIndex(COMPLETE_WHOLE_BODY_ATLAS)
assert.equal(index.byId.size, COMPLETE_WHOLE_BODY_ATLAS.nodes.length)
assert.ok(index.bySystem.get('nervous')?.some((node) => node.id === 'he:brachial-plexus'))
assert.ok(index.byRegion.get('pelvis')?.some((node) => node.id === 'he:pelvic-floor'))
assert.ok(index.byScale.get('microstructure')?.some((node) => node.id === 'he:glomerulus'))

const brachialSearch = searchAtlasRuntime(index, 'brachial plexus', { systems: ['nervous'], limit: 5 })
assert.equal(brachialSearch[0]?.node.id, 'he:brachial-plexus')

const retinaSearch = searchAtlasRuntime(index, 'photoreceptor', { regions: ['head'], limit: 5 })
assert.ok(retinaSearch.some((hit) => hit.node.id === 'he:retinal-photoreceptor-unit'))

const gasExchangePath = findAtlasPath(index, 'he:alveolar-blood-gas-barrier', 'he:microcirculation', {
  includeHierarchy: false,
  allowReverseRelations: false,
  relationKinds: ['continuous-with'],
})
assert.deepEqual(gasExchangePath?.nodeIds, ['he:alveolar-blood-gas-barrier', 'he:microcirculation'])
assert.equal(gasExchangePath?.edges[0]?.kind, 'continuous-with')

const reverseGasExchange = findAtlasPath(index, 'he:microcirculation', 'he:alveolar-blood-gas-barrier', {
  includeHierarchy: false,
  allowReverseRelations: false,
  relationKinds: ['continuous-with'],
})
assert.equal(reverseGasExchange, null, 'Directional relation guard must not silently reverse an edge when reverse traversal is forbidden.')

const renalHierarchy = findAtlasPath(index, 'he:glomerulus', 'system:urinary', {
  includeHierarchy: true,
  allowReverseRelations: false,
  relationKinds: [],
})
assert.deepEqual(renalHierarchy?.nodeIds, ['he:glomerulus', 'he:nephron', 'he:renal-parenchyma', 'system:urinary'])

const axialThorax = atlasCrossSectionCandidates(index, {
  plane: 'axial',
  position: 0.31,
  thickness: 0.03,
  regions: ['thorax'],
  includeReferenceOnly: true,
  limit: 30,
})
assert.ok(axialThorax.some((hit) => hit.node.id === 'he:thoracic-cage'))
assert.ok(axialThorax.some((hit) => hit.node.id === 'he:mediastinal-compartments'))
assert.ok(axialThorax.every((hit) => hit.intersectionRadius >= 0 && hit.crossSectionAreaProxy >= 0))

const ocularScaleRoute = buildAtlasScaleRoute(index, 'he:ocular-globe')
assert.deepEqual(ocularScaleRoute?.route.map((node) => node.id), [
  'he:ocular-globe',
  'he:retina',
  'he:retinal-photoreceptor-unit',
])
assert.deepEqual(ocularScaleRoute?.representedScales, ['suborgan', 'tissue', 'microstructure'])

const coverage = buildAtlasCoverageMatrix(index)
for (const system of expectedSystems) {
  const summary = coverage.bySystem[system as keyof typeof coverage.bySystem]
  assert.ok((summary?.total ?? 0) > 0, `${system} must be represented in the complete atlas.`)
}
assert.ok((coverage.bySystem.nervous?.representedRegions ?? 0) >= 5)
assert.ok((coverage.bySystem.digestive?.representedScales ?? 0) >= 3)
assert.ok((coverage.bySystem.sensory?.representedScales ?? 0) >= 3)
assert.ok(coverage.emptyCells.length > 0, 'Completeness matrix must expose remaining holes rather than pretending total anatomical completeness.')

const lungPrefetch = buildAtlasPrefetchPlan(index, {
  selectedNodeId: 'resp:lungs',
  maxGraphDepth: 2,
  maxFiles: 6,
})
assert.ok(lungPrefetch.some((candidate) => candidate.file === 'visceral.glb'))
assert.ok(lungPrefetch.every((candidate, indexInArray, values) => indexInArray === 0 || values[indexInArray - 1].priority >= candidate.priority))

console.log([
  `Higher-end atlas nodes: ${HIGHER_END_WHOLE_BODY_NODES.length}`,
  `Canonical atlas nodes: ${COMPLETE_WHOLE_BODY_ATLAS.nodes.length}`,
  `Systems: ${HIGHER_END_WHOLE_BODY_SYSTEMS.length}`,
  `Regions: ${HIGHER_END_WHOLE_BODY_REGIONS.length}`,
  `Coverage holes exposed: ${coverage.emptyCells.length}`,
  `Axial thorax candidates: ${axialThorax.length}`,
].join(' | '))
