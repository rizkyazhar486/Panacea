import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import {
  BRONCHOPULMONARY_SEGMENT_RUNTIME,
  buildRespiratoryHighEndScene,
  validateRespiratoryHighEndRuntime,
} from '../../src/lib/anatomy/respiratoryHighEndRuntime.ts'
import {
  buildAtlasCoverageReport,
  buildAtlasFocusStack,
  planAtlasDrilldown,
} from '../../src/lib/anatomy/atlasMultiscaleNavigator.ts'
import {
  deriveAdaptiveAtlasBudget,
  planAtlasStreaming,
  validateAtlasStreamingPlan,
} from '../../src/lib/anatomy/atlasStreamingKernel.ts'
import {
  HIGH_END_ATLAS_SYSTEMS,
  highEndAtlasEngineeringReadiness,
  planHighEndAtlasFrame,
  validateHighEndAtlasFrame,
} from '../../src/lib/anatomy/highEndAtlasRuntime.ts'

const manifest = COMPLETE_WHOLE_BODY_ATLAS

// Whole-body breadth: every declared high-end system must be represented by at
// least one canonical manifest node. This is an engineering coverage invariant,
// not an academic-completeness assertion.
const coverage = buildAtlasCoverageReport(manifest)
for (const system of HIGH_END_ATLAS_SYSTEMS) {
  assert.ok(coverage.systemCoverage[system] > 0, `Expected atlas system coverage for ${system}`)
}

// Respiratory deep-dive exposes the complete current educational segment matrix:
// 10 right entries plus 8 left entries with combined S1+2 and S7+8 scaffolds.
assert.equal(BRONCHOPULMONARY_SEGMENT_RUNTIME.length, 18)
assert.equal(BRONCHOPULMONARY_SEGMENT_RUNTIME.filter((segment) => segment.side === 'right').length, 10)
assert.equal(BRONCHOPULMONARY_SEGMENT_RUNTIME.filter((segment) => segment.side === 'left').length, 8)
assert.deepEqual(validateRespiratoryHighEndRuntime(manifest), [])

const leftPosteriorBasal = buildRespiratoryHighEndScene(manifest, {
  phase: 'inspiration',
  segmentNodeId: 'resp:segment:l-s10',
  overlays: ['airflow', 'gas-exchange'],
})
assert.deepEqual(leftPosteriorBasal.airwayRoute.slice(0, 4), [
  'resp:larynx',
  'resp:trachea',
  'resp:carina',
  'resp:left-main-bronchus',
])
assert.equal(leftPosteriorBasal.airwayRoute.at(-1), 'resp:segment:l-s10')
assert.equal(leftPosteriorBasal.conceptualOverlays.find((overlay) => overlay.id === 'gas-exchange')?.enabled, true)
assert.ok(leftPosteriorBasal.conceptualOverlays.every((overlay) => overlay.quantitative === false))

// Multiscale focus must preserve canonical ancestry and never synthesize a
// patient-specific path.
const focus = buildAtlasFocusStack(manifest, 'resp:segment:r-s1', 0)
assert.ok(focus.some((level) => level.node.id === 'resp:segment:r-s1' && level.role === 'selected'))
assert.ok(focus.some((level) => level.node.id === 'resp:right-upper-lobe' && level.role === 'ancestor'))

const drilldown = planAtlasDrilldown(manifest, 'resp:right-lung', 'resp:segment:r-s1')
assert.ok(drilldown)
assert.equal(drilldown.nodeIds[0], 'resp:right-lung')
assert.equal(drilldown.nodeIds.at(-1), 'resp:segment:r-s1')

const baseBudget = {
  triangleBudget: 900_000,
  textureBudgetMegabytes: 192,
  nodeBudget: 24,
  devicePixelRatio: 2,
  viewportWidth: 1440,
  viewportHeight: 900,
  maxConcurrentLoads: 4,
  cacheTriangleBudget: 2_000_000,
  cacheTextureBudgetMegabytes: 384,
  minimumResidencyMs: 8_000,
}

