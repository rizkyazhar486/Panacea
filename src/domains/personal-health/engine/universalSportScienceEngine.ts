/**
 * Panacea Universal Sport Science & Autonomic Recovery Kernel
 *
 * Grounded in peer-reviewed exercise physiology and autonomic cardiology:
 * 1. Banister EW. A systems approach to study of coaching. 1975; Morton RH. J Appl Physiol. 1990;69(3):1171-7.
 * 2. Cole CR et al. Heart-rate recovery immediately after exercise as a predictor of mortality. N Engl J Med. 1999;341(18):1351-7 (PMID: 10536138).
 * 3. Plews DJ et al. Training adaptation and heart rate variability in elite endurance athletes: opening the door to effective monitoring. Sports Med. 2013;43(9):773-81 (PMID: 23873332).
 * 4. Brooks GA, Mercier J. Balance of carbohydrate and lipid utilization during exercise: the "crossover" concept. J Appl Physiol. 1994;76(6):2253-61 (PMID: 8063640).
 */

export const SPORT_SCIENCE_CITATIONS = Object.freeze([
  {
    topic: 'Fitness-Fatigue Impulse Response (CTL/ATL/TSB)',
    citation: 'Banister EW (1975); Morton RH (1990) J Appl Physiol 69(3):1171-1177.',
    key: 'BANISTER_1975',
  },
  {
    topic: 'Vagal Reactivation & Post-Exercise HRR60',
    citation: 'Cole CR et al. (1999) N Engl J Med 341(18):1351-1357 (PMID: 10536138).',
    pmid: '10536138',
    key: 'COLE_NEJM_1999',
  },
  {
    topic: 'HRV Autonomic Saturation & Coefficient of Variation',
    citation: 'Plews DJ et al. (2013) Sports Med 43(9):773-781 (PMID: 23873332).',
    pmid: '23873332',
    key: 'PLEWS_SPORTS_MED_2013',
  },
  {
    topic: 'Substrate Crossover Kinetics (FatMax vs Glycogen)',
    citation: 'Brooks GA, Mercier J (1994) J Appl Physiol 76(6):2253-2261 (PMID: 8063640).',
    pmid: '8063640',
    key: 'BROOKS_CROSSOVER_1994',
  },
]);

export interface BanisterTrainingHistoryInput {
  /** Daily training load array ordered chronologically (TRIMP or AU) */
  readonly dailyLoadsAu: readonly number[];
  /** Chronic time constant in days (default 42 days for cardiovascular fitness) */
  readonly tauChronicDays?: number;
  /** Acute time constant in days (default 7 days for neuromuscular fatigue) */
  readonly tauAcuteDays?: number;
}

export interface BanisterImpulseOutput {
  readonly chronicTrainingLoadCtl: number;
  readonly acuteTrainingLoadAtl: number;
  readonly trainingStressBalanceTsb: number;
  readonly acuteChronicWorkloadRatio: number;
  readonly formZone:
    | 'PEAK_PERFORMANCE_FRESH'
    | 'OPTIMAL_PROGRESSIVE_OVERLOAD'
    | 'MAINTENANCE_NEUTRAL'
    | 'HIGH_OVERREACHING_RISK'
    | 'DETRAINING_TRANSITION';
  readonly actionableInsight: string;
}

