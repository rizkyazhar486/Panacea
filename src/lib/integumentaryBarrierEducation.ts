export type SkinBarrierLayerId = 'surface-microenvironment' | 'stratum-corneum' | 'viable-epidermis' | 'dermis'

export interface SkinBarrierLayer {
  id: SkinBarrierLayerId
  label: string
  anatomy: readonly string[]
  physiology: readonly string[]
  disruption: readonly string[]
  educationalRelationships: readonly string[]
}

export interface SkinBarrierEvidence {
  pmid: string
  title: string
  role: string
  url: string
}

export const SKIN_BARRIER_EVIDENCE: readonly SkinBarrierEvidence[] = [
  {
    pmid: '37717558',
    title: 'The Skin Barrier and Moisturization: Function, Disruption, and Mechanisms of Repair.',
    role: 'Review anchor for physical, chemical, microbiologic and immunologic barrier functions and barrier-support mechanisms.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37717558/',
  },
  {
    pmid: '32217811',
    title: 'Aging-associated alterations in epidermal function and their clinical significance.',
    role: 'Review anchor for epidermal permeability homeostasis, hydration and surface-pH changes with aging.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32217811/',
  },
] as const

export const SKIN_BARRIER_LAYERS: readonly SkinBarrierLayer[] = [
  {
    id: 'surface-microenvironment',
    label: 'Surface microenvironment',
    anatomy: ['Skin surface', 'Resident microbial interface'],
    physiology: ['Acidic surface conditions support barrier-associated enzymatic and microbial ecology.', 'Surface lipids and secretions participate in the chemical barrier.'],
    disruption: ['Barrier disruption can alter permeability, surface chemistry and microbial ecology.'],
    educationalRelationships: ['surface chemistry ↔ commensal ecology', 'surface state ↔ stratum-corneum function'],
  },
  {
    id: 'stratum-corneum',
    label: 'Stratum corneum',
    anatomy: ['Corneocytes', 'Intercellular lipid matrix'],
    physiology: ['Primary physical permeability barrier.', 'Limits transepidermal water loss while restricting penetration of many external molecules.'],
    disruption: ['Disorganization or lipid deficiency can increase water loss and permeability.'],
    educationalRelationships: ['corneocyte structure + extracellular lipids → permeability barrier', 'ceramide-rich lipid organization → water retention'],
  },
  {
    id: 'viable-epidermis',
    label: 'Viable epidermis',
    anatomy: ['Keratinocyte layers beneath the stratum corneum'],
    physiology: ['Supports renewal and differentiation of the epidermal barrier.', 'Participates in local immune signaling.'],
    disruption: ['Altered differentiation or inflammatory signaling can impair barrier homeostasis.'],
    educationalRelationships: ['keratinocyte differentiation → stratum-corneum renewal', 'epidermal signaling ↔ immune barrier'],
  },
  {
    id: 'dermis',
    label: 'Dermis',
    anatomy: ['Connective-tissue matrix', 'Cutaneous vasculature and adnexal context'],
    physiology: ['Provides structural and vascular support beneath the epidermis.', 'Water can move from deeper tissue toward the epidermal compartment.'],
    disruption: ['Dermal and epidermal aging can jointly alter skin function; the layers should not be treated as interchangeable.'],
    educationalRelationships: ['dermal support → epidermal homeostasis', 'deeper water reservoir → epidermal hydration gradient'],
  },
] as const

export const SKIN_BARRIER_EDUCATION_BOUNDARY = {
  purpose: 'Generic anatomy and physiology education for the integumentary system.',
  excludes: [
    'patient-specific skin diagnosis or lesion classification',
    'treatment selection, dose, duration or prescribing',
    'inference of allergy, infection, malignancy or inflammatory disease from generic atlas state',
    'claim that repository content has completed qualified human clinical review',
  ],
  provenance: 'Biomedical statements are bounded to the cited PubMed review anchors; repository representation is not proof of clinical validity.',
} as const
