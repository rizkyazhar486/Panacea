export const BIOLOGICAL_SCALE_ORDER = [
  'person',
  'region',
  'system',
  'organ',
  'substructure',
  'tissue',
  'microarchitecture',
  'niche',
  'cell',
  'cell-state',
  'membrane-organelle',
  'molecular-complex',
  'protein',
  'post-translational',
  'pathway',
  'metabolite-ion',
  'rna',
  'gene-regulatory',
  'chromatin',
  'dna',
] as const

export type BiologicalScale = (typeof BIOLOGICAL_SCALE_ORDER)[number]

export type VerticalTruthScope =
  | 'reference'
  | 'population-reference'
  | 'patient-specific'
  | 'model-derived'
  | 'simulated'
  | 'unknown'

export type VerticalNodeStatus = 'implemented' | 'gap' | 'not-applicable'

export type VerticalEvidenceRole =
  | 'structure'
  | 'mechanism'
  | 'expression'
  | 'genomic'
  | 'visual'
  | 'patient-measurement'
  | 'model'
  | 'other'

export interface VerticalEvidenceRef {
  sourceId: string
  role: VerticalEvidenceRole
  version?: string
}

export type VerticalRepresentationKind =
  | '3d-reference'
  | 'histology'
  | 'cellular'
  | 'organelle'
  | 'molecular-structure'
  | 'pathway'
  | 'genomic'
  | 'simulation-overlay'

export interface VerticalBiologicalNode {
  id: string
  label: string
  scale: BiologicalScale
  status: 'implemented'
  truthScope: VerticalTruthScope
  evidence: readonly VerticalEvidenceRef[]
  domain?: string
  representation?: {
    kind: VerticalRepresentationKind
    sourceId: string
  }
}

export interface VerticalBiologicalRelation {
  from: string
  to: string
  kind:
    | 'contains'
    | 'part-of'
    | 'mechanistic'
    | 'encoded-by'
    | 'transcribed-from'
    | 'located-in'
    | 'expresses'
    | 'regulates'
    | 'couples'
}

export interface VerticalLineageStep {
  scale: BiologicalScale
  status: VerticalNodeStatus
  nodeId?: string
  reason?: string
}

export interface VerticalLineage {
  id: string
  label: string
  steps: readonly VerticalLineageStep[]
}

export interface VerticalBiologicalGraph {
  id: string
  rootNodeId: string
  requiredScalePath: readonly BiologicalScale[]
  nodes: readonly VerticalBiologicalNode[]
  relations: readonly VerticalBiologicalRelation[]
  lineages: readonly VerticalLineage[]
}

const scaleRank = new Map<BiologicalScale, number>(
  BIOLOGICAL_SCALE_ORDER.map((scale, index) => [scale, index]),
)

const molecularOrGenomicScales = new Set<BiologicalScale>([
  'molecular-complex',
  'protein',
  'post-translational',
  'pathway',
  'metabolite-ion',
  'rna',
  'gene-regulatory',
  'chromatin',
  'dna',
])

function nonEmpty(value: string): boolean {
  return value.trim().length > 0
}

function validateRequiredScalePath(path: readonly BiologicalScale[]): string[] {
  const errors: string[] = []
  const seen = new Set<BiologicalScale>()
  let previousRank = -1

  for (const scale of path) {
    const rank = scaleRank.get(scale)
    if (rank === undefined) {
      errors.push(`unknown required biological scale ${String(scale)}`)
      continue
    }
    if (seen.has(scale)) errors.push(`duplicate required scale ${scale}`)
    seen.add(scale)
    if (rank <= previousRank) errors.push(`required scale path is not strictly ordered at ${scale}`)
    previousRank = rank
  }
  return errors
}

