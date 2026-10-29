import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateBodyExposureSync } from '../../src/domains/body-exposure/bodyExposureEnterpriseEngine.ts';

test('Body Exposure Positive Control: Verifies AAA cinematic grade 8K PBR configuration', () => {
  const result = evaluateBodyExposureSync({
    entityId: 'AVATAR-MALE-01',
    meshPolycountTarget: 'ULTRA_AAA',
    subsurfaceScatteringIndex: 0.75,
    pbrTextureResolution: '8K',
    enableDynamicLighting: true
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.graphicsQualityVerdict, 'AAA_CINEMATIC_GRADE');
  assert.equal(result.topologyStatus, 'OPTIMIZED_AUTO_SMOOTH_ACTIVE');
  console.log('✅ Body Exposure Positive Control Passed:', result);
});

test('Body Exposure Negative Control: Flags standard quality when parameters are lowered', () => {
  const result = evaluateBodyExposureSync({
    entityId: 'AVATAR-MALE-02',
    meshPolycountTarget: 'OPTIMIZED_WEB',
    subsurfaceScatteringIndex: 0.1,
    pbrTextureResolution: '2K',
    enableDynamicLighting: false
  });

  assert.equal(result.graphicsQualityVerdict, 'STANDARD');
  assert.equal(result.isClinicallyAuthoritative, false);
  console.log('✅ Body Exposure Negative Control Passed:', result);
});
