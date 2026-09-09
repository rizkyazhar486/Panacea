import assert from 'node:assert/strict'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'
import { ADVANCED_RESPIRATORY_SEGMENTAL_BRONCHUS_IDS } from '../../src/lib/anatomy/advancedRespiratoryAtlas.ts'
import { compileAtlasAgainstSource } from '../../src/lib/anatomy/atlasCompiler.ts'
import { traceAtlasPath } from '../../src/lib/anatomy/atlasGraph.ts'
import { validateAtlasManifest, type AtlasSystemId } from '../../src/lib/anatomy/atlasKernel.ts'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { buildMeasuredAtlasRenderPlan, measuredCoverageBySystem } from '../../src/lib/anatomy/measuredRenderPlanner.ts'
import { MULTISCALE_PHYSIOLOGY_EQUATIONS, traceMultiscalePath, validateMultiscaleAtlas } from '../../src/lib/anatomy/multiscaleAtlas.ts'
import { RESPIRATORY_SEGMENT_IDS } from '../../src/lib/anatomy/respiratoryAtlas.ts'

const manifest = COMPLETE_WHOLE_BODY_ATLAS
const ids = manifest.nodes.map((node) => node.id)
const uniqueIds = new Set(ids)
assert.equal(uniqueIds.size, ids.length, 'Canonical atlas must never contain duplicate semantic ids.')

const manifestIssues = validateAtlasManifest(manifest)
assert.deepEqual(manifestIssues, [], manifestIssues.map((issue) => `${issue.code}: ${issue.nodeId ?? '-'} ${issue.message}`).join('\n'))

const requiredSystems: readonly AtlasSystemId[] = [
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
]
const systems = new Set(manifest.nodes.map((node) => node.system))
for (const system of requiredSystems) assert.equal(systems.has(system), true, `Missing whole-body system: ${system}`)

assert.equal(RESPIRATORY_SEGMENT_IDS.length, 18, 'Canonical parenchymal bronchopulmonary segment set must remain 18 labels.')
assert.equal(ADVANCED_RESPIRATORY_SEGMENTAL_BRONCHUS_IDS.length, 18, 'Advanced airway set must contain 18 segmental bronchus labels.')
assert.equal(
  ADVANCED_RESPIRATORY_SEGMENTAL_BRONCHUS_IDS.some((id) => RESPIRATORY_SEGMENT_IDS.includes(id)),
  false,
  'Airway bronchi and parenchymal segment ids must never collapse into the same semantic object.',
)

const rightB10ToSegment = traceAtlasPath(
  manifest,
  'resp:segmental-bronchus:r-b10',
  'resp:segment:r-s10',
  ['supplies'],
)
assert.ok(rightB10ToSegment, 'Right B10 must explicitly map to right S10 parenchymal segment.')
assert.equal(rightB10ToSegment.edges.every((edge) => edge.kind === 'supplies'), true)

const cardiacCircuit = traceAtlasPath(
  manifest,
  'cv:right-atrium',
  'cv:ascending-aorta',
  ['continuous-with', 'drains'],
)
assert.ok(cardiacCircuit, 'Educational circulation topology must connect right atrium through pulmonary circuit to ascending aorta.')
assert.equal(cardiacCircuit.nodeIds.includes('cv:pulmonary-capillary-bed'), true)
assert.equal(cardiacCircuit.nodeIds.includes('cv:left-atrium'), true)
assert.equal(cardiacCircuit.nodeIds.includes('cv:left-ventricle'), true)

const cerebralArterialPath = traceAtlasPath(
  manifest,
  'cv:ascending-aorta',
  'cv:right-middle-cerebral-artery',
  ['continuous-with'],
)
assert.ok(cerebralArterialPath, 'Aortic-to-right-MCA arterial topology must be explicit.')
assert.equal(cerebralArterialPath.nodeIds.includes('cv:right-internal-carotid'), true)

const lowerLimbArterialPath = traceAtlasPath(
  manifest,
  'cv:abdominal-aorta',
  'cv:right-dorsalis-pedis-artery',
  ['continuous-with'],
)
assert.ok(lowerLimbArterialPath, 'Abdominal aorta must connect explicitly to right dorsalis pedis in the educational arterial graph.')

const deepVenousReturn = traceAtlasPath(
  manifest,
  'cv:right-posterior-tibial-vein',
  'cv:right-atrium',
  ['drains'],
)
assert.ok(deepVenousReturn, 'Right posterior tibial vein must have an explicit deep venous return path to right atrium.')
assert.equal(deepVenousReturn.nodeIds.includes('cv:inferior-vena-cava'), true)

