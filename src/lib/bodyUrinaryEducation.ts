import type { BodySystemId } from './bodySystemSourceWave'

export type UrinaryNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type UrinaryEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'
export type UrinaryEvidenceRole = 'anatomy-reference' | 'physiology-reference' | 'mechanism-reference' | 'pharmacology-reference' | 'imaging-reference'
export type UrinaryReviewState = 'draft' | 'source-checked' | 'human-reviewed'

export interface UrinaryEvidence {
  kind: 'atlas-source' | 'pubmed'
  id: string
  sourceType: 'repository-atlas-source' | 'peer-reviewed-review-or-article'
  sourceLocator: string
  url?: string
  note: string
}

export interface UrinaryEducationNode {
  id: string
  label: string
  kind: UrinaryNodeKind
  evidenceState: UrinaryEvidenceState
  evidence: readonly UrinaryEvidence[]
  evidenceRole: UrinaryEvidenceRole
  accessedOrReviewedAt: string
  claimScope: string
  reviewState: UrinaryReviewState
  boundary: string
}

export interface UrinaryEducationEdge {
  from: string
  to: string
  relationship: 'contains' | 'supports' | 'disruption-associated-with' | 'educational-context'
  note: string
}

export const URINARY_SYSTEM_ID: BodySystemId = 'urinary'
const REVIEW_DATE = '2026-09-21'

const pubmed = (id: string, note: string): UrinaryEvidence => ({
  kind: 'pubmed', id, sourceType: 'peer-reviewed-review-or-article', sourceLocator: `PMID:${id}`,
  url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, note,
})

/** Organ/system-specific urinary relationships for Body Exposure. */
export const URINARY_EDUCATION_NODES: readonly UrinaryEducationNode[] = [
  {
    id: 'urinary-gross-reference', label: 'Kidneys, ureters, bladder, and urethra reference', kind: 'anatomy', evidenceState: 'source-backed',
    evidence: [{ kind: 'atlas-source', id: 'visceral.glb', sourceType: 'repository-atlas-source', sourceLocator: 'visceral.glb:urinary-targets', note: 'Repository source bundle used for kidney, ureter, urinary bladder, and urethral gross orientation.' }],
    evidenceRole: 'anatomy-reference', accessedOrReviewedAt: REVIEW_DATE,
    claimScope: 'Gross urinary-system orientation is anchored to the registered repository visceral atlas source only.', reviewState: 'source-checked',
    boundary: 'Reference atlas geometry; not patient-specific anatomy and not nephron microanatomy, glomerular histology, collecting-duct architecture, measured organ size, or lesion geometry.',
  },
  {
    id: 'renal-autoregulation-context', label: 'Renal autoregulation and tubuloglomerular feedback', kind: 'physiology', evidenceState: 'literature-backed',
    evidence: [pubmed('19864948', 'Review describes renal homeostasis, tubuloglomerular feedback, and its contribution to stabilizing glomerular filtration.'), pubmed('33833078', 'Review describes myogenic and tubuloglomerular feedback mechanisms within nephrovascular autoregulation.')],
    evidenceRole: 'physiology-reference', accessedOrReviewedAt: REVIEW_DATE,
    claimScope: 'Renal autoregulation includes myogenic and tubuloglomerular-feedback mechanisms that contribute to stabilizing renal perfusion and filtration context.', reviewState: 'source-checked',
    boundary: 'Educational physiology only; no person-level renal blood flow, single-nephron GFR, filtration fraction, sodium balance, pressure, or autoregulatory reserve is inferred.',
  },
  {
    id: 'renal-autoregulation-disruption', label: 'Autoregulation disruption context', kind: 'pathophysiology', evidenceState: 'literature-backed',
    evidence: [pubmed('33833078', 'Review discusses nephrovascular autoregulation, oxygenation-perfusion matching, and pressure transmission relevant to progressive glomerular and vascular injury.'), pubmed('8676542', 'Review describes tubuloglomerular feedback and its pathophysiologic relevance in hypertension, diabetes, and heart failure.')],
    evidenceRole: 'mechanism-reference', accessedOrReviewedAt: REVIEW_DATE,
    claimScope: 'Disrupted renal autoregulatory mechanisms are presented as bounded pathophysiology context without assigning disease or severity to a person.', reviewState: 'source-checked',
    boundary: 'Mechanism education only; does not diagnose acute kidney injury, chronic kidney disease, glomerular disease, hypertension, diabetes-related kidney disease, obstruction, or another urinary disorder.',
  },
  {
    id: 'renal-raas-inhibition-context', label: 'Renin-angiotensin system inhibition context', kind: 'pharmacology', evidenceState: 'literature-backed',
    evidence: [pubmed('28791529', 'Review summarizes RAAS biology and ACE inhibitor/angiotensin-receptor blocker use in kidney disease.'), pubmed('32291375', 'Review describes ACE inhibitor/ARB-associated hyperkalemia risk and the importance of renal-function and potassium monitoring.')],
    evidenceRole: 'pharmacology-reference', accessedOrReviewedAt: REVIEW_DATE,
    claimScope: 'RAAS inhibition is linked to renal physiology as pharmacology education, including bounded monitoring and hyperkalemia-risk context.', reviewState: 'source-checked',
    boundary: 'Pharmacology education only; no indication confirmation, drug choice, dose, combination, potassium target, creatinine threshold, monitoring interval, contraindication decision, or patient-specific treatment is produced.',
  },
  {
    id: 'renal-imaging-context', label: 'Renal multimodality imaging context', kind: 'imaging', evidenceState: 'literature-backed',
    evidence: [pubmed('39022655', 'Systematic review compares diagnostic-accuracy evidence across CT, MRI, ultrasound, SPECT/CT, and PET approaches for T1 renal tumours and emphasizes unresolved optimal strategy.'), pubmed('27321380', 'Review discusses complementary roles of CT, MRI, and contrast-enhanced ultrasound in renal-mass characterization.')],
    evidenceRole: 'imaging-reference', accessedOrReviewedAt: REVIEW_DATE,
    claimScope: 'CT, MRI, ultrasound and related modalities are represented only as educational renal-imaging context supported by the cited literature.', reviewState: 'source-checked',
    boundary: 'Imaging education only; no patient scan, renal mass, cyst, obstruction, enhancement pattern, Bosniak class, malignancy probability, stage, or management recommendation is interpreted or generated.',
  },
] as const

