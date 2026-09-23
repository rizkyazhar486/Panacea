import type { BodySystemId } from './bodySystemSourceWave'

export type KidneyNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface KidneyEducationNode {
  id: string
  label: string
  kind: KidneyNodeKind
  evidenceState: 'educational-only'
  boundary: string
}

export interface KidneyEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'educational-context'
  note: string
}

export const KIDNEY_SYSTEM_ID: BodySystemId = 'urinary'

/** Kidney-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const KIDNEY_EDUCATION_NODES: readonly KidneyEducationNode[] = [
  {
    id: 'kidney-anatomy-context', label: 'Kidney anatomy context', kind: 'anatomy', evidenceState: 'educational-only',
    boundary: 'Educational anatomy placeholder only; no geometry, dimensions, vascular branching, collecting-system topology, nephron microarchitecture, lesion location, anatomical variant, or patient-specific anatomy is asserted.',
  },
  {
    id: 'kidney-function-context', label: 'Kidney physiology context', kind: 'physiology', evidenceState: 'educational-only',
    boundary: 'Educational physiology placeholder only; no measured filtration, clearance, renal blood flow, tubular transport rate, electrolyte handling, acid-base state, endocrine output, reserve, or person-level kidney function is inferred.',
  },
  {
    id: 'kidney-disorder-context', label: 'Kidney pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only',
    boundary: 'Mechanism placeholder only; does not diagnose acute kidney injury, chronic kidney disease, glomerular disease, obstruction, infection, stone disease, malignancy, electrolyte disorder, or any other renal condition.',
  },
  {
    id: 'kidney-drug-context', label: 'Kidney pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only',
    boundary: 'Pharmacology placeholder only; no drug selection, renal dose adjustment, diuretic choice, renin-angiotensin system therapy, nephrotoxicity judgment, contraindication, interaction, monitoring plan, or treatment recommendation is provided.',
  },
  {
    id: 'kidney-imaging-context', label: 'Kidney imaging context', kind: 'imaging', evidenceState: 'educational-only',
    boundary: 'Imaging placeholder only; no ultrasound, CT, MRI, nuclear imaging, segmentation, organ size, hydronephrosis grade, calculus measurement, mass characterization, biopsy target, or patient-specific interpretation is represented.',
  },
] as const

export const KIDNEY_EDUCATION_EDGES: readonly KidneyEducationEdge[] = [
  { from: 'kidney-anatomy-context', to: 'kidney-function-context', relationship: 'educational-context', note: 'General renal orientation may anchor physiology education without implying source-backed nephron microanatomy, vascular topology, filtration magnitude, tubular transport, or measured renal function.' },
  { from: 'kidney-function-context', to: 'kidney-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize renal mechanism education, but this relationship carries no diagnosis, laboratory interpretation, disease probability, staging, severity, or patient-state inference.' },
  { from: 'kidney-disorder-context', to: 'kidney-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no hydronephrosis grade, stone size, mass characterization, lesion measurement, biopsy target, or imaging finding is generated.' },
  { from: 'kidney-disorder-context', to: 'kidney-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting medication, renal dose, indication, contraindication, nephrotoxicity action, monitoring, dialysis strategy, or patient-specific therapy.' },
] as const

export function validateKidneyEducationGraph() {
  const ids = KIDNEY_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: KIDNEY_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: KIDNEY_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: KIDNEY_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
