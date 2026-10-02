import type { BodySystemId } from './bodySystemSourceWave'

export type OvaryNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface OvaryEducationNode { id: string; label: string; kind: OvaryNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface OvaryEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const OVARY_SYSTEM_ID: BodySystemId = 'reproductive'
/** Ovary-specific educational relationships; no anatomy, physiology, disease, drug, imaging, fertility, pregnancy, or patient claim is promoted as source-backed here. */
export const OVARY_EDUCATION_NODES: readonly OvaryEducationNode[] = [
  { id: 'ovary-anatomy-context', label: 'Ovary anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, follicle count, vascular or neural course, anatomical variant, lesion location, procedure target, or patient-specific anatomy is asserted.' },
  { id: 'ovary-function-context', label: 'Ovary physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured ovarian reserve, follicular development, ovulation timing, hormone concentration, fertility, pregnancy status, menopausal state, or person-level reproductive function is inferred.' },
  { id: 'ovary-disorder-context', label: 'Ovary pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose cyst, torsion, polycystic ovary syndrome, endometriosis, infection, diminished ovarian reserve, infertility, malignancy, endocrine disorder, or any other ovarian condition.' },
  { id: 'ovary-drug-context', label: 'Ovary pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, ovulation induction, hormonal suppression, fertility treatment, oncology regimen, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'ovary-imaging-context', label: 'Ovary imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, Doppler, MRI, CT, segmentation, ovarian volume, follicle count, cyst or mass characterization, torsion finding, staging conclusion, procedure target, or patient-specific interpretation is represented.' },
] as const
export const OVARY_EDUCATION_EDGES: readonly OvaryEducationEdge[] = [
  { from: 'ovary-anatomy-context', to: 'ovary-function-context', relationship: 'educational-context', note: 'General ovarian orientation may anchor physiology education without implying source-backed follicular microanatomy, measured reserve, ovulation timing, hormone state, fertility, pregnancy, or patient-level physiology.' },
  { from: 'ovary-function-context', to: 'ovary-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, reserve estimate, fertility conclusion, pregnancy conclusion, prognosis, or patient-level inference.' },
  { from: 'ovary-disorder-context', to: 'ovary-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no cyst, mass, torsion finding, follicle count, staging conclusion, lesion location, procedure target, or patient-specific imaging interpretation is generated.' },
  { from: 'ovary-disorder-context', to: 'ovary-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting hormonal, fertility, antimicrobial, or oncology therapy, dose, monitoring, contraindication, or patient-specific action.' },
] as const
export function validateOvaryEducationGraph() {
  const ids = OVARY_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: OVARY_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: OVARY_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: OVARY_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
