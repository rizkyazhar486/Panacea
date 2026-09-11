import { INDEKS_TUBUH, type StrukturTubuh } from './bodyIndex.gen'

export type BodyAtlasLayer = StrukturTubuh['l']
export type BodyAtlasLaterality = StrukturTubuh['s']
export type BodyAtlasLodTier = 'micro' | 'low' | 'medium' | 'high' | 'ultra'
export type BodyAtlasEdgeKind = 'contralateral' | 'same-structure'

export interface BodyAtlasNode {
  id: string
  sourceName: string
  baseName: string
  normalizedName: string
  normalizedBaseName: string
  sourceFile: string
  layer: BodyAtlasLayer
  laterality: BodyAtlasLaterality
  region: string
  y: number
  radial: number
  triangles: number
  lodTier: BodyAtlasLodTier
}

export interface BodyAtlasEdge {
  id: string
  kind: BodyAtlasEdgeKind
  source: string
  target: string
}

export interface BodyAtlasGraphStats {
  nodeCount: number
  edgeCount: number
  totalTriangles: number
  nodesByLayer: Record<BodyAtlasLayer, number>
  trianglesByLayer: Record<BodyAtlasLayer, number>
  nodesByLod: Record<BodyAtlasLodTier, number>
  regions: readonly string[]
}

export interface BodyAtlasGraph {
  nodes: readonly BodyAtlasNode[]
  edges: readonly BodyAtlasEdge[]
  nodeById: ReadonlyMap<string, BodyAtlasNode>
  stats: BodyAtlasGraphStats
}

export interface BodyAtlasSearchOptions {
  limit?: number
  layers?: readonly BodyAtlasLayer[]
  regions?: readonly string[]
  lateralities?: readonly BodyAtlasLaterality[]
}

export interface BodyAtlasSearchResult {
  node: BodyAtlasNode
  score: number
  reasons: readonly string[]
}

export interface BodyAtlasResidencyRequest {
  triangleBudget: number
  maxNodes?: number
  focusNodeIds?: readonly string[]
  activeLayers?: readonly BodyAtlasLayer[]
  activeRegions?: readonly string[]
  includeContralateralOfFocus?: boolean
}

export interface BodyAtlasResidencyPlan {
  selected: readonly BodyAtlasNode[]
  selectedIds: ReadonlySet<string>
  triangleBudget: number
  trianglesSelected: number
  budgetExceededByMandatoryFocus: boolean
  omittedNodeCount: number
  focusNodeIds: readonly string[]
}

export const BODY_ATLAS_LAYER_FILES: Record<BodyAtlasLayer, string> = {
  surface: 'surface.glb',
  skeletal: 'skeletal.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  visceral: 'visceral.glb',
  lymphoid: 'lymphoid.glb',
}

export const BODY_ATLAS_LOD_THRESHOLDS = {
  microMaxTriangles: 1_000,
  lowMaxTriangles: 5_000,
  mediumMaxTriangles: 25_000,
  highMaxTriangles: 100_000,
} as const

const BODY_ATLAS_LAYERS: readonly BodyAtlasLayer[] = [
  'surface',
  'skeletal',
  'muscular',
  'cardiovascular',
  'nervous',
  'visceral',
  'lymphoid',
]

const BODY_ATLAS_LODS: readonly BodyAtlasLodTier[] = ['micro', 'low', 'medium', 'high', 'ultra']

