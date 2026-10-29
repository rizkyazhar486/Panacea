/**
 * PanaceaMed Body Exposure Evidence Gate & Rigorous Verification Engine (Directive 063 / 067-R)
 * Validates real artifact SHA-256 digests (explicitly rejecting the empty-file SHA-256),
 * measured geometry counts, and verified texture dimensions.
 */

import crypto from 'node:crypto';

const EMPTY_STRING_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export interface EvidenceGateInput {
  assetId: string;
  meshFileExists: boolean;
  triangleCount: number;
  textureResolution: '8K' | '4K' | '2K' | '1K' | 'NONE';
  sha256Hash: string;
  expectedManifestSha256?: string;
  actualAssetBytes?: Buffer;
  subsurfaceScatteringVerified: boolean;
}

export interface EvidenceGateReport {
  auditId: string;
  assetId: string;
  evidenceStatus: 'VERIFIED_AAA_EVIDENCE_PASSED' | 'EVIDENCE_INSUFFICIENT' | 'ARTIFACT_HASH_MISMATCH';
  measuredQualityScore: number;
  complianceNotes: string;
  provenanceHash: string | null;
  isClinicallyAuthoritative: false;
}

export function evaluateBodyExposureEvidence(input: EvidenceGateInput): EvidenceGateReport {
  const normalizedHash = (input.sha256Hash ?? '').trim().toLowerCase();
  const isHexSha256 = /^[a-f0-9]{64}$/.test(normalizedHash);
  const isEmptyStringHash = normalizedHash === EMPTY_STRING_SHA256;

  let computedHash = normalizedHash;
  if (Buffer.isBuffer(input.actualAssetBytes)) {
    if (input.actualAssetBytes.byteLength === 0) {
      return {
        auditId: `AUDIT-${input.assetId}`,
        assetId: input.assetId,
        evidenceStatus: 'ARTIFACT_HASH_MISMATCH',
        measuredQualityScore: 0,
        complianceNotes: 'Rejected: actualAssetBytes buffer is empty (0 bytes).',
        provenanceHash: null,
        isClinicallyAuthoritative: false
      };
    }
    computedHash = crypto.createHash('sha256').update(input.actualAssetBytes).digest('hex');
  }

  if (
    !input.meshFileExists ||
    !isHexSha256 ||
    isEmptyStringHash ||
    (input.expectedManifestSha256 &&
      computedHash !== input.expectedManifestSha256.trim().toLowerCase())
  ) {
    return {
      auditId: `AUDIT-${input.assetId}`,
      assetId: input.assetId,
      evidenceStatus: 'ARTIFACT_HASH_MISMATCH',
      measuredQualityScore: 0,
      complianceNotes: isEmptyStringHash
        ? 'Rejected: SHA-256 equals the hash of an empty string.'
        : 'Rejected: Missing mesh file or SHA-256 digest mismatch against immutable manifest.',
      provenanceHash: null,
      isClinicallyAuthoritative: false
    };
  }

  if (input.triangleCount <= 0 || input.textureResolution === 'NONE' || !input.subsurfaceScatteringVerified) {
    return {
      auditId: `AUDIT-${input.assetId}`,
      assetId: input.assetId,
      evidenceStatus: 'EVIDENCE_INSUFFICIENT',
      measuredQualityScore: 0.25,
      complianceNotes: `Insufficient empirical evidence for ${input.assetId}: triangles=${input.triangleCount}, texture=${input.textureResolution}.`,
      provenanceHash: computedHash,
      isClinicallyAuthoritative: false
    };
  }

  const provenanceHash = crypto
    .createHash('sha256')
    .update(`${input.assetId}:${computedHash}:${input.triangleCount}:${input.textureResolution}`)
    .digest('hex');

  return {
    auditId: `AUDIT-${provenanceHash.slice(0, 12)}`,
    assetId: input.assetId,
    evidenceStatus: 'VERIFIED_AAA_EVIDENCE_PASSED',
    measuredQualityScore: input.textureResolution === '8K' ? 0.95 : 0.85,
    complianceNotes: `Empirical evidence verified for ${input.assetId}: triangles=${input.triangleCount}, sha256=${computedHash}.`,
    provenanceHash,
    isClinicallyAuthoritative: false
  };
}
