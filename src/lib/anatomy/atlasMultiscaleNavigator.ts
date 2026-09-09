import type {
  AtlasManifest,
  AtlasNode,
  AtlasRegionId,
  AtlasScale,
  AtlasSystemId,
} from './atlasKernel'
import { atlasAncestors, atlasNodeById } from './atlasKernel'
import { buildAtlasAdjacency, traceAtlasPath, type AtlasGraphEdge } from './atlasGraph'

export interface AtlasFocusLevel {
  node: AtlasNode
  depth: number
  scaleRank: number
  role: 'selected' | 'ancestor' | 'descendant-context'
}

export interface AtlasDrilldownPlan {
  fromId: string
  toId: string
  nodeIds: readonly string[]
  edges: readonly AtlasGraphEdge[]
  scaleTransitions: readonly { from: AtlasScale; to: AtlasScale; atNodeId: string }[]
  totalWeight: number
}

export interface AtlasCoverageCell {
  system: AtlasSystemId
  region: AtlasRegionId
  totalNodes: number
  shippedNodes: number
  partialNodes: number
  referenceOnlyNodes: number
  academicReviewedNodes: number
  scales: readonly AtlasScale[]
}

export interface AtlasCoverageReport {
  cells: readonly AtlasCoverageCell[]
  missingSystemRegionPairs: readonly { system: AtlasSystemId; region: AtlasRegionId }[]
  scaleCoverage: Readonly<Record<AtlasScale, number>>
  systemCoverage: Readonly<Record<AtlasSystemId, number>>
}

export interface AtlasSectionPlane {
  /** Normalized model-space unit vector. */
  normal: readonly [number, number, number]
  /** Plane equation: n·x = offset. */
  offset: number
  /** Educational slab half-thickness in normalized body units. */
  halfThickness: number
}

export interface AtlasSectionHit {
  node: AtlasNode
  signedDistance: number
  intersects: boolean
}

const SCALE_ORDER: readonly AtlasScale[] = ['organism', 'region', 'organ', 'suborgan', 'tissue', 'microstructure']
const SYSTEM_ORDER: readonly AtlasSystemId[] = [
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
const REGION_ORDER: readonly AtlasRegionId[] = [
  'whole-body',
  'head',
  'neck',
  'thorax',
  'abdomen',
  'pelvis',
  'back',
  'upper-limb',
  'hand',
  'lower-limb',
  'foot',
]

const stableUnique = <T>(values: readonly T[]) => [...new Set(values)]

export function atlasScaleRank(scale: AtlasScale) {
  return SCALE_ORDER.indexOf(scale)
}

function descendants(manifest: AtlasManifest, nodeId: string, maxDepth: number) {
  const byId = new Map(manifest.nodes.map((node) => [node.id, node]))
  const result: { node: AtlasNode; depth: number }[] = []
  let frontier = [{ id: nodeId, depth: 0 }]
  const seen = new Set<string>([nodeId])

  while (frontier.length) {
    const next: typeof frontier = []
    for (const item of frontier) {
      if (item.depth >= maxDepth) continue
      const node = byId.get(item.id)
      for (const childId of node?.children ?? []) {
        if (seen.has(childId)) continue
        seen.add(childId)
        const child = byId.get(childId)
        if (!child) continue
        const depth = item.depth + 1
        result.push({ node: child, depth })
        next.push({ id: child.id, depth })
      }
    }
    frontier = next
  }
  return result
}

/**
 * Builds the organism→region→organ→suborgan→tissue→microstructure focus stack.
 * No missing hierarchy is inferred; only canonical manifest ancestry/children
 * are used.
 */
export function buildAtlasFocusStack(
  manifest: AtlasManifest,
  selectedNodeId: string,
  descendantDepth = 1,
): AtlasFocusLevel[] {
  const selected = atlasNodeById(manifest, selectedNodeId)
  if (!selected) return []

  const ancestors = atlasAncestors(manifest, selectedNodeId).reverse()
  const down = descendants(manifest, selectedNodeId, Math.max(0, descendantDepth))
  return [
    ...ancestors.map((node, index) => ({
      node,
      depth: index,
      scaleRank: atlasScaleRank(node.scale),
      role: 'ancestor' as const,
    })),
    {
      node: selected,
      depth: ancestors.length,
      scaleRank: atlasScaleRank(selected.scale),
      role: 'selected' as const,
    },
    ...down.map(({ node, depth }) => ({
      node,
      depth: ancestors.length + depth,
      scaleRank: atlasScaleRank(node.scale),
      role: 'descendant-context' as const,
    })),
  ]
}

/**
 * Plans an educational drill-down route through explicit anatomy relations.
 * Hierarchy is preferred because parent/child edges are cheapest in atlasGraph;
 * no synthetic clinical pathway is invented.
 */
export function planAtlasDrilldown(
  manifest: AtlasManifest,
  fromId: string,
  toId: string,
): AtlasDrilldownPlan | null {
  const path = traceAtlasPath(manifest, fromId, toId)
  if (!path) return null

  const transitions: { from: AtlasScale; to: AtlasScale; atNodeId: string }[] = []
  for (let i = 1; i < path.nodeIds.length; i += 1) {
    const previous = atlasNodeById(manifest, path.nodeIds[i - 1])
    const current = atlasNodeById(manifest, path.nodeIds[i])
    if (!previous || !current || previous.scale === current.scale) continue
    transitions.push({ from: previous.scale, to: current.scale, atNodeId: current.id })
  }

  return {
    fromId,
    toId,
    nodeIds: path.nodeIds,
    edges: path.edges,
    scaleTransitions: transitions,
    totalWeight: path.totalWeight,
  }
}

/**
 * Whole-body completeness is reported as engineering coverage only.
 * A populated cell does NOT mean clinically complete or academically approved.
 */
export function buildAtlasCoverageReport(manifest: AtlasManifest): AtlasCoverageReport {
  const cells: AtlasCoverageCell[] = []
  const missing: { system: AtlasSystemId; region: AtlasRegionId }[] = []

  for (const system of SYSTEM_ORDER) {
    for (const region of REGION_ORDER) {
      const nodes = manifest.nodes.filter((node) => node.system === system && node.regions.includes(region))
      if (!nodes.length) {
        missing.push({ system, region })
        continue
      }
      cells.push({
        system,
        region,
        totalNodes: nodes.length,
        shippedNodes: nodes.filter((node) => node.geometryStatus === 'shipped').length,
        partialNodes: nodes.filter((node) => node.geometryStatus === 'partial').length,
        referenceOnlyNodes: nodes.filter((node) => node.geometryStatus === 'reference-only' || node.geometryStatus === 'planned').length,
        academicReviewedNodes: nodes.filter((node) => node.provenance.reviewStatus === 'academic-reviewed').length,
        scales: stableUnique(nodes.map((node) => node.scale)).sort((a, b) => atlasScaleRank(a) - atlasScaleRank(b)),
      })
    }
  }

  const scaleCoverage = Object.fromEntries(SCALE_ORDER.map((scale) => [scale, manifest.nodes.filter((node) => node.scale === scale).length])) as Record<AtlasScale, number>
  const systemCoverage = Object.fromEntries(SYSTEM_ORDER.map((system) => [system, manifest.nodes.filter((node) => node.system === system).length])) as Record<AtlasSystemId, number>

  return {
    cells: cells.sort((a, b) => a.system.localeCompare(b.system) || a.region.localeCompare(b.region)),
    missingSystemRegionPairs: missing,
    scaleCoverage,
    systemCoverage,
  }
}

function normalizeVector(vector: readonly [number, number, number]): readonly [number, number, number] {
  const magnitude = Math.hypot(vector[0], vector[1], vector[2])
  if (magnitude < 1e-9) throw new Error('Atlas section-plane normal must be non-zero.')
  return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude]
}