export function normalizeAtlasTerm(value: string) {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/\.[lr]$/i, '')
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function stableHash(value: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function nodeId(structure: StrukturTubuh) {
  return `mesh:${structure.l}:${stableHash(`${structure.l}|${structure.n}`)}`
}

export function bodyAtlasLodTier(triangles: number): BodyAtlasLodTier {
  if (triangles <= BODY_ATLAS_LOD_THRESHOLDS.microMaxTriangles) return 'micro'
  if (triangles <= BODY_ATLAS_LOD_THRESHOLDS.lowMaxTriangles) return 'low'
  if (triangles <= BODY_ATLAS_LOD_THRESHOLDS.mediumMaxTriangles) return 'medium'
  if (triangles <= BODY_ATLAS_LOD_THRESHOLDS.highMaxTriangles) return 'high'
  return 'ultra'
}

function emptyLayerRecord() {
  return Object.fromEntries(BODY_ATLAS_LAYERS.map((layer) => [layer, 0])) as Record<BodyAtlasLayer, number>
}

function emptyLodRecord() {
  return Object.fromEntries(BODY_ATLAS_LODS.map((tier) => [tier, 0])) as Record<BodyAtlasLodTier, number>
}

function buildStats(nodes: readonly BodyAtlasNode[], edges: readonly BodyAtlasEdge[]): BodyAtlasGraphStats {
  const nodesByLayer = emptyLayerRecord()
  const trianglesByLayer = emptyLayerRecord()
  const nodesByLod = emptyLodRecord()
  const regions = new Set<string>()
  let totalTriangles = 0

  for (const node of nodes) {
    nodesByLayer[node.layer] += 1
    trianglesByLayer[node.layer] += node.triangles
    nodesByLod[node.lodTier] += 1
    totalTriangles += node.triangles
    if (node.region) regions.add(node.region)
  }

  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    totalTriangles,
    nodesByLayer,
    trianglesByLayer,
    nodesByLod,
    regions: [...regions].sort((a, b) => a.localeCompare(b)),
  }
}

function buildEdges(nodes: readonly BodyAtlasNode[]) {
  const edges: BodyAtlasEdge[] = []
  const byBase = new Map<string, BodyAtlasNode[]>()

  for (const node of nodes) {
    const key = `${node.layer}|${node.normalizedBaseName}`
    const group = byBase.get(key) ?? []
    group.push(node)
    byBase.set(key, group)
  }

  for (const [key, group] of byBase) {
    if (group.length < 2) continue
    const left = group.filter((node) => node.laterality === 'kiri')
    const right = group.filter((node) => node.laterality === 'kanan')
    const center = group.filter((node) => node.laterality === 'tengah')

    for (const leftNode of left) {
      for (const rightNode of right) {
        const [source, target] = [leftNode.id, rightNode.id].sort()
        edges.push({
          id: `edge:contralateral:${stableHash(`${key}|${source}|${target}`)}`,
          kind: 'contralateral',
          source,
          target,
        })
      }
    }

    if (!left.length && !right.length && center.length > 1) {
      const sorted = [...center].sort((a, b) => a.sourceName.localeCompare(b.sourceName))
      for (let index = 1; index < sorted.length; index += 1) {
        edges.push({
          id: `edge:same-structure:${stableHash(`${key}|${sorted[index - 1].id}|${sorted[index].id}`)}`,
          kind: 'same-structure',
          source: sorted[index - 1].id,
          target: sorted[index].id,
        })
      }
    }
  }

  return edges.sort((a, b) => a.id.localeCompare(b.id))
}

