import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLevinePhenoAge,
  evaluateMultiOrganBiologicalAge,
  calculateKleiberBioenergetics,
  evaluateMicronutrientBioavailability,
  analyzeContinuousGlucoseVariability,
  LONGEVITY_PRECISION_DISCLAIMER,
  LONGEVITY_LITERATURE_SOURCES,
} from '../../src/domains/personal-health/engine/dynamicLongevityPrecisionEngine.ts';

test('Dynamic Longevity 1: Levine PhenoAge conforms to published Gompertz mortality model', () => {
  assert.ok(LONGEVITY_PRECISION_DISCLAIMER.includes('Translational longevity physiology'));
  assert.equal(LONGEVITY_LITERATURE_SOURCES.phenoAge.pmid, '29676998');

  // Baseline healthy 40-year-old adult
  const healthyAdult = calculateLevinePhenoAge({
    chronologicalAgeYears: 40,
    albuminGPerDl: 4.6,
    creatinineMgPerDl: 0.85,
    serumGlucoseMgPerDl: 82,
    cReactiveProteinMgPerL: 0.4,
    lymphocytePercent: 34,
    meanCellVolumeFl: 88,
    redCellDistributionWidthPercent: 12.0,
    alkalinePhosphataseUPerL: 58,
    whiteBloodCellCount10e3PerUl: 5.2,
  });

  assert.equal(healthyAdult.chronologicalAge, 40);
  assert.ok(healthyAdult.phenotypicAgeYears < 40, `Expected phenotypic age < 40 for optimal biomarkers, got ${healthyAdult.phenotypicAgeYears}`);
  assert.ok(healthyAdult.phenotypicAgeDeltaYears < 0, `Expected negative delta for slowed aging, got ${healthyAdult.phenotypicAgeDeltaYears}`);
  assert.equal(healthyAdult.agingPaceCategory, 'slowed-aging');
  assert.ok(healthyAdult.tenYearMortalityRiskPercent > 0 && healthyAdult.tenYearMortalityRiskPercent < 5);

  // Accelerated aging profile with elevated inflammatory & metabolic biomarkers
  const highRiskAdult = calculateLevinePhenoAge({
    chronologicalAgeYears: 50,
    albuminGPerDl: 3.6,
    creatinineMgPerDl: 1.4,
    serumGlucoseMgPerDl: 135,
    cReactiveProteinMgPerL: 4.8,
    lymphocytePercent: 18,
    meanCellVolumeFl: 96,
    redCellDistributionWidthPercent: 14.8,
    alkalinePhosphataseUPerL: 115,
    whiteBloodCellCount10e3PerUl: 9.8,
  });

  assert.ok(highRiskAdult.phenotypicAgeYears > 50, `Expected accelerated phenoAge > 50, got ${highRiskAdult.phenotypicAgeYears}`);
  assert.ok(highRiskAdult.phenotypicAgeDeltaYears >= 2.0);
  assert.equal(highRiskAdult.agingPaceCategory, 'accelerated-aging');
  assert.ok(highRiskAdult.tenYearMortalityRiskPercent > healthyAdult.tenYearMortalityRiskPercent);
});

test('Dynamic Longevity 2: Multi-organ biological age profiling identifies weakest link', () => {
  const profile = evaluateMultiOrganBiologicalAge({
    chronologicalAge: 45,
    cardiovascular: {
      systolicBp: 115,
      restingHr: 52,
      vo2Max: 48,
      ldlCholesterol: 95,
      hsCrp: 0.4,
    },
    renal: {
      egfr: 105,
      creatinine: 0.8,
      bun: 14,
    },
    hepatic: {
      alt: 48, // Elevated transaminases -> hepatic stress
      ast: 42,
      albumin: 4.1,
    },
    metabolic: {
      fastingGlucose: 86,
      hba1c: 5.1,
      triglycerides: 88,
      waistHipRatio: 0.82,
    },
    immune: {
      wbc: 5.5,
      hsCrp: 0.6,
      neutrophilToLymphocyteRatio: 1.8,
    },
    neuromuscular: {
      gripStrengthKg: 46,
      balanceSeconds: 35,
      sleepHours: 7.8,
    },
  });

  assert.equal(profile.chronologicalAge, 45);
  assert.equal(profile.organProfiles.length, 6);
  // Hepatic should have highest positive delta due to ALT 48 and lower albumin
  assert.equal(profile.weakestLinkOrgan.systemKey, 'hepatic');
  assert.ok(profile.weakestLinkOrgan.deltaYears > 0);
  assert.ok(profile.systemResilienceScore >= 50 && profile.systemResilienceScore <= 100);
});

