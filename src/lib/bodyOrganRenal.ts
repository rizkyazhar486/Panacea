export type RenalKnowledgeDomain = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type RenalEvidenceBoundary = 'reference-educational' | 'simulated-only' | 'requires-patient-data' | 'requires-clinician-review'

export interface RenalEvidenceSource {
  id: string
  title: string
  kind: 'pubmed'
  url: string
  pmid: string
}

export interface RenalKnowledgeEdge {
  id: string
  domain: RenalKnowledgeDomain
  from: string
  relation: string
  to: string
  summary: string
  boundaries: RenalEvidenceBoundary[]
  sourceIds: string[]
}

/**
 * Organ-specific renal educational graph for Body Exposure.
 *
 * This module deliberately contains no renderer state and no patient-specific
 * inference. Source-backed reference relationships may be projected by Body Core,
 * while measurements, diagnoses, lesion localization and treatment decisions stay
 * outside this organ knowledge layer.
 */
export const RENAL_EVIDENCE_SOURCES: RenalEvidenceSource[] = [
  {
    id: 'pmid-30759020',
    title: 'The nephron-arterial network and its interactions',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30759020/',
    pmid: '30759020',
  },
  {
    id: 'pmid-32152499',
    title: 'The tubular hypothesis of nephron filtration and diabetic kidney disease',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32152499/',
    pmid: '32152499',
  },
  {
    id: 'pmid-36868736',
    title: 'Targeting Glomerular Hemodynamics for Kidney Protection',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36868736/',
    pmid: '36868736',
  },
]

export const RENAL_KNOWLEDGE_EDGES: RenalKnowledgeEdge[] = [
  {
    id: 'renal-anatomy-two-capillary-beds',
    domain: 'anatomy',
    from: 'afferent arteriole',
    relation: 'feeds',
    to: 'glomerular capillary bed → efferent arteriole → peritubular circulation',
    summary: 'Reference renal microcirculation is organized around glomerular filtration followed by a second capillary bed; this is atlas-level anatomy, not patient geometry.',
    boundaries: ['reference-educational'],
    sourceIds: ['pmid-36868736'],
  },
  {
    id: 'renal-physiology-tgf',
    domain: 'physiology',
    from: 'distal tubular NaCl delivery / macula densa sensing',
    relation: 'participates in tubuloglomerular feedback regulating',
    to: 'afferent arteriolar resistance and glomerular filtration',
    summary: 'Tubuloglomerular feedback and the myogenic response participate in renal autoregulation; Body Exposure must present this as reference physiology unless real protocol-qualified measurements exist.',
    boundaries: ['reference-educational', 'requires-patient-data'],
    sourceIds: ['pmid-30759020', 'pmid-36868736'],
  },
  {
    id: 'renal-pathophysiology-diabetic-hyperfiltration',
    domain: 'pathophysiology',
    from: 'increased proximal sodium-glucose reabsorption in diabetes',
    relation: 'can reduce macula-densa solute delivery and alter feedback toward',
    to: 'glomerular hyperfiltration',
    summary: 'This disease-mechanism edge is educational and must never be used to infer diabetic kidney disease or hyperfiltration in an individual from generic atlas or wearable data.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-32152499'],
  },
  {
    id: 'renal-pharmacology-sglt2',
    domain: 'pharmacology',
    from: 'SGLT2 inhibition',
    relation: 'reduces proximal sodium-glucose reabsorption and modifies',
    to: 'tubuloglomerular feedback / glomerular hemodynamics',
    summary: 'Mechanism-of-action education only; this relationship does not constitute an indication, prescription, dose, contraindication assessment or patient treatment recommendation.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-32152499', 'pmid-36868736'],
  },
  {
    id: 'renal-imaging-boundary',
    domain: 'imaging',
    from: 'reference kidney / nephron anatomy',
    relation: 'provides orientation for',
    to: 'renal imaging education',
    summary: 'Reference anatomy may orient educational imaging views, but lesion localization, segmentation, obstruction, perfusion or pathology claims require an actual imaging study and validated review pipeline.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-36868736'],
  },
]

export function renalKnowledgeByDomain(domain: RenalKnowledgeDomain): RenalKnowledgeEdge[] {
  return RENAL_KNOWLEDGE_EDGES.filter((edge) => edge.domain === domain)
}

export function renalEvidenceFor(edge: RenalKnowledgeEdge): RenalEvidenceSource[] {
  return edge.sourceIds.flatMap((id) => {
    const source = RENAL_EVIDENCE_SOURCES.find((candidate) => candidate.id === id)
    return source ? [source] : []
  })
}

export function renalKnowledgeHasCompleteProvenance(edge: RenalKnowledgeEdge): boolean {
  return edge.sourceIds.length > 0 && renalEvidenceFor(edge).length === edge.sourceIds.length
}
