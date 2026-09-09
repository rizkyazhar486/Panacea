export type BiologicalScale =
  | 'whole-body'
  | 'system'
  | 'organ'
  | 'tissue'
  | 'cell'
  | 'organelle'
  | 'molecule'
  | 'protein'
  | 'pathway'
  | 'gene'

export type MultiscaleRepresentation =
  | 'gross-geometry'
  | 'spatial-reference'
  | 'cellular-reference'
  | 'subcellular-reference'
  | 'molecular-structure'
  | 'conceptual-pathway'
  | 'sequence-reference'
  | 'not-represented'

export type MultiscaleReview =
  | { status: 'pending' }
  | {
      status: 'recorded'
      reviewer: string
      credentials: string
      reviewedAt: string
      scope: string
    }

export interface MultiscaleEvidenceRef {
  sourceId: string
  sourceVersion: string
  locator: string
  citation: string
}

export interface MultiscaleNode {
  id: string
  label: string
  scale: BiologicalScale
  representation: MultiscaleRepresentation
  evidence: MultiscaleEvidenceRef[]
  academicReview: MultiscaleReview
  /**
   * Multiscale reference nodes are population/reference biology by default.
   * Patient-specific content requires a separate measured-evidence contract and
   * is intentionally not accepted by this bridge.
   */
  patientSpecific: false
  /** Free text may search an existing node; it must never create localization. */
  inferredFromFreeText: false
  /** Optional existing Panacea destination. No renderer is instantiated here. */
  destination?: 'body3d' | 'cell-lab' | 'molecular-lab' | 'genomics-lab'
}

export interface MultiscaleEdge {
  from: string
  to: string
  relation:
    | 'contains'
    | 'has-cell-type'
    | 'has-compartment'
    | 'contains-molecule'
    | 'expresses-protein'
    | 'participates-in-pathway'
    | 'encoded-by-gene'
    | 'reference-link'
  evidence: MultiscaleEvidenceRef[]
  academicReview: MultiscaleReview
  inferredFromFreeText: false
}

export interface MultiscaleBridge {
  nodes: MultiscaleNode[]
  edges: MultiscaleEdge[]
}

export interface MultiscaleValidationResult {
  valid: boolean
  publicationReady: boolean
  reasons: string[]
}

const PLACEHOLDER_VERSION = /^(latest|main|master|head|current|versioned-record|registry-managed|unknown|tbd)$/i
const PLACEHOLDER_LOCATOR = /^(source-record|verified-source-record|repository-verified-source-record|placeholder|unknown|tbd)$/i
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/

const SCALE_ORDER: BiologicalScale[] = [
  'whole-body',
  'system',
  'organ',
  'tissue',
  'cell',
  'organelle',
  'molecule',
  'protein',
  'pathway',
  'gene',
]

const REPRESENTATION_BY_SCALE: Record<BiologicalScale, readonly MultiscaleRepresentation[]> = {
  'whole-body': ['gross-geometry', 'spatial-reference', 'not-represented'],
  system: ['gross-geometry', 'spatial-reference', 'not-represented'],
  organ: ['gross-geometry', 'spatial-reference', 'not-represented'],
  tissue: ['spatial-reference', 'cellular-reference', 'not-represented'],
  cell: ['cellular-reference', 'not-represented'],
  organelle: ['subcellular-reference', 'not-represented'],
  molecule: ['molecular-structure', 'not-represented'],
  protein: ['molecular-structure', 'not-represented'],
  pathway: ['conceptual-pathway', 'not-represented'],
  gene: ['sequence-reference', 'not-represented'],
}

function nonBlank(value: string) {
  return typeof value === 'string' && value.trim().length > 0
}

function realIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false
  const parsed = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value)
  return Number.isFinite(parsed)
}

function validateReview(review: MultiscaleReview, prefix: string, reasons: string[]) {
  if (review.status === 'pending') return
  if (!nonBlank(review.reviewer) || !nonBlank(review.credentials) || !nonBlank(review.scope)) {
    reasons.push(`${prefix} recorded academic review requires reviewer identity, credentials and scope.`)
  }
  if (!realIsoDate(review.reviewedAt)) {
    reasons.push(`${prefix} recorded academic review requires a real ISO review date.`)
  }
}

