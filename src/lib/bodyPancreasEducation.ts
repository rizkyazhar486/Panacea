import type { BodySystemId } from './bodySystemSourceWave'

export type PancreasNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface PancreasEducationNode { id: string; label: string; kind: PancreasNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface PancreasEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const PANCREAS_SYSTEM_IDS: readonly BodySystemId[] = ['digestive', 'endocrine'] as const
/** Pancreas-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const PANCREAS_EDUCATION_NODES: readonly PancreasEducationNode[] = [
  { id: 'pancreas-anatomy-context', label: 'Pancreas anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, duct course, vascular or neural relationship, microscopic architecture, anatomical variant, lesion location, procedure target, or patient-specific anatomy is asserted.' },
  { id: 'pancreas-function-context', label: 'Pancreas physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured enzyme output, hormone concentration, glucose regulation, exocrine reserve, secretion rate, digestive function, or person-level pancreatic function is inferred.' },
  { id: 'pancreas-disorder-context', label: 'Pancreas pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose pancreatitis, diabetes, exocrine insufficiency, cystic disease, neoplasm, duct obstruction, endocrine tumor, or any other pancreatic condition.' },
  { id: 'pancreas-drug-context', label: 'Pancreas pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, insulin or glucose-lowering therapy, enzyme replacement, analgesic, antimicrobial, oncology regimen, dose, contraindication, monitoring plan, procedure, or treatment recommendation is provided.' },
  { id: 'pancreas-imaging-context', label: 'Pancreas imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no CT, MRI, MRCP, ultrasound, endoscopic ultrasound, PET, segmentation, duct measurement, lesion characterization, staging, procedure target, or patient-specific interpretation is represented.' },
] as const

export const PANCREAS_EDUCATION_EDGES: readonly PancreasEducationEdge[] = [
  { from: 'pancreas-anatomy-context', to: 'pancreas-function-context', relationship: 'educational-context', note: 'General pancreatic orientation may anchor physiology education without implying source-backed ductal microanatomy, secretion measurements, endocrine state, exocrine reserve, or patient-level physiology.' },
  { from: 'pancreas-function-context', to: 'pancreas-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, laboratory interpretation, disease probability, severity, prognosis, or patient-state inference.' },
  { from: 'pancreas-disorder-context', to: 'pancreas-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no lesion characterization, duct finding, staging conclusion, procedure target, or patient-specific imaging interpretation is generated.' },
  { from: 'pancreas-disorder-context', to: 'pancreas-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting medication, enzyme therapy, insulin, oncology regimen, dose, monitoring, procedure, or patient-specific action.' },
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
