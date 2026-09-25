import type { BodySystemId } from './bodySystemSourceWave'

export type PituitaryNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface PituitaryEducationNode { id: string; label: string; kind: PituitaryNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface PituitaryEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const PITUITARY_SYSTEM_ID: BodySystemId = 'endocrine'

export const PITUITARY_EDUCATION_NODES: readonly PituitaryEducationNode[] = [
  { id: 'pituitary-anatomy-context', label: 'Pituitary anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, structural relationships, microscopic architecture, lesion location, variant, procedural target, or patient-specific anatomy is asserted.' },
  { id: 'pituitary-physiology-context', label: 'Pituitary physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no hormone concentration, secretion rate, feedback magnitude, test response, reserve, circadian state, or person-level endocrine function is inferred.' },
  { id: 'pituitary-pathophysiology-context', label: 'Pituitary pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; no disorder, lesion class, probability, severity, laboratory interpretation, or patient diagnosis is represented.' },
  { id: 'pituitary-pharmacology-context', label: 'Pituitary pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, dose, route, contraindication, interaction, monitoring plan, procedure choice, or patient-specific treatment action is provided.' },
  { id: 'pituitary-imaging-context', label: 'Pituitary imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no MRI or CT finding, segmentation, signal behavior, lesion characterization, size threshold, procedural target, or patient-specific interpretation is represented.' },
] as const

export const PITUITARY_EDUCATION_EDGES: readonly PituitaryEducationEdge[] = [
  { from: 'pituitary-anatomy-context', to: 'pituitary-physiology-context', relationship: 'educational-context', note: 'General organ orientation may anchor later source-reviewed physiology education without asserting geometry, microscopic continuity, hormone state, or patient-specific function.' },
  { from: 'pituitary-physiology-context', to: 'pituitary-pathophysiology-context', relationship: 'supports', note: 'Physiology and mechanism topics may be linked for education only; the relationship carries no diagnosis, laboratory interpretation, probability, severity, or person-level inference.' },
  { from: 'pituitary-pathophysiology-context', to: 'pituitary-imaging-context', relationship: 'educational-context', note: 'Mechanism and imaging topics remain a bounded educational relationship; no lesion, measurement, procedural target, or patient imaging finding is generated.' },
  { from: 'pituitary-pathophysiology-context', to: 'pituitary-pharmacology-context', relationship: 'educational-context', note: 'Mechanism education may link to future evidence-reviewed pharmacology without selecting a medicine, dose, indication, monitoring plan, or treatment action.' },
] as const

export function validatePituitaryEducationGraph() {
  const ids = PITUITARY_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: PITUITARY_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: PITUITARY_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: PITUITARY_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
