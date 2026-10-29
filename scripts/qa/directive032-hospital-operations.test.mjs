import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateHospitalResourceCapacity } from '../../src/domains/hospital-operations/hospitalResourceIntelligenceEngine.ts'

test('Hospital Operations Positive Control: Detects critical surge status when ICU capacity is breached', () => {
  const report = evaluateHospitalResourceCapacity({
    hospitalId: 'HOSP-SILOAM-01',
    totalIcuBeds: 20,
    occupiedIcuBeds: 19,
    incomingEmergencyTransfers: 3,
    staffedNurseRatio: 0.5
  });

  assert.equal(report.isClinicallyAuthoritative, false);
  assert.equal(report.operationalStatusColor, 'RED_SURGE_CRITICAL');
  assert.match(report.resourceActionPlan, /CRITICAL SURGE/);
  console.log('✅ Hospital Operations Positive Control Passed:', report);
});

test('Hospital Operations Negative Control: Returns stable status when occupancy is within safe bounds', () => {
  const report = evaluateHospitalResourceCapacity({
    hospitalId: 'HOSP-SILOAM-01',
    totalIcuBeds: 20,
    occupiedIcuBeds: 10,
    incomingEmergencyTransfers: 1,
    staffedNurseRatio: 1.0
  });

  assert.equal(report.operationalStatusColor, 'GREEN_STABLE');
  assert.ok(report.icuOccupancyRatePercent < 75);
  console.log('✅ Hospital Operations Negative Control Passed:', report);
});
