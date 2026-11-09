import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateCanonicalInsuranceClaim } from '../../src/domains/insurance-engine/canonicalInsuranceEngine.ts'

test('Insurance Positive Control: Approves active canonical multi-sector claim', () => {
  const result = evaluateCanonicalInsuranceClaim({
    patientId: 'PAT-INS-01',
    payerCategory: 'BPJS_KESEHATAN',
    policyNumber: 'BPJS-000889911',
    isContributionActive: true,
    estimatedClaimAmountIdr: 4500000,
    requiredPriorApproval: false,
    priorApprovalObtained: false
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.claimEligibilityStatus, 'APPROVED_CANONICAL');
  assert.equal(result.reimbursableAmountIdr, 4500000);
  console.log('✅ Insurance Positive Control Passed:', result);
});

test('Insurance Negative Control: Rejects claim when policy contribution is inactive', () => {
  const result = evaluateCanonicalInsuranceClaim({
    patientId: 'PAT-INS-02',
    payerCategory: 'COMMERCIAL_PRIVATE',
    policyNumber: 'COMM-999222333',
    isContributionActive: false, // Inactive policy
    estimatedClaimAmountIdr: 12000000,
    requiredPriorApproval: true,
    priorApprovalObtained: false
  });

  assert.equal(result.claimEligibilityStatus, 'REJECTED_INACTIVE_POLICY');
  assert.equal(result.reimbursableAmountIdr, 0);
  console.log('✅ Insurance Negative Control Passed:', result);
});
