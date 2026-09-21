import type { BodySystemId } from './bodySystemSourceWave'

export type EndocrineNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type EndocrineEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'

export interface EndocrineEvidence {
  kind: 'atlas-source' | 'pubmed'
  id: string
  url?: string
  note: string
}

export interface EndocrineEducationNode {
  id: string
  label: string
  kind: EndocrineNodeKind
  evidenceState: EndocrineEvidenceState
  evidence: readonly EndocrineEvidence[]
  boundary: string
}

export interface EndocrineEducationEdge {
  from: string
  to: string
  relationship: 'contains' | 'supports' | 'disruption-associated-with' | 'educational-context'
  note: string
}

export const ENDOCRINE_SYSTEM_ID: BodySystemId = 'endocrine'

/**
 * Organ/system-specific endocrine relationships for Body Exposure.
 * Source geometry anchors gross orientation only. Literature-backed nodes remain
 * educational and do not imply spatial continuity, laboratory values, or diagnosis.
 */
export const ENDOCRINE_EDUCATION_NODES: readonly EndocrineEducationNode[] = [
  {
    id: 'endocrine-gross-reference',
    label: 'Thyroid, parathyroid, adrenal, and pancreatic reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    evidence: [
      { kind: 'atlas-source', id: 'visceral.glb', note: 'Repository source bundle used for thyroid, parathyroid, adrenal, and pancreatic gross orientation.' },
    ],
    boundary: 'Reference atlas geometry; not patient-specific anatomy and not microscopic gland architecture, endocrine histology, receptor distribution, or measured gland volume.',
  },
  {
    id: 'endocrine-negative-feedback',
    label: 'Hierarchical endocrine negative feedback',
    kind: 'physiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '29764284', url: 'https://pubmed.ncbi.nlm.nih.gov/29764284/', note: 'Review describes glucocorticoid negative feedback and rhythmic regulation of the hypothalamic-pituitary-adrenal axis.' },
      { kind: 'pubmed', id: '8701079', url: 'https://pubmed.ncbi.nlm.nih.gov/8701079/', note: 'Review describes IGF-I feedback regulation of pituitary growth-hormone secretion and receptor signaling.' },
    ],
    boundary: 'Educational physiology only; no person-level hormone concentration, axis gain, receptor sensitivity, circadian phase, stimulation-test result, or endocrine reserve is inferred.',
  },
  {
    id: 'endocrine-feedback-disruption',
    label: 'Feedback disruption context',
    kind: 'pathophysiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '29764284', url: 'https://pubmed.ncbi.nlm.nih.gov/29764284/', note: 'Review discusses altered glucocorticoid rhythmicity and feedback mechanisms in HPA-axis biology.' },
      { kind: 'pubmed', id: '16595713', url: 'https://pubmed.ncbi.nlm.nih.gov/16595713/', note: 'Review describes kisspeptin-GPR54 signaling and sex-steroid feedback within the reproductive neuroendocrine axis.' },
    ],
    boundary: 'Mechanism education only; does not diagnose hormone excess or deficiency, pituitary disease, adrenal disease, thyroid disease, infertility, or another endocrine disorder.',
  },
  {
    id: 'thyroid-hormone-replacement-context',
    label: 'Thyroid hormone replacement context',
    kind: 'pharmacology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '28336049', url: 'https://pubmed.ncbi.nlm.nih.gov/28336049/', note: 'Lancet review describes levothyroxine as standard thyroid-hormone replacement therapy for hypothyroidism and discusses treatment limitations.' },
    ],
    boundary: 'Pharmacology education only; no indication confirmation, drug selection, formulation, dose, target TSH, monitoring interval, contraindication decision, or patient-specific treatment is produced.',
  },
  {
    id: 'endocrine-imaging-context',
    label: 'Endocrine imaging context',
    kind: 'imaging',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Placeholder relationship only: no ultrasound, CT, MRI, scintigraphy, PET, or lesion interpretation is represented until modality-specific evidence and reviewed assets are added.',
  },
] as const

export const ENDOCRINE_EDUCATION_EDGES: readonly EndocrineEducationEdge[] = [
  {
    from: 'endocrine-gross-reference',
    to: 'endocrine-negative-feedback',
    relationship: 'educational-context',
    note: 'Gross gland orientation leads into feedback physiology without implying source-backed hypothalamic, pituitary, receptor, or microscopic spatial correspondence.',
  },
  {
    from: 'endocrine-negative-feedback',
    to: 'endocrine-feedback-disruption',
    relationship: 'disruption-associated-with',
    note: 'Feedback disruption is presented as a bounded mechanism relationship rather than a diagnosis, laboratory interpretation, or severity inference.',
  },
  {
    from: 'endocrine-gross-reference',
    to: 'thyroid-hormone-replacement-context',
    relationship: 'educational-context',
    note: 'Thyroid orientation links to replacement-therapy context without implying an indication, prescription, dose, biochemical target, or individual response.',
  },
  {
    from: 'endocrine-gross-reference',
    to: 'endocrine-imaging-context',
    relationship: 'educational-context',
    note: 'Imaging remains explicitly unavailable until modality-specific source provenance and reviewed assets are present.',
  },
] as const

export function validateEndocrineEducationGraph() {
  const ids = new Set(ENDOCRINE_EDUCATION_NODES.map((node) => node.id))
  const duplicateIds = ids.size !== ENDOCRINE_EDUCATION_NODES.length
  const danglingEdges = ENDOCRINE_EDUCATION_EDGES.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to))
  const unsupportedLiteratureNodes = ENDOCRINE_EDUCATION_NODES.filter(
    (node) => node.evidenceState === 'literature-backed' && !node.evidence.some((item) => item.kind === 'pubmed'),
  )
  const boundaryMissing = ENDOCRINE_EDUCATION_NODES.filter((node) => !node.boundary.trim())
  return { duplicateIds, danglingEdges, unsupportedLiteratureNodes, boundaryMissing }
}
