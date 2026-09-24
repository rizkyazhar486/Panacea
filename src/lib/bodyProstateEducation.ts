import type { BodySystemId } from './bodySystemSourceWave'

export type ProstateNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface ProstateEducationNode { id: string; label: string; kind: ProstateNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface ProstateEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const PROSTATE_SYSTEM_ID: BodySystemId = 'reproductive'
/** Prostate-specific educational relationships; no anatomy, physiology, disease, drug, imaging, fertility, sexual-function, or patient claim is promoted as source-backed here. */
export const PROSTATE_EDUCATION_NODES: readonly ProstateEducationNode[] = [
  { id: 'prostate-anatomy-context', label: 'Prostate anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, zonal boundaries, neurovascular course, urethral relationship, anatomical variant, lesion location, procedure target, or patient-specific anatomy is asserted.' },
  { id: 'prostate-function-context', label: 'Prostate physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured secretion, ejaculatory function, fertility, androgen activity, PSA production rate, urinary function, sexual function, or person-level reproductive function is inferred.' },
  { id: 'prostate-disorder-context', label: 'Prostate pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose benign prostatic hyperplasia, prostatitis, abscess, malignancy, urinary obstruction, retention, infertility, pelvic pain, metastatic disease, or any other prostatic condition.' },
  { id: 'prostate-drug-context', label: 'Prostate pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, alpha blockade, 5-alpha-reductase inhibition, antimicrobial therapy, hormonal therapy, oncology regimen, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'prostate-imaging-context', label: 'Prostate imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, MRI, CT, PET, segmentation, prostate volume, PI-RADS category, lesion, extracapsular extension, staging conclusion, biopsy target, procedure target, or patient-specific interpretation is represented.' },
] as const
export const PROSTATE_EDUCATION_EDGES: readonly ProstateEducationEdge[] = [
  { from: 'prostate-anatomy-context', to: 'prostate-function-context', relationship: 'educational-context', note: 'General prostatic orientation may anchor physiology education without implying source-backed zonal geometry, measured secretion, androgen activity, fertility, urinary function, sexual function, or patient-level physiology.' },
  { from: 'prostate-function-context', to: 'prostate-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, symptom attribution, obstruction severity, cancer probability, fertility conclusion, prognosis, or patient-level inference.' },
  { from: 'prostate-disorder-context', to: 'prostate-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no lesion, prostate volume, PI-RADS category, staging conclusion, biopsy target, procedure target, or patient-specific imaging interpretation is generated.' },
  { from: 'prostate-disorder-context', to: 'prostate-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting alpha blockers, 5-alpha-reductase inhibitors, antimicrobials, hormonal or oncology therapy, dose, monitoring, or patient-specific action.' },
] as const
export function validateProstateEducationGraph() {
  const ids = PROSTATE_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: PROSTATE_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: PROSTATE_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: PROSTATE_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
