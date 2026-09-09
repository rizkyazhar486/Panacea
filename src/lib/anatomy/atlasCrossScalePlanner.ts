import type { AtlasManifest, AtlasScale, AtlasSystemId } from './atlasKernel'
import { atlasAncestors, atlasNodeById } from './atlasKernel'
import { buildAtlasAdjacency, type AtlasGraphEdge } from './atlasGraph'
import {
  BIO_SCALE_ORDER,
  bioScaleNodeById,
  type BioScale,
  type BioScaleManifest,
  type BioScaleRelation,
} from './bioScaleAtlas'

export type CrossScaleNamespace = 'atlas' | 'bio'
export type CrossScaleValue = AtlasScale | BioScale
export type CrossScaleEdgeKind = AtlasGraphEdge['kind'] | 'bio-parent' | 'bio-child' | 'bio-relation' | 'atlas-to-cell' | 'cell-to-atlas'

export interface CrossScaleStep {
  namespace: CrossScaleNamespace
  id: string
  label: string
  system: AtlasSystemId
  scale: CrossScaleValue
}

export interface CrossScaleEdge {
  fromKey: string
  toKey: string
  kind: CrossScaleEdgeKind
  weight: number
  relationKind?: BioScaleRelation['kind']
  note?: string
}

export interface CrossScaleRouteOptions {
  /** Prefer monotonic organism -> molecular drill-down. */
  strictDrillDown?: boolean
  /** Reject traversal through other systems. Defaults to source system. */
  allowedSystems?: readonly AtlasSystemId[]
  /** Hard safety bound against unexpectedly dense future graphs. */
  maxVisitedNodes?: number
}

export interface CrossScaleRoute {
  fromAtlasNodeId: string
  toBioNodeId: string
  steps: readonly CrossScaleStep[]
  edges: readonly CrossScaleEdge[]
  totalWeight: number
  atlasContextNodeIds: readonly string[]
  bioContextNodeIds: readonly string[]
  scaleTransitions: readonly { from: CrossScaleValue; to: CrossScaleValue; atId: string }[]
  warnings: readonly string[]
}

const ATLAS_SCALE_ORDER: readonly AtlasScale[] = ['organism', 'region', 'organ', 'suborgan', 'tissue', 'microstructure']
const key = (namespace: CrossScaleNamespace, id: string) => `${namespace}::${id}`
const atlasKey = (id: string) => key('atlas', id)
const bioKey = (id: string) => key('bio', id)

function atlasScaleRank(scale: AtlasScale) {
  return ATLAS_SCALE_ORDER.indexOf(scale)
}

function combinedScaleRank(scale: CrossScaleValue) {
  const atlasRank = ATLAS_SCALE_ORDER.indexOf(scale as AtlasScale)
  if (atlasRank >= 0) return atlasRank
  const bioRank = BIO_SCALE_ORDER.indexOf(scale as BioScale)
  return bioRank < 0 ? Number.POSITIVE_INFINITY : ATLAS_SCALE_ORDER.length + bioRank
}

function buildSteps(atlas: AtlasManifest, bio: BioScaleManifest) {
  const steps = new Map<string, CrossScaleStep>()
  for (const node of atlas.nodes) {
    steps.set(atlasKey(node.id), { namespace: 'atlas', id: node.id, label: node.label, system: node.system, scale: node.scale })
  }
  for (const node of bio.nodes) {
    steps.set(bioKey(node.id), { namespace: 'bio', id: node.id, label: node.label, system: node.system, scale: node.scale })
  }
  return steps
}

function addEdge(adjacency: Map<string, CrossScaleEdge[]>, edge: CrossScaleEdge) {
  const list = adjacency.get(edge.fromKey) ?? []
  list.push(edge)
  adjacency.set(edge.fromKey, list)
}

/**
 * Combined explicit graph. It never infers a cell/molecule from free text or
 * visual proximity. Bridges exist only where BioScaleNode declares an authored
 * AtlasNode anchor; subcellular/molecular nodes are reached through explicit
 * bioscale hierarchy/relations.
 */