test('Dynamic Longevity 3: Kleiber allometric scaling & Arrhenius temperature bioenergetics', () => {
  // 70 kg human at 37.0 C
  const baseline = calculateKleiberBioenergetics({
    bodyMassKg: 70,
    coreBodyTempCelsius: 37.0,
    physicalActivityLevel: 1.5,
    protonLeakFraction: 0.22,
  });

  // Kleiber law: 70 * 70^0.75 = 70 * 24.1998 = 1693.98 kcal
  assert.ok(Math.abs(baseline.kleiberBasalMetabolicRateKcalPerDay - 1694.0) < 2.0);
  assert.equal(baseline.arrheniusTemperatureFactor, 1.0);
  assert.equal(baseline.temperatureAdjustedBmrKcalPerDay, baseline.kleiberBasalMetabolicRateKcalPerDay);
  assert.ok(baseline.totalDailyEnergyExpenditureKcalPerDay > baseline.temperatureAdjustedBmrKcalPerDay);
  assert.ok(baseline.mitochondrialOxphosAtpFluxMolesPerDay > 50 && baseline.mitochondrialOxphosAtpFluxMolesPerDay < 150);
  assert.ok(baseline.uncouplingProtonLeakHeatDissipationKcalPerDay > 300);

  // Hyperthermia / Fever (39.0 C) increases metabolic rate via Arrhenius factor
  const fever = calculateKleiberBioenergetics({
    bodyMassKg: 70,
    coreBodyTempCelsius: 39.0,
  });
  assert.ok(fever.arrheniusTemperatureFactor > 1.0, 'Fever must increase Arrhenius metabolic rate factor');
  assert.ok(fever.temperatureAdjustedBmrKcalPerDay > baseline.temperatureAdjustedBmrKcalPerDay);

  // Hypothermia (35.0 C) depresses metabolic rate
  const hypothermia = calculateKleiberBioenergetics({
    bodyMassKg: 70,
    coreBodyTempCelsius: 35.0,
  });
  assert.ok(hypothermia.arrheniusTemperatureFactor < 1.0);
  assert.ok(hypothermia.temperatureAdjustedBmrKcalPerDay < baseline.temperatureAdjustedBmrKcalPerDay);
});

test('Dynamic Longevity 4: Micronutrient bioavailability, DMT1 competition, and Hepcidin degradation', () => {
  // Scenario A: Non-heme iron with Vitamin C (synergy)
  const ironWithVitC = evaluateMicronutrientBioavailability({
    elementalIronMg: 18,
    isHemeIron: false,
    elementalZincMg: 0,
    elementalCopperMg: 0,
    elementalCalciumMg: 0,
    ascorbicAcidMg: 200,
    serumHsCrpMgPerL: 0.4,
  });
  assert.ok(ironWithVitC.fractionalIronAbsorptionPercent > 12.0, 'Vitamin C must enhance non-heme iron absorption');
  assert.equal(ironWithVitC.hepcidinSuppressionFactor, 1.0);

  // Scenario B: Non-heme iron co-ingested with high calcium (> 300 mg) and zinc competition
  const competitiveInhibition = evaluateMicronutrientBioavailability({
    elementalIronMg: 18,
    isHemeIron: false,
    elementalZincMg: 30, // Zn:Fe > 1.5:1
    elementalCopperMg: 2,
    elementalCalciumMg: 600, // Ca > 300 mg
    ascorbicAcidMg: 0,
    serumHsCrpMgPerL: 0.4,
  });
  assert.ok(competitiveInhibition.fractionalIronAbsorptionPercent < ironWithVitC.fractionalIronAbsorptionPercent);
  assert.ok(competitiveInhibition.dmt1CompetitionIndex > 1.0);

  // Scenario C: Systemic inflammation (hs-CRP = 4.5 mg/L) induces hepcidin ferroportin degradation
  const inflamedState = evaluateMicronutrientBioavailability({
    elementalIronMg: 18,
    isHemeIron: false,
    ascorbicAcidMg: 200,
    serumHsCrpMgPerL: 4.5,
  });
  assert.ok(inflamedState.hepcidinSuppressionFactor < 0.8, 'High hs-CRP must reduce hepcidin export factor');
  assert.ok(inflamedState.netAbsorbedIronMg < ironWithVitC.netAbsorbedIronMg);
});

