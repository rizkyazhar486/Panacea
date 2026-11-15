import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHrvRmssd,
  calculateStrainScore,
  calculateAutonomicRecovery,
  generateImitationWearableStream,
  bridgeAndTranslateWearableData,
  interpretWearableHealthWithAi
} from '../../src/domains/personal-health/engine/universalBluetoothWearablesImitationEngine.ts';

test('1. [RMSSD & STRAIN FORMULAS] Mathematical Precision & Boundary Correctness', () => {
  // Test RMSSD with known series: differences = [-10, 20, -10] -> sq = [100, 400, 100] -> mean = 200 -> sqrt = ~14.14
  const rmssd = calculateHrvRmssd([950, 940, 960, 950]);
  assert.equal(rmssd, 14.14);

  // Test RMSSD fallback with single or empty point
  assert.equal(calculateHrvRmssd([900]), 42.0);
  assert.equal(calculateHrvRmssd([]), 42.0);

  // Test Day Strain (0.0 to 21.0)
  const zeroStrain = calculateStrainScore({ averageHrBpm: 60, restingHrBpm: 60, maxHrBpm: 190, durationMinutes: 0 });
  assert.equal(zeroStrain, 0.0);

  const workoutStrain = calculateStrainScore({ averageHrBpm: 155, restingHrBpm: 55, maxHrBpm: 190, durationMinutes: 60 });
  assert.ok(workoutStrain >= 12.0 && workoutStrain <= 19.0);
});

test('2. [WHOOP SHENZHEN IMITATION] Generates Physiologically Coupled Telemetry Stream', () => {
  const whoopStream = generateImitationWearableStream({
    deviceModel: 'WHOOP_SHENZHEN_BAND',
    scenario: 'RESTING_MORNING'
  });

  assert.equal(whoopStream.deviceModel, 'WHOOP_SHENZHEN_BAND');
  assert.equal(whoopStream.truthClass, 'SIMULATED_IMITATION');
  assert.equal(whoopStream.recoveryZone, 'OPTIMAL_GREEN');
  assert.ok(whoopStream.recoveryPercent0to100 >= 67);
  assert.ok(whoopStream.provenanceDigestSha256.length === 64);
  assert.equal(whoopStream.batteryPercent, 88);
});

test('3. [CROSS-DEVICE HARDWARE BRIDGE] Translates Shenzhen Whoop to qWatch Pro Format', () => {
  const whoopData = generateImitationWearableStream({
    deviceModel: 'WHOOP_SHENZHEN_BAND',
    scenario: 'INTENSE_CARDIO'
  });

  const bridge = bridgeAndTranslateWearableData(whoopData, 'QWATCH_PRO_SMARTWATCH');

  assert.equal(bridge.sourceDevice, 'WHOOP_SHENZHEN_BAND');
  assert.equal(bridge.targetDevice, 'QWATCH_PRO_SMARTWATCH');
  assert.equal(bridge.qWatchProCompatibleStream.syncStatus, 'STREAM_ACTIVE_SYNCHRONIZED');
  assert.equal(bridge.qWatchProCompatibleStream.heartRateBpm, 168);
  assert.equal(bridge.qWatchProCompatibleStream.strainScore, 16.4);
  assert.ok(bridge.bridgeSha256Seal.length === 64);
});

test('4. [AI HEALTH INTERPRETATION] Generates Multi-Tier Insights with Epistemic Guard', () => {
  const restingStream = generateImitationWearableStream({
    deviceModel: 'QWATCH_PRO_SMARTWATCH',
    scenario: 'RESTING_MORNING'
  });

  const aiAnalysis = interpretWearableHealthWithAi(restingStream);

  assert.equal(aiAnalysis.clinicallyReviewed, false);
  assert.equal(aiAnalysis.requiresHumanPhysicianSignoff, true);
  assert.equal(aiAnalysis.truthClass, 'SIMULATED_IMITATION');
  assert.ok(aiAnalysis.summaryLayperson.includes('Pemulihan harian Anda'));
  assert.equal(aiAnalysis.athleticCoachAdvice.workoutZoneRecommendation, 'ZONE_4_5_HIGH_INTENSITY');
  assert.equal(aiAnalysis.athleticCoachAdvice.classPassOrSportDropinEligible, true);
});

test('5. [EARLY FEVER ILLNESS DETECTION] Flags Elevated Resting HR & Skin Temp Deviation', () => {
  const feverStream = generateImitationWearableStream({
    deviceModel: 'WHOOP_SHENZHEN_BAND',
    scenario: 'EARLY_FEVER_ILLNESS'
  });

  const aiAnalysis = interpretWearableHealthWithAi(feverStream);

  assert.equal(aiAnalysis.clinicalFindings.possibleEarlyImmuneReaction, true);
  assert.ok(aiAnalysis.clinicalFindings.restingHrDeltaBpm >= 8);
  assert.ok(aiAnalysis.summaryLayperson.includes('kenaikan suhu kulit'));
});
