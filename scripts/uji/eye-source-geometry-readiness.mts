import assert from 'node:assert/strict';
import {
  evaluateEyeSourceGeometryReadiness,
  type EyeAssetProductionGate,
  type EyeSourceNodeRecord,
} from '../../src/lib/eyeSourceGeometryReadiness.ts';
import type { BodyTargetTrustRecord } from '../../src/lib/bodyTargetTrust.ts';

const completeSource = {
  sourceId: 'fixture-source',
  assetId: 'fixture-eye-asset',
  revision: 'fixture-revision-sha',
  licenseId: 'fixture-license',
  attribution: 'fixture attribution',
  transformationHistoryId: 'fixture-transform-lineage',
};

const fullGate: EyeAssetProductionGate = {
  provenanceComplete: true,
  licenseCleared: true,
  stableIdMapped: true,
  artifactVerified: true,
  performanceReviewed: true,
  visualQaReviewed: true,
};

const verifiedTarget: BodyTargetTrustRecord = {
  targetId: 'eye:fixture-structure',
  geometryStatus: 'verified-source-geometry',
  evidenceStatus: 'verified',
  sourceIdentity: completeSource,
  academicReviewStatus: 'qualified-review-recorded',
  aiAssisted: true,
};

const exactNode: EyeSourceNodeRecord = {
  nodeId: 'fixture-exact-node',
  canonicalTargetId: verifiedTarget.targetId,
  sourceIdentity: completeSource,
  licenseStatus: 'VERIFIED',
  referenceOnly: false,
  productionGate: fullGate,
};

const exact = evaluateEyeSourceGeometryReadiness({
  targetTrust: verifiedTarget,
  requestedSourceNodeId: exactNode.nodeId,
  sourceNodes: [exactNode],
});

assert.equal(exact.sourceNodeStatus, 'source-node-present');
assert.equal(exact.provenanceStatus, 'provenance-complete');
assert.equal(exact.geometryReady, true);
assert.equal(exact.productionReady, true);
assert.equal(exact.referenceDisplayAllowed, true);
assert.equal(exact.verifiedEyeRenderAllowed, true);
assert.deepEqual(exact.blockers, []);

const candidateOnly = evaluateEyeSourceGeometryReadiness({
  targetTrust: verifiedTarget,
  requestedSourceNodeId: 'missing-exact-node',
  sourceNodes: [exactNode],
  candidateSourceNodeIds: ['possible-node-a', 'possible-node-a', 'possible-node-b'],
});
assert.equal(candidateOnly.sourceNodeStatus, 'candidate-review-required');
assert.equal(candidateOnly.exactSourceNodeId, null);
assert.deepEqual(candidateOnly.candidateSourceNodeIds, ['possible-node-a', 'possible-node-b']);
assert.equal(candidateOnly.geometryReady, false);
assert.equal(candidateOnly.verifiedEyeRenderAllowed, false);
assert.ok(candidateOnly.blockers.includes('source-node:exact-match-missing'));

const wrongTargetNode: EyeSourceNodeRecord = {
  ...exactNode,
  canonicalTargetId: 'eye:different-structure',
};
const wrongMapping = evaluateEyeSourceGeometryReadiness({
  targetTrust: verifiedTarget,
  requestedSourceNodeId: wrongTargetNode.nodeId,
  sourceNodes: [wrongTargetNode],
});
assert.equal(wrongMapping.sourceNodeStatus, 'blocked');
assert.equal(wrongMapping.verifiedEyeRenderAllowed, false);
assert.ok(wrongMapping.blockers.includes('source-node:target-mapping-mismatch'));

const licensePendingNode: EyeSourceNodeRecord = {
  ...exactNode,
  licenseStatus: 'CHECK_REQUIRED',
  productionGate: { ...fullGate, licenseCleared: false },
};
const licensePending = evaluateEyeSourceGeometryReadiness({
  targetTrust: verifiedTarget,
  requestedSourceNodeId: licensePendingNode.nodeId,
  sourceNodes: [licensePendingNode],
});
assert.equal(licensePending.provenanceStatus, 'license-verification-required');
assert.equal(licensePending.geometryReady, false);
assert.equal(licensePending.verifiedEyeRenderAllowed, false);
assert.ok(licensePending.blockers.includes('license:verification-required'));

const incompleteProvenanceNode: EyeSourceNodeRecord = {
  ...exactNode,
  sourceIdentity: { ...completeSource, revision: '   ' },
  productionGate: { ...fullGate, provenanceComplete: false },
};
const incompleteProvenance = evaluateEyeSourceGeometryReadiness({
  targetTrust: verifiedTarget,
  requestedSourceNodeId: incompleteProvenanceNode.nodeId,
  sourceNodes: [incompleteProvenanceNode],
});
assert.equal(incompleteProvenance.provenanceStatus, 'provenance-incomplete');
assert.equal(incompleteProvenance.geometryReady, false);
assert.equal(incompleteProvenance.verifiedEyeRenderAllowed, false);
assert.ok(incompleteProvenance.blockers.includes('provenance:incomplete'));
assert.ok(incompleteProvenance.blockers.includes('source-identity:target-trust-mismatch'));

const referenceNode: EyeSourceNodeRecord = {
  ...exactNode,
  referenceOnly: true,
};
const referenceTarget: BodyTargetTrustRecord = {
  ...verifiedTarget,
  geometryStatus: 'reference-only',
  evidenceStatus: 'reference-only',
  academicReviewStatus: 'pending',
};
const reference = evaluateEyeSourceGeometryReadiness({
  targetTrust: referenceTarget,
  requestedSourceNodeId: referenceNode.nodeId,
  sourceNodes: [referenceNode],
});
assert.equal(reference.sourceNodeStatus, 'reference-only');
assert.equal(reference.geometryReady, false);
assert.equal(reference.referenceDisplayAllowed, true);
assert.equal(reference.verifiedEyeRenderAllowed, false);
assert.ok(reference.blockers.includes('asset:reference-only'));

const qaPendingNode: EyeSourceNodeRecord = {
  ...exactNode,
  productionGate: { ...fullGate, visualQaReviewed: false },
};
const qaPending = evaluateEyeSourceGeometryReadiness({
  targetTrust: verifiedTarget,
  requestedSourceNodeId: qaPendingNode.nodeId,
  sourceNodes: [qaPendingNode],
});
assert.equal(qaPending.geometryReady, true);
assert.equal(qaPending.productionReady, false);
assert.equal(qaPending.verifiedEyeRenderAllowed, false);
assert.ok(qaPending.blockers.includes('asset:visual-qa-unreviewed'));

const blockedNode: EyeSourceNodeRecord = {
  ...exactNode,
  licenseStatus: 'BLOCKED',
};
const blocked = evaluateEyeSourceGeometryReadiness({
  targetTrust: verifiedTarget,
  requestedSourceNodeId: blockedNode.nodeId,
  sourceNodes: [blockedNode],
});
assert.equal(blocked.sourceNodeStatus, 'blocked');
assert.equal(blocked.provenanceStatus, 'blocked');
assert.equal(blocked.referenceDisplayAllowed, false);
assert.equal(blocked.verifiedEyeRenderAllowed, false);

console.log('eye-source-geometry-readiness: ok');
