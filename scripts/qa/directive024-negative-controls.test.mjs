import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateTruthfulReadiness } from '../../src/domains/master/panaceaMasterKernel.ts'

test('Negative Control: Missing evidence fails readiness certification', () => {
  const incompleteEvidence = {
    dependencyResolutionValid: true,
    ciStatusPassing: false, // Gagal CI
    productionBuildSuccessful: true,
    clinicalSafetyContractVerified: false, // Gagal bukti klinis
    securityControlsAudited: true,
    accessibilityWCAGPassed: false
  };

  const assessment = evaluateTruthfulReadiness(incompleteEvidence);
  
  assert.notEqual(assessment.readinessStatus, 'VERIFIED_READY');
  assert.ok(assessment.evidenceScore < 10.0);
  assert.ok(assessment.missingEvidenceItems.length > 0);
  console.log('✅ Negative Control Verified - Incomplete evidence correctly rejected:', assessment);
})
