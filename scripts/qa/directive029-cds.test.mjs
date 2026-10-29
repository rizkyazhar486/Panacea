import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateClinicalDecisionSupport } from '../../src/domains/clinical-decision-support/cdsInteroperabilityEngine.ts'

test('CDS Engine Positive Control: Detects critical drug-drug interaction and generates FHIR issue resource', () => {
  const alerts = evaluateClinicalDecisionSupport({
    patientId: 'PAT-CDS-01',
    age: 64,
    activeConditions: ['Hypertension', 'Heart Failure'],
    currentMedications: [
      { medicationCode: 'MED-01', medicationName: 'Lisinopril 10mg', dosage: '10mg', route: 'Oral' },
      { medicationCode: 'MED-02', medicationName: 'Spironolactone 25mg', dosage: '25mg', route: 'Oral' }
    ],
    recentLabResults: [{ testName: 'Serum Creatinine', value: 1.1, unit: 'mg/dL' }]
  });

  const criticalAlert = alerts.find(a => a.severity === 'CRITICAL_SAFETY_WARNING');
  assert.ok(criticalAlert);
  assert.equal(criticalAlert.isClinicallyAuthoritative, false);
  assert.equal(criticalAlert.fhirResourceGenerated.resourceType, 'DetectedIssue');
  console.log('✅ CDS Positive Control Passed:', criticalAlert);
});

test('CDS Engine Negative Control: Returns normal status when no medication hazards exist', () => {
  const alerts = evaluateClinicalDecisionSupport({
    patientId: 'PAT-CDS-02',
    age: 30,
    activeConditions: ['Routine Checkup'],
    currentMedications: [
      { medicationCode: 'MED-99', medicationName: 'Multivitamin', dosage: '1 tab', route: 'Oral' }
    ],
    recentLabResults: [{ testName: 'Serum Creatinine', value: 0.8, unit: 'mg/dL' }]
  });

  assert.equal(alerts[0].severity, 'INFO');
  assert.equal(alerts[0].fhirResourceGenerated.status, 'entered-in-error');
  console.log('✅ CDS Negative Control Passed:', alerts[0]);
});
