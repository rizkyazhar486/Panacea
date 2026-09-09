import assert from 'node:assert/strict'
import {
  planUltimateWholeBodyFrame,
  ultimateWholeBodyEngineeringReadiness,
  validateUltimateWholeBodyFrame,
  ULTIMATE_WHOLE_BODY_CAPABILITIES,
} from '../../src/lib/anatomy/ultimateWholeBodyRuntime.ts'

const budget = {
  triangleBudget: 14_000_000,
  textureBudgetMegabytes: 2_048,
  nodeBudget: 640,
  devicePixelRatio: 2,
  viewportWidth: 1600,
  viewportHeight: 1000,
  maxConcurrentLoads: 640,
  cacheTriangleBudget: 24_000_000,
  cacheTextureBudgetMegabytes: 4_096,
  minimumResidencyMs: 12_000,
} as const

const telemetry = {
  nowMs: 250_000,
  medianFrameTimeMs: 10.5,
  targetFrameTimeMs: 16.67,
  interactionVelocity: 0.04,
} as const

const residency = { assets: [] as const }

assert.equal(ULTIMATE_WHOLE_BODY_CAPABILITIES.systems, 14)
assert.equal(ULTIMATE_WHOLE_BODY_CAPABILITIES.clinicalBoundary.patientSpecificGeometry, false)
assert.equal(ULTIMATE_WHOLE_BODY_CAPABILITIES.clinicalBoundary.unreviewedSurgeryPublication, false)
assert.equal(ULTIMATE_WHOLE_BODY_CAPABILITIES.clinicalBoundary.referenceOnlyGeometryAutoPromotion, false)

const readiness = ultimateWholeBodyEngineeringReadiness()
assert.equal(readiness.representedSystems.length, 14)
assert.ok(readiness.nodeCount >= 150, `Expected a materially expanded canonical atlas; received ${readiness.nodeCount} nodes.`)
assert.ok(readiness.referenceOnlyNodes >= 70, 'Deep source-bound roadmap identities must remain explicitly reference-only.')
assert.ok(readiness.shippedOrPartialNodes > 0, 'Canonical atlas must still include real source-bound renderable anatomy.')
assert.deepEqual(readiness.blockingEngineeringIssues, [])
assert.equal(readiness.academicReviewStillRequired, true)

const wholeBody = planUltimateWholeBodyFrame({
  intent: {
    mode: 'whole-body',
    contextOpacity: 0.2,
  },
  budget,
  telemetry,
  residency,
})
assert.equal(wholeBody.atlas.revision, '2026-09-09-r4-deep-world-foundation')
assert.equal(wholeBody.atlas.nodeCount, readiness.nodeCount)
assert.ok(wholeBody.world.renderLayers.length > 0)
assert.ok(wholeBody.world.metadataReferences.length > 0)
assert.equal(wholeBody.world.publicationGate.patientSpecificGeometryAllowed, false)
assert.deepEqual(validateUltimateWholeBodyFrame(wholeBody), [])

const cardioReference = planUltimateWholeBodyFrame({
  intent: {
    mode: 'microstructure',
    selectedNodeId: 'deep:pulmonary-capillary-bed',
    systems: ['cardiovascular'],
    regions: ['thorax'],
  },
  budget,
  telemetry,
  residency,
})
assert.equal(cardioReference.world.selectedNodeId, 'deep:pulmonary-capillary-bed')
assert.ok(cardioReference.world.metadataReferences.some((item) => item.nodeId === 'deep:pulmonary-capillary-bed'))
assert.equal(cardioReference.world.renderLayers.some((layer) => layer.nodeId === 'deep:pulmonary-capillary-bed'), false)
assert.deepEqual(validateUltimateWholeBodyFrame(cardioReference), [])

const respiratory = planUltimateWholeBodyFrame({
  intent: {
    mode: 'system-isolation',
    systems: ['respiratory'],
    regions: ['head', 'neck', 'thorax'],
    respiratory: {
      phase: 'inspiration',
      segmentNodeId: 'resp:segment:r-s6',
      overlays: ['airflow', 'gas-exchange'],
    },
  },
  budget,
  telemetry,
  residency,
  respiratoryMotion: {
    cycleFraction: 0.18,
    selectedSegmentNodeId: 'resp:segment:r-s6',
    channels: ['airway-lumen', 'lung-envelope', 'diaphragm', 'acinar-reference', 'gas-exchange-reference'],
  },
})
assert.ok(respiratory.world.respiratory)
assert.ok(respiratory.respiratoryMotion)
assert.equal(respiratory.world.respiratory?.conceptualOverlays.every((overlay) => overlay.quantitative === false), true)
assert.equal(respiratory.respiratoryMotion?.sample.quantitative, false)
assert.equal(respiratory.respiratoryMotion?.selectedSegmentNodeId, 'resp:segment:r-s6')
assert.ok(respiratory.respiratoryMotion?.airwayRoute.includes('resp:right-main-bronchus'))

// The respiratory overlay pass may contain source-bound focus nodes only. This
// invariant deliberately prevents future viewer work from rendering reference
// metadata as if it were verified geometry.
for (const pass of respiratory.world.passes) {
  for (const nodeId of pass.nodeIds) {
    assert.ok(respiratory.world.renderLayers.some((layer) => layer.nodeId === nodeId), `Render pass leaked non-rendered node: ${pass.id}:${nodeId}`)
  }
}
assert.deepEqual(validateUltimateWholeBodyFrame(respiratory), [])

const blockedSurgery = planUltimateWholeBodyFrame({
  intent: {
    mode: 'surgery-reference',
    selectedNodeId: 'cv:heart',
    systems: ['cardiovascular'],
  },
  budget,
  telemetry,
  residency,
})
assert.equal(blockedSurgery.world.publicationGate.surgicalReferenceAllowed, false)
assert.equal(blockedSurgery.world.publicationGate.patientSpecificGeometryAllowed, false)
assert.ok(blockedSurgery.world.publicationGate.blockingReasons.length > 0)
assert.deepEqual(validateUltimateWholeBodyFrame(blockedSurgery), [])

console.log(`Ultimate whole-body runtime verified: ${readiness.nodeCount} canonical nodes across ${readiness.representedSystems.length} systems; source/review boundaries remain fail-closed.`)
