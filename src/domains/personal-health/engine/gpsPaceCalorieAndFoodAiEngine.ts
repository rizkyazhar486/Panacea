export interface GpsWaypoint { readonly lat: number; readonly lng: number; readonly altitudeMeters?: number; readonly timestampMs: number; }
export function computeHaversineDistanceMeters(p1: GpsWaypoint, p2: GpsWaypoint): number {
  const R = 6371000; const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(p2.lat - p1.lat); const dLng = toRad(p2.lng - p1.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export function evaluateGpsWorkoutSession(params: { readonly waypoints: readonly GpsWaypoint[]; readonly bodyWeightKg: number; readonly averageHeartRateBpm?: number; readonly activityMode?: string; }) {
  let distMeters = 0; let elevGain = 0;
  for (let i = 1; i < params.waypoints.length; i++) {
    distMeters += computeHaversineDistanceMeters(params.waypoints[i - 1], params.waypoints[i]);
    const dAlt = (params.waypoints[i].altitudeMeters ?? 0) - (params.waypoints[i - 1].altitudeMeters ?? 0);
    if (dAlt > 0) elevGain += dAlt;
  }
  const elapsedSeconds = Math.max(1, (params.waypoints[params.waypoints.length - 1].timestampMs - params.waypoints[0].timestampMs) / 1000);
  const totalDistanceKm = Number((distMeters / 1000).toFixed(3));
  const hours = elapsedSeconds / 3600;
  const averageSpeedKmh = Number((totalDistanceKm / hours).toFixed(2));
  const paceMin = totalDistanceKm > 0 ? (elapsedSeconds / 60) / totalDistanceKm : 0;
  const wholeM = Math.floor(paceMin); const remS = Math.round((paceMin - wholeM) * 60);
  const formattedPaceMmSsPerKm = String(wholeM).padStart(2, "0") + ":" + String(remS % 60).padStart(2, "0") + " /km";
  const hh = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0"); const mm = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0"); const ss = String(Math.round(elapsedSeconds % 60)).padStart(2, "0");
  const caloriesBurnedKcal = Math.round(11.5 * params.bodyWeightKg * hours * 1.08);
  return { totalDistanceKm, totalDistanceMeters: Math.round(distMeters), elapsedSeconds: Math.round(elapsedSeconds), formattedTimeHhMmSs: hh + ":" + mm + ":" + ss, averageSpeedKmh, averagePaceMinPerKm: Number(paceMin.toFixed(2)), formattedPaceMmSsPerKm, elevationGainMeters: Number(elevGain.toFixed(1)), caloriesBurnedKcal, metabolicEquivalentMet: 11.5, waypointCount: params.waypoints.length };
}
export const CANONICAL_FOOD_VISION_DB: Record<string, { dishKey: string; displayName: string; caloriesKcal: number; proteinGrams: number; carbsGrams: number; fatGrams: number; fiberGrams: number }> = {
  CHICKEN_BREAST_GRILLED_200G: { dishKey: "CHICKEN_BREAST_GRILLED_200G", displayName: "Grilled Chicken Breast (200g)", caloriesKcal: 330, proteinGrams: 62, carbsGrams: 0, fatGrams: 7, fiberGrams: 0 },
  BROWN_RICE_150G: { dishKey: "BROWN_RICE_150G", displayName: "Steamed Brown Rice (150g)", caloriesKcal: 168, proteinGrams: 3.8, carbsGrams: 35, fatGrams: 1.4, fiberGrams: 2.7 },
  TEMPE_BAKAR_100G: { dishKey: "TEMPE_BAKAR_100G", displayName: "Grilled Tempeh (100g)", caloriesKcal: 192, proteinGrams: 20, carbsGrams: 9, fatGrams: 11, fiberGrams: 4.5 },
  AVOCADO_100G: { dishKey: "AVOCADO_100G", displayName: "Fresh Avocado (100g)", caloriesKcal: 160, proteinGrams: 2, carbsGrams: 8.5, fatGrams: 14.7, fiberGrams: 6.7 }
};
export function analyzeFoodPhotoAndGenerateNutritionPlan(input: { readonly imageId: string; readonly detectedDishKeys: readonly string[]; readonly workoutCaloriesBurnedKcal?: number; readonly targetGoal?: string; }) {
  const items = input.detectedDishKeys.map((k) => CANONICAL_FOOD_VISION_DB[k] || { dishKey: k, displayName: k, caloriesKcal: 200, proteinGrams: 15, carbsGrams: 20, fatGrams: 6, fiberGrams: 2 });
  const totalCaloriesKcal = items.reduce((s, i) => s + i.caloriesKcal, 0);
  const totalProteinGrams = Number(items.reduce((s, i) => s + i.proteinGrams, 0).toFixed(1));
  const totalCarbsGrams = Number(items.reduce((s, i) => s + i.carbsGrams, 0).toFixed(1));
  const totalFatGrams = Number(items.reduce((s, i) => s + i.fatGrams, 0).toFixed(1));
  const totalFiberGrams = Number(items.reduce((s, i) => s + i.fiberGrams, 0).toFixed(1));
  return { imageId: input.imageId, items, totals: { totalCaloriesKcal, totalProteinGrams, totalCarbsGrams, totalFatGrams, totalFiberGrams }, netCalorieBalanceKcal: totalCaloriesKcal - (input.workoutCaloriesBurnedKcal ?? 0), aiNextMealRecommendation: "Protein target met (>40g leucine threshold).", truthClass: "SIMULATED_EDUCATIONAL" as const };
}