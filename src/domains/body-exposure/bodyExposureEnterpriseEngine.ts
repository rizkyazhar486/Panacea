import crypto from 'node:crypto';
import { evaluateBodyExposureEvidence, type EvidenceGateReport } from '../body-exposure-evidence/bodyExposureEvidenceEngine.ts';

export interface BodyExposureConfigInput {
  entityId: string;
  meshPolycountTarget: 'ULTRA_AAA' | 'CINEMATIC' | 'OPTIMIZED_WEB';
  subsurfaceScatteringIndex: number;
  pbrTextureResolution: '8K' | '4K' | '2K';
  enableDynamicLighting: boolean;
  verifiedMeshTriangleCount?: number;
  verifiedArtifactSha256?: string;
  expectedManifestSha256?: string;
  actualAssetBytes?: Buffer;
  verifiedTextureWidthPx?: number;
  verifiedTextureHeightPx?: number;
  meshFileExistsOnDisk?: boolean;
}

export interface BodyExposureSyncReport {
  syncId: string;
  entityId: string;
  topologyStatus: 'OPTIMIZED_AUTO_SMOOTH_ACTIVE' | 'UNOPTIMIZED' | 'UNVERIFIED_CONFIG_ONLY';
  renderedEngineMode: 'WEBGPU_OR_WEBGL_PBR' | 'REALTIME_FALLBACK';
  graphicsQualityVerdict: 'VERIFIED_HIGH_FIDELITY' | 'CONFIG_REQUESTED_UNVERIFIED_ASSET' | 'STANDARD';
  evidenceGateStatus: EvidenceGateReport['evidenceStatus'];
  provenanceHash: string;
  isClinicallyAuthoritative: false;
}

export function evaluateBodyExposureSync(input: BodyExposureConfigInput): BodyExposureSyncReport {
  const evidenceReport = evaluateBodyExposureEvidence({
    assetId: input.entityId,
    meshFileExists: Boolean(input.meshFileExistsOnDisk),
    triangleCount: input.verifiedMeshTriangleCount ?? 0,
    textureResolution: input.pbrTextureResolution,
    sha256Hash: input.verifiedArtifactSha256 ?? '',
    expectedManifestSha256: input.expectedManifestSha256,
    actualAssetBytes: input.actualAssetBytes,
    verifiedTextureWidthPx: input.verifiedTextureWidthPx ?? null,
    verifiedTextureHeightPx: input.verifiedTextureHeightPx ?? null,
    subsurfaceScatteringVerified:
      input.subsurfaceScatteringIndex >= 0.5 && Boolean(input.meshFileExistsOnDisk)
  });

  let qualityVerdict: BodyExposureSyncReport['graphicsQualityVerdict'] = 'STANDARD';
  let topologyStatus: BodyExposureSyncReport['topologyStatus'] = 'UNOPTIMIZED';

  if (evidenceReport.evidenceStatus === 'VERIFIED_EMPIRICAL_EVIDENCE_PASSED') {
    qualityVerdict = 'VERIFIED_HIGH_FIDELITY';
    topologyStatus = 'OPTIMIZED_AUTO_SMOOTH_ACTIVE';
  } else if (input.meshPolycountTarget === 'ULTRA_AAA' && input.pbrTextureResolution === '8K') {
    qualityVerdict = 'CONFIG_REQUESTED_UNVERIFIED_ASSET';
    topologyStatus = 'UNVERIFIED_CONFIG_ONLY';
  }

  const provenanceHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        entityId: input.entityId,
        evidenceStatus: evidenceReport.evidenceStatus,
        qualityVerdict
      })
    )
    .digest('hex');

  return {
    syncId: `BODY-EXP-${provenanceHash.slice(0, 12).toUpperCase()}`,
    entityId: input.entityId,
    topologyStatus,
    renderedEngineMode: input.enableDynamicLighting ? 'WEBGPU_OR_WEBGL_PBR' : 'REALTIME_FALLBACK',
    graphicsQualityVerdict: qualityVerdict,
    evidenceGateStatus: evidenceReport.evidenceStatus,
    provenanceHash,
    isClinicallyAuthoritative: false
  };
}
