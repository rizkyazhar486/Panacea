/**
 * PanaceaMed Body Exposure Evidence Gate & Rigorous Verification Engine (Directive 067-R Browser Acceptance)
 * STRICT INVARIANT:
 * A caller-supplied 64-character hex string is NEVER accepted as verified on its own.
 * Verification requires:
 *   1. Real artifact bytes (`actualAssetBytes` Buffer with byteLength > 0)
 *   2. An independently trusted `expectedManifestSha256` digest
 *   3. SHA256(actualAssetBytes) === expectedManifestSha256 === sha256Hash
 *   4. Verified non-zero geometry and verified texture dimensions
 */

import crypto from 'node:crypto';

const EMPTY_STRING_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export interface EvidenceGateInput {
  assetId: string;
  meshFileExists: boolean;
  triangleCount: number;
  textureResolution: '8K' | '4K' | '2K' | '1K' | 'SUB_1K' | 'UNVERIFIED' | 'NONE';
  sha256Hash: string;
  expectedManifestSha256?: string;
  actualAssetBytes?: Buffer;
  verifiedTextureWidthPx?: number | null;
  verifiedTextureHeightPx?: number | null;
  subsurfaceScatteringVerified: boolean;
}

export interface EvidenceGateReport {
  auditId: string;
  assetId: string;
  evidenceStatus:
    | 'VERIFIED_EMPIRICAL_EVIDENCE_PASSED'
    | 'EVIDENCE_INSUFFICIENT_UNVERIFIED_CALLER_HASH'
    | 'EVIDENCE_INSUFFICIENT'
    | 'ARTIFACT_HASH_MISMATCH';
  measuredQualityScore: number | null;
  computedByteSha256: string | null;
  trustedManifestMatch: boolean;
  complianceNotes: string;
  provenanceHash: string | null;
  isClinicallyAuthoritative: false;
}

export function evaluateBodyExposureEvidence(input: EvidenceGateInput): EvidenceGateReport {
  const suppliedHash = (input.sha256Hash ?? '').trim().toLowerCase();
  const manifestHash = (input.expectedManifestSha256 ?? '').trim().toLowerCase();
  const isSuppliedHex64 = /^[a-f0-9]{64}$/.test(suppliedHash);
  const isManifestHex64 = /^[a-f0-9]{64}$/.test(manifestHash);

  if (
    !input.meshFileExists ||
    !isSuppliedHex64 ||
    suppliedHash === EMPTY_STRING_SHA256 ||
    manifestHash === EMPTY_STRING_SHA256
  ) {
    return {
      auditId: `AUDIT-REJECT-${input.assetId || 'UNKNOWN'}`,
      assetId: input.assetId,
      evidenceStatus: 'ARTIFACT_HASH_MISMATCH',
      measuredQualityScore: null,
      computedByteSha256: null,
      trustedManifestMatch: false,
      complianceNotes:
        'Rejected: Missing mesh file, malformed SHA-256 format, or prohibited empty-string digest.',
      provenanceHash: null,
      isClinicallyAuthoritative: false
    };
  }

  // Rule 7: Never accept a caller-supplied 64-char hash without actualAssetBytes AND expectedManifestSha256
  if (!Buffer.isBuffer(input.actualAssetBytes) || input.actualAssetBytes.byteLength === 0 || !isManifestHex64) {
    return {
      auditId: `AUDIT-UNVERIFIED-${input.assetId}`,
      assetId: input.assetId,
      evidenceStatus: 'EVIDENCE_INSUFFICIENT_UNVERIFIED_CALLER_HASH',
      measuredQualityScore: null,
      computedByteSha256: null,
      trustedManifestMatch: false,
      complianceNotes:
        'Rejected unverified caller hash: both actualAssetBytes (Buffer) and an independently trusted expectedManifestSha256 are mandatory.',
      provenanceHash: null,
      isClinicallyAuthoritative: false
    };
  }

  const computedByteSha256 = crypto
    .createHash('sha256')
    .update(input.actualAssetBytes)
    .digest('hex')
    .toLowerCase();

  if (computedByteSha256 === EMPTY_STRING_SHA256 || computedByteSha256 !== manifestHash || computedByteSha256 !== suppliedHash) {
    return {
      auditId: `AUDIT-MISMATCH-${input.assetId}`,
      assetId: input.assetId,
      evidenceStatus: 'ARTIFACT_HASH_MISMATCH',
      measuredQualityScore: null,
      computedByteSha256,
      trustedManifestMatch: false,
      complianceNotes: `SHA-256 mismatch: computed=${computedByteSha256}, manifest=${manifestHash}, supplied=${suppliedHash}.`,
      provenanceHash: null,
      isClinicallyAuthoritative: false
    };
  }

  const hasVerifiedDimensions =
    typeof input.verifiedTextureWidthPx === 'number' &&
    input.verifiedTextureWidthPx > 0 &&
    typeof input.verifiedTextureHeightPx === 'number' &&
    input.verifiedTextureHeightPx > 0;

  if (
    input.triangleCount <= 0 ||
    input.textureResolution === 'NONE' ||
    input.textureResolution === 'UNVERIFIED' ||
    !hasVerifiedDimensions
  ) {
    return {
      auditId: `AUDIT-PARTIAL-${computedByteSha256.slice(0, 12)}`,
      assetId: input.assetId,
      evidenceStatus: 'EVIDENCE_INSUFFICIENT',
      measuredQualityScore: null,
      computedByteSha256,
      trustedManifestMatch: true,
      complianceNotes:
        'Asset bytes match manifest digest, but triangle count or binary texture header dimensions are incomplete.',
      provenanceHash: computedByteSha256,
      isClinicallyAuthoritative: false
    };
  }

  const provenanceHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        assetId: input.assetId,
        computedByteSha256,
        triangleCount: input.triangleCount,
        width: input.verifiedTextureWidthPx,
        height: input.verifiedTextureHeightPx
      })
    )
    .digest('hex');

  return {
    auditId: `AUDIT-${provenanceHash.slice(0, 12).toUpperCase()}`,
    assetId: input.assetId,
    evidenceStatus: 'VERIFIED_EMPIRICAL_EVIDENCE_PASSED',
    measuredQualityScore: 1.0,
    computedByteSha256,
    trustedManifestMatch: true,
    complianceNotes: `Verified actual bytes against trusted manifest (${computedByteSha256}) and binary texture dimensions (${input.verifiedTextureWidthPx}x${input.verifiedTextureHeightPx}).`,
    provenanceHash,
    isClinicallyAuthoritative: false
  };
}
