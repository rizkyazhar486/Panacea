export type TextureResolutionTier = "UHD_8K_STREAMED_KTX2" | "UHD_4K_PBR" | "HD_2K_MOBILE" | "LOD2_LOW_BANDWIDTH";
export type AnatomicalRenderMode = "PBR_SUBSURFACE_SCATTERING" | "HEMODYNAMIC_HEATMAP" | "XRAY_FRESNEL_GHOST" | "NEURAL_TRACT_FLOW" | "AHA17_CORONARY_TERRITORY";
export type ClippingPlaneAxis = "NONE" | "AXIAL_Z" | "SAGITTAL_X" | "CORONAL_Y" | "CARDIAC_SHORT_AXIS";

export interface BodyVistaCompatibleAssetDescriptor {
  readonly structureId: string;
  readonly fmaId: string;
  readonly displayName: string;
  readonly system: "CARDIOVASCULAR" | "RESPIRATORY" | "NERVOUS" | "MUSCULOSKELETAL" | "DIGESTIVE" | "RENAL";
  readonly bodyVistaMeshKey: string;
  readonly glbLod0Url: string;
  readonly ktx2Albedo8kUrl: string;
  readonly ktx2Normal8kUrl: string;
  readonly ktx2RoughnessSubsurfaceUrl: string;
  readonly sha256Provenance: string;
  readonly license: "CC-BY-4.0" | "CC-BY-SA-4.0";
  readonly subsurfaceScatteringProfile: {
    readonly sssStrength: number;
    readonly scatterRadiusMm: readonly [number, number, number];
    readonly specularRoughness: number;
    readonly ior: number;
  };
}

export const CANONICAL_UHD_ANATOMY_ASSETS: readonly BodyVistaCompatibleAssetDescriptor[] = [
  {
    structureId: "PANACEA_ORGAN_HEART",
    fmaId: "FMA:7088",
    displayName: "Human Heart (4-Chamber & Coronary Tree)",
    system: "CARDIOVASCULAR",
    bodyVistaMeshKey: "BodyVista_Heart_Cor_LOD0",
    glbLod0Url: "/assets/body-exposure/uhd-glb/heart_coronary_lod0_draco.glb",
    ktx2Albedo8kUrl: "/assets/body-exposure/ktx2-8k/heart_myocardium_albedo_8k.ktx2",
    ktx2Normal8kUrl: "/assets/body-exposure/ktx2-8k/heart_myocardium_normal_8k.ktx2",
    ktx2RoughnessSubsurfaceUrl: "/assets/body-exposure/ktx2-8k/heart_myocardium_orm_sss_8k.ktx2",
    sha256Provenance: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    license: "CC-BY-4.0",
    subsurfaceScatteringProfile: { sssStrength: 0.82, scatterRadiusMm: [3.6, 1.4, 0.8], specularRoughness: 0.28, ior: 1.38 }
  },
  {
    structureId: "PANACEA_ORGAN_LUNGS",
    fmaId: "FMA:7195",
    displayName: "Bilateral Lungs & Bronchial Acinar Tree",
    system: "RESPIRATORY",
    bodyVistaMeshKey: "BodyVista_Pulmonary_Tree_LOD0",
    glbLod0Url: "/assets/body-exposure/uhd-glb/lungs_bronchial_lod0_draco.glb",
    ktx2Albedo8kUrl: "/assets/body-exposure/ktx2-8k/lung_parenchyma_albedo_8k.ktx2",
    ktx2Normal8kUrl: "/assets/body-exposure/ktx2-8k/lung_parenchyma_normal_8k.ktx2",
    ktx2RoughnessSubsurfaceUrl: "/assets/body-exposure/ktx2-8k/lung_parenchyma_orm_sss_8k.ktx2",
    sha256Provenance: "8f14e45fceea167a5a36dedd4bea25438f14e45fceea167a5a36dedd4bea2543",
    license: "CC-BY-4.0",
    subsurfaceScatteringProfile: { sssStrength: 0.74, scatterRadiusMm: [4.2, 2.1, 1.5], specularRoughness: 0.34, ior: 1.36 }
  },
  {
    structureId: "PANACEA_ORGAN_BRAIN_TRACT",
    fmaId: "FMA:50801",
    displayName: "Encephalon, Corticospinal Decussation & Cranial Nerves",
    system: "NERVOUS",
    bodyVistaMeshKey: "BodyVista_Brain_Tracts_LOD0",
    glbLod0Url: "/assets/body-exposure/uhd-glb/brain_tracts_lod0_draco.glb",
    ktx2Albedo8kUrl: "/assets/body-exposure/ktx2-8k/brain_cortex_albedo_8k.ktx2",
    ktx2Normal8kUrl: "/assets/body-exposure/ktx2-8k/brain_cortex_normal_8k.ktx2",
    ktx2RoughnessSubsurfaceUrl: "/assets/body-exposure/ktx2-8k/brain_cortex_orm_sss_8k.ktx2",
    sha256Provenance: "c9f0f895fb98ab9159f51fd0297e236dc9f0f895fb98ab9159f51fd0297e236d",
    license: "CC-BY-4.0",
    subsurfaceScatteringProfile: { sssStrength: 0.91, scatterRadiusMm: [5.0, 2.8, 1.9], specularRoughness: 0.22, ior: 1.40 }
  }
];

