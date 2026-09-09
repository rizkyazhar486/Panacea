import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { validateAtlasManifest } from '../../src/lib/anatomy/atlasKernel.ts'
import {
  WHOLE_BODY_DEEP_EXPANSION_WAVE_1,
  validateWholeBodyDeepExpansionWave1,
} from '../../src/lib/anatomy/wholeBodyDeepExpansionWave1.ts'
import {
  compileAtlasWorldFrame,
  validateAtlasWorldFrame,
} from '../../src/lib/anatomy/atlasWorldFrameCompiler.ts'

const budget = {
  triangleBudget: 12_000_000,
  textureBudgetMegabytes: 2_048,
  nodeBudget: 512,
  devicePixelRatio: 2,
  viewportWidth: 1440,
  viewportHeight: 1000,
  maxConcurrentLoads: 512,
  cacheTriangleBudget: 20_000_000,
  cacheTextureBudgetMegabytes: 4_096,
  minimumResidencyMs: 15_000,
} as const

const telemetry = {
  nowMs: 100_000,
  medianFrameTimeMs: 11,
  targetFrameTimeMs: 16.67,
  interactionVelocity: 0.05,
} as const

const residency = { assets: [] as const }

assert.ok(WHOLE_BODY_DEEP_EXPANSION_WAVE_1.length >= 70, 'Deep wave must materially expand whole-body identity coverage.')
assert.deepEqual(validateWholeBodyDeepExpansionWave1(), [])

const representedSystems = new Set(WHOLE_BODY_DEEP_EXPANSION_WAVE_1.map((node) => node.system))
assert.equal(representedSystems.size, 14, 'Deep wave must cover all 14 atlas systems.')

const deepManifestIssues = validateAtlasManifest(COMPLETE_WHOLE_BODY_ATLAS)
  .filter((issue) => issue.nodeId?.startsWith('deep:'))
assert.deepEqual(deepManifestIssues, [], 'Deep expansion must not introduce invalid hierarchy/provenance/LOD nodes.')

const ids = new Set(COMPLETE_WHOLE_BODY_ATLAS.nodes.map((node) => node.id))
for (const required of [
  'deep:vertebral-column',
  'deep:left-ventricle',
  'deep:sciatic-nerve',
  'deep:alveolar-sac',
  'deep:glomerular-filtration-barrier',
  'deep:pancreatic-islet',
  'deep:uterus',
  'deep:cochlear-vestibular-labyrinth',
  'deep:thoracolumbar-fascia',
]) {
  assert.ok(ids.has(required), `Canonical complete atlas must contain ${required}.`)
}

const wholeBody = compileAtlasWorldFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  intent: { mode: 'whole-body', contextOpacity: 0.2 },
  budget,
  telemetry,
  residency,
})
assert.equal(wholeBody.manifestRevision, '2026-09-09-r4-deep-world-foundation')
assert.ok(wholeBody.renderLayers.length > 0, 'Whole-body frame must produce renderable source-bound layers.')
assert.ok(wholeBody.metadataReferences.length > 0, 'Whole-body frame must retain unshipped deep identities as metadata.')
assert.ok(wholeBody.metadataReferences.some((item) => item.nodeId === 'deep:sciatic-nerve'))
assert.equal(wholeBody.renderLayers.some((layer) => layer.nodeId === 'deep:sciatic-nerve'), false)
assert.equal(wholeBody.renderLayers.some((layer) => layer.geometryStatus === 'reference-only' || layer.geometryStatus === 'planned'), false)
assert.deepEqual(validateAtlasWorldFrame(wholeBody), [])

const deepReference = compileAtlasWorldFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  intent: {
    mode: 'microstructure',
    selectedNodeId: 'deep:glomerular-filtration-barrier',
    systems: ['urinary'],
    regions: ['abdomen', 'back'],
  },
  budget,
  telemetry,
  residency,
  projectedPixelsByNodeId: { 'deep:glomerular-filtration-barrier': 900 },
})
assert.equal(deepReference.selectedNodeId, 'deep:glomerular-filtration-barrier')
assert.ok(deepReference.metadataReferences.some((item) => item.nodeId === 'deep:glomerular-filtration-barrier'))
assert.equal(deepReference.renderLayers.some((layer) => layer.nodeId === 'deep:glomerular-filtration-barrier'), false)
assert.deepEqual(validateAtlasWorldFrame(deepReference), [])

const surgeryGate = compileAtlasWorldFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  intent: { mode: 'surgery-reference', selectedNodeId: 'cv:heart', systems: ['cardiovascular'] },
  budget,
  telemetry,
  residency,
})
assert.equal(surgeryGate.publicationGate.patientSpecificGeometryAllowed, false)
assert.equal(surgeryGate.publicationGate.surgicalReferenceAllowed, false)
assert.ok(surgeryGate.publicationGate.blockingReasons.some((reason) => reason.includes('academic review')))
assert.deepEqual(validateAtlasWorldFrame(surgeryGate), [])

const noSyntheticPath = compileAtlasWorldFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  intent: {
    mode: 'cross-system-path',
    selectedNodeId: 'cv:heart',
    targetNodeId: 'not:a-real-atlas-node',
  },
  budget,
  telemetry,
  residency,
})
assert.equal(noSyntheticPath.path, undefined)
assert.ok(noSyntheticPath.warnings.some((warning) => warning.includes('no synthetic relationship was inferred')))
assert.deepEqual(validateAtlasWorldFrame(noSyntheticPath), [])

const respiratory = compileAtlasWorldFrame({
  manifest: COMPLETE_WHOLE_BODY_ATLAS,
  intent: {
    mode: 'system-isolation',
    systems: ['respiratory'],
    regions: ['head', 'neck', 'thorax'],
    respiratory: {
      phase: 'inspiration',
      segmentNodeId: 'resp:segment:r-s1',
      overlays: ['airflow', 'gas-exchange'],
    },
  },
  budget,
  telemetry,
  residency,
})
assert.ok(respiratory.respiratory)
assert.equal(respiratory.respiratory?.phase.modelStatus, 'qualitative-reference')
assert.equal(respiratory.respiratory?.conceptualOverlays.find((overlay) => overlay.id === 'airflow')?.quantitative, false)
assert.equal(respiratory.publicationGate.patientSpecificGeometryAllowed, false)
assert.ok(respiratory.warnings.some((warning) => warning.includes('not a patient-specific bronchoscopy map')))

console.log(`High-end atlas world compiler verified: ${COMPLETE_WHOLE_BODY_ATLAS.nodes.length} canonical nodes, ${WHOLE_BODY_DEEP_EXPANSION_WAVE_1.length} deep-wave identities, 14 systems, fail-closed geometry/review boundaries.`)
