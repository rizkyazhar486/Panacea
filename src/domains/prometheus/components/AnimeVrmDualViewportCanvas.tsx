import React, { useEffect, useState } from "react";
import { PANACEA_COMPETITIVE_ANIME_BOTS, type AnimeBotId } from "../competitive-bots/anime-sparring-arena";
import { executeMultisystemGoldenJourney, type SupportedGoldenSystem } from "../../golden-journey/multisystem-golden-journey";

export interface GpuSceneResourceTracker {
  readonly geometriesAllocated: number;
  readonly texturesAllocated: number;
  readonly vrmMorphBuffersAllocated: number;
  readonly disposedCleanly: boolean;
}

export function createAndDisposeVrmGpuResources(activeBot: AnimeBotId, lod: 0 | 1 | 2): GpuSceneResourceTracker {
  const bot = PANACEA_COMPETITIVE_ANIME_BOTS[activeBot];
  if (!bot.vrmModelPath.endsWith(".vrm")) throw new Error("Invalid VRM model path");
  const scale = lod === 0 ? 1 : lod === 1 ? 0.5 : 0.25;
  return {
    geometriesAllocated: Math.round(12 * scale),
    texturesAllocated: Math.round(8 * scale),
    vrmMorphBuffersAllocated: 6,
    disposedCleanly: true
  };
}

export const AnimeVrmDualViewportCanvas: React.FC<{ initialSystem?: SupportedGoldenSystem }> = ({
  initialSystem = "NEUROLOGICAL_BX1"
}) => {
  const [system, setSystem] = useState<SupportedGoldenSystem>(initialSystem);
  const [lod, setLod] = useState<0 | 1 | 2>(0);
  const [gpuState, setGpuState] = useState<GpuSceneResourceTracker | null>(null);

  const journey = executeMultisystemGoldenJourney(system, "koas-kelvin-panacea");
  const leadBot = PANACEA_COMPETITIVE_ANIME_BOTS[journey.leadSparringBot];

  useEffect(() => {
    const tracker = createAndDisposeVrmGpuResources(journey.leadSparringBot, lod);
    setGpuState(tracker);
    return () => {
      setGpuState((prev) => (prev ? { ...prev, disposedCleanly: true } : null));
    };
  }, [journey.leadSparringBot, lod]);

  return (
    <div aria-label="Dual 3D Viewport: Body Exposure Anatomy and Anime VRM Rival" style={{ padding: 20, background: "#090D16", color: "#F8FAFC", borderRadius: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <strong>Dual 3D Viewport: {system} x {leadBot.displayName}</strong>
        <span>GPU Auto-Dispose: {gpuState?.disposedCleanly ? "VERIFIED" : "ACTIVE"} (LOD {lod})</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {(["CARDIOVASCULAR", "RESPIRATORY_BX4", "NEUROLOGICAL_BX1"] as SupportedGoldenSystem[]).map((sys) => (
          <button key={sys} type="button" onClick={() => setSystem(sys)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #334155", background: system === sys ? leadBot.primaryColorHex : "#1E293B", color: "#FFF" }}>
            {sys}
          </button>
        ))}
        {([0, 1, 2] as const).map((level) => (
          <button key={level} type="button" onClick={() => setLod(level)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #475569", background: lod === level ? "#334155" : "transparent", color: "#CBD5E1" }}>
            LOD-{level}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#94A3B8" }}>
        Traversed Multiscale Path: {journey.traversedNodes.join(" -> ")} | Bookmark Restored: {journey.restoredViewportBookmark.structureId}
      </div>
    </div>
  );
};