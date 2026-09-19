export type RespiratoryKnowledgeDomain = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type RespiratoryEvidenceBoundary =
  | 'reference-educational'
  | 'simulated-only'
  | 'requires-patient-data'
  | 'requires-clinician-review'

export interface RespiratoryEvidenceSource {
  id: string
  title: string
  kind: 'pubmed'
  url: string
  pmid: string
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

/**
 * Organ/system-specific respiratory educational graph for Body Exposure.
 *
 * This layer complements the existing source-backed respiratory atlas, V/Q and
 * gas-exchange teaching models. It does not replace them and does not infer
 * patient-specific disease, imaging findings, ventilator settings or treatment.
 */
export const RESPIRATORY_EVIDENCE_SOURCES: RespiratoryEvidenceSource[] = [
  {
    id: 'pmid-27981379',
    title: 'Lung morphometry: the link between structure and function',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27981379/',
    pmid: '27981379',
  },
  {
    id: 'pmid-37816345',
    title: 'Gas Exchange in the Lung',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37816345/',
    pmid: '37816345',
  },
  {
    id: 'pmid-35390329',
    title: 'V/Q Mismatch: A Novel Target for COPD Treatment',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35390329/',
    pmid: '35390329',
  },
  {
    id: 'pmid-27713285',
    title: 'Beta-Adrenergic Agonists',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27713285/',
    pmid: '27713285',
  },
  {
    id: 'pmid-31704148',
    title: 'An Algorithmic Approach to the Interpretation of Diffuse Lung Disease on Chest CT Imaging: A Theory of Almost Everything',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31704148/',
    pmid: '31704148',
  },
]

export const RESPIRATORY_KNOWLEDGE_EDGES: RespiratoryKnowledgeEdge[] = [
  {
    id: 'respiratory-anatomy-air-blood-barrier',
    domain: 'anatomy',
    from: 'alveolar airspace and alveolar-capillary barrier',
    relation: 'form the structural interface with',
    to: 'pulmonary capillary blood',
    summary: 'Reference lung morphometry links alveolar airspace, the thin air-blood barrier and capillary blood as the structural basis for gas exchange; this does not establish patient-specific alveolar geometry.',
    boundaries: ['reference-educational'],
    sourceIds: ['pmid-27981379'],
  },
  {
    id: 'respiratory-physiology-vq-diffusion',
    domain: 'physiology',
    from: 'alveolar ventilation, pulmonary perfusion and diffusion',
    relation: 'jointly determine',
    to: 'pulmonary oxygen and carbon-dioxide exchange',
    summary: 'Ventilation, perfusion and diffusion interact to determine pulmonary gas exchange; Body Exposure must present this as reference physiology unless protocol-qualified patient measurements exist.',
    boundaries: ['reference-educational', 'requires-patient-data'],
    sourceIds: ['pmid-37816345'],
  },
  {
    id: 'respiratory-pathophysiology-vq-mismatch',
    domain: 'pathophysiology',
    from: 'regional imbalance between ventilation and perfusion',
    relation: 'can impair',
    to: 'gas exchange and arterial oxygenation',
    summary: 'This V/Q-mismatch relationship is educational only and must never infer COPD, shunt, dead-space abnormality, hypoxemia severity or another pulmonary diagnosis from generic atlas or wearable data.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-35390329', 'pmid-37816345'],
  },
  {
    id: 'respiratory-pharmacology-beta2-agonists',
    domain: 'pharmacology',
    from: 'beta2-adrenoceptor agonism in airway smooth muscle',
    relation: 'can promote',
    to: 'airway smooth-muscle relaxation and bronchodilation',
    summary: 'Mechanism-of-action education only; this relationship does not constitute an indication, prescription, dose, inhaler selection, contraindication assessment, ventilator instruction or patient-specific treatment recommendation.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-27713285'],
  },
  {
    id: 'respiratory-imaging-boundary',
    domain: 'imaging',
    from: 'reference airway, parenchymal and lobar anatomy',
    relation: 'provide orientation for',
    to: 'chest CT / pulmonary imaging education',
    summary: 'Reference anatomy may orient educational imaging views, but nodules, fibrosis, emphysema, consolidation, perfusion defects or other pathology claims require an actual chest imaging study and a validated clinician-review pipeline.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-31704148'],
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
