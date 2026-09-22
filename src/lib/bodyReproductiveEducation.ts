import type { BodySystemId } from './bodySystemSourceWave'

export type ReproductiveNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type ReproductiveEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'

export interface ReproductiveEvidence {
  kind: 'atlas-source' | 'pubmed'
  id: string
  url?: string
  note: string
}

export interface ReproductiveEducationNode {
  id: string
  label: string
  kind: ReproductiveNodeKind
  evidenceState: ReproductiveEvidenceState
  evidence: readonly ReproductiveEvidence[]
  boundary: string
}

export interface ReproductiveEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'disruption-associated-with' | 'educational-context'
  note: string
}

export const REPRODUCTIVE_SYSTEM_ID: BodySystemId = 'reproductive'

/** Organ/system-specific reproductive relationships for Body Exposure. */
export const REPRODUCTIVE_EDUCATION_NODES: readonly ReproductiveEducationNode[] = [
  {
    id: 'reproductive-gross-reference',
    label: 'Reproductive gross-anatomy reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    evidence: [{ kind: 'atlas-source', id: 'visceral.glb', note: 'Repository source bundle provides the currently resolvable reproductive gross-anatomy reference structures.' }],
    boundary: 'Reference atlas geometry; not patient-specific anatomy. Female structures may be unavailable in the current full-body male reference and must remain explicit source gaps rather than inferred geometry.',
  },
  {
    id: 'reproductive-hpg-axis',
    label: 'Hypothalamic-pituitary-gonadal axis',
    kind: 'physiology',
    evidenceState: 'literature-backed',
    evidence: [{ kind: 'pubmed', id: '32027812', url: 'https://pubmed.ncbi.nlm.nih.gov/32027812/', note: 'Review describes neuroendocrine control of reproductive function through the hypothalamic-pituitary-gonadal axis.' }],
    boundary: 'Educational physiology only; no person-level fertility, ovulation, spermatogenesis, hormone concentration, cycle phase, sexual function, pregnancy state, or reproductive capacity is inferred.',
  },
  {
    id: 'reproductive-endometriosis-context',
    label: 'Endometriosis inflammatory context',
    kind: 'pathophysiology',
    evidenceState: 'literature-backed',
    evidence: [{ kind: 'pubmed', id: '37163911', url: 'https://pubmed.ncbi.nlm.nih.gov/37163911/', note: 'Review summarizes inflammatory, endocrine, immune, and tissue-remodeling mechanisms implicated in endometriosis.' }],
    boundary: 'Mechanism education only; does not diagnose endometriosis, localize lesions, infer stage, pain cause, fertility impact, malignancy, or individual inflammatory state.',
  },
  {
    id: 'reproductive-gnrh-context',
    label: 'GnRH signaling pharmacology context',
    kind: 'pharmacology',
    evidenceState: 'literature-backed',
    evidence: [{ kind: 'pubmed', id: '35107214', url: 'https://pubmed.ncbi.nlm.nih.gov/35107214/', note: 'Review discusses GnRH agonist and antagonist pharmacology in reproductive endocrine contexts.' }],
    boundary: 'Mechanism education only; no drug selection, dose, route, timing, indication, contraindication, fertility treatment, contraception plan, monitoring, or patient-specific therapy is generated.',
  },
  {
    id: 'reproductive-imaging-boundary',
    label: 'Reproductive imaging relationship boundary',
    kind: 'imaging',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Imaging relationship placeholder only: no ultrasound, mammography, hysterosalpingography, CT, MRI, endoscopy, pathology slide, or patient image is loaded or interpreted, and no lesion or pregnancy is inferred.',
  },
]

export const REPRODUCTIVE_EDUCATION_EDGES: readonly ReproductiveEducationEdge[] = [
  { from: 'reproductive-gross-reference', to: 'reproductive-hpg-axis', relationship: 'supports', note: 'Gross reproductive structures provide spatial context for endocrine reproductive physiology without implying measured function.' },
  { from: 'reproductive-hpg-axis', to: 'reproductive-endometriosis-context', relationship: 'educational-context', note: 'Endocrine physiology is contextual background for studying disease mechanisms, not a causal or diagnostic score.' },
  { from: 'reproductive-hpg-axis', to: 'reproductive-gnrh-context', relationship: 'supports', note: 'HPG-axis physiology provides the educational pathway context for GnRH-targeted pharmacology without prescribing.' },
  { from: 'reproductive-gross-reference', to: 'reproductive-imaging-boundary', relationship: 'educational-context', note: 'Reference anatomy can orient future source-backed imaging education while remaining separate from patient imaging.' },
]

export function validateReproductiveEducationGraph() {
  const ids = REPRODUCTIVE_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: REPRODUCTIVE_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    unsupportedLiteratureNodes: REPRODUCTIVE_EDUCATION_NODES.filter((node) => node.evidenceState === 'literature-backed' && node.evidence.length === 0),
    boundaryMissing: REPRODUCTIVE_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 20),
  }
}
