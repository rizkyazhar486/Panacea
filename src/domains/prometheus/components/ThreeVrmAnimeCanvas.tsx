import React, { useEffect, useRef } from "react";
import { PANACEA_COMPETITIVE_ANIME_BOTS, type AnimeBotId } from "../competitive-bots/anime-sparring-arena";

export interface ThreeVrmCanvasProps {
  readonly botId: AnimeBotId;
  readonly blendshapeExpression?: string;
  readonly lodLevel?: 0 | 1 | 2;
}

export const ThreeVrmAnimeCanvas: React.FC<ThreeVrmCanvasProps> = ({
  botId,
  blendshapeExpression = "confident_smile",
  lodLevel = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bot = PANACEA_COMPETITIVE_ANIME_BOTS[botId];

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (gl && active) {
      console.log("[ThreeVrmAnimeCanvas] Initialized WebGL context for " + bot.displayName);
    }

    return () => {
      active = false;
      if (gl) {
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      }
    };
  }, [botId, blendshapeExpression, lodLevel]);

  return (
    <div style={{ position: "relative", width: "100%", height: "420px", background: "#050814", borderRadius: 12, overflow: "hidden", border: "2px solid " + bot.primaryColorHex }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, padding: 10, background: "rgba(15, 23, 42, 0.88)", borderRadius: 8, fontSize: 12, color: "#F8FAFC" }}>
        <strong style={{ color: bot.primaryColorHex }}>{bot.displayName}</strong> ({bot.animeArchetypeTitle || bot.archetype || "Anime Rival"})
        <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 2 }}>VRM Asset: <code>{bot.avatar3D ? bot.avatar3D.vrmAssetPath : bot.vrmModelPath}</code> | Expression: {blendshapeExpression}</div>
      </div>
    </div>
  );
};