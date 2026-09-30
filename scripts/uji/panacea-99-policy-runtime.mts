import assert from 'node:assert/strict'
import {
  evaluatePanacea99,
  panacea99AxiomIdsForSurfaces,
  panacea99GeometricMaturity,
} from '../../src/lib/panacea99Policy.ts'

const at = '2026-09-28T07:15:00.000Z'
const evidence = [{ id: 'ci-1', kind: 'test' as const, source: 'stabilization-acceptance', capturedAt: at }]

const unsafeEvaluate = (input: unknown) => evaluatePanacea99(input as Parameters<typeof evaluatePanacea99>[0])

assert.ok(panacea99AxiomIdsForSurfaces(['security']).includes('A06'))
assert.ok(panacea99AxiomIdsForSurfaces(['privacy']).includes('A82'))

const noEvidence = evaluatePanacea99({
  actionId: 'deploy-with-unsupported-hard-pass',
  evaluatedAt: at,
  assessments: [{ axiomId: 'A06', applicability: 'applicable', status: 'pass' }],
})
assert.equal(noEvidence.decision, 'DEFER')
assert.equal(noEvidence.executionGate, 0)
assert.deepEqual(noEvidence.unresolvedHardAxiomIds, ['A06'])

const explicitFailure = evaluatePanacea99({
  actionId: 'unsafe-action',
  evaluatedAt: at,
  assessments: [{ axiomId: 'A15', applicability: 'applicable', status: 'fail', evidence }],
})
assert.equal(explicitFailure.decision, 'BLOCK')
assert.equal(explicitFailure.hardGateProduct, 0)
assert.deepEqual(explicitFailure.failedHardAxiomIds, ['A15'])

const pendingReview = evaluatePanacea99({
  actionId: 'high-risk-clinical-output',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A94',
    applicability: 'applicable',
    status: 'pass',
    evidence,
    humanReviewRequired: true,
    humanReview: { state: 'pending' },
  }],
})
assert.equal(pendingReview.decision, 'ESCALATE')
assert.equal(pendingReview.executionGate, 0)

const rejectedReview = evaluatePanacea99({
  actionId: 'rejected-clinical-output',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A94',
    applicability: 'applicable',
    status: 'pass',
    evidence,
    humanReviewRequired: true,
    humanReview: { state: 'rejected', reviewerId: 'clinician-1', reviewedAt: at },
  }],
})
assert.equal(rejectedReview.decision, 'BLOCK')

const approved = evaluatePanacea99({
  actionId: 'approved-clinical-output',
  evaluatedAt: at,
  assessments: [
    { axiomId: 'A06', applicability: 'applicable', status: 'pass', evidence },
    {
      axiomId: 'A94',
      applicability: 'applicable',
      status: 'pass',
      evidence,
      humanReviewRequired: true,
      humanReview: { state: 'approved', reviewerId: 'clinician-1', reviewedAt: at },
    },
  ],
})
assert.equal(approved.decision, 'ALLOW')
assert.equal(approved.executionGate, 1)
assert.equal(approved.counts.hardPassed, 2)

const advisoryFailure = evaluatePanacea99({
  actionId: 'architecture-advisory',
  evaluatedAt: at,
  assessments: [{ axiomId: 'A08', applicability: 'applicable', status: 'fail', evidence }],
})
assert.equal(advisoryFailure.decision, 'ALLOW')
assert.deepEqual(advisoryFailure.advisoryAxiomIds, ['A08'])

const upgradedHard = evaluatePanacea99({
  actionId: 'architecture-promoted-to-hard',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A08',
    applicability: 'applicable',
    status: 'pass',
    criticalityOverride: 'hard',
  }],
})
assert.equal(upgradedHard.decision, 'DEFER', 'callers may upgrade to hard, but a hard pass still needs evidence')

const unknownApplicability = evaluatePanacea99({
  actionId: 'unknown-security-applicability',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A20',
    applicability: 'unknown',
    status: 'unknown',
    rationale: 'authorization scope has not yet been resolved',
  }],
})
assert.equal(unknownApplicability.decision, 'DEFER')

