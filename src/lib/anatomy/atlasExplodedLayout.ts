import type { AnatomyAtlasNode, AtlasAabb, AtlasVec3 } from './atlasTypes.ts'
import { addVec3, lengthVec3, normalizeVec3, scaleVec3, subtractVec3 } from './atlasCoordinateFrame.ts'

export interface ExplodedLayoutOptions {
  spacing: number
  hierarchyWeight: number
  collisionPadding: number
  maxRelaxationIterations: number
}

export interface ExplodedNodeTransform {
  nodeId: string
  offset: AtlasVec3
  sourceCenter: AtlasVec3
  hierarchyDepth: number
}

export interface ExplodedLayout {
  transforms: readonly ExplodedNodeTransform[]
  sourceBounds: AtlasAabb
  iterations: number
}

export const DEFAULT_EXPLODED_LAYOUT_OPTIONS: ExplodedLayoutOptions = {
  spacing: 2.5,
  hierarchyWeight: 0.15,
  collisionPadding: 0.15,
  maxRelaxationIterations: 12,
}

function centerOf(bounds: AtlasAabb): AtlasVec3 {
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  }
}

function unionBounds(bounds: readonly AtlasAabb[]): AtlasAabb {
  if (!bounds.length) throw new Error('Exploded layout requires at least one bounded atlas node.')
  return bounds.reduce<AtlasAabb>((acc, item) => ({
    min: {
      x: Math.min(acc.min.x, item.min.x),
      y: Math.min(acc.min.y, item.min.y),
      z: Math.min(acc.min.z, item.min.z),
    },
    max: {
      x: Math.max(acc.max.x, item.max.x),
      y: Math.max(acc.max.y, item.max.y),
      z: Math.max(acc.max.z, item.max.z),
    },
  }), {
    min: { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY, z: Number.POSITIVE_INFINITY },
    max: { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY, z: Number.NEGATIVE_INFINITY },
  })
}

function deterministicDirection(id: string): AtlasVec3 {
  let hash = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const a = ((hash >>> 0) % 1009) / 1009 * Math.PI * 2
  const b = (((hash >>> 10) % 503) / 503 - 0.5) * Math.PI
  const cosB = Math.cos(b)
  return normalizeVec3({ x: cosB * Math.cos(a), y: Math.sin(b), z: cosB * Math.sin(a) })
}

function depthFor(node: AnatomyAtlasNode, byId: ReadonlyMap<string, AnatomyAtlasNode>) {
  let depth = 0
  let cursor: AnatomyAtlasNode | undefined = node
  const seen = new Set<string>()
  while (cursor?.parentId) {
    if (seen.has(cursor.id)) break
    seen.add(cursor.id)
    const parent = byId.get(cursor.parentId)
    if (!parent) break
    depth += 1
    cursor = parent
  }
  return depth
}

export function translateAabb(bounds: AtlasAabb, offset: AtlasVec3): AtlasAabb {
  return {
    min: addVec3(bounds.min, offset),
    max: addVec3(bounds.max, offset),
  }
}

function paddedOverlap(a: AtlasAabb, b: AtlasAabb, padding: number) {
  const overlapX = Math.min(a.max.x + padding, b.max.x + padding) - Math.max(a.min.x - padding, b.min.x - padding)
  const overlapY = Math.min(a.max.y + padding, b.max.y + padding) - Math.max(a.min.y - padding, b.min.y - padding)
  const overlapZ = Math.min(a.max.z + padding, b.max.z + padding) - Math.max(a.min.z - padding, b.min.z - padding)
  if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return undefined
  return { x: overlapX, y: overlapY, z: overlapZ }
}

