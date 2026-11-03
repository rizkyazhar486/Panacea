// ============================================================================
// PANACEAMED — BODY EXPOSURE PUBLIC DOMAIN API (CURATED SINGLE ENTRYPOINT)
// ============================================================================

// — MODEL & DATA CONTRACTS —
export {
  ORGAN_FACT_REGISTRY,
  SHIPPED_Z_ANATOMY_GLB_LAYERS,
  ATLAS_REGION_NAMES,
  P0_HONEST_COVERAGE_GAPS,
  type OrganFactCandidate,
  type CalonOrgan,
  type LayerPeelState,
  type CanonicalStructureKind,
  type CanonicalAnatomicalRegionId,
  type ReferenceBodySexMode
} from "./engine/structureAtlas.ts";

// — GROSS ANATOMY ENGINE —
export {
  atlasEnvelope,
  selubungAtlas,
  toggleOrPeelAtlasLayer,
  organFactIndex,
  faktaMilikOrgan,
  organFactKey,
  kunciMilikOrgan,
  firstSentence,
  kalimatPertama,
  structureKindFromName,
  jenisDariNamaStruktur,
  atlasRegionNames,
  namaBagianAtlas,
  searchStructures,
  type StructureSearchResult
} from "./engine/structureAtlas.ts";

// — RENDERING, QUALITY & LIFECYCLE ENGINE —
export {
  FRAME_BUDGET_MS,
  nextAutoPreset,
  computeSemanticZoomRatio,
  createSceneShellLifecycleManager,
  probeWebGpuPhaseZeroCapability,
  type QualityPresetId
} from "./engine/structureAtlas.ts";

// — IMAGING ENGINE (CT / MRI / MPR) —
export {
  diagnosticImagingEngine,
  kaloLumenDicomEngine,
  createDefaultImagingState,
  createDefaultKaloLumenState,
  type DiagnosticImagingState
} from "./engine/structureAtlas.ts";

// — PHYSIOLOGY SIMULATION ENGINE —
export { evaluateCardiopulmonaryCouplingDeck, type CardiopulmonaryCouplingInput } from "./engine/cardiopulmonaryCouplingEngine.ts";
export { computeWiggersCardiacCyclePressure, computeKroghCylinderOxygenDiffusion } from "./engine/wiggersAndKroghPhysiologyEngine.ts";
export { simulateRenalAutoregulationAndCountercurrent } from "./engine/renalNephronAutoregulationEngine.ts";
export { executeCrossOrganCoupledSimulation } from "./engine/crossOrganPhysiologicalCouplingEngine.ts";
export { simulateHepatobiliaryPancreaticPostprandialDynamics } from "./engine/hepatobiliaryPancreaticAndLaparoscopicEngine.ts";

// — CLINICAL CORRELATION & SURGICAL SIMULATION —
export { evaluateCabgEducationalSurgicalSimulation } from "./engine/universalSurgicalCabgAndProceduralEngine.ts";
export { evaluateLaparoscopicCholecystectomyCriticalViewOfSafety } from "./engine/hepatobiliaryPancreaticAndLaparoscopicEngine.ts";
export {
  simulatePink1ParkinMitophagyAndProtonMotiveForce,
  mapVisceralOrganToReferredPainDermatome,
  bindAuthorizedPatientBiometricToOrganOverlay,
  verifyCrossEngineCardiopulmonaryConsistency
} from "./engine/tenMergedPillarsUnifiedWorkbenchEngine.ts";

// — SOURCE ADMISSION & HONEST GAP REVIEW —
export {
  evaluateHraFemaleV15AdmissionGate,
  getHonestGapBadgeForContext
} from "./engine/structureAtlas.ts";

// — UI (CANONICAL ATLAS HOME ENTRYPOINT) —
export {
  BodyExposureAtlasHome,
  PRIMARY_VIEWPORT_CONTROLS,
  createInitialAtlasHomeState,
  pickStructureInCanonicalScene,
  transitionAtlasStage,
  resolveLegacyStudioRouteRedirect,
  type AtlasStageId,
  type BodyExposureAtlasHomeState
} from "./ui/BodyExposureAtlasHome.tsx";
// — WAVE 14: OPEN GAP RESOLUTION & AI TAKEOVER (TRACKS 3 & 4) —
export {
  verifyAndAdmitHraFemaleV15FromRepoArtifacts,
  executeSourceBackedMultiscaleGapHandoff,
  executeTrack3AutophagyMitophagyAndDeNovoTherapeutics,
  executeTrack4WearablesSensoriumAnd3DBiomechanics,
  buildClinicalReviewPacketForH3Signoff,
  type MultiscaleHandoffDomain,
  type SourceBackedMultiscaleHandoffResult
} from "./engine/structureAtlas.ts";

// — WAVE 15: UNIFIED REACT NAVIGATION & ENTRYPOINT BRIDGE —
export {
  resolveUnifiedBodyNavigation,
  type UnifiedBodyNavigationTarget
} from "./ui/bodyExposureReactBridge.ts";