export const URINARY_EDUCATION_EDGES: readonly UrinaryEducationEdge[] = [
  { from: 'urinary-gross-reference', to: 'renal-autoregulation-context', relationship: 'educational-context', note: 'Gross kidney orientation leads into autoregulation physiology without implying source-backed nephron, macula-densa, arteriole, or glomerular microgeometry.' },
  { from: 'renal-autoregulation-context', to: 'renal-autoregulation-disruption', relationship: 'disruption-associated-with', note: 'Autoregulation disruption is presented as a bounded mechanism relationship rather than a diagnosis, laboratory interpretation, risk estimate, or severity inference.' },
  { from: 'renal-autoregulation-context', to: 'renal-raas-inhibition-context', relationship: 'educational-context', note: 'Renal homeostasis links to RAAS pharmacology as mechanism education without implying an indication, prescription, dose, biochemical target, or individual response.' },
  { from: 'urinary-gross-reference', to: 'renal-imaging-context', relationship: 'educational-context', note: 'Reference anatomy links to modality context only; it is not registered to a patient image and cannot localize, classify, stage, or characterize a lesion.' },
] as const

export function validateUrinaryEducationGraph() {
  const ids = new Set(URINARY_EDUCATION_NODES.map((node) => node.id))
  const duplicateIds = ids.size !== URINARY_EDUCATION_NODES.length
  const danglingEdges = URINARY_EDUCATION_EDGES.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to))
  const unsupportedLiteratureNodes = URINARY_EDUCATION_NODES.filter((node) => node.evidenceState === 'literature-backed' && !node.evidence.some((item) => item.kind === 'pubmed'))
  const boundaryMissing = URINARY_EDUCATION_NODES.filter((node) => !node.boundary.trim())
  const unresolvedSourceIds = URINARY_EDUCATION_NODES.filter((node) => node.evidence.some((item) => !item.id.trim() || !item.sourceLocator.trim()))
  const incompleteClaims = URINARY_EDUCATION_NODES.filter((node) => !node.claimScope.trim() || !node.evidenceRole || !/^\d{4}-\d{2}-\d{2}$/.test(node.accessedOrReviewedAt))
  const invalidReviewStates = URINARY_EDUCATION_NODES.filter((node) => node.reviewState === 'human-reviewed')
  return { duplicateIds, danglingEdges, unsupportedLiteratureNodes, boundaryMissing, unresolvedSourceIds, incompleteClaims, invalidReviewStates }
}