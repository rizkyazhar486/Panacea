import type { AnatomyAtlasNode, AnatomyRegion, AnatomySystem, AtlasAabb, AtlasVec3 } from './atlasTypes.ts'

export interface SpatialQueryOptions {
  system?: AnatomySystem
  region?: AnatomyRegion
  maxDistance?: number
}

export interface SpatialHit {
  node: AnatomyAtlasNode
  distance: number
}

export function isValidAabb(bounds: AtlasAabb) {
  return Number.isFinite(bounds.min.x)
    && Number.isFinite(bounds.min.y)
    && Number.isFinite(bounds.min.z)
    && Number.isFinite(bounds.max.x)
    && Number.isFinite(bounds.max.y)
    && Number.isFinite(bounds.max.z)
    && bounds.min.x <= bounds.max.x
    && bounds.min.y <= bounds.max.y
    && bounds.min.z <= bounds.max.z
}

export function aabbCenter(bounds: AtlasAabb): AtlasVec3 {
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  }
}

export function aabbContainsPoint(bounds: AtlasAabb, point: AtlasVec3) {
  return point.x >= bounds.min.x && point.x <= bounds.max.x
    && point.y >= bounds.min.y && point.y <= bounds.max.y
    && point.z >= bounds.min.z && point.z <= bounds.max.z
}

export function aabbIntersects(a: AtlasAabb, b: AtlasAabb) {
  return a.min.x <= b.max.x && a.max.x >= b.min.x
    && a.min.y <= b.max.y && a.max.y >= b.min.y
    && a.min.z <= b.max.z && a.max.z >= b.min.z
}

export function distanceToAabb(point: AtlasVec3, bounds: AtlasAabb) {
  const dx = Math.max(bounds.min.x - point.x, 0, point.x - bounds.max.x)
  const dy = Math.max(bounds.min.y - point.y, 0, point.y - bounds.max.y)
  const dz = Math.max(bounds.min.z - point.z, 0, point.z - bounds.max.z)
  return Math.hypot(dx, dy, dz)
}

function matches(node: AnatomyAtlasNode, options: SpatialQueryOptions) {
  if (options.system && node.system !== options.system) return false
  if (options.region && !node.regions.includes(options.region)) return false
  return true
}

/**
 * Read-only spatial index for atlas nodes with verified/registered bounds.
 *
 * This intentionally does not infer bounds from labels. Nodes without a bound
 * stay absent from spatial queries until a renderer/source pipeline publishes
 * one. That makes selection and clinical overlays fail closed rather than
 * guessing where an anatomical structure should be.
 */
export class AtlasSpatialIndex {
  private readonly bounded: readonly { node: AnatomyAtlasNode; bounds: AtlasAabb }[]

  constructor(nodes: readonly AnatomyAtlasNode[]) {
    this.bounded = nodes.flatMap((node) => {
      if (!node.spatialBounds) return []
      if (!isValidAabb(node.spatialBounds)) throw new Error(`Invalid spatial bounds for atlas node ${node.id}.`)
      return [{ node, bounds: node.spatialBounds }]
    })
  }

  get size() {
    return this.bounded.length
  }

  containing(point: AtlasVec3, options: SpatialQueryOptions = {}) {
    return this.bounded
      .filter(({ node, bounds }) => matches(node, options) && aabbContainsPoint(bounds, point))
      .map(({ node }) => node)
      .sort((a, b) => a.id.localeCompare(b.id))
  }

  intersecting(bounds: AtlasAabb, options: SpatialQueryOptions = {}) {
    if (!isValidAabb(bounds)) throw new Error('Spatial query requires a valid AABB.')
    return this.bounded
      .filter(({ node, bounds: candidate }) => matches(node, options) && aabbIntersects(candidate, bounds))
      .map(({ node }) => node)
      .sort((a, b) => a.id.localeCompare(b.id))
  }

  nearest(point: AtlasVec3, options: SpatialQueryOptions = {}): SpatialHit | undefined {
    const maxDistance = options.maxDistance ?? Number.POSITIVE_INFINITY
    let best: SpatialHit | undefined
    for (const { node, bounds } of this.bounded) {
      if (!matches(node, options)) continue
      const distance = distanceToAabb(point, bounds)
      if (distance > maxDistance) continue
      if (!best || distance < best.distance || (distance === best.distance && node.id < best.node.id)) {
        best = { node, distance }
      }
    }
    return best
  }
}
