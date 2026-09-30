import type { BodySystemId } from './bodySystemSourceWave'

export type AdrenalNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type AdrenalEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'

export interface AdrenalEvidence {
  kind: 'atlas-source' | 'pubmed'
  id: string
  url?: string
  note: string
}

export interface AdrenalEducationNode {
  id: string
  label: string
  kind: AdrenalNodeKind
  evidenceState: AdrenalEvidenceState
  evidence: readonly AdrenalEvidence[]
  boundary: string
}

export interface AdrenalEducationEdge {
  from: string
  to: string
  relationship: 'supports' | 'disruption-associated-with' | 'educational-context'
  note: string
}

export const ADRENAL_SYSTEM_ID: BodySystemId = 'endocrine'

/**
 * Organ-specific adrenal education for Body Exposure.
 * This module deliberately separates atlas-backed gross orientation from literature-backed
 * physiology and from unavailable imaging/treatment detail. It is educational only and
 * must never be interpreted as patient anatomy, diagnosis, laboratory interpretation,
 * treatment selection, or proof that a source asset contains microscopic structures.
 */
export const ADRENAL_EDUCATION_NODES: readonly AdrenalEducationNode[] = [
  {
    id: 'adrenal-gross-reference',
    label: 'Adrenal gross reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    evidence: [
      {
        kind: 'atlas-source',
        id: 'visceral.glb',
        note: 'Repository source bundle used only for gross adrenal orientation.',
      },
    ],
    boundary: 'Reference atlas geometry only; not patient-specific anatomy and not evidence for cortical zonation, medullary microarchitecture, vascular detail, receptor distribution, or measured gland volume.',
  },
  {
    id: 'adrenal-hpa-feedback',
    label: 'Hypothalamic-pituitary-adrenal feedback context',
    kind: 'physiology',
    evidenceState: 'literature-backed',
    evidence: [
      {
        kind: 'pubmed',
        id: '29764284',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29764284/',
        note: 'Review describes glucocorticoid negative feedback and rhythmic regulation of the hypothalamic-pituitary-adrenal axis.',
      },
    ],
    boundary: 'Educational physiology only; no person-level cortisol concentration, ACTH concentration, circadian phase, stress response, feedback gain, stimulation-test result, or adrenal reserve is inferred.',
  },
  {
    id: 'adrenal-feedback-disruption',
    label: 'Adrenal feedback disruption context',
    kind: 'pathophysiology',
    evidenceState: 'literature-backed',
    evidence: [
      {
        kind: 'pubmed',
        id: '29764284',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29764284/',
        note: 'Review discusses altered glucocorticoid rhythmicity and feedback mechanisms in HPA-axis biology.',
      },
    ],
    boundary: 'Mechanism education only; does not diagnose adrenal insufficiency, hypercortisolism, pituitary disease, stress-related disease, or any other endocrine disorder.',
  },
  {
    id: 'adrenal-pharmacology-context',
    label: 'Adrenal pharmacology context',
    kind: 'pharmacology',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Placeholder only: no drug class, indication, dose, route, contraindication, interaction, taper, biochemical target, monitoring plan, or patient-specific treatment is represented until claim-specific evidence and review are added.',
  },
  {
    id: 'adrenal-imaging-context',
    label: 'Adrenal imaging context',
    kind: 'imaging',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Placeholder only: no CT, MRI, PET, scintigraphy, lesion characterization, attenuation, washout, signal behavior, size threshold, or malignancy inference is represented until modality-specific evidence and reviewed assets are added.',
  },
] as const

export const ADRENAL_EDUCATION_EDGES: readonly AdrenalEducationEdge[] = [
  {
    from: 'adrenal-gross-reference',
    to: 'adrenal-hpa-feedback',
    relationship: 'educational-context',
    note: 'Gross adrenal orientation links to HPA-axis physiology without implying atlas geometry for hypothalamic, pituitary, cellular, or molecular components.',
  },
  {
    from: 'adrenal-hpa-feedback',
    to: 'adrenal-feedback-disruption',
    relationship: 'disruption-associated-with',
    note: 'Feedback disruption is presented as a bounded mechanism relationship rather than a diagnosis, laboratory interpretation, or severity inference.',
  },
  {
    from: 'adrenal-hpa-feedback',
    to: 'adrenal-pharmacology-context',
    relationship: 'educational-context',
    note: 'Pharmacology remains unavailable until claim-specific evidence and review are present; this edge does not imply a treatment recommendation.',
  },
  {
    from: 'adrenal-gross-reference',
    to: 'adrenal-imaging-context',
    relationship: 'educational-context',
    note: 'Imaging remains unavailable until modality-specific provenance, evidence, and reviewed assets are present.',
  },
] as const

export function validateAdrenalEducationGraph() {
  const ids = new Set(ADRENAL_EDUCATION_NODES.map((node) => node.id))
  const duplicateIds = ids.size !== ADRENAL_EDUCATION_NODES.length
  const danglingEdges = ADRENAL_EDUCATION_EDGES.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to))
  const unsupportedLiteratureNodes = ADRENAL_EDUCATION_NODES.filter(
    (node) => node.evidenceState === 'literature-backed' && !node.evidence.some((item) => item.kind === 'pubmed'),
  )
  const unsupportedSourceNodes = ADRENAL_EDUCATION_NODES.filter(
    (node) => node.evidenceState === 'source-backed' && !node.evidence.some((item) => item.kind === 'atlas-source'),
  )
  const boundaryMissing = ADRENAL_EDUCATION_NODES.filter((node) => !node.boundary.trim())
  return { duplicateIds, danglingEdges, unsupportedLiteratureNodes, unsupportedSourceNodes, boundaryMissing }
}
