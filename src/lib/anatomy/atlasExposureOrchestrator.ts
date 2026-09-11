import type {
  AtlasGeometryStatus,
  AtlasManifest,
  AtlasNode,
  AtlasRegionId,
  AtlasRelationKind,
  AtlasScale,
  AtlasSystemId,
} from './atlasKernel'
import { atlasNodeById } from './atlasKernel'
import { traceAtlasPath, type AtlasGraphEdge } from './atlasGraph'

export type AtlasExplorationIntent =
  | 'whole-body'
  | 'system-isolation'
  | 'regional-dissection'
  | 'cross-scale'
  | 'cross-section'
  | 'physiology'
  | 'surgical-landmarks'
  | 'airway-navigation'

export type AtlasExposureRole = 'focus' | 'route' | 'detail' | 'section' | 'context' | 'shell'

export interface AtlasPlane {
  /** Normalized model-space origin; never patient coordinates. */
  origin: readonly [number, number, number]
  /** Normalized by the engine before use. */
  normal: readonly [number, number, number]
  /** Half-space tolerance in normalized body units. */
  thickness?: number
}

export interface AtlasTopologyIndex {
  byId: ReadonlyMap<string, AtlasNode>
  childrenByParent: ReadonlyMap<string, readonly string[]>
  incomingRelations: ReadonlyMap<string, readonly { from: string; kind: AtlasRelationKind; note?: string }[]>
  bySystem: ReadonlyMap<AtlasSystemId, readonly string[]>
  byRegion: ReadonlyMap<AtlasRegionId, readonly string[]>
  byScale: ReadonlyMap<AtlasScale, readonly string[]>
}

export interface AtlasCoverageCell {
  system: AtlasSystemId
  scale: AtlasScale
  nodeCount: number
  geometryBackedCount: number
  physiologyCapableCount: number
  surgicalLandmarkCount: number
  academicReviewedCount: number
}

export interface AtlasCoverageReport {
  cells: readonly AtlasCoverageCell[]
  systemCount: number
  scaleCount: number
  populatedCellCount: number
  /** Engineering metadata coverage only; never anatomical completeness. */
  metadataCoverageRatio: number
  referenceOnlyNodeCount: number
  geometryBackedNodeCount: number
  academicReviewedNodeCount: number
  warnings: readonly string[]
}

export interface AtlasSectionHit {
  nodeId: string
  signedDistance: number
  normalizedDistance: number
  radius: number
}

export interface AtlasExposureNodePlan {
  node: AtlasNode
  role: AtlasExposureRole
  hierarchyDepth: number
  geometryStatus: AtlasGeometryStatus
  renderableGeometry: boolean
  academicReviewed: boolean
  reasons: readonly string[]
}

export interface AtlasExposurePlan {
  intent: AtlasExplorationIntent
  focusNodeId?: string
  routeTargetNodeId?: string
  nodes: readonly AtlasExposureNodePlan[]
  route: readonly AtlasGraphEdge[]
  crossScaleNodeIds: readonly string[]
  sectionHits: readonly AtlasSectionHit[]
  warnings: readonly string[]
}

export interface AtlasExplicitFlowEdge {
  from: string
  to: string
  kind: Extract<AtlasRelationKind, 'continuous-with' | 'supplies' | 'drains' | 'innervates' | 'projects-to'>
  note?: string
}

export interface AtlasExplicitFlowNetwork {
  startNodeId: string
  nodeIds: readonly string[]
  edges: readonly AtlasExplicitFlowEdge[]
  truncated: boolean
  warnings: readonly string[]
}

const SCALE_ORDER: Record<AtlasScale, number> = {
  organism: 0,
  region: 1,
  organ: 2,
  suborgan: 3,
  tissue: 4,
  microstructure: 5,
}

const ALL_SCALES = Object.keys(SCALE_ORDER) as AtlasScale[]
const ALL_SYSTEMS: readonly AtlasSystemId[] = [
  'surface',
  'skeletal',
  'articular',
  'muscular',
  'cardiovascular',
  'lymphatic',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
  'sensory',
  'fascial',
]

const FLOW_KINDS = new Set<AtlasExplicitFlowEdge['kind']>([
  'continuous-with',
  'supplies',
  'drains',
  'innervates',
  'projects-to',
])

const ROLE_PRIORITY: Record<AtlasExposureRole, number> = {
  focus: 6,
  route: 5,
  detail: 4,
  section: 3,
  context: 2,
  shell: 1,
}

function pushMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const values = map.get(key) ?? []
  values.push(value)
  map.set(key, values)
}

