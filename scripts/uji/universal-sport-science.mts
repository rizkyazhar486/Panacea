import { strict as assert } from 'node:assert';
import {
  computeBanisterFitnessFatigue,
  evaluateAutonomicVagalRecovery,
  computeSubstrateCrossover,
  SPORT_SCIENCE_CITATIONS,
} from '../../src/domains/personal-health/engine/universalSportScienceEngine.ts';

console.log('[TEST] Starting Universal Sport Science & Autonomic Recovery Kernel Test Suite...');

// 1. Verify peer-reviewed citations presence
assert.equal(SPORT_SCIENCE_CITATIONS.length, 4, 'Must maintain 4 core exercise physiology citations');
assert.ok(SPORT_SCIENCE_CITATIONS.some(c => c.key === 'BANISTER_1975'));
assert.ok(SPORT_SCIENCE_CITATIONS.some(c => c.key === 'COLE_NEJM_1999'));
assert.ok(SPORT_SCIENCE_CITATIONS.some(c => c.key === 'PLEWS_SPORTS_MED_2013'));
assert.ok(SPORT_SCIENCE_CITATIONS.some(c => c.key === 'BROOKS_CROSSOVER_1994'));

// 2. Banister Impulse Response (CTL, ATL, TSB, ACWR)
const emptyHistory = computeBanisterFitnessFatigue({ dailyLoadsAu: [] });
assert.equal(emptyHistory.chronicTrainingLoadCtl, 0);
assert.equal(emptyHistory.formZone, 'DETRAINING_TRANSITION');

// Steady progressive loading: 100 AU daily for 28 days
const steadyLoads = Array.from({ length: 28 }, () => 100);
const steadyResult = computeBanisterFitnessFatigue({ dailyLoadsAu: steadyLoads });

assert.ok(steadyResult.chronicTrainingLoadCtl > 0, 'CTL should build up');
assert.ok(steadyResult.acuteTrainingLoadAtl > 0, 'ATL should build up faster than CTL');
// Because ATL time constant is 7 days, it reaches steady-state faster than CTL (42 days)
assert.ok(steadyResult.acuteTrainingLoadAtl > steadyResult.chronicTrainingLoadCtl, 'ATL should be higher than CTL during build');
assert.ok(steadyResult.trainingStressBalanceTsb < 0, 'TSB should be negative during heavy training phase');

// Taper phase test (7 days of zero load after steady build)
const taperLoads = [...steadyLoads, 0, 0, 0, 0, 0, 0, 0];
const taperResult = computeBanisterFitnessFatigue({ dailyLoadsAu: taperLoads });
assert.ok(
  taperResult.trainingStressBalanceTsb > steadyResult.trainingStressBalanceTsb,
  'TSB should rebound towards positive (freshness) after taper'
);

// Acute spike check (ACWR > 1.5)
const spikeLoads = [...Array.from({ length: 21 }, () => 50), 300, 350, 400];
const spikeResult = computeBanisterFitnessFatigue({ dailyLoadsAu: spikeLoads });
assert.ok(spikeResult.acuteChronicWorkloadRatio > 1.4, 'Acute spike must elevate ACWR');
assert.equal(spikeResult.formZone, 'HIGH_OVERREACHING_RISK');

// 3. Autonomic Vagal Recovery & Cole NEJM HRR60
// Case A: Elite vagal reactivation (HR drops 35 bpm in 60s)
const eliteAutonomic = evaluateAutonomicVagalRecovery({
  peakHeartRateBpm: 180,
  heartRateAt60sBpm: 145,
  morningRmssdMs: 78,
  baselineRmssdMs: 72,
  morningRestingHrBpm: 48,
  baselineRestingHrBpm: 50,
  deepSleepMinutes: 110,
  remSleepMinutes: 95,
  totalSleepMinutes: 460,
});
assert.equal(eliteAutonomic.hrr60Bpm, 35);
assert.equal(eliteAutonomic.hrr60ClinicalStatus, 'EXCELLENT_VAGAL_TONE');
assert.equal(eliteAutonomic.recoveryCategory, 'GREEN_SUPERCOMPENSATING');
assert.ok(eliteAutonomic.compositeRecoveryScorePercent >= 80);

// Case B: Attenuated vagal tone (Cole NEJM cutoff <= 12 bpm)
const impairedAutonomic = evaluateAutonomicVagalRecovery({
  peakHeartRateBpm: 175,
  heartRateAt60sBpm: 167, // drop only 8 bpm
  morningRmssdMs: 25,
  baselineRmssdMs: 65,
  morningRestingHrBpm: 64,
  baselineRestingHrBpm: 52,
  deepSleepMinutes: 30,
  remSleepMinutes: 35,
  totalSleepMinutes: 360,
});
assert.equal(impairedAutonomic.hrr60Bpm, 8);
assert.equal(impairedAutonomic.hrr60ClinicalStatus, 'ATTENUATED_VAGAL_RECOVERY');
assert.equal(impairedAutonomic.recoveryCategory, 'RED_COMPROMISED');

// Case C: Plews Parasympathetic Saturation (Low RHR + depressed rMSSD CV)
const saturationAutonomic = evaluateAutonomicVagalRecovery({
  peakHeartRateBpm: 165,
  heartRateAt60sBpm: 145,
  morningRmssdMs: 50,
  baselineRmssdMs: 60,
  rolling7DayRmssdStdDevMs: 1.5, // CV = (1.5/50)*100 = 3.0% (< 4.5%)
  morningRestingHrBpm: 42,
  baselineRestingHrBpm: 50, // dropped 8 bpm below baseline!
  deepSleepMinutes: 60,
  remSleepMinutes: 60,
  totalSleepMinutes: 420,
});
assert.equal(saturationAutonomic.autonomicSaturationAlert, true, 'Must trigger Plews parasympathetic saturation alert');
assert.equal(saturationAutonomic.recoveryCategory, 'RED_COMPROMISED');

// 4. Substrate Crossover Kinetics (Brooks 1994)
// Low-intensity Zone 2 / FatMax test (HR 115 bpm, Rest 50, Max 190 -> ~46% HRR)
const fatMaxExercise = computeSubstrateCrossover({
  currentHeartRateBpm: 115,
  restingHeartRateBpm: 50,
  maxHeartRateBpm: 190,
  bodyWeightKg: 70,
});
assert.equal(fatMaxExercise.metabolicSubstrateZone, 'FATMAX_AEROBIC_LIPOLYSIS');
assert.ok(fatMaxExercise.fatOxidationRatioPercent > 65, 'Fat oxidation should dominate at low intensity');
assert.ok(
  fatMaxExercise.fatOxidationRatioPercent > fatMaxExercise.carbohydrateOxidationRatioPercent,
  'Fat caloric contribution should exceed carbs during FatMax'
);

// High-intensity Glycolytic test (HR 180 bpm, Rest 50, Max 190 -> ~93% HRR)
const glycolyticExercise = computeSubstrateCrossover({
  currentHeartRateBpm: 180,
  restingHeartRateBpm: 50,
  maxHeartRateBpm: 190,
  bodyWeightKg: 70,
});
assert.equal(glycolyticExercise.metabolicSubstrateZone, 'GLYCOLYTIC_THRESHOLD');
assert.ok(glycolyticExercise.carbohydrateOxidationRatioPercent > 80, 'Carbohydrate oxidation should dominate near VO2max');
assert.ok(glycolyticExercise.estimatedCarbsGramsPerHour > fatMaxExercise.estimatedCarbsGramsPerHour);

console.log('[TEST] ✓ All Universal Sport Science & Autonomic Recovery Kernel tests PASSED cleanly!');
