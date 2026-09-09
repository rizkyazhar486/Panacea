export type AnatomySystem =
  | 'skeletal'
  | 'muscular'
  | 'arterial'
  | 'venous'
  | 'lymphatic'
  | 'nervous'
  | 'respiratory'
  | 'cardiovascular'
  | 'digestive'
  | 'urinary'
  | 'reproductive'
  | 'endocrine'
  | 'integumentary'
  | 'fascia'

export type AnatomyRegion =
  | 'whole-body'
  | 'head-neck'
  | 'thorax'
  | 'abdomen'
  | 'pelvis'
  | 'back'
  | 'upper-limb'
  | 'lower-limb'

export type AnatomyLaterality = 'midline' | 'left' | 'right' | 'bilateral' | 'not-applicable'
export type AnatomyReviewStatus = 'pending' | 'recorded'

export type AnatomyRelation =
  | 'contains'
  | 'partOf'
  | 'continuousWith'
  | 'supplies'
  | 'drainsTo'
  | 'innervates'
  | 'airwayTo'
  | 'articulatesWith'
  | 'adjacentTo'

export interface AnatomySpatialBounds {
  center: readonly [number, number, number]
  radius: number
}

export interface AnatomyLodDescriptor {
  minLevel: 0 | 1 | 2 | 3 | 4
  maxLevel: 0 | 1 | 2 | 3 | 4
  clinicalWeight: number
  estimatedGpuBytes: number
  geometricError: number
}

export interface AnatomySpatialNode {
  id: string
  label: string
  aliases: readonly string[]
  sourceNodeAliases: readonly string[]
  system: AnatomySystem
  region: AnatomyRegion
  laterality: AnatomyLaterality
  parentId?: string
  bounds?: AnatomySpatialBounds
  lod: AnatomyLodDescriptor
  reviewStatus: AnatomyReviewStatus
}

export interface AnatomySpatialEdge {
  from: string
  to: string
  relation: AnatomyRelation
}

export interface AnatomyGraphValidation {
  valid: boolean
  errors: string[]
}

export interface AnatomySpatialGraph {
  nodes: readonly AnatomySpatialNode[]
  edges: readonly AnatomySpatialEdge[]
}

export function normalizeAnatomyAlias(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function nodeAliases(node: AnatomySpatialNode): string[] {
  return [node.id, node.label, ...node.aliases, ...node.sourceNodeAliases]
    .map(normalizeAnatomyAlias)
    .filter(Boolean)
}

export function buildAnatomyAliasIndex(graph: AnatomySpatialGraph): ReadonlyMap<string, string> {
  const index = new Map<string, string>()
  for (const node of graph.nodes) {
    for (const alias of nodeAliases(node)) {
      const current = index.get(alias)
      if (current && current !== node.id) {
        throw new Error(`Anatomy alias collision: "${alias}" maps to both "${current}" and "${node.id}".`)
      }
      index.set(alias, node.id)
    }
  }
  return index
}

export function resolveAnatomyNodeExact(graph: AnatomySpatialGraph, value: string): AnatomySpatialNode | undefined {
  const normalized = normalizeAnatomyAlias(value)
  if (!normalized) return undefined
  const id = buildAnatomyAliasIndex(graph).get(normalized)
  return id ? graph.nodes.find((node) => node.id === id) : undefined
}

export function validateAnatomySpatialGraph(graph: AnatomySpatialGraph): AnatomyGraphValidation {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const node of graph.nodes) {
    if (!node.id.trim()) errors.push('Anatomy node id must not be blank.')
    if (ids.has(node.id)) errors.push(`Duplicate anatomy node id: ${node.id}.`)
    ids.add(node.id)
    if (!node.label.trim()) errors.push(`Anatomy node ${node.id} has a blank label.`)
    if (node.lod.minLevel > node.lod.maxLevel) errors.push(`Anatomy node ${node.id} has inverted LOD bounds.`)
    if (node.lod.estimatedGpuBytes < 0 || node.lod.geometricError < 0 || node.lod.clinicalWeight < 0) {
      errors.push(`Anatomy node ${node.id} has negative LOD metadata.`)
    }
    if (node.bounds && (!Number.isFinite(node.bounds.radius) || node.bounds.radius <= 0)) {
      errors.push(`Anatomy node ${node.id} has invalid spatial radius.`)
    }
  }

  for (const node of graph.nodes) {
    if (node.parentId && !ids.has(node.parentId)) errors.push(`Anatomy node ${node.id} references missing parent ${node.parentId}.`)
  }

  for (const edge of graph.edges) {
    if (!ids.has(edge.from)) errors.push(`Anatomy edge ${edge.relation} references missing source ${edge.from}.`)
    if (!ids.has(edge.to)) errors.push(`Anatomy edge ${edge.relation} references missing target ${edge.to}.`)
    if (edge.from === edge.to) errors.push(`Anatomy edge ${edge.relation} must not self-reference ${edge.from}.`)
  }

  try {
    buildAnatomyAliasIndex(graph)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  }

  const parentById = new Map(graph.nodes.filter((node) => node.parentId).map((node) => [node.id, node.parentId!] as const))
  for (const node of graph.nodes) {
    const visited = new Set<string>()
    let cursor: string | undefined = node.id
    while (cursor) {
      if (visited.has(cursor)) {
        errors.push(`Containment cycle detected at anatomy node ${cursor}.`)
        break
      }
      visited.add(cursor)
      cursor = parentById.get(cursor)
    }
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)].sort() }
}

