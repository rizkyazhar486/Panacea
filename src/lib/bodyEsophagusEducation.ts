import type { BodySystemId } from './bodySystemSourceWave'

export type EsophagusNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface EsophagusEducationNode { id: string; label: string; kind: EsophagusNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface EsophagusEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const ESOPHAGUS_SYSTEM_ID: BodySystemId = 'digestive'
/** Esophagus-specific educational relationships; no anatomy, physiology, disease, drug, imaging, or patient claim is promoted as source-backed here. */
export const ESOPHAGUS_EDUCATION_NODES: readonly EsophagusEducationNode[] = [
  { id: 'esophagus-anatomy-context', label: 'Esophagus anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, segment coordinates, wall-layer microarchitecture, vascular or neural course, anatomical variant, lesion location, or patient-specific anatomy is asserted.' },
  { id: 'esophagus-function-context', label: 'Esophagus physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no motility, peristaltic timing, sphincter pressure, bolus transit, reflux burden, measured reserve, or person-level swallowing function is inferred.' },
  { id: 'esophagus-disorder-context', label: 'Esophagus pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose reflux disease, esophagitis, motility disorder, obstruction, stricture, varices, infection, Barrett change, malignancy, perforation, bleeding, or any other esophageal condition.' },
  { id: 'esophagus-drug-context', label: 'Esophagus pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, acid-suppression therapy, prokinetic therapy, antimicrobial therapy, oncology regimen, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'esophagus-imaging-context', label: 'Esophagus imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no endoscopy, contrast study, CT, MRI, ultrasound, PET, manometry interpretation, segmentation, wall thickness, mass, stricture, bleeding source, procedure target, or patient-specific interpretation is represented.' },
] as const
export const ESOPHAGUS_EDUCATION_EDGES: readonly EsophagusEducationEdge[] = [
  { from: 'esophagus-anatomy-context', to: 'esophagus-function-context', relationship: 'educational-context', note: 'General esophageal orientation may anchor physiology education without implying source-backed wall microanatomy, peristaltic measurements, sphincter pressures, bolus transit, reflux burden, or measured function.' },
  { from: 'esophagus-function-context', to: 'esophagus-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, reflux severity, obstruction severity, prognosis, or patient-level inference.' },
  { from: 'esophagus-disorder-context', to: 'esophagus-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no mucosal lesion, wall thickening, mass, stricture, varix, bleeding source, staging conclusion, lesion location, or procedural target is generated.' },
  { from: 'esophagus-disorder-context', to: 'esophagus-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting acid suppression, motility therapy, antimicrobial treatment, oncology treatment, dose, monitoring, or patient-specific action.' },
] as const
export function validateEsophagusEducationGraph() {
  const ids = ESOPHAGUS_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: ESOPHAGUS_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: ESOPHAGUS_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: ESOPHAGUS_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
