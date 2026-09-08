import type {
  AtlasManifest,
  AtlasNode,
  AtlasRegionId,
  AtlasRelationKind,
  AtlasSystemId,
} from './atlasKernel'

export interface AtlasGraphEdge {
  from: string
  to: string
  kind: AtlasRelationKind | 'parent' | 'child'
  weight: number
  note?: string
}

export interface AtlasPath {
  nodeIds: readonly string[]
  edges: readonly AtlasGraphEdge[]
  totalWeight: number
}

export interface AtlasSearchFilter {
  systems?: readonly AtlasSystemId[]
  regions?: readonly AtlasRegionId[]
  requireGeometry?: boolean
  surgicalLandmarkOnly?: boolean
  physiologyCapableOnly?: boolean
  limit?: number
}

export interface AtlasSearchHit {
  node: AtlasNode
  score: number
  matchedBy: readonly string[]
}

const RELATION_WEIGHT: Record<AtlasRelationKind, number> = {
  'continuous-with': 0.6,
  'part-of': 0.7,
  'contains': 0.7,
  'articulates-with': 0.8,
  'passes-through': 0.9,
  'supplies': 1,
  'drains': 1,
  'innervates': 1,
  'moves-with': 1.1,
  'adjacent-to': 1.6,
  'projects-to': 1.4,
}

const normalize = (value: string) => value
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ')

const tokens = (value: string) => normalize(value).split(' ').filter(Boolean)

export function buildAtlasAdjacency(manifest: AtlasManifest) {
  const adjacency = new Map<string, AtlasGraphEdge[]>()
  const push = (edge: AtlasGraphEdge) => {
    const list = adjacency.get(edge.from) ?? []
    list.push(edge)
    adjacency.set(edge.from, list)
  }

  for (const node of manifest.nodes) {
    if (!adjacency.has(node.id)) adjacency.set(node.id, [])

    if (node.parentId) {
      push({ from: node.id, to: node.parentId, kind: 'parent', weight: 0.5 })
      push({ from: node.parentId, to: node.id, kind: 'child', weight: 0.5 })
    }

    for (const relation of node.relations ?? []) {
      push({
        from: node.id,
        to: relation.targetId,
        kind: relation.kind,
        weight: RELATION_WEIGHT[relation.kind],
        note: relation.note,
      })
    }
  }

  for (const edges of adjacency.values()) {
    edges.sort((a, b) => a.weight - b.weight || a.to.localeCompare(b.to))
  }
  return adjacency
}

/**
 * Weighted anatomical path finder for educational navigation.
 *
 * It does not infer missing clinical relationships. Only hierarchy edges and
 * relations explicitly recorded in the reviewed manifest can be traversed.
 */
export function traceAtlasPath(
  manifest: AtlasManifest,
  fromId: string,
  toId: string,
  allowedKinds?: readonly AtlasGraphEdge['kind'][],
): AtlasPath | null {
  if (fromId === toId) return { nodeIds: [fromId], edges: [], totalWeight: 0 }

  const adjacency = buildAtlasAdjacency(manifest)
  if (!adjacency.has(fromId) || !adjacency.has(toId)) return null

  const distance = new Map<string, number>([[fromId, 0]])
  const previous = new Map<string, AtlasGraphEdge>()
  const unvisited = new Set(adjacency.keys())

  while (unvisited.size) {
    let current: string | undefined
    let best = Number.POSITIVE_INFINITY
    for (const id of unvisited) {
      const candidate = distance.get(id) ?? Number.POSITIVE_INFINITY
      if (candidate < best || (candidate === best && current !== undefined && id < current)) {
        best = candidate
        current = id
      }
    }
    if (!current || !Number.isFinite(best)) break
    unvisited.delete(current)
    if (current === toId) break

    for (const edge of adjacency.get(current) ?? []) {
      if (!unvisited.has(edge.to)) continue
      if (allowedKinds?.length && !allowedKinds.includes(edge.kind)) continue
      const next = best + edge.weight
      const existing = distance.get(edge.to) ?? Number.POSITIVE_INFINITY
      if (next < existing) {
        distance.set(edge.to, next)
        previous.set(edge.to, edge)
      }
    }
  }

  if (!previous.has(toId)) return null
  const reversedEdges: AtlasGraphEdge[] = []
  let cursor = toId
  while (cursor !== fromId) {
    const edge = previous.get(cursor)
    if (!edge) return null
    reversedEdges.push(edge)
    cursor = edge.from
  }

  const edges = reversedEdges.reverse()
  return {
    nodeIds: [fromId, ...edges.map((edge) => edge.to)],
    edges,
    totalWeight: edges.reduce((sum, edge) => sum + edge.weight, 0),
  }
}

