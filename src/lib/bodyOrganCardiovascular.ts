export type CardiovascularKnowledgeDomain = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type CardiovascularEvidenceBoundary =
  | 'reference-educational'
  | 'simulated-only'
  | 'requires-patient-data'
  | 'requires-clinician-review'

export interface CardiovascularEvidenceSource {
  id: string
  title: string
  kind: 'pubmed'
  url: string
  pmid: string
}

export interface CardiovascularKnowledgeEdge {
  id: string
  domain: CardiovascularKnowledgeDomain
  from: string
  relation: string
  to: string
  summary: string
  boundaries: CardiovascularEvidenceBoundary[]
  sourceIds: string[]
}

/**
 * Organ/system-specific cardiovascular educational graph for Body Exposure.
 *
 * This layer is intentionally independent from rendering and patient-specific
 * inference. It may provide source-backed anatomy/mechanism relationships to
 * Body Core, while diagnosis, lesion interpretation, prescribing and treatment
 * decisions remain outside this module.
 */
export const CARDIOVASCULAR_EVIDENCE_SOURCES: CardiovascularEvidenceSource[] = [
  {
    id: 'pmid-28333376',
    title: 'Regulation of Coronary Blood Flow',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/28333376/',
    pmid: '28333376',
  },
  {
    id: 'pmid-32552654',
    title: 'Endothelial Dysfunction and Coronary Vasoreactivity - A Review of the History, Physiology, Diagnostic Techniques, and Clinical Relevance',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32552654/',
    pmid: '32552654',
  },
  {
    id: 'pmid-35328769',
    title: 'Pathophysiology of Atherosclerosis',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35328769/',
    pmid: '35328769',
  },
  {
    id: 'pmid-24657242',
    title: 'The pharmacology of statins',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/24657242/',
    pmid: '24657242',
  },
  {
    id: 'pmid-34384554',
    title: 'Coronary Computed Tomographic Angiography for Complete Assessment of Coronary Artery Disease: JACC State-of-the-Art Review',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34384554/',
    pmid: '34384554',
  },
]

export const CARDIOVASCULAR_KNOWLEDGE_EDGES: CardiovascularKnowledgeEdge[] = [
  {
    id: 'cardiovascular-anatomy-coronary-tree',
    domain: 'anatomy',
    from: 'epicardial coronary arterial tree',
    relation: 'branches over the heart and supplies',
    to: 'myocardial tissue through downstream resistance vessels',
    summary: 'Reference cardiovascular anatomy links epicardial coronary vessels with downstream myocardial perfusion; this is atlas-level anatomy and does not claim patient-specific vessel geometry or perfusion territory.',
    boundaries: ['reference-educational'],
    sourceIds: ['pmid-28333376'],
  },
  {
    id: 'cardiovascular-physiology-coronary-autoregulation',
    domain: 'physiology',
    from: 'metabolic, myogenic and endothelial signals',
    relation: 'modulate',
    to: 'coronary vascular resistance and blood flow relative to myocardial demand',
    summary: 'Coronary flow is regulated by interacting metabolic, myogenic and endothelial mechanisms; Body Exposure must present these as reference physiology unless protocol-qualified patient measurements are available.',
    boundaries: ['reference-educational', 'requires-patient-data'],
    sourceIds: ['pmid-28333376', 'pmid-32552654'],
  },
  {
    id: 'cardiovascular-pathophysiology-atherosclerosis',
    domain: 'pathophysiology',
    from: 'lipoprotein retention, endothelial dysfunction and vascular inflammation',
    relation: 'can contribute to',
    to: 'atherosclerotic plaque formation and progression',
    summary: 'This atherosclerosis mechanism edge is educational only and must never infer plaque, stenosis, ischemia or cardiovascular disease in an individual from generic atlas, wearable or symptom data.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-35328769', 'pmid-32552654'],
  },
  {
    id: 'cardiovascular-pharmacology-statins',
    domain: 'pharmacology',
    from: 'statin-mediated HMG-CoA reductase inhibition',
    relation: 'reduces hepatic cholesterol synthesis and modifies',
    to: 'LDL-receptor-mediated lipid handling and downstream atherosclerotic biology',
    summary: 'Mechanism-of-action education only; this relationship does not constitute an indication, prescription, dose, contraindication assessment, comparative treatment claim or patient-specific recommendation.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-24657242'],
  },
  {
    id: 'cardiovascular-imaging-boundary',
    domain: 'imaging',
    from: 'reference coronary anatomy and vessel relationships',
    relation: 'provide orientation for',
    to: 'cardiac CT / coronary angiography education',
    summary: 'Reference anatomy may orient educational imaging views, but stenosis, plaque, perfusion, lesion localization or pathology claims require an actual cardiac imaging study and a validated clinician-review pipeline.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-34384554'],
  },
]

export function cardiovascularKnowledgeByDomain(domain: CardiovascularKnowledgeDomain): CardiovascularKnowledgeEdge[] {
  return CARDIOVASCULAR_KNOWLEDGE_EDGES.filter((edge) => edge.domain === domain)
}

export function cardiovascularEvidenceFor(edge: CardiovascularKnowledgeEdge): CardiovascularEvidenceSource[] {
  return edge.sourceIds.flatMap((id) => {
    const source = CARDIOVASCULAR_EVIDENCE_SOURCES.find((candidate) => candidate.id === id)
    return source ? [source] : []
  })
}

export function cardiovascularKnowledgeHasCompleteProvenance(edge: CardiovascularKnowledgeEdge): boolean {
  return edge.sourceIds.length > 0 && cardiovascularEvidenceFor(edge).length === edge.sourceIds.length
}
