import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { planAtlasHardBudgetFrame } from '../../src/lib/anatomy/atlasHardBudgetRuntime.ts'
import {
  HighEndAtlasAssetCoordinator,
  highEndAtlasAssetCacheKey,
  validateHighEndAtlasAsset,
  type HighEndAtlasAssetDescriptor,
} from '../../src/lib/anatomy/highEndAtlasAssetPipeline.ts'

const request = {
  selectedNodeId: 'resp:trachea',
  systems: ['respiratory'] as const,
  regions: ['thorax'] as const,
  projectedPixelsByNodeId: {
    'resp:trachea': 640,
    'resp:carina': 320,
    'resp:right-main-bronchus': 240,
    'resp:left-main-bronchus': 240,
  },
}

const hardBudget = {
  triangles: 600_000,
  drawCalls: 16,
  gpuBytes: 160 * 1024 * 1024,
}

const planA = planAtlasHardBudgetFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  request,
  budget: hardBudget,
  viewportWidth: 1440,
  viewportHeight: 900,
})
const planB = planAtlasHardBudgetFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  request,
  budget: hardBudget,
  viewportWidth: 1440,
  viewportHeight: 900,
})

assert.deepEqual(planA, planB, 'hard-budget whole-body planning must be deterministic')
assert.equal(planA.status, 'ready')
assert.deepEqual(planA.unresolvedRequired, [])
assert.ok(planA.candidateCount > 0)
assert.ok(planA.selected.some((entry) => entry.structureId === 'resp:trachea' && entry.required), 'selected anatomy must be hard-reserved')
assert.ok(planA.usage.triangles <= hardBudget.triangles, 'triangle budget must never be exceeded')
assert.ok(planA.usage.drawCalls <= hardBudget.drawCalls, 'draw-call budget must never be exceeded')
assert.ok(planA.usage.gpuBytes <= hardBudget.gpuBytes, 'GPU-byte budget must never be exceeded')

const impossible = planAtlasHardBudgetFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  request,
  budget: { triangles: 1, drawCalls: 1, gpuBytes: 1 },
  viewportWidth: 390,
  viewportHeight: 844,
})
assert.equal(impossible.status, 'budget-blocked', 'selected anatomy must fail closed when even minimum LOD cannot fit')
assert.ok(impossible.unresolvedRequired.includes('resp:trachea'))
assert.ok(impossible.usage.triangles <= impossible.budget.triangles)
assert.ok(impossible.usage.drawCalls <= impossible.budget.drawCalls)
assert.ok(impossible.usage.gpuBytes <= impossible.budget.gpuBytes)

const missingSelected = planAtlasHardBudgetFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  request: { selectedNodeId: 'not-a-real-atlas-node' },
  budget: hardBudget,
  viewportWidth: 390,
  viewportHeight: 844,
})
assert.equal(missingSelected.status, 'budget-blocked')
assert.deepEqual(missingSelected.preflightBlocked, ['not-a-real-atlas-node'])

const validAsset: HighEndAtlasAssetDescriptor = {
  assetId: 'fixture-trachea-lod1',
  structureId: 'resp:trachea',
  sourceRegistryId: 'fixture-provenance-source',
  sourceVersion: '2026-09-09-fixture-v1',
  artifactPath: '/anatomy/fixture-trachea.glb',
  format: 'glb',
  sha256: 'a'.repeat(64),
  bytes: 1024,
  lodLevel: 1,
  compression: ['meshopt'],
  bounds: { min: [-1, -1, -1], max: [1, 1, 1], source: 'artifact-verified' },
  productionGate: {
    provenanceComplete: true,
    licenseCleared: true,
    stableIdMapped: true,
    artifactVerified: true,
    performanceReviewed: true,
    visualQaReviewed: true,
  },
}

assert.equal(validateHighEndAtlasAsset(validAsset).runtimeEligible, true)
assert.equal(
  validateHighEndAtlasAsset({ ...validAsset, productionGate: { ...validAsset.productionGate, licenseCleared: false } }).runtimeEligible,
  false,
  'uncleared geometry must never enter the runtime cache',
)
assert.notEqual(
  highEndAtlasAssetCacheKey(validAsset),
  highEndAtlasAssetCacheKey({ ...validAsset, sourceVersion: '2026-09-09-fixture-v2' }),
  'source-version changes must invalidate immutable asset identity',
)
assert.notEqual(
  highEndAtlasAssetCacheKey(validAsset),
  highEndAtlasAssetCacheKey({ ...validAsset, sha256: 'b'.repeat(64) }),
  'artifact SHA changes must invalidate immutable asset identity',
)

const coordinator = new HighEndAtlasAssetCoordinator<{ id: string }>(2)
let loaderCalls = 0
const loader = async () => {
  loaderCalls += 1
  await Promise.resolve()
  return { id: 'fixture-loaded' }
}
const [first, second] = await Promise.all([
  coordinator.load(validAsset, loader),
  coordinator.load(validAsset, loader),
])
assert.equal(loaderCalls, 1, 'concurrent requests for one immutable atlas artifact must deduplicate in flight')
assert.deepEqual(first, second)
assert.equal(coordinator.has(validAsset), true)
assert.equal(coordinator.size, 1)

console.log('High-end atlas hard budgets and assets: selected-node reservation, zero silent GPU/draw/triangle oversubscription, immutable source/SHA cache identity, fail-closed production gates, and in-flight request deduplication verified.')
