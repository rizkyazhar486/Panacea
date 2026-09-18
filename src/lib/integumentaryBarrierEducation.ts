export type SkinBarrierLayerId = 'surface-microenvironment' | 'stratum-corneum' | 'viable-epidermis' | 'dermis'

export interface SkinBarrierLayer {
  id: SkinBarrierLayerId
  label: string
  anatomy: readonly string[]
  physiology: readonly string[]
  disruption: readonly string[]
  educationalRelationships: readonly string[]
}

export const SKIN_BARRIER_EVIDENCE = [
  { pmid: '37717558', role: 'Review anchor for physical, chemical, microbiologic and immunologic barrier functions and barrier-support mechanisms.', url: 'https://pubmed.ncbi.nlm.nih.gov/37717558/' },
  { pmid: '32217811', role: 'Review anchor for epidermal permeability homeostasis, hydration and surface-pH changes with aging.', url: 'https://pubmed.ncbi.nlm.nih.gov/32217811/' },
] as const

export const SKIN_BARRIER_LAYERS: readonly SkinBarrierLayer[] = [
  { id: 'surface-microenvironment', label: 'Surface microenvironment', anatomy: ['Skin surface', 'Resident microbial interface'], physiology: ['Surface chemistry and secretions participate in barrier-associated microbial ecology.'], disruption: ['Barrier disruption can alter permeability, surface chemistry and microbial ecology.'], educationalRelationships: ['surface state ↔ stratum-corneum function'] },
  { id: 'stratum-corneum', label: 'Stratum corneum', anatomy: ['Corneocytes', 'Intercellular lipid matrix'], physiology: ['Primary physical permeability barrier that limits transepidermal water loss.'], disruption: ['Disorganization or lipid deficiency can increase water loss and permeability.'], educationalRelationships: ['corneocyte structure + extracellular lipids → permeability barrier'] },
  { id: 'viable-epidermis', label: 'Viable epidermis', anatomy: ['Keratinocyte layers beneath the stratum corneum'], physiology: ['Supports epidermal renewal and participates in local immune signaling.'], disruption: ['Altered differentiation or inflammatory signaling can impair barrier homeostasis.'], educationalRelationships: ['keratinocyte differentiation → stratum-corneum renewal'] },
  { id: 'dermis', label: 'Dermis', anatomy: ['Connective-tissue matrix', 'Cutaneous vasculature and adnexal context'], physiology: ['Provides structural and vascular support beneath the epidermis.'], disruption: ['Dermal and epidermal aging can jointly alter skin function; the layers are not interchangeable.'], educationalRelationships: ['dermal support → epidermal homeostasis'] },
] as const

export const SKIN_BARRIER_EDUCATION_BOUNDARY = {
  purpose: 'Generic anatomy and physiology education for the integumentary system.',
  excludes: ['patient-specific skin diagnosis or lesion classification', 'treatment selection, dose, duration or prescribing', 'claim that repository content has completed qualified human clinical review'],
  provenance: 'Biomedical statements are bounded to the cited PubMed review anchors; repository representation is not proof of clinical validity.',
} as const