const calm = deriveAdaptiveAtlasBudget(baseBudget, {
  nowMs: 10_000,
  medianFrameTimeMs: 12,
  targetFrameTimeMs: 16.67,
  interactionVelocity: 0.1,
})
const pressured = deriveAdaptiveAtlasBudget(baseBudget, {
  nowMs: 10_000,
  medianFrameTimeMs: 31,
  targetFrameTimeMs: 16.67,
  interactionVelocity: 0.9,
})
assert.ok(calm.budget.triangleBudget > pressured.budget.triangleBudget)
assert.ok(calm.budget.textureBudgetMegabytes > pressured.budget.textureBudgetMegabytes)
assert.ok(pressured.pressureRatio > 1)

const request = {
  selectedNodeId: 'resp:trachea',
  systems: ['respiratory'] as const,
  regions: ['thorax'] as const,
  projectedPixelsByNodeId: {
    'resp:trachea': 620,
    'resp:carina': 320,
    'resp:right-main-bronchus': 260,
  },
}

const streaming = planAtlasStreaming(
  manifest,
  request,
  baseBudget,
  { nowMs: 20_000, medianFrameTimeMs: 15, targetFrameTimeMs: 16.67, interactionVelocity: 0.2 },
  { assets: [] },
)
assert.ok(streaming.decisions.length > 0)
assert.ok(streaming.decisions.some((decision) => decision.pinned && decision.nodeIds.includes('resp:trachea')))
assert.deepEqual(validateAtlasStreamingPlan(streaming), [])

// Residency hysteresis: a recently loaded asset outside the next active set is
// not evicted merely because selection changed.
const first = streaming.decisions[0]!
const hysteresis = planAtlasStreaming(
  manifest,
  { selectedNodeId: 'cv:heart', systems: ['cardiovascular'] },
  baseBudget,
  { nowMs: 22_000, medianFrameTimeMs: 15, targetFrameTimeMs: 16.67, interactionVelocity: 0.15 },
  {
    assets: [{
      key: first.key,
      lodTier: first.lod.tier,
      triangles: first.estimatedTriangles,
      textureMegabytes: first.estimatedTextureMegabytes,
      loadedAtMs: 20_000,
      lastTouchedAtMs: 21_500,
    }],
  },
)
assert.equal(hysteresis.evict.some((candidate) => candidate.key === first.key), false)

const frameInput = {
  request,
  budget: baseBudget,
  telemetry: { nowMs: 30_000, medianFrameTimeMs: 14, targetFrameTimeMs: 16.67, interactionVelocity: 0.1 },
  residency: { assets: [] },
  respiratory: { phase: 'end-inspiration' as const, segmentNodeId: 'resp:segment:r-s6', overlays: ['airflow'] as const },
}
const frame = planHighEndAtlasFrame(frameInput)
assert.equal(frame.selectedNodeId, 'resp:trachea')
assert.equal(frame.respiratory?.phase.phase, 'end-inspiration')
assert.equal(frame.respiratory?.airwayRoute.at(-1), 'resp:segment:r-s6')
assert.deepEqual(validateHighEndAtlasFrame(frameInput), [])

const readiness = highEndAtlasEngineeringReadiness()
assert.equal(readiness.academicReviewRequired, true)
assert.ok(readiness.nodeCount >= BRONCHOPULMONARY_SEGMENT_RUNTIME.length)
assert.deepEqual(
  readiness.blockingEngineeringIssues.filter((issue) => issue.startsWith('manifest:invalid-academic-review:')),
  [],
  'High-end engineering readiness must surface canonical academic-review claim defects instead of bypassing them.',
)

console.log('High-end whole-body atlas: adaptive streaming, residency hysteresis, multiscale navigation, respiratory segment routing, canonical manifest validity, and review boundaries verified.')
