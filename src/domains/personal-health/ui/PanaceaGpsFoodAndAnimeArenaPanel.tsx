import React, { useState, useMemo } from "react";
import {
  evaluateGpsWorkoutSession,
  analyzeFoodPhotoAndGenerateNutritionPlan,
  CANONICAL_FOOD_VISION_DB
} from "../engine/gpsPaceCalorieAndFoodAiEngine.ts";
import {
  PANACEA_COMPETITIVE_ANIME_BOTS,
  evaluateBotSparringRound,
  type AnimeBotId
} from "../../prometheus/competitive-bots/anime-sparring-arena.ts";

export const PanaceaGpsFoodAndAnimeArenaPanel: React.FC = () => {
  const [distanceMultiplier, setDistanceMultiplier] = useState<number>(1);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([
    "CHICKEN_BREAST_GRILLED_200G",
    "BROWN_RICE_150G",
    "TEMPE_BAKAR_100G"
  ]);
  const [learnerTheta, setLearnerTheta] = useState<number>(1.75);

  const gpsTelemetry = useMemo(() => {
    return evaluateGpsWorkoutSession({
      bodyWeightKg: 70,
      averageHeartRateBpm: 156,
      activityMode: "RUNNING",
      waypoints: [
        { lat: -6.2250, lng: 106.6520, altitudeMeters: 28, timestampMs: 0 },
        { lat: -6.2250 + 0.025 * distanceMultiplier, lng: 106.6520 + 0.025 * distanceMultiplier, altitudeMeters: 48, timestampMs: 1050000 * distanceMultiplier }
      ]
    });
  }, [distanceMultiplier]);

  const nutritionPlan = useMemo(() => {
    return analyzeFoodPhotoAndGenerateNutritionPlan({
      imageId: "live-food-scan",
      detectedDishKeys: selectedDishes,
      workoutCaloriesBurnedKcal: gpsTelemetry.caloriesBurnedKcal,
      targetGoal: "MAINTENANCE_RECOMP"
    });
  }, [selectedDishes, gpsTelemetry.caloriesBurnedKcal]);

  const botRound = useMemo(() => evaluateBotSparringRound(learnerTheta, true, 1.1), [learnerTheta]);

  return (
    <section aria-label="Panacea Life Ascent GPS, Food AI, and Anime Bot Arena" style={{ padding: 24, background: "#020617", color: "#F8FAFC", borderRadius: 16 }}>
      <h2>PanaceaMed ∞ — GPS Tracker, AI Food Photo Calorie & 3-Bot Anime Arena</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ padding: 16, background: "#0F172A", borderRadius: 12 }}>
          <h3>Live GPS Tracker (KM, Speed, Pace, Time, Calorie)</h3>
          <p>Distance: <strong>{gpsTelemetry.totalDistanceKm} km</strong> | Time: <strong>{gpsTelemetry.formattedTimeHhMmSs}</strong></p>
          <p>Speed: <strong>{gpsTelemetry.averageSpeedKmh} km/h</strong> | Pace: <strong>{gpsTelemetry.formattedPaceMmSsPerKm}</strong></p>
          <p>Calories Burned: <strong>{gpsTelemetry.caloriesBurnedKcal} kcal</strong> (Elev: +{gpsTelemetry.elevationGainMeters}m)</p>
          <button type="button" onClick={() => setDistanceMultiplier((m) => m + 0.5)}>+ Add GPS Lap Split</button>
        </div>
        <div style={{ padding: 16, background: "#0F172A", borderRadius: 12 }}>
          <h3>AI Food Photo Calorie & Macro Generator</h3>
          <p>Total Meal: <strong>{nutritionPlan.totals.totalCaloriesKcal} kcal</strong> (Net: {nutritionPlan.netCalorieBalanceKcal} kcal)</p>
          <p>Protein: {nutritionPlan.totals.totalProteinGrams}g | Carbs: {nutritionPlan.totals.totalCarbsGrams}g | Fat: {nutritionPlan.totals.totalFatGrams}g</p>
          <p style={{ fontSize: 12, color: "#34D399" }}>{nutritionPlan.aiNextMealRecommendation}</p>
          <button type="button" onClick={() => setSelectedDishes((d) => [...d, "WHEY_ISOLATE_SCOOP"])}>+ Scan Whey Isolate Photo</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {botRound.map((r) => {
          const b = PANACEA_COMPETITIVE_ANIME_BOTS[r.botId as AnimeBotId];
          return (
            <div key={r.botId} style={{ padding: 12, background: "#1E293B", borderRadius: 10, border: "1px solid " + b.primaryColorHex }}>
              <strong style={{ color: b.primaryColorHex }}>{b.displayName}</strong> (θ = {r.effectiveTheta})
              <div style={{ fontSize: 12 }}>{b.signatureLine}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};