const mcaTerritory = traceAtlasPath(
  manifest,
  'cv:right-middle-cerebral-artery',
  'neuro:territory:right-mca-lateral-frontal',
  ['supplies'],
)
assert.ok(mcaTerritory, 'MCA educational territory overlay must be explicitly related rather than inferred spatially.')
const territoryNode = manifest.nodes.find((node) => node.id === 'neuro:territory:right-mca-lateral-frontal')
assert.ok(territoryNode)
assert.equal(territoryNode.geometryStatus, 'reference-only')
assert.equal(territoryNode.provenance.reviewStatus, 'academic-review-required')

const multiscaleIssues = validateMultiscaleAtlas(manifest)
assert.deepEqual(multiscaleIssues, [], multiscaleIssues.map((issue) => `${issue.code}: ${issue.nodeId ?? '-'} ${issue.message}`).join('\n'))

const bodyToMolecular = traceMultiscalePath('scale:body', 'scale:gas-molecule')
assert.ok(bodyToMolecular, 'Whole-body to molecular respiratory teaching path must exist.')
assert.equal(bodyToMolecular.nodeIds.includes('scale:alveolus'), true)
assert.equal(bodyToMolecular.nodeIds.includes('scale:type-i-pneumocyte'), true)

const sourceGeometryOnly = traceMultiscalePath(
  'scale:body',
  'scale:gas-molecule',
  ['none', 'source-geometry'],
)
assert.equal(sourceGeometryOnly, null, 'Gross source geometry must never silently cross into cellular/molecular reference content.')

for (const equation of MULTISCALE_PHYSIOLOGY_EQUATIONS) {
  assert.equal(equation.patientSpecific, false)
  assert.ok(equation.equation.trim().length > 0)
  assert.ok(equation.variables.length > 0)
  for (const anchorId of equation.anchorAtlasNodeIds) {
    assert.equal(uniqueIds.has(anchorId), true, `Equation ${equation.id} has missing atlas anchor ${anchorId}.`)
  }
}

const compiled = compileAtlasAgainstSource(manifest, INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT)
assert.equal(compiled.totals.nodeCount, manifest.nodes.length)
assert.ok(compiled.totals.resolvedSourceNodeCount > 0)
assert.ok(compiled.totals.resolvedTriangles > 0)

const budget = {
  triangleBudget: 50_000_000,
  textureBudgetMegabytes: 8_192,
  nodeBudget: 1_024,
  devicePixelRatio: 2,
  viewportWidth: 1440,
  viewportHeight: 900,
}
const renderPlan = buildMeasuredAtlasRenderPlan(compiled, { includeReferenceOnly: true }, budget)
assert.ok(renderPlan.nodes.length > 0)
assert.ok(renderPlan.totalTriangles <= budget.triangleBudget)
assert.ok(renderPlan.totalEstimatedTextureMegabytes <= budget.textureBudgetMegabytes)
assert.ok(renderPlan.nodes.length <= budget.nodeBudget)
assert.equal(
  renderPlan.nodes.some((entry) => entry.node.geometryStatus === 'reference-only' || entry.node.geometryStatus === 'planned'),
  false,
  'Measured render planner must never promote reference-only/planned semantic nodes into gross 3D residency.',
)
assert.ok(renderPlan.skipped.some((entry) => entry.nodeId === 'resp:alveolus' && entry.reason.includes('reference')))
assert.ok(renderPlan.totalUniqueSourceNodes <= renderPlan.nodes.reduce((sum, entry) => sum + entry.sourceNodeCount, 0))

const systemCoverage = measuredCoverageBySystem(compiled)
assert.ok(systemCoverage.respiratory)
assert.ok(systemCoverage.cardiovascular)
assert.ok(systemCoverage.nervous)
assert.ok((systemCoverage.respiratory?.nodes ?? 0) > 0)
assert.ok((systemCoverage.cardiovascular?.nodes ?? 0) > 0)

console.log(
  `High-end whole-body atlas: ${manifest.nodes.length} semantic nodes, ${compiled.totals.resolvedSourceNodeCount} indexed source meshes, ${compiled.totals.resolvedTriangles} measured triangles; respiratory airway/parenchyma, cardiopulmonary, neurovascular, multiscale and residency invariants verified.`,
)
