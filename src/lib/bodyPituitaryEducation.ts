import type { BodySystemId } from './bodySystemSourceWave'

export type PituitaryNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface PituitaryEducationNode { id: string; label: string; kind: PituitaryNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface PituitaryEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const PITUITARY_SYSTEM_ID: BodySystemId = 'endocrine'
/** Pituitary-specific educational relationships; no anatomy, physiology, disease, drug, imaging, or patient claim is promoted as source-backed here. */
export const PITUITARY_EDUCATION_NODES: readonly PituitaryEducationNode[] = [
  { id: 'pituitary-anatomy-context', label: 'Pituitary anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no sellar geometry, gland dimensions, stalk course, cavernous-sinus relationship, optic-chiasm distance, anatomical variant, lesion location, or patient-specific anatomy is asserted.' },
  { id: 'pituitary-function-context', label: 'Pituitary physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no anterior or posterior hormone axis measurement, pulsatile secretion timing, feedback-loop set point, target-gland response, measured reserve, or person-level hormonal function is inferred.' },
  { id: 'pituitary-disorder-context', label: 'Pituitary pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose adenoma, hypopituitarism, hyperprolactinemia, acromegaly, Cushing disease, diabetes insipidus, apoplexy, empty sella, or any other pituitary or hypothalamic-pituitary condition.' },
  { id: 'pituitary-drug-context', label: 'Pituitary pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no hormone-replacement selection, dopamine-agonist therapy, somatostatin-analog therapy, surgical or radiotherapy adjunct, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'pituitary-imaging-context', label: 'Pituitary imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no MRI, CT, dynamic contrast sequence, visual-field correlation, segmentation, microadenoma or macroadenoma sizing, stalk deviation, mass, procedure target, or patient-specific interpretation is represented.' },
] as const
export const PITUITARY_EDUCATION_EDGES: readonly PituitaryEducationEdge[] = [
  { from: 'pituitary-anatomy-context', to: 'pituitary-function-context', relationship: 'educational-context', note: 'General sellar and stalk orientation may anchor physiology education without implying source-backed gland microanatomy, hormone-axis measurements, pulsatile secretion, or measured function.' },
  { from: 'pituitary-function-context', to: 'pituitary-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, axis-deficiency severity, prognosis, or patient-level inference.' },
  { from: 'pituitary-disorder-context', to: 'pituitary-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no adenoma, stalk deviation, mass, chiasm compression, staging conclusion, lesion location, or procedural target is generated.' },
  { from: 'pituitary-disorder-context', to: 'pituitary-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting hormone-replacement therapy, dopamine-agonist therapy, somatostatin-analog therapy, dose, monitoring, or patient-specific action.' },
] as const
export function validatePituitaryEducationGraph() {
  const ids = PITUITARY_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: PITUITARY_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: PITUITARY_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: PITUITARY_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
