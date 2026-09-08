export type BodyGeometryStatus =
  | 'verified-source-geometry'
  | 'reference-only'
  | 'verification-required'
  | 'not-represented'
  | 'blocked';

export type BodyEvidenceStatus =
  | 'verified'
  | 'reference-only'
  | 'verification-required'
  | 'blocked';

export type BodyAcademicReviewStatus =
  | 'qualified-review-recorded'
  | 'pending'
  | 'not-reviewed'
  | 'blocked';

export interface BodySourceIdentity {
  sourceId: string;
  assetId: string;
  revision: string;
  licenseId: string;
  attribution: string;
  transformationHistoryId: string;
}

export interface BodyTargetTrustRecord {
  targetId: string;
  geometryStatus: BodyGeometryStatus;
  evidenceStatus: BodyEvidenceStatus;
  sourceIdentity: BodySourceIdentity | null;
  academicReviewStatus: BodyAcademicReviewStatus;
  aiAssisted: boolean;
}

export interface BodyTargetTrustDecision {
  referenceDisplayAllowed: boolean;
  verifiedAnatomyRenderAllowed: boolean;
  academicallyReviewedLabelAllowed: boolean;
  blockers: string[];
}

const nonBlank = (value: string | undefined | null): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export const hasCompleteBodySourceIdentity = (
  source: BodySourceIdentity | null,
): boolean =>
  source !== null &&
  nonBlank(source.sourceId) &&
  nonBlank(source.assetId) &&
  nonBlank(source.revision) &&
  nonBlank(source.licenseId) &&
  nonBlank(source.attribution) &&
  nonBlank(source.transformationHistoryId);

export function evaluateBodyTargetTrust(
  record: BodyTargetTrustRecord,
): BodyTargetTrustDecision {
  const blockers: string[] = [];
  const sourceComplete = hasCompleteBodySourceIdentity(record.sourceIdentity);

  if (record.geometryStatus !== 'verified-source-geometry') {
    blockers.push(`geometry:${record.geometryStatus}`);
  }
  if (record.evidenceStatus !== 'verified') {
    blockers.push(`evidence:${record.evidenceStatus}`);
  }
  if (!sourceComplete) {
    blockers.push('source-identity:incomplete');
  }
  if (record.academicReviewStatus !== 'qualified-review-recorded') {
    blockers.push(`academic-review:${record.academicReviewStatus}`);
  }

  const hardBlocked =
    record.geometryStatus === 'blocked' ||
    record.evidenceStatus === 'blocked' ||
    record.academicReviewStatus === 'blocked';

  const referenceDisplayAllowed =
    !hardBlocked &&
    record.geometryStatus !== 'not-represented' &&
    (record.geometryStatus === 'verified-source-geometry' ||
      record.geometryStatus === 'reference-only' ||
      record.geometryStatus === 'verification-required');

  const verifiedAnatomyRenderAllowed =
    !hardBlocked &&
    record.geometryStatus === 'verified-source-geometry' &&
    record.evidenceStatus === 'verified' &&
    sourceComplete &&
    record.academicReviewStatus === 'qualified-review-recorded';

  const academicallyReviewedLabelAllowed =
    record.academicReviewStatus === 'qualified-review-recorded';

  return {
    referenceDisplayAllowed,
    verifiedAnatomyRenderAllowed,
    academicallyReviewedLabelAllowed,
    blockers,
  };
}