/**
 * Spatial-anchor section query. This never fabricates mesh intersections.
 * Nodes without an authored spatial anchor are omitted until geometry/runtime
 * supplies one.
 */
export function queryAtlasSectionPlane(
  manifest: AtlasManifest,
  plane: AtlasSectionPlane,
  systems?: readonly AtlasSystemId[],
): AtlasSectionHit[] {
  const normal = normalizeVector(plane.normal)
  const halfThickness = Math.max(0, plane.halfThickness)
  const hits: AtlasSectionHit[] = []

  for (const node of manifest.nodes) {
    if (!node.spatial) continue
    if (systems?.length && !systems.includes(node.system)) continue
    const [x, y, z] = node.spatial.center
    const signedDistance = normal[0] * x + normal[1] * y + normal[2] * z - plane.offset
    const intersects = Math.abs(signedDistance) <= node.spatial.radius + halfThickness
    if (!intersects) continue
    hits.push({ node, signedDistance, intersects })
  }

  return hits.sort((a, b) => Math.abs(a.signedDistance) - Math.abs(b.signedDistance) || a.node.id.localeCompare(b.node.id))
}

/**
 * Finds connected components of the explicit anatomy graph. A high-end atlas
 * should remain intentionally connected through hierarchy/relations instead of
 * relying on visual proximity.
 */
export function atlasConnectedComponents(manifest: AtlasManifest): readonly string[][] {
  const adjacency = buildAtlasAdjacency(manifest)
  const unvisited = new Set(adjacency.keys())
  const components: string[][] = []

  while (unvisited.size) {
    const start = [...unvisited].sort()[0]
    const queue = [start]
    const component: string[] = []
    unvisited.delete(start)

    while (queue.length) {
      const current = queue.shift()!
      component.push(current)
      const neighbors = (adjacency.get(current) ?? []).map((edge) => edge.to).sort()
      for (const next of neighbors) {
        if (!unvisited.has(next)) continue
        unvisited.delete(next)
        queue.push(next)
      }
    }
    components.push(component.sort())
  }

  return components.sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]))
}

export function validateMultiscaleAtlas(manifest: AtlasManifest): string[] {
  const issues: string[] = []
  for (const node of manifest.nodes) {
    if (atlasScaleRank(node.scale) < 0) issues.push(`Unknown scale on ${node.id}: ${node.scale}`)
    if (!node.regions.length) issues.push(`Node has no region coverage: ${node.id}`)
  }

  const components = atlasConnectedComponents(manifest)
  if (components.length > 1) {
    issues.push(`Atlas explicit graph has ${components.length} connected components; disconnected modules require deliberate bridge relations or hierarchy.`)
  }
  return issues
}
