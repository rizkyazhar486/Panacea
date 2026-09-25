import type { BodySystemId } from './bodySystemSourceWave'

export type TestisNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface TestisEducationNode { id: string; label: string; kind: TestisNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface TestisEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const TESTIS_SYSTEM_ID: BodySystemId = 'reproductive'

export const TESTIS_EDUCATION_NODES: readonly TestisEducationNode[] = [
  { id: 'testis-anatomy-context', label: 'Testis anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, structural relationships, microscopic architecture, lesion location, variant, procedural target, or patient-specific anatomy is asserted.' },
  { id: 'testis-physiology-context', label: 'Testis physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured hormone state, reproductive parameter, production rate, reserve, fertility potential, developmental state, or person-level reproductive function is inferred.' },
  { id: 'testis-pathophysiology-context', label: 'Testis pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; no disorder, lesion class, fertility cause, probability, severity, viability, laboratory interpretation, or patient diagnosis is represented.' },
  { id: 'testis-pharmacology-context', label: 'Testis pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, dose, route, contraindication, interaction, monitoring plan, procedure choice, or patient-specific treatment action is provided.' },
  { id: 'testis-imaging-context', label: 'Testis imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound or Doppler finding, perfusion inference, segmentation, lesion characterization, measurement, viability assessment, procedural target, or patient-specific interpretation is represented.' },
] as const

export const TESTIS_EDUCATION_EDGES: readonly TestisEducationEdge[] = [
  { from: 'testis-anatomy-context', to: 'testis-physiology-context', relationship: 'educational-context', note: 'General organ orientation may anchor later source-reviewed physiology education without asserting geometry, microanatomy, fertility state, endocrine state, or patient-specific function.' },
  { from: 'testis-physiology-context', to: 'testis-pathophysiology-context', relationship: 'supports', note: 'Physiology and mechanism topics may be linked for education only; the relationship carries no diagnosis, fertility inference, laboratory interpretation, probability, severity, or viability inference.' },
  { from: 'testis-pathophysiology-context', to: 'testis-imaging-context', relationship: 'educational-context', note: 'Mechanism and imaging topics remain a bounded educational relationship; no perfusion state, lesion, measurement, viability assessment, procedural target, or patient imaging finding is generated.' },
  { from: 'testis-pathophysiology-context', to: 'testis-pharmacology-context', relationship: 'educational-context', note: 'Mechanism education may link to future evidence-reviewed pharmacology without selecting a medicine, dose, monitoring plan, or treatment action.' },
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
