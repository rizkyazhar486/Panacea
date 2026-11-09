export interface FoodPhotoNutritionEstimateInput {
  readonly recognizedDishName: string;
  readonly estimatedPortionGramsPoint: number;
  readonly portionUncertaintyFraction0to1: number; // e.g., 0.20 for +/- 20% visual depth uncertainty
  readonly carbohydrateGramsPer100g: number;
  readonly proteinGramsPer100g: number;
  readonly fatGramsPer100g: number;
  readonly fiberGramsPer100g: number;
  readonly glycemicIndex0to100: number;
}

// Directive 036: Never fabricate exact nutritional values from photographs without indicating uncertainty
export function evaluateFoodPhotoNutritionWithUncertaintyBounds(input: FoodPhotoNutritionEstimateInput) {
  if (input.estimatedPortionGramsPoint <= 0 || input.portionUncertaintyFraction0to1 < 0 || input.portionUncertaintyFraction0to1 >= 1) {
    throw new RangeError("Invalid portion grams or uncertainty fraction.");
  }
  const scale = input.estimatedPortionGramsPoint / 100;
  const carbG = Number((input.carbohydrateGramsPer100g * scale).toFixed(1));
  const protG = Number((input.proteinGramsPer100g * scale).toFixed(1));
  const fatG = Number((input.fatGramsPer100g * scale).toFixed(1));
  const fiberG = Number((input.fiberGramsPer100g * scale).toFixed(1));

  // Atwater Metabolizable Energy: 4 kcal/g carb, 4 kcal/g protein, 9 kcal/g fat, 2 kcal/g fermentable fiber
  const pointKcal = Math.round(4 * carbG + 4 * protG + 9 * fatG + 2 * fiberG);
  const minKcal95Ci = Math.round(pointKcal * (1 - input.portionUncertaintyFraction0to1));
  const maxKcal95Ci = Math.round(pointKcal * (1 + input.portionUncertaintyFraction0to1));

  const netCarbsG = Math.max(0, carbG - fiberG);
  const glycemicLoad = Number(((input.glycemicIndex0to100 * netCarbsG) / 100).toFixed(1));

  return {
    recognizedDishName: input.recognizedDishName,
    energyKcalEstimate: {
      pointEstimateKcal: pointKcal,
      lowerBound95CiKcal: minKcal95Ci,
      upperBound95CiKcal: maxKcal95Ci,
      uncertaintyExplicitlyDisclosed: true as const
    },
    macronutrientsGrams: { carbohydrateG: carbG, proteinG: protG, fatG, dietaryFiberG: fiberG },
    glycemicLoad,
    glycemicClassification: glycemicLoad >= 20 ? ("HIGH_GLYCEMIC_LOAD" as const) : glycemicLoad >= 11 ? ("MODERATE_GLYCEMIC_LOAD" as const) : ("LOW_GLYCEMIC_LOAD" as const),
    truthClass: "ESTIMATED_WITH_UNCERTAINTY" as const
  };
}