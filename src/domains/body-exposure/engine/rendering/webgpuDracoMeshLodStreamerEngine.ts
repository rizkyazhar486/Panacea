/**
 * @file webgpuDracoMeshLodStreamerEngine.ts
 * @description Mesin manajemen aset 3D GLB/Draco Z-Anatomy, pemilihan Level of Detail (LOD),
 * dan penjaga anggaran VRAM GPU untuk Three.js / WebGPU di MacBook Air, iPad, & Mobile.
 */

import { findClearStructureCard } from "../../data/zAnatomyClearIndonesianAtlas.ts";

export type MeshLodTier = "LOD0_ULTRA_SURGICAL" | "LOD1_STANDARD_CLINICAL" | "LOD2_MOBILE_LIGHTWEIGHT";

export interface DracoMeshStreamRequest {
  readonly organQuery: string;
  readonly cameraDistanceMm: number;
  readonly availableGpuVramMb: number;
  readonly targetFrameRateHz: 60 | 120;
}

export function planWebGpuDracoMeshStreamAndLod(request: DracoMeshStreamRequest) {
  if (request.cameraDistanceMm <= 0 || request.availableGpuVramMb <= 0) {
    throw new RangeError("cameraDistanceMm dan availableGpuVramMb harus bernilai positif.");
  }

  const card = findClearStructureCard(request.organQuery);

  let selectedLodTier: MeshLodTier = "LOD1_STANDARD_CLINICAL";
  if (request.cameraDistanceMm < 250 && request.availableGpuVramMb >= 512) {
    selectedLodTier = "LOD0_ULTRA_SURGICAL";
  } else if (request.cameraDistanceMm > 800 || request.availableGpuVramMb < 256) {
    selectedLodTier = "LOD2_MOBILE_LIGHTWEIGHT";
  }

  const triangleCount =
    selectedLodTier === "LOD0_ULTRA_SURGICAL"
      ? 145000
      : selectedLodTier === "LOD1_STANDARD_CLINICAL"
      ? 48000
      : 12000;

  const estimatedVramFootprintMb = Number(((triangleCount * 64) / (1024 * 1024)).toFixed(2));

  return {
    organId: card.id,
    organChipLabel: card.organChipLabel,
    fmaId: card.fmaId,
    assetUriGlb: `/assets/models/z-anatomy-draco/${card.id}.${selectedLodTier.toLowerCase()}.drc.glb`,
    dracoCompressionActive: true as const,
    selectedLodTier,
    triangleCount,
    estimatedVramFootprintMb,
    withinGpuBudget: estimatedVramFootprintMb <= request.availableGpuVramMb,
    ktx2BasisTextureCompression: true as const
  };
}
