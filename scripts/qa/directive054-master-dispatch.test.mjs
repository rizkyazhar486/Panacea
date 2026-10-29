import assert from 'node:assert/strict';
import test from 'node:test';
import { dispatchMasterClinicalRequest } from '../../src/kernel/masterClinicalDispatcher.ts';

test('Master Dispatcher Positive Control: Successfully routes and evaluates multi-specialty request', () => {
  const result = dispatchMasterClinicalRequest({
    dispatchId: 'DISP-001',
    targetSpecialty: 'cardiology',
    patientId: 'PAT-MASTER-01',
    primaryMetricValue: 140
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.status, 'DISPATCH_SUCCESS');
  assert.equal(result.targetSpecialty, 'cardiology');
  assert.ok(result.evaluatedOutput.metricProcessed > 0);
  console.log('✅ Master Dispatcher Positive Control Passed:', result);
});

test('Master Dispatcher Negative Control: Blocks malformed payload with fail-closed safety', () => {
  const result = dispatchMasterClinicalRequest({
    dispatchId: '',
    targetSpecialty: '',
    patientId: '',
    primaryMetricValue: 0
  });

  assert.equal(result.status, 'SAFETY_VIOLATION_BLOCKED');
  assert.equal(result.isClinicallyAuthoritative, false);
  console.log('✅ Master Dispatcher Negative Control Passed:', result);
});
