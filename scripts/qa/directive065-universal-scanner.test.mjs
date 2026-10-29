import assert from 'node:assert/strict';
import test from 'node:test';
import { synthesizeUniversalDigitalTwin } from '../../src/domains/universal-scanner-twin/universalScannerTwinEngine.ts';

test('Universal Scanner Positive Control: Synthesizes 1:1 digital twin from advanced quantum scan data', () => {
  const result = synthesizeUniversalDigitalTwin({
    scanId: 'SCAN-Q-01',
    modality: 'QUANTUM_MRI_3T_7T',
    spatialResolutionMicrons: 50,
    rawSignalTensorData: [0.99, 0.85, 0.92, 0.97],
    userBiometricCalibrationHash: 'sha256-user-kelvin-bio-v1'
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.digitalTwinFidelityRatio, '1:1 Absolute Structural Parity');
  assert.equal(result.anatomicalMappingStatus, 'SYNTHESIS_SUCCESSFUL_1_TO_1');
  console.log('✅ Universal Scanner Positive Control Passed:', result);
});

test('Universal Scanner Negative Control: Flags pending calibration on empty sensor stream', () => {
  const result = synthesizeUniversalDigitalTwin({
    scanId: 'SCAN-EMPTY-02',
    modality: 'FUTURE_OMNI_QUANTUM_SCANNER',
    spatialResolutionMicrons: 10,
    rawSignalTensorData: [],
    userBiometricCalibrationHash: 'uncalibrated'
  });

  assert.equal(result.anatomicalMappingStatus, 'CALIBRATION_PENDING');
  assert.equal(result.isClinicallyAuthoritative, false);
  console.log('✅ Universal Scanner Negative Control Passed:', result);
});