export function compileBodyAtlasGraph(structures: readonly StrukturTubuh[]): BodyAtlasGraph {
  const nodes = structures
    .map((structure): BodyAtlasNode => ({
      id: nodeId(structure),
      sourceName: structure.n,
      baseName: structure.b,
      normalizedName: normalizeAtlasTerm(structure.n),
      normalizedBaseName: normalizeAtlasTerm(structure.b),
      sourceFile: BODY_ATLAS_LAYER_FILES[structure.l],
      layer: structure.l,
      laterality: structure.s,
      region: structure.w.trim(),
      y: structure.y,
      radial: structure.r,
      triangles: Math.max(0, Math.trunc(structure.t)),
      lodTier: bodyAtlasLodTier(structure.t),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))

  const seenIds = new Set<string>()
  for (const node of nodes) {
    if (seenIds.has(node.id)) throw new Error(`Body atlas node id collision: ${node.id}`)
    seenIds.add(node.id)
  }

  const edges = buildEdges(nodes)
  return {
    nodes,
    edges,
    nodeById: new Map(nodes.map((node) => [node.id, node] as const)),
    stats: buildStats(nodes, edges),
  }
}

export const BODY_ATLAS_GRAPH = compileBodyAtlasGraph(INDEKS_TUBUH)

function termTokens(value: string) {
  return normalizeAtlasTerm(value).split(' ').filter(Boolean)
}

function safePrefixMatch(sourceToken: string, queryToken: string) {
  return sourceToken === queryToken || (queryToken.length >= 5 && sourceToken.startsWith(queryToken))
}

function orderedTokenMatch(source: readonly string[], query: readonly string[]) {
  if (!query.length || query.length > source.length) return false
  for (let start = 0; start <= source.length - query.length; start += 1) {
    let matched = true
    for (let offset = 0; offset < query.length; offset += 1) {
      if (!safePrefixMatch(source[start + offset], query[offset])) {
        matched = false
        break
      }
    }
    if (matched) return true
  }
  return false
}

function scoreAtlasNode(node: BodyAtlasNode, query: string) {
  const normalizedQuery = normalizeAtlasTerm(query)
  if (!normalizedQuery) return null

  const reasons: string[] = []
  let score = 0

  if (node.normalizedName === normalizedQuery) {
    score = 1_000
    reasons.push('exact-source-name')
  } else if (node.normalizedBaseName === normalizedQuery) {
    score = 950
    reasons.push('exact-base-name')
  } else {
    const queryTokens = termTokens(normalizedQuery)
    const sourceTokens = termTokens(node.normalizedName)
    const baseTokens = termTokens(node.normalizedBaseName)
    if (orderedTokenMatch(sourceTokens, queryTokens) || orderedTokenMatch(baseTokens, queryTokens)) {
      score = 720
      reasons.push('ordered-reviewed-token-match')
    } else if (queryTokens.every((token) => baseTokens.some((sourceToken) => safePrefixMatch(sourceToken, token)))) {
      score = 540
      reasons.push('all-token-match')
    } else {
      return null
    }
  }

  if (node.laterality !== 'tengah') {
    const sideToken = node.laterality === 'kiri' ? 'left' : 'right'
    if (normalizedQuery.includes(sideToken)) {
      score += 60
      reasons.push('laterality-match')
    }
  }

  return { score, reasons }
}

export function searchBodyAtlas(
  query: string,
  options: BodyAtlasSearchOptions = {},
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
): BodyAtlasSearchResult[] {
  const limit = Math.max(1, Math.min(options.limit ?? 24, 200))
  const layers = options.layers ? new Set(options.layers) : null
  const regions = options.regions ? new Set(options.regions.map((region) => normalizeAtlasTerm(region))) : null
  const lateralities = options.lateralities ? new Set(options.lateralities) : null

  const results: BodyAtlasSearchResult[] = []
  for (const node of graph.nodes) {
    if (layers && !layers.has(node.layer)) continue
    if (lateralities && !lateralities.has(node.laterality)) continue
    if (regions && !regions.has(normalizeAtlasTerm(node.region))) continue

    const scored = scoreAtlasNode(node, query)
    if (!scored) continue
    results.push({ node, score: scored.score, reasons: scored.reasons })
  }

  return results
    .sort((a, b) => b.score - a.score
      || a.node.triangles - b.node.triangles
      || a.node.sourceName.localeCompare(b.node.sourceName))
    .slice(0, limit)
}

function addMandatoryNode(
  id: string,
  graph: BodyAtlasGraph,
  selected: Map<string, BodyAtlasNode>,
) {
  const node = graph.nodeById.get(id)
  if (node) selected.set(node.id, node)
}

function contralateralNeighbors(nodeId: string, graph: BodyAtlasGraph) {
  const ids: string[] = []
  for (const edge of graph.edges) {
    if (edge.kind !== 'contralateral') continue
    if (edge.source === nodeId) ids.push(edge.target)
    else if (edge.target === nodeId) ids.push(edge.source)
  }
  return ids
}

/**
 * Deterministic visibility planner for very large whole-body scenes.
 *
 * Focus nodes are mandatory and may exceed the requested triangle budget. All
 * optional nodes compete on relevance / rendering cost. The score is an
 * engineering prioritisation function, not a biomedical importance score:
 *
 *   utility = relevance / max(triangles, 1)^0.35
 *
 * This lets a focused structure remain visible while preserving enough nearby
 * context to navigate the body on constrained GPUs.
 */
export function planBodyAtlasResidency(
  request: BodyAtlasResidencyRequest,
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
): BodyAtlasResidencyPlan {
  const triangleBudget = Math.max(0, Math.trunc(request.triangleBudget))
  const maxNodes = Math.max(1, Math.trunc(request.maxNodes ?? 600))
  const focusNodeIds = [...new Set(request.focusNodeIds ?? [])]
  const activeLayers = request.activeLayers ? new Set(request.activeLayers) : null
  const activeRegions = request.activeRegions
    ? new Set(request.activeRegions.map((region) => normalizeAtlasTerm(region)))
    : null

  const selected = new Map<string, BodyAtlasNode>()
  for (const id of focusNodeIds) addMandatoryNode(id, graph, selected)

  if (request.includeContralateralOfFocus !== false) {
    for (const id of focusNodeIds) {
      for (const peerId of contralateralNeighbors(id, graph)) addMandatoryNode(peerId, graph, selected)
    }
  }

  let trianglesSelected = [...selected.values()].reduce((sum, node) => sum + node.triangles, 0)
  const focusRegions = new Set([...selected.values()].map((node) => normalizeAtlasTerm(node.region)))
  const focusLayers = new Set([...selected.values()].map((node) => node.layer))

  const candidates = graph.nodes
    .filter((node) => !selected.has(node.id))
    .filter((node) => !activeLayers || activeLayers.has(node.layer))
    .filter((node) => !activeRegions || activeRegions.has(normalizeAtlasTerm(node.region)))
    .map((node) => {
      let relevance = 1
      if (focusRegions.has(normalizeAtlasTerm(node.region))) relevance += 500
      if (focusLayers.has(node.layer)) relevance += 240
      if (activeRegions?.has(normalizeAtlasTerm(node.region))) relevance += 160
      if (activeLayers?.has(node.layer)) relevance += 100
      if (node.lodTier === 'micro') relevance += 18
      else if (node.lodTier === 'low') relevance += 12
      const utility = relevance / Math.pow(Math.max(node.triangles, 1), 0.35)
      return { node, utility, relevance }
    })
    .sort((a, b) => b.utility - a.utility
      || b.relevance - a.relevance
      || a.node.triangles - b.node.triangles
      || a.node.id.localeCompare(b.node.id))

  for (const candidate of candidates) {
    if (selected.size >= maxNodes) break
    const nextTriangles = trianglesSelected + candidate.node.triangles
    if (nextTriangles > triangleBudget) continue
    selected.set(candidate.node.id, candidate.node)
    trianglesSelected = nextTriangles
  }

  const selectedNodes = [...selected.values()].sort((a, b) => a.id.localeCompare(b.id))
  return {
    selected: selectedNodes,
    selectedIds: new Set(selectedNodes.map((node) => node.id)),
    triangleBudget,
    trianglesSelected,
    budgetExceededByMandatoryFocus: trianglesSelected > triangleBudget,
    omittedNodeCount: graph.nodes.length - selectedNodes.length,
    focusNodeIds,
  }
}

export function validateBodyAtlasGraph(graph: BodyAtlasGraph = BODY_ATLAS_GRAPH) {
  const reasons: string[] = []
  const ids = new Set<string>()

  for (const node of graph.nodes) {
    if (ids.has(node.id)) reasons.push(`Duplicate node id: ${node.id}`)
    ids.add(node.id)
    if (!node.sourceName.trim()) reasons.push(`${node.id}: empty source name.`)
    if (!node.baseName.trim()) reasons.push(`${node.id}: empty base name.`)
    if (!BODY_ATLAS_LAYER_FILES[node.layer]) reasons.push(`${node.id}: unknown render layer.`)
    if (!Number.isFinite(node.y) || node.y < 0 || node.y > 1) reasons.push(`${node.id}: y must be normalized to 0..1.`)
    if (!Number.isFinite(node.radial) || node.radial < 0) reasons.push(`${node.id}: radial coordinate must be non-negative.`)
    if (!Number.isInteger(node.triangles) || node.triangles < 0) reasons.push(`${node.id}: invalid triangle count.`)
  }

  for (const edge of graph.edges) {
    if (!graph.nodeById.has(edge.source) || !graph.nodeById.has(edge.target)) {
      reasons.push(`${edge.id}: dangling graph edge.`)
    }
    if (edge.source === edge.target) reasons.push(`${edge.id}: self edge is forbidden.`)
  }

  if (graph.stats.nodeCount !== graph.nodes.length) reasons.push('Node-count statistic is stale.')
  if (graph.stats.edgeCount !== graph.edges.length) reasons.push('Edge-count statistic is stale.')
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] }
}
