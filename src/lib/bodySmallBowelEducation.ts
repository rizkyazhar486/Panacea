import type { BodySystemId } from './bodySystemSourceWave'

export type SmallBowelNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface SmallBowelEducationNode { id: string; label: string; kind: SmallBowelNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface SmallBowelEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const SMALL_BOWEL_SYSTEM_ID: BodySystemId = 'digestive'
/** Small-bowel-specific educational relationships; no anatomy, physiology, disease, drug, imaging, nutrition, or patient claim is promoted as source-backed here. */
export const SMALL_BOWEL_EDUCATION_NODES: readonly SmallBowelEducationNode[] = [
  { id: 'small-bowel-anatomy-context', label: 'Small bowel anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, segment coordinates, mesenteric or vascular course, wall-layer microarchitecture, lesion location, anatomical variant, or patient-specific anatomy is asserted.' },
  { id: 'small-bowel-function-context', label: 'Small bowel physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured absorption, secretion, transit time, motility, enzyme activity, permeability, nutrient uptake, intraluminal pressure, or person-level intestinal function is inferred.' },
  { id: 'small-bowel-disorder-context', label: 'Small bowel pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose obstruction, ischemia, inflammatory disease, infection, malabsorption, bleeding, dysmotility, neoplasm, perforation, or any other small-bowel condition.' },
  { id: 'small-bowel-drug-context', label: 'Small bowel pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, anti-inflammatory therapy, antimicrobial therapy, motility agent, nutrition therapy, oncology regimen, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'small-bowel-imaging-context', label: 'Small bowel imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no CT, MRI, radiograph, ultrasound, capsule study, endoscopy, nuclear imaging, segmentation, caliber, wall thickness, enhancement, transition point, bleeding source, lesion, or patient-specific interpretation is represented.' },
] as const
export const SMALL_BOWEL_EDUCATION_EDGES: readonly SmallBowelEducationEdge[] = [
  { from: 'small-bowel-anatomy-context', to: 'small-bowel-function-context', relationship: 'educational-context', note: 'General small-bowel orientation may anchor physiology education without implying source-backed wall microanatomy, transit measurements, absorption, secretion, motility, enzyme activity, or nutrient handling.' },
  { from: 'small-bowel-function-context', to: 'small-bowel-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, obstruction severity, inflammatory state, nutritional conclusion, prognosis, or patient-level inference.' },
  { from: 'small-bowel-disorder-context', to: 'small-bowel-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no transition point, wall thickening, enhancement, bleeding source, ischemia, lesion location, or procedure target is generated.' },
  { from: 'small-bowel-disorder-context', to: 'small-bowel-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting anti-inflammatory, antimicrobial, motility, nutrition, or oncology therapy, dose, monitoring, or patient-specific action.' },
] as const
export function validateSmallBowelEducationGraph() {
  const ids = SMALL_BOWEL_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: SMALL_BOWEL_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: SMALL_BOWEL_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: SMALL_BOWEL_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
