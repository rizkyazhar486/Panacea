import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { HIGH_END_ATLAS_SYSTEMS, planHighEndAtlasFrame, validateHighEndAtlasFrame } from '../../src/lib/anatomy/highEndAtlasRuntime.ts'
import { validateBioScaleManifest, bioScaleCoverage } from '../../src/lib/anatomy/bioScaleAtlas.ts'
import { WHOLE_BODY_BIOSCALE_ATLAS, WHOLE_BODY_BIOSCALE_SYSTEMS } from '../../src/lib/anatomy/wholeBodyBioScaleAtlas.ts'
import { planCrossScaleRoute, validateCrossScaleRoute } from '../../src/lib/anatomy/atlasCrossScalePlanner.ts'
import { validateAtlasScaleCorridors } from '../../src/lib/anatomy/atlasScaleCorridors.ts'
import { validateVirtualSpecimenJourney } from '../../src/lib/anatomy/atlasVirtualSpecimenCompiler.ts'

const bioscaleIssues = validateBioScaleManifest(COMPLETE_WHOLE_BODY_ATLAS, WHOLE_BODY_BIOSCALE_ATLAS)
assert.deepEqual(bioscaleIssues, [], `Bioscale manifest issues:\n${bioscaleIssues.map((issue) => `${issue.code}:${issue.nodeId ?? 'manifest'}:${issue.message}`).join('\n')}`)

const corridorIssues = validateAtlasScaleCorridors(COMPLETE_WHOLE_BODY_ATLAS)
assert.deepEqual(corridorIssues, [], `Scale corridor issues:\n${corridorIssues.join('\n')}`)

assert.deepEqual([...WHOLE_BODY_BIOSCALE_SYSTEMS].sort(), [...HIGH_END_ATLAS_SYSTEMS].sort())
const coverage = bioScaleCoverage(WHOLE_BODY_BIOSCALE_ATLAS)
for (const system of HIGH_END_ATLAS_SYSTEMS) {
  assert.ok((coverage.systems[system] ?? 0) >= 3, `Expected at least a cell/subcellular/molecular chain for ${system}.`)
}
assert.ok(coverage.scales.cellular >= HIGH_END_ATLAS_SYSTEMS.length)
assert.ok(coverage.scales.subcellular >= HIGH_END_ATLAS_SYSTEMS.length)
assert.ok(coverage.scales.molecular >= HIGH_END_ATLAS_SYSTEMS.length)

const respiratoryRoute = planCrossScaleRoute(
  COMPLETE_WHOLE_BODY_ATLAS,
  WHOLE_BODY_BIOSCALE_ATLAS,
  'system:respiratory',
  'bio:respiratory:surfactant-complex',
  { strictDrillDown: true },
)
assert.ok(respiratoryRoute, 'Expected explicit respiratory whole-body -> surfactant route.')
assert.deepEqual(validateCrossScaleRoute(respiratoryRoute, true), [])
const respiratoryIds = respiratoryRoute.steps.map((step) => step.id)
assert.equal(respiratoryIds[0], 'system:respiratory')
assert.ok(respiratoryIds.includes('resp:lungs'), 'Respiratory route should pass through lung organ context.')
assert.ok(respiratoryIds.includes('he:pulmonary-acinus'), 'Respiratory route should pass through pulmonary acinus context.')
assert.ok(respiratoryIds.includes('he:alveolar-blood-gas-barrier'), 'Respiratory route should pass through blood-gas barrier context.')
assert.ok(respiratoryIds.includes('bio:respiratory:type-ii-pneumocyte'))
assert.ok(respiratoryIds.includes('bio:respiratory:lamellar-body'))
assert.equal(respiratoryIds.at(-1), 'bio:respiratory:surfactant-complex')
assert.ok(respiratoryRoute.edges.some((edge) => edge.kind === 'scale-corridor'))
assert.ok(respiratoryRoute.edges.some((edge) => edge.kind === 'atlas-to-cell'))

