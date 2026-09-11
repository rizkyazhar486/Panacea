import assert from 'node:assert/strict';
import {
  compileBodyTargetPresentation,
} from '../../src/lib/bodyTargetPresentation.ts';
import type { BodyAcademicPublicationRecord } from '../../src/lib/bodyAcademicPublicationGate.ts';
import type { BodyTargetTrustRecord } from '../../src/lib/bodyTargetTrust.ts';

const verifiedTarget: BodyTargetTrustRecord = {
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

const publishable: BodyAcademicPublicationRecord = {
  contentId: 'fixture:heart-content',
  contentVersion: 'fixture-content-v1',
  provenanceVersion: 'fixture-provenance-v1',
  targetTrust: verifiedTarget,
  evidenceCitations: [{
    citationId: 'fixture-citation',
    sourceKind: 'authoritative-anatomy',
    title: 'Fixture anatomy source',
    version: 'fixture-source-v1',
    locator: 'fixture://source',
  }],
  reviewer: {
    reviewerId: 'fixture-reviewer',
    reviewerName: 'Fixture Reviewer',
    credentials: 'Fixture anatomy credentials',
    specialtyOrDomain: 'Anatomy',
    reviewDate: '2026-09-09',
    reviewedScope: 'Fixture heart content',
    disposition: 'approved',
    limitations: 'Regression fixture only; no real reviewer or validation is asserted.',
  },
  aiAssistanceDisclosure: 'AI-assisted fixture content; test-only reviewer metadata.',
};

const verified = compileBodyTargetPresentation(publishable);
assert.equal(verified.mode, 'verified-anatomy');
assert.equal(verified.verifiedAnatomyLabelAllowed, true);
assert.equal(verified.academicallyReviewedLabelAllowed, true);
assert.equal(verified.sourceIdentityStatus, 'complete');
assert.ok(verified.mandatoryDisclosures.some((line) => line.includes('Attribution: fixture attribution')));
assert.ok(verified.mandatoryDisclosures.some((line) => line.includes('AI-assisted fixture content')));

const bareStatusBypass = compileBodyTargetPresentation({
  ...publishable,
  reviewer: null,
});
assert.equal(bareStatusBypass.mode, 'reference');
assert.equal(bareStatusBypass.verifiedAnatomyLabelAllowed, false);
assert.equal(bareStatusBypass.academicallyReviewedLabelAllowed, false);
assert.ok(bareStatusBypass.blockers.includes('qualified-review-record:incomplete-or-not-approved'));

const missingEvidenceVersion = compileBodyTargetPresentation({
  ...publishable,
  evidenceCitations: [{
    ...publishable.evidenceCitations[0],
    version: ' ',
  }],
});
assert.equal(missingEvidenceVersion.mode, 'hidden');
assert.equal(missingEvidenceVersion.verifiedAnatomyLabelAllowed, false);
assert.ok(missingEvidenceVersion.blockers.includes('evidence-citations:incomplete'));

const missingAiDisclosure = compileBodyTargetPresentation({
  ...publishable,
  aiAssistanceDisclosure: null,
});
assert.equal(missingAiDisclosure.mode, 'hidden');
assert.equal(missingAiDisclosure.verifiedAnatomyLabelAllowed, false);
assert.ok(missingAiDisclosure.blockers.includes('ai-assistance:undisclosed'));

const reference = compileBodyTargetPresentation({
  ...publishable,
  targetTrust: {
    ...verifiedTarget,
    targetId: 'fixture:reference-lung',
    geometryStatus: 'reference-only',
    evidenceStatus: 'reference-only',
    academicReviewStatus: 'pending',
  },
  reviewer: null,
});
assert.equal(reference.mode, 'reference');
assert.equal(reference.verifiedAnatomyLabelAllowed, false);
assert.equal(reference.academicallyReviewedLabelAllowed, false);
assert.ok(reference.mandatoryDisclosures.some((line) => line.includes('not verified anatomy')));

const incompleteSource = compileBodyTargetPresentation({
  ...publishable,
  targetTrust: {
    ...verifiedTarget,
    targetId: 'fixture:incomplete-source',
    sourceIdentity: { ...verifiedTarget.sourceIdentity!, revision: '   ' },
  },
});
assert.equal(incompleteSource.mode, 'reference');
assert.equal(incompleteSource.sourceIdentityStatus, 'incomplete');
assert.equal(incompleteSource.verifiedAnatomyLabelAllowed, false);
assert.ok(incompleteSource.blockers.includes('target:verified-anatomy-not-eligible'));
assert.ok(incompleteSource.mandatoryDisclosures.some((line) => line.includes('Source identity: incomplete')));

const notRepresented = compileBodyTargetPresentation({
  ...publishable,
  targetTrust: {
    ...verifiedTarget,
    targetId: 'fixture:not-represented',
    geometryStatus: 'not-represented',
    evidenceStatus: 'reference-only',
    academicReviewStatus: 'pending',
    sourceIdentity: null,
  },
  reviewer: null,
});
assert.equal(notRepresented.mode, 'hidden');
assert.equal(notRepresented.verifiedAnatomyLabelAllowed, false);

const blocked = compileBodyTargetPresentation({
  ...publishable,
  targetTrust: {
    ...verifiedTarget,
    targetId: 'fixture:blocked',
    geometryStatus: 'blocked',
    evidenceStatus: 'blocked',
    academicReviewStatus: 'blocked',
  },
});
assert.equal(blocked.mode, 'hidden');
assert.equal(blocked.verifiedAnatomyLabelAllowed, false);
assert.equal(blocked.academicallyReviewedLabelAllowed, false);

console.log('body-target-presentation: ok');
