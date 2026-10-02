import type { BodySystemId } from './bodySystemSourceWave'

export type IntegumentaryNodeKind = 'anatomy' | 'physiology' | 'pathophysiology' | 'pharmacology' | 'imaging'
export type IntegumentaryEvidenceState = 'source-backed' | 'literature-backed' | 'educational-only'

export interface IntegumentaryEvidence {
  kind: 'atlas-source' | 'pubmed'
  id: string
  url?: string
  note: string
}

export interface IntegumentaryEducationNode {
  id: string
  label: string
  kind: IntegumentaryNodeKind
  evidenceState: IntegumentaryEvidenceState
  evidence: readonly IntegumentaryEvidence[]
  boundary: string
}

export interface IntegumentaryEducationEdge {
  from: string
  to: string
  relationship: 'contains' | 'supports' | 'disruption-associated-with' | 'educational-context'
  note: string
}

export const INTEGUMENTARY_SYSTEM_ID: BodySystemId = 'integumentary-surface'

/**
 * Bounded educational graph for the integumentary Body Exposure lane.
 *
 * The shipped surface.glb bundle anchors gross surface orientation only. It is
 * deliberately NOT treated as microscopic epidermal/dermal geometry. Literature
 * nodes describe relationships, not patient-specific findings or treatment advice.
 */
export const INTEGUMENTARY_EDUCATION_NODES: readonly IntegumentaryEducationNode[] = [
  {
    id: 'surface-reference',
    label: 'Whole-body surface reference',
    kind: 'anatomy',
    evidenceState: 'source-backed',
    evidence: [{ kind: 'atlas-source', id: 'surface.glb', note: 'Repository source bundle used for superficial whole-body orientation.' }],
    boundary: 'Reference atlas geometry; not patient-specific anatomy and not microscopic skin-layer geometry.',
  },
  {
    id: 'stratum-corneum-barrier',
    label: 'Stratum corneum barrier',
    kind: 'physiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '38140732', url: 'https://pubmed.ncbi.nlm.nih.gov/38140732/', note: '2024 narrative review: stratum corneum is the principal permeability/protective epidermal barrier.' },
      { kind: 'pubmed', id: '19043850', url: 'https://pubmed.ncbi.nlm.nih.gov/19043850/', note: 'Review of physical skin-barrier structure and regulation.' },
    ],
    boundary: 'Educational physiology relationship; no person-level permeability, hydration, or barrier score is inferred.',
  },
  {
    id: 'barrier-disruption',
    label: 'Barrier disruption',
    kind: 'pathophysiology',
    evidenceState: 'literature-backed',
    evidence: [
      { kind: 'pubmed', id: '37717558', url: 'https://pubmed.ncbi.nlm.nih.gov/37717558/', note: 'Review of physical, chemical, microbiologic, and immunologic skin-barrier disruption and repair.' },
      { kind: 'pubmed', id: '19043850', url: 'https://pubmed.ncbi.nlm.nih.gov/19043850/', note: 'Review linking disturbed epidermal differentiation/barrier composition with inflammatory dermatoses.' },
    ],
    boundary: 'Mechanism education only; does not diagnose dermatitis, infection, allergy, psoriasis, ichthyosis, or another dermatosis.',
  },
  {
    id: 'moisturizer-mechanisms',
    label: 'Moisturizer mechanism context',
    kind: 'pharmacology',
    evidenceState: 'literature-backed',
    evidence: [{ kind: 'pubmed', id: '37717558', url: 'https://pubmed.ncbi.nlm.nih.gov/37717558/', note: 'Review describes occlusive, humectant, and emollient mechanisms in barrier support.' }],
    boundary: 'Mechanism education only; no product selection, dosing, treatment recommendation, or comparative efficacy claim.',
  },
  {
    id: 'surface-imaging-context',
    label: 'Surface imaging context',
    kind: 'imaging',
    evidenceState: 'educational-only',
    evidence: [],
    boundary: 'Placeholder relationship only: no dermoscopy, ultrasound, pathology, or lesion interpretation is represented until modality-specific evidence and reviewed assets are added.',
  },
] as const

export const INTEGUMENTARY_EDUCATION_EDGES: readonly IntegumentaryEducationEdge[] = [
  {
    from: 'surface-reference',
    to: 'stratum-corneum-barrier',
    relationship: 'educational-context',
    note: 'Gross surface orientation can lead into barrier physiology, but no spatial microscopic correspondence is implied.',
  },
  {
    from: 'stratum-corneum-barrier',
    to: 'barrier-disruption',
    relationship: 'disruption-associated-with',
    note: 'Barrier dysfunction is presented as a mechanism relationship rather than a diagnostic inference.',
  },
  {
    from: 'barrier-disruption',
    to: 'moisturizer-mechanisms',
    relationship: 'educational-context',
    note: 'Mechanism context is linked for education without prescribing a product or regimen.',
  },
  {
    from: 'surface-reference',
    to: 'surface-imaging-context',
    relationship: 'educational-context',
    note: 'Imaging remains explicitly unavailable until modality-specific provenance is present.',
  },
] as const

export function validateIntegumentaryEducationGraph() {
  const ids = new Set(INTEGUMENTARY_EDUCATION_NODES.map((node) => node.id))
  const duplicateIds = ids.size !== INTEGUMENTARY_EDUCATION_NODES.length
  const danglingEdges = INTEGUMENTARY_EDUCATION_EDGES.filter((edge) => !ids.has(edge.from) || !ids.has(edge.to))
  const unsupportedLiteratureNodes = INTEGUMENTARY_EDUCATION_NODES.filter(
    (node) => node.evidenceState === 'literature-backed' && !node.evidence.some((item) => item.kind === 'pubmed'),
  )
  const patientSpecificBoundaryMissing = INTEGUMENTARY_EDUCATION_NODES.filter((node) => !node.boundary.trim())
  return { duplicateIds, danglingEdges, unsupportedLiteratureNodes, patientSpecificBoundaryMissing }
}
