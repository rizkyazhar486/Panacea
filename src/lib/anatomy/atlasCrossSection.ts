import type { AnatomyAtlasNode, AtlasAabb, AtlasVec3 } from './atlasTypes.ts'
import {
  addVec3,
  crossVec3,
  dotVec3,
  lengthVec3,
  normalizeVec3,
  scaleVec3,
  subtractVec3,
} from './atlasCoordinateFrame.ts'

export type AtlasSectionKind = 'axial' | 'coronal' | 'sagittal' | 'oblique'

export interface AtlasSectionPlane {
  kind: AtlasSectionKind
  origin: AtlasVec3
  normal: AtlasVec3
  thickness: number
  scope: 'generic-atlas'
}

export interface AtlasSectionHit {
  node: AnatomyAtlasNode
  signedCenterDistance: number
  projectedRadius: number
}

export interface PlaneCoordinates {
  u: number
  v: number
  signedDistance: number
}

function finitePoint(point: AtlasVec3) {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)
}

export function createAtlasSectionPlane(
  kind: AtlasSectionKind,
  offset = 0,
  thickness = 0,
  obliqueNormal?: AtlasVec3,
): AtlasSectionPlane {
  if (!Number.isFinite(offset)) throw new Error('Atlas section offset must be finite.')
  if (!(thickness >= 0) || !Number.isFinite(thickness)) throw new Error('Atlas section thickness must be finite and non-negative.')

  let normal: AtlasVec3
  switch (kind) {
    case 'axial': normal = { x: 0, y: 1, z: 0 }; break
    case 'coronal': normal = { x: 0, y: 0, z: 1 }; break
    case 'sagittal': normal = { x: 1, y: 0, z: 0 }; break
    case 'oblique':
      if (!obliqueNormal || !finitePoint(obliqueNormal)) throw new Error('Oblique atlas section requires a finite normal vector.')
      normal = normalizeVec3(obliqueNormal)
      break
    default: {
      const exhaustive: never = kind
      throw new Error(`Unsupported atlas section kind: ${exhaustive}`)
    }
  }

  return {
    kind,
    origin: scaleVec3(normal, offset),
    normal,
    thickness,
    scope: 'generic-atlas',
  }
}

export function signedDistanceToPlane(point: AtlasVec3, plane: AtlasSectionPlane) {
  return dotVec3(subtractVec3(point, plane.origin), plane.normal)
}

export function projectPointToPlane(point: AtlasVec3, plane: AtlasSectionPlane): AtlasVec3 {
  return subtractVec3(point, scaleVec3(plane.normal, signedDistanceToPlane(point, plane)))
}

export function planeBasis(plane: AtlasSectionPlane): { u: AtlasVec3; v: AtlasVec3 } {
  const normal = normalizeVec3(plane.normal)
  const reference = Math.abs(normal.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
  const u = normalizeVec3(crossVec3(reference, normal))
  const v = normalizeVec3(crossVec3(normal, u))
  return { u, v }
}

export function pointInPlaneCoordinates(point: AtlasVec3, plane: AtlasSectionPlane): PlaneCoordinates {
  const projected = projectPointToPlane(point, plane)
  const relative = subtractVec3(projected, plane.origin)
  const basis = planeBasis(plane)
  return {
    u: dotVec3(relative, basis.u),
    v: dotVec3(relative, basis.v),
    signedDistance: signedDistanceToPlane(point, plane),
  }
}

function aabbCenterAndExtents(bounds: AtlasAabb) {
  return {
    center: {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2,
      z: (bounds.min.z + bounds.max.z) / 2,
    },
    extents: {
      x: (bounds.max.x - bounds.min.x) / 2,
      y: (bounds.max.y - bounds.min.y) / 2,
      z: (bounds.max.z - bounds.min.z) / 2,
    },
  }
}

/**
 * Plane/AABB slab test using the projection-radius form of the separating-axis
 * theorem. `thickness` turns the plane into a finite slab and is useful for
 * educational cross-sections that need a small selectable depth around the
 * visible slice.
 */
export function sectionIntersectsAabb(plane: AtlasSectionPlane, bounds: AtlasAabb) {
  const normal = normalizeVec3(plane.normal)
  const { center, extents } = aabbCenterAndExtents(bounds)
  const radius = Math.abs(normal.x) * extents.x
    + Math.abs(normal.y) * extents.y
    + Math.abs(normal.z) * extents.z
  const distance = signedDistanceToPlane(center, { ...plane, normal })
  return Math.abs(distance) <= radius + plane.thickness / 2
}

export function queryNodesForSection(nodes: readonly AnatomyAtlasNode[], plane: AtlasSectionPlane): readonly AtlasSectionHit[] {
  const normal = normalizeVec3(plane.normal)
  const hits: AtlasSectionHit[] = []
  for (const node of nodes) {
    if (!node.spatialBounds) continue
    const { center, extents } = aabbCenterAndExtents(node.spatialBounds)
    const projectedRadius = Math.abs(normal.x) * extents.x
      + Math.abs(normal.y) * extents.y
      + Math.abs(normal.z) * extents.z
    const signedCenterDistance = signedDistanceToPlane(center, { ...plane, normal })
    if (Math.abs(signedCenterDistance) <= projectedRadius + plane.thickness / 2) {
      hits.push({ node, signedCenterDistance, projectedRadius })
    }
  }
  return hits.sort((a, b) =>
    Math.abs(a.signedCenterDistance) - Math.abs(b.signedCenterDistance)
    || a.node.id.localeCompare(b.node.id),
  )
}

export function moveSectionPlane(plane: AtlasSectionPlane, delta: number): AtlasSectionPlane {
  if (!Number.isFinite(delta)) throw new Error('Atlas section movement must be finite.')
  return { ...plane, origin: addVec3(plane.origin, scaleVec3(normalizeVec3(plane.normal), delta)) }
}

export function sectionNormalLength(plane: AtlasSectionPlane) {
  return lengthVec3(plane.normal)
}
