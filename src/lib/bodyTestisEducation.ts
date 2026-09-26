import type { BodySystemId } from './bodySystemSourceWave'

export type TestisNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface TestisEducationNode { id: string; label: string; kind: TestisNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface TestisEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const TESTIS_SYSTEM_ID: BodySystemId = 'reproductive'
/** Organ-specific educational relationships; no biomedical claim is promoted as source-backed here. */
export const TESTIS_EDUCATION_NODES: readonly TestisEducationNode[] = [
  { id: 'testis-anatomy-context', label: 'Testis anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, vascular or neural course, microscopic architecture, anatomical variant, lesion location, procedure target, or patient-specific anatomy is asserted.' },
  { id: 'testis-function-context', label: 'Testis physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured hormone concentration, spermatogenesis, fertility state, endocrine function, temperature regulation, or person-level reproductive function is inferred.' },
  { id: 'testis-disorder-context', label: 'Testis pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose torsion, infection, varicocele, hydrocele, endocrine disorder, infertility, malignancy, trauma, or any other testicular condition.' },
  { id: 'testis-drug-context', label: 'Testis pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, hormone therapy, fertility treatment, antimicrobial or oncology regimen, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'testis-imaging-context', label: 'Testis imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, Doppler, MRI, CT, segmentation, volume, vascular-flow finding, lesion characterization, staging conclusion, procedure target, or patient-specific interpretation is represented.' },
] as const

export const TESTIS_EDUCATION_EDGES: readonly TestisEducationEdge[] = [
  { from: 'testis-anatomy-context', to: 'testis-function-context', relationship: 'educational-context', note: 'General organ orientation may anchor physiology education without implying source-backed microanatomy, hormone state, gamete production, fertility, or patient-level physiology.' },
  { from: 'testis-function-context', to: 'testis-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, fertility conclusion, prognosis, or patient-level inference.' },
  { from: 'testis-disorder-context', to: 'testis-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no vascular-flow finding, mass characterization, staging conclusion, lesion location, procedure target, or patient-specific interpretation is generated.' },
  { from: 'testis-disorder-context', to: 'testis-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting hormonal, fertility, antimicrobial, or oncology therapy, dose, monitoring, contraindication, or patient-specific action.' },
] as const

export function validateTestisEducationGraph() {
  const ids = TESTIS_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: TESTIS_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: TESTIS_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: TESTIS_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
