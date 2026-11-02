import React, { useState, useMemo } from "react";
import {
  CANONICAL_UHD_ANATOMY_ASSETS,
  computeUhdViewportSceneState,
  type AnatomicalRenderMode,
  type ClippingPlaneAxis,
  type TextureResolutionTier
} from "../nextgen-uhd-pbr-viewport-engine.ts";

export const NextGenBodyExposureUhdViewport: React.FC = () => {
  const [activeStructureId, setActiveStructureId] = useState<string>("PANACEA_ORGAN_HEART");
  const [renderMode, setRenderMode] = useState<AnatomicalRenderMode>("PBR_SUBSURFACE_SCATTERING");
  const [textureTier, setTextureTier] = useState<TextureResolutionTier>("UHD_8K_STREAMED_KTX2");
  const [clippingAxis, setClippingAxis] = useState<ClippingPlaneAxis>("CARDIAC_SHORT_AXIS");
  const [explodedViewFactor, setExplodedViewFactor] = useState<number>(0.35);

  const sceneState = useMemo(() => computeUhdViewportSceneState({
    activeStructureId,
    renderMode,
    textureTier,
    clippingAxis,
    clippingOffsetNormalized: 0.15,
    explodedViewFactor,
    ghostOpacity: 0.85,
    pulsatileHeartRateBpm: 76
  }), [activeStructureId, renderMode, textureTier, clippingAxis, explodedViewFactor]);

  return (
    <section aria-label="PanaceaMed Next-Gen UHD 8K-Ready Body Exposure Viewport" style={{ padding: 24, background: "#020617", color: "#F8FAFC", borderRadius: 16 }}>
      <h2>PanaceaMed Body Exposure ∞ — UHD KTX2 PBR + Subsurface Scattering Viewport</h2>
      <p>Active Asset: <strong>{sceneState.activeStructureId}</strong> | Mode: <strong>{sceneState.renderMode}</strong> | Tier: <strong>{sceneState.textureTier}</strong> | VRAM: <strong>{sceneState.estimatedVramUsedMb}/{sceneState.vramBudgetMb} MB</strong></p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CANONICAL_UHD_ANATOMY_ASSETS.map((a) => (
          <button key={a.structureId} type="button" onClick={() => setActiveStructureId(a.structureId)}>{a.displayName}</button>
        ))}
      </div>
    </section>
  );
};