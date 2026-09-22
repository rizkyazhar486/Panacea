import type { BodySystemId } from './bodySystemSourceWave'

export type KidneyNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type KidneyEvidenceState = 'source-backed' | 'educational-only'

export interface KidneyEducationNode {
  id: string
  label: string
  kind: KidneyNodeKind
  evidenceState: KidneyEvidenceState
  sourceId?: string
  boundary: string
}

export interface KidneyEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'educational-context'
  note: string
}

export const KIDNEY_SYSTEM_ID: BodySystemId = 'urinary'

/**
 * Kidney-specific Body Exposure education with deliberately narrow claims.
 * Only gross orientation is bound to repository atlas geometry. Physiology,
 * pathology, pharmacology and imaging entries remain educational placeholders
 * until independently verified evidence is attached; they must not be promoted
 * to patient-specific or clinical-decision content.
 */
export const KIDNEY_EDUCATION_NODES: readonly KidneyEducationNode[] = [
  {
    id: 'kidney-gross-reference',
    label: 'Kidney gross reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    sourceId: 'visceral.glb',
    boundary: 'Reference atlas geometry only; not patient-specific anatomy and not evidence for nephron microstructure, renal vascular detail, collecting-system patency, lesion location, or measured organ dimensions.',
  },
  {
    id: 'kidney-filtration-context',
    label: 'Renal filtration physiology context',
    kind: 'physiology',
    evidenceState: 'educational-only',
    boundary: 'Educational placeholder only; no GFR, renal plasma flow, filtration fraction, tubular transport, electrolyte handling, acid-base status, urine output, or renal reserve is inferred.',
  },
  {
    id: 'kidney-injury-context',
    label: 'Kidney injury pathophysiology context',
    kind: 'pathophysiology',
    evidenceState: 'educational-only',
    boundary: 'Mechanism placeholder only; does not diagnose acute kidney injury, chronic kidney disease, obstruction, infection, glomerular disease, vascular disease, or any other renal disorder.',
  },
  {
    id: 'kidney-drug-context',
    label: 'Renal pharmacology context',
    kind: 'pharmacology',
    evidenceState: 'educational-only',
    boundary: 'Pharmacology placeholder only; no drug selection, dose adjustment, nephrotoxicity estimate, contraindication, interaction, treatment recommendation, or patient-specific renal dosing is provided.',
  },
  {
    id: 'kidney-imaging-context',
    label: 'Renal imaging context',
    kind: 'imaging',
    evidenceState: 'educational-only',
    boundary: 'Imaging placeholder only; no CT, MRI, ultrasound, nuclear-medicine, segmentation, hydronephrosis, stone, mass, perfusion, enhancement, or patient-specific finding is represented.',
  },
]

export const KIDNEY_EDUCATION_EDGES: readonly KidneyEducationEdge[] = [
  {
    from: 'kidney-gross-reference',
    to: 'kidney-filtration-context',
    relationship: 'educational-context',
    note: 'Gross renal orientation may anchor physiology education without implying that atlas geometry encodes filtration or nephron function.',
  },
  {
    from: 'kidney-filtration-context',
    to: 'kidney-injury-context',
    relationship: 'supports',
    note: 'General physiology concepts can contextualize mechanism education, but this edge carries no diagnosis or patient-state inference.',
  },
  {
    from: 'kidney-injury-context',
    to: 'kidney-imaging-context',
    relationship: 'educational-context',
    note: 'Pathophysiology and imaging may be studied together only as bounded education; no imaging finding is generated from a mechanism node.',
  },
  {
    from: 'kidney-injury-context',
    to: 'kidney-drug-context',
    relationship: 'educational-context',
    note: 'Disease-mechanism education may link to pharmacology education without selecting therapy, dose, indication, or patient-specific action.',
  },
]

export function validateKidneyEducationGraph() {
  const ids = KIDNEY_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: KIDNEY_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    sourceBackedWithoutSource: KIDNEY_EDUCATION_NODES.filter((node) => node.evidenceState === 'source-backed' && !node.sourceId),
    educationalWithSourceClaim: KIDNEY_EDUCATION_NODES.filter((node) => node.evidenceState === 'educational-only' && node.sourceId),
    boundaryMissing: KIDNEY_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
