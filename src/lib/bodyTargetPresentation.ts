import {
  evaluateBodyTargetTrust,
  hasCompleteBodySourceIdentity,
  type BodyTargetTrustRecord,
} from './bodyTargetTrust.ts';

export type BodyTargetPresentationMode = 'hidden' | 'reference' | 'verified-anatomy';

export interface BodyTargetPresentationDisclosure {
  targetId: string;
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
}

const geometryDisclosure = (record: BodyTargetTrustRecord): string =>
  `Geometry status: ${record.geometryStatus}.`;

const evidenceDisclosure = (record: BodyTargetTrustRecord): string =>
  `Evidence status: ${record.evidenceStatus}.`;

const reviewDisclosure = (record: BodyTargetTrustRecord): string =>
  record.academicReviewStatus === 'qualified-review-recorded'
    ? 'Academic review: qualified review recorded.'
    : `Academic review: ${record.academicReviewStatus}; do not present as human-reviewed.`;

const sourceDisclosure = (record: BodyTargetTrustRecord): string => {
  if (!hasCompleteBodySourceIdentity(record.sourceIdentity)) {
    return 'Source identity: incomplete; exact asset/revision/license/attribution/transformation history not fully recorded.';
  }

  const source = record.sourceIdentity!;
  return `Source identity: ${source.sourceId} / ${source.assetId} @ ${source.revision}; license ${source.licenseId}; transformation ${source.transformationHistoryId}.`;
};

export function compileBodyTargetPresentation(
  record: BodyTargetTrustRecord,
): BodyTargetPresentationDisclosure {
  const decision = evaluateBodyTargetTrust(record);
  const sourceComplete = hasCompleteBodySourceIdentity(record.sourceIdentity);

  const mode: BodyTargetPresentationMode = decision.verifiedAnatomyRenderAllowed
    ? 'verified-anatomy'
    : decision.referenceDisplayAllowed
      ? 'reference'
      : 'hidden';

  const mandatoryDisclosures = [
    geometryDisclosure(record),
    evidenceDisclosure(record),
    sourceDisclosure(record),
    reviewDisclosure(record),
    record.aiAssisted
      ? 'Content workflow: AI-assisted; AI assistance is not human academic review.'
      : 'Content workflow: AI assistance not declared for this target.',
  ];

  if (mode === 'reference') {
    mandatoryDisclosures.push('Display mode: reference only; not verified anatomy.');
  } else if (mode === 'hidden') {
    mandatoryDisclosures.push('Display mode: hidden because the target is blocked, not represented, or otherwise not display-eligible.');
  } else {
    mandatoryDisclosures.push('Display mode: verified anatomy under the current recorded trust contract.');
  }

  return {
    targetId: record.targetId,
    mode,
    geometryStatus: record.geometryStatus,
    evidenceStatus: record.evidenceStatus,
    academicReviewStatus: record.academicReviewStatus,
    sourceIdentityStatus: sourceComplete ? 'complete' : 'incomplete',
    sourceIdentity: record.sourceIdentity,
    aiAssisted: record.aiAssisted,
    verifiedAnatomyLabelAllowed: decision.verifiedAnatomyRenderAllowed,
    academicallyReviewedLabelAllowed: decision.academicallyReviewedLabelAllowed,
    mandatoryDisclosures,
  };
}