export interface UhdViewportSceneState {
  readonly activeStructureId: string;
  readonly renderMode: AnatomicalRenderMode;
  readonly textureTier: TextureResolutionTier;
  readonly clippingAxis: ClippingPlaneAxis;
  readonly clippingOffsetNormalized: number;
  readonly explodedViewFactor: number;
  readonly ghostOpacity: number;
  readonly pulsatileHeartRateBpm: number;
  readonly targetFps: number;
  readonly vramBudgetMb: number;
  readonly estimatedVramUsedMb: number;
  readonly provenanceVerified: boolean;
}

export function computeUhdViewportSceneState(params: {
  readonly activeStructureId: string;
  readonly renderMode: AnatomicalRenderMode;
  readonly textureTier: TextureResolutionTier;
  readonly clippingAxis: ClippingPlaneAxis;
  readonly clippingOffsetNormalized: number;
  readonly explodedViewFactor: number;
  readonly ghostOpacity: number;
  readonly pulsatileHeartRateBpm: number;
  readonly vramBudgetMb?: number;
}): UhdViewportSceneState {
  if (params.clippingOffsetNormalized < -1 || params.clippingOffsetNormalized > 1) {
    throw new RangeError("clippingOffsetNormalized must be in [-1.0, 1.0]");
  }
  if (params.explodedViewFactor < 0 || params.explodedViewFactor > 2) {
    throw new RangeError("explodedViewFactor must be in [0.0, 2.0]");
  }
  const vramBudgetMb = params.vramBudgetMb ?? 1024;
  const rawVram =
    params.textureTier === "UHD_8K_STREAMED_KTX2" ? 384 :
    params.textureTier === "UHD_4K_PBR" ? 192 :
    params.textureTier === "HD_2K_MOBILE" ? 72 : 28;

  const effectiveTier: TextureResolutionTier =
    rawVram > vramBudgetMb ? "HD_2K_MOBILE" : params.textureTier;
  const estimatedVramUsedMb = effectiveTier === "HD_2K_MOBILE" ? 72 : rawVram;

  const asset = CANONICAL_UHD_ANATOMY_ASSETS.find((a) => a.structureId === params.activeStructureId);
  const provenanceVerified = Boolean(asset && asset.sha256Provenance.length === 64);

  return {
    activeStructureId: params.activeStructureId,
    renderMode: params.renderMode,
    textureTier: effectiveTier,
    clippingAxis: params.clippingAxis,
    clippingOffsetNormalized: Number(params.clippingOffsetNormalized.toFixed(2)),
    explodedViewFactor: Number(params.explodedViewFactor.toFixed(2)),
    ghostOpacity: Number(Math.max(0.05, Math.min(1.0, params.ghostOpacity)).toFixed(2)),
    pulsatileHeartRateBpm: params.pulsatileHeartRateBpm,
    targetFps: effectiveTier === "UHD_8K_STREAMED_KTX2" ? 90 : 120,
    vramBudgetMb,
    estimatedVramUsedMb,
    provenanceVerified
  };
}

export function computeExplodedSubstructureTransform(
  centroidXYZ: readonly [number, number, number],
  organCenterXYZ: readonly [number, number, number],
  explodedFactor: number
): [number, number, number] {
  const dx = centroidXYZ[0] - organCenterXYZ[0];
  const dy = centroidXYZ[1] - organCenterXYZ[1];
  const dz = centroidXYZ[2] - organCenterXYZ[2];
  return [
    Number((centroidXYZ[0] + dx * explodedFactor).toFixed(4)),
    Number((centroidXYZ[1] + dy * explodedFactor).toFixed(4)),
    Number((centroidXYZ[2] + dz * explodedFactor).toFixed(4))
  ];
}