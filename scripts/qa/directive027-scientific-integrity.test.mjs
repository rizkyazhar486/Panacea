import assert from 'node:assert/strict'
import test from 'node:test'
import { auditCtDnaLiquidBiopsyMrd } from '../../src/domains/clinical-governance/scientificIntegrityGuardrail.ts'

test('Scientific Integrity Positive Control: Enforces physician review and blocks automated escalation on ctDNA MRD', () => {
  const result = auditCtDnaLiquidBiopsyMrd({
    patientId: 'PAT-991',
    variantAlleleFraction: 0.008,
    pbmcSequencingPerformed: true,
    assayDepthX: 2500
  });

  assert.equal(result.isAutomatedEscalationPermitted, false);
  assert.equal(result.clinicalInterpretationStatus, 'REQUIRES_PHYSICIAN_REVIEW');
  assert.ok(result.uncertaintyMargin > 0);
  console.log('✅ Scientific Integrity Positive Control Passed:', result);
});

test('Scientific Integrity Negative Control: Rejects unverified CHIP and low depth assays', () => {
  const result = auditCtDnaLiquidBiopsyMrd({
    patientId: 'PAT-992',
    variantAlleleFraction: 0.012,
    pbmcSequencingPerformed: false, // Missing leukocyte control
    assayDepthX: 500
  });

  assert.equal(result.isAutomatedEscalationPermitted, false);
  assert.equal(result.clinicalInterpretationStatus, 'REJECTED_UNVERIFIED_CHIP');
  assert.match(result.auditMessage, /SAFETY LOCK/);
  console.log('✅ Scientific Integrity Negative Control Passed:', result);
});
