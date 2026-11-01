import { evaluateWorkoutSession as evaluateBaseWorkout } from "./workoutAndEndocrineMasteryEngine.ts";

export interface GpsWaypoint {
  readonly lat: number;
  readonly lng: number;
  readonly altitudeMeters?: number;
  readonly timestampMs: number;
}

export interface GpsTelemetrySummary {
  readonly totalDistanceKm: number;
  readonly totalDistanceMeters: number;
  readonly elapsedSeconds: number;
  readonly formattedTimeHhMmSs: string;
  readonly averageSpeedKmh: number;
  readonly averagePaceMinPerKm: number;
  readonly formattedPaceMmSsPerKm: string;
  readonly elevationGainMeters: number;
  readonly caloriesBurnedKcal: number;
  readonly metabolicEquivalentMet: number;
  readonly waypointCount: number;
}

export function computeHaversineDistanceMeters(p1: GpsWaypoint, p2: GpsWaypoint): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDurationHhMmSs(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds));
  const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return hh + ":" + mm + ":" + ss;
}

export function formatPaceMmSs(paceMinPerKm: number): string {
  if (!Number.isFinite(paceMinPerKm) || paceMinPerKm <= 0) return "00:00 /km";
  const wholeMin = Math.floor(paceMinPerKm);
  const remSec = Math.round((paceMinPerKm - wholeMin) * 60);
  const mm = String(remSec === 60 ? wholeMin + 1 : wholeMin).padStart(2, "0");
  const ss = String(remSec === 60 ? 0 : remSec).padStart(2, "0");
  return mm + ":" + ss + " /km";
}

export function evaluateGpsWorkoutSession(params: {
  readonly waypoints: readonly GpsWaypoint[];
  readonly bodyWeightKg: number;
  readonly averageHeartRateBpm?: number;
  readonly activityMode?: "RUNNING" | "CYCLING" | "WALKING" | "CALISTHENICS_HYBRID";
}): GpsTelemetrySummary {
  const { waypoints, bodyWeightKg, averageHeartRateBpm = 148, activityMode = "RUNNING" } = params;
  if (bodyWeightKg <= 20 || bodyWeightKg > 300) throw new RangeError("Invalid bodyWeightKg");
  if (waypoints.length < 2) {
    return {
      totalDistanceKm: 0,
      totalDistanceMeters: 0,
      elapsedSeconds: 0,
      formattedTimeHhMmSs: "00:00:00",
      averageSpeedKmh: 0,
      averagePaceMinPerKm: 0,
      formattedPaceMmSsPerKm: "00:00 /km",
      elevationGainMeters: 0,
      caloriesBurnedKcal: 0,
      metabolicEquivalentMet: 1.0,
      waypointCount: waypoints.length
    };
  }
  let distMeters = 0;
  let elevGain = 0;
  for (let i = 1; i < waypoints.length; i++) {
    distMeters += computeHaversineDistanceMeters(waypoints[i - 1], waypoints[i]);
    const prevAlt = waypoints[i - 1].altitudeMeters;
    const currAlt = waypoints[i].altitudeMeters;
    if (typeof prevAlt === "number" && typeof currAlt === "number" && currAlt > prevAlt) {
      elevGain += currAlt - prevAlt;
    }
  }
  const elapsedSeconds = Math.max(1, (waypoints[waypoints.length - 1].timestampMs - waypoints[0].timestampMs) / 1000);
  const totalDistanceKm = Number((distMeters / 1000).toFixed(3));
  const hours = elapsedSeconds / 3600;
  const averageSpeedKmh = Number((totalDistanceKm / hours).toFixed(2));
  const averagePaceMinPerKm = totalDistanceKm > 0 ? Number(((elapsedSeconds / 60) / totalDistanceKm).toFixed(2)) : 0;

  let met = 3.5;
  if (activityMode === "RUNNING") {
    met = averageSpeedKmh >= 12 ? 11.5 : averageSpeedKmh >= 9.5 ? 9.8 : averageSpeedKmh >= 7.5 ? 8.3 : 6.0;
  } else if (activityMode === "CYCLING") {
    met = averageSpeedKmh >= 22 ? 10.0 : 7.5;
  } else if (activityMode === "WALKING") {
    met = averageSpeedKmh >= 5.5 ? 4.3 : 3.5;
  } else {
    met = 8.0;
  }
  const hrFactor = averageHeartRateBpm > 120 ? 1 + (averageHeartRateBpm - 120) * 0.0025 : 1.0;
  const caloriesBurnedKcal = Math.round(met * bodyWeightKg * hours * hrFactor);

  return {
    totalDistanceKm,
    totalDistanceMeters: Math.round(distMeters),
    elapsedSeconds: Math.round(elapsedSeconds),
    formattedTimeHhMmSs: formatDurationHhMmSs(elapsedSeconds),
    averageSpeedKmh,
    averagePaceMinPerKm,
    formattedPaceMmSsPerKm: formatPaceMmSs(averagePaceMinPerKm),
    elevationGainMeters: Number(elevGain.toFixed(1)),
    caloriesBurnedKcal,
    metabolicEquivalentMet: met,
    waypointCount: waypoints.length
  };
}

