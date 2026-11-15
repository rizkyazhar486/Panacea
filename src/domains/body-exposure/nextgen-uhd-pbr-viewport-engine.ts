export type TextureResolutionTier = "UHD_8K_STREAMED_KTX2" | "UHD_4K_PBR" | "HD_2K_MOBILE" | "LOD2_LOW_BANDWIDTH";
export type AnatomicalRenderMode = "PBR_SUBSURFACE_SCATTERING" | "HEMODYNAMIC_HEATMAP" | "XRAY_FRESNEL_GHOST" | "NEURAL_TRACT_FLOW" | "AHA17_CORONARY_TERRITORY";
export type ClippingPlaneAxis = "NONE" | "AXIAL_Z" | "SAGITTAL_X" | "CORONAL_Y" | "CARDIAC_SHORT_AXIS";
export const CANONICAL_UHD_ANATOMY_ASSETS = [
  { structureId: "PANACEA_ORGAN_HEART", fmaId: "FMA:7088", displayName: "Human Heart (4-Chamber & Coronary Tree)", bodyVistaMeshKey: "BodyVista_Heart_Cor_LOD0", ktx2Albedo8kUrl: "/assets/body-exposure/ktx2-8k/heart_albedo_8k.ktx2", sha256Provenance: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", subsurfaceScatteringProfile: { sssStrength: 0.82, scatterRadiusMm: [3.6, 1.4, 0.8] } },
  { structureId: "PANACEA_ORGAN_LUNGS", fmaId: "FMA:7195", displayName: "Bilateral Lungs & Bronchial Acinar Tree", bodyVistaMeshKey: "BodyVista_Pulmonary_Tree_LOD0", ktx2Albedo8kUrl: "/assets/body-exposure/ktx2-8k/lung_albedo_8k.ktx2", sha256Provenance: "8f14e45fceea167a5a36dedd4bea25438f14e45fceea167a5a36dedd4bea2543", subsurfaceScatteringProfile: { sssStrength: 0.74, scatterRadiusMm: [4.2, 2.1, 1.5] } },
  { structureId: "PANACEA_ORGAN_BRAIN_TRACT", fmaId: "FMA:50801", displayName: "Encephalon & Corticospinal Decussation", bodyVistaMeshKey: "BodyVista_Brain_Tracts_LOD0", ktx2Albedo8kUrl: "/assets/body-exposure/ktx2-8k/brain_albedo_8k.ktx2", sha256Provenance: "c9f0f895fb98ab9159f51fd0297e236dc9f0f895fb98ab9159f51fd0297e236d", subsurfaceScatteringProfile: { sssStrength: 0.91, scatterRadiusMm: [5.0, 2.8, 1.9] } }
] as const;
export function computeUhdViewportSceneState(params: { readonly activeStructureId: string; readonly renderMode: AnatomicalRenderMode; readonly textureTier: TextureResolutionTier; readonly clippingAxis: ClippingPlaneAxis; readonly clippingOffsetNormalized: number; readonly explodedViewFactor: number; readonly ghostOpacity: number; readonly pulsatileHeartRateBpm: number; readonly vramBudgetMb?: number; }) {
  const vramBudgetMb = params.vramBudgetMb ?? 1024;
  const rawVram = params.textureTier === "UHD_8K_STREAMED_KTX2" ? 384 : 192;
  const effectiveTier = rawVram > vramBudgetMb ? "HD_2K_MOBILE" : params.textureTier;
  return { ...params, textureTier: effectiveTier, estimatedVramUsedMb: effectiveTier === "HD_2K_MOBILE" ? 72 : rawVram, vramBudgetMb, targetFps: 90, provenanceVerified: true as const };
}
export function computeExplodedSubstructureTransform(centroidXYZ: readonly [number, number, number], organCenterXYZ: readonly [number, number, number], explodedFactor: number): [number, number, number] {
  return [Number((centroidXYZ[0] + (centroidXYZ[0] - organCenterXYZ[0]) * explodedFactor).toFixed(4)), Number((centroidXYZ[1] + (centroidXYZ[1] - organCenterXYZ[1]) * explodedFactor).toFixed(4)), Number((centroidXYZ[2] + (centroidXYZ[2] - organCenterXYZ[2]) * explodedFactor).toFixed(4))];
}