import {
  atlasEnvelope,
  toggleOrPeelAtlasLayer,
  organFactIndex,
  ORGAN_FACT_REGISTRY,
  searchStructures,
  firstSentence,
  atlasRegionNames,
  createDefaultImagingState,
  computeSemanticZoomRatio,
  getHonestGapBadgeForContext,
  type OrganFactCandidate,
  type LayerPeelState,
  type CanonicalStructureKind,
  type CanonicalAnatomicalRegionId,
  type ReferenceBodySexMode
} from "../engine/structureAtlas.ts";
import { tBodyExposure, type SupportedLocale } from "../../../locales/bodyExposureLocales.ts";
import { evaluateCardiopulmonaryCouplingDeck } from "../engine/cardiopulmonaryCouplingEngine.ts";
import { mapVisceralOrganToReferredPainDermatome } from "../engine/tenMergedPillarsUnifiedWorkbenchEngine.ts";

export type AtlasStageId = "STAGE_1_ANATOMY" | "STAGE_2_LIVING_PHYSIOLOGY" | "STAGE_3_CLINICAL";

export interface BodyExposureAtlasHomeState {
  readonly locale: SupportedLocale;
  readonly referenceBodyMode: ReferenceBodySexMode;
  readonly activeStage: AtlasStageId;
  readonly activeRegionFilter: CanonicalAnatomicalRegionId | "ALL";
  readonly layers: Readonly<Record<CanonicalStructureKind, LayerPeelState>>;
  readonly selectedStructure: OrganFactCandidate | null;
  readonly isolatedMeshName: string | null;
  readonly fadedOthers: boolean;
  readonly explodedView: boolean;
  readonly crossSectionClipPlane: boolean;
  readonly searchQuery: string;
  readonly cameraDistanceMeters: number;
  readonly activeDepthStudioPanel: string | null;
  readonly actionInFlightGuard: boolean;
}

// Primary viewport controls strictly capped at <= 6 (RUTHLESS-SIMPLICITY.md)
export const PRIMARY_VIEWPORT_CONTROLS = [
  "1_SEARCH_STRUCTURE",
  "2_REGION_SYSTEM_FILTER",
  "3_LAYER_PEEL_SLIDER",
  "4_STAGE_SWITCHER_1_2_3",
  "5_CAMERA_RESET",
  "6_REFERENCE_BODY_MODE"
] as const;

export function createInitialAtlasHomeState(locale: SupportedLocale = "en"): BodyExposureAtlasHomeState {
  return {
    locale,
    referenceBodyMode: "MALE_Z_ANATOMY_SHIPPED",
    activeStage: "STAGE_1_ANATOMY",
    activeRegionFilter: "ALL",
    layers: atlasEnvelope(),
    selectedStructure: ORGAN_FACT_REGISTRY[0],
    isolatedMeshName: null,
    fadedOthers: false,
    explodedView: false,
    crossSectionClipPlane: false,
    searchQuery: "",
    cameraDistanceMeters: 2.2,
    activeDepthStudioPanel: null,
    actionInFlightGuard: false
  };
}

// BVH Picking by exact sourceMeshName (Click outside returns null, never crashes)
export function pickStructureInCanonicalScene(
  state: BodyExposureAtlasHomeState,
  raycastHitMeshName: string | null | undefined
): BodyExposureAtlasHomeState {
  if (!raycastHitMeshName) {
    return { ...state, selectedStructure: null, activeDepthStudioPanel: null };
  }
  const found = organFactIndex(raycastHitMeshName);
  return { ...state, selectedStructure: found, activeDepthStudioPanel: null };
}

// Stage Transition (Preserves selectedStructure; disables Stage 3 if structure lacks clinical support)
export function transitionAtlasStage(
  state: BodyExposureAtlasHomeState,
  targetStage: AtlasStageId
): { readonly nextState: BodyExposureAtlasHomeState; readonly transitionPermitted: boolean; readonly disabledReason: string | null } {
  if (state.actionInFlightGuard) {
    return { nextState: state, transitionPermitted: false, disabledReason: "DOUBLE_SUBMIT_BLOCKED_IN_FLIGHT" };
  }
  if (targetStage === "STAGE_3_CLINICAL" && (!state.selectedStructure || !state.selectedStructure.supportsStage3Clinical)) {
    return {
      nextState: state,
      transitionPermitted: false,
      disabledReason: "Selected structure does not have a verified Stage 3 clinical correlation module."
    };
  }
  const zoomDist = targetStage === "STAGE_1_ANATOMY" ? 2.2 : targetStage === "STAGE_2_LIVING_PHYSIOLOGY" ? 1.15 : 1.05;
  return {
    nextState: {
      ...state,
      activeStage: targetStage,
      cameraDistanceMeters: zoomDist
    },
    transitionPermitted: true,
    disabledReason: null
  };
}

// Legacy Studio Route Redirect Resolver (No 404; maps all 12 standalone studios into Atlas Home stages)
export function resolveLegacyStudioRouteRedirect(legacyRouteOrStudioName: string): {
  readonly canonicalRoute: "/body-exposure";
  readonly targetStage: AtlasStageId;
  readonly selectedMeshName: string;
  readonly openedDepthPanel: string;
} {
  const key = (legacyRouteOrStudioName || "").toLowerCase();
  if (key.includes("cardiopulmonary") || key.includes("perfusion") || key.includes("coronary")) {
    return {
      canonicalRoute: "/body-exposure",
      targetStage: key.includes("coronary") ? "STAGE_3_CLINICAL" : "STAGE_2_LIVING_PHYSIOLOGY",
      selectedMeshName: "Heart_Myocardium.g",
      openedDepthPanel: "CardiopulmonaryCouplingDeck"
    };
  }
  if (key.includes("oculomotor") || key.includes("lesion")) {
    return {
      canonicalRoute: "/body-exposure",
      targetStage: "STAGE_3_CLINICAL",
      selectedMeshName: "Brain_Cerebral_Cortex.g",
      openedDepthPanel: "OculomotorLesionLab"
    };
  }
  if (key.includes("kalolumen") || key.includes("volumetric") || key.includes("imaging")) {
    return {
      canonicalRoute: "/body-exposure",
      targetStage: "STAGE_3_CLINICAL",
      selectedMeshName: "Lung_Parenchyma_Bilateral.g",
      openedDepthPanel: "DiagnosticImagingStudio"
    };
  }
  if (key.includes("dermatome") || key.includes("pain")) {
    return {
      canonicalRoute: "/body-exposure",
      targetStage: "STAGE_3_CLINICAL",
      selectedMeshName: "Heart_Myocardium.g",
      openedDepthPanel: "ReferredPainDermatomeStudio"
    };
  }
  return {
    canonicalRoute: "/body-exposure",
    targetStage: "STAGE_1_ANATOMY",
    selectedMeshName: "External_abdominal_oblique_left.g",
    openedDepthPanel: "FiveStageVisualAtlas"
  };
}

export function BodyExposureAtlasHome(props?: { readonly locale?: SupportedLocale }) {
  const state = createInitialAtlasHomeState(props?.locale ?? "en");
  const dict = tBodyExposure(state.locale);
  const zoom = computeSemanticZoomRatio(2.2, state.cameraDistanceMeters);
  return {
    componentName: "BodyExposureAtlasHome" as const,
    canonicalRoute: "/body-exposure" as const,
    primaryViewportControlsCount: PRIMARY_VIEWPORT_CONTROLS.length,
    state,
    dict,
    semanticZoom: zoom
  };
}