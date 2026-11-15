import { type CanonicalStructureKind } from "./anatomy/structureKindFromName.ts";
import { SHIPPED_Z_ANATOMY_GLB_LAYERS, type LayerPeelState } from "./anatomy/atlasEnvelope.ts";

/** Selubung yang menempel di permukaan organ. Digambar tipis supaya tidak menutup bagian di bawahnya. */
export function selubungAtlas(nama?: string): any {
  if (typeof nama === "string") {
    const n = nama.trim();
    if (!n) return false;
    if (/\bpleural\s+cavity\b/i.test(n)) return false;
    return /\bpleura\b/i.test(n);
  }
  return {
    surface: { layerId: "surface", glbPath: SHIPPED_Z_ANATOMY_GLB_LAYERS.surface, visible: true, opacity0to1: 0.25, clipPlaneEnabled: false },
    muscular: { layerId: "muscular", glbPath: SHIPPED_Z_ANATOMY_GLB_LAYERS.muscular, visible: true, opacity0to1: 0.85, clipPlaneEnabled: false },
    skeletal: { layerId: "skeletal", glbPath: SHIPPED_Z_ANATOMY_GLB_LAYERS.skeletal, visible: true, opacity0to1: 1.0, clipPlaneEnabled: false },
    cardiovascular: { layerId: "cardiovascular", glbPath: SHIPPED_Z_ANATOMY_GLB_LAYERS.cardiovascular, visible: true, opacity0to1: 1.0, clipPlaneEnabled: false },
    nervous: { layerId: "nervous", glbPath: SHIPPED_Z_ANATOMY_GLB_LAYERS.nervous, visible: true, opacity0to1: 0.9, clipPlaneEnabled: false },
    lymphoid: { layerId: "lymphoid", glbPath: SHIPPED_Z_ANATOMY_GLB_LAYERS.lymphoid, visible: false, opacity0to1: 0.8, clipPlaneEnabled: false },
    visceral: { layerId: "visceral", glbPath: SHIPPED_Z_ANATOMY_GLB_LAYERS.visceral, visible: true, opacity0to1: 1.0, clipPlaneEnabled: false }
  };
}

export const atlasEnvelope = selubungAtlas;
