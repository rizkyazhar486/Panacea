import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAaaEmrInteractiveSession } from '../../src/domains/body-exposure-aaa-emr/aaaEmrInteractiveEngine.ts';

test('AAA EMR Positive Control: Validates cinematic POV and human-in-the-loop clinical workflow', () => {
  const result = evaluateAaaEmrInteractiveSession({
    sessionId: 'SESS-AAA-01',
    clinicianId: 'DR-KELVIN-01',
    targetAnatomicalZone: 'CARDIOVASCULAR_ROOT',
    cameraPovMode: 'FIRST_PERSON_SURGICAL',
    proposedClinicalAction: 'ADJUST_ECMO_PERFUSION_FLOW'
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.equal(result.povPerspective, 'FIRST_PERSON_SURGICAL');
  assert.equal(result.humanInTheLoopStatus, 'PENDING_CLINICIAN_AUTHORIZATION');
  assert.equal(result.shaderPipeline, 'WEBGPU_ACCELERATED_PBR');
  console.log('✅ AAA EMR Positive Control Passed:', result);
});

test('AAA EMR Negative Control: Ensures invariant AI non-authoritativeness is strictly maintained', () => {
  const result = evaluateAaaEmrInteractiveSession({
    sessionId: 'SESS-AAA-02',
    clinicianId: 'DR-RIZKY-02',
    targetAnatomicalZone: 'NEURO_VENTRICLE',
    cameraPovMode: 'CINEMATIC_ORBIT',
    proposedClinicalAction: 'EMERGENCY_DECOMPRESSION'
  });

  assert.equal(result.isClinicallyAuthoritative, false);
  console.log('✅ AAA EMR Negative Control Passed:', result);
});
