import type { BodySystemId } from './bodySystemSourceWave'

export type ParathyroidNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface ParathyroidEducationNode { id: string; label: string; kind: ParathyroidNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface ParathyroidEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const PARATHYROID_SYSTEM_ID: BodySystemId = 'endocrine'
/** Parathyroid-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const PARATHYROID_EDUCATION_NODES: readonly ParathyroidEducationNode[] = [
  { id: 'parathyroid-anatomy-context', label: 'Parathyroid anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, gland count, dimensions, exact thyroid relationship, vascular course, microscopic architecture, ectopic location, surgical target, or patient-specific anatomy is asserted.' },
  { id: 'parathyroid-function-context', label: 'Parathyroid physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no hormone concentration, calcium or phosphate value, secretion rate, feedback magnitude, vitamin-D state, bone turnover, renal handling, or person-level endocrine function is inferred.' },
  { id: 'parathyroid-disorder-context', label: 'Parathyroid pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose hyperparathyroidism, hypoparathyroidism, adenoma, hyperplasia, malignancy, calcium disorder, renal-related mineral-bone disorder, or any other parathyroid condition.' },
  { id: 'parathyroid-drug-context', label: 'Parathyroid pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, calcium or vitamin-D therapy, calcimimetic choice, antiresorptive therapy, dose, contraindication, interaction, monitoring plan, surgery decision, or treatment recommendation is provided.' },
  { id: 'parathyroid-imaging-context', label: 'Parathyroid imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, scintigraphy, SPECT, CT, MRI, PET, segmentation, localization, lesion characterization, operative target, gland measurement, or patient-specific interpretation is represented.' },
] as const

export const PARATHYROID_EDUCATION_EDGES: readonly ParathyroidEducationEdge[] = [
  { from: 'parathyroid-anatomy-context', to: 'parathyroid-function-context', relationship: 'educational-context', note: 'General parathyroid orientation may anchor physiology education without implying source-backed gland count, microanatomy, hormone secretion, mineral values, or measured endocrine function.' },
  { from: 'parathyroid-function-context', to: 'parathyroid-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, laboratory interpretation, disease probability, severity, or patient-state inference.' },
  { from: 'parathyroid-disorder-context', to: 'parathyroid-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no localization, lesion characterization, operative target, gland measurement, or imaging finding is generated.' },
  { from: 'parathyroid-disorder-context', to: 'parathyroid-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting medication, supplementation, dose, indication, monitoring, surgery, or patient-specific action.' },
] as const

export function validateParathyroidEducationGraph() {
  const ids = PARATHYROID_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: PARATHYROID_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: PARATHYROID_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: PARATHYROID_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
