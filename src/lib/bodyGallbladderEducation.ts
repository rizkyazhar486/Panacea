import type { BodySystemId } from './bodySystemSourceWave'

export type GallbladderNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'

export interface GallbladderEducationNode { id: string; label: string; kind: GallbladderNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface GallbladderEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }

export const GALLBLADDER_SYSTEM_ID: BodySystemId = 'digestive'

/** Gallbladder-specific educational relationships. No atlas or biomedical claim is promoted as source-backed here. */
export const GALLBLADDER_EDUCATION_NODES: readonly GallbladderEducationNode[] = [
  { id: 'gallbladder-anatomy-context', label: 'Gallbladder anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, wall thickness, duct branching, vascular anatomy, microscopic architecture, anatomical variant, lesion location, or patient-specific anatomy is asserted.' },
  { id: 'gallbladder-function-context', label: 'Gallbladder physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no pressure, volume, flow, contraction magnitude, bile composition, emptying fraction, sphincter state, meal response, or person-level biliary function is inferred.' },
  { id: 'gallbladder-disorder-context', label: 'Gallbladder pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose gallstones, inflammation, obstruction, infection, perforation, dysmotility, malignancy, congenital disease, trauma, or any other biliary disorder.' },
  { id: 'gallbladder-drug-context', label: 'Gallbladder pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, antimicrobial choice, analgesic choice, bile-acid therapy, dose, contraindication, interaction, monitoring plan, procedure decision, or treatment recommendation is provided.' },
  { id: 'gallbladder-imaging-context', label: 'Gallbladder imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, CT, MRI, MRCP, nuclear imaging, segmentation, wall measurement, duct caliber, stone, mass, inflammatory sign, procedure target, or patient-specific interpretation is represented.' },
] as const

export const GALLBLADDER_EDUCATION_EDGES: readonly GallbladderEducationEdge[] = [
  { from: 'gallbladder-anatomy-context', to: 'gallbladder-function-context', relationship: 'educational-context', note: 'General gallbladder orientation may anchor physiology education without implying source-backed microanatomy, pressure-volume behavior, duct flow, contractility, or measured biliary function.' },
  { from: 'gallbladder-function-context', to: 'gallbladder-disorder-context', relationship: 'supports', note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, disease probability, severity, obstruction state, or patient-state inference.' },
  { from: 'gallbladder-disorder-context', to: 'gallbladder-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no stone, wall thickening, duct dilation, inflammatory sign, mass, procedural target, or imaging finding is generated.' },
  { from: 'gallbladder-disorder-context', to: 'gallbladder-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting medication, antimicrobial therapy, analgesia, bile-acid therapy, dose, indication, monitoring, procedure, or patient-specific action.' },
] as const

export function validateGallbladderEducationGraph() {
  const ids = GALLBLADDER_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: GALLBLADDER_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    nonEducationalNodes: GALLBLADDER_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'),
    boundaryMissing: GALLBLADDER_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
