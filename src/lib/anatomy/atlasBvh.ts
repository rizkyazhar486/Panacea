import type { AnatomyAtlasNode, AtlasAabb, AtlasVec3 } from './atlasTypes.ts'
import { aabbIntersects, distanceToAabb, isValidAabb } from './spatialIndex.ts'
import { normalizeVec3 } from './atlasCoordinateFrame.ts'
import { sectionIntersectsAabb, type AtlasSectionPlane } from './atlasCrossSection.ts'

export interface AtlasRay {
  origin: AtlasVec3
  direction: AtlasVec3
}

export interface AtlasRayHit {
  node: AnatomyAtlasNode
  distance: number
  exitDistance: number
}

export interface AtlasBvhStats {
  boundedNodes: number
  treeNodes: number
  leafNodes: number
  maxDepth: number
  maxLeafSize: number
}

interface BoundedEntry {
  node: AnatomyAtlasNode
  bounds: AtlasAabb
}

interface BvhNode {
  bounds: AtlasAabb
  depth: number
  left?: BvhNode
  right?: BvhNode
  entries?: readonly BoundedEntry[]
}

function unionBounds(entries: readonly BoundedEntry[]): AtlasAabb {
  if (!entries.length) throw new Error('BVH node cannot be built from an empty entry list.')
  return entries.reduce<AtlasAabb>((acc, entry) => ({
    min: {
      x: Math.min(acc.min.x, entry.bounds.min.x),
      y: Math.min(acc.min.y, entry.bounds.min.y),
      z: Math.min(acc.min.z, entry.bounds.min.z),
    },
    max: {
      x: Math.max(acc.max.x, entry.bounds.max.x),
      y: Math.max(acc.max.y, entry.bounds.max.y),
      z: Math.max(acc.max.z, entry.bounds.max.z),
    },
  }), {
    min: { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY, z: Number.POSITIVE_INFINITY },
    max: { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY, z: Number.NEGATIVE_INFINITY },
  })
}

function centerAxis(bounds: AtlasAabb, axis: 'x' | 'y' | 'z') {
  return (bounds.min[axis] + bounds.max[axis]) / 2
}

function longestAxis(bounds: AtlasAabb): 'x' | 'y' | 'z' {
  const extents = {
    x: bounds.max.x - bounds.min.x,
    y: bounds.max.y - bounds.min.y,
    z: bounds.max.z - bounds.min.z,
  }
  return (['x', 'y', 'z'] as const).sort((a, b) => extents[b] - extents[a] || a.localeCompare(b))[0]
}

function buildNode(entries: readonly BoundedEntry[], maxLeafSize: number, depth: number): BvhNode {
  const bounds = unionBounds(entries)
  if (entries.length <= maxLeafSize) return { bounds, depth, entries: [...entries] }

  const axis = longestAxis(bounds)
  const sorted = [...entries].sort((a, b) =>
    centerAxis(a.bounds, axis) - centerAxis(b.bounds, axis) || a.node.id.localeCompare(b.node.id),
  )
  const midpoint = Math.floor(sorted.length / 2)
  return {
    bounds,
    depth,
    left: buildNode(sorted.slice(0, midpoint), maxLeafSize, depth + 1),
    right: buildNode(sorted.slice(midpoint), maxLeafSize, depth + 1),
  }
}

export function rayAabbInterval(ray: AtlasRay, bounds: AtlasAabb, maxDistance = Number.POSITIVE_INFINITY) {
  const direction = normalizeVec3(ray.direction)
  let tMin = 0
  let tMax = maxDistance

  for (const axis of ['x', 'y', 'z'] as const) {
    const origin = ray.origin[axis]
    const delta = direction[axis]
    if (Math.abs(delta) < 1e-12) {
      if (origin < bounds.min[axis] || origin > bounds.max[axis]) return undefined
      continue
    }
    const inv = 1 / delta
    let near = (bounds.min[axis] - origin) * inv
    let far = (bounds.max[axis] - origin) * inv
    if (near > far) [near, far] = [far, near]
    tMin = Math.max(tMin, near)
    tMax = Math.min(tMax, far)
    if (tMin > tMax) return undefined
  }

  if (tMax < 0) return undefined
  return { entry: Math.max(0, tMin), exit: tMax }
}

/**
 * Object-level BVH for anatomy bounds. Triangle-level mesh BVHs remain a
 * renderer concern; this index accelerates semantic selection, cross-section
 * candidate discovery and nearest-structure queries across thousands of atlas
 * nodes without inventing bounds for unregistered structures.
 */
export class AtlasBvh {
  private readonly root?: BvhNode
  private readonly statsValue: AtlasBvhStats