export function computeBanisterFitnessFatigue(input: BanisterTrainingHistoryInput): BanisterImpulseOutput {
  const tau1 = input.tauChronicDays ?? 42;
  const tau2 = input.tauAcuteDays ?? 7;
  const loads = input.dailyLoadsAu;

  if (loads.length === 0) {
    return {
      chronicTrainingLoadCtl: 0,
      acuteTrainingLoadAtl: 0,
      trainingStressBalanceTsb: 0,
      acuteChronicWorkloadRatio: 0,
      formZone: 'DETRAINING_TRANSITION',
      actionableInsight: 'No historical training impulse detected. Initiate progressive aerobic baseline.',
    };
  }

  const k1 = 1 - Math.exp(-1 / tau1);
  const k2 = 1 - Math.exp(-1 / tau2);

  let ctl = 0;
  let atl = 0;

  for (const w of loads) {
    const val = Math.max(0, Number.isFinite(w) ? w : 0);
    ctl = ctl * Math.exp(-1 / tau1) + val * k1;
    atl = atl * Math.exp(-1 / tau2) + val * k2;
  }

  const roundedCtl = Number(ctl.toFixed(1));
  const roundedAtl = Number(atl.toFixed(1));
  const tsb = Number((roundedCtl - roundedAtl).toFixed(1));
  const acwr = roundedCtl > 0 ? Number((roundedAtl / roundedCtl).toFixed(2)) : 1.0;

  let formZone: BanisterImpulseOutput['formZone'] = 'MAINTENANCE_NEUTRAL';
  let actionableInsight = 'Training stress and recovery in baseline equilibrium.';

  if (tsb >= 10 && tsb <= 25) {
    formZone = 'PEAK_PERFORMANCE_FRESH';
    actionableInsight = 'Autonomic reserve peaked. Supercompensation window open for maximal testing or race-day output.';
  } else if (tsb < 10 && tsb >= -15) {
    formZone = 'OPTIMAL_PROGRESSIVE_OVERLOAD';
    actionableInsight = 'Sweet-spot progressive stimulus. Adaptation rate exceeds recovery debt without systemic breakdown.';
  } else if (tsb < -30 || acwr > 1.5) {
    formZone = 'HIGH_OVERREACHING_RISK';
    actionableInsight = 'Acute fatigue spike exceeds biological buffer (ACWR > 1.5). Active recovery or deload mandated.';
  } else if (tsb > 25) {
    formZone = 'DETRAINING_TRANSITION';
    actionableInsight = 'Extended low stimulus detected. Cardiovascular plasma volume and mitochondrial density declining.';
  }

  return {
    chronicTrainingLoadCtl: roundedCtl,
    acuteTrainingLoadAtl: roundedAtl,
    trainingStressBalanceTsb: tsb,
    acuteChronicWorkloadRatio: acwr,
    formZone,
    actionableInsight,
  };
}

export interface AutonomicRecoveryInput {
  /** Peak heart rate achieved immediately at cessation of strenuous exertion (bpm) */
  readonly peakHeartRateBpm: number;
  /** Heart rate measured exactly 60 seconds post-exercise with minimal movement (bpm) */
  readonly heartRateAt60sBpm: number;
  /** Morning resting rMSSD from wearable (ms) */
  readonly morningRmssdMs: number;
  /** 30-day baseline average rMSSD (ms) */
  readonly baselineRmssdMs: number;
  /** 7-day standard deviation of rMSSD for coefficient of variation (ms) */
  readonly rolling7DayRmssdStdDevMs?: number;
  /** Morning resting heart rate (bpm) */
  readonly morningRestingHrBpm: number;
  /** 30-day baseline resting heart rate (bpm) */
  readonly baselineRestingHrBpm: number;
  /** Slow Wave Sleep (deep sleep) duration in minutes */
  readonly deepSleepMinutes: number;
  /** REM sleep duration in minutes */
  readonly remSleepMinutes: number;
  /** Total sleep duration in minutes */
  readonly totalSleepMinutes: number;
}

export interface AutonomicRecoverySummary {
  readonly hrr60Bpm: number;
  readonly hrr60ClinicalStatus: 'EXCELLENT_VAGAL_TONE' | 'NORMAL_PARASYMPATHETIC' | 'ATTENUATED_VAGAL_RECOVERY';
  readonly rmssdRatioToBaseline: number;
  readonly rmssdCvPercent: number;
  readonly autonomicSaturationAlert: boolean;
  readonly sleepRestorativeRatioPercent: number;
  readonly compositeRecoveryScorePercent: number;
  readonly recoveryCategory: 'GREEN_SUPERCOMPENSATING' | 'YELLOW_STEADY' | 'RED_COMPROMISED';
  readonly physiologicalSummary: string;
}

