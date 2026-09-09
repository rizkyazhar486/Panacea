import {
  evaluateBodyTargetTrust,
  hasCompleteBodySourceIdentity,
  type BodySourceIdentity,
  type BodyTargetTrustRecord,
} from './bodyTargetTrust';

export type EyeSourceNodeStatus =
  | 'source-node-present'
  | 'source-node-missing'
  | 'candidate-review-required'
  | 'reference-only'
  | 'blocked';

export type EyeProvenanceStatus =
  | 'provenance-complete'
  | 'provenance-incomplete'
  | 'license-verification-required'
  | 'blocked';

export type EyeAssetLicenseStatus = 'VERIFIED' | 'CHECK_REQUIRED' | 'BLOCKED';

export interface EyeAssetProductionGate {
  provenanceComplete: boolean;
  licenseCleared: boolean;
  stableIdMapped: boolean;
  artifactVerified: boolean;
  performanceReviewed: boolean;
  visualQaReviewed: boolean;
}

/**
 * Build-time/runtime-neutral description of one source node that has already
 * passed through the Panacea source/asset ingestion boundary.
 *
 * This module deliberately does not discover, download, rename or fuzzy-match
 * anatomy. A node can become exact only when the caller supplies the exact
 * source node ID and the node is explicitly mapped to the requested target ID.
 */
export interface EyeSourceNodeRecord {
  nodeId: string;
  canonicalTargetId: string;
  sourceIdentity: BodySourceIdentity | null;
  licenseStatus: EyeAssetLicenseStatus;
  referenceOnly: boolean;
  productionGate: EyeAssetProductionGate;
}

export interface EyeSourceGeometryReadinessInput {
  targetTrust: BodyTargetTrustRecord;
  requestedSourceNodeId: string | null;
  sourceNodes: readonly EyeSourceNodeRecord[];
  /**
   * Review candidates may be surfaced to a human, but they are never promoted
   * to exact geometry by this evaluator.
   */
  candidateSourceNodeIds?: readonly string[];
}

export interface EyeSourceGeometryReadinessDecision {
  sourceNodeStatus: EyeSourceNodeStatus;
  provenanceStatus: EyeProvenanceStatus;
  exactSourceNodeId: string | null;
  candidateSourceNodeIds: string[];
  geometryReady: boolean;
  productionReady: boolean;
  referenceDisplayAllowed: boolean;
  verifiedEyeRenderAllowed: boolean;
  blockers: string[];
}

const nonBlank = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const identitiesMatch = (
  left: BodySourceIdentity | null,
  right: BodySourceIdentity | null,
): boolean =>
  hasCompleteBodySourceIdentity(left) &&
  hasCompleteBodySourceIdentity(right) &&
  left.sourceId === right.sourceId &&
  left.assetId === right.assetId &&
  left.revision === right.revision &&
  left.licenseId === right.licenseId &&
  left.attribution === right.attribution &&
  left.transformationHistoryId === right.transformationHistoryId;

const allProductionGatesPass = (gate: EyeAssetProductionGate): boolean =>
  gate.provenanceComplete &&
  gate.licenseCleared &&
  gate.stableIdMapped &&
  gate.artifactVerified &&
  gate.performanceReviewed &&
  gate.visualQaReviewed;

const uniqueNonBlank = (values: readonly string[] | undefined): string[] =>
  [...new Set((values ?? []).filter(nonBlank))];

/**
 * Fail-closed eye/orbit source-geometry readiness.
 *
 * VerifiedEyeRender =
 *   ExactSourceNode
 *   AND AssetProvenanceComplete
 *   AND LicenseCleared
 *   AND StableIdMapped
 *   AND ArtifactVerified
 *   AND PerformanceReviewed
 *   AND VisualQaReviewed
 *   AND TargetTrustVerified
 *   AND SourceIdentityMatchesTargetTrust
 *
 * Candidate/fuzzy matches are review hints only. They can never satisfy
 * ExactSourceNode and therefore can never unlock verified rendering.
 */