  constructor(nodes: readonly AnatomyAtlasNode[], maxLeafSize = 8) {
    if (!Number.isInteger(maxLeafSize) || maxLeafSize < 1) throw new Error('Atlas BVH maxLeafSize must be a positive integer.')
    const entries = nodes.flatMap((node): BoundedEntry[] => {
      if (!node.spatialBounds) return []
      if (!isValidAabb(node.spatialBounds)) throw new Error(`Invalid spatial bounds for atlas BVH node ${node.id}.`)
      return [{ node, bounds: node.spatialBounds }]
    }).sort((a, b) => a.node.id.localeCompare(b.node.id))

    this.root = entries.length ? buildNode(entries, maxLeafSize, 0) : undefined
    let treeNodes = 0
    let leafNodes = 0
    let maxDepth = 0
    const stack = this.root ? [this.root] : []
    while (stack.length) {
      const current = stack.pop()!
      treeNodes += 1
      maxDepth = Math.max(maxDepth, current.depth)
      if (current.entries) leafNodes += 1
      if (current.left) stack.push(current.left)
      if (current.right) stack.push(current.right)
    }
    this.statsValue = { boundedNodes: entries.length, treeNodes, leafNodes, maxDepth, maxLeafSize }
  }

  get stats() {
    return this.statsValue
  }

  queryAabb(bounds: AtlasAabb) {
    if (!isValidAabb(bounds)) throw new Error('Atlas BVH query requires a valid AABB.')
    if (!this.root) return []
    const hits: AnatomyAtlasNode[] = []
    const stack = [this.root]
    while (stack.length) {
      const current = stack.pop()!
      if (!aabbIntersects(current.bounds, bounds)) continue
      if (current.entries) {
        for (const entry of current.entries) if (aabbIntersects(entry.bounds, bounds)) hits.push(entry.node)
      } else {
        if (current.left) stack.push(current.left)
        if (current.right) stack.push(current.right)
      }
    }
    return hits.sort((a, b) => a.id.localeCompare(b.id))
  }

  querySection(plane: AtlasSectionPlane) {
    if (!this.root) return []
    const hits: AnatomyAtlasNode[] = []
    const stack = [this.root]
    while (stack.length) {
      const current = stack.pop()!
      if (!sectionIntersectsAabb(plane, current.bounds)) continue
      if (current.entries) {
        for (const entry of current.entries) if (sectionIntersectsAabb(plane, entry.bounds)) hits.push(entry.node)
      } else {
        if (current.left) stack.push(current.left)
        if (current.right) stack.push(current.right)
      }
    }
    return hits.sort((a, b) => a.id.localeCompare(b.id))
  }

  raycast(ray: AtlasRay, maxDistance = Number.POSITIVE_INFINITY) {
    if (!this.root) return []
    const direction = normalizeVec3(ray.direction)
    const normalizedRay = { origin: ray.origin, direction }
    const hits: AtlasRayHit[] = []
    const stack = [this.root]
    while (stack.length) {
      const current = stack.pop()!
      if (!rayAabbInterval(normalizedRay, current.bounds, maxDistance)) continue
      if (current.entries) {
        for (const entry of current.entries) {
          const interval = rayAabbInterval(normalizedRay, entry.bounds, maxDistance)
          if (interval) hits.push({ node: entry.node, distance: interval.entry, exitDistance: interval.exit })
        }
      } else {
        if (current.left) stack.push(current.left)
        if (current.right) stack.push(current.right)
      }
    }
    return hits.sort((a, b) => a.distance - b.distance || a.node.id.localeCompare(b.node.id))
  }

  nearest(point: AtlasVec3, maxDistance = Number.POSITIVE_INFINITY) {
    if (!this.root) return undefined
    let best: { node: AnatomyAtlasNode; distance: number } | undefined
    const stack = [this.root]
    while (stack.length) {
      stack.sort((a, b) => distanceToAabb(point, b.bounds) - distanceToAabb(point, a.bounds))
      const current = stack.pop()!
      const nodeDistance = distanceToAabb(point, current.bounds)
      const bestDistance = best?.distance ?? maxDistance
      if (nodeDistance > bestDistance) continue

      if (current.entries) {
        for (const entry of current.entries) {
          const distance = distanceToAabb(point, entry.bounds)
          if (distance > (best?.distance ?? maxDistance)) continue
          if (!best || distance < best.distance || (distance === best.distance && entry.node.id < best.node.id)) {
            best = { node: entry.node, distance }
          }
        }
      } else {
        if (current.left) stack.push(current.left)
        if (current.right) stack.push(current.right)
      }
    }
    return best
  }
}
