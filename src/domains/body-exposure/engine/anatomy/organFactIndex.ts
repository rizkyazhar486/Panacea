import { type CanonicalAnatomicalRegionId } from "./atlasRegionNames.ts";
import { type CanonicalStructureKind } from "./structureKindFromName.ts";

export interface OrganFactCandidate {
  readonly sourceMeshName: string;
  readonly sourceFile: string;
  readonly referenceSpaceId: "Z_ANATOMY_METRIC_RIGHT_HANDED_V1" | "HUBMAP_HRA_FEMALE_V1_5_REGIONAL";
  readonly fmaId: string;
  readonly uberonId: string;
  readonly regionId: CanonicalAnatomicalRegionId;
  readonly layerId: CanonicalStructureKind;
  readonly supportsStage2Physiology: boolean;
  readonly supportsStage3Clinical: boolean;
  readonly deepLinkedLegacyStudios: readonly string[];
}
export type CalonOrgan = OrganFactCandidate;

export const ORGAN_FACT_REGISTRY: readonly OrganFactCandidate[] = [
  {
    sourceMeshName: "Heart_Myocardium.g",
    sourceFile: "/anatomy/cardiovascular.glb",
    referenceSpaceId: "Z_ANATOMY_METRIC_RIGHT_HANDED_V1",
    fmaId: "FMA:7088",
    uberonId: "UBERON:0000948",
    regionId: "thorax",
    layerId: "cardiovascular",
    supportsStage2Physiology: true,
    supportsStage3Clinical: true,
    deepLinkedLegacyStudios: ["CardiopulmonaryCouplingDeck", "CoronaryTerritoryPanel", "PerfusionChainPanel", "ReferredPainDermatomeStudio"]
  },
  {
    sourceMeshName: "External_abdominal_oblique_left.g",
    sourceFile: "/anatomy/muscular.glb",
    referenceSpaceId: "Z_ANATOMY_METRIC_RIGHT_HANDED_V1",
    fmaId: "FMA:13335",
    uberonId: "UBERON:0001116",
    regionId: "abdomen",
    layerId: "muscular",
    supportsStage2Physiology: true,
    supportsStage3Clinical: true,
    deepLinkedLegacyStudios: ["SoftTissueBiomechanicsDeck", "ReferredPainDermatomeStudio"]
  },
  {
    sourceMeshName: "Lung_Parenchyma_Bilateral.g",
    sourceFile: "/anatomy/visceral.glb",
    referenceSpaceId: "Z_ANATOMY_METRIC_RIGHT_HANDED_V1",
    fmaId: "FMA:7195",
    uberonId: "UBERON:0002048",
    regionId: "thorax",
    layerId: "visceral",
    supportsStage2Physiology: true,
    supportsStage3Clinical: true,
    deepLinkedLegacyStudios: ["CardiopulmonaryCouplingDeck", "DiagnosticImagingStudio"]
  },
  {
    sourceMeshName: "Kidney_Nephron_Bilateral.g",
    sourceFile: "/anatomy/visceral.glb",
    referenceSpaceId: "Z_ANATOMY_METRIC_RIGHT_HANDED_V1",
    fmaId: "FMA:7203",
    uberonId: "UBERON:0002113",
    regionId: "abdomen",
    layerId: "visceral",
    supportsStage2Physiology: true,
    supportsStage3Clinical: true,
    deepLinkedLegacyStudios: ["PerfusionChainPanel", "ReferredPainDermatomeStudio"]
  },
  {
    sourceMeshName: "Brain_Cerebral_Cortex.g",
    sourceFile: "/anatomy/nervous.glb",
    referenceSpaceId: "Z_ANATOMY_METRIC_RIGHT_HANDED_V1",
    fmaId: "FMA:50801",
    uberonId: "UBERON:0000955",
    regionId: "head_neck",
    layerId: "nervous",
    supportsStage2Physiology: true,
    supportsStage3Clinical: true,
    deepLinkedLegacyStudios: ["OculomotorLesionLab", "DiagnosticImagingStudio"]
  }
];

export function organFactKey(meshName: string): string {
  return (meshName || "").trim();
}
export function organFactIndex(meshName: string): OrganFactCandidate | null {
  const key = organFactKey(meshName);
  return ORGAN_FACT_REGISTRY.find((item) => item.sourceMeshName === key || item.fmaId === key) ?? null;
}
export const kunciMilikOrgan = organFactKey;
export const faktaMilikOrgan = organFactIndex;