export function buildCrossScaleAdjacency(atlas: AtlasManifest, bio: BioScaleManifest) {
  const adjacency = new Map<string, CrossScaleEdge[]>()
  const steps = buildSteps(atlas, bio)
  for (const stepKey of steps.keys()) adjacency.set(stepKey, [])

  for (const [fromId, edges] of buildAtlasAdjacency(atlas)) {
    for (const edge of edges) {
      addEdge(adjacency, {
        fromKey: atlasKey(fromId),
        toKey: atlasKey(edge.to),
        kind: edge.kind,
        weight: edge.weight,
        note: edge.note,
      })
    }
  }

  for (const node of bio.nodes) {
    if (node.parentId) {
      addEdge(adjacency, { fromKey: bioKey(node.parentId), toKey: bioKey(node.id), kind: 'bio-child', weight: 0.38 })
      addEdge(adjacency, { fromKey: bioKey(node.id), toKey: bioKey(node.parentId), kind: 'bio-parent', weight: 0.52 })
    }
    for (const relation of node.relations ?? []) {
      addEdge(adjacency, {
        fromKey: bioKey(node.id),
        toKey: bioKey(relation.targetId),
        kind: 'bio-relation',
        relationKind: relation.kind,
        weight: relation.kind === 'part-of' || relation.kind === 'contains' ? 0.5 : 0.9,
        note: relation.note,
      })
    }

    // Only cellular roots bridge directly to anatomy. Deeper structures must
    // remain reachable through an explicit cell -> subcellular -> molecular path.
    if (node.scale === 'cellular') {
      addEdge(adjacency, { fromKey: atlasKey(node.anchorAtlasNodeId), toKey: bioKey(node.id), kind: 'atlas-to-cell', weight: 0.24 })
      addEdge(adjacency, { fromKey: bioKey(node.id), toKey: atlasKey(node.anchorAtlasNodeId), kind: 'cell-to-atlas', weight: 0.78 })
    }
  }

  for (const edges of adjacency.values()) {
    edges.sort((a, b) => a.weight - b.weight || a.toKey.localeCompare(b.toKey) || a.kind.localeCompare(b.kind))
  }
  return { adjacency, steps }
}

function systemAllowed(step: CrossScaleStep, sourceSystem: AtlasSystemId, options: CrossScaleRouteOptions) {
  const allowed = options.allowedSystems?.length ? options.allowedSystems : [sourceSystem]
  return allowed.includes(step.system)
}

function edgeCost(edge: CrossScaleEdge, from: CrossScaleStep, to: CrossScaleStep, strictDrillDown: boolean) {
  let cost = edge.weight
  if (!strictDrillDown) return cost
  const fromRank = combinedScaleRank(from.scale)
  const toRank = combinedScaleRank(to.scale)
  if (toRank < fromRank) cost += 4 + (fromRank - toRank) * 1.25
  else if (toRank > fromRank + 1) cost += 2.5 * (toRank - fromRank - 1)
  if (from.system !== to.system) cost += 6
  return cost
}

/**
 * Multi-domain Dijkstra solver from whole-body anatomy to biological scale.
 * It is deterministic and uses only authored hierarchy/relation/anchor edges.
 */
