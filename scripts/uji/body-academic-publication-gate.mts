import assert from 'node:assert/strict';
import {
  evaluateBodyAcademicPublication,
  type BodyAcademicPublicationRecord,
} from '../../src/lib/bodyAcademicPublicationGate.ts';
import type { BodyTargetTrustRecord } from '../../src/lib/bodyTargetTrust.ts';

const verifiedTarget: BodyTargetTrustRecord = {
  targetId: 'fixture:heart',
  geometryStatus: 'verified-source-geometry',
  evidenceStatus: 'verified',
  sourceIdentity: {
    sourceId: 'fixture-source',
    assetId: 'fixture-heart-asset',
    revision: 'fixture-revision',
    licenseId: 'fixture-license',
    attribution: 'fixture attribution',
    transformationHistoryId: 'fixture-transform-history',
  },
  academicReviewStatus: 'qualified-review-recorded',
  aiAssisted: true,
};

const publishable: BodyAcademicPublicationRecord = {
  contentId: 'fixture:heart-teaching-content',
  contentVersion: 'fixture-content-v1',
  provenanceVersion: 'fixture-provenance-v1',
  targetTrust: verifiedTarget,
  evidenceCitations: [{
    citationId: 'fixture-citation',
    sourceKind: 'authoritative-anatomy',
    title: 'Fixture authoritative anatomy source',
    version: 'fixture-source-version',
    locator: 'fixture://citation',
  }],
  reviewer: {
    reviewerId: 'fixture-reviewer-id',
    reviewerName: 'Fixture Reviewer',
    credentials: 'Fixture anatomy credential',
    specialtyOrDomain: 'Anatomy',
    reviewDate: '2026-01-01',
    reviewedScope: 'Fixture heart teaching content',
    disposition: 'approved',
    limitations: 'Fixture only; no patient-specific use.',
  },
  aiAssistanceDisclosure: 'AI-assisted drafting; evidence and scope require recorded human review.',
};

const approved = evaluateBodyAcademicPublication(publishable);
assert.equal(approved.referencePublicationAllowed, true);
assert.equal(approved.verifiedBiomedicalPublicationAllowed, true);
assert.equal(approved.academicallyReviewedLabelAllowed, true);
assert.deepEqual(approved.blockers, []);

const missingReviewer = evaluateBodyAcademicPublication({
  ...publishable,
  reviewer: null,
});
assert.equal(missingReviewer.referencePublicationAllowed, true);
assert.equal(missingReviewer.verifiedBiomedicalPublicationAllowed, false);
assert.equal(missingReviewer.academicallyReviewedLabelAllowed, false);
assert.ok(missingReviewer.blockers.includes('qualified-review-record:incomplete-or-not-approved'));

const changesRequired = evaluateBodyAcademicPublication({
  ...publishable,
  reviewer: { ...publishable.reviewer!, disposition: 'changes-required' },
});
assert.equal(changesRequired.verifiedBiomedicalPublicationAllowed, false);

const missingEvidenceVersion = evaluateBodyAcademicPublication({
  ...publishable,
  evidenceCitations: [{ ...publishable.evidenceCitations[0], version: ' ' }],
});
assert.equal(missingEvidenceVersion.referencePublicationAllowed, false);
assert.equal(missingEvidenceVersion.verifiedBiomedicalPublicationAllowed, false);
assert.ok(missingEvidenceVersion.blockers.includes('evidence-citations:incomplete'));

const undisclosedAi = evaluateBodyAcademicPublication({
  ...publishable,
  aiAssistanceDisclosure: null,
});
assert.equal(undisclosedAi.referencePublicationAllowed, false);
assert.ok(undisclosedAi.blockers.includes('ai-assistance:undisclosed'));

const referenceOnly = evaluateBodyAcademicPublication({
  ...publishable,
  targetTrust: {
    ...verifiedTarget,
    geometryStatus: 'reference-only',
    evidenceStatus: 'reference-only',
    academicReviewStatus: 'pending',
  },
  reviewer: null,
});
assert.equal(referenceOnly.referencePublicationAllowed, true);
assert.equal(referenceOnly.verifiedBiomedicalPublicationAllowed, false);
assert.equal(referenceOnly.academicallyReviewedLabelAllowed, false);

const blockedTarget = evaluateBodyAcademicPublication({
  ...publishable,
  targetTrust: { ...verifiedTarget, geometryStatus: 'blocked' },
});
assert.equal(blockedTarget.referencePublicationAllowed, false);
assert.equal(blockedTarget.verifiedBiomedicalPublicationAllowed, false);
assert.ok(blockedTarget.blockers.includes('target:reference-display-blocked'));

console.log('body-academic-publication-gate: ok');
