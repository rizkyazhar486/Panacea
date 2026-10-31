import assert from 'node:assert/strict'
import test from 'node:test'
import { simulatePatientTrajectory } from '../../src/domains/digital-twin/digitalTwinTrajectoryEngine.ts'

test('Digital Twin Positive Control: Evaluates aggressive pharmacotherapy trajectory reduction', () => {
  const result = simulatePatientTrajectory(
    {
      patientId: 'PAT-DT-01',
      age: 55,
      baselineBmi: 28.5,
      hba1cPercent: 8.2,
      ldlCholesterolMgDl: 160,
      smokingStatus: true
    },
    { interventionType: 'PHARMACOTHERAPY_AGGRESSIVE', durationYears: 5 }
  );

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.ok(result.projectedCardiovascularRiskScore > 0);
  assert.ok(result.projectedHba1c5Years < 8.2);
  console.log('✅ Digital Twin Positive Control Passed:', result);
});

test('Digital Twin Negative Control: Flags high risk trajectory under unmitigated baseline profile', () => {
  const result = simulatePatientTrajectory(
    {
      patientId: 'PAT-DT-02',
      age: 68,
      baselineBmi: 32.0,
      hba1cPercent: 9.5,
      ldlCholesterolMgDl: 190,
      smokingStatus: true
    },
    { interventionType: 'STANDARD_CARE', durationYears: 5 }
  );

  assert.equal(result.isClinicallyAuthoritative, false);
  assert.match(result.recommendedAction, /High cardiovascular trajectory risk/);
  console.log('✅ Digital Twin Negative Control Passed:', result);
});