function passesFilter(node: AtlasNode, filter: AtlasSearchFilter) {
  if (filter.systems?.length && !filter.systems.includes(node.system)) return false
  if (filter.regions?.length && !node.regions.some((region) => filter.regions!.includes(region))) return false
  if (filter.requireGeometry && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')) return false
  if (filter.surgicalLandmarkOnly && !node.surgicalLandmark) return false
  if (filter.physiologyCapableOnly && !node.physiologyCapable) return false
  return true
}

function scoreCandidate(node: AtlasNode, query: string) {
  const q = normalize(query)
  if (!q) return { score: 0, matchedBy: [] as string[] }
  const qTokens = tokens(q)
  const fields = [node.label, ...(node.synonyms ?? []), ...node.source.nodeHints]
  let score = 0
  const matchedBy: string[] = []

  for (const field of fields) {
    const normalized = normalize(field)
    if (!normalized) continue
    if (normalized === q) {
      score = Math.max(score, 100)
      matchedBy.push(field)
      continue
    }
    if (normalized.startsWith(q)) {
      score = Math.max(score, 82)
      matchedBy.push(field)
      continue
    }
    const fieldTokens = tokens(normalized)
    const everyToken = qTokens.every((queryToken) => fieldTokens.some((fieldToken) => fieldToken === queryToken || (queryToken.length >= 5 && fieldToken.startsWith(queryToken))))
    if (everyToken) {
      score = Math.max(score, 68)
      matchedBy.push(field)
      continue
    }
    if (q.length >= 5 && normalized.includes(q)) {
      score = Math.max(score, 48)
      matchedBy.push(field)
    }
  }

  if (!score) return { score: 0, matchedBy: [] as string[] }
  const geometryBonus = node.geometryStatus === 'shipped' ? 8 : node.geometryStatus === 'partial' ? 4 : 0
  const reviewBonus = node.provenance.reviewStatus === 'academic-reviewed' ? 6 : 0
  const priorityBonus = node.educationalPriority * 10
  return { score: score + geometryBonus + reviewBonus + priorityBonus, matchedBy: [...new Set(matchedBy)] }
}

export function searchAtlas(manifest: AtlasManifest, query: string, filter: AtlasSearchFilter = {}): AtlasSearchHit[] {
  const hits: AtlasSearchHit[] = []
  for (const node of manifest.nodes) {
    if (!passesFilter(node, filter)) continue
    const scored = scoreCandidate(node, query)
    if (scored.score <= 0) continue
    hits.push({ node, score: scored.score, matchedBy: scored.matchedBy })
  }
  hits.sort((a, b) => b.score - a.score || b.node.educationalPriority - a.node.educationalPriority || a.node.id.localeCompare(b.node.id))
  return hits.slice(0, Math.max(1, filter.limit ?? 20))
}

export function atlasSubgraph(
  manifest: AtlasManifest,
  centerId: string,
  depth = 2,
  allowedKinds?: readonly AtlasGraphEdge['kind'][],
) {
  const adjacency = buildAtlasAdjacency(manifest)
  if (!adjacency.has(centerId)) return { nodeIds: [] as string[], edges: [] as AtlasGraphEdge[] }

  const visited = new Set<string>([centerId])
  let frontier = [centerId]
  const edges: AtlasGraphEdge[] = []

  for (let level = 0; level < Math.max(0, depth); level += 1) {
    const next: string[] = []
    for (const id of frontier) {
      for (const edge of adjacency.get(id) ?? []) {
        if (allowedKinds?.length && !allowedKinds.includes(edge.kind)) continue
        edges.push(edge)
        if (visited.has(edge.to)) continue
        visited.add(edge.to)
        next.push(edge.to)
      }
    }
    frontier = next
    if (!frontier.length) break
  }

  const uniqueEdges = [...new Map(edges.map((edge) => [`${edge.from}|${edge.to}|${edge.kind}`, edge])).values()]
  return {
    nodeIds: [...visited].sort(),
    edges: uniqueEdges.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.kind.localeCompare(b.kind)),
  }
}
