export type BreathAtlasEvidenceStatus = 'source-checked'
export type BreathAtlasHumanReviewStatus = 'not-recorded'

export interface BreathAtlasAcademicSource {
  id: string
  title: string
  citation: string
  pubmedUrl: string
  doi: string
  supports: readonly string[]
}

export const BREATH_ATLAS_ACADEMIC_EVIDENCE = {
  status: 'source-checked' as BreathAtlasEvidenceStatus,
  aiUse: 'ai-assisted',
  humanReview: {
    status: 'not-recorded' as BreathAtlasHumanReviewStatus,
    reviewer: null,
    credentials: null,
    reviewedAt: null,
  },
  scopeNote: 'These publications support the stated general respiratory mechanics and gas-exchange teaching claims. They do not validate Panacea geometry, patient-specific physiology, diagnosis, treatment, or surgical use.',
  sources: [
    {
      id: 'pmid-23733642',
      title: 'Mechanics of the respiratory muscles',
      citation: 'De Troyer A, Boriek AM. Comprehensive Physiology. 2011;1(3):1273-1300.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/23733642/',
      doi: '10.1002/cphy.c100009',
      supports: [
        'diaphragm as the main inspiratory muscle and caudal dome displacement during contraction',
        'respiratory-muscle contributions to rib-cage expansion and expiratory efforts',
      ],
    },
    {
      id: 'pmid-37816345',
      title: 'Gas Exchange in the Lung',
      citation: 'Petersson J, Glenny RW. Semin Respir Crit Care Med. 2023;44(5):555-568.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/37816345/',
      doi: '10.1055/s-0043-1770060',
      supports: [
        'ventilation bringing oxygen to and removing carbon dioxide from alveolar gas',
        'passive diffusion adding oxygen to and removing carbon dioxide from pulmonary capillary blood',
      ],
    },
    {
      id: 'pmid-37571742',
      title: 'Breathing Chest Wall Kinematics Assessment through a Single Digital Camera: A Feasibility Study',
      citation: 'Molinaro N, Schena E, Silvestri S, Massaroni C. Sensors. 2023;23(15):6960.',
      pubmedUrl: 'https://pubmed.ncbi.nlm.nih.gov/37571742/',
      doi: '10.3390/s23156960',
      supports: [
        'chest-wall and thoraco-abdominal motion as measurable respiratory kinematics',
        'the need to distinguish measured motion from a static generic educational mesh',
      ],
    },
  ] satisfies readonly BreathAtlasAcademicSource[],
} as const

export function breathAtlasHumanReviewRecorded() {
  return BREATH_ATLAS_ACADEMIC_EVIDENCE.humanReview.status !== 'not-recorded'
}
