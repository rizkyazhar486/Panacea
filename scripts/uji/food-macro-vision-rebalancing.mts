import { strict as assert } from 'node:assert';
import {
  analyzeFoodPhotoAndGenerateNutritionPlan,
  CANONICAL_FOOD_VISION_DB,
  evaluateGpsWorkoutSession,
  type GpsWaypoint,
} from '../../src/domains/personal-health/engine/gpsPaceCalorieAndFoodAiEngine.ts';

console.log('[TEST] Starting Food Macro Vision & Dynamic Rebalancing Test Suite...');

// 1. Verify Indonesian functional longevity catalog items exist with bioactives
assert.ok(CANONICAL_FOOD_VISION_DB.TEMPE_GORENG_KUNYIT_100G, 'TEMPE_GORENG_KUNYIT_100G should exist');
assert.ok(CANONICAL_FOOD_VISION_DB.IKAN_KEMBUNG_BAKAR_150G, 'IKAN_KEMBUNG_BAKAR_150G should exist');
assert.ok(CANONICAL_FOOD_VISION_DB.SAYUR_BENING_BAYAM_JAGUNG_200G, 'SAYUR_BENING_BAYAM_JAGUNG_200G should exist');
assert.ok(CANONICAL_FOOD_VISION_DB.SAMBAL_MATAH_EXTRA_VIRGIN_COCONUT_30G, 'SAMBAL_MATAH_EXTRA_VIRGIN_COCONUT_30G should exist');
assert.ok(CANONICAL_FOOD_VISION_DB.PAPAYA_KATES_150G, 'PAPAYA_KATES_150G should exist');

// 2. Combined meal analysis test with Indonesian longevity plate
const mealPlan = analyzeFoodPhotoAndGenerateNutritionPlan({
  imageId: 'IMG_BALI_LONGEVITY_001',
  detectedDishKeys: [
    'IKAN_KEMBUNG_BAKAR_150G',
    'TEMPE_GORENG_KUNYIT_100G',
    'SAYUR_BENING_BAYAM_JAGUNG_200G',
    'SAMBAL_MATAH_EXTRA_VIRGIN_COCONUT_30G',
    'PAPAYA_KATES_150G',
  ],
  portionMultiplier: 1.0,
  workoutCaloriesBurnedKcal: 450,
  dailyTargetCalorieKcal: 2000,
});

assert.equal(mealPlan.truthClass, 'SIMULATED_EDUCATIONAL', 'Must preserve truthClass SIMULATED_EDUCATIONAL');
assert.equal(mealPlan.imageId, 'IMG_BALI_LONGEVITY_001');

// Verify macronutrient totals
const expectedCalories = 245 + 215 + 78 + 65 + 62; // 665 kcal
assert.equal(mealPlan.totals.totalCaloriesKcal, expectedCalories);

// High-protein confirmation (31g + 19g + 3.5g + 0.8g + 0.8g = 55.1g)
assert.ok(mealPlan.totals.totalProteinGrams >= 50, `Protein should be >= 50g, got ${mealPlan.totals.totalProteinGrams}g`);

// Dynamic net calorie balance
assert.equal(mealPlan.workoutCaloriesBurnedKcal, 450);
assert.equal(mealPlan.netCalorieBalanceKcal, 665 - 450); // 215 kcal

// Verify bioactive extraction
const bioactives = mealPlan.longevityBioactivesDetected;
assert.ok(bioactives.includes('High-Dose EPA/DHA Omega-3'), 'Must detect EPA/DHA from mackerel');
assert.ok(bioactives.includes('Curcuminoids'), 'Must detect curcuminoids from turmeric tempeh');
assert.ok(bioactives.includes('Allicin'), 'Must detect allicin from sambal matah');
assert.ok(bioactives.includes('Papain Proteolytic Enzyme'), 'Must detect papain from papaya');

// Hydration recommendation verification (250 + 450*0.9 + fiber*12)
assert.ok(mealPlan.recommendedWaterMl > 600, `Expected recommended hydration > 600mL, got ${mealPlan.recommendedWaterMl}mL`);

// 3. Dynamic workout coupling test: calculate GPS run burn, then feed into nutrition plan
const start = Date.now();
const waypoints: GpsWaypoint[] = [
  { lat: -8.6500, lng: 115.1300, altitudeMeters: 10, timestampMs: start },
  { lat: -8.6700, lng: 115.1300, altitudeMeters: 15, timestampMs: start + 900_000 },
  { lat: -8.6900, lng: 115.1300, altitudeMeters: 20, timestampMs: start + 1_800_000 },
];

const gpsRun = evaluateGpsWorkoutSession({
  waypoints,
  bodyWeightKg: 70,
  averageHeartRateBpm: 155,
  activityMode: 'RUNNING',
});

assert.ok(gpsRun.caloriesBurnedKcal > 200, `Run burn should be > 200 kcal, got ${gpsRun.caloriesBurnedKcal}`);

const rebalancedNutrition = analyzeFoodPhotoAndGenerateNutritionPlan({
  imageId: 'IMG_POST_RUN_RECOVERY',
  detectedDishKeys: ['TEMPE_BAKAR_100G', 'WHITE_RICE_STEAMED_150G'],
  workoutCaloriesBurnedKcal: gpsRun.caloriesBurnedKcal,
  dailyTargetCalorieKcal: 2100,
});

assert.equal(rebalancedNutrition.workoutCaloriesBurnedKcal, gpsRun.caloriesBurnedKcal);
assert.equal(
  rebalancedNutrition.netCalorieBalanceKcal,
  rebalancedNutrition.totals.totalCaloriesKcal - gpsRun.caloriesBurnedKcal
);
assert.equal(rebalancedNutrition.metabolicStatus, 'CALORIC_DEFICIT');

console.log('[TEST] ✓ All Food Macro Vision & Dynamic Rebalancing tests PASSED cleanly!');
