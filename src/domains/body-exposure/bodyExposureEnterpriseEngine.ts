import crypto from 'node:crypto';
import { evaluateBodyExposureEvidence } from '../body-exposure-evidence/bodyExposureEvidenceEngine.ts';

export interface BodyExposureConfigInput {
  entityId: string;
  meshPolycountTarget: 'ULTRA_AAA' | 'CINEMATIC' | 'OPTIMIZED_WEB';
  subsurfaceScatteringIndex: number;
  pbrTextureResolution: '8K' | '4K' | '2K';
  enableDynamicLighting: boolean;
  /** Required empirical evidence fields to prevent config-only fake verdicts */
  verifiedMeshTriangleCount?: number;
  verifiedArtifactSha256?: string;
  meshFileExistsOnDisk?: boolean;
}

export interface BodyExposureSyncReport {
  syncId: string;
  entityId: string;
  topologyStatus: 'OPTIMIZED_AUTO_SMOOTH_ACTIVE' | 'UNOPTIMIZED' | 'UNVERIFIED_CONFIG_ONLY';
  renderedEngineMode: 'WEBGPU_OR_WEBGL_PBR' | 'REALTIME_FALLBACK';
  graphicsQualityVerdict: 'VERIFIED_HIGH_FIDELITY' | 'CONFIG_REQUESTED_UNVERIFIED_ASSET' | 'STANDARD';
  evidenceGateStatus: 'VERIFIED_AAA_EVIDENCE_PASSED' | 'EVIDENCE_INSUFFICIENT' | 'ARTIFACT_HASH_MISMATCH';
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
    subsurfaceScatteringVerified: input.subsurfaceScatteringIndex >= 0.5 && Boolean(input.meshFileExistsOnDisk)
  });

  let qualityVerdict: BodyExposureSyncReport['graphicsQualityVerdict'] = 'STANDARD';
  let topologyStatus: BodyExposureSyncReport['topologyStatus'] = 'UNOPTIMIZED';

  if (evidenceReport.evidenceStatus === 'VERIFIED_AAA_EVIDENCE_PASSED') {
    qualityVerdict = 'VERIFIED_HIGH_FIDELITY';
    topologyStatus = 'OPTIMIZED_AUTO_SMOOTH_ACTIVE';
  } else if (input.meshPolycountTarget === 'ULTRA_AAA' && input.pbrTextureResolution === '8K') {
    // Config requested 8K/ULTRA_AAA, but no real asset hash/geometry was supplied -> DO NOT claim AAA!
    qualityVerdict = 'CONFIG_REQUESTED_UNVERIFIED_ASSET';
    topologyStatus = 'UNVERIFIED_CONFIG_ONLY';
  }

  const provenanceHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ input, evidenceStatus: evidenceReport.evidenceStatus, qualityVerdict }))
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
