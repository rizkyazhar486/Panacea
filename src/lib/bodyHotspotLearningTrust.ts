import {
  evaluateBodyAcademicPublication,
  type BodyAcademicPublicationRecord,
} from './bodyAcademicPublicationGate.ts';
import {
  evaluateBodyTargetTrust,
  type BodyTargetTrustRecord,
} from './bodyTargetTrust.ts';

export type BodyHotspotRepresentation =
  | 'source-geometry'
  | 'reference-geometry'
  | 'conceptual-overlay';

export type BodyHotspotLearningMode =
  | 'inspect'
  | 'learn'
  | 'quiz';

export type BodyHotspotPublicationEvidence =
  Omit<BodyAcademicPublicationRecord, 'targetTrust'>;

export interface BodyHotspotLearningRecord {
  hotspotId: string;
  label: string;
  mode: BodyHotspotLearningMode;
  representation: BodyHotspotRepresentation;
  targetTrust: BodyTargetTrustRecord;
  exactSourceNodeNames: readonly string[];
  conceptualOverlayId: string | null;
  evidenceMappingId: string | null;
  academicPublication: BodyHotspotPublicationEvidence | null;
}

export interface BodyHotspotLearningDecision {
  displayAllowed: boolean;
  geometryHighlightAllowed: boolean;
  conceptualOverlayAllowed: boolean;
  verifiedAnatomyLabelAllowed: boolean;
  blockers: string[];
}

const nonBlank = (value: string | undefined | null): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const hasExactSourceNodes = (names: readonly string[]): boolean =>
  names.length > 0 && names.every(nonBlank);

/**
 * Fail-closed hotspot/learning contract for Body Explorer.
 *
 * Geometry interaction eligibility comes from the target/source-node trust
 * contract. A user-facing verified-anatomy label additionally requires the
 * authoritative academic publication gate to pass with complete evidence,
 * provenance, AI disclosure (when applicable), and approved reviewer metadata.
 * The publication decision is always re-evaluated against this hotspot's target
 * trust; callers cannot supply a different target through publication metadata.
 */
export function evaluateBodyHotspotLearningTrust(
  record: BodyHotspotLearningRecord,
): BodyHotspotLearningDecision {
  const blockers: string[] = [];
  const targetDecision = evaluateBodyTargetTrust(record.targetTrust);
  const identityComplete = nonBlank(record.hotspotId) && nonBlank(record.label);
  const sourceNodesComplete = hasExactSourceNodes(record.exactSourceNodeNames);
  const overlayIdentityComplete =
    nonBlank(record.conceptualOverlayId) && nonBlank(record.evidenceMappingId);

  if (!identityComplete) blockers.push('hotspot-identity:incomplete');

  const targetHardBlocked =
    record.targetTrust.geometryStatus === 'blocked' ||
    record.targetTrust.evidenceStatus === 'blocked' ||
    record.targetTrust.academicReviewStatus === 'blocked';

  if (record.representation === 'conceptual-overlay') {
    if (sourceNodesComplete) {
      blockers.push('conceptual-overlay:source-geometry-prohibited');
    }
    if (!overlayIdentityComplete) {
      blockers.push('conceptual-overlay:evidence-mapping-incomplete');
    }
  } else {
    if (!sourceNodesComplete) {
      blockers.push('geometry-hotspot:exact-source-nodes-required');
    }
    if (record.conceptualOverlayId !== null || record.evidenceMappingId !== null) {
      blockers.push('geometry-hotspot:conceptual-fields-prohibited');
    }
    if (!targetDecision.referenceDisplayAllowed) {
      blockers.push('geometry-hotspot:target-display-blocked');
    }
  }

  const geometryHighlightAllowed =
    identityComplete &&
    !targetHardBlocked &&
    record.representation !== 'conceptual-overlay' &&
    sourceNodesComplete &&
    targetDecision.referenceDisplayAllowed &&
    record.conceptualOverlayId === null &&
    record.evidenceMappingId === null;

  const conceptualOverlayAllowed =
    identityComplete &&
    !targetHardBlocked &&
    record.representation === 'conceptual-overlay' &&
    !sourceNodesComplete &&
    overlayIdentityComplete &&
    record.targetTrust.evidenceStatus !== 'verification-required';

  if (
    record.representation === 'conceptual-overlay' &&
    record.targetTrust.evidenceStatus === 'verification-required'
  ) {
    blockers.push('conceptual-overlay:evidence-verification-required');
  }

  const displayAllowed = geometryHighlightAllowed || conceptualOverlayAllowed;
  const publicationDecision = record.academicPublication
    ? evaluateBodyAcademicPublication({
        ...record.academicPublication,
        targetTrust: record.targetTrust,
      })
    : null;

  if (
    geometryHighlightAllowed &&
    record.representation === 'source-geometry' &&
    !publicationDecision?.verifiedBiomedicalPublicationAllowed
  ) {
    blockers.push('verified-label:academic-publication-gate-blocked');
  }

  const verifiedAnatomyLabelAllowed =
    geometryHighlightAllowed &&
    record.representation === 'source-geometry' &&
    targetDecision.verifiedAnatomyRenderAllowed &&
    publicationDecision?.verifiedBiomedicalPublicationAllowed === true;

  return {
    displayAllowed,
    geometryHighlightAllowed,
    conceptualOverlayAllowed,
    verifiedAnatomyLabelAllowed,
    blockers,
  };
}