export interface FoodPhotoAnalysisInput {
  readonly imageId: string;
  readonly detectedDishKeys: readonly string[];
  readonly portionMultiplier?: number;
  readonly targetGoal?: "CUTTING_DEFICIT" | "LEAN_BULK_SURPLUS" | "MAINTENANCE_RECOMP";
  readonly workoutCaloriesBurnedKcal?: number;
}

export interface FoodMacroItem {
  readonly dishKey: string;
  readonly displayName: string;
  readonly caloriesKcal: number;
  readonly proteinGrams: number;
  readonly carbsGrams: number;
  readonly fatGrams: number;
  readonly fiberGrams: number;
}

export const CANONICAL_FOOD_VISION_DB: Record<string, FoodMacroItem> = {
  CHICKEN_BREAST_GRILLED_200G: { dishKey: "CHICKEN_BREAST_GRILLED_200G", displayName: "Grilled Chicken Breast (200g)", caloriesKcal: 330, proteinGrams: 62, carbsGrams: 0, fatGrams: 7, fiberGrams: 0 },
  WHITE_RICE_STEAMED_150G: { dishKey: "WHITE_RICE_STEAMED_150G", displayName: "Steamed White Rice (150g)", caloriesKcal: 195, proteinGrams: 4, carbsGrams: 42, fatGrams: 0.4, fiberGrams: 0.6 },
  BROWN_RICE_150G: { dishKey: "BROWN_RICE_150G", displayName: "Steamed Brown Rice (150g)", caloriesKcal: 168, proteinGrams: 3.8, carbsGrams: 35, fatGrams: 1.4, fiberGrams: 2.7 },
  SALMON_FILLET_180G: { dishKey: "SALMON_FILLET_180G", displayName: "Pan-Seared Atlantic Salmon (180g)", caloriesKcal: 370, proteinGrams: 40, carbsGrams: 0, fatGrams: 22, fiberGrams: 0 },
  TEMPE_BAKAR_100G: { dishKey: "TEMPE_BAKAR_100G", displayName: "Grilled Tempeh / Tempe Bakar (100g)", caloriesKcal: 192, proteinGrams: 20, carbsGrams: 9, fatGrams: 11, fiberGrams: 4.5 },
  BOILED_EGGS_2X: { dishKey: "BOILED_EGGS_2X", displayName: "Two Whole Boiled Eggs", caloriesKcal: 156, proteinGrams: 12.6, carbsGrams: 1.1, fatGrams: 10.6, fiberGrams: 0 },
  WHEY_ISOLATE_SCOOP: { dishKey: "WHEY_ISOLATE_SCOOP", displayName: "Whey Protein Isolate (1 Scoop)", caloriesKcal: 120, proteinGrams: 27, carbsGrams: 1, fatGrams: 0.5, fiberGrams: 0 },
  AVOCADO_100G: { dishKey: "AVOCADO_100G", displayName: "Fresh Avocado (100g)", caloriesKcal: 160, proteinGrams: 2, carbsGrams: 8.5, fatGrams: 14.7, fiberGrams: 6.7 }
};

export function analyzeFoodPhotoAndGenerateNutritionPlan(input: FoodPhotoAnalysisInput) {
  const mult = input.portionMultiplier ?? 1.0;
  const items = input.detectedDishKeys.map((key) => {
    const ref = CANONICAL_FOOD_VISION_DB[key] || {
      dishKey: key,
      displayName: key,
      caloriesKcal: 250,
      proteinGrams: 15,
      carbsGrams: 25,
      fatGrams: 9,
      fiberGrams: 2
    };
    return {
      ...ref,
      caloriesKcal: Math.round(ref.caloriesKcal * mult),
      proteinGrams: Number((ref.proteinGrams * mult).toFixed(1)),
      carbsGrams: Number((ref.carbsGrams * mult).toFixed(1)),
      fatGrams: Number((ref.fatGrams * mult).toFixed(1)),
      fiberGrams: Number((ref.fiberGrams * mult).toFixed(1))
    };
  });
  const totalCaloriesKcal = items.reduce((s, i) => s + i.caloriesKcal, 0);
  const totalProteinGrams = Number(items.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1));
  const totalCarbsGrams = Number(items.reduce((s, i) => s + i.carbsGrams, 0).toFixed(1));
  const totalFatGrams = Number(items.reduce((s, i) => s + i.fatGrams, 0).toFixed(1));
  const totalFiberGrams = Number(items.reduce((s, i) => s + i.fiberGrams, 0).toFixed(1));
  const burned = input.workoutCaloriesBurnedKcal ?? 0;
  const netCalorieBalanceKcal = totalCaloriesKcal - burned;
  const aiNextMealRecommendation = totalProteinGrams < 40
    ? "Add 1 scoop Whey Protein (+27g protein) or 100g Tempe Bakar to hit muscle recovery threshold."
    : "Protein target met. Hydrate with 500mL water + electrolytes.";
  return {
    imageId: input.imageId,
    goal: input.targetGoal ?? "MAINTENANCE_RECOMP",
    items,
    totals: { totalCaloriesKcal, totalProteinGrams, totalCarbsGrams, totalFatGrams, totalFiberGrams },
    netCalorieBalanceKcal,
    aiNextMealRecommendation,
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}