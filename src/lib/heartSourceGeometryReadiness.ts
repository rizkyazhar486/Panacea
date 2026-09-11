import {
  evaluateBodyTargetTrust,
  hasCompleteBodySourceIdentity,
  type BodySourceIdentity,
  type BodyTargetTrustRecord,
} from './bodyTargetTrust';

export type HeartStructureClass =
  | 'chamber'
  | 'valve'
  | 'great-vessel'
  | 'coronary-vessel'
  | 'conduction-reference'
  | 'myocardial-wall'
  | 'other';

export type HeartSourceNodeStatus =
  | 'source-node-present'
  | 'source-node-missing'
  | 'candidate-review-required'
  | 'reference-only'
  | 'blocked';

export type HeartLicenseStatus = 'VERIFIED' | 'CHECK_REQUIRED' | 'BLOCKED';

export interface HeartProductionGate {
  provenanceComplete: boolean;
  licenseCleared: boolean;
  stableIdMapped: boolean;
  artifactVerified: boolean;
  performanceReviewed: boolean;
  visualQaReviewed: boolean;
}

export interface HeartSourceNodeRecord {
  nodeId: string;
  canonicalTargetId: string;
  structureClass: HeartStructureClass;
  sourceIdentity: BodySourceIdentity | null;
  licenseStatus: HeartLicenseStatus;
  referenceOnly: boolean;
  productionGate: HeartProductionGate;
}

export interface HeartSourceGeometryInput {
  targetTrust: BodyTargetTrustRecord;
  requestedSourceNodeId: string | null;
  expectedStructureClass: HeartStructureClass;
  sourceNodes: readonly HeartSourceNodeRecord[];
  candidateSourceNodeIds?: readonly string[];
}

export interface HeartSourceGeometryDecision {
  sourceNodeStatus: HeartSourceNodeStatus;
  exactSourceNodeId: string | null;
  geometryReady: boolean;
  productionReady: boolean;
  referenceDisplayAllowed: boolean;
  verifiedHeartRenderAllowed: boolean;
  schematicMotionAllowed: boolean;
  patientSpecificPhysiologyAllowed: false;
  blockers: string[];
}

const nonBlank = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const identitiesMatch = (
  left: BodySourceIdentity | null,
  right: BodySourceIdentity | null,
): boolean => {
  if (!left || !right) return false;
  if (!hasCompleteBodySourceIdentity(left) || !hasCompleteBodySourceIdentity(right)) {
    return false;
  }
  return (
    left.sourceId === right.sourceId &&
    left.assetId === right.assetId &&
    left.revision === right.revision &&
    left.licenseId === right.licenseId &&
    left.attribution === right.attribution &&
    left.transformationHistoryId === right.transformationHistoryId
  );
};

const gatesPass = (gate: HeartProductionGate): boolean =>
  gate.provenanceComplete &&
  gate.licenseCleared &&
  gate.stableIdMapped &&
  gate.artifactVerified &&
  gate.performanceReviewed &&
  gate.visualQaReviewed;

export function evaluateHeartSourceGeometryReadiness(
  input: HeartSourceGeometryInput,
): HeartSourceGeometryDecision {
  const blockers: string[] = [];
  const targetDecision = evaluateBodyTargetTrust(input.targetTrust);
  const requestedId = nonBlank(input.requestedSourceNodeId)
    ? input.requestedSourceNodeId.trim()
    : null;

  const exactNode = requestedId
    ? input.sourceNodes.find(
        (node) =>
          node.nodeId === requestedId &&
          node.canonicalTargetId === input.targetTrust.targetId &&
          node.structureClass === input.expectedStructureClass,
      ) ?? null
    : null;

  const sameIdWrongMapping = requestedId
    ? input.sourceNodes.some(
        (node) =>
          node.nodeId === requestedId &&
          (node.canonicalTargetId !== input.targetTrust.targetId ||
            node.structureClass !== input.expectedStructureClass),
      )
    : false;

  if (!requestedId) blockers.push('source-node:id-missing');
  if (requestedId && !exactNode) {
    blockers.push(
      sameIdWrongMapping
        ? 'source-node:target-or-class-mismatch'
        : 'source-node:exact-match-missing',
    );
  }

  const candidates = [...new Set((input.candidateSourceNodeIds ?? []).filter(nonBlank))];

  let sourceNodeStatus: HeartSourceNodeStatus;
  if (sameIdWrongMapping) sourceNodeStatus = 'blocked';
  else if (!exactNode) sourceNodeStatus = candidates.length ? 'candidate-review-required' : 'source-node-missing';
  else if (exactNode.licenseStatus === 'BLOCKED') sourceNodeStatus = 'blocked';
  else if (exactNode.referenceOnly) sourceNodeStatus = 'reference-only';
  else sourceNodeStatus = 'source-node-present';

  if (exactNode) {
    if (!hasCompleteBodySourceIdentity(exactNode.sourceIdentity)) blockers.push('provenance:identity-incomplete');
    if (exactNode.licenseStatus === 'BLOCKED') blockers.push('license:blocked');
    if (exactNode.licenseStatus === 'CHECK_REQUIRED') blockers.push('license:verification-required');
    if (!exactNode.productionGate.provenanceComplete) blockers.push('provenance:incomplete');
    if (!exactNode.productionGate.licenseCleared) blockers.push('license:not-cleared');
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
    geometryReady && exactNode && gatesPass(exactNode.productionGate),
  );

  const referenceDisplayAllowed = Boolean(
    exactNode &&
      sourceNodeStatus !== 'blocked' &&
      exactNode.licenseStatus !== 'BLOCKED' &&
      hasCompleteBodySourceIdentity(exactNode.sourceIdentity) &&
      targetDecision.referenceDisplayAllowed,
  );

  const verifiedHeartRenderAllowed = Boolean(
    productionReady &&
      targetDecision.verifiedAnatomyRenderAllowed &&
      identityAligned,
  );

  return {
    sourceNodeStatus,
    exactSourceNodeId: exactNode?.nodeId ?? null,
    geometryReady,
    productionReady,
    referenceDisplayAllowed,
    verifiedHeartRenderAllowed,
    // Generic educational animation may be layered separately, but never by deforming
    // evidence-bearing source geometry or claiming measured/patient physiology.
    schematicMotionAllowed: referenceDisplayAllowed,
    patientSpecificPhysiologyAllowed: false,
    blockers: [...new Set(blockers)],
  };
}