export function evaluateAutonomicVagalRecovery(input: AutonomicRecoveryInput): AutonomicRecoverySummary {
  const hrr60 = Math.max(0, input.peakHeartRateBpm - input.heartRateAt60sBpm);

  let hrr60ClinicalStatus: AutonomicRecoverySummary['hrr60ClinicalStatus'] = 'NORMAL_PARASYMPATHETIC';
  if (hrr60 >= 25) {
    hrr60ClinicalStatus = 'EXCELLENT_VAGAL_TONE';
  } else if (hrr60 <= 12) {
    hrr60ClinicalStatus = 'ATTENUATED_VAGAL_RECOVERY';
  }

  const rmssdRatio = input.baselineRmssdMs > 0 ? input.morningRmssdMs / input.baselineRmssdMs : 1.0;
  const stdDev = input.rolling7DayRmssdStdDevMs ?? (input.baselineRmssdMs * 0.08);
  const rmssdCvPercent = Number(((stdDev / (input.morningRmssdMs || 1)) * 100).toFixed(1));

  // Plews et al. Parasympathetic saturation: RHR decreases significantly below baseline while rMSSD plateaus or drops with very low CV (<4%)
  const rhrDrop = input.baselineRestingHrBpm - input.morningRestingHrBpm;
  const autonomicSaturationAlert = rhrDrop >= 5 && rmssdRatio <= 0.9 && rmssdCvPercent < 4.5;

  // Sleep restorative quotient (SWS + REM as percentage of total sleep, optimal > 40%)
  const restorativeSleepMinutes = input.deepSleepMinutes + input.remSleepMinutes;
  const sleepRestorativeRatioPercent = input.totalSleepMinutes > 0
    ? Number(((restorativeSleepMinutes / input.totalSleepMinutes) * 100).toFixed(1))
    : 0;

  // Transparent composite recovery score calculation (0 - 100%)
  // Component 1: Vagal HRV index (0-35 pts)
  const hrvPoints = Math.min(35, Math.max(5, rmssdRatio * 30));

  // Component 2: Resting HR stability (0-25 pts)
  const hrDelta = input.morningRestingHrBpm - input.baselineRestingHrBpm;
  const hrPoints = Math.min(25, Math.max(0, 25 - Math.max(0, hrDelta) * 3));

  // Component 3: Sleep restorative architecture (0-25 pts)
  const sleepPoints = Math.min(25, Math.max(0, (sleepRestorativeRatioPercent / 45) * 25));

  // Component 4: HRR60 cardiac reactivation (0-15 pts)
  const hrrPoints = Math.min(15, Math.max(0, (hrr60 / 25) * 15));

  const rawScore = hrvPoints + hrPoints + sleepPoints + hrrPoints;
  const compositeRecoveryScorePercent = Math.min(100, Math.max(0, Math.round(rawScore)));

  let recoveryCategory: AutonomicRecoverySummary['recoveryCategory'] = 'YELLOW_STEADY';
  let physiologicalSummary = 'Physiological homeostasis maintained. Regular training capacity available.';

  if (autonomicSaturationAlert || hrr60ClinicalStatus === 'ATTENUATED_VAGAL_RECOVERY' || compositeRecoveryScorePercent < 50) {
    recoveryCategory = 'RED_COMPROMISED';
    physiologicalSummary = autonomicSaturationAlert
      ? 'Parasympathetic saturation warning (Plews et al.): Low RHR with depressed rMSSD variance indicates central autonomic fatigue.'
      : 'Sympathetic dominance or attenuated vagal reactivation. Prioritize parasympathetic restoration, sauna, or Zone 1 active flush.';
  } else if (compositeRecoveryScorePercent >= 75) {
    recoveryCategory = 'GREEN_SUPERCOMPENSATING';
    physiologicalSummary = 'High vagal tone, rapid post-exercise cardiac deceleration, and restorative delta-wave sleep.';
  }

  return {
    hrr60Bpm: hrr60,
    hrr60ClinicalStatus,
    rmssdRatioToBaseline: Number(rmssdRatio.toFixed(2)),
    rmssdCvPercent,
    autonomicSaturationAlert,
    sleepRestorativeRatioPercent,
    compositeRecoveryScorePercent,
    recoveryCategory,
    physiologicalSummary,
  };
}