const sensoryRoute = planCrossScaleRoute(
  COMPLETE_WHOLE_BODY_ATLAS,
  WHOLE_BODY_BIOSCALE_ATLAS,
  'system:sensory',
  'bio:sensory:phototransduction-complex',
  { strictDrillDown: true },
)
assert.ok(sensoryRoute)
assert.deepEqual(validateCrossScaleRoute(sensoryRoute, true), [])
assert.ok(sensoryRoute.steps.some((step) => step.id === 'he:ocular-globe'))
assert.ok(sensoryRoute.steps.some((step) => step.id === 'he:retina'))
assert.equal(sensoryRoute.steps.at(-1)?.scale, 'molecular')

const forbiddenCrossSystem = planCrossScaleRoute(
  COMPLETE_WHOLE_BODY_ATLAS,
  WHOLE_BODY_BIOSCALE_ATLAS,
  'system:respiratory',
  'bio:digestive:cytochrome-p450-system',
  { strictDrillDown: true },
)
assert.equal(forbiddenCrossSystem, null, 'Default cross-scale route must not silently cross organ systems.')

const input = {
  request: { selectedNodeId: 'system:respiratory', systems: ['respiratory'] as const, includeReferenceOnly: true },
  budget: {
    triangleBudget: 2_000_000,
    textureBudgetMegabytes: 512,
    nodeBudget: 200,
    devicePixelRatio: 2,
    viewportWidth: 1920,
    viewportHeight: 1080,
    maxConcurrentLoads: 8,
    cacheTriangleBudget: 4_000_000,
    cacheTextureBudgetMegabytes: 1024,
    minimumResidencyMs: 10_000,
  },
  telemetry: { nowMs: 1_000, medianFrameTimeMs: 14, targetFrameTimeMs: 16.67, interactionVelocity: 0.1 },
  residency: { assets: [] as const },
  respiratory: { phase: 'inspiration' as const, overlays: ['airflow', 'gas-exchange'] as const },
  crossScale: { targetBioNodeId: 'bio:respiratory:surfactant-complex', strictDrillDown: true },
}
const frame = planHighEndAtlasFrame(input)
assert.ok(frame.respiratory)
assert.ok(frame.crossScale)
assert.ok(frame.virtualSpecimen)
assert.equal(frame.crossScale?.steps.at(-1)?.id, 'bio:respiratory:surfactant-complex')
assert.equal(frame.bioscaleManifestId, WHOLE_BODY_BIOSCALE_ATLAS.id)
assert.deepEqual(validateHighEndAtlasFrame(input), [])
assert.deepEqual(validateVirtualSpecimenJourney(frame.virtualSpecimen!), [])

const stages = frame.virtualSpecimen!.stages
assert.equal(stages[0]?.cameraIntent, 'whole-body')
assert.equal(stages.at(-1)?.cameraIntent, 'molecular-diagram')
assert.equal(stages.at(-1)?.step.scale, 'molecular')
assert.ok(stages.some((stage) => stage.transitionFromPrevious === 'microscopy-bridge'))
assert.ok(stages.some((stage) => stage.transitionFromPrevious === 'molecular-bridge'))
for (const stage of stages.filter((stage) => stage.step.namespace === 'bio')) {
  assert.equal(stage.geometryExpected, false, `Bioscale stage must not claim atlas mesh geometry: ${stage.step.id}`)
  assert.equal(stage.conceptualOnly, true, `Bioscale stage must remain conceptual/reference-only: ${stage.step.id}`)
  assert.ok(stage.provenanceBoundary.includes('academic-review-required'))
}

console.log(`Whole-body bioscale atlas v2: ${WHOLE_BODY_BIOSCALE_ATLAS.nodes.length} bioscale nodes across ${WHOLE_BODY_BIOSCALE_SYSTEMS.length} systems; organism-to-molecular routes and virtual specimen boundaries verified.`)
