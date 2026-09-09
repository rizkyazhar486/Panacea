import {
  evaluateBodyTargetTrust,
  type BodyTargetTrustRecord,
} from './bodyTargetTrust.ts';

export type BodyEvidenceSourceKind =
  | 'authoritative-anatomy'
  | 'peer-reviewed-literature'
  | 'standard-or-guideline'
  | 'other-reviewed-source';

export interface BodyEvidenceCitationRecord {
  citationId: string;
  sourceKind: BodyEvidenceSourceKind;
  title: string;
  version: string;
  locator: string;
}

export type BodyAcademicReviewDisposition =
  | 'approved'
  | 'changes-required'
  | 'rejected';

export interface BodyQualifiedReviewerRecord {
  reviewerId: string;
  reviewerName: string;
  credentials: string;
  specialtyOrDomain: string;
  reviewDate: string;
  reviewedScope: string;
  disposition: BodyAcademicReviewDisposition;
  limitations: string;
}

export interface BodyAcademicPublicationRecord {
  contentId: string;
  contentVersion: string;
  provenanceVersion: string;
  targetTrust: BodyTargetTrustRecord;
  evidenceCitations: readonly BodyEvidenceCitationRecord[];
  reviewer: BodyQualifiedReviewerRecord | null;
  aiAssistanceDisclosure: string | null;
}

export interface BodyAcademicPublicationDecision {
  referencePublicationAllowed: boolean;
  verifiedBiomedicalPublicationAllowed: boolean;
  academicallyReviewedLabelAllowed: boolean;
  blockers: string[];
}

const nonBlank = (value: string | undefined | null): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export const hasCompleteBodyEvidenceCitation = (
  citation: BodyEvidenceCitationRecord,
): boolean =>
  nonBlank(citation.citationId) &&
  nonBlank(citation.title) &&
  nonBlank(citation.version) &&
  nonBlank(citation.locator);

export const hasCompleteQualifiedReviewerRecord = (
  reviewer: BodyQualifiedReviewerRecord | null,
): boolean =>
  reviewer !== null &&
  nonBlank(reviewer.reviewerId) &&
  nonBlank(reviewer.reviewerName) &&
  nonBlank(reviewer.credentials) &&
  nonBlank(reviewer.specialtyOrDomain) &&
  nonBlank(reviewer.reviewDate) &&
  nonBlank(reviewer.reviewedScope) &&
  reviewer.disposition === 'approved';

/**
 * Fail-closed publication gate for Body biomedical/anatomy teaching content.
 *
 * This gate validates that review/evidence metadata are actually recorded; it
 * does not claim to authenticate reviewer credentials or independently prove a
 * biomedical assertion. Those remain human/editorial responsibilities.
 */
export function evaluateBodyAcademicPublication(
  record: BodyAcademicPublicationRecord,
): BodyAcademicPublicationDecision {
  const blockers: string[] = [];
  const targetDecision = evaluateBodyTargetTrust(record.targetTrust);
  const evidenceComplete =
    record.evidenceCitations.length > 0 &&
    record.evidenceCitations.every(hasCompleteBodyEvidenceCitation);
  const reviewerComplete = hasCompleteQualifiedReviewerRecord(record.reviewer);
  const contentIdentityComplete =
    nonBlank(record.contentId) &&
    nonBlank(record.contentVersion) &&
    nonBlank(record.provenanceVersion);
  const aiDisclosureComplete =
    !record.targetTrust.aiAssisted || nonBlank(record.aiAssistanceDisclosure);

  if (!contentIdentityComplete) blockers.push('content-provenance:incomplete');
  if (!evidenceComplete) blockers.push('evidence-citations:incomplete');
  if (!aiDisclosureComplete) blockers.push('ai-assistance:undisclosed');
  if (!targetDecision.referenceDisplayAllowed) blockers.push('target:reference-display-blocked');

  const referencePublicationAllowed =
    contentIdentityComplete &&
    evidenceComplete &&
    aiDisclosureComplete &&
    targetDecision.referenceDisplayAllowed;

  if (!reviewerComplete) blockers.push('qualified-review-record:incomplete-or-not-approved');
  if (!targetDecision.verifiedAnatomyRenderAllowed) blockers.push('target:verified-anatomy-not-eligible');

  const verifiedBiomedicalPublicationAllowed =
    referencePublicationAllowed &&
    reviewerComplete &&
    targetDecision.verifiedAnatomyRenderAllowed;

  const academicallyReviewedLabelAllowed =
    verifiedBiomedicalPublicationAllowed &&
    targetDecision.academicallyReviewedLabelAllowed;

  return {
    referencePublicationAllowed,
    verifiedBiomedicalPublicationAllowed,
    academicallyReviewedLabelAllowed,
    blockers,
  };
}
