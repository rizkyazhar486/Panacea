// ============================================================================
// PANACEAMED — BODY EXPOSURE PUBLIC DOMAIN API (CURATED SINGLE ENTRYPOINT)
// ============================================================================

// ── MODEL ──────────────────────────────────────────────
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

// ── ENGINE: GROSS ANATOMY ────────────────────────────────
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
  FRAME_BUDGET_MS,
  nextAutoPreset,
  computeSemanticZoomRatio,
  createSceneShellLifecycleManager,
  probeWebGpuPhaseZeroCapability,
  type StructureSearchResult,
  type QualityPresetId
} from "./engine/structureAtlas.ts";

// ── ENGINE: IMAGING ────────────────────────────────────
export {
  diagnosticImagingEngine,
  kaloLumenDicomEngine,
  createDefaultImagingState,
  createDefaultKaloLumenState,
  type DiagnosticImagingState
} from "./engine/structureAtlas.ts";

// ── ENGINE: PHYSIOLOGY ─────────────────────────────────
export { evaluateCardiopulmonaryCouplingDeck, type CardiopulmonaryCouplingInput } from "./engine/cardiopulmonaryCouplingEngine.ts";
export { computeWiggersCardiacCyclePressure, computeKroghCylinderOxygenDiffusion } from "./engine/wiggersAndKroghPhysiologyEngine.ts";
export { simulateRenalAutoregulationAndCountercurrent } from "./engine/renalNephronAutoregulationEngine.ts";
export { executeCrossOrganCoupledSimulation } from "./engine/crossOrganPhysiologicalCouplingEngine.ts";
export { simulateHepatobiliaryPancreaticPostprandialDynamics } from "./engine/hepatobiliaryPancreaticAndLaparoscopicEngine.ts";

// ── ENGINE: CLINICAL CORRELATION ───────────────────────
// Single unified vascularTerritoryEngine block (Zero Duplicate Exports)
export {
  AHA17_SEGMENT_COUNT,
  ATLAS_REFERENCE_LABEL,
  AHA17_CORONARY_TERRITORY_SOURCE,
  AHA17_LIMITATIONS,
  AHA17_TERRITORY_LIMITATIONS,
  AHA17_SOURCES,
  DOMINANCE_PREVALENCE,
  AHA17_RINGS,
  AHA17_SEGMENT_NAMES,
  AHA17_CORONARY_TERRITORY_TABLE,
  branchForSegment,
  territoryForArtery,
  mapCoronaryToAHA17,
  evaluateAHA17PerfusionBurden
} from "./engine/clinical/vascularTerritoryUnified.ts";
export { evaluateCabgEducationalSurgicalSimulation } from "./engine/universalSurgicalCabgAndProceduralEngine.ts";
export { evaluateLaparoscopicCholecystectomyCriticalViewOfSafety } from "./engine/hepatobiliaryPancreaticAndLaparoscopicEngine.ts";
export {
  simulatePink1ParkinMitophagyAndProtonMotiveForce,
  mapVisceralOrganToReferredPainDermatome,
  bindAuthorizedPatientBiometricToOrganOverlay,
  verifyCrossEngineCardiopulmonaryConsistency
} from "./engine/tenMergedPillarsUnifiedWorkbenchEngine.ts";

// ── ENGINE: BIOMECHANICS & GAIT ────────────────────────
export {
  executeTrack4WearablesSensoriumAnd3DBiomechanics,
  executeSourceBackedMultiscaleGapHandoff,
  type MultiscaleHandoffDomain,
  type SourceBackedMultiscaleHandoffResult
} from "./engine/structureAtlas.ts";

// ── ADAPTERS ───────────────────────────────────────────
export {
  evaluateHraFemaleV15AdmissionGate,
  getHonestGapBadgeForContext,
  verifyAndAdmitHraFemaleV15FromRepoArtifacts,
  executeTrack3AutophagyMitophagyAndDeNovoTherapeutics,
  buildClinicalReviewPacketForH3Signoff
} from "./engine/structureAtlas.ts";

// ── UI (cross-domain only) ───────────────────────────────
// @internal studio decks (KaloLumenVolumetricStudio, ReferredPainDermatomeStudio,
// CardiopulmonaryCouplingDeck, SoftTissueBiomechanicsDeck, FiveStageVisualAtlas,
// OrganBiometricOverlayCard) are reachable from BodyExposureAtlasHome depth panels,
// and are intentionally excluded from the domain public API.
export {
  BodyExposureAtlasHome,
  PRIMARY_VIEWPORT_CONTROLS,
  createInitialAtlasHomeState,
  pickStructureInCanonicalScene,
  transitionAtlasStage,
  resolveLegacyStudioRouteRedirect,
  type AtlasStageId,
  type BodyExposureAtlasHomeState
} from "./ui/BodyExposureAtlasHome.ts";
export {
  resolveUnifiedBodyNavigation,
  type UnifiedBodyNavigationTarget
} from "./ui/bodyExposureReactBridge.ts";