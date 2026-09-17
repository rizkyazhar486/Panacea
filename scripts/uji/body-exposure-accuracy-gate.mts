import assert from 'node:assert/strict'
import {
  auditWholeBodyGeometryProvenance,
  evaluateAnatomyAccuracyGate,
} from '../../src/lib/bodyExposureAccuracyGate.ts'

const provenance = auditWholeBodyGeometryProvenance()
assert.ok(provenance.total > 0)
assert.equal(provenance.total, provenance.native + provenance.adjacent + provenance.notRepresented)
assert.ok(provenance.representationScore >= 0 && provenance.representationScore <= 1)
assert.equal(provenance.boundary.representationScoreIsNotAnatomicalAccuracy, true)

const insufficient = evaluateAnatomyAccuracyGate({
  reviewerId: '', credentials: '', reviewedAt: '2026-09-17T00:00:00.000Z', scope: '',
  totalStructures: 100, reviewedStructures: 50, acceptedStructures: 50, unresolvedMajorFindings: 0, sourceReferenceIds: [],
})
assert.equal(insufficient.pass, false)
assert.ok(insufficient.reasons.length >= 3)

const reviewedButBelow = evaluateAnatomyAccuracyGate({
  reviewerId: 'reviewer-opaque', credentials: 'qualified anatomy reviewer', reviewedAt: '2026-09-17T00:00:00.000Z', scope: 'declared whole-body target set',
  totalStructures: 100, reviewedStructures: 100, acceptedStructures: 91, unresolvedMajorFindings: 0, sourceReferenceIds: ['source-1'],
})
assert.equal(reviewedButBelow.accuracyFraction, 0.91)
assert.equal(reviewedButBelow.pass, false)

const gold = evaluateAnatomyAccuracyGate({
  reviewerId: 'reviewer-opaque', credentials: 'qualified anatomy reviewer', reviewedAt: '2026-09-17T00:00:00.000Z', scope: 'declared whole-body target set',
  totalStructures: 100, reviewedStructures: 100, acceptedStructures: 96, unresolvedMajorFindings: 0, sourceReferenceIds: ['source-1','source-2'],
})
assert.equal(gold.accuracyFraction, 0.96)
assert.equal(gold.reviewCoverageFraction, 1)
assert.equal(gold.pass, true)

console.log('Body Exposure accuracy gate verified: geometry representation is never mislabeled as accuracy, and >=0.92 requires qualified full-scope source-backed human review with no unresolved major findings.')
