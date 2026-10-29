import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateOutbreakSurveillance } from '../../src/domains/epidemiology-surveillance/outbreakSurveillanceEngine.ts'

test('Outbreak Surveillance Positive Control: Detects critical outbreak warning on respiratory cluster', () => {
  const mockCases = [
    { patientId: 'P-1', facilityLocation: 'Siloam Lippo Village', primarySymptoms: ['Severe respiratory distress', 'Cough'], temperatureCelsius: 39.2 },
    { patientId: 'P-2', facilityLocation: 'Siloam Lippo Village', primarySymptoms: ['Acute respiratory infection', 'Fever'], temperatureCelsius: 38.8 },
    { patientId: 'P-3', facilityLocation: 'Siloam Lippo Village', primarySymptoms: ['Shortness of breath', 'Cough'], temperatureCelsius: 39.0 },
    { patientId: 'P-4', facilityLocation: 'Siloam Lippo Village', primarySymptoms: ['High fever', 'Respiratory congestion'], temperatureCelsius: 38.6 },
    { patientId: 'P-5', facilityLocation: 'Siloam Lippo Village', primarySymptoms: ['Cough', 'Fatigue'], temperatureCelsius: 38.9 }
  ];

  const report = evaluateOutbreakSurveillance(mockCases);

  assert.equal(report.isClinicallyAuthoritative, false);
  assert.equal(report.epidemiologicalRiskLevel, 'OUTBREAK_WARNING_CRITICAL');
  assert.equal(report.fhirDiagnosticReportResource.resourceType, 'DiagnosticReport');
  console.log('✅ Outbreak Positive Control Passed:', report);
});

test('Outbreak Surveillance Negative Control: Returns normal containment when cases are isolated and mild', () => {
  const mockCases = [
    { patientId: 'P-10', facilityLocation: 'Siloam Kelapa Dua', primarySymptoms: ['Mild headache'], temperatureCelsius: 36.8 }
  ];

  const report = evaluateOutbreakSurveillance(mockCases);

  assert.equal(report.epidemiologicalRiskLevel, 'NORMAL_CONTAINED');
  assert.equal(report.fhirDiagnosticReportResource.status, 'preliminary');
  console.log('✅ Outbreak Negative Control Passed:', report);
});
