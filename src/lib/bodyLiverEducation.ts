import type { BodySystemId } from './bodySystemSourceWave'

export type LiverNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type LiverEvidenceState = 'source-backed' | 'educational-only'

export interface LiverEducationNode {
  id: string
  label: string
  kind: LiverNodeKind
  evidenceState: LiverEvidenceState
  sourceId?: string
  boundary: string
}

export interface LiverEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'educational-context'
  note: string
}

export const LIVER_SYSTEM_ID: BodySystemId = 'digestive'

/**
 * Liver-specific Body Exposure education with deliberately narrow claims.
 * Gross orientation is the only atlas-backed state here. Physiology,
 * pathophysiology, pharmacology and imaging remain explicit educational
 * placeholders until claim-specific evidence and review are attached.
 */
export const LIVER_EDUCATION_NODES: readonly LiverEducationNode[] = [
  {
    id: 'liver-gross-reference',
    label: 'Liver gross reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    sourceId: 'visceral.glb',
    boundary: 'Reference atlas geometry only; not patient-specific anatomy and not evidence for segmental anatomy, microscopic lobules, biliary patency, vascular detail, lesion location, fibrosis, steatosis, or measured organ dimensions.',
  },
  {
    id: 'liver-function-context',
    label: 'Hepatic physiology context',
    kind: 'physiology',
    evidenceState: 'educational-only',
    boundary: 'Educational placeholder only; no synthetic function, metabolism, detoxification, bile production, portal flow, laboratory value, clearance, reserve, or person-level hepatic state is inferred.',
  },
  {
    id: 'liver-injury-context',
    label: 'Hepatic injury pathophysiology context',
    kind: 'pathophysiology',
    evidenceState: 'educational-only',
    boundary: 'Mechanism placeholder only; does not diagnose hepatitis, steatotic liver disease, fibrosis, cirrhosis, portal hypertension, cholestasis, vascular disease, malignancy, or any other hepatobiliary disorder.',
  },
  {
    id: 'liver-drug-context',
    label: 'Hepatic pharmacology context',
    kind: 'pharmacology',
    evidenceState: 'educational-only',
    boundary: 'Pharmacology placeholder only; no drug selection, hepatic dose adjustment, metabolism prediction, hepatotoxicity estimate, contraindication, interaction, monitoring plan, or treatment recommendation is provided.',
  },
  {
    id: 'liver-imaging-context',
    label: 'Hepatic imaging context',
    kind: 'imaging',
    evidenceState: 'educational-only',
    boundary: 'Imaging placeholder only; no ultrasound, CT, MRI, elastography, nuclear-medicine, segmentation, enhancement pattern, stiffness, fat fraction, mass, vascular finding, or patient-specific interpretation is represented.',
  },
] as const

export const LIVER_EDUCATION_EDGES: readonly LiverEducationEdge[] = [
  {
    from: 'liver-gross-reference',
    to: 'liver-function-context',
    relationship: 'educational-context',
    note: 'Gross hepatic orientation may anchor physiology education without implying that atlas geometry encodes microscopic architecture, perfusion, metabolism, or measured function.',
  },
  {
    from: 'liver-function-context',
    to: 'liver-injury-context',
    relationship: 'supports',
    note: 'General physiology concepts can contextualize mechanism education, but this relationship carries no diagnosis, severity, laboratory interpretation, or patient-state inference.',
  },
  {
    from: 'liver-injury-context',
    to: 'liver-imaging-context',
    relationship: 'educational-context',
    note: 'Pathophysiology and imaging may be studied together only as bounded education; no imaging finding or lesion location is generated from a mechanism node.',
  },
  {
    from: 'liver-injury-context',
    to: 'liver-drug-context',
    relationship: 'educational-context',
    note: 'Disease-mechanism education may link to pharmacology education without selecting therapy, dose, indication, monitoring, or patient-specific action.',
  },
] as const

export function validateLiverEducationGraph() {
  const ids = LIVER_EDUCATION_NODES.map((node) => node.id)
  const idSet = new Set(ids)
  return {
    duplicateIds: idSet.size !== ids.length,
    danglingEdges: LIVER_EDUCATION_EDGES.filter((edge) => !idSet.has(edge.from) || !idSet.has(edge.to)),
    sourceBackedWithoutSource: LIVER_EDUCATION_NODES.filter((node) => node.evidenceState === 'source-backed' && !node.sourceId),
    educationalWithSourceClaim: LIVER_EDUCATION_NODES.filter((node) => node.evidenceState === 'educational-only' && node.sourceId),
    boundaryMissing: LIVER_EDUCATION_NODES.filter((node) => node.boundary.trim().length < 40),
  }
}