export function planCrossScaleRoute(
  atlas: AtlasManifest,
  bio: BioScaleManifest,
  fromAtlasNodeId: string,
  toBioNodeId: string,
  options: CrossScaleRouteOptions = {},
): CrossScaleRoute | null {
  const sourceNode = atlasNodeById(atlas, fromAtlasNodeId)
  const targetNode = bioScaleNodeById(bio, toBioNodeId)
  if (!sourceNode || !targetNode) return null

  const { adjacency, steps } = buildCrossScaleAdjacency(atlas, bio)
  const start = atlasKey(fromAtlasNodeId)
  const target = bioKey(toBioNodeId)
  const distance = new Map<string, number>([[start, 0]])
  const previous = new Map<string, CrossScaleEdge>()
  const unvisited = new Set(adjacency.keys())
  const maxVisited = Math.max(16, options.maxVisitedNodes ?? 20_000)
  let visited = 0

  while (unvisited.size && visited < maxVisited) {
    let current: string | undefined
    let best = Number.POSITIVE_INFINITY
    for (const candidate of unvisited) {
      const value = distance.get(candidate) ?? Number.POSITIVE_INFINITY
      if (value < best || (value === best && current !== undefined && candidate < current)) {
        best = value
        current = candidate
      }
    }
    if (!current || !Number.isFinite(best)) break
    unvisited.delete(current)
    visited += 1
    if (current === target) break

    const fromStep = steps.get(current)
    if (!fromStep) continue
    for (const edge of adjacency.get(current) ?? []) {
      if (!unvisited.has(edge.toKey)) continue
      const toStep = steps.get(edge.toKey)
      if (!toStep || !systemAllowed(toStep, sourceNode.system, options)) continue
      const next = best + edgeCost(edge, fromStep, toStep, Boolean(options.strictDrillDown))
      const existing = distance.get(edge.toKey) ?? Number.POSITIVE_INFINITY
      if (next < existing) {
        distance.set(edge.toKey, next)
        previous.set(edge.toKey, edge)
      }
    }
  }

  if (start !== target && !previous.has(target)) return null
  const reversed: CrossScaleEdge[] = []
  let cursor = target
  while (cursor !== start) {
    const edge = previous.get(cursor)
    if (!edge) return null
    reversed.push(edge)
    cursor = edge.fromKey
  }
  const edges = reversed.reverse()
  const routeKeys = [start, ...edges.map((edge) => edge.toKey)]
  const routeSteps = routeKeys.map((routeKey) => steps.get(routeKey)).filter((step): step is CrossScaleStep => Boolean(step))

  const scaleTransitions: { from: CrossScaleValue; to: CrossScaleValue; atId: string }[] = []
  for (let i = 1; i < routeSteps.length; i += 1) {
    const from = routeSteps[i - 1]
    const to = routeSteps[i]
    if (from.scale !== to.scale) scaleTransitions.push({ from: from.scale, to: to.scale, atId: to.id })
  }

  const atlasContext = new Set<string>([fromAtlasNodeId])
  for (const ancestor of atlasAncestors(atlas, fromAtlasNodeId)) atlasContext.add(ancestor.id)
  for (const step of routeSteps) if (step.namespace === 'atlas') atlasContext.add(step.id)

  const bioContext = routeSteps.filter((step) => step.namespace === 'bio').map((step) => step.id)
  const warnings = [
    'Cross-scale route is an educational ontology traversal, not patient-specific anatomy or diagnostic inference.',
    'Cellular/subcellular/molecular representations require source-specific academic review before publication as authoritative biomedical content.',
  ]

  return {
    fromAtlasNodeId,
    toBioNodeId,
    steps: routeSteps,
    edges,
    totalWeight: edges.reduce((sum, edge) => sum + edgeCost(edge, steps.get(edge.fromKey)!, steps.get(edge.toKey)!, Boolean(options.strictDrillDown)), 0),
    atlasContextNodeIds: [...atlasContext],
    bioContextNodeIds: [...new Set(bioContext)],
    scaleTransitions,
    warnings,
  }
}

export function validateCrossScaleRoute(route: CrossScaleRoute, strictDrillDown = false): string[] {
  const issues: string[] = []
  if (!route.steps.length) issues.push('Cross-scale route has no steps.')
  if (route.steps[0]?.namespace !== 'atlas' || route.steps[0]?.id !== route.fromAtlasNodeId) issues.push('Cross-scale route does not begin at the requested atlas node.')
  const end = route.steps[route.steps.length - 1]
  if (end?.namespace !== 'bio' || end?.id !== route.toBioNodeId) issues.push('Cross-scale route does not end at the requested bioscale node.')
  if (route.edges.length !== Math.max(0, route.steps.length - 1)) issues.push('Cross-scale route edge/step cardinality mismatch.')
  if (!Number.isFinite(route.totalWeight) || route.totalWeight < 0) issues.push('Cross-scale route has invalid total weight.')
  if (strictDrillDown) {
    for (let i = 1; i < route.steps.length; i += 1) {
      if (combinedScaleRank(route.steps[i].scale) < combinedScaleRank(route.steps[i - 1].scale)) {
        issues.push(`Strict drill-down route moved to a broader scale: ${route.steps[i - 1].id} -> ${route.steps[i].id}`)
      }
    }
  }
  return [...new Set(issues)]
}
