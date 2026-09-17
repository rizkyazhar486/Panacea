import assert from 'node:assert/strict'
import { evaluateBodyExposureQualityGate } from '../../src/lib/bodyExposureQualityGate.ts'

const anatomy = {
  reviewerId: 'reviewer-opaque',
  credentials: 'qualified anatomy reviewer',
  reviewedAt: '2026-09-17T00:00:00.000Z',
  scope: 'declared whole-body target set',
  totalStructures: 100,
  reviewedStructures: 100,
  acceptedStructures: 95,
  unresolvedMajorFindings: 0,
  sourceReferenceIds: ['source-1'],
}

const pass = evaluateBodyExposureQualityGate({
  quality: {
    visualIntegrity: 0.92,
    interactionCompleteness: 0.9,
    provenanceCompleteness: 0.96,
    performanceAcceptance: 0.88,
    accessibilityAcceptance: 0.9,
    mobileFluidLayoutPass: true,
    reducedMotionPass: true,
    featurePreservationPass: true,
  },
  anatomyReview: anatomy,
})
assert.ok(pass.q >= 0.88)
assert.equal(pass.anatomy.accuracyFraction, 0.95)
assert.equal(pass.qualityPass, true)
assert.equal(pass.overallPass, true)

const anatomyFail = evaluateBodyExposureQualityGate({
  quality: {
    visualIntegrity: 1,
    interactionCompleteness: 1,
    provenanceCompleteness: 1,
    performanceAcceptance: 1,
    accessibilityAcceptance: 1,
    mobileFluidLayoutPass: true,
    reducedMotionPass: true,
    featurePreservationPass: true,
  },
  anatomyReview: { ...anatomy, acceptedStructures: 91 },
})
assert.equal(anatomyFail.q, 1)
assert.equal(anatomyFail.qualityPass, true)
assert.equal(anatomyFail.anatomy.pass, false)
assert.equal(anatomyFail.overallPass, false)
assert.equal(anatomyFail.boundary.qCannotCompensateForAnatomyFailure, true)

const qualityFail = evaluateBodyExposureQualityGate({
  quality: {
    visualIntegrity: 0.8,
    interactionCompleteness: 0.8,
    provenanceCompleteness: 0.8,
    performanceAcceptance: 0.8,
    accessibilityAcceptance: 0.8,
    mobileFluidLayoutPass: false,
    reducedMotionPass: true,
    featurePreservationPass: true,
  },
  anatomyReview: anatomy,
})
assert.equal(qualityFail.qualityPass, false)
assert.equal(qualityFail.overallPass, false)

console.log('Body Exposure quality gate verified: Q>=0.88 and qualified anatomical accuracy>=0.92 are independent mandatory gates; visual polish cannot compensate for anatomy failure.')
