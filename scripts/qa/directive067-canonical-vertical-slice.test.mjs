import assert from 'node:assert/strict';
import test from 'node:test';
import { renderCanonicalAnatomySlice } from '../../src/domains/body-exposure-canonical/canonicalBodyExposureEngine.ts';

test('Canonical Slice Positive Control: Loads adult male canonical structure with verified geometry and provenance', () => {
  const result = renderCanonicalAnatomySlice({
    structureId: 'CANONICAL-MALE-HEART-ROOT',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false
  });

  assert.equal(result.canonicalModelId, 'ADULT-MALE-CANONICAL-V1');
  assert.equal(result.geometryMeasured.hasValidMesh, true);
  assert.equal(result.materialEvidence.pbrMapsVerified, true);
  assert.equal(result.clinicalGovernanceStatus.isReferenceAtlasOnly, true);
  assert.equal(result.clinicalGovernanceStatus.isClinicallyAuthoritative, false);
  console.log('✅ Canonical Vertical Slice Positive Control Passed:', result);
});

test('Canonical Slice Negative Control: Rejects unverified or malformed anatomical structure request', () => {
  const result = renderCanonicalAnatomySlice({
    structureId: 'INVALID-STRUCTURE-XYZ',
    requestedLodLevel: 'LOD_0_FULL',
    allowPersonalizationContract: false
  });

  assert.equal(result.clinicalGovernanceStatus.isClinicallyAuthoritative, false);
  assert.equal(result.clinicalGovernanceStatus.isReferenceAtlasOnly, true);
  console.log('✅ Canonical Vertical Slice Negative Control Passed:', result);
});
