import type {
  AtlasGeometryStatus,
  AtlasManifest,
  AtlasNode,
  AtlasRegionId,
  AtlasRelationKind,
  AtlasScale,
  AtlasSystemId,
} from './atlasKernel'

export interface AtlasRuntimeIndex {
  manifest: AtlasManifest
  byId: ReadonlyMap<string, AtlasNode>
  bySystem: ReadonlyMap<AtlasSystemId, readonly AtlasNode[]>
  byRegion: ReadonlyMap<AtlasRegionId, readonly AtlasNode[]>
  byScale: ReadonlyMap<AtlasScale, readonly AtlasNode[]>
  normalizedTerms: ReadonlyMap<string, readonly string[]>
  depthById: ReadonlyMap<string, number>
  graph: ReadonlyMap<string, readonly AtlasGraphEdge[]>
}

export interface AtlasGraphEdge {
  from: string
  to: string
  kind: AtlasRelationKind | 'hierarchy'
  weight: number
  reversed?: boolean
}

export interface AtlasSearchFilters {
  systems?: readonly AtlasSystemId[]
  regions?: readonly AtlasRegionId[]
  scales?: readonly AtlasScale[]
  geometry?: readonly AtlasGeometryStatus[]
  surgicalLandmarksOnly?: boolean
  physiologyCapableOnly?: boolean
  limit?: number
}

export interface AtlasSearchHit {
  node: AtlasNode
  score: number
  matchedTerms: readonly string[]
}

export interface AtlasPathOptions {
  relationKinds?: readonly AtlasRelationKind[]
  allowReverseRelations?: boolean
  includeHierarchy?: boolean
  maxVisited?: number
}

export interface AtlasPathResult {
  nodeIds: readonly string[]
  nodes: readonly AtlasNode[]
  edges: readonly AtlasGraphEdge[]
  totalWeight: number
}

export type AtlasSectionPlane = 'axial' | 'coronal' | 'sagittal'

export interface AtlasCrossSectionRequest {
  plane: AtlasSectionPlane
  /** Normalized educational model coordinate, never patient/image coordinates. */
  position: number
  /** Slab thickness in the same normalized model space. */
  thickness?: number
  systems?: readonly AtlasSystemId[]
  regions?: readonly AtlasRegionId[]
  includeReferenceOnly?: boolean
  limit?: number
}

export interface AtlasCrossSectionHit {
  node: AtlasNode
  signedDistance: number
  intersectionRadius: number
  crossSectionAreaProxy: number
  score: number
}

export interface AtlasCoverageCell {
  system: AtlasSystemId
  region: AtlasRegionId
  scale: AtlasScale
  total: number
  shipped: number
  partial: number
  referenceOnly: number
  planned: number
  academicReviewed: number
  physiologyCapable: number
  surgicalLandmarks: number
}

export interface AtlasCoverageMatrix {
  cells: readonly AtlasCoverageCell[]
  emptyCells: readonly AtlasCoverageCell[]
  bySystem: Readonly<Record<AtlasSystemId, {
    total: number
    shipped: number
    partial: number
    referenceOnly: number
    planned: number
    representedRegions: number
    representedScales: number
  }>>
}

export interface AtlasPrefetchRequest {
  selectedNodeId: string
  maxGraphDepth?: number
  maxFiles?: number
  relationKinds?: readonly AtlasRelationKind[]
  includeReferenceOnly?: boolean
}

export interface AtlasPrefetchCandidate {
  file: string
  nodeIds: readonly string[]
  minimumGraphDepth: number
  priority: number
}

export interface AtlasScaleRoute {
  startNode: AtlasNode
  route: readonly AtlasNode[]
  representedScales: readonly AtlasScale[]
}

const SCALE_ORDER: readonly AtlasScale[] = ['organism', 'region', 'organ', 'suborgan', 'tissue', 'microstructure']

const RELATION_WEIGHTS: Readonly<Record<AtlasRelationKind, number>> = {
  'contains': 0.75,
  'part-of': 0.75,
  'continuous-with': 0.9,
  'articulates-with': 1,
  'passes-through': 1.05,
  'supplies': 1.15,
  'drains': 1.15,
  'innervates': 1.2,
  'moves-with': 1.25,
  'projects-to': 1.3,
  'adjacent-to': 1.8,
}

const HIERARCHY_WEIGHT = 0.6

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function tokens(value: string) {
  return normalize(value).split(' ').filter(Boolean)
}

