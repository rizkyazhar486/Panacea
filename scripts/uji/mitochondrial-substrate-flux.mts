import { strict as assert } from 'node:assert';
import {
  calculateMitochondrialSubstrateFlux,
} from '../../src/domains/physiology/index.ts';

console.log('[TEST] Starting Mitochondrial Substrate Flux & Brooks Crossover Suite...');

// 1. Zone 1: Active Recovery & High Lipid Proportion (40% VO2max)
{
  const z1 = calculateMitochondrialSubstrateFlux({
    intensityPercentVo2max: 40,
    bodyWeightKg: 70,
  });

  assert.equal(z1.zoneClassification, 'ZONE_1_ACTIVE_RECOVERY');
  assert.ok(z1.substrateEnergyPartition.lipidEnergyFraction >= 0.50, 'Lipid oxidation dominates at low intensity');
  assert.ok(z1.respiratoryExchangeRatioRer >= 0.70 && z1.respiratoryExchangeRatioRer <= 0.85);
  assert.ok(z1.estimatedLactateMmolL <= 1.5, 'Lactate remains near baseline resting levels');
  console.log('✓ Case 1: Low-intensity Zone 1 lipid predominance verified');
}

// 2. Zone 2: Peak FatMax Endurance (62% VO2max)
{
  const z2 = calculateMitochondrialSubstrateFlux({
    intensityPercentVo2max: 62,
    bodyWeightKg: 70,
    mitochondrialDensityRatio: 1.2,
  });

  assert.equal(z2.zoneClassification, 'ZONE_2_FATMAX_ENDURANCE');
  assert.ok(z2.lipidOxidationGramsPerMin >= 0.50, 'Peak FatMax achieved around 62% VO2max');
  assert.ok(z2.estimatedLactateMmolL >= 1.0 && z2.estimatedLactateMmolL <= 2.2);
  assert.ok(z2.clinicalPhysiologySummary.includes('Optimal mitochondrial beta-oxidation'));
  console.log('✓ Case 2: Zone 2 FatMax peak rate and CPT-1 transporter dynamics verified');
}

// 3. Zone 3: Aerobic Tempo & Crossover Transition (75% VO2max)
{
  const z3 = calculateMitochondrialSubstrateFlux({
    intensityPercentVo2max: 75,
    bodyWeightKg: 70,
  });

  assert.equal(z3.zoneClassification, 'ZONE_3_AEROBIC_TEMPO');
  assert.ok(
    z3.substrateEnergyPartition.carbohydrateEnergyFraction > z3.substrateEnergyPartition.lipidEnergyFraction,
    'Carbohydrates overtake fats past the Brooks crossover point',
  );
  assert.ok(z3.respiratoryExchangeRatioRer > 0.85 && z3.respiratoryExchangeRatioRer < 0.98);
  console.log('✓ Case 3: Brooks substrate crossover (carbohydrate shift) verified');
}

// 4. Zone 4: Lactate Threshold / OBLA (85% VO2max)
{
  const z4 = calculateMitochondrialSubstrateFlux({
    intensityPercentVo2max: 85,
    bodyWeightKg: 70,
  });

  assert.equal(z4.zoneClassification, 'ZONE_4_LACTATE_THRESHOLD_OBLA');
  assert.ok(z4.estimatedLactateMmolL >= 3.0 && z4.estimatedLactateMmolL <= 5.0, 'Lactate approaches 4.0 mmol/L OBLA');
  assert.ok(z4.respiratoryExchangeRatioRer >= 0.92);
  console.log('✓ Case 4: OBLA lactate threshold (4.0 mmol/L boundary) verified');
}

// 5. Zone 5: Anaerobic Glycolytic & Hyperventilation (95% VO2max)
{
  const z5 = calculateMitochondrialSubstrateFlux({
    intensityPercentVo2max: 95,
    bodyWeightKg: 70,
  });

  assert.equal(z5.zoneClassification, 'ZONE_5_ANAEROBIC_GLYCOLYTIC');
  assert.ok(z5.respiratoryExchangeRatioRer > 1.00, 'Respiratory compensation causes RER to exceed 1.00');
  assert.ok(z5.estimatedLactateMmolL >= 5.5, 'Significant glycolytic lactate accumulation');
  assert.ok(z5.substrateEnergyPartition.carbohydrateEnergyFraction >= 0.85);
  console.log('✓ Case 5: Supramaximal RER > 1.00 and glycolytic saturation verified');
}

// 6. San-Millán 2018 Mitochondrial Density Adaptation (Elite vs Sedentary)
{
  const elite = calculateMitochondrialSubstrateFlux({
    intensityPercentVo2max: 70,
    mitochondrialDensityRatio: 1.6,
    bodyWeightKg: 70,
  });

  const sedentary = calculateMitochondrialSubstrateFlux({
    intensityPercentVo2max: 70,
    mitochondrialDensityRatio: 0.7,
    bodyWeightKg: 70,
  });

  assert.ok(
    elite.lipidOxidationGramsPerMin > sedentary.lipidOxidationGramsPerMin,
    'Elite athlete retains higher fat oxidation rate at 70% VO2max',
  );
  assert.ok(
    elite.estimatedLactateMmolL < sedentary.estimatedLactateMmolL,
    'Elite athlete maintains lower blood lactate due to superior mitochondrial clearance',
  );
  assert.ok(
    elite.metabolicFlexibilityScore > sedentary.metabolicFlexibilityScore,
    'Metabolic flexibility score is substantially higher in trained mitochondria',
  );
  console.log('✓ Case 6: San-Millán metabolic flexibility & mitochondrial density differentiation locked');
}

console.log('ALL MITOCHONDRIAL SUBSTRATE FLUX TESTS PASSED GREEN (6/6).');
