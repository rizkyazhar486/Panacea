import type { BodySystemId } from './bodySystemSourceWave'

export type AdrenalNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface AdrenalEducationNode { id: string; label: string; kind: AdrenalNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface AdrenalEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const ADRENAL_SYSTEM_ID: BodySystemId = 'endocrine'

/** Adrenal-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const ADRENAL_EDUCATION_NODES: readonly AdrenalEducationNode[] = [
  { id: 'adrenal-anatomy-context', label: 'Adrenal anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, gland dimensions, cortical zonation, medullary architecture, vascular branching, lesion location, variant, or patient-specific anatomy is asserted.' },
  { id: 'adrenal-function-context', label: 'Adrenal physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no hormone concentration, secretion rate, feedback-loop magnitude, stress response, reserve, circadian profile, or person-level adrenal function is inferred.' },
  { id: 'adrenal-disorder-context', label: 'Adrenal pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose adrenal insufficiency, cortisol excess, aldosterone disorders, catecholamine-secreting disease, malignancy, crisis, or any other adrenal disorder.' },
  { id: 'adrenal-drug-context', label: 'Adrenal pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, hormone replacement, synthesis inhibition, receptor blockade, dose, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'adrenal-imaging-context', label: 'Adrenal imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no CT, MRI, nuclear imaging, segmentation, attenuation value, washout calculation, organ size, lesion characterization, procedure target, or patient-specific interpretation is represented.' },
] as const

export const ADRENAL_EDUCATION_EDGES: readonly AdrenalEducationEdge[] = [
  { from: 'adrenal-anatomy-context', to: 'adrenal-function-context', relationship: 'educational-context', note: 'General adrenal orientation may anchor physiology education without implying source-backed microanatomy, steroidogenesis, catecholamine synthesis, feedback magnitude, or measured endocrine function.' },
  { from: 'adrenal-function-context', to: 'adrenal-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, laboratory interpretation, disease probability, severity, or patient-state inference.' },
  { from: 'adrenal-disorder-context', to: 'adrenal-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no lesion classification, attenuation measurement, washout value, procedure target, or imaging finding is generated.' },
  { from: 'adrenal-disorder-context', to: 'adrenal-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting medication, hormone replacement, dose, indication, contraindication, monitoring, or patient-specific action.' },
] as const

export function validateAdrenalEducationGraph() {
  const ids = ADRENAL_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: ADRENAL_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: ADRENAL_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: ADRENAL_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
