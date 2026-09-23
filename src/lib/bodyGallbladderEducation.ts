import type { BodySystemId } from './bodySystemSourceWave'

export type GallbladderNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export interface GallbladderEducationNode { id: string; label: string; kind: GallbladderNodeKind; evidenceState: 'educational-only'; boundary: string }
export interface GallbladderEducationEdge { from: string; to: string; relationship: 'supports' | 'educational-context'; note: string }
export const GALLBLADDER_SYSTEM_ID: BodySystemId = 'digestive'
/** Gallbladder-specific educational relationships; no anatomy, physiology, disease, drug, imaging, procedure, or patient claim is promoted as source-backed here. */
export const GALLBLADDER_EDUCATION_NODES: readonly GallbladderEducationNode[] = [
  { id: 'gallbladder-anatomy-context', label: 'Gallbladder anatomy context', kind: 'anatomy', evidenceState: 'educational-only', boundary: 'Educational anatomy placeholder only; no geometry, dimensions, wall microarchitecture, biliary branching, vascular or neural course, anatomical variant, lesion location, surgical plane, or patient-specific anatomy is asserted.' },
  { id: 'gallbladder-function-context', label: 'Gallbladder physiology context', kind: 'physiology', evidenceState: 'educational-only', boundary: 'Educational physiology placeholder only; no measured filling, emptying, bile composition, contractility, sphincter behavior, digestion performance, pressure, flow, or person-level function is inferred.' },
  { id: 'gallbladder-disorder-context', label: 'Gallbladder pathophysiology context', kind: 'pathophysiology', evidenceState: 'educational-only', boundary: 'Mechanism placeholder only; does not diagnose gallstones, cholecystitis, cholangitis, obstruction, dyskinesia, pancreatobiliary disease, malignancy, perforation, infection, or any other biliary condition.' },
  { id: 'gallbladder-drug-context', label: 'Gallbladder pharmacology context', kind: 'pharmacology', evidenceState: 'educational-only', boundary: 'Pharmacology placeholder only; no drug selection, dissolution therapy, antimicrobial therapy, analgesia, antiemetic therapy, dose, duration, contraindication, interaction, monitoring plan, or treatment recommendation is provided.' },
  { id: 'gallbladder-imaging-context', label: 'Gallbladder imaging context', kind: 'imaging', evidenceState: 'educational-only', boundary: 'Imaging placeholder only; no ultrasound, CT, MRI, MRCP, nuclear-medicine study, segmentation, stone, wall-thickening, duct-caliber, inflammatory finding, obstruction, staging conclusion, procedure target, or patient-specific interpretation is represented.' },
] as const
export const GALLBLADDER_EDUCATION_EDGES: readonly GallbladderEducationEdge[] = [
  { from: 'gallbladder-anatomy-context', to: 'gallbladder-function-context', relationship: 'educational-context', note: 'General gallbladder orientation may anchor physiology education without implying source-backed biliary geometry, measured storage or emptying, pressure, flow, contractility, or patient-level function.' },
  { from: 'gallbladder-function-context', to: 'gallbladder-disorder-context', relationship: 'supports', note: 'General storage and emptying concepts can contextualize mechanism education, but this relationship carries no diagnosis, obstruction probability, inflammation severity, prognosis, complication risk, or patient-level inference.' },
  { from: 'gallbladder-disorder-context', to: 'gallbladder-imaging-context', relationship: 'educational-context', note: 'Pathophysiology and imaging may be studied together only as bounded education; no stone, inflammatory finding, duct obstruction, mass, staging conclusion, lesion location, surgical plane, or procedural target is generated.' },
  { from: 'gallbladder-disorder-context', to: 'gallbladder-drug-context', relationship: 'educational-context', note: 'Disease-mechanism education may link to pharmacology education without selecting dissolution therapy, antimicrobials, analgesia, antiemetics, dose, monitoring, surgery, drainage, or patient-specific action.' },
] as const
export function validateGallbladderEducationGraph() {
  const ids = GALLBLADDER_EDUCATION_NODES.map((node) => node.id); const idSet = new Set(ids)
  return { duplicateIds: idSet.size !== ids.length, danglingEdges: GALLBLADDER_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)), nonEducationalNodes: GALLBLADDER_EDUCATION_NODES.filter((node) => node.evidenceState !== 'educational-only'), boundaryMissing: GALLBLADDER_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40) }
}
