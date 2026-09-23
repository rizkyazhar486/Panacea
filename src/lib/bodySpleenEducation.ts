import type { BodySystemId } from './bodySystemSourceWave'

export type SpleenNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface SpleenEducationNode { id: string; label: string; kind: SpleenNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface SpleenEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const SPLEEN_SYSTEM_ID: BodySystemId = 'immune'
/** Spleen-specific educational relationships only; no source-backed anatomy, function, diagnosis, treatment, imaging finding, or patient claim is asserted here. */
export const SPLEEN_EDUCATION_NODES: readonly SpleenEducationNode[] = [
  { id: 'spleen-anatomy-context', label: 'Spleen anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, hilar or vascular course, ligament relationship, microarchitecture, anatomical variant, lesion location, operative plane, or patient-specific anatomy is asserted.' },
  { id: 'spleen-function-context', label: 'Spleen physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured filtration, immune function, sequestration, hematologic reserve, perfusion, cellular activity, laboratory state, or person-level function is inferred.' },
  { id: 'spleen-disorder-context', label: 'Spleen pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose splenomegaly, infarction, rupture, infection, hematologic disease, portal-hypertension effects, malignancy, congenital disorder, or any other splenic condition.' },
  { id: 'spleen-drug-context', label: 'Spleen pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, antimicrobial therapy, anticoagulation, hematologic or oncologic regimen, immunization plan, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'spleen-imaging-context', label: 'Spleen imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no CT, ultrasound, MRI, nuclear-medicine finding, segmentation, size measurement, enhancement pattern, injury grade, mass, infarct, bleeding source, staging conclusion, procedure target, or patient-specific interpretation is represented.' },
] as const
export const SPLEEN_EDUCATION_EDGES: readonly SpleenEducationEdge[] = [
  { from: 'spleen-anatomy-context', to: 'spleen-function-context', relationship: 'educational-context', note: 'General splenic orientation may anchor physiology education without implying source-backed microarchitecture, vascular topology, filtration performance, immune activity, hematologic reserve, or measured function.' },
  { from: 'spleen-function-context', to: 'spleen-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, laboratory interpretation, bleeding risk, prognosis, severity, or patient-level inference.' },
  { from: 'spleen-disorder-context', to: 'spleen-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no enlargement, injury, infarct, mass, enhancement abnormality, bleeding source, staging conclusion, lesion location, or procedural target is generated.' },
  { from: 'spleen-disorder-context', to: 'spleen-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting antimicrobial, anticoagulant, hematologic, oncologic, immunization, or other therapy, dose, monitoring, or patient-specific action.' },
] as const
export function validateSpleenEducationGraph() {
  const ids = SPLEEN_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: SPLEEN_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: SPLEEN_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: SPLEEN_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
