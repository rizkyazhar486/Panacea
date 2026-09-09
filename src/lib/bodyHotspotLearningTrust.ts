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

export interface BodyHotspotLearningRecord {
  hotspotId: string;
  label: string;
  mode: BodyHotspotLearningMode;
  representation: BodyHotspotRepresentation;
  targetTrust: BodyTargetTrustRecord;
  exactSourceNodeNames: readonly string[];
  conceptualOverlayId: string | null;
  evidenceMappingId: string | null;
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
 * It does not resolve geometry, invent coordinates, or authenticate evidence.
 * It only decides which already-declared interaction representation is allowed.
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
  const verifiedAnatomyLabelAllowed =
    geometryHighlightAllowed &&
    record.representation === 'source-geometry' &&
    targetDecision.verifiedAnatomyRenderAllowed;

  return {
    displayAllowed,
    geometryHighlightAllowed,
    conceptualOverlayAllowed,
    verifiedAnatomyLabelAllowed,
    blockers,
  };
}
