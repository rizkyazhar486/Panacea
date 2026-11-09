/**
 * @file bodyExposureUnifiedCockpitHydrator.ts
 * @description Menyatukan WebGPU 3D Raycast Picker, 5-Stage Layer Peel,
 * Apple HIG Dark Futuristic Glassmorphism Theme, dan SATUSEHAT FHIR R4 Readiness
 * ke dalam satu state terpadu untuk halaman utama /body-exposure.
 */

import {
  resolveWebGpuAnatomyRaycastAndLayerPeel,
  type AnatomicalPeelDepthStage
} from "./webgpuMultiscaleAnatomyViewportController.ts";
import { computeAppleHigDarkFuturisticLayoutAndTokens } from "./appleHigDarkFuturisticThemeEngine.ts";
import type { VaughanWilliamsClass } from "../engine/clinical/electrophysiologyHodgkinHuxleyAndActionPotentialEngine.ts";

export interface UnifiedBodyExposureCockpitInput {
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly ambientLuxLevel: number;
  readonly prefersReducedMotion: boolean;
  readonly selectedOrganQuery: string;
  readonly activePeelStage: AnatomicalPeelDepthStage;
  readonly pointerNdcX: number;
  readonly pointerNdcY: number;
  readonly activeAntiarrhythmicClass?: VaughanWilliamsClass;
}

export function hydrateUnifiedBodyExposureCockpitState(input: UnifiedBodyExposureCockpitInput) {
  const themeAndLayout = computeAppleHigDarkFuturisticLayoutAndTokens({
    viewportWidthPx: input.viewportWidthPx,
    viewportHeightPx: input.viewportHeightPx,
    ambientLuxLevel: input.ambientLuxLevel,
    prefersReducedMotion: input.prefersReducedMotion
  });

  const viewportRaycastState = resolveWebGpuAnatomyRaycastAndLayerPeel({
    pointerNdcX: input.pointerNdcX,
    pointerNdcY: input.pointerNdcY,
    hitMeshNameOrOrganQuery: input.selectedOrganQuery,
    hitDistanceMm: 280.0,
    worldNormalVector: [0, 0, 1],
    activePeelStage: input.activePeelStage,
    activeAntiarrhythmicClass: input.activeAntiarrhythmicClass ?? "NONE"
  });

  return {
    canonicalRoute: "/body-exposure" as const,
    cockpitStatus: "READY_INTERACTIVE_3D" as const,
    themeAndLayout,
    viewportRaycastState,
    headerHudSummary: {
      activeOrganTitleId: viewportRaycastState.realTimeClinicalCard.indonesianTitle,
      activeFmaId: viewportRaycastState.raycastSelection.fmaId,
      activePeelLabelId: viewportRaycastState.activeLayerPeel.indonesianLabel,
      minimumTouchTargetPx: themeAndLayout.ergonomicsAndAccessibility.minimumTouchTargetPx
    }
  };
}
