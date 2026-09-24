import type { BodySystemId } from './bodySystemSourceWave'

export type ColonNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface ColonEducationNode { id: string; label: string; kind: ColonNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface ColonEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const COLON_SYSTEM_ID: BodySystemId = 'digestive'
/** Colon-specific educational relationships; no anatomy, physiology, disease, drug, imaging, or patient claim is promoted as source-backed here. */
export const COLON_EDUCATION_NODES: readonly ColonEducationNode[] = [
  { id: 'colon-anatomy-context', label: 'Colon anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, segment coordinates, vascular course, wall-layer microarchitecture, lesion location, anatomical variant, or patient-specific anatomy is asserted.' },
  { id: 'colon-function-context', label: 'Colon physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured transit, motility, water or electrolyte handling, microbiome function, intraluminal pressure, stool characteristics, or person-level colonic function is inferred.' },
  { id: 'colon-disorder-context', label: 'Colon pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose obstruction, ischemia, inflammatory disease, infection, bleeding, dysmotility, diverticular disease, neoplasm, perforation, or any other colonic condition.' },
  { id: 'colon-drug-context', label: 'Colon pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, laxative, antidiarrheal, anti-inflammatory therapy, antimicrobial therapy, oncology regimen, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'colon-imaging-context', label: 'Colon imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no CT, MRI, radiograph, ultrasound, colonoscopy, nuclear imaging, segmentation, caliber, wall thickness, enhancement, transition point, bleeding source, lesion, or patient-specific interpretation is represented.' },
] as const
export const COLON_EDUCATION_EDGES: readonly ColonEducationEdge[] = [
  { from: 'colon-anatomy-context', to: 'colon-function-context', relationship: 'educational-context', note: 'General colonic orientation may anchor physiology education without implying source-backed wall microanatomy, transit measurements, motility, water handling, microbiome state, or stool characteristics.' },
  { from: 'colon-function-context', to: 'colon-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, obstruction severity, inflammatory state, cancer conclusion, prognosis, or patient-level inference.' },
  { from: 'colon-disorder-context', to: 'colon-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no transition point, wall thickening, enhancement, bleeding source, ischemia, mass location, staging, or procedure target is generated.' },
  { from: 'colon-disorder-context', to: 'colon-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting laxative, antidiarrheal, anti-inflammatory, antimicrobial, or oncology therapy, dose, monitoring, or patient-specific action.' },
] as const
export function validateColonEducationGraph() {
  const ids = COLON_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: COLON_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: COLON_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: COLON_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
