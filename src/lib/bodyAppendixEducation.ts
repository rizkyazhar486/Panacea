export type AppendixEvidenceRole = 'anatomy-reference' | 'physiology-reference' | 'mechanism-reference' | 'pharmacology-reference' | 'imaging-reference' | 'terminology-reference'
export type AppendixReviewState = 'draft' | 'source-checked' | 'human-reviewed'

export interface AppendixEvidenceSource {
  id: string
  title: string
  sourceType: 'peer-reviewed-review'
  sourceLocator: string
  pmid: string
  canonicalUrl: string
  accessedOrReviewedAt: string
}

export interface AppendixEducationRelationship {
  id: string
  from: string
  to: string
  claimScope: string
  evidenceRole: AppendixEvidenceRole
  sourceIds: readonly string[]
  reviewState: AppendixReviewState
  boundary: typeof APPENDIX_EDUCATION_BOUNDARY
}

export const APPENDIX_EDUCATION_BOUNDARY = {
  educationalOnly: true,
  genericReference: true,
  atlasGeometryIsNotPatientAnatomy: true,
  simulationIsNotMeasurement: true,
  patientSpecificInference: false,
  diagnosisOrTreatment: false,
  procedureTargeting: false,
  quantitativePatientClaim: false,
} as const

export const APPENDIX_EVIDENCE_SOURCES: readonly AppendixEvidenceSource[] = [
  {
    id: 'pubmed-human-galt-2021',
    title: 'Human gut-associated lymphoid tissues (GALT); diversity, structure, and function',
    sourceType: 'peer-reviewed-review',
    sourceLocator: 'PMID:33753873; doi:10.1038/s41385-021-00389-4',
    pmid: '33753873',
    canonicalUrl: 'https://pubmed.ncbi.nlm.nih.gov/33753873/',
    accessedOrReviewedAt: '2026-09-26',
  },
  {
    id: 'pubmed-appendix-histology-1983',
    title: 'Functional histology of appendix',
    sourceType: 'peer-reviewed-review',
    sourceLocator: 'PMID:6357136; doi:10.1679/aohc.46.271',
    pmid: '6357136',
    canonicalUrl: 'https://pubmed.ncbi.nlm.nih.gov/6357136/',
    accessedOrReviewedAt: '2026-09-26',
  },
] as const

export const APPENDIX_EDUCATION_RELATIONSHIPS: readonly AppendixEducationRelationship[] = [
  {
    id: 'appendix-galt-lymphoid-architecture',
    from: 'vermiform appendix',
    to: 'gut-associated lymphoid tissue',
    claimScope: 'The human vermiform appendix is included among gut-associated lymphoid tissues and contains organized lymphoid architecture relevant to mucosal immune education.',
    evidenceRole: 'anatomy-reference',
    sourceIds: ['pubmed-human-galt-2021'],
    reviewState: 'source-checked',
    boundary: APPENDIX_EDUCATION_BOUNDARY,
  },
  {
    id: 'appendix-follicle-lumen-antigen-interface',
    from: 'follicle-associated epithelium',
    to: 'underlying appendiceal lymphoid tissue',
    claimScope: 'Appendiceal follicle-associated epithelium provides an educational microanatomy link between luminal material and underlying lymphoid tissue; this relationship is generic and not a patient measurement.',
    evidenceRole: 'physiology-reference',
    sourceIds: ['pubmed-appendix-histology-1983'],
    reviewState: 'source-checked',
    boundary: APPENDIX_EDUCATION_BOUNDARY,
  },
] as const

const VALID_ROLES = new Set<AppendixEvidenceRole>(['anatomy-reference', 'physiology-reference', 'mechanism-reference', 'pharmacology-reference', 'imaging-reference', 'terminology-reference'])

export function validateAppendixEducationEvidence() {
  const sourceIds = APPENDIX_EVIDENCE_SOURCES.map((source) => source.id)
  const relationshipIds = APPENDIX_EDUCATION_RELATIONSHIPS.map((edge) => edge.id)
  const sourceSet = new Set(sourceIds)
  return {
    duplicateSourceIds: sourceIds.filter((id, index) => sourceIds.indexOf(id) !== index),
    duplicateRelationshipIds: relationshipIds.filter((id, index) => relationshipIds.indexOf(id) !== index),
    unresolvedSourceIds: APPENDIX_EDUCATION_RELATIONSHIPS.flatMap((edge) => edge.sourceIds.filter((id) => !sourceSet.has(id))),
    emptyClaimScopes: APPENDIX_EDUCATION_RELATIONSHIPS.filter((edge) => edge.claimScope.trim().length === 0).map((edge) => edge.id),
    invalidEvidenceRoles: APPENDIX_EDUCATION_RELATIONSHIPS.filter((edge) => !VALID_ROLES.has(edge.evidenceRole)).map((edge) => edge.id),
    falseHumanReviewClaims: APPENDIX_EDUCATION_RELATIONSHIPS.filter((edge) => edge.reviewState === 'human-reviewed').map((edge) => edge.id),
  }
}
