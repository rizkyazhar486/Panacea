import type { BodySystemId } from './bodySystemSourceWave'

export type SpleenNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface SpleenEducationNode {
  id: string
  label: string
  kind: SpleenNodeKind
  evidenceState: 'educational-only'
  boundary: string
}

export interface SpleenEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'educational-context'
  note: string
}

export const SPLEEN_SYSTEM_ID: BodySystemId = 'lymphatic'

/** Spleen-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const SPLEEN_EDUCATION_NODES: readonly SpleenEducationNode[] = [
  {
    id: 'spleen-anatomy-context', label: 'Splenic anatomy context', kind: 'anatomy', evidenceState: 'educational-only',
    boundary: 'Educational anatomy placeholder only; no geometry, vascular branching, ligament relationship, microscopic red-pulp or white-pulp architecture, lesion location, variant, dimension, or patient-specific anatomy is asserted.',
  },
  {
    id: 'spleen-function-context', label: 'Splenic physiology context', kind: 'physiology', evidenceState: 'educational-only',
    boundary: 'Educational physiology placeholder only; no filtration rate, immune response magnitude, sequestration fraction, blood-cell turnover, reserve, perfusion, or person-level splenic function is inferred.',
  },
  {
    id: 'spleen-injury-context', label: 'Splenic pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only',
    boundary: 'Mechanism placeholder only; does not diagnose splenomegaly, hypersplenism, infarction, rupture, infection, hematologic disease, malignancy, portal-hypertensive change, or any other splenic disorder.',
  },
  {
    id: 'spleen-drug-context', label: 'Splenic pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only',
    boundary: 'Pharmacology placeholder only; no drug selection, vaccine schedule, antimicrobial choice, anticoagulation decision, dose, contraindication, interaction, monitoring plan, or treatment recommendation is provided.',
  },
  {
    id: 'spleen-imaging-context', label: 'Splenic imaging context', kind: 'imaging', evidenceState: 'educational-only',
    boundary: 'Imaging placeholder only; no ultrasound, CT, MRI, nuclear-medicine, segmentation, enhancement, organ size, laceration grade, infarct, mass, perfusion, or patient-specific interpretation is represented.',
  },
] as const

export const SPLEEN_EDUCATION_EDGES: readonly SpleenEducationEdge[] = [
  { from: 'spleen-anatomy-context', to: 'spleen-function-context', relationship: 'educational-context', note: 'General splenic orientation may anchor physiology education without implying source-backed microanatomy, blood-cell handling, immune activity, perfusion, or measured function.' },
  { from: 'spleen-function-context', to: 'spleen-injury-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, severity, laboratory interpretation, rupture risk, or patient-state inference.' },
  { from: 'spleen-injury-context', to: 'spleen-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no imaging finding, organ measurement, injury grade, infarct, mass, or lesion location is generated.' },
  { from: 'spleen-injury-context', to: 'spleen-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting medication, vaccine, antimicrobial, anticoagulant, dose, indication, monitoring, or patient-specific action.' },
] as const

export function validateSpleenEducationGraph() {
  const ids = SPLEEN_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: SPLEEN_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: SPLEEN_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: SPLEEN_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
