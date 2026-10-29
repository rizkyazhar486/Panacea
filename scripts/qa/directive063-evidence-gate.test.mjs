import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateBodyExposureEvidence } from '../../src/domains/body-exposure-evidence/bodyExposureEvidenceEngine.ts';

test('Evidence Gate Positive Control: Verifies valid 8K PBR asset with correct SHA-256 hash', () => {
  const result = evaluateBodyExposureEvidence({
    assetId: 'ASSET-MALE-RIG-01',
    meshFileExists: true,
    triangleCount: 150000,
    textureResolution: '8K',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    subsurfaceScatteringVerified: true
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.evidenceStatus, 'VERIFIED_AAA_EVIDENCE_PASSED');
  assert.equal(result.measuredQualityScore, 0.95);
  console.log('✅ Evidence Gate Positive Control Passed:', result);
});

test('Evidence Gate Negative Control: Rejects asset with missing mesh geometry file', () => {
  const result = evaluateBodyExposureEvidence({
    assetId: 'ASSET-MALE-RIG-02',
    meshFileExists: false,
    triangleCount: 0,
    textureResolution: '8K',
    sha256Hash: 'invalidhash',
    subsurfaceScatteringVerified: false
  });

  assert.equal(result.evidenceStatus, 'ARTIFACT_HASH_MISMATCH');
  assert.equal(result.measuredQualityScore, 0.0);
  console.log('✅ Evidence Gate Negative Control Passed:', result);
});
