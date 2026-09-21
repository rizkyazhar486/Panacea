export type LymphaticRelationshipKind =
  | 'fluid-homeostasis'
  | 'immune-trafficking'
  | 'lipid-absorption'
  | 'pathophysiology'

export type LymphaticEvidenceSource = {
  pmid: string
  title: string
  year: number
  role: 'review-anchor'
}

export type LymphaticEducationRelationship = {
  id: string
  from: string
  to: string
  kind: LymphaticRelationshipKind
  statement: string
  sourcePmids: string[]
  educationalOnly: true
}

export const LYMPHATIC_EDUCATION_NETWORK = {
  systemId: 'lymphatic',
  label: 'Lymphatic & immune transport',
  patientSpecific: false,
  clinicalDecisionSupport: false,
  provenanceBoundary:
    'Curated educational relationships summarize cited review literature. They do not encode patient anatomy, measured lymph flow, diagnostic probability, metastatic risk, treatment selection, or a claim that an atlas mesh contains vessels it does not actually contain.',
  sources: [
    { pmid: '32707093', title: 'The Lymphatic Vasculature in the 21st Century: Novel Functional Roles in Homeostasis and Disease.', year: 2020, role: 'review-anchor' },
    { pmid: '26863922', title: 'The Lymphatic System in Disease Processes and Cancer Progression.', year: 2016, role: 'review-anchor' },
  ] satisfies LymphaticEvidenceSource[],
  relationships: [
    { id: 'interstitium-to-lymphatic-capillary', from: 'interstitial-space', to: 'lymphatic-capillary', kind: 'fluid-homeostasis', statement: 'Initial lymphatics participate in returning filtered interstitial fluid and tissue solutes toward the blood circulation.', sourcePmids: ['32707093', '26863922'], educationalOnly: true },
    { id: 'afferent-to-node', from: 'lymph-node', to: 'afferent-lymphatic-context', kind: 'immune-trafficking', statement: 'Lymphatic transport links peripheral tissues with draining lymph nodes and supports immune-cell and antigen trafficking.', sourcePmids: ['32707093'], educationalOnly: true },
    { id: 'node-to-efferent', from: 'lymph-node', to: 'efferent-lymphatic-context', kind: 'immune-trafficking', statement: 'Lymph nodes are organized waypoints in lymphatic immune surveillance rather than isolated anatomical objects.', sourcePmids: ['32707093'], educationalOnly: true },
    { id: 'intestinal-lipid-transport', from: 'intestinal-lymphatic-context', to: 'systemic-lymphatic-return', kind: 'lipid-absorption', statement: 'Intestinal lymphatics contribute to dietary lipid absorption and transport.', sourcePmids: ['32707093'], educationalOnly: true },
    { id: 'lymphatic-dysfunction-edema', from: 'lymphatic-transport-dysfunction', to: 'lymphedema-context', kind: 'pathophysiology', statement: 'Impaired lymphatic transport is a mechanistic context for lymphedema; this relationship is not a patient-level diagnostic rule.', sourcePmids: ['26863922'], educationalOnly: true },
    { id: 'lymphatic-tumor-dissemination-context', from: 'tumor-lymphatic-interface', to: 'lymph-node-metastasis-context', kind: 'pathophysiology', statement: 'Lymphatic vessels participate in routes relevant to cancer dissemination, without implying metastatic probability for an individual.', sourcePmids: ['26863922'], educationalOnly: true },
  ] satisfies LymphaticEducationRelationship[],
} as const

export function getLymphaticRelationships(structureId: string): LymphaticEducationRelationship[] {
  if (structureId === 'lymph-node') {
    return LYMPHATIC_EDUCATION_NETWORK.relationships.filter(
      (edge) => edge.id === 'afferent-to-node' || edge.id === 'node-to-efferent',
    ) as LymphaticEducationRelationship[]
  }
  return LYMPHATIC_EDUCATION_NETWORK.relationships.filter(
    (edge) => edge.from === structureId || edge.to === structureId,
  ) as LymphaticEducationRelationship[]
}
