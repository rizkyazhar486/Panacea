import {
  BODY_ATLAS_GRAPH,
  type BodyAtlasGraph,
  type BodyAtlasLayer,
  type BodyAtlasLaterality,
  type BodyAtlasNode,
} from './bodyAtlasGraph'
import {
  getAnatomySpatialIndex,
  nearestAnatomySpatialNodes,
  queryAnatomyNormalizedPlane,
  unionAnatomySpatialBounds,
  type AnatomySpatialAxis,
  type AnatomySpatialBounds,
  type AnatomySpatialIndex,
  type AnatomySpatialNode,
  type AnatomySpatialVec3,
} from './anatomySpatialRegistry'

export interface BodyAtlasSpatialBinding {
  spatial: AnatomySpatialNode
  atlasNode: BodyAtlasNode | null
}

export interface BodyAtlasSpatialBindingIndex {
  bindings: readonly BodyAtlasSpatialBinding[]
  byAtlasNodeId: ReadonlyMap<string, BodyAtlasSpatialBinding>
  bySpatialKey: ReadonlyMap<string, BodyAtlasSpatialBinding>
  boundCount: number
  unboundCount: number
  loadedFiles: readonly string[]
}

export interface BodyAtlasCrossSectionQuery {
  axis: AnatomySpatialAxis
  normalizedPosition: number
  tolerance?: number
  limit?: number
  layers?: readonly BodyAtlasLayer[]
  lateralities?: readonly BodyAtlasLaterality[]
  regions?: readonly string[]
}

export interface BodyAtlasCrossSectionHit extends BodyAtlasSpatialBinding {
  distanceToPlane: number
  projectedBoxArea: number
}

export interface BodyAtlasCrossSectionResult {
  axis: AnatomySpatialAxis
  normalizedPosition: number
  coordinate: number
  hits: readonly BodyAtlasCrossSectionHit[]
  candidateSemantics: 'aabb-plane-candidate-not-exact-mesh-contour'
}

export interface BodyAtlasNeighborhoodResult {
  center: BodyAtlasSpatialBinding
  neighbors: ReadonlyArray<BodyAtlasSpatialBinding & { distance: number }>
}

export interface BodyAtlasCameraFrame {
  target: AnatomySpatialVec3
  distance: number
  near: number
  far: number
  verticalFovDeg: number
  horizontalFovDeg: number
  boundingRadius: number
}

function spatialKey(file: string, name: string) {
  return `${file}\0${name}`
}

