export type ClinicalClaimMaturity =
  | 'technically-working'
  | 'clinician-reviewed'
  | 'clinically-validated'

export interface ClinicalClaimEvidence {
  clinicianReviewed?: boolean
  externalValidation?: boolean
  validationEvidenceIds?: readonly string[]
}

function normalizedEvidenceIds(values: readonly string[] = []) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

/**
 * Clinical maturity is fail-closed.
 *
 * Formula:
 * clinicallyValidated =
 *   clinicianReviewed
 *   AND externalValidation
 *   AND validationEvidenceIds.length > 0
 *
 * Human review alone never upgrades a technical output into a clinically
 * validated capability.
 */
export function clinicalClaimMaturity(
  evidence: ClinicalClaimEvidence = {},
): ClinicalClaimMaturity {
  const validationEvidenceIds = normalizedEvidenceIds(evidence.validationEvidenceIds)
  if (
    evidence.clinicianReviewed === true
    && evidence.externalValidation === true
    && validationEvidenceIds.length > 0
  ) {
    return 'clinically-validated'
  }
  if (evidence.clinicianReviewed === true) return 'clinician-reviewed'
  return 'technically-working'
}

export function clinicalClaimLabel(maturity: ClinicalClaimMaturity) {
  switch (maturity) {
    case 'technically-working':
      return 'Technical output'
    case 'clinician-reviewed':
      return 'Clinician-reviewed'
    case 'clinically-validated':
      return 'Clinically validated'
  }
}

export function clinicalClaimDisclosure(maturity: ClinicalClaimMaturity) {
  switch (maturity) {
    case 'technically-working':
      return 'Not clinician-reviewed or clinically validated.'
    case 'clinician-reviewed':
      return 'Human review recorded; clinical validation is a separate capability-level claim.'
    case 'clinically-validated':
      return 'Clinical validation evidence is explicitly linked to this capability.'
  }
}
