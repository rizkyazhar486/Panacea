import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateBodyExposureAdvancedSession } from '../../src/domains/body-exposure-advanced/bodyExposureAdvancedEngine.ts';

test('Body Exposure Advanced Positive Control: Validates cinematic POV and OCR telemetry extraction', () => {
  const result = evaluateBodyExposureAdvancedSession({
    sessionId: 'SESS-01',
    cameraMode: 'CINEMATIC_POV_FIRST_PERSON',
    ocrPayloadText: 'PATIENT_ANATOMICAL_SCAN_ID_8842_ACTIVE',
    targetAnatomicalMeshId: 'MESH_ADULT_MALE_01'
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.cameraPerspective, 'CINEMATIC_POV_FIRST_PERSON');
  assert.equal(result.ocrExtractedMetrics.recognizedDataValid, true);
  assert.equal(result.renderingProfile, 'AAA_WUKONG_RDR_STANDARD');
  console.log('✅ Body Exposure Advanced Positive Control Passed:', result);
});

test('Body Exposure Advanced Negative Control: Handles empty OCR payload gracefully', () => {
  const result = evaluateBodyExposureAdvancedSession({
    sessionId: 'SESS-02',
    cameraMode: 'DYNAMIC_ORBIT_3D',
    ocrPayloadText: '',
    targetAnatomicalMeshId: 'MESH_ADULT_MALE_02'
  });

  assert.equal(result.ocrExtractedMetrics.recognizedDataValid, false);
  assert.equal(result.ocrExtractedMetrics.confidenceScore, 0.400);
  console.log('✅ Body Exposure Advanced Negative Control Passed:', result);
});
