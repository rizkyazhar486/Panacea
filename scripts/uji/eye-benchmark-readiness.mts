import assert from 'node:assert/strict'
import type { AtlasManifest, AtlasNode } from '../../src/lib/anatomy/atlasKernel.ts'
import {
  EYE_BENCHMARK_WEIGHTS,
  evaluateEyeBenchmarkReadiness,
  type EyeBenchmarkEvidence,
} from '../../src/lib/anatomy/eyeBenchmarkReadiness.ts'

const reviewedProvenance = {
  sourceId: 'test-source',
  sourceRevision: 'rev-2026-09-09',
  license: 'test-license',
  sourceLocator: 'test://eye-organ',
  reviewStatus: 'academic-reviewed' as const,
  reviewerScope: 'Synthetic test fixture only',
}

function eyeNode(overrides: Partial<AtlasNode> = {}): AtlasNode {
  return {
    id: 'organ:eye',
    label: 'Eye',
    system: 'sensory',
    regions: ['head'],
    laterality: 'paired',
    scale: 'organ',
    source: { nodeHints: ['eye'], mode: 'specific-fallback' },
    provenance: reviewedProvenance,
    geometryStatus: 'shipped',
    educationalPriority: 1,
    physiologyCapable: true,
    ...overrides,
  }
}

function manifest(node: AtlasNode): AtlasManifest {
  return { id: 'eye-benchmark-test', revision: 'test-1', nodes: [node] }
}

function evidence(overrides: Partial<EyeBenchmarkEvidence> = {}): EyeBenchmarkEvidence {
  return {
    anatomy: { state: 'verified', score: 96, evidenceRefs: ['repo://anatomy-fixture'], patientSpecific: false },
    clinicalCorrelation: { state: 'verified', score: 92, evidenceRefs: ['repo://clinical-fixture'], patientSpecific: false },
    interaction: { state: 'verified', score: 94, evidenceRefs: ['repo://interaction-fixture'], patientSpecific: false },
    physiology: { state: 'verified', score: 90, evidenceRefs: ['repo://physiology-fixture'], patientSpecific: false },
    safety: { state: 'verified', score: 100, evidenceRefs: ['repo://safety-fixture'], patientSpecific: false },
    performance: { state: 'verified', score: 88, evidenceRefs: ['repo://performance-fixture'], patientSpecific: false },
    evidence: { state: 'verified', score: 95, evidenceRefs: ['repo://evidence-fixture'], patientSpecific: false },
    ...overrides,
  }
}

assert.equal(
  Object.values(EYE_BENCHMARK_WEIGHTS).reduce((sum, weight) => sum + weight, 0),
  1,
  'Q_eye weights must sum to 1',
)

const eligible = evaluateEyeBenchmarkReadiness({
  manifest: manifest(eyeNode()),
  eyeNodeId: 'organ:eye',
  evidence: evidence(),
})
assert.equal(eligible.status, 'eligible')
assert.equal(eligible.score, 94.25)
assert.equal(eligible.mayOverrideGlobalMaturationGate, false)
assert.deepEqual(eligible.blockers, [])
assert.deepEqual(eligible.gaps, [])

const referenceOnly = evaluateEyeBenchmarkReadiness({
  manifest: manifest(eyeNode({ geometryStatus: 'reference-only' })),
  eyeNodeId: 'organ:eye',
  evidence: evidence(),
})
assert.equal(referenceOnly.status, 'blocked')
assert.equal(referenceOnly.score, null)
assert.ok(referenceOnly.blockers.some((blocker) => blocker.code === 'geometry-not-shipped'))

const reviewPending = evaluateEyeBenchmarkReadiness({
  manifest: manifest(eyeNode({
    provenance: { ...reviewedProvenance, reviewStatus: 'academic-review-required' },
  })),
  eyeNodeId: 'organ:eye',
  evidence: evidence(),
})
assert.equal(reviewPending.status, 'blocked')
assert.equal(reviewPending.score, null)
assert.ok(reviewPending.blockers.some((blocker) => blocker.code === 'academic-review-incomplete'))

const partialGeometry = evaluateEyeBenchmarkReadiness({
  manifest: manifest(eyeNode({ geometryStatus: 'partial' })),
  eyeNodeId: 'organ:eye',
  evidence: evidence(),
})
assert.equal(partialGeometry.status, 'partial')
assert.equal(partialGeometry.score, null)
assert.ok(partialGeometry.gaps.some((gap) => gap.code === 'geometry-partial'))

const missingPhysiologyEvidence = evaluateEyeBenchmarkReadiness({
  manifest: manifest(eyeNode()),
  eyeNodeId: 'organ:eye',
  evidence: evidence({
    physiology: { state: 'missing', evidenceRefs: [], patientSpecific: false },
  }),
})
assert.equal(missingPhysiologyEvidence.status, 'partial')
assert.equal(missingPhysiologyEvidence.score, null)
assert.ok(missingPhysiologyEvidence.gaps.some((gap) => gap.dimension === 'physiology' && gap.code === 'not-verified'))
assert.ok(missingPhysiologyEvidence.gaps.some((gap) => gap.dimension === 'physiology' && gap.code === 'missing-evidence-ref'))
assert.ok(missingPhysiologyEvidence.gaps.some((gap) => gap.dimension === 'physiology' && gap.code === 'invalid-score'))

const patientSpecific = evaluateEyeBenchmarkReadiness({
  manifest: manifest(eyeNode()),
  eyeNodeId: 'organ:eye',
  evidence: evidence({
    clinicalCorrelation: {
      state: 'verified',
      score: 92,
      evidenceRefs: ['repo://clinical-fixture'],
      patientSpecific: true,
    },
  }),
})
assert.equal(patientSpecific.status, 'blocked')
assert.equal(patientSpecific.score, null)
assert.ok(patientSpecific.blockers.some((blocker) => blocker.code === 'patient-specific-evidence'))

const invalidProvenance = evaluateEyeBenchmarkReadiness({
  manifest: manifest(eyeNode({
    provenance: { ...reviewedProvenance, sourceRevision: 'latest' },
  })),
  eyeNodeId: 'organ:eye',
  evidence: evidence(),
})
assert.equal(invalidProvenance.status, 'blocked')
assert.equal(invalidProvenance.score, null)
assert.ok(invalidProvenance.blockers.some((blocker) => blocker.code === 'manifest-invalid'))

console.log('eye-benchmark-readiness: ok (fail-closed score, geometry, provenance, academic-review and patient-specific guards)')