function separationVector(
  aId: string,
  aBounds: AtlasAabb,
  bId: string,
  bBounds: AtlasAabb,
  overlap: AtlasVec3,
): AtlasVec3 {
  const aCenter = centerOf(aBounds)
  const bCenter = centerOf(bBounds)
  const delta = subtractVec3(bCenter, aCenter)
  const candidates = [
    { axis: 'x' as const, overlap: overlap.x },
    { axis: 'y' as const, overlap: overlap.y },
    { axis: 'z' as const, overlap: overlap.z },
  ].sort((left, right) => left.overlap - right.overlap || left.axis.localeCompare(right.axis))
  const axis = candidates[0].axis
  const signFromDelta = delta[axis] === 0 ? (aId < bId ? 1 : -1) : Math.sign(delta[axis])
  const magnitude = candidates[0].overlap / 2 + 1e-4
  return {
    x: axis === 'x' ? signFromDelta * magnitude : 0,
    y: axis === 'y' ? signFromDelta * magnitude : 0,
    z: axis === 'z' ? signFromDelta * magnitude : 0,
  }
}

/**
 * Compute a renderer-neutral exploded view from published spatial bounds.
 *
 * The engine never invents anatomical coordinates: nodes without bounds are
 * skipped. Initial displacement is radial from the aggregate body bounds, then
 * a deterministic pairwise relaxation resolves remaining AABB collisions.
 */
export function buildExplodedAtlasLayout(
  nodes: readonly AnatomyAtlasNode[],
  options: Partial<ExplodedLayoutOptions> = {},
): ExplodedLayout {
  const config = { ...DEFAULT_EXPLODED_LAYOUT_OPTIONS, ...options }
  if (!(config.spacing >= 0) || !(config.hierarchyWeight >= 0) || !(config.collisionPadding >= 0)) {
    throw new Error('Exploded layout distances must be non-negative.')
  }
  if (!Number.isInteger(config.maxRelaxationIterations) || config.maxRelaxationIterations < 0) {
    throw new Error('Exploded layout maxRelaxationIterations must be a non-negative integer.')
  }

  const bounded = nodes
    .filter((node): node is AnatomyAtlasNode & { spatialBounds: AtlasAabb } => Boolean(node.spatialBounds))
    .sort((a, b) => a.id.localeCompare(b.id))
  const sourceBounds = unionBounds(bounded.map((node) => node.spatialBounds))
  const globalCenter = centerOf(sourceBounds)
  const byId = new Map(nodes.map((node) => [node.id, node] as const))
  const offsets = new Map<string, AtlasVec3>()

  for (const node of bounded) {
    const nodeCenter = centerOf(node.spatialBounds)
    const radial = subtractVec3(nodeCenter, globalCenter)
    const direction = lengthVec3(radial) > 1e-8 ? normalizeVec3(radial) : deterministicDirection(node.id)
    const depth = depthFor(node, byId)
    offsets.set(node.id, scaleVec3(direction, config.spacing * (1 + depth * config.hierarchyWeight)))
  }

  let iterations = 0
  for (; iterations < config.maxRelaxationIterations; iterations += 1) {
    let moved = false
    for (let i = 0; i < bounded.length; i += 1) {
      for (let j = i + 1; j < bounded.length; j += 1) {
        const a = bounded[i]
        const b = bounded[j]
        const aOffset = offsets.get(a.id)!
        const bOffset = offsets.get(b.id)!
        const aBounds = translateAabb(a.spatialBounds, aOffset)
        const bBounds = translateAabb(b.spatialBounds, bOffset)
        const overlap = paddedOverlap(aBounds, bBounds, config.collisionPadding)
        if (!overlap) continue
        const push = separationVector(a.id, aBounds, b.id, bBounds, overlap)
        offsets.set(a.id, subtractVec3(aOffset, push))
        offsets.set(b.id, addVec3(bOffset, push))
        moved = true
      }
    }
    if (!moved) break
  }

  return {
    sourceBounds,
    iterations,
    transforms: bounded.map((node) => ({
      nodeId: node.id,
      offset: offsets.get(node.id)!,
      sourceCenter: centerOf(node.spatialBounds),
      hierarchyDepth: depthFor(node, byId),
    })),
  }
}

export function interpolateExplodedOffset(transform: ExplodedNodeTransform, progress: number): AtlasVec3 {
  const t = Math.min(1, Math.max(0, progress))
  return scaleVec3(transform.offset, t)
}
