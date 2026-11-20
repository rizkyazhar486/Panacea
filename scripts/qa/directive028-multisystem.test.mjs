import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateMultisystemHarmonization } from '../../src/domains/multisystem-physiology/multisystemHarmonizationKernel.ts'

test('Multisystem Positive Control: Evaluates stable neuro-cardio-renal homeostasis', () => {
  const state = evaluateMultisystemHarmonization({
    patientId: 'PAT-MS-01',
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 72,
    serumCreatinineMgDl: 0.9,
    sympatheticToneIndex: 0.2
  });

  assert.equal(state.isClinicallyAuthoritative, false);
  assert.equal(state.regulatoryHomeostasisStatus, 'STABLE_HOMEOSTASIS');
  assert.ok(state.meanArterialPressure > 90);
  console.log('✅ Multisystem Positive Control Passed:', state);
});

test('Multisystem Negative Control: Detects autonomic and renal stress under high sympathetic tone', () => {
  const state = evaluateMultisystemHarmonization({
    patientId: 'PAT-MS-02',
    systolicBp: 170,
    diastolicBp: 105,
    heartRate: 115,
    serumCreatinineMgDl: 2.4,
    sympatheticToneIndex: 0.85
  });

  assert.equal(state.isClinicallyAuthoritative, false);
  assert.equal(state.regulatoryHomeostasisStatus, 'AUTONOMIC_FAILURE_RISK');
  assert.match(state.regulatoryHomeostasisStatus, /AUTONOMIC_FAILURE_RISK/);
  console.log('✅ Multisystem Negative Control Passed:', state);
});
