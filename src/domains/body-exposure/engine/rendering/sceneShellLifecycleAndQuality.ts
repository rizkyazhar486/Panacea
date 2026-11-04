export type QualityPresetId = "ULTRA_DESKTOP" | "BALANCED_DEFAULT" | "MOBILE_BATTERY_SAVER";
export const FRAME_BUDGET_MS = 16.67;

export function nextAutoPreset(currentPreset: QualityPresetId, measuredFrameTimeMs: number): QualityPresetId {
  if (!Number.isFinite(measuredFrameTimeMs) || measuredFrameTimeMs <= 0) return currentPreset;
  if (measuredFrameTimeMs > FRAME_BUDGET_MS) {
    if (currentPreset === "ULTRA_DESKTOP") return "BALANCED_DEFAULT";
    if (currentPreset === "BALANCED_DEFAULT") return "MOBILE_BATTERY_SAVER";
  }
  return currentPreset;
}

export function computeSemanticZoomRatio(dFitMeters: number, dCameraMeters: number): {
  readonly relativeZoom: number;
  readonly activeLodTier: "WHOLE_BODY_SHELL" | "REGIONAL_ORGAN_FOCUS" | "SUBSTRUCTURE_CLOSEUP" | "STAGE_SWITCH_TISSUE_CELL_HANDOFF";
} {
  if (dFitMeters <= 0 || dCameraMeters <= 0) throw new RangeError("Distances must be positive.");
  const relativeZoom = Number((dFitMeters / dCameraMeters).toFixed(2));
  const activeLodTier =
    relativeZoom < 1.4 ? "WHOLE_BODY_SHELL" :
    relativeZoom < 2.8 ? "REGIONAL_ORGAN_FOCUS" :
    relativeZoom < 5.0 ? "SUBSTRUCTURE_CLOSEUP" : "STAGE_SWITCH_TISSUE_CELL_HANDOFF";
  return { relativeZoom, activeLodTier };
}

export interface MockGpuResourceTracker {
  disposedCount: number;
  isSuspendedOffscreen: boolean;
  disposeAll: () => void;
  setOffscreen: (offscreen: boolean) => void;
}

export function createSceneShellLifecycleManager(): MockGpuResourceTracker {
  const tracker: MockGpuResourceTracker = {
    disposedCount: 0,
    isSuspendedOffscreen: false,
    disposeAll() { tracker.disposedCount += 1; },
    setOffscreen(offscreen: boolean) { tracker.isSuspendedOffscreen = offscreen; }
  };
  return tracker;
}

// PHASE 3C: WebGPU / TAAU Phase-0 Capability Probe (Zero 'DLSS' Mislabeling)
export function probeWebGpuPhaseZeroCapability(env: { readonly hasNavigatorGpu: boolean; readonly adapterAvailable: boolean; readonly viewportWidthPx: number }) {
  const webGpuActive = Boolean(env.hasNavigatorGpu && env.adapterAvailable);
  const pixelRatioBudget = env.viewportWidthPx <= 430 ? 1.5 : 2.0;
  return {
    phase: "PHASE_0_CAPABILITY_PROBE_AND_TAAU_FALLBACK" as const,
    activeBackend: webGpuActive ? ("WEBGPU_NATIVE_PHASE_0" as const) : ("WEBGL2_DETERMINISTIC_FALLBACK" as const),
    body3dPixelRatioBudget: pixelRatioBudget,
    proprietaryUpscalerClaimed: false as const
  };
}