function stableUnique(values: readonly string[]) {
  return [...new Set(values)]
}

export function compileAtlasTopology(manifest: AtlasManifest): AtlasTopologyIndex {
  const byId = new Map<string, AtlasNode>()
  const childrenByParent = new Map<string, string[]>()
  const incomingRelations = new Map<string, { from: string; kind: AtlasRelationKind; note?: string }[]>()
  const bySystem = new Map<AtlasSystemId, string[]>()
  const byRegion = new Map<AtlasRegionId, string[]>()
  const byScale = new Map<AtlasScale, string[]>()

  for (const node of manifest.nodes) {
    byId.set(node.id, node)
    pushMap(bySystem, node.system, node.id)
    pushMap(byScale, node.scale, node.id)
    for (const region of node.regions) pushMap(byRegion, region, node.id)
    if (node.parentId) pushMap(childrenByParent, node.parentId, node.id)
    for (const relation of node.relations ?? []) {
      pushMap(incomingRelations, relation.targetId, { from: node.id, kind: relation.kind, note: relation.note })
    }
  }

  const sortMap = <K>(map: Map<K, string[]>) => {
    for (const [key, values] of map) map.set(key, stableUnique(values).sort())
  }
  sortMap(childrenByParent)
  sortMap(bySystem)
  sortMap(byRegion)
  sortMap(byScale)

  for (const [key, values] of incomingRelations) {
    incomingRelations.set(key, [...values].sort((a, b) => a.from.localeCompare(b.from) || a.kind.localeCompare(b.kind)))
  }

  return { byId, childrenByParent, incomingRelations, bySystem, byRegion, byScale }
}

export function atlasLineage(manifest: AtlasManifest, nodeId: string): readonly string[] {
  const index = compileAtlasTopology(manifest)
  const path: string[] = []
  const seen = new Set<string>()
  let current = index.byId.get(nodeId)

  while (current) {
    if (seen.has(current.id)) break
    seen.add(current.id)
    path.push(current.id)
    current = current.parentId ? index.byId.get(current.parentId) : undefined
  }
  return path.reverse()
}

export function atlasDescendants(manifest: AtlasManifest, nodeId: string, maxDepth = 3): readonly { nodeId: string; depth: number }[] {
  const index = compileAtlasTopology(manifest)
  if (!index.byId.has(nodeId)) return []

  const out: { nodeId: string; depth: number }[] = []
  const visited = new Set<string>([nodeId])
  let frontier = [{ nodeId, depth: 0 }]

  while (frontier.length) {
    const next: { nodeId: string; depth: number }[] = []
    for (const item of frontier) {
      if (item.depth >= Math.max(0, maxDepth)) continue
      for (const childId of index.childrenByParent.get(item.nodeId) ?? []) {
        if (visited.has(childId)) continue
        visited.add(childId)
        const child = { nodeId: childId, depth: item.depth + 1 }
        out.push(child)
        next.push(child)
      }
    }
    frontier = next
  }

  return out.sort((a, b) => a.depth - b.depth || a.nodeId.localeCompare(b.nodeId))
}

export function buildAtlasMetadataCoverage(manifest: AtlasManifest): AtlasCoverageReport {
  const cells: AtlasCoverageCell[] = []
  let populatedCellCount = 0

  for (const system of ALL_SYSTEMS) {
    for (const scale of ALL_SCALES) {
      const nodes = manifest.nodes.filter((node) => node.system === system && node.scale === scale)
      if (nodes.length) populatedCellCount += 1
      cells.push({
        system,
        scale,
        nodeCount: nodes.length,
        geometryBackedCount: nodes.filter((node) => node.geometryStatus === 'shipped' || node.geometryStatus === 'partial').length,
        physiologyCapableCount: nodes.filter((node) => node.physiologyCapable).length,
        surgicalLandmarkCount: nodes.filter((node) => node.surgicalLandmark).length,
        academicReviewedCount: nodes.filter((node) => node.provenance.reviewStatus === 'academic-reviewed').length,
      })
    }
  }

  const possibleCells = ALL_SYSTEMS.length * ALL_SCALES.length
  const geometryBackedNodeCount = manifest.nodes.filter((node) => node.geometryStatus === 'shipped' || node.geometryStatus === 'partial').length
  const referenceOnlyNodeCount = manifest.nodes.filter((node) => node.geometryStatus === 'reference-only').length
  const academicReviewedNodeCount = manifest.nodes.filter((node) => node.provenance.reviewStatus === 'academic-reviewed').length

  return {
    cells,
    systemCount: ALL_SYSTEMS.length,
    scaleCount: ALL_SCALES.length,
    populatedCellCount,
    metadataCoverageRatio: possibleCells ? populatedCellCount / possibleCells : 0,
    referenceOnlyNodeCount,
    geometryBackedNodeCount,
    academicReviewedNodeCount,
    warnings: [
      'metadataCoverageRatio measures populated engineering metadata cells only; it is not a claim of anatomical completeness.',
      'Reference-only nodes must remain non-rendering until verified source geometry is explicitly mapped.',
      'Academic-review-required metadata must not be presented as academically reviewed anatomy.',
    ],
  }
}

