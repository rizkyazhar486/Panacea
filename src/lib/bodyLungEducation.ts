import type { BodySystemId } from './bodySystemSourceWave'

export type LungNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface LungEducationNode { id: string; label: string; kind: LungNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface LungEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const LUNG_SYSTEM_ID: BodySystemId = 'respiratory'

/** Lung-specific educational relationships. No atlas, imaging, or biomedical claim is promoted as source-backed here. */
export const LUNG_EDUCATION_NODES: readonly LungEducationNode[] = [
  { id: 'lung-anatomy-context', label: 'Lung anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, airway branching, lobar or segmental coordinates, vascular anatomy, pleural detail, microscopic architecture, lesion location, or patient-specific anatomy is asserted.' },
  { id: 'lung-function-context', label: 'Lung physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no gas exchange, ventilation, perfusion, compliance, resistance, diffusion capacity, pressure, volume, blood gas, spirometry, or person-level respiratory function is inferred.' },
  { id: 'lung-disorder-context', label: 'Lung pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose infection, asthma, COPD, edema, embolism, pneumothorax, interstitial disease, malignancy, respiratory failure, or any other pulmonary disorder.' },
  { id: 'lung-drug-context', label: 'Lung pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, inhaler choice, antimicrobial choice, corticosteroid choice, anticoagulation, dose, contraindication, interaction, monitoring plan, oxygen target, ventilation setting, or treatment recommendation is provided.' },
  { id: 'lung-imaging-context', label: 'Lung imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no chest radiograph, CT, MRI, ultrasound, nuclear imaging, segmentation, opacity, nodule, effusion, pneumothorax, embolus, mass, procedure target, or patient-specific interpretation is represented.' },
] as const

export const LUNG_EDUCATION_EDGES: readonly LungEducationEdge[] = [
  { from: 'lung-anatomy-context', to: 'lung-function-context', relationship: 'educational-context', note: 'General pulmonary orientation may anchor physiology education without implying source-backed microscopic continuity, measured ventilation-perfusion matching, airway mechanics, diffusion, or respiratory reserve.' },
  { from: 'lung-function-context', to: 'lung-disorder-context', relationship: 'supports', note: 'General respiratory physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, severity, gas-exchange impairment, or patient-state inference.' },
  { from: 'lung-disorder-context', to: 'lung-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and thoracic imaging may be studied together only as bounded education; no opacity, nodule, embolus, effusion, pneumothorax, mass, procedural target, or imaging finding is generated.' },
  { from: 'lung-disorder-context', to: 'lung-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting bronchodilator, antimicrobial, anti-inflammatory, anticoagulant, oxygen, ventilation strategy, dose, indication, monitoring, or patient-specific action.' },
] as const

export function validateLungEducationGraph() {
  const ids = LUNG_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: LUNG_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: LUNG_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: LUNG_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