export function evaluateEyeSourceGeometryReadiness(
  input: EyeSourceGeometryReadinessInput,
): EyeSourceGeometryReadinessDecision {
  const blockers: string[] = [];
  const targetDecision = evaluateBodyTargetTrust(input.targetTrust);
  const candidates = uniqueNonBlank(input.candidateSourceNodeIds);
  const requestedNodeId = nonBlank(input.requestedSourceNodeId)
    ? input.requestedSourceNodeId.trim()
    : null;

  const exactNode = requestedNodeId
    ? input.sourceNodes.find(
        (node) =>
          node.nodeId === requestedNodeId &&
          node.canonicalTargetId === input.targetTrust.targetId,
      ) ?? null
    : null;

  const sameIdWrongTarget = requestedNodeId
    ? input.sourceNodes.some(
        (node) =>
          node.nodeId === requestedNodeId &&
          node.canonicalTargetId !== input.targetTrust.targetId,
      )
    : false;

  if (!requestedNodeId) {
    blockers.push('source-node:id-missing');
  } else if (!exactNode) {
    blockers.push(
      sameIdWrongTarget
        ? 'source-node:target-mapping-mismatch'
        : 'source-node:exact-match-missing',
    );
  }

  let sourceNodeStatus: EyeSourceNodeStatus;
  if (sameIdWrongTarget) {
    sourceNodeStatus = 'blocked';
  } else if (!exactNode) {
    sourceNodeStatus = candidates.length > 0
      ? 'candidate-review-required'
      : 'source-node-missing';
  } else if (exactNode.licenseStatus === 'BLOCKED') {
    sourceNodeStatus = 'blocked';
  } else if (exactNode.referenceOnly) {
    sourceNodeStatus = 'reference-only';
  } else {
    sourceNodeStatus = 'source-node-present';
  }

  let provenanceStatus: EyeProvenanceStatus = 'provenance-incomplete';
  if (exactNode?.licenseStatus === 'BLOCKED') {
    provenanceStatus = 'blocked';
    blockers.push('license:blocked');
  } else if (exactNode?.licenseStatus === 'CHECK_REQUIRED') {
    provenanceStatus = 'license-verification-required';
    blockers.push('license:verification-required');
  } else if (exactNode) {
    const identityComplete = hasCompleteBodySourceIdentity(exactNode.sourceIdentity);
    if (!identityComplete || !exactNode.productionGate.provenanceComplete) {
      blockers.push('provenance:incomplete');
    } else if (!exactNode.productionGate.licenseCleared) {
      provenanceStatus = 'license-verification-required';
      blockers.push('license:not-cleared');
    } else {
      provenanceStatus = 'provenance-complete';
    }
  }

  if (exactNode) {
    if (!exactNode.productionGate.stableIdMapped) blockers.push('asset:stable-id-unmapped');
    if (!exactNode.productionGate.artifactVerified) blockers.push('asset:artifact-unverified');
    if (!exactNode.productionGate.performanceReviewed) blockers.push('asset:performance-unreviewed');
    if (!exactNode.productionGate.visualQaReviewed) blockers.push('asset:visual-qa-unreviewed');
    if (exactNode.referenceOnly) blockers.push('asset:reference-only');

    if (!identitiesMatch(exactNode.sourceIdentity, input.targetTrust.sourceIdentity)) {
      blockers.push('source-identity:target-trust-mismatch');
    }
  }

  for (const blocker of targetDecision.blockers) {
    blockers.push(`target-trust:${blocker}`);
  }

  const identityAligned = exactNode
    ? identitiesMatch(exactNode.sourceIdentity, input.targetTrust.sourceIdentity)
    : false;

  const geometryReady = Boolean(
    exactNode &&
      !exactNode.referenceOnly &&
      exactNode.licenseStatus === 'VERIFIED' &&
      exactNode.productionGate.provenanceComplete &&
      exactNode.productionGate.licenseCleared &&
      exactNode.productionGate.stableIdMapped &&
      exactNode.productionGate.artifactVerified &&
      identityAligned,
  );

  const productionReady = Boolean(
    geometryReady && exactNode && allProductionGatesPass(exactNode.productionGate),
  );

  const referenceDisplayAllowed = Boolean(
    exactNode &&
      sourceNodeStatus !== 'blocked' &&
      exactNode.licenseStatus !== 'BLOCKED' &&
      hasCompleteBodySourceIdentity(exactNode.sourceIdentity) &&
      targetDecision.referenceDisplayAllowed,
  );

  const verifiedEyeRenderAllowed = Boolean(
    productionReady &&
      provenanceStatus === 'provenance-complete' &&
      targetDecision.verifiedAnatomyRenderAllowed &&
      identityAligned,
  );

  return {
    sourceNodeStatus,
    provenanceStatus,
    exactSourceNodeId: exactNode?.nodeId ?? null,
    candidateSourceNodeIds: candidates,
    geometryReady,
    productionReady,
    referenceDisplayAllowed,
    verifiedEyeRenderAllowed,
    blockers: [...new Set(blockers)],
  };
}
