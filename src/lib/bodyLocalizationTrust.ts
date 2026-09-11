import {
  evaluateBodyTargetTrust,
  type BodyTargetTrustRecord,
} from './bodyTargetTrust.ts';

export type BodyLocalizationKind =
  | 'disease-reference'
  | 'drug-target-reference'
  | 'adverse-effect-organ-reference'
  | 'physiology-overlay-reference'
  | 'measured-patient-lesion';

export type BodyLocalizationOrigin =
  | 'curated-reference-mapping'
  | 'measured-patient-data'
  | 'text-inference';

export type BodyLocalizationEvidenceStatus =
  | 'provenance-bearing'
  | 'verification-required'
  | 'reference-only'
  | 'blocked';

export interface BodyLocalizationSourceMapping {
  mappingId: string;
  sourceId: string;
  sourceVersion: string;
  sourceLocator: string;
  targetId: string;
  attribution: string;
}

export interface BodyMeasuredLocalizationEvidence {
  measurementId: string;
  modality: string;
  acquiredAt: string;
  sourceId: string;
}

export interface BodyLocalizationTrustRecord {
  localizationId: string;
  kind: BodyLocalizationKind;
  origin: BodyLocalizationOrigin;
  evidenceStatus: BodyLocalizationEvidenceStatus;
  sourceMapping: BodyLocalizationSourceMapping | null;
  measuredEvidence: BodyMeasuredLocalizationEvidence | null;
  targetTrust: BodyTargetTrustRecord;
}

export interface BodyLocalizationTrustDecision {
  genericReferenceLocalizationAllowed: boolean;
  measuredPatientLocalizationAllowed: boolean;
  verifiedAnatomyTargetAllowed: boolean;
  blockers: string[];
}

const nonBlank = (value: string | undefined | null): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export const hasCompleteLocalizationSourceMapping = (
  mapping: BodyLocalizationSourceMapping | null,
): boolean =>
  mapping !== null &&
  nonBlank(mapping.mappingId) &&
  nonBlank(mapping.sourceId) &&
  nonBlank(mapping.sourceVersion) &&
  nonBlank(mapping.sourceLocator) &&
  nonBlank(mapping.targetId) &&
  nonBlank(mapping.attribution);

export const hasCompleteMeasuredLocalizationEvidence = (
  evidence: BodyMeasuredLocalizationEvidence | null,
): boolean =>
  evidence !== null &&
  nonBlank(evidence.measurementId) &&
  nonBlank(evidence.modality) &&
  nonBlank(evidence.acquiredAt) &&
  nonBlank(evidence.sourceId);

export function evaluateBodyLocalizationTrust(
  record: BodyLocalizationTrustRecord,
): BodyLocalizationTrustDecision {
  const blockers: string[] = [];
  const targetDecision = evaluateBodyTargetTrust(record.targetTrust);
  const sourceMappingComplete = hasCompleteLocalizationSourceMapping(record.sourceMapping);
  const measuredEvidenceComplete = hasCompleteMeasuredLocalizationEvidence(record.measuredEvidence);

  if (record.evidenceStatus !== 'provenance-bearing') {
    blockers.push(`localization-evidence:${record.evidenceStatus}`);
  }
  if (!sourceMappingComplete) {
    blockers.push('localization-source-mapping:incomplete');
  }
  if (record.origin === 'text-inference') {
    blockers.push('localization-origin:text-inference-prohibited');
  }
  if (record.kind === 'measured-patient-lesion' && !measuredEvidenceComplete) {
    blockers.push('patient-measurement:incomplete');
  }
  if (record.kind !== 'measured-patient-lesion' && record.origin === 'measured-patient-data') {
    blockers.push('localization-origin:kind-mismatch');
  }
  if (record.kind === 'measured-patient-lesion' && record.origin !== 'measured-patient-data') {
    blockers.push('patient-localization:measured-data-required');
  }
  if (!targetDecision.referenceDisplayAllowed) {
    blockers.push('target:reference-display-blocked');
  }

  const hardBlocked =
    record.evidenceStatus === 'blocked' ||
    record.origin === 'text-inference' ||
    !sourceMappingComplete ||
    !targetDecision.referenceDisplayAllowed;

  const genericReferenceLocalizationAllowed =
    !hardBlocked &&
    record.kind !== 'measured-patient-lesion' &&
    record.origin === 'curated-reference-mapping' &&
    record.evidenceStatus === 'provenance-bearing';

  const measuredPatientLocalizationAllowed =
    !hardBlocked &&
    record.kind === 'measured-patient-lesion' &&
    record.origin === 'measured-patient-data' &&
    record.evidenceStatus === 'provenance-bearing' &&
    measuredEvidenceComplete;

  return {
    genericReferenceLocalizationAllowed,
    measuredPatientLocalizationAllowed,
    verifiedAnatomyTargetAllowed: targetDecision.verifiedAnatomyRenderAllowed,
    blockers,
  };
}
