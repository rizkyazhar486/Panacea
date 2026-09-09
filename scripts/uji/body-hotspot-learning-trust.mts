import assert from 'node:assert/strict';
import {
  evaluateBodyHotspotLearningTrust,
  type BodyHotspotLearningRecord,
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

const sourceHotspot: BodyHotspotLearningRecord = {
  hotspotId: 'fixture:lung-hotspot',
  label: 'Fixture lung',
  mode: 'learn',
  representation: 'source-geometry',
  targetTrust: verifiedTarget,
  exactSourceNodeNames: ['Fixture_Lung_Node'],
  conceptualOverlayId: null,
  evidenceMappingId: null,
};

const verified = evaluateBodyHotspotLearningTrust(sourceHotspot);
assert.equal(verified.displayAllowed, true);
assert.equal(verified.geometryHighlightAllowed, true);
assert.equal(verified.conceptualOverlayAllowed, false);
assert.equal(verified.verifiedAnatomyLabelAllowed, true);
assert.deepEqual(verified.blockers, []);

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
});
assert.equal(referenceGeometry.displayAllowed, true);
assert.equal(referenceGeometry.geometryHighlightAllowed, true);
assert.equal(referenceGeometry.verifiedAnatomyLabelAllowed, false);

const thermoreceptorConcept = evaluateBodyHotspotLearningTrust({
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
});
assert.equal(thermoreceptorConcept.displayAllowed, true);
assert.equal(thermoreceptorConcept.geometryHighlightAllowed, false);
assert.equal(thermoreceptorConcept.conceptualOverlayAllowed, true);
assert.equal(thermoreceptorConcept.verifiedAnatomyLabelAllowed, false);

const fakeConceptGeometry = evaluateBodyHotspotLearningTrust({
  ...thermoreceptorConcept,
  hotspotId: 'fixture:fake-concept-geometry',
  exactSourceNodeNames: ['Invented_Thermoreceptor_Organ'],
});
assert.equal(fakeConceptGeometry.displayAllowed, false);
assert.ok(fakeConceptGeometry.blockers.includes('conceptual-overlay:source-geometry-prohibited'));

const unprovenConcept = evaluateBodyHotspotLearningTrust({
  ...thermoreceptorConcept,
  hotspotId: 'fixture:unproven-concept',
  targetTrust: {
    ...thermoreceptorConcept.targetTrust,
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

console.log('body-hotspot-learning-trust: ok');
