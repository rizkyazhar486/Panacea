import { GOLDEN_JOURNEY_STEPS } from "./cardiovascular-golden-journey.ts";
export type SupportedGoldenSystem = "CARDIOVASCULAR" | "RESPIRATORY_BX4" | "NEUROLOGICAL_BX1";
export type NeuroTractType = "CORTICOSPINAL" | "SPINOTHALAMIC" | "DORSAL_COLUMN_MEDIAL_LEMNISCUS";
export type NeuroLesionLevel = "CEREBRAL_CORTEX" | "INTERNAL_CAPSULE" | "MEDULLARY_PYRAMID" | "SPINAL_CORD_CERVICAL" | "SPINAL_CORD_THORACIC";
export function localizeNeurologicalPathwayLesion(tract: NeuroTractType, lesionLevel: NeuroLesionLevel, lesionSide: "LEFT" | "RIGHT") {
  const aboveSpinalCord = lesionLevel === "CEREBRAL_CORTEX" || lesionLevel === "INTERNAL_CAPSULE" || lesionLevel === "MEDULLARY_PYRAMID";
  const deficitSide = aboveSpinalCord ? ("CONTRALATERAL" as const) : (tract === "SPINOTHALAMIC" ? ("CONTRALATERAL" as const) : ("IPSILATERAL" as const));
  return { tract, lesionLevel, lesionSide, deficitSide, decussationReference: "Medullary/Spinal Decussation", truthClass: "SIMULATED_EDUCATIONAL" as const };
}
export function executeMultisystemGoldenJourney(system: SupportedGoldenSystem, learnerId: string) {
  const leadBot = system === "NEUROLOGICAL_BX1" ? "DR_SATORU_SENSEI" : system === "RESPIRATORY_BX4" ? "DR_MAKIMA_SENPAI" : "DR_SENKU_KUN";
  return { system, learnerId, completedSteps: [...GOLDEN_JOURNEY_STEPS], leadSparringBot: leadBot, restoredViewportBookmark: { structureId: "FMA:7101", system, restored: true as const }, truthClass: "SIMULATED_EDUCATIONAL" as const };
}