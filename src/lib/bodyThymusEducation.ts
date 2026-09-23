import type { BodySystemId } from './bodySystemSourceWave'

export type ThymusNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface ThymusEducationNode { id: string; label: string; kind: ThymusNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface ThymusEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const THYMUS_SYSTEM_ID: BodySystemId = 'lymphatic-immune'

/** Thymus-specific educational relationships. No atlas, imaging, immune-function, or biomedical claim is promoted as source-backed here. */
export const THYMUS_EDUCATION_NODES: readonly ThymusEducationNode[] = [
  { id: 'thymus-anatomy-context', label: 'Thymus anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, lobular microarchitecture, vascular or lymphatic course, developmental state, lesion location, anatomical variant, or patient-specific anatomy is asserted.' },
  { id: 'thymus-function-context', label: 'Thymus physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no immune function, thymocyte output, selection rate, endocrine activity, involution rate, cellular composition, measured reserve, or person-level immune state is inferred.' },
  { id: 'thymus-disorder-context', label: 'Thymus pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose thymic hyperplasia, thymoma, immune deficiency, autoimmune disease, cyst, infection, malignancy, developmental disorder, or any other thymic condition.' },
  { id: 'thymus-drug-context', label: 'Thymus pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, immunotherapy choice, immunosuppressive regimen, antimicrobial regimen, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'thymus-imaging-context', label: 'Thymus imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no CT, MRI, radiograph, PET, nuclear-medicine study, segmentation, attenuation, signal characteristic, mass, hyperplasia, invasion, procedure target, or patient-specific interpretation is represented.' },
] as const

export const THYMUS_EDUCATION_EDGES: readonly ThymusEducationEdge[] = [
  { from: 'thymus-anatomy-context', to: 'thymus-function-context', relationship: 'educational-context', note: 'General thymic orientation may anchor physiology education without implying source-backed microanatomy, immune-cell output, selection kinetics, endocrine activity, or measured function.' },
  { from: 'thymus-function-context', to: 'thymus-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, immune status, severity, prognosis, or patient-level inference.' },
  { from: 'thymus-disorder-context', to: 'thymus-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no mass, hyperplasia, invasion, signal abnormality, staging conclusion, or procedural target is generated.' },
  { from: 'thymus-disorder-context', to: 'thymus-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting medication, immunotherapy, immunosuppression, antimicrobial therapy, dose, monitoring, or patient-specific action.' },
] as const

export function validateThymusEducationGraph() {
  const ids = THYMUS_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: THYMUS_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: THYMUS_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: THYMUS_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
