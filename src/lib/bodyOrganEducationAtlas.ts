import type { KnowledgeScale } from './multisystemKnowledgeGraph.ts'

export type OrganEducationProjection = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type OrganEvidenceState = 'source-checked' | 'reference-only' | 'unsupported'

export interface OrganEvidenceReference {
  id: string
  title: string
  url: string
  publisher: string
  checkedOn: string
}

export interface OrganEducationRelationship {
  id: string
  domainId: string
  organ: string
  from: string
  to: string
  scale: KnowledgeScale
  projections: readonly OrganEducationProjection[]
  teachingRelationship: string
  evidenceIds: readonly string[]
  evidenceState: OrganEvidenceState
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

/** These references support only the bounded educational relationships below. */
export const ORGAN_EDUCATION_REFERENCES: readonly OrganEvidenceReference[] = [
  { id: 'ncbi-renal-physiology-2023', title: 'Physiology, Renal', url: 'https://www.ncbi.nlm.nih.gov/books/NBK538339/', publisher: 'NCBI Bookshelf / StatPearls', checkedOn: '2026-09-20' },
  { id: 'ncbi-lung-physiology-2023', title: 'Physiology, Lung', url: 'https://www.ncbi.nlm.nih.gov/books/NBK545177/', publisher: 'NCBI Bookshelf / StatPearls', checkedOn: '2026-09-20' },
  { id: 'ncbi-liver-physiology-2023', title: 'Physiology, Liver', url: 'https://www.ncbi.nlm.nih.gov/books/NBK535438/', publisher: 'NCBI Bookshelf / StatPearls', checkedOn: '2026-09-20' },
  { id: 'pubmed-pancreas-cftr-2013', title: 'The cystic fibrosis of exocrine pancreas', url: 'https://pubmed.ncbi.nlm.nih.gov/23637307/', publisher: 'Cold Spring Harbor Perspectives in Medicine / PubMed', checkedOn: '2026-09-21' },
  { id: 'pubmed-thyroid-substrate-2026', title: 'Substrate for Thyroid Hormone Synthesis: Biochemistry, Evolution, and Physiology', url: 'https://pubmed.ncbi.nlm.nih.gov/41979536/', publisher: 'FASEB Journal / PubMed', checkedOn: '2026-09-21' },
] as const

export const ORGAN_EDUCATION_RELATIONSHIPS: readonly OrganEducationRelationship[] = [
  { id: 'kidney-glomerulus-filtration', domainId: 'renal-urinary', organ: 'kidney', from: 'glomerular capillary tuft', to: 'Bowman space', scale: 'tissue', projections: ['anatomy', 'physiology'], teachingRelationship: 'The glomerular filtration barrier links capillary blood to Bowman space; hydrostatic and oncotic forces contribute to filtration across this interface.', evidenceIds: ['ncbi-renal-physiology-2023'], evidenceState: 'source-checked', boundary },
  { id: 'lung-alveolus-capillary-gas-exchange', domainId: 'respiratory', organ: 'lung', from: 'alveolar airspace', to: 'pulmonary capillary blood', scale: 'tissue', projections: ['anatomy', 'physiology'], teachingRelationship: 'The alveolar-capillary interface is the principal lung site for oxygen and carbon-dioxide exchange between inspired gas and pulmonary blood.', evidenceIds: ['ncbi-lung-physiology-2023'], evidenceState: 'source-checked', boundary },
  { id: 'liver-dual-inflow-sinusoid', domainId: 'digestive-hepatobiliary', organ: 'liver', from: 'portal vein and hepatic artery branches', to: 'hepatic sinusoids', scale: 'tissue', projections: ['anatomy', 'physiology'], teachingRelationship: 'Portal venous and hepatic arterial inflow converge within the hepatic microcirculation, supporting a dual-inflow teaching model without implying patient-specific perfusion.', evidenceIds: ['ncbi-liver-physiology-2023'], evidenceState: 'source-checked', boundary },
  { id: 'pancreas-acinar-duct-exocrine-flow', domainId: 'digestive-pancreatic', organ: 'pancreas', from: 'pancreatic acinar secretion', to: 'pancreatic duct lumen', scale: 'tissue', projections: ['anatomy', 'physiology'], teachingRelationship: 'Acinar cells deliver concentrated digestive proteins into the exocrine lumen while duct epithelium contributes alkaline, water-rich fluid that supports solubility and transport through the ductal system.', evidenceIds: ['pubmed-pancreas-cftr-2013'], evidenceState: 'source-checked', boundary },
  { id: 'thyroid-follicle-hormone-synthesis', domainId: 'endocrine-thyroid', organ: 'thyroid', from: 'thyroid follicular cell', to: 'follicular lumen thyroglobulin', scale: 'tissue', projections: ['anatomy', 'physiology'], teachingRelationship: 'Thyroid follicular architecture couples polarized thyrocytes to extracellular thyroglobulin in the follicular lumen, where iodination supports thyroid-hormone synthesis and storage before thyroglobulin is endocytosed and processed for hormone release.', evidenceIds: ['pubmed-thyroid-substrate-2026'], evidenceState: 'source-checked', boundary },
] as const

export const ORGAN_EDUCATION_BOUNDARY = {
  educationalOnly: true,
  atlasGeometryIsNotPatientAnatomy: true,
  simulationIsNotMeasurement: true,
  patientSpecificInference: false,
  diagnosisOrTreatment: false,
  procedureTargeting: false,
  unsupportedRelationshipsFailClosed: true,
  highRiskClinicalPublicationRequiresQualifiedHumanReview: true,
} as const

export function getOrganEducationRelationships(organ: string): readonly OrganEducationRelationship[] {
  return ORGAN_EDUCATION_RELATIONSHIPS.filter((relationship) => relationship.organ === organ)
}

export function getOrganEducationRelationship(id: string): OrganEducationRelationship | undefined {
  return ORGAN_EDUCATION_RELATIONSHIPS.find((relationship) => relationship.id === id)
}

export function hasSourceBackedOrganRelationship(id: string): boolean {
  const relationship = getOrganEducationRelationship(id)
  if (!relationship || relationship.evidenceState !== 'source-checked' || relationship.evidenceIds.length === 0) return false
  return relationship.evidenceIds.every((evidenceId) => ORGAN_EDUCATION_REFERENCES.some((reference) => reference.id === evidenceId))
}
