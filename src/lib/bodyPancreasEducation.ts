import type { BodySystemId } from './bodySystemSourceWave'

export type PancreasNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface PancreasEducationNode { id: string; label: string; kind: PancreasNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface PancreasEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const PANCREAS_SYSTEM_ID: BodySystemId = 'endocrine'
/** Pancreas-specific educational relationships; no anatomy, physiology, disease, drug, imaging, metabolic, digestive, or patient claim is promoted as source-backed here. */
export const PANCREAS_EDUCATION_NODES: readonly PancreasEducationNode[] = [
  { id: 'pancreas-anatomy-context', label: 'Pancreas anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, ductal course, vascular relationship, anatomical variant, lesion location, procedure target, or patient-specific anatomy is asserted.' },
  { id: 'pancreas-function-context', label: 'Pancreas physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured secretion, hormone output, enzyme output, glucose regulation, digestive function, endocrine function, exocrine function, or person-level physiology is inferred.' },
  { id: 'pancreas-disorder-context', label: 'Pancreas pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose pancreatitis, diabetes, cystic disease, malignancy, endocrine tumor, exocrine insufficiency, obstruction, infection, or any other pancreatic condition.' },
  { id: 'pancreas-drug-context', label: 'Pancreas pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, insulin therapy, glucose-lowering therapy, enzyme replacement, analgesia, antimicrobial therapy, oncology regimen, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'pancreas-imaging-context', label: 'Pancreas imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, CT, MRI, MRCP, endoscopic imaging, segmentation, duct measurement, lesion, staging conclusion, biopsy target, procedure target, or patient-specific interpretation is represented.' },
] as const
export const PANCREAS_EDUCATION_EDGES: readonly PancreasEducationEdge[] = [
  { from: 'pancreas-anatomy-context', to: 'pancreas-function-context', relationship: 'educational-context', note: 'General pancreatic orientation may anchor physiology education without implying source-backed geometry, measured secretion, endocrine output, exocrine output, digestive function, glucose regulation, or patient-level physiology.' },
  { from: 'pancreas-function-context', to: 'pancreas-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, symptom attribution, metabolic conclusion, disease severity, prognosis, or patient-level inference.' },
  { from: 'pancreas-disorder-context', to: 'pancreas-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no lesion, duct measurement, staging conclusion, biopsy target, procedure target, or patient-specific imaging interpretation is generated.' },
  { from: 'pancreas-disorder-context', to: 'pancreas-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting insulin, glucose-lowering agents, enzyme replacement, analgesia, antimicrobials, oncology therapy, dose, monitoring, or patient-specific action.' },
] as const
export function validatePancreasEducationGraph() {
  const ids = PANCREAS_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: PANCREAS_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: PANCREAS_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: PANCREAS_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