function validateEvidence(ref: MultiscaleEvidenceRef, prefix: string, reasons: string[]) {
  if (!nonBlank(ref.sourceId)) reasons.push(`${prefix} source identity is required.`)
  if (!nonBlank(ref.sourceVersion) || PLACEHOLDER_VERSION.test(ref.sourceVersion.trim())) {
    reasons.push(`${prefix} requires an immutable, non-placeholder source version.`)
  }
  if (!nonBlank(ref.locator) || PLACEHOLDER_LOCATOR.test(ref.locator.trim())) {
    reasons.push(`${prefix} requires a specific source locator.`)
  }
  if (!nonBlank(ref.citation)) reasons.push(`${prefix} citation is required.`)
}

function reviewRecorded(review: MultiscaleReview) {
  return review.status === 'recorded'
}

/**
 * Validates a cross-scale reference graph without claiming that a navigation
 * edge proves spatial colocalization. In particular, cellular/molecular/pathway
 * nodes can never self-promote to gross Body3D geometry.
 */
export function validateMultiscaleBridge(bridge: MultiscaleBridge): MultiscaleValidationResult {
  const reasons: string[] = []
  const ids = new Set<string>()
  const nodeById = new Map<string, MultiscaleNode>()

  for (const node of bridge.nodes) {
    if (!nonBlank(node.id) || !nonBlank(node.label)) reasons.push('Every multiscale node requires a stable id and label.')
    if (ids.has(node.id)) reasons.push(`Duplicate multiscale node id: ${node.id}.`)
    ids.add(node.id)
    nodeById.set(node.id, node)

    if (!REPRESENTATION_BY_SCALE[node.scale].includes(node.representation)) {
      reasons.push(`${node.id} cannot use ${node.representation} representation at ${node.scale} scale.`)
    }
    if (node.patientSpecific !== false) reasons.push(`${node.id} cannot be patient-specific in the reference bridge.`)
    if (node.inferredFromFreeText !== false) reasons.push(`${node.id} cannot derive localization from free text.`)
    if (node.representation !== 'not-represented' && node.evidence.length === 0) {
      reasons.push(`${node.id} requires provenance-bearing evidence before it can be represented.`)
    }
    node.evidence.forEach((ref, index) => validateEvidence(ref, `${node.id}.evidence[${index}]`, reasons))
    validateReview(node.academicReview, node.id, reasons)
  }

  for (const [index, edge] of bridge.edges.entries()) {
    const prefix = `edge[${index}] ${edge.from}->${edge.to}`
    const from = nodeById.get(edge.from)
    const to = nodeById.get(edge.to)
    if (!from || !to) {
      reasons.push(`${prefix} must resolve both endpoint ids.`)
      continue
    }
    if (edge.from === edge.to) reasons.push(`${prefix} cannot self-link.`)
    if (edge.inferredFromFreeText !== false) reasons.push(`${prefix} cannot be inferred from free text.`)
    if (edge.evidence.length === 0) reasons.push(`${prefix} requires its own provenance-bearing cross-scale evidence.`)
    edge.evidence.forEach((ref, evidenceIndex) => validateEvidence(ref, `${prefix}.evidence[${evidenceIndex}]`, reasons))
    validateReview(edge.academicReview, prefix, reasons)

    const fromRank = SCALE_ORDER.indexOf(from.scale)
    const toRank = SCALE_ORDER.indexOf(to.scale)
    if (fromRank === -1 || toRank === -1 || fromRank === toRank) {
      reasons.push(`${prefix} must cross biological scales rather than relabel the same scale.`)
    }
    if (Math.abs(toRank - fromRank) > 2 && edge.relation !== 'reference-link') {
      reasons.push(`${prefix} skips too many biological scales without an explicit reference-link.`)
    }
  }

  const uniqueReasons = [...new Set(reasons)]
  const publicationReady = uniqueReasons.length === 0
    && bridge.nodes.length > 0
    && bridge.edges.length > 0
    && bridge.nodes.every((node) => reviewRecorded(node.academicReview))
    && bridge.edges.every((edge) => reviewRecorded(edge.academicReview))

  return { valid: uniqueReasons.length === 0, publicationReady, reasons: uniqueReasons }
}

export function nextScale(scale: BiologicalScale): BiologicalScale | null {
  const index = SCALE_ORDER.indexOf(scale)
  return index >= 0 && index < SCALE_ORDER.length - 1 ? SCALE_ORDER[index + 1] : null
}

export function canRenderInGrossBody3D(node: MultiscaleNode) {
  return node.representation === 'gross-geometry' && ['whole-body', 'system', 'organ'].includes(node.scale)
}
