import assert from 'node:assert/strict';
import { compileBodyTargetPresentation } from '../../src/lib/bodyTargetPresentation.ts';
import type { BodyTargetTrustRecord } from '../../src/lib/bodyTargetTrust.ts';

const verified: BodyTargetTrustRecord = {
  targetId: 'fixture:heart',
  geometryStatus: 'verified-source-geometry',
  evidenceStatus: 'verified',
  sourceIdentity: {
    sourceId: 'fixture-source',
    assetId: 'fixture-heart',
    revision: 'fixture-revision',
    licenseId: 'fixture-license',
    attribution: 'fixture attribution',
    transformationHistoryId: 'fixture-transform',
  },
  academicReviewStatus: 'qualified-review-recorded',
  aiAssisted: true,
};

const verifiedPresentation = compileBodyTargetPresentation(verified);
assert.equal(verifiedPresentation.mode, 'verified-anatomy');
assert.equal(verifiedPresentation.verifiedAnatomyLabelAllowed, true);
assert.equal(verifiedPresentation.academicallyReviewedLabelAllowed, true);
assert.equal(verifiedPresentation.sourceIdentityStatus, 'complete');
assert.ok(verifiedPresentation.mandatoryDisclosures.some((line) => line.includes('AI-assisted')));

const reference = compileBodyTargetPresentation({
  ...verified,
  targetId: 'fixture:reference-lung',
  geometryStatus: 'reference-only',
  evidenceStatus: 'reference-only',
  academicReviewStatus: 'pending',
});
assert.equal(reference.mode, 'reference');
assert.equal(reference.verifiedAnatomyLabelAllowed, false);
assert.equal(reference.academicallyReviewedLabelAllowed, false);
assert.ok(reference.mandatoryDisclosures.some((line) => line.includes('not verified anatomy')));
assert.ok(reference.mandatoryDisclosures.some((line) => line.includes('do not present as human-reviewed')));

const incompleteSource = compileBodyTargetPresentation({
  ...verified,
  targetId: 'fixture:incomplete-source',
  sourceIdentity: { ...verified.sourceIdentity!, revision: '   ' },
});
assert.equal(incompleteSource.mode, 'reference');
assert.equal(incompleteSource.sourceIdentityStatus, 'incomplete');
assert.equal(incompleteSource.verifiedAnatomyLabelAllowed, false);
assert.ok(incompleteSource.mandatoryDisclosures.some((line) => line.includes('Source identity: incomplete')));

const verificationRequired = compileBodyTargetPresentation({
  ...verified,
  targetId: 'fixture:verification-required',
  geometryStatus: 'verification-required',
  evidenceStatus: 'verification-required',
  academicReviewStatus: 'not-reviewed',
});
assert.equal(verificationRequired.mode, 'reference');
assert.equal(verificationRequired.verifiedAnatomyLabelAllowed, false);

const missing = compileBodyTargetPresentation({
  ...verified,
  targetId: 'fixture:not-represented',
  geometryStatus: 'not-represented',
  evidenceStatus: 'reference-only',
  academicReviewStatus: 'pending',
});
assert.equal(missing.mode, 'hidden');
assert.equal(missing.verifiedAnatomyLabelAllowed, false);
assert.ok(missing.mandatoryDisclosures.some((line) => line.includes('hidden')));

const blocked = compileBodyTargetPresentation({
  ...verified,
  targetId: 'fixture:blocked',
  geometryStatus: 'blocked',
  evidenceStatus: 'blocked',
  academicReviewStatus: 'blocked',
});
assert.equal(blocked.mode, 'hidden');
assert.equal(blocked.verifiedAnatomyLabelAllowed, false);
assert.equal(blocked.academicallyReviewedLabelAllowed, false);

console.log('body-target-presentation: ok');
