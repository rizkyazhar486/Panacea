export type NervousAtlasRequirementId =
  | 'declared-coordinate-frame'
  | 'registered-3d-and-slices'
  | 'cranial-and-peripheral-nerves'
  | 'tract-pathway-navigation'
  | 'arterial-territories'
  | 'spinal-cord-continuity'
  | 'educational-lesion-mode'
  | 'open-citation-provenance'
  | 'redistribution-license-gate'
  | 'academic-review-state'
  | 'patient-inference-blocked'

export interface NervousAtlasRequirement {
  id: NervousAtlasRequirementId
  label: string
  mandatory: true
  boundary: string
}

export interface NervousAtlasPublicationEvidence {
  coordinateFrameDeclared: boolean
  registrationEvidencePresent: boolean
  geometryProvenancePresent: boolean
  imagingProvenancePresent: boolean
  pathwayProvenancePresent: boolean
  citationCoveragePresent: boolean
  redistributionLicenseApproved: boolean
  aiDisclosurePresent: boolean
  academicReviewApproved: boolean
  patientSpecificInferenceBlocked: boolean
}

export const NERVOUS_SYSTEM_ATLAS_REFERENCE = {
  repository: 'aycibatuhan/nervous-system-atlas',
  role: 'mandatory-reference' as const,
  usePolicy: 'architecture-interaction-and-quality-reference-only; do-not-copy-assets-without-provenance-and-license-review',
  referenceCoordinateFrame: 'MNI152NLin2009cAsym RAS millimetres',
  clinicalBoundary:
    'Educational generic neuroanatomy only. Reference-atlas coordinates, syndrome demonstrations, pathways, territories, and lesion visualisations must never be treated as patient anatomy, diagnosis, treatment advice, prognosis, surgical planning, or measured patient localisation.',
} as const

export const NERVOUS_ATLAS_REQUIREMENTS: readonly NervousAtlasRequirement[] = [
  {
    id: 'declared-coordinate-frame',
    label: 'Every neuroanatomy asset declares its coordinate/reference frame and units.',
    mandatory: true,
    boundary: 'No implicit atlas-to-patient registration.',
  },
  {
    id: 'registered-3d-and-slices',
    label: '3D surfaces and educational MRI/section views may synchronize only when registration evidence is explicit.',
    mandatory: true,
    boundary: 'Alignment is a reference-space relationship, not proof of patient correspondence.',
  },
  {
    id: 'cranial-and-peripheral-nerves',
    label: 'Nervous-system coverage includes cranial nerves and the relevant peripheral/autonomic hierarchy, not brain-only geometry.',
    mandatory: true,
    boundary: 'Course and relations remain generic educational anatomy unless separately verified.',
  },
  {
    id: 'tract-pathway-navigation',
    label: 'White-matter and neural pathways expose ordered stations, crossings/decussations, and educational waypoints.',
    mandatory: true,
    boundary: 'A pathway view cannot infer an individual lesion or functional deficit.',
  },
  {
    id: 'arterial-territories',
    label: 'Vascular territories are represented as sourced educational overlays when evidence supports them.',
    mandatory: true,
    boundary: 'Territory overlays cannot diagnose infarction or identify a culprit vessel in a patient.',
  },
  {
    id: 'spinal-cord-continuity',
    label: 'Brain-to-spinal-cord navigation preserves declared registration/provenance across the foramen-magnum transition.',
    mandatory: true,
    boundary: 'Reference continuity must not imply measured patient continuity.',
  },
  {
    id: 'educational-lesion-mode',
    label: 'Lesion/syndrome demonstrations are hypothetical educational scenarios with explicit uncertainty and citations.',
    mandatory: true,
    boundary: 'No patient-specific localisation, diagnosis, prognosis, or management recommendation.',
  },
  {
    id: 'open-citation-provenance',
    label: 'Educational entries and derived claims retain source provenance and citation identifiers.',
    mandatory: true,
    boundary: 'Citation presence does not itself establish expert review or verified geometry.',
  },
  {
    id: 'redistribution-license-gate',
    label: 'Assets are publishable only when redistribution and derivative-use rights are explicitly approved.',
    mandatory: true,
    boundary: 'Restricted/non-redistributable data stays excluded from public builds.',
  },
  {
    id: 'academic-review-state',
    label: 'Human academic-review status is explicit and cannot be fabricated from metadata completeness.',
    mandatory: true,
    boundary: 'Pending review remains pending; AI generation cannot self-approve biomedical content.',
  },
  {
    id: 'patient-inference-blocked',
    label: 'Reference atlas interactions fail closed against patient-specific inference.',
    mandatory: true,
    boundary: 'No reference selection becomes measured localisation, diagnosis, treatment, or surgical guidance.',
  },
] as const

export function evaluateNervousAtlasReferencePublication(evidence: NervousAtlasPublicationEvidence) {
  const referencePublication =
    evidence.coordinateFrameDeclared &&
    evidence.registrationEvidencePresent &&
    evidence.geometryProvenancePresent &&
    evidence.imagingProvenancePresent &&
    evidence.pathwayProvenancePresent &&
    evidence.citationCoveragePresent &&
    evidence.redistributionLicenseApproved &&
    evidence.aiDisclosurePresent &&
    evidence.patientSpecificInferenceBlocked

  const verifiedBiomedicalPublication = referencePublication && evidence.academicReviewApproved

  return {
    referencePublication,
    verifiedBiomedicalPublication,
    blocked: !referencePublication,
  } as const
}

export function validateNervousAtlasReferenceContract(): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const requirement of NERVOUS_ATLAS_REQUIREMENTS) {
    if (ids.has(requirement.id)) errors.push(`duplicate:${requirement.id}`)
    ids.add(requirement.id)
    if (!requirement.label.trim()) errors.push(`label:${requirement.id}`)
    if (!requirement.boundary.trim()) errors.push(`boundary:${requirement.id}`)
    if (requirement.mandatory !== true) errors.push(`mandatory:${requirement.id}`)
  }
  if (NERVOUS_SYSTEM_ATLAS_REFERENCE.role !== 'mandatory-reference') errors.push('reference-role')
  if (!NERVOUS_SYSTEM_ATLAS_REFERENCE.clinicalBoundary.includes('Educational generic neuroanatomy')) errors.push('clinical-boundary')
  return errors
}
