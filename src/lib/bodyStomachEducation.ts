import type { BodySystemId } from './bodySystemSourceWave'

export type StomachNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface StomachEducationNode { id: string; label: string; kind: StomachNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface StomachEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const STOMACH_SYSTEM_ID: BodySystemId = 'digestive'

/** Stomach-specific educational relationships. No atlas, imaging, endoscopic, or biomedical claim is promoted as source-backed here. */
export const STOMACH_EDUCATION_NODES: readonly StomachEducationNode[] = [
  { id: 'stomach-anatomy-context', label: 'Stomach anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, wall-layer thickness, vascular or neural course, lymphatic drainage, mucosal detail, lesion location, procedure target, or patient-specific anatomy is asserted.' },
  { id: 'stomach-function-context', label: 'Stomach physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no secretion rate, acidity, motility, emptying time, pressure, accommodation, endocrine output, absorption, measured function, or person-level gastric state is inferred.' },
  { id: 'stomach-disorder-context', label: 'Stomach pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose gastritis, ulcer disease, bleeding, obstruction, gastroparesis, infection, malignancy, perforation, reflux-related disease, or any other gastrointestinal disorder.' },
  { id: 'stomach-drug-context', label: 'Stomach pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, acid-suppression choice, antimicrobial regimen, prokinetic choice, dose, duration, contraindication, interaction, monitoring plan, eradication strategy, or treatment recommendation is provided.' },
  { id: 'stomach-imaging-context', label: 'Stomach imaging and endoscopy context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no endoscopy, radiograph, CT, MRI, ultrasound, fluoroscopy, mucosal finding, wall thickening, mass, ulcer, bleeding source, obstruction, procedure target, or patient-specific interpretation is represented.' },
] as const

export const STOMACH_EDUCATION_EDGES: readonly StomachEducationEdge[] = [
  { from: 'stomach-anatomy-context', to: 'stomach-function-context', relationship: 'educational-context', note: 'General gastric orientation may anchor physiology education without implying source-backed wall microstructure, measured secretion, motility, emptying, pressure, endocrine output, or patient-specific functional state.' },
  { from: 'stomach-function-context', to: 'stomach-disorder-context', relationship: 'supports', note: 'General gastric physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, severity, bleeding risk, obstruction state, or patient-level inference.' },
  { from: 'stomach-disorder-context', to: 'stomach-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and gastric imaging or endoscopy may be studied together only as bounded education; no ulcer, mass, mucosal abnormality, bleeding source, obstruction, perforation, or procedural target is generated.' },
  { from: 'stomach-disorder-context', to: 'stomach-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting acid suppression, antimicrobial therapy, prokinetics, mucosal protection, dose, duration, monitoring, eradication regimen, or patient-specific action.' },
] as const

export function validateStomachEducationGraph() {
  const ids = STOMACH_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: STOMACH_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: STOMACH_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: STOMACH_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
