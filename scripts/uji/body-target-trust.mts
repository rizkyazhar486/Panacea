import assert from 'node:assert/strict';
import {
  evaluateBodyTargetTrust,
  type BodyTargetTrustRecord,
} from '../../src/lib/bodyTargetTrust.ts';

const completeSource = {
  sourceId: 'z-anatomy',
  assetId: 'fixture-organ',
  revision: 'fixture-revision',
  licenseId: 'fixture-license',
  attribution: 'fixture attribution',
  transformationHistoryId: 'fixture-transform-lineage',
};

const verified: BodyTargetTrustRecord = {
  targetId: 'fixture:verified-organ',
  geometryStatus: 'verified-source-geometry',
  evidenceStatus: 'verified',
  sourceIdentity: completeSource,
  academicReviewStatus: 'qualified-review-recorded',
  aiAssisted: true,
};

assert.deepEqual(evaluateBodyTargetTrust(verified), {
  referenceDisplayAllowed: true,
  verifiedAnatomyRenderAllowed: true,
  academicallyReviewedLabelAllowed: true,
  blockers: [],
});

const referenceOnly: BodyTargetTrustRecord = {
  ...verified,
  targetId: 'fixture:reference-only',
  geometryStatus: 'reference-only',
  evidenceStatus: 'reference-only',
  academicReviewStatus: 'pending',
};

const referenceDecision = evaluateBodyTargetTrust(referenceOnly);
assert.equal(referenceDecision.referenceDisplayAllowed, true);
assert.equal(referenceDecision.verifiedAnatomyRenderAllowed, false);
assert.equal(referenceDecision.academicallyReviewedLabelAllowed, false);
assert.ok(referenceDecision.blockers.includes('geometry:reference-only'));
assert.ok(referenceDecision.blockers.includes('evidence:reference-only'));
assert.ok(referenceDecision.blockers.includes('academic-review:pending'));

const incompleteSource = evaluateBodyTargetTrust({
  ...verified,
  targetId: 'fixture:incomplete-source',
  sourceIdentity: { ...completeSource, revision: '   ' },
});
assert.equal(incompleteSource.referenceDisplayAllowed, true);
assert.equal(incompleteSource.verifiedAnatomyRenderAllowed, false);
assert.ok(incompleteSource.blockers.includes('source-identity:incomplete'));

const absentGeometry = evaluateBodyTargetTrust({
  ...verified,
  targetId: 'fixture:not-represented',
  geometryStatus: 'not-represented',
});
assert.equal(absentGeometry.referenceDisplayAllowed, false);
assert.equal(absentGeometry.verifiedAnatomyRenderAllowed, false);

const blocked = evaluateBodyTargetTrust({
  ...verified,
  targetId: 'fixture:blocked',
  evidenceStatus: 'blocked',
});
assert.equal(blocked.referenceDisplayAllowed, false);
assert.equal(blocked.verifiedAnatomyRenderAllowed, false);
assert.ok(blocked.blockers.includes('evidence:blocked'));

console.log('body-target-trust: ok');
