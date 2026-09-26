export type AdrenalEvidenceDomain = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type AdrenalEvidenceRole = 'anatomy-reference' | 'physiology-reference' | 'mechanism-reference' | 'pharmacology-reference' | 'imaging-reference'
export type AdrenalReviewState = 'draft' | 'source-checked' | 'human-reviewed'

export interface AdrenalEvidenceSource {
  sourceId: string
  sourceType: 'repository-asset' | 'peer-reviewed-review' | 'official-regulatory-label'
  sourceLocator: string
  canonicalUrl?: string
  accessedOrReviewedAt: string
  claimScope: string
  evidenceRole: AdrenalEvidenceRole
  reviewState: AdrenalReviewState
}

export interface AdrenalEvidenceRelationship {
  id: string
  domain: AdrenalEvidenceDomain
  from: string
  to: string
  teachingRelationship: string
  sourceIds: readonly string[]
  boundary: {
    educationalOnly: true
    genericReference: true
    patientSpecificInference: false
    diagnosisOrTreatment: false
    quantitativePatientClaim: false
  }
}

const boundary = {
  educationalOnly: true,
  genericReference: true,
  patientSpecificInference: false,
  diagnosisOrTreatment: false,
  quantitativePatientClaim: false,
} as const

/**
 * Claim-bounded sources checked for this adrenal module.
 * source-checked means only that the cited source was inspected for the stated
 * claim scope. It is not Panacea validation and is never equivalent to human review.
 */
export const ADRENAL_EVIDENCE_SOURCES: readonly AdrenalEvidenceSource[] = [
  {
    sourceId: 'repo-visceral-glb-adrenal',
    sourceType: 'repository-asset',
    sourceLocator: 'public/anatomy/visceral.glb',
    accessedOrReviewedAt: '2026-09-26',
    claimScope: 'Repository-shipped visceral source bundle may provide gross adrenal orientation only; it does not establish microscopic zonation, vascular detail, dimensions, variants, or patient anatomy.',
    evidenceRole: 'anatomy-reference',
    reviewState: 'draft',
  },
  {
    sourceId: 'pubmed-29764284',
    sourceType: 'peer-reviewed-review',
    sourceLocator: 'PMID:29764284',
    canonicalUrl: 'https://pubmed.ncbi.nlm.nih.gov/29764284/',
    accessedOrReviewedAt: '2026-09-26',
    claimScope: 'Review supports educational representation of glucocorticoid negative feedback and rhythmic hypothalamic-pituitary-adrenal axis regulation, including bounded discussion of altered feedback/rhythmicity.',
    evidenceRole: 'physiology-reference',
    reviewState: 'source-checked',
  },
  {
    sourceId: 'pubmed-29764284-mechanism',
    sourceType: 'peer-reviewed-review',
    sourceLocator: 'PMID:29764284',
    canonicalUrl: 'https://pubmed.ncbi.nlm.nih.gov/29764284/',
    accessedOrReviewedAt: '2026-09-26',
    claimScope: 'The same review supports mechanism-level education about disruption of HPA feedback and rhythmic regulation; it does not establish a diagnosis, severity, laboratory interpretation, or patient state.',
    evidenceRole: 'mechanism-reference',
    reviewState: 'source-checked',
  },
  {
    sourceId: 'dailymed-isturisa-v10-moa',
    sourceType: 'official-regulatory-label',
    sourceLocator: 'DailyMed set f3a5ec24-63c3-4d83-b1c0-6c550fbe7ae2; version 10; effective 2025-11-18; section 12.1 / LOINC 43679-0',
    canonicalUrl: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=f3a5ec24-63c3-4d83-b1c0-6c550fbe7ae2',
    accessedOrReviewedAt: '2026-09-26',
    claimScope: 'Current U.S. label mechanism section supports that osilodrostat inhibits adrenal 11beta-hydroxylase (CYP11B1), the enzyme responsible for the final step of cortisol biosynthesis; no dosing or patient-selection claim is imported.',
    evidenceRole: 'pharmacology-reference',
    reviewState: 'source-checked',
  },
  {
    sourceId: 'pubmed-42579733',
    sourceType: 'peer-reviewed-review',
    sourceLocator: 'PMID:42579733',
    canonicalUrl: 'https://pubmed.ncbi.nlm.nih.gov/42579733/',
    accessedOrReviewedAt: '2026-09-26',
    claimScope: '2025 review supports educational imaging context that unenhanced CT and chemical-shift MRI use tissue lipid-related characteristics when evaluating adrenal incidentalomas, while emphasizing limitations and broader imaging features.',
    evidenceRole: 'imaging-reference',
    reviewState: 'source-checked',
  },
] as const

