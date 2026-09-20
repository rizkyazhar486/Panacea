export type RespiratoryKnowledgeDomain = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type RespiratoryEvidenceBoundary = 'reference-educational' | 'simulated-only' | 'requires-patient-data' | 'requires-clinician-review'

export interface RespiratoryEvidenceSource {
  id: string
  title: string
  kind: 'pubmed' | 'dailymed'
  url: string
  pmid?: string
  setId?: string
  version?: number
  effectiveDate?: string
  sectionCode?: string
}

export interface RespiratoryKnowledgeEdge {
  id: string
  domain: RespiratoryKnowledgeDomain
  from: string
  relation: string
  to: string
  summary: string
  boundaries: RespiratoryEvidenceBoundary[]
  sourceIds: string[]
}

/** Organ-specific respiratory education for Body Exposure; renderer-agnostic and never patient-specific. */
export const RESPIRATORY_EVIDENCE_SOURCES: RespiratoryEvidenceSource[] = [
  {
    id: 'pmid-37816345',
    title: 'Gas Exchange in the Lung',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37816345/',
    pmid: '37816345',
  },
  {
    id: 'pmid-25063240',
    title: 'Gas exchange and ventilation-perfusion relationships in the lung',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/25063240/',
    pmid: '25063240',
  },
  {
    id: 'pmid-27645688',
    title: 'Hypoxic Pulmonary Vasoconstriction: From Molecular Mechanisms to Medicine',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27645688/',
    pmid: '27645688',
  },
  {
    id: 'dailymed-albuterol-hfa-v16-moa',
    title: 'Albuterol Sulfate HFA — Mechanism of Action',
    kind: 'dailymed',
    url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7bb5b6dd-9105-4ee7-b205-ed79cf4b371b',
    setId: '7bb5b6dd-9105-4ee7-b205-ed79cf4b371b',
    version: 16,
    effectiveDate: '20200531',
    sectionCode: '43679-0',
  },
]

export const RESPIRATORY_KNOWLEDGE_EDGES: RespiratoryKnowledgeEdge[] = [
  {
    id: 'respiratory-anatomy-gas-exchange-unit',
    domain: 'anatomy',
    from: 'conducting airways and alveolar units',
    relation: 'couple inspired gas with',
    to: 'alveolar-capillary gas exchange',
    summary: 'Reference respiratory anatomy can orient the airway-to-alveolar-capillary relationship; atlas geometry is not patient-specific airway or parenchymal anatomy.',
    boundaries: ['reference-educational'],
    sourceIds: ['pmid-37816345'],
  },
  {
    id: 'respiratory-physiology-vq',
    domain: 'physiology',
    from: 'regional alveolar ventilation and perfusion',
    relation: 'jointly determine',
    to: 'regional gas-exchange behavior',
    summary: 'Ventilation/perfusion relationships are reference physiology; any person-level gas-exchange interpretation requires actual qualified measurements and context.',
    boundaries: ['reference-educational', 'requires-patient-data'],
    sourceIds: ['pmid-25063240', 'pmid-37816345'],
  },
  {
    id: 'respiratory-pathophysiology-vq-mismatch',
    domain: 'pathophysiology',
    from: 'low V/Q, shunt, high V/Q, hypoventilation or diffusion limitation',
    relation: 'can contribute to',
    to: 'impaired oxygenation and/or carbon-dioxide elimination',
    summary: 'Mechanism education only: generic gas-exchange mechanisms cannot diagnose the cause of hypoxemia or hypercapnia in an individual.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-25063240', 'pmid-37816345'],
  },
  {
    id: 'respiratory-pathophysiology-hpv',
    domain: 'pathophysiology',
    from: 'regional alveolar hypoxia',
    relation: 'can trigger',
    to: 'hypoxic pulmonary vasoconstriction and redistribution of pulmonary blood flow',
    summary: 'Hypoxic pulmonary vasoconstriction is presented as reference mechanism, not as a patient-specific pulmonary-pressure, perfusion, or disease inference.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-27645688'],
  },
  {
    id: 'respiratory-pharmacology-albuterol',
    domain: 'pharmacology',
    from: 'albuterol activation of airway smooth-muscle beta2-adrenergic receptors',
    relation: 'increases cyclic AMP signaling associated with',
    to: 'airway smooth-muscle relaxation',
    summary: 'Mechanism-of-action education only; this label-backed relationship is not an indication decision, prescription, dose, contraindication screen, or patient treatment recommendation.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['dailymed-albuterol-hfa-v16-moa'],
  },
  {
    id: 'respiratory-imaging-boundary',
    domain: 'imaging',
    from: 'reference airway, lung and pleural anatomy',
    relation: 'provides orientation for',
    to: 'respiratory imaging education',
    summary: 'Reference anatomy may orient educational chest imaging views, but lesion localization, segmentation, consolidation, effusion, pneumothorax, perfusion, or other pathology claims require an actual imaging study and validated review pipeline.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-37816345'],
  },
]

export function respiratoryKnowledgeByDomain(domain: RespiratoryKnowledgeDomain): RespiratoryKnowledgeEdge[] {
  return RESPIRATORY_KNOWLEDGE_EDGES.filter((edge) => edge.domain === domain)
}

export function respiratoryEvidenceFor(edge: RespiratoryKnowledgeEdge): RespiratoryEvidenceSource[] {
  return edge.sourceIds.flatMap((id) => {
    const source = RESPIRATORY_EVIDENCE_SOURCES.find((candidate) => candidate.id === id)
    return source ? [source] : []
  })
}

export function respiratoryKnowledgeHasCompleteProvenance(edge: RespiratoryKnowledgeEdge): boolean {
  return edge.sourceIds.length > 0 && respiratoryEvidenceFor(edge).length === edge.sourceIds.length
}