function normalizedRegion(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function bindAnatomySpatialIndexToAtlas(
  spatialIndex: AnatomySpatialIndex = getAnatomySpatialIndex(),
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
): BodyAtlasSpatialBindingIndex {
  const graphBySource = new Map<string, BodyAtlasNode>()
  for (const node of graph.nodes) graphBySource.set(spatialKey(node.sourceFile, node.sourceName), node)

  const bindings = spatialIndex.nodes.map((spatial) => ({
    spatial,
    atlasNode: graphBySource.get(spatialKey(spatial.file, spatial.name)) ?? null,
  }))
  const byAtlasNodeId = new Map<string, BodyAtlasSpatialBinding>()
  const bySpatialKey = new Map<string, BodyAtlasSpatialBinding>()
  let boundCount = 0
  for (const binding of bindings) {
    bySpatialKey.set(spatialKey(binding.spatial.file, binding.spatial.name), binding)
    if (binding.atlasNode) {
      boundCount += 1
      byAtlasNodeId.set(binding.atlasNode.id, binding)
    }
  }

  return {
    bindings,
    byAtlasNodeId,
    bySpatialKey,
    boundCount,
    unboundCount: bindings.length - boundCount,
    loadedFiles: [...new Set(bindings.map((binding) => binding.spatial.file))].sort((a, b) => a.localeCompare(b)),
  }
}

function filterBinding(
  binding: BodyAtlasSpatialBinding,
  query: Pick<BodyAtlasCrossSectionQuery, 'layers' | 'lateralities' | 'regions'>,
) {
  const node = binding.atlasNode
  if (!node) return false
  if (query.layers && !query.layers.includes(node.layer)) return false
  if (query.lateralities && !query.lateralities.includes(node.laterality)) return false
  if (query.regions) {
    const regions = new Set(query.regions.map(normalizedRegion))
    if (!regions.has(normalizedRegion(node.region))) return false
  }
  return true
}

/**
 * Broad-phase cross-section selection over loaded source geometry.
 *
 * AABB-plane intersection is intentionally a broad phase. The returned set is
 * suitable for deciding which named meshes should enter an exact clipping or
 * raycast pass; it must never be presented as a pixel-accurate anatomical
 * contour by itself.
 */
export function queryBodyAtlasCrossSection(
  query: BodyAtlasCrossSectionQuery,
  spatialIndex: AnatomySpatialIndex = getAnatomySpatialIndex(),
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
): BodyAtlasCrossSectionResult {
  const normalizedPosition = Math.max(0, Math.min(Number.isFinite(query.normalizedPosition) ? query.normalizedPosition : 0.5, 1))
  const bindingIndex = bindAnatomySpatialIndexToAtlas(spatialIndex, graph)
  const plane = queryAnatomyNormalizedPlane(query.axis, normalizedPosition, {
    tolerance: query.tolerance,
    limit: Math.max(query.limit ?? 200, spatialIndex.nodes.length || 1),
  }, spatialIndex)

  const hits = plane.hits
    .map((hit) => ({
      binding: bindingIndex.bySpatialKey.get(spatialKey(hit.node.file, hit.node.name)),
      distanceToPlane: hit.distanceToPlane,
      projectedBoxArea: hit.projectedBoxArea,
    }))
    .filter((item): item is { binding: BodyAtlasSpatialBinding; distanceToPlane: number; projectedBoxArea: number } => Boolean(item.binding))
    .filter((item) => filterBinding(item.binding, query))
    .map((item): BodyAtlasCrossSectionHit => ({
      ...item.binding,
      distanceToPlane: item.distanceToPlane,
      projectedBoxArea: item.projectedBoxArea,
    }))
    .sort((a, b) => a.distanceToPlane - b.distanceToPlane
      || b.projectedBoxArea - a.projectedBoxArea
      || (a.atlasNode?.sourceName ?? '').localeCompare(b.atlasNode?.sourceName ?? ''))
    .slice(0, Math.max(1, Math.min(Math.trunc(query.limit ?? 200), 2_000)))

  return {
    axis: query.axis,
    normalizedPosition,
    coordinate: plane.coordinate,
    hits,
    candidateSemantics: 'aabb-plane-candidate-not-exact-mesh-contour',
  }
}

export function queryBodyAtlasNeighborhood(
  atlasNodeId: string,
  options: { maxDistance: number; limit?: number; sameRegion?: boolean; sameLayer?: boolean } = { maxDistance: 0.25 },
  spatialIndex: AnatomySpatialIndex = getAnatomySpatialIndex(),
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
): BodyAtlasNeighborhoodResult | null {
  const bindings = bindAnatomySpatialIndexToAtlas(spatialIndex, graph)
  const center = bindings.byAtlasNodeId.get(atlasNodeId)
  if (!center || !center.atlasNode) return null
  const nearest = nearestAnatomySpatialNodes(center.spatial.center, {
    maxDistance: Math.max(0, options.maxDistance),
    limit: Math.max(2, (options.limit ?? 20) * 4),
  }, spatialIndex)

  const neighbors = nearest
    .map((hit) => ({
      binding: bindings.bySpatialKey.get(spatialKey(hit.node.file, hit.node.name)),
      distance: hit.distance,
    }))
    .filter((item): item is { binding: BodyAtlasSpatialBinding; distance: number } => Boolean(item.binding?.atlasNode))
    .filter((item) => item.binding.atlasNode!.id !== atlasNodeId)
    .filter((item) => !options.sameRegion || normalizedRegion(item.binding.atlasNode!.region) === normalizedRegion(center.atlasNode!.region))
    .filter((item) => !options.sameLayer || item.binding.atlasNode!.layer === center.atlasNode!.layer)
    .sort((a, b) => a.distance - b.distance || a.binding.atlasNode!.sourceName.localeCompare(b.binding.atlasNode!.sourceName))
    .slice(0, Math.max(1, Math.min(Math.trunc(options.limit ?? 20), 200)))
    .map((item) => ({ ...item.binding, distance: item.distance }))

  return { center, neighbors }
}

/**
 * Perspective-camera distance required to contain a bounding sphere in both
 * vertical and horizontal fields of view.
 */
export function computeBodyAtlasCameraFrame(
  bounds: AnatomySpatialBounds,
  options: { verticalFovDeg?: number; aspect?: number; padding?: number } = {},
): BodyAtlasCameraFrame {
  const verticalFovDeg = Math.max(5, Math.min(options.verticalFovDeg ?? 35, 120))
  const aspect = Math.max(Number.isFinite(options.aspect ?? 1) ? options.aspect ?? 1 : 1, 0.1)
  const padding = Math.max(Number.isFinite(options.padding ?? 1.15) ? options.padding ?? 1.15 : 1.15, 1)
  const verticalFov = verticalFovDeg * Math.PI / 180
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
  const limitingFov = Math.min(verticalFov, horizontalFov)
  const radius = Math.hypot(bounds.size[0], bounds.size[1], bounds.size[2]) / 2
  const safeRadius = Math.max(radius, 1e-4)
  const distance = padding * safeRadius / Math.max(Math.sin(limitingFov / 2), 1e-4)
  return {
    target: bounds.center,
    distance,
    near: Math.max(distance - safeRadius * 2.5, 0.001),
    far: Math.max(distance + safeRadius * 6, 1),
    verticalFovDeg,
    horizontalFovDeg: horizontalFov * 180 / Math.PI,
    boundingRadius: radius,
  }
}

export function computeBodyAtlasCameraFrameForNodes(
  nodes: readonly AnatomySpatialNode[],
  options: { verticalFovDeg?: number; aspect?: number; padding?: number } = {},
) {
  const bounds = unionAnatomySpatialBounds(nodes)
  return bounds ? computeBodyAtlasCameraFrame(bounds, options) : null
}

export function validateBodyAtlasSpatialBinding(
  spatialIndex: AnatomySpatialIndex = getAnatomySpatialIndex(),
  graph: BodyAtlasGraph = BODY_ATLAS_GRAPH,
) {
  const binding = bindAnatomySpatialIndexToAtlas(spatialIndex, graph)
  const reasons: string[] = []
  const loadedGraphNamesByFile = new Map<string, Set<string>>()
  for (const node of graph.nodes) {
    const names = loadedGraphNamesByFile.get(node.sourceFile) ?? new Set<string>()
    names.add(node.sourceName)
    loadedGraphNamesByFile.set(node.sourceFile, names)
  }
  for (const entry of binding.bindings) {
    if (!entry.atlasNode && loadedGraphNamesByFile.get(entry.spatial.file)?.has(entry.spatial.name)) {
      reasons.push(`Exact source node failed to bind despite existing in graph: ${entry.spatial.file}:${entry.spatial.name}`)
    }
  }
  if (binding.boundCount + binding.unboundCount !== binding.bindings.length) reasons.push('Spatial binding counts are inconsistent.')
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)], binding }
}