test('Dynamic Longevity 5: Continuous Glucose Monitoring variability and longevity TIR (70-140)', () => {
  // Stable glycemic profile (longevity zone)
  const stableCgm = [
    { timestampIso: '2026-11-03T00:00:00Z', glucoseMgPerDl: 84 },
    { timestampIso: '2026-11-03T02:00:00Z', glucoseMgPerDl: 82 },
    { timestampIso: '2026-11-03T04:00:00Z', glucoseMgPerDl: 80 },
    { timestampIso: '2026-11-03T06:00:00Z', glucoseMgPerDl: 86 },
    { timestampIso: '2026-11-03T08:00:00Z', glucoseMgPerDl: 110 }, // post-breakfast peak
    { timestampIso: '2026-11-03T10:00:00Z', glucoseMgPerDl: 92 },
    { timestampIso: '2026-11-03T12:00:00Z', glucoseMgPerDl: 115 }, // post-lunch peak
    { timestampIso: '2026-11-03T14:00:00Z', glucoseMgPerDl: 88 },
    { timestampIso: '2026-11-03T18:00:00Z', glucoseMgPerDl: 120 }, // post-dinner peak
    { timestampIso: '2026-11-03T20:00:00Z', glucoseMgPerDl: 94 },
  ];

  const stableMetrics = analyzeContinuousGlucoseVariability(stableCgm);
  assert.equal(stableMetrics.sampleCount, 10);
  assert.equal(stableMetrics.timeInRangeLongevityPercent, 100);
  assert.equal(stableMetrics.timeBelowRangePercent, 0);
  assert.ok(stableMetrics.coefficientOfVariationPercent < 33);
  assert.equal(stableMetrics.glycemicStabilityCategory, 'optimal-longevity');
  assert.ok(stableMetrics.lowBloodGlucoseIndexLbgi < 2.5);
  assert.ok(stableMetrics.highBloodGlucoseIndexHbgi < 2.0);

  // Volatile glycemic profile with severe excursions
  const volatileCgm = [
    { timestampIso: '2026-11-03T00:00:00Z', glucoseMgPerDl: 58 }, // Hypoglycemia (<70)
    { timestampIso: '2026-11-03T02:00:00Z', glucoseMgPerDl: 195 }, // Hyperglycemia (>180)
    { timestampIso: '2026-11-03T04:00:00Z', glucoseMgPerDl: 62 },
    { timestampIso: '2026-11-03T06:00:00Z', glucoseMgPerDl: 210 },
    { timestampIso: '2026-11-03T08:00:00Z', glucoseMgPerDl: 75 },
  ];

  const volatileMetrics = analyzeContinuousGlucoseVariability(volatileCgm);
  assert.ok(volatileMetrics.timeInRangeLongevityPercent < 50);
  assert.ok(volatileMetrics.timeBelowRangePercent > 0);
  assert.ok(volatileMetrics.coefficientOfVariationPercent > 38);
  assert.equal(volatileMetrics.glycemicStabilityCategory, 'high-glycemic-volatility');
  assert.ok(volatileMetrics.lowBloodGlucoseIndexLbgi > 1.0);
  assert.ok(volatileMetrics.highBloodGlucoseIndexHbgi > 4.0);
});

test('Dynamic Longevity 6: Fails closed on empty or zero inputs without crashing', () => {
  const emptyCgm = analyzeContinuousGlucoseVariability([]);
  assert.equal(emptyCgm.sampleCount, 0);
  assert.equal(emptyCgm.meanGlucoseMgPerDl, 0);

  const zeroBioenergetics = calculateKleiberBioenergetics({ bodyMassKg: 0 });
  assert.ok(zeroBioenergetics.kleiberBasalMetabolicRateKcalPerDay > 0, 'Falls back safely to minimum bounded mass');

  const zeroMicronutrients = evaluateMicronutrientBioavailability({
    elementalIronMg: 0,
    elementalZincMg: 0,
    elementalCopperMg: 0,
    elementalCalciumMg: 0,
    ascorbicAcidMg: 0,
  });
  assert.equal(zeroMicronutrients.netAbsorbedIronMg, 0);
  assert.equal(zeroMicronutrients.dmt1CompetitionIndex, 0);
});
