import type { BodySystemId } from './bodySystemSourceWave'

export type SpleenNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface SpleenEducationNode { id: string; label: string; kind: SpleenNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface SpleenEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const SPLEEN_SYSTEM_ID: BodySystemId = 'lymphatic-immune'

/** Spleen-specific educational relationships. No atlas, imaging, hematologic, immune-function, or biomedical claim is promoted as source-backed here. */
export const SPLEEN_EDUCATION_NODES: readonly SpleenEducationNode[] = [
  { id: 'spleen-anatomy-context', label: 'Spleen anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, segmental anatomy, vascular course, ligament relationship, developmental state, lesion location, anatomical variant, or patient-specific anatomy is asserted.' },
  { id: 'spleen-function-context', label: 'Spleen physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no splenic function, filtration rate, immune activity, sequestration, hematologic reserve, cellular composition, measured output, or person-level physiologic state is inferred.' },
  { id: 'spleen-disorder-context', label: 'Spleen pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose splenomegaly, infarction, rupture, infection, hematologic disease, malignancy, portal-hypertensive change, congenital disorder, or any other splenic condition.' },
  { id: 'spleen-drug-context', label: 'Spleen pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, anticoagulant decision, antimicrobial regimen, immunotherapy, hematologic therapy, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'spleen-imaging-context', label: 'Spleen imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no CT, MRI, ultrasound, radiograph, PET, nuclear-medicine study, segmentation, attenuation, signal characteristic, size, lesion, trauma grade, procedure target, or patient-specific interpretation is represented.' },
] as const

export const SPLEEN_EDUCATION_EDGES: readonly SpleenEducationEdge[] = [
  { from: 'spleen-anatomy-context', to: 'spleen-function-context', relationship: 'educational-context', note: 'General splenic orientation may anchor physiology education without implying source-backed microanatomy, blood-flow measurements, filtration kinetics, immune activity, sequestration, or measured function.' },
  { from: 'spleen-function-context', to: 'spleen-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, hematologic status, severity, prognosis, or patient-level inference.' },
  { from: 'spleen-disorder-context', to: 'spleen-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no lesion, enlargement, infarction, rupture, trauma grade, signal abnormality, staging conclusion, or procedural target is generated.' },
  { from: 'spleen-disorder-context', to: 'spleen-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting anticoagulation, antimicrobial therapy, immunotherapy, hematologic therapy, dose, monitoring, or patient-specific action.' },
] as const

export function validateSpleenEducationGraph() {
  const ids = SPLEEN_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: SPLEEN_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: SPLEEN_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: SPLEEN_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
