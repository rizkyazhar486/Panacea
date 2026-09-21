import type { BodySystemId } from './bodySystemSourceWave'

export type UrinaryNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type UrinaryEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'

export interface UrinaryEvidence {
  kind: 'atlas-source' | 'pubmed'
  id: string
  url?: string
  note: string
}

export interface UrinaryEducationNode {
  id: string
  label: string
  kind: UrinaryNodeKind
  evidenceState: UrinaryEvidenceState
  evidence: readonly UrinaryEvidence[]
  boundary: string
}

export interface UrinaryEducationEdge {
  from: string
  to: string
  relationship: 'contains' | 'supports' | 'disruption-associated-with' | 'educational-context'
  note: string
}

export const URINARY_SYSTEM_ID: BodySystemId = 'urinary'

/**
 * Organ/system-specific urinary relationships for Body Exposure.
 * Source geometry anchors gross orientation only; literature nodes are bounded
 * educational context and never convert reference anatomy into patient anatomy.
 */
export const URINARY_EDUCATION_NODES: readonly UrinaryEducationNode[] = [
  {
    id: 'urinary-gross-reference',
    label: 'Kidneys, ureters, bladder, and urethra reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    evidence: [
      { kind: 'atlas-source', id: 'visceral.glb', note: 'Repository source bundle used for kidney, ureter, urinary bladder, and urethral gross orientation.' },
    ],
    boundary: 'Reference atlas geometry; not patient-specific anatomy and not nephron microanatomy, glomerular histology, collecting-duct architecture, measured organ size, or lesion geometry.',
  },
  {
    id: 'renal-autoregulation-context',
    label: 'Renal autoregulation and tubuloglomerular feedback',
    kind: 'physiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '19864948', url: 'https://pubmed.ncbi.nlm.nih.gov/19864948/', note: 'Review describes renal homeostasis, tubuloglomerular feedback, and its contribution to stabilizing glomerular filtration.' },
      { kind: 'pubmed', id: '33833078', url: 'https://pubmed.ncbi.nlm.nih.gov/33833078/', note: 'Review describes myogenic and tubuloglomerular feedback mechanisms within nephrovascular autoregulation.' },
    ],
    boundary: 'Educational physiology only; no person-level renal blood flow, single-nephron GFR, filtration fraction, sodium balance, pressure, or autoregulatory reserve is inferred.',
  },
  {
    id: 'renal-autoregulation-disruption',
    label: 'Autoregulation disruption context',
    kind: 'pathophysiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '33833078', url: 'https://pubmed.ncbi.nlm.nih.gov/33833078/', note: 'Review discusses nephrovascular autoregulation, oxygenation-perfusion matching, and pressure transmission relevant to progressive glomerular and vascular injury.' },
      { kind: 'pubmed', id: '8676542', url: 'https://pubmed.ncbi.nlm.nih.gov/8676542/', note: 'Review describes tubuloglomerular feedback and its pathophysiologic relevance in hypertension, diabetes, and heart failure.' },
    ],
    boundary: 'Mechanism education only; does not diagnose acute kidney injury, chronic kidney disease, glomerular disease, hypertension, diabetes-related kidney disease, obstruction, or another urinary disorder.',
  },
  {
    id: 'renal-raas-inhibition-context',
    label: 'Renin-angiotensin system inhibition context',
    kind: 'pharmacology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '28791529', url: 'https://pubmed.ncbi.nlm.nih.gov/28791529/', note: 'Review summarizes RAAS biology and ACE inhibitor/angiotensin-receptor blocker use in kidney disease.' },
      { kind: 'pubmed', id: '32291375', url: 'https://pubmed.ncbi.nlm.nih.gov/32291375/', note: 'Review describes ACE inhibitor/ARB-associated hyperkalemia risk and the importance of renal-function and potassium monitoring.' },
    ],
    boundary: 'Pharmacology education only; no indication confirmation, drug choice, dose, combination, potassium target, creatinine threshold, monitoring interval, contraindication decision, or patient-specific treatment is produced.',
  },
  {
    id: 'renal-imaging-context',
    label: 'Renal multimodality imaging context',
    kind: 'imaging',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '39022655', url: 'https://pubmed.ncbi.nlm.nih.gov/39022655/', note: 'Systematic review compares diagnostic-accuracy evidence across CT, MRI, ultrasound, SPECT/CT, and PET approaches for T1 renal tumours and emphasizes unresolved optimal strategy.' },
      { kind: 'pubmed', id: '27321380', url: 'https://pubmed.ncbi.nlm.nih.gov/27321380/', note: 'Review discusses complementary roles of CT, MRI, and contrast-enhanced ultrasound in renal-mass characterization.' },
    ],
    boundary: 'Imaging education only; no patient scan, renal mass, cyst, obstruction, enhancement pattern, Bosniak class, malignancy probability, stage, or management recommendation is interpreted or generated.',
  },
] as const

export const URINARY_EDUCATION_EDGES: readonly UrinaryEducationEdge[] = [
  {
    from: 'urinary-gross-reference',
    to: 'renal-autoregulation-context',
    relationship: 'educational-context',
    note: 'Gross kidney orientation leads into autoregulation physiology without implying source-backed nephron, macula-densa, arteriole, or glomerular microgeometry.',
  },
  {
    from: 'renal-autoregulation-context',
    to: 'renal-autoregulation-disruption',
    relationship: 'disruption-associated-with',
    note: 'Autoregulation disruption is presented as a bounded mechanism relationship rather than a diagnosis, laboratory interpretation, risk estimate, or severity inference.',
  },
  {
    from: 'renal-autoregulation-context',
    to: 'renal-raas-inhibition-context',
    relationship: 'educational-context',
    note: 'Renal homeostasis links to RAAS pharmacology as mechanism education without implying an indication, prescription, dose, biochemical target, or individual response.',
  },
  {
    from: 'urinary-gross-reference',
    to: 'renal-imaging-context',
    relationship: 'educational-context',
    note: 'Reference anatomy links to modality context only; it is not registered to a patient image and cannot localize, classify, stage, or characterize a lesion.',
  },
] as const

export function validateUrinaryEducationGraph() {
  const ids = new Set(URINARY_EDUCATION_NODES.map((node) => node.id))
  const duplicateIds = ids.size !== URINARY_EDUCATION_NODES.length
  const danglingEdges = URINARY_EDUCATION_EDGES.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to))
  const unsupportedLiteratureNodes = URINARY_EDUCATION_NODES.filter(
    (node) => node.evidenceState === 'literature-backed' && !node.evidence.some((item) => item.kind === 'pubmed'),
  )
  const boundaryMissing = URINARY_EDUCATION_NODES.filter((node) => !node.boundary.trim())
  return { duplicateIds, danglingEdges, unsupportedLiteratureNodes, boundaryMissing }
}
