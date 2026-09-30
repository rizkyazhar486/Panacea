import type { BodySystemId } from './bodySystemSourceWave'

export type PancreasNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface PancreasEducationNode {
  id: string
  label: string
  kind: PancreasNodeKind
  evidenceState: 'educational-only'
  boundary: string
}

export interface PancreasEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'educational-context'
  note: string
}

export const PANCREAS_SYSTEM_ID: BodySystemId = 'digestive'

/** Pancreas-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const PANCREAS_EDUCATION_NODES: readonly PancreasEducationNode[] = [
  {
    id: 'pancreas-anatomy-context', label: 'Pancreatic anatomy context', kind: 'anatomy', evidenceState: 'educational-only',
    boundary: 'Educational anatomy placeholder only; no geometry, ductal detail, vascular relationship, microscopic acinar or islet architecture, lesion location, variant, dimension, or patient-specific anatomy is asserted.',
  },
  {
    id: 'pancreas-function-context', label: 'Pancreatic physiology context', kind: 'physiology', evidenceState: 'educational-only',
    boundary: 'Educational physiology placeholder only; no endocrine secretion, exocrine secretion, enzyme output, glucose regulation, laboratory value, reserve, perfusion, or person-level pancreatic state is inferred.',
  },
  {
    id: 'pancreas-injury-context', label: 'Pancreatic pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only',
    boundary: 'Mechanism placeholder only; does not diagnose pancreatitis, diabetes, exocrine insufficiency, cystic disease, duct obstruction, malignancy, vascular complication, or any other pancreatic disorder.',
  },
  {
    id: 'pancreas-drug-context', label: 'Pancreatic pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only',
    boundary: 'Pharmacology placeholder only; no drug selection, insulin regimen, enzyme replacement, dose, contraindication, interaction, monitoring plan, glucose target, or treatment recommendation is provided.',
  },
  {
    id: 'pancreas-imaging-context', label: 'Pancreatic imaging context', kind: 'imaging', evidenceState: 'educational-only',
    boundary: 'Imaging placeholder only; no ultrasound, CT, MRI, MRCP, endoscopic ultrasound, nuclear-medicine, segmentation, enhancement, duct caliber, mass, inflammation, or patient-specific interpretation is represented.',
  },
] as const

export const PANCREAS_EDUCATION_EDGES: readonly PancreasEducationEdge[] = [
  { from: 'pancreas-anatomy-context', to: 'pancreas-function-context', relationship: 'educational-context', note: 'General pancreatic orientation may anchor physiology education without implying source-backed microanatomy, secretion, metabolism, perfusion, or measured function.' },
  { from: 'pancreas-function-context', to: 'pancreas-injury-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, severity, laboratory interpretation, or patient-state inference.' },
  { from: 'pancreas-injury-context', to: 'pancreas-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no imaging finding, duct abnormality, mass, inflammation, or lesion location is generated.' },
  { from: 'pancreas-injury-context', to: 'pancreas-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting therapy, insulin or enzyme regimen, dose, indication, monitoring, or patient-specific action.' },
] as const

export function validatePancreasEducationGraph() {
  const ids = PANCREAS_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: PANCREAS_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: PANCREAS_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: PANCREAS_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
