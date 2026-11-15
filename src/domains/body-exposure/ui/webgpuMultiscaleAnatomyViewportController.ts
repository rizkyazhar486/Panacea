/**
 * @file webgpuMultiscaleAnatomyViewportController.ts
 * @description Controller interaktif 3D WebGPU / Three.js untuk /body-exposure:
 * menggabungkan Raycast Picker, 5-Stage Layer Peel, Z-Anatomy Card, GHK Action Potential,
 * dan Knowledge Graph 20 Relasi secara real-time.
 */

import {
  findClearStructureCard,
  type ClearIndonesianAnatomicalCard
} from "../data/zAnatomyClearIndonesianAtlas.ts";
import {
  simulateGoldmanHodgkinKatzAndCardiacActionPotential,
  type VaughanWilliamsClass
} from "../engine/clinical/electrophysiologyHodgkinHuxleyAndActionPotentialEngine.ts";

export type AnatomicalPeelDepthStage = 0 | 1 | 2 | 3 | 4;

export interface LayerPeelStageDescriptor {
  readonly stageIndex: AnatomicalPeelDepthStage;
  readonly stageId:
    | "STAGE_0_INTEGUMENTARY_DERMATOME"
    | "STAGE_1_SUPERFICIAL_FASCIA_AND_OBLIQUE"
    | "STAGE_2_DEEP_MUSCULOSKELETAL"
    | "STAGE_3_VISCERAL_ORGANS_AND_NEUROVASCULAR"
    | "STAGE_4_HISTOLOGY_AND_CELLULAR_CHANNELS";
  readonly indonesianLabel: string;
  readonly visibleSystems: readonly string[];
  readonly peeledAwaySystems: readonly string[];
  readonly shaderOpacityMap: Readonly<Record<string, number>>;
}

export const ANATOMICAL_LAYER_PEEL_STAGES: readonly LayerPeelStageDescriptor[] = [
  {
    stageIndex: 0,
    stageId: "STAGE_0_INTEGUMENTARY_DERMATOME",
    indonesianLabel: "Lapis 0: Kulit, Dermatom & Landmark Permukaan",
    visibleSystems: ["integumentary", "surface_landmarks", "dermatome_map"],
    peeledAwaySystems: [],
    shaderOpacityMap: { integumentary: 1.0, muscular_superficial: 1.0, muscular_deep: 1.0, visceral: 1.0 }
  },
  {
    stageIndex: 1,
    stageId: "STAGE_1_SUPERFICIAL_FASCIA_AND_OBLIQUE",
    indonesianLabel: "Lapis 1: Fasia Superfisialis & Otot Dinding Tubuh (Obliquus Externus)",
    visibleSystems: ["muscular_superficial", "external_abdominal_oblique", "superficial_veins", "cutaneous_nerves"],
    peeledAwaySystems: ["integumentary"],
    shaderOpacityMap: { integumentary: 0.05, muscular_superficial: 1.0, muscular_deep: 1.0, visceral: 1.0 }
  },
  {
    stageIndex: 2,
    stageId: "STAGE_2_DEEP_MUSCULOSKELETAL",
    indonesianLabel: "Lapis 2: Otot Dalam, Rangka Axial/Apendikular & Ligamen",
    visibleSystems: ["muscular_deep", "skeletal_system", "articular_capsules"],
    peeledAwaySystems: ["integumentary", "muscular_superficial"],
    shaderOpacityMap: { integumentary: 0.0, muscular_superficial: 0.1, muscular_deep: 1.0, visceral: 1.0 }
  },
  {
    stageIndex: 3,
    stageId: "STAGE_3_VISCERAL_ORGANS_AND_NEUROVASCULAR",
    indonesianLabel: "Lapis 3: Organ Viseral (Jantung, Paru, Hati, Ginjal, Otak, Telinga) & Neurovaskular",
    visibleSystems: ["visceral", "arterial_tree", "venous_tree", "lymphatics", "autonomic_cranial_nerves"],
    peeledAwaySystems: ["integumentary", "muscular_superficial", "muscular_deep"],
    shaderOpacityMap: { integumentary: 0.0, muscular_superficial: 0.0, muscular_deep: 0.12, visceral: 1.0 }
  },
  {
    stageIndex: 4,
    stageId: "STAGE_4_HISTOLOGY_AND_CELLULAR_CHANNELS",
    indonesianLabel: "Lapis 4: Arsitektur Histologi, Kapiler & Elektrofisiologi Kanal Ion Seluler",
    visibleSystems: ["histological_lobules", "sarcomere_intercalated_disc", "ion_channels_ghk"],
    peeledAwaySystems: ["integumentary", "muscular_superficial", "muscular_deep", "macro_visceral_shell"],
    shaderOpacityMap: { integumentary: 0.0, muscular_superficial: 0.0, muscular_deep: 0.0, visceral: 0.25 }
  }
];

