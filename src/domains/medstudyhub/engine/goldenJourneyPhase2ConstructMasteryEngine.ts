import { evaluateCardiopulmonaryCouplingDeck } from "../../body-exposure/engine/cardiopulmonaryCouplingEngine.ts";

export interface VerifiedFma3DViewportContext {
  readonly fmaId: string;
  readonly canonicalNameEn: string;
  readonly sourceMeshName: string;
  readonly cameraPoseYawPitchDist: readonly [number, number, number];
  readonly visibleLayers: readonly string[];
}

export const TWENTY_VERIFIED_FMA_3D_CONTEXTS: readonly VerifiedFma3DViewportContext[] = [
  { fmaId: "FMA:7088", canonicalNameEn: "Heart", sourceMeshName: "Heart_Myocardium.g", cameraPoseYawPitchDist: [12, 6, 1.15], visibleLayers: ["cardiovascular", "skeletal"] },
  { fmaId: "FMA:7101", canonicalNameEn: "Left Ventricle", sourceMeshName: "Heart_Myocardium.g", cameraPoseYawPitchDist: [24, 8, 0.95], visibleLayers: ["cardiovascular"] },
  { fmaId: "FMA:3862", canonicalNameEn: "Left Anterior Descending Coronary Artery", sourceMeshName: "Heart_Myocardium.g", cameraPoseYawPitchDist: [18, 12, 0.85], visibleLayers: ["cardiovascular"] },
  { fmaId: "FMA:3734", canonicalNameEn: "Arch of Aorta", sourceMeshName: "Heart_Myocardium.g", cameraPoseYawPitchDist: [10, 14, 1.1], visibleLayers: ["cardiovascular"] },
  { fmaId: "FMA:7195", canonicalNameEn: "Lung", sourceMeshName: "Lung_Parenchyma_Bilateral.g", cameraPoseYawPitchDist: [0, 5, 1.25], visibleLayers: ["visceral", "skeletal"] },
  { fmaId: "FMA:7394", canonicalNameEn: "Trachea", sourceMeshName: "Lung_Parenchyma_Bilateral.g", cameraPoseYawPitchDist: [0, 10, 1.1], visibleLayers: ["visceral"] },
  { fmaId: "FMA:13295", canonicalNameEn: "Respiratory Diaphragm", sourceMeshName: "External_abdominal_oblique_left.g", cameraPoseYawPitchDist: [0, -8, 1.2], visibleLayers: ["muscular", "skeletal"] },
  { fmaId: "FMA:7203", canonicalNameEn: "Kidney", sourceMeshName: "Kidney_Nephron_Bilateral.g", cameraPoseYawPitchDist: [180, 4, 1.15], visibleLayers: ["visceral", "cardiovascular"] },
  { fmaId: "FMA:9704", canonicalNameEn: "Ureter", sourceMeshName: "Kidney_Nephron_Bilateral.g", cameraPoseYawPitchDist: [15, 0, 1.25], visibleLayers: ["visceral"] },
  { fmaId: "FMA:7197", canonicalNameEn: "Liver", sourceMeshName: "Lung_Parenchyma_Bilateral.g", cameraPoseYawPitchDist: [-12, 4, 1.15], visibleLayers: ["visceral"] },
  { fmaId: "FMA:7202", canonicalNameEn: "Gallbladder", sourceMeshName: "Lung_Parenchyma_Bilateral.g", cameraPoseYawPitchDist: [-18, -4, 0.95], visibleLayers: ["visceral"] },
  { fmaId: "FMA:7198", canonicalNameEn: "Pancreas", sourceMeshName: "Kidney_Nephron_Bilateral.g", cameraPoseYawPitchDist: [8, 2, 1.05], visibleLayers: ["visceral"] },
  { fmaId: "FMA:50801", canonicalNameEn: "Brain", sourceMeshName: "Brain_Cerebral_Cortex.g", cameraPoseYawPitchDist: [20, 15, 0.9], visibleLayers: ["nervous", "skeletal"] },
  { fmaId: "FMA:7647", canonicalNameEn: "Spinal Cord", sourceMeshName: "Brain_Cerebral_Cortex.g", cameraPoseYawPitchDist: [180, 0, 1.4], visibleLayers: ["nervous", "skeletal"] },
  { fmaId: "FMA:9668", canonicalNameEn: "Thyroid Gland", sourceMeshName: "Brain_Cerebral_Cortex.g", cameraPoseYawPitchDist: [0, 8, 0.85], visibleLayers: ["visceral"] },
  { fmaId: "FMA:7196", canonicalNameEn: "Spleen", sourceMeshName: "Kidney_Nephron_Bilateral.g", cameraPoseYawPitchDist: [35, 6, 1.1], visibleLayers: ["lymphoid"] },
  { fmaId: "FMA:13335", canonicalNameEn: "External Abdominal Oblique Muscle", sourceMeshName: "External_abdominal_oblique_left.g", cameraPoseYawPitchDist: [28, 4, 1.3], visibleLayers: ["muscular"] },
  { fmaId: "FMA:9611", canonicalNameEn: "Femur", sourceMeshName: "External_abdominal_oblique_left.g", cameraPoseYawPitchDist: [12, -10, 1.45], visibleLayers: ["skeletal"] },
  { fmaId: "FMA:16585", canonicalNameEn: "Pelvis", sourceMeshName: "External_abdominal_oblique_left.g", cameraPoseYawPitchDist: [0, 4, 1.35], visibleLayers: ["skeletal"] },
  { fmaId: "FMA:52780", canonicalNameEn: "Ear", sourceMeshName: "Brain_Cerebral_Cortex.g", cameraPoseYawPitchDist: [85, 6, 0.75], visibleLayers: ["nervous", "skeletal"] }
];