function stableUnique<T>(values: readonly T[]) {
  return [...new Set(values)]
}

function pushMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const bucket = map.get(key) ?? []
  bucket.push(value)
  map.set(key, bucket)
}

function nodeTerms(node: AtlasNode) {
  return stableUnique([
    normalize(node.id.replace(/[:_-]+/g, ' ')),
    normalize(node.label),
    ...(node.synonyms ?? []).map(normalize),
    ...node.source.nodeHints.map(normalize),
  ].filter(Boolean))
}

function hierarchyDepth(nodeId: string, byId: ReadonlyMap<string, AtlasNode>) {
  let depth = 0
  let current = byId.get(nodeId)
  const seen = new Set<string>([nodeId])
  while (current?.parentId) {
    if (seen.has(current.parentId)) break
    seen.add(current.parentId)
    const parent = byId.get(current.parentId)
    if (!parent) break
    depth += 1
    current = parent
  }
  return depth
}

function addGraphEdge(graph: Map<string, AtlasGraphEdge[]>, edge: AtlasGraphEdge) {
  const bucket = graph.get(edge.from) ?? []
  const duplicate = bucket.some((existing) => existing.to === edge.to && existing.kind === edge.kind && existing.reversed === edge.reversed)
  if (!duplicate) bucket.push(edge)
  graph.set(edge.from, bucket)
}

export function buildAtlasRuntimeIndex(manifest: AtlasManifest): AtlasRuntimeIndex {
  const byId = new Map(manifest.nodes.map((node) => [node.id, node] as const))
  const bySystem = new Map<AtlasSystemId, AtlasNode[]>()
  const byRegion = new Map<AtlasRegionId, AtlasNode[]>()
  const byScale = new Map<AtlasScale, AtlasNode[]>()
  const normalizedTerms = new Map<string, readonly string[]>()
  const depthById = new Map<string, number>()
  const graph = new Map<string, AtlasGraphEdge[]>()

  for (const node of manifest.nodes) {
    pushMap(bySystem, node.system, node)
    for (const region of node.regions) pushMap(byRegion, region, node)
    pushMap(byScale, node.scale, node)
    normalizedTerms.set(node.id, nodeTerms(node))
    depthById.set(node.id, hierarchyDepth(node.id, byId))
  }

  for (const node of manifest.nodes) {
    if (node.parentId && byId.has(node.parentId)) {
      addGraphEdge(graph, { from: node.id, to: node.parentId, kind: 'hierarchy', weight: HIERARCHY_WEIGHT })
      addGraphEdge(graph, { from: node.parentId, to: node.id, kind: 'hierarchy', weight: HIERARCHY_WEIGHT })
    }
    for (const relation of node.relations ?? []) {
      if (!byId.has(relation.targetId)) continue
      const weight = RELATION_WEIGHTS[relation.kind]
      addGraphEdge(graph, { from: node.id, to: relation.targetId, kind: relation.kind, weight })
      addGraphEdge(graph, { from: relation.targetId, to: node.id, kind: relation.kind, weight, reversed: true })
    }
  }

  return { manifest, byId, bySystem, byRegion, byScale, normalizedTerms, depthById, graph }
}

function matchesFilters(node: AtlasNode, filters: AtlasSearchFilters) {
  if (filters.systems?.length && !filters.systems.includes(node.system)) return false
  if (filters.regions?.length && !node.regions.some((region) => filters.regions!.includes(region))) return false
  if (filters.scales?.length && !filters.scales.includes(node.scale)) return false
  if (filters.geometry?.length && !filters.geometry.includes(node.geometryStatus)) return false
  if (filters.surgicalLandmarksOnly && !node.surgicalLandmark) return false
  if (filters.physiologyCapableOnly && !node.physiologyCapable) return false
  return true
}

function termScore(term: string, query: string, queryTokens: readonly string[]) {
  if (term === query) return 120
  if (term.startsWith(query)) return 70
  if (term.includes(query)) return 45
  const termTokens = tokens(term)
  const overlap = queryTokens.filter((token) => termTokens.includes(token)).length
  if (!overlap) return 0
  const coverage = overlap / Math.max(queryTokens.length, 1)
  return overlap * 12 + coverage * 24
}

/**
 * Deterministic local search over the canonical manifest. No network, no model,
 * no fuzzy medical inference: the result is bounded by reviewed labels,
 * synonyms, ids, and source hints already present in the atlas contract.
 */