export function validateVerticalBiologicalGraph(graph: VerticalBiologicalGraph): string[] {
  const errors: string[] = []

  if (!nonEmpty(graph.id)) errors.push('graph id must not be empty')
  if (!nonEmpty(graph.rootNodeId)) errors.push('rootNodeId must not be empty')
  if (!graph.requiredScalePath.length) errors.push('requiredScalePath must not be empty')
  errors.push(...validateRequiredScalePath(graph.requiredScalePath))

  const nodesById = new Map<string, VerticalBiologicalNode>()
  for (const node of graph.nodes) {
    if (!nonEmpty(node.id)) {
      errors.push('node id must not be empty')
      continue
    }
    if (nodesById.has(node.id)) errors.push(`duplicate node id ${node.id}`)
    else nodesById.set(node.id, node)

    if (!nonEmpty(node.label)) errors.push(`node ${node.id} label must not be empty`)
    if (!node.evidence.length) errors.push(`implemented node ${node.id} requires evidence`)
    for (const evidence of node.evidence) {
      if (!nonEmpty(evidence.sourceId)) errors.push(`node ${node.id} evidence sourceId must not be empty`)
    }

    if (node.representation && !nonEmpty(node.representation.sourceId)) {
      errors.push(`node ${node.id} representation sourceId must not be empty`)
    }

    if (
      node.truthScope === 'patient-specific'
      && molecularOrGenomicScales.has(node.scale)
      && !node.evidence.some((evidence) => evidence.role === 'patient-measurement')
    ) {
      errors.push(`reference-only molecular/genomic node ${node.id} cannot be patient-specific without patient-measurement evidence`)
    }
  }

  if (!nodesById.has(graph.rootNodeId)) errors.push(`root node ${graph.rootNodeId} does not exist`)

  for (const relation of graph.relations) {
    if (!nodesById.has(relation.from) || !nodesById.has(relation.to)) {
      errors.push(`relation references missing node: ${relation.from} -> ${relation.to}`)
    }
  }

  const lineageIds = new Set<string>()
  for (const lineage of graph.lineages) {
    if (!nonEmpty(lineage.id)) errors.push('lineage id must not be empty')
    if (lineageIds.has(lineage.id)) errors.push(`duplicate lineage id ${lineage.id}`)
    lineageIds.add(lineage.id)

    const stepByScale = new Map<BiologicalScale, VerticalLineageStep>()
    let previousRank = -1

    for (const step of lineage.steps) {
      const rank = scaleRank.get(step.scale)
      if (rank === undefined) {
        errors.push(`lineage ${lineage.id} contains unknown scale ${String(step.scale)}`)
        continue
      }
      if (rank <= previousRank) errors.push(`lineage ${lineage.id} scale order is invalid at ${step.scale}`)
      previousRank = rank

      if (stepByScale.has(step.scale)) errors.push(`lineage ${lineage.id} repeats scale ${step.scale}`)
      stepByScale.set(step.scale, step)

      if (step.status === 'implemented') {
        if (!step.nodeId) {
          errors.push(`lineage ${lineage.id} implemented scale ${step.scale} requires nodeId`)
          continue
        }
        const node = nodesById.get(step.nodeId)
        if (!node) errors.push(`lineage ${lineage.id} references missing node ${step.nodeId}`)
        else if (node.scale !== step.scale) {
          errors.push(`lineage ${lineage.id} node ${step.nodeId} scale ${node.scale} does not match step ${step.scale}`)
        }
      } else {
        if (step.nodeId) errors.push(`lineage ${lineage.id} ${step.status} scale ${step.scale} must not claim a nodeId`)
        if (!step.reason || !nonEmpty(step.reason)) {
          errors.push(`lineage ${lineage.id} ${step.status} scale ${step.scale} requires a reason`)
        }
      }
    }

    for (const requiredScale of graph.requiredScalePath) {
      if (!stepByScale.has(requiredScale)) {
        errors.push(`lineage ${lineage.id} missing required scale ${requiredScale}`)
      }
    }
  }

  return errors
}

export function createVerticalBiologicalGraph(graph: VerticalBiologicalGraph): VerticalBiologicalGraph {
  const errors = validateVerticalBiologicalGraph(graph)
  if (errors.length) throw new Error(`invalid vertical biological graph: ${errors.join('; ')}`)
  return {
    ...graph,
    requiredScalePath: [...graph.requiredScalePath],
    nodes: graph.nodes.map((node) => ({
      ...node,
      evidence: node.evidence.map((evidence) => ({ ...evidence })),
      representation: node.representation ? { ...node.representation } : undefined,
    })),
    relations: graph.relations.map((relation) => ({ ...relation })),
    lineages: graph.lineages.map((lineage) => ({
      ...lineage,
      steps: lineage.steps.map((step) => ({ ...step })),
    })),
  }
}

export function assessVerticalLineage(lineage: VerticalLineage): {
  implemented: number
  gaps: number
  notApplicable: number
  total: number
  completeness: number
} {
  const implemented = lineage.steps.filter((step) => step.status === 'implemented').length
  const gaps = lineage.steps.filter((step) => step.status === 'gap').length
  const notApplicable = lineage.steps.filter((step) => step.status === 'not-applicable').length
  const total = lineage.steps.length
  const applicable = Math.max(0, total - notApplicable)
  return {
    implemented,
    gaps,
    notApplicable,
    total,
    completeness: applicable === 0 ? 1 : implemented / applicable,
  }
}
