import { type CanonicalStructureKind } from "./structureKindFromName.ts";

export const SHIPPED_Z_ANATOMY_GLB_LAYERS: Readonly<Record<CanonicalStructureKind, string>> = {
  surface: "/anatomy/surface.glb",
  skeletal: "/anatomy/skeletal.glb",
  muscular: "/anatomy/muscular.glb",
  cardiovascular: "/anatomy/cardiovascular.glb",
  nervous: "/anatomy/nervous.glb",
  lymphoid: "/anatomy/lymphoid.glb",
  visceral: "/anatomy/visceral.glb"
};

export interface LayerPeelState {
  readonly layerId: CanonicalStructureKind;
  readonly glbPath: string;
  readonly visible: boolean;
  readonly opacity0to1: number;
  readonly clipPlaneEnabled: boolean;
}

export function atlasEnvelope(): Readonly<Record<CanonicalStructureKind, LayerPeelState>> {
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

export function toggleOrPeelAtlasLayer(
  current: Readonly<Record<CanonicalStructureKind, LayerPeelState>>,
  layerId: string,
  update: { readonly visible?: boolean; readonly opacity0to1?: number; readonly clipPlaneEnabled?: boolean }
): Readonly<Record<CanonicalStructureKind, LayerPeelState>> {
  if (!Object.prototype.hasOwnProperty.call(SHIPPED_Z_ANATOMY_GLB_LAYERS, layerId)) {
    throw new RangeError("Fail-closed: Layer '" + layerId + "' is not in the shipped Z-Anatomy catalog.");
  }
  const typedKey = layerId as CanonicalStructureKind;
  const existing = current[typedKey];
  const nextOpacity = update.opacity0to1 !== undefined ? Math.max(0, Math.min(1, update.opacity0to1)) : existing.opacity0to1;
  return {
    ...current,
    [typedKey]: {
      ...existing,
      visible: update.visible !== undefined ? update.visible : existing.visible,
      opacity0to1: nextOpacity,
      clipPlaneEnabled: update.clipPlaneEnabled !== undefined ? update.clipPlaneEnabled : existing.clipPlaneEnabled
    }
  };
}
export const selubungAtlas = atlasEnvelope;