export function searchAtlasRuntime(
  index: AtlasRuntimeIndex,
  queryRaw: string,
  filters: AtlasSearchFilters = {},
): readonly AtlasSearchHit[] {
  const query = normalize(queryRaw)
  if (!query) return []
  const queryTokens = tokens(query)
  const hits: AtlasSearchHit[] = []

  for (const node of index.manifest.nodes) {
    if (!matchesFilters(node, filters)) continue
    const terms = index.normalizedTerms.get(node.id) ?? []
    const rankedTerms = terms
      .map((term) => ({ term, score: termScore(term, query, queryTokens) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term))
    if (!rankedTerms.length) continue

    const exactLabelBoost = normalize(node.label) === query ? 80 : 0
    const exactIdBoost = normalize(node.id.replace(/[:_-]+/g, ' ')) === query ? 90 : 0
    const specificityBoost = Math.min(index.depthById.get(node.id) ?? 0, 5) * 2
    const priorityBoost = node.educationalPriority * 10
    hits.push({
      node,
      score: rankedTerms[0].score + exactLabelBoost + exactIdBoost + specificityBoost + priorityBoost,
      matchedTerms: rankedTerms.slice(0, 4).map((item) => item.term),
    })
  }

  return hits
    .sort((a, b) => b.score - a.score || b.node.educationalPriority - a.node.educationalPriority || a.node.id.localeCompare(b.node.id))
    .slice(0, filters.limit ?? 24)
}

function allowedEdge(edge: AtlasGraphEdge, options: AtlasPathOptions) {
  if (edge.kind === 'hierarchy') return options.includeHierarchy !== false
  if (options.relationKinds?.length && !options.relationKinds.includes(edge.kind)) return false
  if (edge.reversed && options.allowReverseRelations === false) return false
  return true
}

/** Weighted shortest path across hierarchy + explicit anatomical relations. */
export function findAtlasPath(
  index: AtlasRuntimeIndex,
  fromNodeId: string,
  toNodeId: string,
  options: AtlasPathOptions = {},
): AtlasPathResult | null {
  if (!index.byId.has(fromNodeId) || !index.byId.has(toNodeId)) return null
  if (fromNodeId === toNodeId) {
    const node = index.byId.get(fromNodeId)!
    return { nodeIds: [fromNodeId], nodes: [node], edges: [], totalWeight: 0 }
  }

  const maxVisited = Math.max(1, options.maxVisited ?? 10_000)
  const distances = new Map<string, number>([[fromNodeId, 0]])
  const previous = new Map<string, { nodeId: string; edge: AtlasGraphEdge }>()
  const unvisited = new Set<string>([fromNodeId])
  let visitedCount = 0

  while (unvisited.size && visitedCount < maxVisited) {
    let current: string | undefined
    let currentDistance = Number.POSITIVE_INFINITY
    for (const nodeId of unvisited) {
      const distance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY
      if (distance < currentDistance || (distance === currentDistance && nodeId < (current ?? '\uffff'))) {
        current = nodeId
        currentDistance = distance
      }
    }
    if (!current) break
    unvisited.delete(current)
    visitedCount += 1
    if (current === toNodeId) break

    for (const edge of index.graph.get(current) ?? []) {
      if (!allowedEdge(edge, options)) continue
      const nextDistance = currentDistance + edge.weight
      if (nextDistance >= (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) continue
      distances.set(edge.to, nextDistance)
      previous.set(edge.to, { nodeId: current, edge })
      unvisited.add(edge.to)
    }
  }

  if (!previous.has(toNodeId)) return null
  const nodeIds: string[] = [toNodeId]
  const edges: AtlasGraphEdge[] = []
  let cursor = toNodeId
  while (cursor !== fromNodeId) {
    const step = previous.get(cursor)
    if (!step) return null
    nodeIds.push(step.nodeId)
    edges.push(step.edge)
    cursor = step.nodeId
  }
  nodeIds.reverse()
  edges.reverse()
  return {
    nodeIds,
    nodes: nodeIds.map((nodeId) => index.byId.get(nodeId)!).filter(Boolean),
    edges,
    totalWeight: distances.get(toNodeId) ?? Number.POSITIVE_INFINITY,
  }
}

function planeAxis(plane: AtlasSectionPlane): 0 | 1 | 2 {
  if (plane === 'sagittal') return 0
  if (plane === 'axial') return 1
  return 2
}

/**
 * Sphere-plane intersection over normalized educational anchors.
 * areaProxy = π(r² - d²), where d is distance from anchor center to plane.
 * This is a graphics ranking heuristic only, not a morphometric measurement.
 */
export function atlasCrossSectionCandidates(
  index: AtlasRuntimeIndex,
  request: AtlasCrossSectionRequest,
): readonly AtlasCrossSectionHit[] {
  const axis = planeAxis(request.plane)
  const halfThickness = Math.max(request.thickness ?? 0, 0) / 2
  const hits: AtlasCrossSectionHit[] = []

  for (const node of index.manifest.nodes) {
    if (!node.spatial) continue
    if (!request.includeReferenceOnly && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')) continue
    if (request.systems?.length && !request.systems.includes(node.system)) continue
    if (request.regions?.length && !node.regions.some((region) => request.regions!.includes(region))) continue

    const signedDistance = node.spatial.center[axis] - request.position
    const effectiveDistance = Math.max(0, Math.abs(signedDistance) - halfThickness)
    if (effectiveDistance > node.spatial.radius) continue
    const intersectionRadius = Math.sqrt(Math.max(0, node.spatial.radius ** 2 - effectiveDistance ** 2))
    const crossSectionAreaProxy = Math.PI * intersectionRadius ** 2
    const scaleBoost = 1 + SCALE_ORDER.indexOf(node.scale) * 0.035
    const landmarkBoost = node.surgicalLandmark ? 1.08 : 1
    hits.push({
      node,
      signedDistance,
      intersectionRadius,
      crossSectionAreaProxy,
      score: crossSectionAreaProxy * node.educationalPriority * scaleBoost * landmarkBoost,
    })
  }

  return hits
    .sort((a, b) => b.score - a.score || Math.abs(a.signedDistance) - Math.abs(b.signedDistance) || a.node.id.localeCompare(b.node.id))
    .slice(0, request.limit ?? 64)
}

function emptyCoverageCell(system: AtlasSystemId, region: AtlasRegionId, scale: AtlasScale): AtlasCoverageCell {
  return {
    system,
    region,
    scale,
    total: 0,
    shipped: 0,
    partial: 0,
    referenceOnly: 0,
    planned: 0,
    academicReviewed: 0,
    physiologyCapable: 0,
    surgicalLandmarks: 0,
  }
}

/**
 * Completeness lattice: system × region × scale. This intentionally exposes
 * holes instead of hiding them behind an aggregate percentage.
 */
export function buildAtlasCoverageMatrix(
  index: AtlasRuntimeIndex,
  systems: readonly AtlasSystemId[] = stableUnique(index.manifest.nodes.map((node) => node.system)).sort(),
  regions: readonly AtlasRegionId[] = stableUnique(index.manifest.nodes.flatMap((node) => node.regions)).sort(),
  scales: readonly AtlasScale[] = SCALE_ORDER,
): AtlasCoverageMatrix {
  const cells: AtlasCoverageCell[] = []

  for (const system of systems) {
    for (const region of regions) {
      for (const scale of scales) {
        const matching = index.manifest.nodes.filter((node) =>
          node.system === system
          && node.regions.includes(region)
          && node.scale === scale,
        )
        cells.push({
          ...emptyCoverageCell(system, region, scale),
          total: matching.length,
          shipped: matching.filter((node) => node.geometryStatus === 'shipped').length,
          partial: matching.filter((node) => node.geometryStatus === 'partial').length,
          referenceOnly: matching.filter((node) => node.geometryStatus === 'reference-only').length,
          planned: matching.filter((node) => node.geometryStatus === 'planned').length,
          academicReviewed: matching.filter((node) => node.provenance.reviewStatus === 'academic-reviewed').length,
          physiologyCapable: matching.filter((node) => node.physiologyCapable).length,
          surgicalLandmarks: matching.filter((node) => node.surgicalLandmark).length,
        })
      }
    }
  }

  const bySystem = Object.fromEntries(systems.map((system) => {
    const nodes = index.manifest.nodes.filter((node) => node.system === system)
    return [system, {
      total: nodes.length,
      shipped: nodes.filter((node) => node.geometryStatus === 'shipped').length,
      partial: nodes.filter((node) => node.geometryStatus === 'partial').length,
      referenceOnly: nodes.filter((node) => node.geometryStatus === 'reference-only').length,
      planned: nodes.filter((node) => node.geometryStatus === 'planned').length,
      representedRegions: new Set(nodes.flatMap((node) => node.regions)).size,
      representedScales: new Set(nodes.map((node) => node.scale)).size,
    }]
  })) as AtlasCoverageMatrix['bySystem']

  return { cells, emptyCells: cells.filter((cell) => cell.total === 0), bySystem }
}

function graphDepths(index: AtlasRuntimeIndex, startNodeId: string, maxDepth: number, relationKinds?: readonly AtlasRelationKind[]) {
  const depth = new Map<string, number>([[startNodeId, 0]])
  const queue = [startNodeId]
  while (queue.length) {
    const current = queue.shift()!
    const currentDepth = depth.get(current) ?? 0
    if (currentDepth >= maxDepth) continue
    for (const edge of index.graph.get(current) ?? []) {
      if (edge.kind !== 'hierarchy' && relationKinds?.length && !relationKinds.includes(edge.kind)) continue
      if (depth.has(edge.to)) continue
      depth.set(edge.to, currentDepth + 1)
      queue.push(edge.to)
    }
  }
  return depth
}

/** Asset-file prefetch order derived from graph proximity, not guesswork. */
export function buildAtlasPrefetchPlan(
  index: AtlasRuntimeIndex,
  request: AtlasPrefetchRequest,
): readonly AtlasPrefetchCandidate[] {
  if (!index.byId.has(request.selectedNodeId)) return []
  const depths = graphDepths(index, request.selectedNodeId, Math.max(0, request.maxGraphDepth ?? 2), request.relationKinds)
  const byFile = new Map<string, { nodeIds: string[]; minimumGraphDepth: number; priority: number }>()

  for (const [nodeId, graphDepth] of depths) {
    const node = index.byId.get(nodeId)!
    if (!request.includeReferenceOnly && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')) continue
    for (const file of node.source.files ?? []) {
      const existing = byFile.get(file) ?? { nodeIds: [], minimumGraphDepth: graphDepth, priority: 0 }
      existing.nodeIds.push(nodeId)
      existing.minimumGraphDepth = Math.min(existing.minimumGraphDepth, graphDepth)
      existing.priority += node.educationalPriority / (1 + graphDepth)
      byFile.set(file, existing)
    }
  }

  return [...byFile.entries()]
    .map(([file, value]) => ({
      file,
      nodeIds: stableUnique(value.nodeIds).sort(),
      minimumGraphDepth: value.minimumGraphDepth,
      priority: value.priority,
    }))
    .sort((a, b) => b.priority - a.priority || a.minimumGraphDepth - b.minimumGraphDepth || a.file.localeCompare(b.file))
    .slice(0, request.maxFiles ?? 8)
}

/**
 * Descend through canonical children choosing the next deeper scale with the
 * highest educational priority. Useful for deterministic organ→tissue→micro
 * navigation without an AI model deciding anatomy identity.
 */
export function buildAtlasScaleRoute(index: AtlasRuntimeIndex, startNodeId: string): AtlasScaleRoute | null {
  const startNode = index.byId.get(startNodeId)
  if (!startNode) return null
  const route: AtlasNode[] = [startNode]
  const seen = new Set<string>([startNode.id])
  let current = startNode

  while (true) {
    const currentScaleIndex = SCALE_ORDER.indexOf(current.scale)
    const children = (current.children ?? [])
      .map((nodeId) => index.byId.get(nodeId))
      .filter((node): node is AtlasNode => Boolean(node) && !seen.has(node.id))
      .filter((node) => SCALE_ORDER.indexOf(node.scale) > currentScaleIndex)
      .sort((a, b) => {
        const scaleDeltaA = SCALE_ORDER.indexOf(a.scale) - currentScaleIndex
        const scaleDeltaB = SCALE_ORDER.indexOf(b.scale) - currentScaleIndex
        return scaleDeltaA - scaleDeltaB || b.educationalPriority - a.educationalPriority || a.id.localeCompare(b.id)
      })
    const next = children[0]
    if (!next) break
    route.push(next)
    seen.add(next.id)
    current = next
  }

  return {
    startNode,
    route,
    representedScales: stableUnique(route.map((node) => node.scale)),
  }
}

export const ATLAS_SCALE_ORDER = SCALE_ORDER
