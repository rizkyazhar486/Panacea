export { atlasEnvelope, selubungAtlas, toggleOrPeelAtlasLayer, SHIPPED_Z_ANATOMY_GLB_LAYERS, type LayerPeelState } from "./anatomy/atlasEnvelope.ts";
export { organFactIndex, faktaMilikOrgan, organFactKey, kunciMilikOrgan, ORGAN_FACT_REGISTRY, type OrganFactCandidate, type CalonOrgan } from "./anatomy/organFactIndex.ts";
export { firstSentence, kalimatPertama } from "./anatomy/firstSentence.ts";
export { structureKindFromName, jenisDariNamaStruktur, type CanonicalStructureKind } from "./anatomy/structureKindFromName.ts";
export { atlasRegionNames, namaBagianAtlas, ATLAS_REGION_NAMES, type CanonicalAnatomicalRegionId } from "./anatomy/atlasRegionNames.ts";
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