function edgeAdjacency(graph: AnatomySpatialGraph, relations?: ReadonlySet<AnatomyRelation>): Map<string, string[]> {
  const adjacency = new Map<string, string[]>()
  for (const edge of graph.edges) {
    if (relations && !relations.has(edge.relation)) continue
    const current = adjacency.get(edge.from) ?? []
    current.push(edge.to)
    adjacency.set(edge.from, current)
  }
  for (const [key, values] of adjacency) adjacency.set(key, [...new Set(values)].sort())
  return adjacency
}

export function findAnatomyPath(
  graph: AnatomySpatialGraph,
  fromId: string,
  toId: string,
  relations?: readonly AnatomyRelation[],
): string[] | undefined {
  if (fromId === toId) return graph.nodes.some((node) => node.id === fromId) ? [fromId] : undefined
  const allowed = relations ? new Set(relations) : undefined
  const adjacency = edgeAdjacency(graph, allowed)
  const queue: string[][] = [[fromId]]
  const visited = new Set<string>([fromId])

  while (queue.length) {
    const path = queue.shift()!
    const current = path[path.length - 1]
    for (const next of adjacency.get(current) ?? []) {
      if (visited.has(next)) continue
      const nextPath = [...path, next]
      if (next === toId) return nextPath
      visited.add(next)
      queue.push(nextPath)
    }
  }
  return undefined
}

export function anatomyDescendants(graph: AnatomySpatialGraph, rootId: string): AnatomySpatialNode[] {
  const byParent = new Map<string, AnatomySpatialNode[]>()
  for (const node of graph.nodes) {
    if (!node.parentId) continue
    const children = byParent.get(node.parentId) ?? []
    children.push(node)
    byParent.set(node.parentId, children)
  }

  const result: AnatomySpatialNode[] = []
  const queue = [...(byParent.get(rootId) ?? [])].sort((a, b) => a.id.localeCompare(b.id))
  const visited = new Set<string>()
  while (queue.length) {
    const node = queue.shift()!
    if (visited.has(node.id)) continue
    visited.add(node.id)
    result.push(node)
    queue.push(...[...(byParent.get(node.id) ?? [])].sort((a, b) => a.id.localeCompare(b.id)))
  }
  return result
}

export function anatomyAncestors(graph: AnatomySpatialGraph, nodeId: string): AnatomySpatialNode[] {
  const byId = new Map(graph.nodes.map((node) => [node.id, node] as const))
  const result: AnatomySpatialNode[] = []
  const visited = new Set<string>()
  let cursor = byId.get(nodeId)?.parentId
  while (cursor) {
    if (visited.has(cursor)) break
    visited.add(cursor)
    const node = byId.get(cursor)
    if (!node) break
    result.push(node)
    cursor = node.parentId
  }
  return result
}
