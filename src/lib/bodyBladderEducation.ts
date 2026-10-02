import type { BodySystemId } from './bodySystemSourceWave'

export type BladderNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface BladderEducationNode { id: string; label: string; kind: BladderNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface BladderEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const BLADDER_SYSTEM_ID: BodySystemId = 'urinary'

/** Bladder-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const BLADDER_EDUCATION_NODES: readonly BladderEducationNode[] = [
  { id: 'bladder-anatomy-context', label: 'Bladder anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, wall thickness, capacity, vascular or neural branching, microscopic architecture, lesion location, anatomical variant, or patient-specific anatomy is asserted.' },
  { id: 'bladder-function-context', label: 'Bladder physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no pressure, volume, compliance, flow, neural activity, contraction magnitude, residual volume, continence state, or person-level bladder function is inferred.' },
  { id: 'bladder-disorder-context', label: 'Bladder pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose infection, retention, incontinence, neurogenic dysfunction, obstruction, stone disease, malignancy, trauma, or any other bladder disorder.' },
  { id: 'bladder-drug-context', label: 'Bladder pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, antimicrobial choice, bladder-active medication, dose, contraindication, interaction, monitoring plan, catheter decision, or treatment recommendation is provided.' },
  { id: 'bladder-imaging-context', label: 'Bladder imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, CT, MRI, cystography, segmentation, wall measurement, residual volume, mass, stone, rupture, procedure target, or patient-specific interpretation is represented.' },
] as const

export const BLADDER_EDUCATION_EDGES: readonly BladderEducationEdge[] = [
  { from: 'bladder-anatomy-context', to: 'bladder-function-context', relationship: 'educational-context', note: 'General bladder orientation may anchor physiology education without implying source-backed microanatomy, pressure-volume behavior, neural control, continence, or measured urinary function.' },
  { from: 'bladder-function-context', to: 'bladder-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, urodynamic interpretation, disease probability, severity, or patient-state inference.' },
  { from: 'bladder-disorder-context', to: 'bladder-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no residual volume, wall measurement, mass, stone, rupture, procedural target, or imaging finding is generated.' },
  { from: 'bladder-disorder-context', to: 'bladder-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting medication, antimicrobial therapy, catheterization, dose, indication, monitoring, or patient-specific action.' },
] as const

export function validateBladderEducationGraph() {
  const ids = BLADDER_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: BLADDER_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: BLADDER_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: BLADDER_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