export function buildCrossScaleDrilldown(manifest: AtlasManifest, startNodeId: string, maxDepth = 8): readonly string[] {
  const start = atlasNodeById(manifest, startNodeId)
  if (!start) return []

  const descendants = atlasDescendants(manifest, startNodeId, maxDepth)
    .map((entry) => ({ ...entry, node: atlasNodeById(manifest, entry.nodeId) }))
    .filter((entry): entry is { nodeId: string; depth: number; node: AtlasNode } => Boolean(entry.node))
    .filter((entry) => SCALE_ORDER[entry.node.scale] > SCALE_ORDER[start.scale])

  const bestByScale = new Map<AtlasScale, { nodeId: string; depth: number; node: AtlasNode }>()
  for (const entry of descendants) {
    const current = bestByScale.get(entry.node.scale)
    if (!current
      || entry.depth < current.depth
      || (entry.depth === current.depth && entry.node.educationalPriority > current.node.educationalPriority)
      || (entry.depth === current.depth && entry.node.educationalPriority === current.node.educationalPriority && entry.node.id < current.node.id)) {
      bestByScale.set(entry.node.scale, entry)
    }
  }

  return [...bestByScale.values()]
    .sort((a, b) => SCALE_ORDER[a.node.scale] - SCALE_ORDER[b.node.scale] || a.depth - b.depth || a.nodeId.localeCompare(b.nodeId))
    .map((entry) => entry.nodeId)
}

