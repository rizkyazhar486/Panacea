import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluatePharmacovigilanceSurveillance } from '../../src/domains/pharmacovigilance/pharmacovigilanceSurveillanceEngine.ts'

test('Pharmacovigilance Positive Control: Detects severe ADE warning on anticoagulant + NSAID + bleeding symptom', () => {
  const report = evaluatePharmacovigilanceSurveillance({
    patientId: 'PAT-PV-01',
    age: 67,
    medications: ['Warfarin 5mg', 'Ibuprofen 400mg'],
    recentLabs: [{ testName: 'Hemoglobin', value: 10.2, unit: 'g/dL' }],
    reportedSymptoms: ['Easy bruising and dark stools (melena)']
  });

  assert.equal(report.isClinicallyAuthoritative, false);
  assert.equal(report.riskLevel, 'HIGH_ADE_WARNING');
  assert.equal(report.fhirAdverseEventResource.resourceType, 'AdverseEvent');
  console.log('✅ Pharmacovigilance Positive Control Passed:', report);
});

test('Pharmacovigilance Negative Control: Returns low risk when no hazardous drug synergy exists', () => {
  const report = evaluatePharmacovigilanceSurveillance({
    patientId: 'PAT-PV-02',
    age: 45,
    medications: ['Metformin 500mg'],
    recentLabs: [{ testName: 'HbA1c', value: 6.8, unit: '%' }],
    reportedSymptoms: ['None']
  });

  assert.equal(report.riskLevel, 'LOW');
  assert.equal(report.fhirAdverseEventResource.severity, 'mild');
  console.log('✅ Pharmacovigilance Negative Control Passed:', report);
});
