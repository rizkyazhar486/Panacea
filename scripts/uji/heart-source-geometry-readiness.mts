import assert from 'node:assert/strict';
import {
  evaluateHeartSourceGeometryReadiness,
  type HeartProductionGate,
  type HeartSourceNodeRecord,
} from '../../src/lib/heartSourceGeometryReadiness.ts';
import type { BodyTargetTrustRecord } from '../../src/lib/bodyTargetTrust.ts';

const source = {
  sourceId: 'fixture-source',
  assetId: 'fixture-heart-asset',
  revision: 'fixture-revision',
  licenseId: 'fixture-license',
  attribution: 'fixture attribution',
  transformationHistoryId: 'fixture-transform-lineage',
};

const fullGate: HeartProductionGate = {
  provenanceComplete: true,
  licenseCleared: true,
  stableIdMapped: true,
  artifactVerified: true,
  performanceReviewed: true,
  visualQaReviewed: true,
};

const target: BodyTargetTrustRecord = {
  targetId: 'heart:left-ventricle',
  geometryStatus: 'verified-source-geometry',
  evidenceStatus: 'verified',
  sourceIdentity: source,
  academicReviewStatus: 'qualified-review-recorded',
  aiAssisted: true,
};

const exactNode: HeartSourceNodeRecord = {
  nodeId: 'heart-node-left-ventricle',
  canonicalTargetId: target.targetId,
  structureClass: 'chamber',
  sourceIdentity: source,
  licenseStatus: 'VERIFIED',
  referenceOnly: false,
  productionGate: fullGate,
};

const exact = evaluateHeartSourceGeometryReadiness({
  targetTrust: target,
  requestedSourceNodeId: exactNode.nodeId,
  expectedStructureClass: 'chamber',
  sourceNodes: [exactNode],
});
assert.equal(exact.verifiedHeartRenderAllowed, true);
assert.equal(exact.productionReady, true);
assert.equal(exact.patientSpecificPhysiologyAllowed, false);
assert.deepEqual(exact.blockers, []);

const candidateOnly = evaluateHeartSourceGeometryReadiness({
  targetTrust: target,
  requestedSourceNodeId: 'missing-node',
  expectedStructureClass: 'chamber',
  sourceNodes: [exactNode],
  candidateSourceNodeIds: ['possible-a'],
});
assert.equal(candidateOnly.sourceNodeStatus, 'candidate-review-required');
assert.equal(candidateOnly.verifiedHeartRenderAllowed, false);

const wrongClass = evaluateHeartSourceGeometryReadiness({
  targetTrust: target,
  requestedSourceNodeId: exactNode.nodeId,
  expectedStructureClass: 'valve',
  sourceNodes: [exactNode],
});
assert.equal(wrongClass.sourceNodeStatus, 'blocked');
assert.ok(wrongClass.blockers.includes('source-node:target-or-class-mismatch'));

const pendingLicense = evaluateHeartSourceGeometryReadiness({
  targetTrust: target,
  requestedSourceNodeId: exactNode.nodeId,
  expectedStructureClass: 'chamber',
  sourceNodes: [{
    ...exactNode,
    licenseStatus: 'CHECK_REQUIRED',
    productionGate: { ...fullGate, licenseCleared: false },
  }],
});
assert.equal(pendingLicense.geometryReady, false);
assert.equal(pendingLicense.verifiedHeartRenderAllowed, false);
assert.ok(pendingLicense.blockers.includes('license:verification-required'));

const qaPending = evaluateHeartSourceGeometryReadiness({
  targetTrust: target,
  requestedSourceNodeId: exactNode.nodeId,
  expectedStructureClass: 'chamber',
  sourceNodes: [{
    ...exactNode,
    productionGate: { ...fullGate, visualQaReviewed: false },
  }],
});
assert.equal(qaPending.geometryReady, true);
assert.equal(qaPending.productionReady, false);
assert.equal(qaPending.verifiedHeartRenderAllowed, false);

const referenceTarget: BodyTargetTrustRecord = {
  ...target,
  geometryStatus: 'reference-only',
  evidenceStatus: 'reference-only',
  academicReviewStatus: 'pending',
};
const reference = evaluateHeartSourceGeometryReadiness({
  targetTrust: referenceTarget,
  requestedSourceNodeId: exactNode.nodeId,
  expectedStructureClass: 'chamber',
  sourceNodes: [{ ...exactNode, referenceOnly: true }],
});
assert.equal(reference.referenceDisplayAllowed, true);
assert.equal(reference.verifiedHeartRenderAllowed, false);
assert.equal(reference.schematicMotionAllowed, true);
assert.equal(reference.patientSpecificPhysiologyAllowed, false);

const blocked = evaluateHeartSourceGeometryReadiness({
  targetTrust: target,
  requestedSourceNodeId: exactNode.nodeId,
  expectedStructureClass: 'chamber',
  sourceNodes: [{ ...exactNode, licenseStatus: 'BLOCKED' }],
});
assert.equal(blocked.sourceNodeStatus, 'blocked');
assert.equal(blocked.referenceDisplayAllowed, false);
assert.equal(blocked.verifiedHeartRenderAllowed, false);

console.log('heart-source-geometry-readiness: ok');