export const ADRENAL_EVIDENCE_RELATIONSHIPS: readonly AdrenalEvidenceRelationship[] = [
  {
    id: 'adrenal-gross-orientation',
    domain: 'anatomy',
    from: 'repository visceral source bundle',
    to: 'gross adrenal orientation',
    teachingRelationship: 'The shipped visceral source may anchor gross adrenal orientation while finer zonation, vasculature, dimensions, variants, and patient anatomy remain explicitly unresolved.',
    sourceIds: ['repo-visceral-glb-adrenal'],
    boundary,
  },
  {
    id: 'adrenal-hpa-negative-feedback',
    domain: 'physiology',
    from: 'glucocorticoid signal',
    to: 'hypothalamic-pituitary-adrenal feedback',
    teachingRelationship: 'Glucocorticoid negative feedback and rhythmic regulation are represented as generic HPA-axis physiology without generating a person-level cortisol value, ACTH value, circadian phase, feedback gain, or adrenal reserve.',
    sourceIds: ['pubmed-29764284'],
    boundary,
  },
  {
    id: 'adrenal-feedback-disruption',
    domain: 'pathophysiology',
    from: 'altered HPA feedback or rhythmicity',
    to: 'dysregulated endocrine feedback context',
    teachingRelationship: 'Altered feedback or rhythmicity may be explored as a mechanism-level pathophysiology relationship, not as evidence that a learner or patient has adrenal insufficiency, hypercortisolism, pituitary disease, or another endocrine disorder.',
    sourceIds: ['pubmed-29764284-mechanism'],
    boundary,
  },
  {
    id: 'adrenal-cyp11b1-cortisol-synthesis',
    domain: 'pharmacology',
    from: 'osilodrostat',
    to: 'adrenal CYP11B1 / final cortisol-biosynthesis step',
    teachingRelationship: 'The current DailyMed mechanism section identifies osilodrostat as an inhibitor of 11beta-hydroxylase (CYP11B1), linking a named molecular target to adrenal cortisol biosynthesis for mechanism education only.',
    sourceIds: ['dailymed-isturisa-v10-moa'],
    boundary,
  },
  {
    id: 'adrenal-ct-mri-lipid-context',
    domain: 'imaging',
    from: 'adrenal incidentaloma imaging context',
    to: 'unenhanced CT and chemical-shift MRI',
    teachingRelationship: 'Cross-sectional imaging education may relate adrenal tissue lipid characteristics to unenhanced CT and chemical-shift MRI without producing a lesion diagnosis, malignancy probability, washout calculation, follow-up plan, or patient-specific interpretation.',
    sourceIds: ['pubmed-42579733'],
    boundary,
  },
] as const

export function auditAdrenalEvidenceRelationships() {
  const relationshipIds = ADRENAL_EVIDENCE_RELATIONSHIPS.map((item) => item.id)
  const sourceIds = new Set(ADRENAL_EVIDENCE_SOURCES.map((item) => item.sourceId))
  const seen = new Set<string>()
  const duplicateRelationshipIds = relationshipIds.filter((id) => {
    if (seen.has(id)) return true
    seen.add(id)
    return false
  })
  const unresolvedSourceIds = ADRENAL_EVIDENCE_RELATIONSHIPS.flatMap((item) =>
    item.sourceIds.filter((sourceId) => !sourceIds.has(sourceId)).map((sourceId) => ({ relationshipId: item.id, sourceId })),
  )
  const invalidClaimScopes = ADRENAL_EVIDENCE_SOURCES.filter((item) =>
    !item.sourceId.trim()
    || !item.sourceType.trim()
    || !item.sourceLocator.trim()
    || !/^\d{4}-\d{2}-\d{2}$/.test(item.accessedOrReviewedAt)
    || item.claimScope.trim().length < 30,
  )
  const falseHumanReviewClaims = ADRENAL_EVIDENCE_SOURCES.filter((item) => item.reviewState === 'human-reviewed')
  return { duplicateRelationshipIds, unresolvedSourceIds, invalidClaimScopes, falseHumanReviewClaims }
}

export const ADRENAL_EVIDENCE_BOUNDARY =
  'Adrenal relationships are generic educational references only. Source-checked means the cited source was inspected for the bounded claim; it is not qualified human review, product validation, patient-specific anatomy, diagnosis, imaging interpretation, treatment selection, dosing, monitoring, or procedural guidance.'
