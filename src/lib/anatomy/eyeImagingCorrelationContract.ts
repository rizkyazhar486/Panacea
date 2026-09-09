export type EyeImagingModality = 'fundus' | 'oct' | 'octa' | 'ultrasound' | 'ct' | 'mri'
export type EyeCoordinateSpace = 'image-pixel' | 'image-voxel' | 'device-native' | 'atlas-reference'
export type EyeRegistrationStatus = 'unregistered' | 'reference-aligned' | 'validated-registration'
export type EyeImagingReviewStatus = 'academic-review-pending' | 'academic-reviewed'

export interface EyeImagingProvenance {
  sourceId: string
  sourceRevision: string
  sourceLocator: string
  license: string
  reviewStatus: EyeImagingReviewStatus
}

export interface EyeImagingReference {
  id: string
  modality: EyeImagingModality
  coordinateSpace: EyeCoordinateSpace
  registrationStatus: EyeRegistrationStatus
  provenance: EyeImagingProvenance
  patientSpecific: boolean
  synthetic: boolean
  atlasNodeIds: readonly string[]
}

export interface EyeLesionLocalizationRequest {
  imagingReferenceId: string
  targetAtlasNodeId: string
  requestedMode: 'educational-reference' | 'patient-localization'
}

export type EyeCorrelationStatus = 'eligible-reference-correlation' | 'blocked'

export interface EyeCorrelationBlocker {
  code:
    | 'missing-reference'
    | 'missing-target-node'
    | 'invalid-provenance'
    | 'license-missing'
    | 'registration-not-validated'
    | 'patient-localization-disabled'
    | 'patient-specific-reference'
    | 'synthetic-reference'
    | 'academic-review-incomplete'
  message: string
}

export interface EyeCorrelationDecision {
  status: EyeCorrelationStatus
  blockers: readonly EyeCorrelationBlocker[]
  mayPerformPatientLocalization: false
  mayGenerateSyntheticAnatomy: false
  mayPromoteAcademicReview: false
}

function isPinned(value: string) {
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 && normalized !== 'latest' && normalized !== 'current' && normalized !== 'unknown'
}

function provenanceBlockers(reference: EyeImagingReference): EyeCorrelationBlocker[] {
  const blockers: EyeCorrelationBlocker[] = []
  const { provenance } = reference

  if (!isPinned(provenance.sourceId) || !isPinned(provenance.sourceRevision) || !isPinned(provenance.sourceLocator)) {
    blockers.push({
      code: 'invalid-provenance',
      message: 'Eye imaging correlation requires immutable source identity, revision, and locator.',
    })
  }
  if (!isPinned(provenance.license)) {
    blockers.push({
      code: 'license-missing',
      message: 'Eye imaging correlation requires an explicit usable license or entitlement record.',
    })
  }
  if (provenance.reviewStatus !== 'academic-reviewed') {
    blockers.push({
      code: 'academic-review-incomplete',
      message: 'Academic review remains incomplete; engineering validation cannot promote it.',
    })
  }
  return blockers
}

/**
 * Fail-closed architecture for Eye imaging-to-atlas correlation.
 *
 * This intentionally does not perform registration, segmentation, diagnosis,
 * lesion detection, coordinate inference, or synthetic anatomy generation.
 * It only decides whether a pre-existing educational reference correlation is
 * eligible to be exposed by a future renderer/data adapter.
 */
export function evaluateEyeImagingCorrelation(
  references: readonly EyeImagingReference[],
  request: EyeLesionLocalizationRequest,
): EyeCorrelationDecision {
  const blockers: EyeCorrelationBlocker[] = []
  const reference = references.find((item) => item.id === request.imagingReferenceId)

  if (!reference) {
    blockers.push({ code: 'missing-reference', message: `Imaging reference ${request.imagingReferenceId} does not exist.` })
  } else {
    blockers.push(...provenanceBlockers(reference))

    if (!reference.atlasNodeIds.includes(request.targetAtlasNodeId)) {
      blockers.push({
        code: 'missing-target-node',
        message: `Target ${request.targetAtlasNodeId} is not explicitly mapped by the reference.` ,
      })
    }
    if (reference.registrationStatus !== 'validated-registration') {
      blockers.push({
        code: 'registration-not-validated',
        message: `Registration is ${reference.registrationStatus}; validated registration is required for correlation.`,
      })
    }
    if (reference.patientSpecific) {
      blockers.push({
        code: 'patient-specific-reference',
        message: 'Patient-specific imaging is outside this educational Gold Standard correlation contract.',
      })
    }
    if (reference.synthetic) {
      blockers.push({
        code: 'synthetic-reference',
        message: 'Synthetic imaging/anatomy cannot satisfy Gold Standard reference correlation.',
      })
    }
  }

  if (request.requestedMode === 'patient-localization') {
    blockers.push({
      code: 'patient-localization-disabled',
      message: 'Patient lesion localization is not enabled by this contract.',
    })
  }

  return {
    status: blockers.length ? 'blocked' : 'eligible-reference-correlation',
    blockers,
    mayPerformPatientLocalization: false,
    mayGenerateSyntheticAnatomy: false,
    mayPromoteAcademicReview: false,
  }
}
