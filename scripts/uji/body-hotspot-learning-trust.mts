import assert from 'node:assert/strict';
import {
  evaluateBodyHotspotLearningTrust,
  type BodyHotspotLearningRecord,
  type BodyHotspotPublicationEvidence,
} from '../../src/lib/bodyHotspotLearningTrust.ts';
import type { BodyTargetTrustRecord } from '../../src/lib/bodyTargetTrust.ts';

const verifiedTarget: BodyTargetTrustRecord = {
  targetId: 'fixture:lung',
  geometryStatus: 'verified-source-geometry',
  evidenceStatus: 'verified',
  sourceIdentity: {
    sourceId: 'fixture-source',
    assetId: 'fixture-lung-asset',
    revision: 'fixture-revision',
    licenseId: 'fixture-license',
    attribution: 'fixture attribution',
    transformationHistoryId: 'fixture-transform-history',
  },
  academicReviewStatus: 'qualified-review-recorded',
  aiAssisted: true,
};

const approvedPublication: BodyHotspotPublicationEvidence = {
  contentId: 'fixture:lung-hotspot-content',
  contentVersion: 'fixture-content-v1',
  provenanceVersion: 'fixture-provenance-v1',
  evidenceCitations: [{
    citationId: 'fixture-citation',
    sourceKind: 'authoritative-anatomy',
    title: 'Fixture anatomy source',
    version: 'fixture-source-version',
    locator: 'fixture://source',
  }],
  reviewer: {
    reviewerId: 'fixture-reviewer-id',
    reviewerName: 'Fixture Reviewer',
    credentials: 'Fixture anatomy credentials',
    specialtyOrDomain: 'Anatomy',
    reviewDate: '2026-09-09',
    reviewedScope: 'Fixture lung hotspot',
    disposition: 'approved',
    limitations: 'Regression fixture only; no real reviewer or clinical validation is asserted.',
  },
  aiAssistanceDisclosure: 'AI-assisted fixture; this disclosure is test-only.',
};

const sourceHotspot: BodyHotspotLearningRecord = {
  hotspotId: 'fixture:lung-hotspot',
  label: 'Fixture lung',
  mode: 'learn',
  representation: 'source-geometry',
  targetTrust: verifiedTarget,
  exactSourceNodeNames: ['Fixture_Lung_Node'],
  conceptualOverlayId: null,
  evidenceMappingId: null,
  academicPublication: approvedPublication,
};

const verified = evaluateBodyHotspotLearningTrust(sourceHotspot);
assert.equal(verified.displayAllowed, true);
assert.equal(verified.geometryHighlightAllowed, true);
assert.equal(verified.conceptualOverlayAllowed, false);
assert.equal(verified.verifiedAnatomyLabelAllowed, true);
assert.deepEqual(verified.blockers, []);

const bareStatusBypass = evaluateBodyHotspotLearningTrust({
  ...sourceHotspot,
  academicPublication: null,
});
assert.equal(bareStatusBypass.geometryHighlightAllowed, true);
assert.equal(bareStatusBypass.verifiedAnatomyLabelAllowed, false);
assert.ok(bareStatusBypass.blockers.includes('verified-label:academic-publication-gate-blocked'));

const missingReviewer = evaluateBodyHotspotLearningTrust({
  ...sourceHotspot,
  academicPublication: { ...approvedPublication, reviewer: null },
});
assert.equal(missingReviewer.verifiedAnatomyLabelAllowed, false);

const missingEvidenceVersion = evaluateBodyHotspotLearningTrust({
  ...sourceHotspot,
  academicPublication: {
    ...approvedPublication,
    evidenceCitations: [{ ...approvedPublication.evidenceCitations[0], version: ' ' }],
  },
});
assert.equal(missingEvidenceVersion.verifiedAnatomyLabelAllowed, false);

const missingAiDisclosure = evaluateBodyHotspotLearningTrust({
  ...sourceHotspot,
  academicPublication: { ...approvedPublication, aiAssistanceDisclosure: null },
});
assert.equal(missingAiDisclosure.verifiedAnatomyLabelAllowed, false);

const referenceGeometry = evaluateBodyHotspotLearningTrust({
  ...sourceHotspot,
  hotspotId: 'fixture:reference-hotspot',
  representation: 'reference-geometry',
  targetTrust: {
    ...verifiedTarget,
    geometryStatus: 'reference-only',
    evidenceStatus: 'reference-only',
    academicReviewStatus: 'pending',
  },
  academicPublication: null,
});
assert.equal(referenceGeometry.displayAllowed, true);
assert.equal(referenceGeometry.geometryHighlightAllowed, true);
assert.equal(referenceGeometry.verifiedAnatomyLabelAllowed, false);

const conceptualRecord: BodyHotspotLearningRecord = {
  hotspotId: 'fixture:thermoreception',
  label: 'Thermoreception concept',
  mode: 'learn',
  representation: 'conceptual-overlay',
  targetTrust: {
    ...verifiedTarget,
    targetId: 'fixture:thermoreception',
    geometryStatus: 'not-represented',
    evidenceStatus: 'reference-only',
    academicReviewStatus: 'pending',
    sourceIdentity: null,
  },
  exactSourceNodeNames: [],
  conceptualOverlayId: 'fixture:thermoreception-overlay',
  evidenceMappingId: 'fixture:thermoreception-evidence-map',
  academicPublication: null,
};

const conceptual = evaluateBodyHotspotLearningTrust(conceptualRecord);
assert.equal(conceptual.displayAllowed, true);
assert.equal(conceptual.geometryHighlightAllowed, false);
assert.equal(conceptual.conceptualOverlayAllowed, true);
assert.equal(conceptual.verifiedAnatomyLabelAllowed, false);

const fakeConceptGeometry = evaluateBodyHotspotLearningTrust({
  ...conceptualRecord,
  hotspotId: 'fixture:fake-concept-geometry',
  exactSourceNodeNames: ['Invented_Thermoreceptor_Organ'],
});
assert.equal(fakeConceptGeometry.displayAllowed, false);
assert.ok(fakeConceptGeometry.blockers.includes('conceptual-overlay:source-geometry-prohibited'));

const unprovenConcept = evaluateBodyHotspotLearningTrust({
  ...conceptualRecord,
  hotspotId: 'fixture:unproven-concept',
  targetTrust: {
    ...conceptualRecord.targetTrust,
    evidenceStatus: 'verification-required',
  },
});
assert.equal(unprovenConcept.displayAllowed, false);
assert.ok(unprovenConcept.blockers.includes('conceptual-overlay:evidence-verification-required'));

const missingSourceNode = evaluateBodyHotspotLearningTrust({
  ...sourceHotspot,
  hotspotId: 'fixture:missing-node',
  exactSourceNodeNames: [],
});
assert.equal(missingSourceNode.displayAllowed, false);
assert.equal(missingSourceNode.verifiedAnatomyLabelAllowed, false);
assert.ok(missingSourceNode.blockers.includes('geometry-hotspot:exact-source-nodes-required'));

const blocked = evaluateBodyHotspotLearningTrust({
  ...sourceHotspot,
  hotspotId: 'fixture:blocked',
  targetTrust: {
    ...verifiedTarget,
    geometryStatus: 'blocked',
  },
});
assert.equal(blocked.displayAllowed, false);
assert.equal(blocked.geometryHighlightAllowed, false);
assert.equal(blocked.conceptualOverlayAllowed, false);
assert.equal(blocked.verifiedAnatomyLabelAllowed, false);

console.log('body-hotspot-learning-trust: ok');