export interface SubstrateCrossoverInput {
  readonly currentHeartRateBpm: number;
  readonly restingHeartRateBpm: number;
  readonly maxHeartRateBpm: number;
  readonly bodyWeightKg: number;
}

export interface SubstrateCrossoverOutput {
  readonly heartRateReservePercent: number;
  readonly estimatedVo2Percent: number;
  readonly fatOxidationRatioPercent: number;
  readonly carbohydrateOxidationRatioPercent: number;
  readonly estimatedFatGramsPerHour: number;
  readonly estimatedCarbsGramsPerHour: number;
  readonly metabolicSubstrateZone: 'FATMAX_AEROBIC_LIPOLYSIS' | 'BALANCED_MIXED_FLUX' | 'GLYCOLYTIC_THRESHOLD';
}

export function computeSubstrateCrossover(input: SubstrateCrossoverInput): SubstrateCrossoverOutput {
  const hrrDenom = Math.max(30, input.maxHeartRateBpm - input.restingHeartRateBpm);
  const hrrNumer = Math.max(0, input.currentHeartRateBpm - input.restingHeartRateBpm);
  const hrrPct = Math.min(100, Math.max(0, (hrrNumer / hrrDenom) * 100));

  // Karvonen %HRR correlates closely with %VO2max in healthy individuals
  const vo2Pct = Number(hrrPct.toFixed(1));

  // Brooks & Mercier Crossover Concept:
  // At ~65% VO2max, cross-over occurs (50% Fat, 50% Carb).
  // At 40% VO2max: ~75% Fat, 25% Carb
  // At 85% VO2max: ~15% Fat, 85% Carb
  let fatPct = 75;
  if (vo2Pct <= 45) {
    fatPct = 80 - (vo2Pct / 45) * 10;
  } else if (vo2Pct <= 65) {
    fatPct = 70 - ((vo2Pct - 45) / 20) * 20;
  } else {
    fatPct = Math.max(5, 50 - ((vo2Pct - 65) / 35) * 45);
  }

  const carbPct = Number((100 - fatPct).toFixed(1));
  const roundedFatPct = Number(fatPct.toFixed(1));

  // Total energy expenditure estimation based on MET & weight
  const met = Math.max(1.5, 1.0 + (vo2Pct / 100) * 11);
  const totalKcalPerHour = met * input.bodyWeightKg;

  // Fat provides ~9 kcal/g, Carbs provide ~4 kcal/g
  const fatKcal = totalKcalPerHour * (roundedFatPct / 100);
  const carbKcal = totalKcalPerHour * (carbPct / 100);

  const estimatedFatGramsPerHour = Number((fatKcal / 9).toFixed(1));
  const estimatedCarbsGramsPerHour = Number((carbKcal / 4).toFixed(1));

  let metabolicSubstrateZone: SubstrateCrossoverOutput['metabolicSubstrateZone'] = 'BALANCED_MIXED_FLUX';
  if (vo2Pct < 60) {
    metabolicSubstrateZone = 'FATMAX_AEROBIC_LIPOLYSIS';
  } else if (vo2Pct >= 78) {
    metabolicSubstrateZone = 'GLYCOLYTIC_THRESHOLD';
  }

  return {
    heartRateReservePercent: Number(hrrPct.toFixed(1)),
    estimatedVo2Percent: vo2Pct,
    fatOxidationRatioPercent: roundedFatPct,
    carbohydrateOxidationRatioPercent: carbPct,
    estimatedFatGramsPerHour,
    estimatedCarbsGramsPerHour,
    metabolicSubstrateZone,
  };
}