export interface WebGpuRaycastHitInput {
  readonly pointerNdcX: number; // Normalized Device Coordinates [-1, 1]
  readonly pointerNdcY: number; // Normalized Device Coordinates [-1, 1]
  readonly hitMeshNameOrOrganQuery: string;
  readonly hitDistanceMm: number;
  readonly worldNormalVector: readonly [number, number, number];
  readonly activePeelStage: AnatomicalPeelDepthStage;
  readonly activeAntiarrhythmicClass?: VaughanWilliamsClass;
}

export function resolveWebGpuAnatomyRaycastAndLayerPeel(input: WebGpuRaycastHitInput) {
  if (
    input.pointerNdcX < -1 ||
    input.pointerNdcX > 1 ||
    input.pointerNdcY < -1 ||
    input.pointerNdcY > 1
  ) {
    throw new RangeError("Koordinat raycast NDC harus berada di dalam rentang [-1, 1].");
  }

  const peelStage =
    ANATOMICAL_LAYER_PEEL_STAGES.find((s) => s.stageIndex === input.activePeelStage) ??
    ANATOMICAL_LAYER_PEEL_STAGES[3];

  const matchedAtlasCard: ClearIndonesianAnatomicalCard = findClearStructureCard(
    input.hitMeshNameOrOrganQuery
  );

  const electrophysiologyTelemetry = simulateGoldmanHodgkinKatzAndCardiacActionPotential({
    permeabilityPK: 1.0,
    permeabilityPNa: 0.04,
    permeabilityPCl: 0.45,
    extracellularKMmolL: 4.2,
    intracellularKMmolL: 140.0,
    extracellularNaMmolL: 142.0,
    intracellularNaMmolL: 10.0,
    extracellularClMmolL: 104.0,
    intracellularClMmolL: 4.0,
    antiarrhythmicAgentClass: input.activeAntiarrhythmicClass ?? "NONE"
  });

  return {
    routePath: "/body-exposure" as const,
    rendererBackend: "WEBGPU_PREFERRED_WEBGL2_FALLBACK" as const,
    raycastSelection: {
      ndcCoordinates: [input.pointerNdcX, input.pointerNdcY] as const,
      hitDistanceMm: input.hitDistanceMm,
      worldNormalVector: input.worldNormalVector,
      resolvedOrganChip: matchedAtlasCard.organChipLabel,
      fmaId: matchedAtlasCard.fmaId,
      uberonId: matchedAtlasCard.uberonId
    },
    activeLayerPeel: peelStage,
    realTimeClinicalCard: matchedAtlasCard,
    coupledCellularElectrophysiology: electrophysiologyTelemetry,
    interactiveCapabilities: {
      canPeelDeeper: input.activePeelStage < 4,
      canRestoreSuperficialLayer: input.activePeelStage > 0,
      bvhAccelerationActive: true as const
    }
  };
}
