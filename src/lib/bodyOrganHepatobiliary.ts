export type HepatobiliaryKnowledgeDomain = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type HepatobiliaryEvidenceBoundary =
  | 'reference-educational'
  | 'simulated-only'
  | 'requires-patient-data'
  | 'requires-clinician-review'

export interface HepatobiliaryEvidenceSource {
  id: string
  title: string
  kind: 'pubmed'
  url: string
  pmid: string
}

export interface HepatobiliaryKnowledgeEdge {
  id: string
  domain: HepatobiliaryKnowledgeDomain
  from: string
  relation: string
  to: string
  summary: string
  boundaries: HepatobiliaryEvidenceBoundary[]
  sourceIds: string[]
}

/**
 * Organ/system-specific liver and biliary educational graph for Body Exposure.
 *
 * This complements the existing bile-cycle teaching model and liver evidence
 * seed. It does not infer patient liver disease, biliary obstruction, drug
 * response, imaging findings, dose or treatment.
 */
export const HEPATOBILIARY_EVIDENCE_SOURCES: HepatobiliaryEvidenceSource[] = [
  {
    id: 'pmid-1542056',
    title: 'Metabolic heterogeneity of hepatocytes across the liver acinus',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/1542056/',
    pmid: '1542056',
  },
  {
    id: 'pmid-23792151',
    title: 'Zonation of glucose and fatty acid metabolism in the liver: mechanism and metabolic consequences',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/23792151/',
    pmid: '23792151',
  },
  {
    id: 'pmid-29080336',
    title: 'Bile Acid Physiology',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29080336/',
    pmid: '29080336',
  },
  {
    id: 'pmid-35989040',
    title: 'Practical Contrast Enhanced Liver Ultrasound',
    kind: 'pubmed',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35989040/',
    pmid: '35989040',
  },
]

export const HEPATOBILIARY_KNOWLEDGE_EDGES: HepatobiliaryKnowledgeEdge[] = [
  {
    id: 'hepatobiliary-anatomy-acinar-zonation',
    domain: 'anatomy',
    from: 'hepatic acinus',
    relation: 'organizes',
    to: 'spatially heterogeneous periportal-to-perivenous hepatocyte zones',
    summary: 'Reference liver anatomy/physiology uses the hepatic acinus to describe spatial metabolic heterogeneity; this does not establish patient-specific lobular geometry or function.',
    boundaries: ['reference-educational'],
    sourceIds: ['pmid-1542056'],
  },
  {
    id: 'hepatobiliary-physiology-enterohepatic-cycle',
    domain: 'physiology',
    from: 'hepatic bile-acid synthesis and biliary delivery',
    relation: 'participates in',
    to: 'intestinal release, ileal reabsorption and enterohepatic return',
    summary: 'The enterohepatic circulation is presented as reference physiology only; the existing bile-cycle model remains synthetic and does not estimate patient bile flow, pool size or gallbladder function.',
    boundaries: ['reference-educational', 'requires-patient-data'],
    sourceIds: ['pmid-29080336'],
  },
  {
    id: 'hepatobiliary-pathophysiology-zonation-disruption',
    domain: 'pathophysiology',
    from: 'perturbation of hepatic metabolic zonation',
    relation: 'has been described in the context of',
    to: 'metabolic liver disease',
    summary: 'This relationship is educational only and must never infer steatosis, steatohepatitis, fibrosis, cirrhosis or metabolic liver disease in an individual from generic atlas, wearable or laboratory-adjacent data.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-23792151'],
  },
  {
    id: 'hepatobiliary-pharmacology-xenobiotic-zonation',
    domain: 'pharmacology',
    from: 'zonated hepatic xenobiotic-metabolism capacity',
    relation: 'provides context for',
    to: 'spatial heterogeneity in hepatic drug metabolism',
    summary: 'Mechanism-of-action context only; this zonation relationship does not establish a patient drug response, drug choice, interaction, contraindication, pharmacokinetic parameter or dose recommendation.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-1542056'],
  },
  {
    id: 'hepatobiliary-imaging-boundary',
    domain: 'imaging',
    from: 'reference liver, vascular and biliary anatomy',
    relation: 'provide orientation for',
    to: 'liver ultrasound / cross-sectional imaging education',
    summary: 'Reference anatomy may orient educational imaging views, but focal lesions, perfusion patterns, biliary obstruction, fibrosis or other pathology claims require an actual hepatobiliary imaging study and a validated clinician-review pipeline.',
    boundaries: ['reference-educational', 'requires-patient-data', 'requires-clinician-review'],
    sourceIds: ['pmid-35989040'],
  },
]

export function hepatobiliaryKnowledgeByDomain(domain: HepatobiliaryKnowledgeDomain): HepatobiliaryKnowledgeEdge[] {
  return HEPATOBILIARY_KNOWLEDGE_EDGES.filter((edge) => edge.domain === domain)
}

export function hepatobiliaryEvidenceFor(edge: HepatobiliaryKnowledgeEdge): HepatobiliaryEvidenceSource[] {
  return edge.sourceIds.flatMap((id) => {
    const source = HEPATOBILIARY_EVIDENCE_SOURCES.find((candidate) => candidate.id === id)
    return source ? [source] : []
  })
}

export function hepatobiliaryKnowledgeHasCompleteProvenance(edge: HepatobiliaryKnowledgeEdge): boolean {
  return edge.sourceIds.length > 0 && hepatobiliaryEvidenceFor(edge).length === edge.sourceIds.length
}
