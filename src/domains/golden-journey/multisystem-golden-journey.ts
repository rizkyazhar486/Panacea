import { GOLDEN_JOURNEY_STEPS, type GoldenJourneyStepId } from "./cardiovascular-golden-journey.ts";
import { type AnimeBotId } from "../prometheus/competitive-bots/anime-sparring-arena.ts";

export type SupportedGoldenSystem = "CARDIOVASCULAR" | "RESPIRATORY_BX4" | "NEUROLOGICAL_BX1";

export type NeuroTractType = "CORTICOSPINAL" | "SPINOTHALAMIC" | "DORSAL_COLUMN_MEDIAL_LEMNISCUS";
export type NeuroLesionLevel =
  | "CEREBRAL_CORTEX"
  | "INTERNAL_CAPSULE"
  | "MEDULLARY_PYRAMID"
  | "SPINAL_CORD_CERVICAL"
  | "SPINAL_CORD_THORACIC";

export interface NeuroLesionLocalizationResult {
  readonly tract: NeuroTractType;
  readonly lesionLevel: NeuroLesionLevel;
  readonly lesionSide: "LEFT" | "RIGHT";
  readonly deficitSide: "IPSILATERAL" | "CONTRALATERAL";
  readonly decussationReference: string;
  readonly truthClass: "SIMULATED_EDUCATIONAL";
}

export function localizeNeurologicalPathwayLesion(
  tract: NeuroTractType,
  lesionLevel: NeuroLesionLevel,
  lesionSide: "LEFT" | "RIGHT"
): NeuroLesionLocalizationResult {
  const aboveSpinalCord =
    lesionLevel === "CEREBRAL_CORTEX" ||
    lesionLevel === "INTERNAL_CAPSULE" ||
    lesionLevel === "MEDULLARY_PYRAMID";
  const deficitSide = aboveSpinalCord
    ? "CONTRALATERAL"
    : tract === "SPINOTHALAMIC"
      ? "CONTRALATERAL"
      : "IPSILATERAL";
  const decussationReference =
    tract === "CORTICOSPINAL"
      ? "Pyramidal decussation at caudal medulla (cervicomedullary junction)"
      : tract === "DORSAL_COLUMN_MEDIAL_LEMNISCUS"
        ? "Internal arcuate fibers at caudal medulla (nucleus gracilis/cuneatus)"
        : "Anterior white commissure (1-2 spinal segments rostral to entry)";
  return {
    tract,
    lesionLevel,
    lesionSide,
    deficitSide,
    decussationReference,
    truthClass: "SIMULATED_EDUCATIONAL"
  };
}

export function executeMultisystemGoldenJourney(system: SupportedGoldenSystem, learnerId: string) {
  const systemConfig: Record<
    SupportedGoldenSystem,
    { rootOrganId: string; substructureId: string; cellularId: string; molecularId: string; leadBot: AnimeBotId }
  > = {
    CARDIOVASCULAR: {
      rootOrganId: "FMA:7088",
      substructureId: "FMA:7101",
      cellularId: "CL:0002131",
      molecularId: "PATHWAY:CICR_ECC_SERCA2A",
      leadBot: "DR_SENKU_KUN"
    },
    RESPIRATORY_BX4: {
      rootOrganId: "FMA:7195",
      substructureId: "FMA:7200_ALVEOLAR_ACINUS",
      cellularId: "CL:0002062_TYPE_I_II_PNEUMOCYTE",
      molecularId: "PATHWAY:VQ_GAS_EXCHANGE_SURFACTANT_DPPC",
      leadBot: "DR_MAKIMA_SENPAI"
    },
    NEUROLOGICAL_BX1: {
      rootOrganId: "FMA:50801_BRAIN_AND_CORD",
      substructureId: "FMA:72617_LATERAL_CORTICOSPINAL_TRACT",
      cellularId: "CL:0000540_UPPER_LOWER_MOTOR_NEURON",
      molecularId: "PATHWAY:VOLTAGE_GATED_NAV1_6_GLUTAMATE_SYNAPSE",
      leadBot: "DR_SATORU_SENSEI"
    }
  };
  const cfg = systemConfig[system];
  const steps: readonly GoldenJourneyStepId[] = [...GOLDEN_JOURNEY_STEPS];
  return {
    system,
    learnerId,
    completedSteps: steps,
    leadSparringBot: cfg.leadBot,
    traversedNodes: [cfg.rootOrganId, cfg.substructureId, cfg.cellularId, cfg.molecularId],
    restoredViewportBookmark: { structureId: cfg.substructureId, system, restored: true as const },
    truthClass: "SIMULATED_EDUCATIONAL" as const
  };
}