export function restore3DViewportForVerifiedFma(fmaId: string): VerifiedFma3DViewportContext {
  const found = TWENTY_VERIFIED_FMA_3D_CONTEXTS.find((c) => c.fmaId === fmaId);
  if (!found) {
    throw new RangeError("Fail-closed: FMA ID '" + fmaId + "' is not in the 20-structure verified registry (Unknown).");
  }
  return found;
}

export interface ConstructMasteryProfile {
  readonly constructId: string;
  readonly fmaId: string;
  readonly domain: "ANATOMY" | "PHYSIOLOGY" | "CLINICAL_CORRELATION";
  readonly thetaEstimate: number;
  readonly standardError: number;
  readonly itemIdsAttempted: readonly string[];
  readonly sessionIds: readonly string[];
}

// Selects next question by targeting the learner's WEAKEST construct first
export function selectNextQuestionByWeakestConstruct(
  profiles: readonly ConstructMasteryProfile[],
  availableItemBank: readonly { readonly itemId: string; readonly constructId: string; readonly fmaId: string; readonly difficultyB: number }[]
) {
  if (profiles.length === 0) throw new RangeError("Construct profiles cannot be empty.");
  const sortedConstructs = [...profiles].sort((a, b) => a.thetaEstimate - b.thetaEstimate);
  for (const weakest of sortedConstructs) {
    const candidateItems = availableItemBank.filter(
      (item) => item.constructId === weakest.constructId && !weakest.itemIdsAttempted.includes(item.itemId)
    );
    if (candidateItems.length > 0) {
      const chosen = candidateItems[0];
      const viewport3D = restore3DViewportForVerifiedFma(chosen.fmaId);
      return {
        bankExhausted: false as const,
        selectedItem: chosen,
        targetedWeakestConstructId: weakest.constructId,
        targetedConstructTheta: weakest.thetaEstimate,
        restoredViewport3D: viewport3D,
        assessmentLabel: "educational formative assessment" as const
      };
    }
  }
  return {
    bankExhausted: true as const,
    selectedItem: null,
    gracefulStateMessage: "All items across tracked constructs have been completed for this session." as const,
    assessmentLabel: "educational formative assessment" as const
  };
}

// Prometheus Cardiopulmonary Interactive Lesson driven strictly by simulation engine values
export function evaluatePrometheusCardiopulmonaryInteractiveLesson(params: {
  readonly heartRateBpm: number;
  readonly preloadEdvMl: number;
  readonly afterloadEsvMl: number;
  readonly contractilityEesMmHgPerMl: number;
  readonly learnerPredictedStrokeVolumeDirection: "INCREASE" | "DECREASE" | "UNCHANGED";
}) {
  if (params.heartRateBpm < 30 || params.heartRateBpm > 240) {
    throw new RangeError("Boundary rejected: heartRateBpm must be between 30 and 240 bpm.");
  }
  const baseline = evaluateCardiopulmonaryCouplingDeck({
    heartRateBpm: 72,
    endDiastolicVolumeMl: 120,
    endSystolicVolumeMl: 50,
    endSystolicElastanceMmHgPerMl: 2.0,
    unstressedVolumeV0Ml: 10,
    respiratoryRateBpm: 14,
    tidalVolumeMl: 500,
    deadSpaceMl: 150,
    inspiredFiO2Fraction: 0.21,
    hemoglobinGPerDl: 15.0,
    estimatedSao2Pct: 98
  });
  const perturbed = evaluateCardiopulmonaryCouplingDeck({
    heartRateBpm: params.heartRateBpm,
    endDiastolicVolumeMl: params.preloadEdvMl,
    endSystolicVolumeMl: params.afterloadEsvMl,
    endSystolicElastanceMmHgPerMl: params.contractilityEesMmHgPerMl,
    unstressedVolumeV0Ml: 10,
    respiratoryRateBpm: 14,
    tidalVolumeMl: 500,
    deadSpaceMl: 150,
    inspiredFiO2Fraction: 0.21,
    hemoglobinGPerDl: 15.0,
    estimatedSao2Pct: 98
  });
  const actualDirection =
    perturbed.strokeVolumeMl > baseline.strokeVolumeMl ? "INCREASE" :
    perturbed.strokeVolumeMl < baseline.strokeVolumeMl ? "DECREASE" : "UNCHANGED";
  const predictionCorrect = params.learnerPredictedStrokeVolumeDirection === actualDirection;

  return {
    truthClass: "SIMULATED" as const,
    disclaimer: "SIMULATED: Educational mechanistic model; not a clinical patient predictor." as const,
    baselineStrokeVolumeMl: baseline.strokeVolumeMl,
    perturbedStrokeVolumeMl: perturbed.strokeVolumeMl,
    perturbedCardiacOutputLPerMin: perturbed.cardiacOutputLPerMin,
    perturbedOxygenDeliveryMlPerMin: perturbed.oxygenDeliveryMlPerMin,
    actualDirection,
    predictionCorrect,
    engineDrivenFeedback: "Engine SV changed from " + baseline.strokeVolumeMl + " mL to " + perturbed.strokeVolumeMl + " mL (CO " + perturbed.cardiacOutputLPerMin + " L/min, DO2 " + perturbed.oxygenDeliveryMlPerMin + " mL/min)."
  };
}