assert.throws(() => evaluatePanacea99({
  actionId: 'invalid-na',
  evaluatedAt: at,
  assessments: [{ axiomId: 'A06', applicability: 'not-applicable', status: 'unknown' }],
}), /requires rationale/)

assert.throws(() => evaluatePanacea99({
  actionId: 'duplicate',
  evaluatedAt: at,
  assessments: [
    { axiomId: 'A06', applicability: 'applicable', status: 'pass', evidence },
    { axiomId: 'A06', applicability: 'applicable', status: 'pass', evidence },
  ],
}), /duplicate/)

assert.throws(() => evaluatePanacea99({
  actionId: 'unknown-id',
  evaluatedAt: at,
  assessments: [{ axiomId: 'A100', applicability: 'applicable', status: 'pass', evidence }],
}), /unknown 99-Axiom id/)

for (const evaluatedAt of [
  'September 28, 2026 07:15:00 UTC',
  '2026-02-30T07:15:00.000Z',
  '2026-09-28T24:00:00.000Z',
  '2026-09-28T07:15:00.000+14:01',
]) {
  assert.throws(() => unsafeEvaluate({
    actionId: 'invalid-evaluation-time',
    evaluatedAt,
    assessments: [],
  }), /evaluatedAt must be a valid ISO timestamp/, evaluatedAt)
}

assert.equal(evaluatePanacea99({
  actionId: 'maximum-offset-boundary',
  evaluatedAt: '2026-09-28T21:15:00.000+14:00',
  assessments: [],
}).decision, 'ALLOW')

assert.throws(() => unsafeEvaluate({
  actionId: 'invalid-applicability',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A06',
    applicability: 'assumed-applicable',
    status: 'pass',
    evidence,
  }],
}), /applicability is invalid/)

assert.throws(() => unsafeEvaluate({
  actionId: 'invalid-status',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A06',
    applicability: 'applicable',
    status: 'rubber-stamped',
    evidence,
  }],
}), /status is invalid/)

assert.throws(() => unsafeEvaluate({
  actionId: 'invalid-evidence-kind',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A06',
    applicability: 'applicable',
    status: 'pass',
    evidence: [{ id: 'fake-1', kind: 'invented-proof', source: 'untrusted', capturedAt: at }],
  }],
}), /evidence\[0\]\.kind is invalid/)

assert.throws(() => unsafeEvaluate({
  actionId: 'invalid-evidence-time',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A06',
    applicability: 'applicable',
    status: 'pass',
    evidence: [{ id: 'ci-1', kind: 'test', source: 'ci', capturedAt: '2026-02-30T07:15:00.000Z' }],
  }],
}), /evidence\[0\]\.capturedAt must be a valid ISO timestamp/)

assert.throws(() => unsafeEvaluate({
  actionId: 'primitive-human-review',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A94',
    applicability: 'applicable',
    status: 'pass',
    evidence,
    humanReviewRequired: true,
    humanReview: true,
  }],
}), /humanReview must be an object/)

assert.throws(() => unsafeEvaluate({
  actionId: 'invalid-human-review-state',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A94',
    applicability: 'applicable',
    status: 'pass',
    evidence,
    humanReviewRequired: true,
    humanReview: { state: 'rubber-stamped', reviewerId: 'clinician-1', reviewedAt: at },
  }],
}), /humanReview\.state is invalid/)

assert.throws(() => unsafeEvaluate({
  actionId: 'invalid-reviewed-at',
  evaluatedAt: at,
  assessments: [{
    axiomId: 'A94',
    applicability: 'applicable',
    status: 'pass',
    evidence,
    humanReviewRequired: true,
    humanReview: {
      state: 'approved',
      reviewerId: 'clinician-1',
      reviewedAt: '2026-02-30T07:15:00.000Z',
    },
  }],
}), /humanReview\.reviewedAt must be a valid ISO timestamp/)

assert.equal(panacea99GeometricMaturity([
  { axiomId: 'A01', score: 1 },
  { axiomId: 'A02', score: 0.25 },
]), 0.5)
assert.equal(panacea99GeometricMaturity([{ axiomId: 'A01', score: 0 }]), 0)

console.log('99-Axiom policy kernel verified: hard gates fail closed, evidence is mandatory, human review escalates, and advisory failures remain visible.')
