/**
 * Organ/system-specific educational relationship admission.
 *
 * This module deliberately stores evidence metadata and safety boundaries only.
 * It does not assert anatomy, physiology, pathology, drug effects, imaging
 * findings, diagnosis, treatment, or patient-specific inference. Scientific
 * claims must arrive from separately curated evidence and qualified review.
 */

export type OrganRelationshipDomain =
  | 'anatomy'
  | 'physiology'
  | 'pathophysiology'
  | 'pharmacology'
  | 'imaging'
  | 'education'

export type OrganEvidenceLevel = 'primary' | 'secondary' | 'guideline' | 'reference'

export interface OrganRelationshipEndpoint {
  readonly kind: OrganRelationshipDomain
  readonly ref: string
}

export interface OrganRelationshipProvenance {
  readonly sourceId: string
  readonly sourceRevision: string
  readonly sourceLocator: string
  readonly license: string
  readonly evidenceLevel: OrganEvidenceLevel
  readonly reviewStatus: 'academic-review-required' | 'academic-reviewed'
}

export interface CrossOrganEvidence {
  readonly sourceLocator: string
  readonly relation: 'system-interaction' | 'anatomical-continuity' | 'physiologic-coupling'
}

export interface OrganEvidenceRelationship {
  readonly id: string
  readonly systemId: string
  readonly organId: string
  readonly targetOrganId?: string
  readonly from: OrganRelationshipEndpoint
  readonly to: OrganRelationshipEndpoint
  readonly claim: string
  readonly provenance: OrganRelationshipProvenance
  readonly boundary: 'reference-educational' | 'simulated-educational'
  readonly crossOrganEvidence?: CrossOrganEvidence
}

export type OrganRelationshipBlocker =
  | 'missing-identity'
  | 'missing-endpoint'
  | 'missing-claim'
  | 'invalid-provenance'
  | 'unpinned-source-revision'
  | 'unsupported-boundary'
  | 'cross-organ-edge-not-declared'

export interface OrganRelationshipAdmission {
  readonly admitted: boolean
  readonly publicationReady: boolean
  readonly blockers: readonly OrganRelationshipBlocker[]
}

function isPinnedRevision(value: string) {
  const normalized = value.trim().toLowerCase()
  return Boolean(normalized) && !['latest', 'main', 'master', 'head', 'current'].includes(normalized)
}

/**
 * Fail-closed admission for organ/system educational edges.
 *
 * Admission means only that the relationship is structurally eligible to enter
 * an educational evidence graph. It is not proof that the biomedical claim is
 * correct. Publication readiness additionally requires a real academic-reviewed
 * status supplied by the repository's human review workflow.
 */
export function admitOrganRelationship(edge: OrganEvidenceRelationship): OrganRelationshipAdmission {
  const blockers: OrganRelationshipBlocker[] = []
  const p = edge.provenance

  if (!edge.id.trim() || !edge.systemId.trim() || !edge.organId.trim()) blockers.push('missing-identity')
  if (!edge.from.ref.trim() || !edge.to.ref.trim()) blockers.push('missing-endpoint')
  if (!edge.claim.trim()) blockers.push('missing-claim')

  if (!p.sourceId.trim() || !p.sourceLocator.trim() || !p.license.trim()) {
    blockers.push('invalid-provenance')
  }
  if (!isPinnedRevision(p.sourceRevision)) blockers.push('unpinned-source-revision')

  if (edge.boundary !== 'reference-educational' && edge.boundary !== 'simulated-educational') {
    blockers.push('unsupported-boundary')
  }

  const crossesOrgans = Boolean(edge.targetOrganId && edge.targetOrganId !== edge.organId)
  if (crossesOrgans && (!edge.crossOrganEvidence?.sourceLocator.trim() || !edge.crossOrganEvidence.relation)) {
    blockers.push('cross-organ-edge-not-declared')
  }

  const admitted = blockers.length === 0
  return {
    admitted,
    publicationReady: admitted && p.reviewStatus === 'academic-reviewed',
    blockers,
  }
}

export const ORGAN_RELATIONSHIP_EVIDENCE_BOUNDARY =
  'Organ/system relationships are educational reference or explicitly simulated edges only. Admission requires pinned provenance and explicit cross-organ evidence when applicable; it never establishes biomedical truth, patient-specific anatomy, diagnosis, treatment, validation, licensing clearance, or human review.'
