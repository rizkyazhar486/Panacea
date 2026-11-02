/**
 * Anatomical Structure Review & Provenance Audit Workflow Engine (BX-10).
 *
 * Enforces a deterministic, fail-closed governance workflow for 3D anatomical
 * assets before they can be marked anatomist-approved.
 */

export type WorkflowStage =
  | 'draft'
  | 'geometry-verified'
  | 'ontology-verified'
  | 'anatomist-approved'
  | 'rejected';

export interface StructureWorkflowInput {
  readonly structureId: string;
  readonly meshSha256: string;
  readonly ontologyTermId: string;
  readonly licenceSpdx: string;
  readonly submitterId: string;
  readonly reviewerId: string;
  readonly manifoldChecked: boolean;
  readonly lateralityVerified: boolean;
  readonly decision: 'approve' | 'reject';
  readonly reviewNotes: string;
}

export type StructureWorkflowFailureReason =
  | 'invalid-input'
  | 'invalid-sha256-digest'
  | 'invalid-ontology-id'
  | 'self-approval-prohibited'
  | 'unverified-geometry-or-laterality';

export interface StructureWorkflowSuccess {
  readonly ok: true;
  readonly structureId: string;
  readonly stage: WorkflowStage;
  readonly meshSha256: string;
  readonly ontologyTermId: string;
  readonly licenceSpdx: string;
  readonly submitterId: string;
  readonly reviewerId: string;
  readonly productionEligible: boolean;
  readonly truthClass: 'reference';
}

export interface StructureWorkflowFailure {
  readonly ok: false;
  readonly reason: StructureWorkflowFailureReason;
  readonly detail: string;
  readonly productionEligible: false;
  readonly truthClass: 'reference';
}

export type StructureWorkflowResult = StructureWorkflowSuccess | StructureWorkflowFailure;

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;
const ONTOLOGY_ID_REGEX = /^(FMA:\d+|UBERON:\d{7})$/;

export function evaluateStructureReviewWorkflow(
  input: StructureWorkflowInput,
): StructureWorkflowResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'StructureWorkflowInput object is required.',
      productionEligible: false,
      truthClass: 'reference',
    });
  }

  const {
    structureId,
    meshSha256,
    ontologyTermId,
    licenceSpdx,
    submitterId,
    reviewerId,
    manifoldChecked,
    lateralityVerified,
    decision,
    reviewNotes,
  } = input;

  if (
    [structureId, meshSha256, ontologyTermId, licenceSpdx, submitterId, reviewerId, reviewNotes].some(
      s => typeof s !== 'string' || s.trim().length === 0,
    )
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'All string identifiers, licence, and reviewNotes must be non-empty strings.',
      productionEligible: false,
      truthClass: 'reference',
    });
  }

  if (!SHA256_HEX_REGEX.test(meshSha256.trim())) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-sha256-digest',
      detail: `meshSha256 "${meshSha256}" is not a valid 64-character hexadecimal SHA-256 digest.`,
      productionEligible: false,
      truthClass: 'reference',
    });
  }

  if (!ONTOLOGY_ID_REGEX.test(ontologyTermId.trim())) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-ontology-id',
      detail: `ontologyTermId "${ontologyTermId}" must match FMA:<digits> or UBERON:<7 digits>.`,
      productionEligible: false,
      truthClass: 'reference',
    });
  }

  if (submitterId.trim().toLowerCase() === reviewerId.trim().toLowerCase()) {
    return Object.freeze({
      ok: false,
      reason: 'self-approval-prohibited',
      detail: `Submitter "${submitterId}" cannot self-review structure "${structureId}".`,
      productionEligible: false,
      truthClass: 'reference',
    });
  }

  if (decision === 'approve' && (!manifoldChecked || !lateralityVerified)) {
    return Object.freeze({
      ok: false,
      reason: 'unverified-geometry-or-laterality',
      detail: 'Cannot approve structure when manifoldChecked or lateralityVerified is false.',
      productionEligible: false,
      truthClass: 'reference',
    });
  }

  const stage: WorkflowStage = decision === 'approve' ? 'anatomist-approved' : 'rejected';

  return Object.freeze({
    ok: true,
    structureId: structureId.trim(),
    stage,
    meshSha256: meshSha256.trim().toLowerCase(),
    ontologyTermId: ontologyTermId.trim(),
    licenceSpdx: licenceSpdx.trim(),
    submitterId: submitterId.trim(),
    reviewerId: reviewerId.trim(),
    productionEligible: stage === 'anatomist-approved',
    truthClass: 'reference',
  });
}
