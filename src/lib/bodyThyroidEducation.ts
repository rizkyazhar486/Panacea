import type { BodySystemId } from './bodySystemSourceWave'

export type ThyroidNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface ThyroidEducationNode {
  id: string
  label: string
  kind: ThyroidNodeKind
  evidenceState: 'educational-only'
  boundary: string
}

export interface ThyroidEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'educational-context'
  note: string
}

export const THYROID_SYSTEM_ID: BodySystemId = 'endocrine'

/** Thyroid-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const THYROID_EDUCATION_NODES: readonly ThyroidEducationNode[] = [
  {
    id: 'thyroid-anatomy-context', label: 'Thyroid anatomy context', kind: 'anatomy', evidenceState: 'educational-only',
    boundary: 'Educational anatomy placeholder only; no geometry, lobe or isthmus dimensions, vascular branching, nerve relationship, microscopic follicular architecture, lesion location, variant, or patient-specific anatomy is asserted.',
  },
  {
    id: 'thyroid-function-context', label: 'Thyroid physiology context', kind: 'physiology', evidenceState: 'educational-only',
    boundary: 'Educational physiology placeholder only; no hormone concentration, synthesis rate, iodine uptake, feedback-loop magnitude, metabolic effect size, reserve, or person-level thyroid function is inferred.',
  },
  {
    id: 'thyroid-disorder-context', label: 'Thyroid pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only',
    boundary: 'Mechanism placeholder only; does not diagnose hypothyroidism, hyperthyroidism, thyroiditis, goiter, nodular disease, malignancy, autoimmune disease, crisis, or any other thyroid disorder.',
  },
  {
    id: 'thyroid-drug-context', label: 'Thyroid pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only',
    boundary: 'Pharmacology placeholder only; no drug selection, thyroid-hormone replacement, antithyroid therapy, radioactive-iodine decision, dose, contraindication, interaction, monitoring plan, or treatment recommendation is provided.',
  },
  {
    id: 'thyroid-imaging-context', label: 'Thyroid imaging context', kind: 'imaging', evidenceState: 'educational-only',
    boundary: 'Imaging placeholder only; no ultrasound, scintigraphy, CT, MRI, segmentation, nodule classification, uptake value, organ size, lesion characterization, biopsy target, or patient-specific interpretation is represented.',
  },
] as const

export const THYROID_EDUCATION_EDGES: readonly ThyroidEducationEdge[] = [
  { from: 'thyroid-anatomy-context', to: 'thyroid-function-context', relationship: 'educational-context', note: 'General thyroid orientation may anchor physiology education without implying source-backed microanatomy, hormone synthesis, iodine handling, feedback magnitude, or measured endocrine function.' },
  { from: 'thyroid-function-context', to: 'thyroid-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, laboratory interpretation, disease probability, severity, or patient-state inference.' },
  { from: 'thyroid-disorder-context', to: 'thyroid-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no nodule classification, uptake pattern, lesion measurement, biopsy target, or imaging finding is generated.' },
  { from: 'thyroid-disorder-context', to: 'thyroid-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting replacement therapy, antithyroid medication, radioactive iodine, dose, indication, monitoring, or patient-specific action.' },
] as const

export function validateThyroidEducationGraph() {
  const ids = THYROID_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: THYROID_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: THYROID_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: THYROID_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
