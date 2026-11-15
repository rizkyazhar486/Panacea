export { selubungAtlas, atlasEnvelope } from "./selubungAtlas.ts";
export { toggleOrPeelAtlasLayer, SHIPPED_Z_ANATOMY_GLB_LAYERS, type LayerPeelState } from "./anatomy/atlasEnvelope.ts";
export { faktaMilikOrgan, organFactIndex, kunciMilikOrgan, organKeyIndex, type OrganFactCandidate, type CalonOrgan } from "./faktaMilikOrgan.ts";
export { ORGAN_FACT_REGISTRY, organFactKey } from "./anatomy/organFactIndex.ts";
export { kalimatPertama, firstSentence } from "./kalimatPertama.ts";
export { jenisDariNamaStruktur, structureTypeFromName, jenisDariNamaStruktur as structureKindFromName } from "./jenisStruktur.ts";
export { type CanonicalStructureKind } from "./anatomy/structureKindFromName.ts";
export { namaBagianAtlas, atlasRegionNames } from "./namaBagianAtlas.ts";
export { ATLAS_REGION_NAMES, type CanonicalAnatomicalRegionId } from "./anatomy/atlasRegionNames.ts";
export { searchStructures, type StructureSearchResult } from "./anatomy/structureSearch.ts";
export { diagnosticImagingEngine, kaloLumenDicomEngine, createDefaultImagingState, createDefaultKaloLumenState, type DiagnosticImagingState } from "./imaging/diagnosticImagingEngine.ts";
export { FRAME_BUDGET_MS, nextAutoPreset, computeSemanticZoomRatio, createSceneShellLifecycleManager, probeWebGpuPhaseZeroCapability, type QualityPresetId } from "./rendering/sceneShellLifecycleAndQuality.ts";
export { evaluateHraFemaleV15AdmissionGate, getHonestGapBadgeForContext, P0_HONEST_COVERAGE_GAPS, type ReferenceBodySexMode } from "./data/hraFemaleAdmissionAndHonestGapEngine.ts";
export {
  verifyAndAdmitHraFemaleV15FromRepoArtifacts,
  executeSourceBackedMultiscaleGapHandoff,
  executeTrack3AutophagyMitophagyAndDeNovoTherapeutics,
  executeTrack4WearablesSensoriumAnd3DBiomechanics,
  buildClinicalReviewPacketForH3Signoff,
  type MultiscaleHandoffDomain,
  type SourceBackedMultiscaleHandoffResult
} from "./data/openGapResolutionAndAiTakeoverEngine.ts";
