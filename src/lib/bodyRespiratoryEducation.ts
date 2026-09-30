import type { BodySystemId } from './bodySystemSourceWave'

export type RespiratoryNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type RespiratoryEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'

export interface RespiratoryEvidence {
  kind: 'atlas-source' | 'pubmed'
  id: string
  url?: string
  note: string
}

export interface RespiratoryEducationNode {
  id: string
  label: string
  kind: RespiratoryNodeKind
  evidenceState: RespiratoryEvidenceState
  evidence: readonly RespiratoryEvidence[]
  boundary: string
}

export interface RespiratoryEducationEdge {
  from: string
  to: string
  relationship: 'contains' | 'supports' | 'disruption-associated-with' | 'educational-context'
  note: string
}

export const RESPIRATORY_SYSTEM_ID: BodySystemId = 'respiratory'

/**
 * Organ/system-specific respiratory education relationships for Body Exposure.
 * Gross source bundles anchor orientation only; literature nodes add bounded
 * educational relationships without pretending microscopic spatial continuity.
 */
export const RESPIRATORY_EDUCATION_NODES: readonly RespiratoryEducationNode[] = [
  {
    id: 'respiratory-gross-reference',
    label: 'Airway, lungs, and diaphragm reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    evidence: [
      { kind: 'atlas-source', id: 'visceral.glb', note: 'Repository source bundle used for trachea, bronchi, and lung orientation.' },
      { kind: 'atlas-source', id: 'muscular.glb', note: 'Repository source bundle used for diaphragm orientation.' },
    ],
    boundary: 'Reference atlas geometry; not patient-specific anatomy and not alveolar microgeometry, histology, or measured lung volume.',
  },
  {
    id: 'ventilation-gas-exchange',
    label: 'Ventilation and pulmonary gas exchange',
    kind: 'physiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '37816345', url: 'https://pubmed.ncbi.nlm.nih.gov/37816345/', note: 'Review of tidal ventilation, alveolar gas exchange, V/Q relationships, shunt, dead space, and diffusion limitation.' },
      { kind: 'pubmed', id: '37467769', url: 'https://pubmed.ncbi.nlm.nih.gov/37467769/', note: 'Review of respiratory mechanics, airway resistance, compliance, pressures, and respiratory-muscle work.' },
    ],
    boundary: 'Educational physiology only; no person-level ventilation, compliance, resistance, blood gas, oxygenation, or respiratory-work value is inferred.',
  },
  {
    id: 'vq-mismatch',
    label: 'Ventilation-perfusion mismatch',
    kind: 'pathophysiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '25063240', url: 'https://pubmed.ncbi.nlm.nih.gov/25063240/', note: 'Review relates low V/Q and shunt to hypoxaemia and high V/Q to alveolar dead space and wasted ventilation.' },
      { kind: 'pubmed', id: '37816345', url: 'https://pubmed.ncbi.nlm.nih.gov/37816345/', note: 'Review describes mechanisms by which V/Q mismatch alters oxygenation and carbon-dioxide elimination efficiency.' },
    ],
    boundary: 'Mechanism education only; does not diagnose respiratory failure, asthma, COPD, pneumonia, embolism, shunt, hypoxaemia, or another pulmonary disorder.',
  },
  {
    id: 'beta2-bronchodilation',
    label: 'β2-adrenoceptor bronchodilation context',
    kind: 'pharmacology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '27713285', url: 'https://pubmed.ncbi.nlm.nih.gov/27713285/', note: 'Review of β2-adrenoceptor signaling and control of airway smooth-muscle tone.' },
      { kind: 'pubmed', id: '28950943', url: 'https://pubmed.ncbi.nlm.nih.gov/28950943/', note: 'Review of β2-adrenoceptor function, bronchodilation, and mechanisms that can blunt response in asthma.' },
    ],
    boundary: 'Mechanism education only; no drug selection, dose, regimen, comparative efficacy, contraindication decision, or patient-specific treatment is produced.',
  },
  {
    id: 'respiratory-imaging-context',
    label: 'Respiratory imaging context',
    kind: 'imaging',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Placeholder relationship only: no radiograph, CT, ultrasound, bronchoscopy, or lesion interpretation is represented until modality-specific evidence and reviewed assets are added.',
  },
] as const

export const RESPIRATORY_EDUCATION_EDGES: readonly RespiratoryEducationEdge[] = [
  {
    from: 'respiratory-gross-reference',
    to: 'ventilation-gas-exchange',
    relationship: 'educational-context',
    note: 'Gross airway, lung, and diaphragm orientation leads into physiology without implying source-backed alveolar spatial correspondence.',
  },
  {
    from: 'ventilation-gas-exchange',
    to: 'vq-mismatch',
    relationship: 'disruption-associated-with',
    note: 'V/Q mismatch is presented as a bounded gas-exchange mechanism relationship rather than a diagnosis or severity inference.',
  },
  {
    from: 'respiratory-gross-reference',
    to: 'beta2-bronchodilation',
    relationship: 'educational-context',
    note: 'Airway orientation links to smooth-muscle pharmacology context without implying a prescription or individual bronchodilator response.',
  },
  {
    from: 'respiratory-gross-reference',
    to: 'respiratory-imaging-context',
    relationship: 'educational-context',
    note: 'Imaging remains explicitly unavailable until modality-specific source provenance and reviewed assets are present.',
  },
] as const

export function validateRespiratoryEducationGraph() {
  const ids = new Set(RESPIRATORY_EDUCATION_NODES.map((node) => node.id))
  const duplicateIds = ids.size !== RESPIRATORY_EDUCATION_NODES.length
  const danglingEdges = RESPIRATORY_EDUCATION_EDGES.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to))
  const unsupportedLiteratureNodes = RESPIRATORY_EDUCATION_NODES.filter(
    (node) => node.evidenceState === 'literature-backed' && !node.evidence.some((item) => item.kind === 'pubmed'),
  )
  const boundaryMissing = RESPIRATORY_EDUCATION_NODES.filter((node) => !node.boundary.trim())
  return { duplicateIds, danglingEdges, unsupportedLiteratureNodes, boundaryMissing }
}
