export const ANATOMY_SYSTEMS = [
  'surface', 'skeletal', 'muscular', 'cardiovascular', 'respiratory', 'nervous',
  'digestive', 'urinary', 'reproductive', 'endocrine', 'lymphatic', 'connective',
] as const

export type AnatomySystem = (typeof ANATOMY_SYSTEMS)[number]

export const ANATOMY_REGIONS = [
  'whole-body', 'head-neck', 'thorax', 'abdomen', 'pelvis', 'upper-limb', 'lower-limb', 'back',
] as const

export type AnatomyRegion = (typeof ANATOMY_REGIONS)[number]
export type AnatomyRelationKind = 'contains' | 'part-of' | 'paired-with' | 'adjacent-to' | 'continuous-with'
export type AcademicReviewStatus = 'pending' | 'recorded'

export interface AnatomyAcademicReview {
  status: AcademicReviewStatus
  reviewerName?: string
  reviewerCredentials?: string
  reviewedAt?: string
  scope?: string
}

export interface AnatomyRelation {
  kind: AnatomyRelationKind
  targetId: string
}

export interface AtlasNode {
  id: string
  canonicalName: string
  aliases: string[]
  sourceHints: string[]
  primarySystem: AnatomySystem
  systems: AnatomySystem[]
  regions: AnatomyRegion[]
  parentId?: string
  relations: AnatomyRelation[]
  importanceWeight: number
  estimatedCostUnits: number
  geometrySourceId?: string
  nomenclatureSourceId?: string
  sourceRevision?: string
  licenseId?: string
  citation?: string
  academicReview: AnatomyAcademicReview
}

export interface AtlasManifest {
  id: string
  version: string
  sourceRegistryRefs: string[]
  nodes: AtlasNode[]
}

export interface AtlasGraphValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?Z)?$/

export function normalizeAnatomyText(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ')
}

function validReview(review: AnatomyAcademicReview): boolean {
  if (review.status === 'pending') return true
  return Boolean(
    review.reviewerName?.trim()
    && review.reviewerCredentials?.trim()
    && review.scope?.trim()
    && review.reviewedAt?.trim()
    && ISO_DATE_RE.test(review.reviewedAt.trim()),
  )
}

export function indexAtlasNodes(manifest: AtlasManifest): Map<string, AtlasNode> {
  return new Map(manifest.nodes.map((node) => [node.id, node]))
}

export function validateAtlasManifest(manifest: AtlasManifest): AtlasGraphValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  const index = indexAtlasNodes(manifest)

  if (!manifest.id.trim()) errors.push('Atlas manifest id is required.')
  if (!manifest.version.trim()) errors.push('Atlas manifest version is required.')

  for (const node of manifest.nodes) {
    if (!node.id.trim()) errors.push('Every atlas node requires an id.')
    if (ids.has(node.id)) errors.push(`Duplicate atlas node id: ${node.id}`)
    ids.add(node.id)

    if (!node.canonicalName.trim()) errors.push(`${node.id}: canonicalName is required.`)
    if (!(node.importanceWeight > 0) || !Number.isFinite(node.importanceWeight)) errors.push(`${node.id}: importanceWeight must be finite and > 0.`)
    if (!(node.estimatedCostUnits > 0) || !Number.isFinite(node.estimatedCostUnits)) errors.push(`${node.id}: estimatedCostUnits must be finite and > 0.`)
    if (!node.systems.includes(node.primarySystem)) errors.push(`${node.id}: primarySystem must be present in systems.`)
    if (!node.regions.length) errors.push(`${node.id}: at least one region is required.`)
    if (node.parentId && !index.has(node.parentId)) errors.push(`${node.id}: parent ${node.parentId} does not exist.`)
    if (!validReview(node.academicReview)) errors.push(`${node.id}: recorded academic review metadata is incomplete or invalid.`)

    const normalizedTerms = [node.canonicalName, ...node.aliases, ...node.sourceHints].map(normalizeAnatomyText).filter(Boolean)
    if (new Set(normalizedTerms).size !== normalizedTerms.length) warnings.push(`${node.id}: duplicate canonical/alias/source-hint after normalization.`)

    for (const relation of node.relations) {
      if (!index.has(relation.targetId)) errors.push(`${node.id}: relation target ${relation.targetId} does not exist.`)
      if (relation.targetId === node.id) errors.push(`${node.id}: self relation is forbidden.`)
    }
  }

  for (const system of ANATOMY_SYSTEMS) {
    if (!manifest.nodes.some((node) => node.primarySystem === system && !node.parentId)) {
      errors.push(`Missing root node for anatomy system: ${system}`)
    }
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visiting.has(id)) {
      errors.push(`Parent cycle detected at ${id}.`)
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    const parentId = index.get(id)?.parentId
    if (parentId && index.has(parentId)) visit(parentId)
    visiting.delete(id)
    visited.add(id)
  }
  for (const id of index.keys()) visit(id)

  return { valid: errors.length === 0, errors: [...new Set(errors)], warnings: [...new Set(warnings)] }
}

export function getAncestorIds(manifest: AtlasManifest, nodeId: string): string[] {
  const index = indexAtlasNodes(manifest)
  const ancestors: string[] = []
  const seen = new Set<string>()
  let cursor = index.get(nodeId)?.parentId
  while (cursor && !seen.has(cursor)) {
    ancestors.push(cursor)
    seen.add(cursor)
    cursor = index.get(cursor)?.parentId
  }
  return ancestors
}

export function getDescendantIds(manifest: AtlasManifest, nodeId: string): string[] {
  const children = new Map<string, string[]>()
  for (const node of manifest.nodes) {
    if (!node.parentId) continue
    const list = children.get(node.parentId) ?? []
    list.push(node.id)
    children.set(node.parentId, list)
  }
  const result: string[] = []
  const stack = [...(children.get(nodeId) ?? [])].sort().reverse()
  while (stack.length) {
    const id = stack.pop()!
    result.push(id)
    const next = [...(children.get(id) ?? [])].sort().reverse()
    stack.push(...next)
  }
  return result
}

export function selectAtlasSubgraph(
  manifest: AtlasManifest,
  systems: readonly AnatomySystem[] = [],
  regions: readonly AnatomyRegion[] = [],
): AtlasNode[] {
  const systemSet = new Set(systems)
  const regionSet = new Set(regions)
  return manifest.nodes.filter((node) => {
    const systemMatch = !systemSet.size || node.systems.some((system) => systemSet.has(system))
    const regionMatch = !regionSet.size || node.regions.some((region) => regionSet.has(region))
    return systemMatch && regionMatch
  })
}