function normalizeVector(vector: readonly [number, number, number]): [number, number, number] | null {
  const length = Math.hypot(vector[0], vector[1], vector[2])
  if (!Number.isFinite(length) || length <= 1e-9) return null
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

export function atlasSectionHits(manifest: AtlasManifest, plane: AtlasPlane): readonly AtlasSectionHit[] {
  const normal = normalizeVector(plane.normal)
  if (!normal) return []
  const thickness = Math.max(0, plane.thickness ?? 0)
  const hits: AtlasSectionHit[] = []

  for (const node of manifest.nodes) {
    const spatial = node.spatial
    if (!spatial || !Number.isFinite(spatial.radius) || spatial.radius <= 0) continue
    const dx = spatial.center[0] - plane.origin[0]
    const dy = spatial.center[1] - plane.origin[1]
    const dz = spatial.center[2] - plane.origin[2]
    const signedDistance = dx * normal[0] + dy * normal[1] + dz * normal[2]
    const reach = spatial.radius + thickness
    if (Math.abs(signedDistance) > reach) continue
    hits.push({
      nodeId: node.id,
      signedDistance,
      normalizedDistance: Math.abs(signedDistance) / Math.max(spatial.radius, 1e-9),
      radius: spatial.radius,
    })
  }

  return hits.sort((a, b) => a.normalizedDistance - b.normalizedDistance || a.nodeId.localeCompare(b.nodeId))
}

function roleForNode(
  nodeId: string,
  focusNodeId: string | undefined,
  routeIds: ReadonlySet<string>,
  detailIds: ReadonlySet<string>,
  sectionIds: ReadonlySet<string>,
  contextIds: ReadonlySet<string>,
  shellIds: ReadonlySet<string>,
): AtlasExposureRole | undefined {
  if (nodeId === focusNodeId) return 'focus'
  if (routeIds.has(nodeId)) return 'route'
  if (detailIds.has(nodeId)) return 'detail'
  if (sectionIds.has(nodeId)) return 'section'
  if (contextIds.has(nodeId)) return 'context'
  if (shellIds.has(nodeId)) return 'shell'
  return undefined
}

function directContextIds(manifest: AtlasManifest, nodeId: string, allowedKinds?: readonly AtlasRelationKind[]) {
  const index = compileAtlasTopology(manifest)
  const node = index.byId.get(nodeId)
  if (!node) return [] as string[]
  const allowed = allowedKinds?.length ? new Set(allowedKinds) : undefined
  const ids: string[] = []

  for (const relation of node.relations ?? []) {
    if (!allowed || allowed.has(relation.kind)) ids.push(relation.targetId)
  }
  for (const incoming of index.incomingRelations.get(nodeId) ?? []) {
    if (!allowed || allowed.has(incoming.kind)) ids.push(incoming.from)
  }
  return stableUnique(ids).filter((id) => index.byId.has(id)).sort()
}

export function buildAtlasExposurePlan(
  manifest: AtlasManifest,
  request: {
    intent: AtlasExplorationIntent
    focusNodeId?: string
    routeTargetNodeId?: string
    maxDetailDepth?: number
    relationKinds?: readonly AtlasRelationKind[]
    crossSection?: AtlasPlane
    includeReferenceMetadata?: boolean
  },
): AtlasExposurePlan {
  const warnings: string[] = []
  const focus = request.focusNodeId ? atlasNodeById(manifest, request.focusNodeId) : undefined
  if (request.focusNodeId && !focus) warnings.push(`Focus node is absent from the active manifest: ${request.focusNodeId}`)

  const lineage = focus ? atlasLineage(manifest, focus.id) : []
  const shellIds = new Set(lineage.slice(0, -1))
  const detailEntries = focus ? atlasDescendants(manifest, focus.id, request.maxDetailDepth ?? 2) : []
  const detailIds = new Set(detailEntries.map((entry) => entry.nodeId))
  const contextIds = new Set(focus ? directContextIds(manifest, focus.id, request.relationKinds) : [])

  let route: readonly AtlasGraphEdge[] = []
  const routeIds = new Set<string>()
  if (focus && request.routeTargetNodeId) {
    const path = traceAtlasPath(manifest, focus.id, request.routeTargetNodeId)
    if (!path) warnings.push(`No explicit atlas graph route from ${focus.id} to ${request.routeTargetNodeId}.`)
    else {
      route = path.edges
      path.nodeIds.forEach((id) => routeIds.add(id))
    }
  }

  const sectionHits = request.crossSection ? atlasSectionHits(manifest, request.crossSection) : []
  const sectionIds = new Set(sectionHits.map((hit) => hit.nodeId))
  if (request.crossSection && sectionHits.length === 0) {
    warnings.push('Cross-section plane produced no anchored-node hits. This is fail-closed: nodes without verified normalized spatial anchors are not guessed into the section.')
  }

  const includeReferenceMetadata = request.includeReferenceMetadata ?? true
  const candidateIds = stableUnique([
    ...(focus ? [focus.id] : []),
    ...shellIds,
    ...detailIds,
    ...contextIds,
    ...routeIds,
    ...sectionIds,
  ])

  const plans: AtlasExposureNodePlan[] = []
  for (const id of candidateIds) {
    const node = atlasNodeById(manifest, id)
    if (!node) continue
    if (!includeReferenceMetadata && (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned')) continue
    const role = roleForNode(id, focus?.id, routeIds, detailIds, sectionIds, contextIds, shellIds)
    if (!role) continue
    const reasons: string[] = []
    if (node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned') reasons.push('metadata-only: verified render geometry is not published')
    if (node.provenance.reviewStatus !== 'academic-reviewed') reasons.push(`review gate: ${node.provenance.reviewStatus}`)
    if (node.physiologyCapable && request.intent === 'physiology') reasons.push('eligible for bounded educational physiology overlay')
    if (node.surgicalLandmark && request.intent === 'surgical-landmarks') reasons.push('explicit surgical-landmark metadata')

    plans.push({
      node,
      role,
      hierarchyDepth: atlasLineage(manifest, node.id).length - 1,
      geometryStatus: node.geometryStatus,
      renderableGeometry: node.geometryStatus === 'shipped' || node.geometryStatus === 'partial',
      academicReviewed: node.provenance.reviewStatus === 'academic-reviewed',
      reasons,
    })
  }

  plans.sort((a, b) => ROLE_PRIORITY[b.role] - ROLE_PRIORITY[a.role]
    || b.node.educationalPriority - a.node.educationalPriority
    || a.hierarchyDepth - b.hierarchyDepth
    || a.node.id.localeCompare(b.node.id))

  if (plans.some((plan) => !plan.renderableGeometry)) warnings.push('Plan contains reference metadata that must not be rendered as verified anatomy until source geometry is mapped.')
  if (plans.some((plan) => !plan.academicReviewed)) warnings.push('Plan contains anatomy metadata pending qualified academic review; UI must preserve review-state disclosure.')

  return {
    intent: request.intent,
    focusNodeId: focus?.id,
    routeTargetNodeId: request.routeTargetNodeId,
    nodes: plans,
    route,
    crossScaleNodeIds: focus ? buildCrossScaleDrilldown(manifest, focus.id) : [],
    sectionHits,
    warnings: stableUnique(warnings),
  }
}

export function buildExplicitAtlasFlowNetwork(
  manifest: AtlasManifest,
  startNodeId: string,
  options: {
    systems?: readonly AtlasSystemId[]
    allowedKinds?: readonly AtlasExplicitFlowEdge['kind'][]
    maxDepth?: number
    maxEdges?: number
  } = {},
): AtlasExplicitFlowNetwork {
  const start = atlasNodeById(manifest, startNodeId)
  const warnings: string[] = []
  if (!start) return { startNodeId, nodeIds: [], edges: [], truncated: false, warnings: [`Start node is absent from manifest: ${startNodeId}`] }

  const allowedKinds = new Set(options.allowedKinds ?? [...FLOW_KINDS])
  const allowedSystems = options.systems?.length ? new Set(options.systems) : undefined
  const maxDepth = Math.max(0, options.maxDepth ?? 5)
  const maxEdges = Math.max(1, options.maxEdges ?? 128)
  const visitedDepth = new Map<string, number>([[startNodeId, 0]])
  const queue = [startNodeId]
  const edges: AtlasExplicitFlowEdge[] = []
  let truncated = false

  while (queue.length) {
    const from = queue.shift()!
    const depth = visitedDepth.get(from) ?? 0
    if (depth >= maxDepth) continue
    const node = atlasNodeById(manifest, from)
    if (!node) continue

    for (const relation of node.relations ?? []) {
      if (!FLOW_KINDS.has(relation.kind as AtlasExplicitFlowEdge['kind'])) continue
      const kind = relation.kind as AtlasExplicitFlowEdge['kind']
      if (!allowedKinds.has(kind)) continue
      const target = atlasNodeById(manifest, relation.targetId)
      if (!target) continue
      if (allowedSystems && (!allowedSystems.has(node.system) || !allowedSystems.has(target.system))) continue
      edges.push({ from, to: target.id, kind, note: relation.note })
      if (edges.length >= maxEdges) {
        truncated = true
        queue.length = 0
        break
      }
      if (!visitedDepth.has(target.id)) {
        visitedDepth.set(target.id, depth + 1)
        queue.push(target.id)
      }
    }
  }

  if (edges.length === 0) warnings.push('No explicit flow edges were found. The engine does not infer unrecorded vascular, airway, neural, or ductal connectivity.')
  if (truncated) warnings.push(`Explicit flow network was truncated at ${maxEdges} edges.`)

  return {
    startNodeId,
    nodeIds: [...visitedDepth.keys()].sort(),
    edges: [...new Map(edges.map((edge) => [`${edge.from}|${edge.to}|${edge.kind}`, edge])).values()],
    truncated,
    warnings,
  }
}

export function validateAtlasExposureOrchestrator(manifest: AtlasManifest): readonly string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  const index = compileAtlasTopology(manifest)

  for (const node of manifest.nodes) {
    if (ids.has(node.id)) issues.push(`Duplicate atlas node id: ${node.id}`)
    ids.add(node.id)
    if (node.parentId && !index.byId.has(node.parentId)) issues.push(`Missing parent ${node.parentId} for ${node.id}`)
    if (node.parentId === node.id) issues.push(`Self-parent cycle at ${node.id}`)
    for (const relation of node.relations ?? []) {
      if (relation.targetId === node.id) issues.push(`Self relation at ${node.id}: ${relation.kind}`)
      if (!index.byId.has(relation.targetId)) issues.push(`Missing relation target ${relation.targetId} from ${node.id}`)
    }
    if (node.parentId) {
      const parent = index.byId.get(node.parentId)
      if (parent && parent.system === node.system && SCALE_ORDER[node.scale] < SCALE_ORDER[parent.scale]) {
        issues.push(`Scale regression ${parent.id}(${parent.scale}) -> ${node.id}(${node.scale})`)
      }
    }
  }

  for (const system of ALL_SYSTEMS) {
    if (!index.byId.has(`system:${system}`)) issues.push(`Missing canonical system root: system:${system}`)
  }

  for (const node of manifest.nodes) {
    const lineage = atlasLineage(manifest, node.id)
    if (lineage.length > manifest.nodes.length) issues.push(`Hierarchy traversal overflow at ${node.id}`)
    if (new Set(lineage).size !== lineage.length) issues.push(`Hierarchy cycle detected at ${node.id}`)
  }

  return stableUnique(issues).sort()
}
