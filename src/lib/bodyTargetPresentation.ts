import {
  evaluateBodyAcademicPublication,
  type BodyAcademicPublicationRecord,
} from './bodyAcademicPublicationGate.ts';
import {
  hasCompleteBodySourceIdentity,
  type BodyTargetTrustRecord,
} from './bodyTargetTrust.ts';

export type BodyTargetPresentationMode = 'hidden' | 'reference' | 'verified-anatomy';

export interface BodyTargetPresentationDisclosure {
  targetId: string;
  contentId: string;
  mode: BodyTargetPresentationMode;
  geometryStatus: BodyTargetTrustRecord['geometryStatus'];
  evidenceStatus: BodyTargetTrustRecord['evidenceStatus'];
  academicReviewStatus: BodyTargetTrustRecord['academicReviewStatus'];
  sourceIdentityStatus: 'complete' | 'incomplete';
  sourceIdentity: BodyTargetTrustRecord['sourceIdentity'];
  aiAssisted: boolean;
  verifiedAnatomyLabelAllowed: boolean;
  academicallyReviewedLabelAllowed: boolean;
  mandatoryDisclosures: readonly string[];
  blockers: readonly string[];
}

const sourceDisclosure = (record: BodyTargetTrustRecord): string => {
  if (!hasCompleteBodySourceIdentity(record.sourceIdentity)) {
    return 'Source identity: incomplete; exact asset/revision/license/attribution/transformation history not fully recorded.';
  }

  const source = record.sourceIdentity!;
  return [
    `Source identity: ${source.sourceId} / ${source.assetId} @ ${source.revision}.`,
    `License: ${source.licenseId}.`,
    `Attribution: ${source.attribution}.`,
    `Transformation history: ${source.transformationHistoryId}.`,
  ].join(' ');
};

/**
 * Compile a renderer-neutral presentation only from the authoritative academic
 * publication record. A target status enum alone can never produce verified or
 * academically-reviewed presentation.
 */
export function compileBodyTargetPresentation(
  record: BodyAcademicPublicationRecord,
): BodyTargetPresentationDisclosure {
  const target = record.targetTrust;
  const publication = evaluateBodyAcademicPublication(record);
  const sourceComplete = hasCompleteBodySourceIdentity(target.sourceIdentity);

  const mode: BodyTargetPresentationMode =
    publication.verifiedBiomedicalPublicationAllowed
      ? 'verified-anatomy'
      : publication.referencePublicationAllowed
        ? 'reference'
        : 'hidden';

  const mandatoryDisclosures = [
    `Geometry status: ${target.geometryStatus}.`,
    `Evidence status: ${target.evidenceStatus}.`,
    sourceDisclosure(target),
    publication.academicallyReviewedLabelAllowed
      ? 'Academic review: complete approved qualified-review record is recorded for this content version and scope.'
      : 'Academic review: verified human-reviewed label is not permitted by the current publication record.',
    target.aiAssisted
      ? record.aiAssistanceDisclosure?.trim()
        ? `Content workflow: AI-assisted; disclosure: ${record.aiAssistanceDisclosure.trim()}`
        : 'Content workflow: AI-assisted; required disclosure is missing.'
      : 'Content workflow: AI assistance not declared for this target.',
  ];

  if (mode === 'reference') {
    mandatoryDisclosures.push('Display mode: reference only; not verified anatomy.');
  } else if (mode === 'hidden') {
    mandatoryDisclosures.push('Display mode: hidden because required publication evidence or target eligibility is incomplete.');
  } else {
    mandatoryDisclosures.push('Display mode: verified anatomy under the complete recorded publication contract.');
  }

  return {
    targetId: target.targetId,
    contentId: record.contentId,
    mode,
    geometryStatus: target.geometryStatus,
    evidenceStatus: target.evidenceStatus,
    academicReviewStatus: target.academicReviewStatus,
    sourceIdentityStatus: sourceComplete ? 'complete' : 'incomplete',
    sourceIdentity: target.sourceIdentity,
    aiAssisted: target.aiAssisted,
    verifiedAnatomyLabelAllowed: publication.verifiedBiomedicalPublicationAllowed,
    academicallyReviewedLabelAllowed: publication.academicallyReviewedLabelAllowed,
    mandatoryDisclosures,
    blockers: publication.blockers,
  };
}
