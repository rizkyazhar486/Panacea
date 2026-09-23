import type { BodySystemId } from './bodySystemSourceWave'

export type UterusNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface UterusEducationNode { id: string; label: string; kind: UterusNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface UterusEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const UTERUS_SYSTEM_ID: BodySystemId = 'reproductive'
/** Uterus-specific educational relationships; no anatomy, physiology, disease, drug, imaging, pregnancy, fertility, or patient claim is promoted as source-backed here. */
export const UTERUS_EDUCATION_NODES: readonly UterusEducationNode[] = [
  { id: 'uterus-anatomy-context', label: 'Uterus anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, orientation, wall-layer microarchitecture, vascular or neural course, anatomical variant, pregnancy state, lesion location, or patient-specific anatomy is asserted.' },
  { id: 'uterus-function-context', label: 'Uterus physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no cycle timing, endometrial phase, contractility, implantation state, fertility, pregnancy status, labor activity, measured reserve, or person-level reproductive function is inferred.' },
  { id: 'uterus-disorder-context', label: 'Uterus pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose fibroids, adenomyosis, endometriosis, infection, bleeding disorder, congenital anomaly, infertility, pregnancy complication, malignancy, prolapse, or any other uterine condition.' },
  { id: 'uterus-drug-context', label: 'Uterus pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, hormonal therapy, uterotonic or tocolytic therapy, antimicrobial therapy, oncology regimen, fertility treatment, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'uterus-imaging-context', label: 'Uterus imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, MRI, CT, hysteroscopy, sonohysterography, segmentation, endometrial thickness, mass, gestational finding, bleeding source, staging conclusion, procedure target, or patient-specific interpretation is represented.' },
] as const
export const UTERUS_EDUCATION_EDGES: readonly UterusEducationEdge[] = [
  { from: 'uterus-anatomy-context', to: 'uterus-function-context', relationship: 'educational-context', note: 'General uterine orientation may anchor physiology education without implying source-backed wall microanatomy, cycle phase, contractility, implantation state, pregnancy state, fertility, or measured function.' },
  { from: 'uterus-function-context', to: 'uterus-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, bleeding severity, fertility conclusion, pregnancy conclusion, prognosis, or patient-level inference.' },
  { from: 'uterus-disorder-context', to: 'uterus-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no mass, endometrial abnormality, congenital anomaly, gestational finding, bleeding source, staging conclusion, lesion location, or procedural target is generated.' },
  { from: 'uterus-disorder-context', to: 'uterus-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting hormonal, uterotonic, tocolytic, antimicrobial, fertility, or oncology treatment, dose, monitoring, or patient-specific action.' },
] as const
export function validateUterusEducationGraph() {
  const ids = UTERUS_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: UTERUS_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: UTERUS_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: UTERUS_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
