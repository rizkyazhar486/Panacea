import type { AtlasAabb, AtlasVec3 } from './atlasTypes.ts'

export interface AtlasCoordinateFrame {
  id: string
  origin: AtlasVec3
  right: AtlasVec3
  superior: AtlasVec3
  anterior: AtlasVec3
  scope: 'generic-atlas'
  note: string
}

export interface CoordinateFrameValidation {
  valid: boolean
  errors: readonly string[]
}

const EPSILON = 1e-6

export function addVec3(a: AtlasVec3, b: AtlasVec3): AtlasVec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function subtractVec3(a: AtlasVec3, b: AtlasVec3): AtlasVec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function scaleVec3(v: AtlasVec3, scalar: number): AtlasVec3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar }
}

export function dotVec3(a: AtlasVec3, b: AtlasVec3) {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

export function crossVec3(a: AtlasVec3, b: AtlasVec3): AtlasVec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

export function lengthVec3(v: AtlasVec3) {
  return Math.hypot(v.x, v.y, v.z)
}

export function normalizeVec3(v: AtlasVec3): AtlasVec3 {
  const length = lengthVec3(v)
  if (!(length > EPSILON)) throw new Error('Cannot normalize a zero-length atlas vector.')
  return scaleVec3(v, 1 / length)
}

function near(a: number, b: number, tolerance = 1e-5) {
  return Math.abs(a - b) <= tolerance
}

export function validateAtlasCoordinateFrame(frame: AtlasCoordinateFrame): CoordinateFrameValidation {
  const errors: string[] = []
  if (!frame.id.trim()) errors.push('Atlas coordinate frame id is blank.')
  if (frame.scope !== 'generic-atlas') errors.push('Atlas coordinate frames in this module must remain generic-atlas scope.')

  const axes = [frame.right, frame.superior, frame.anterior]
  if (axes.some((axis) => !Number.isFinite(axis.x) || !Number.isFinite(axis.y) || !Number.isFinite(axis.z))) {
    errors.push('Atlas coordinate frame contains a non-finite axis component.')
  }
  if (![frame.origin.x, frame.origin.y, frame.origin.z].every(Number.isFinite)) {
    errors.push('Atlas coordinate frame contains a non-finite origin component.')
  }

  if (!near(lengthVec3(frame.right), 1)) errors.push('Atlas right axis must be unit length.')
  if (!near(lengthVec3(frame.superior), 1)) errors.push('Atlas superior axis must be unit length.')
  if (!near(lengthVec3(frame.anterior), 1)) errors.push('Atlas anterior axis must be unit length.')
  if (!near(dotVec3(frame.right, frame.superior), 0)) errors.push('Atlas right and superior axes must be orthogonal.')
  if (!near(dotVec3(frame.right, frame.anterior), 0)) errors.push('Atlas right and anterior axes must be orthogonal.')
  if (!near(dotVec3(frame.superior, frame.anterior), 0)) errors.push('Atlas superior and anterior axes must be orthogonal.')

  const expectedAnterior = crossVec3(frame.right, frame.superior)
  if (!near(dotVec3(expectedAnterior, frame.anterior), 1)) {
    errors.push('Atlas coordinate frame must be right-handed: right × superior = anterior.')
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] }
}

export function assertAtlasCoordinateFrame(frame: AtlasCoordinateFrame) {
  const validation = validateAtlasCoordinateFrame(frame)
  if (!validation.valid) throw new Error(`Invalid atlas coordinate frame:\n${validation.errors.join('\n')}`)
  return frame
}

export const CANONICAL_GENERIC_ATLAS_FRAME: AtlasCoordinateFrame = assertAtlasCoordinateFrame({
  id: 'panacea-generic-rsa-v1',
  origin: { x: 0, y: 0, z: 0 },
  right: { x: 1, y: 0, z: 0 },
  superior: { x: 0, y: 1, z: 0 },
  anterior: { x: 0, y: 0, z: 1 },
  scope: 'generic-atlas',
  note: 'Generic educational atlas coordinates only. This is not a patient, scanner, DICOM, or surgical-navigation registration frame.',
})

export function worldToAtlas(point: AtlasVec3, frame: AtlasCoordinateFrame): AtlasVec3 {
  assertAtlasCoordinateFrame(frame)
  const relative = subtractVec3(point, frame.origin)
  return {
    x: dotVec3(relative, frame.right),
    y: dotVec3(relative, frame.superior),
    z: dotVec3(relative, frame.anterior),
  }
}

export function atlasToWorld(point: AtlasVec3, frame: AtlasCoordinateFrame): AtlasVec3 {
  assertAtlasCoordinateFrame(frame)
  return addVec3(
    frame.origin,
    addVec3(
      scaleVec3(frame.right, point.x),
      addVec3(scaleVec3(frame.superior, point.y), scaleVec3(frame.anterior, point.z)),
    ),
  )
}

function aabbCorners(bounds: AtlasAabb): AtlasVec3[] {
  const { min, max } = bounds
  return [
    { x: min.x, y: min.y, z: min.z },
    { x: min.x, y: min.y, z: max.z },
    { x: min.x, y: max.y, z: min.z },
    { x: min.x, y: max.y, z: max.z },
    { x: max.x, y: min.y, z: min.z },
    { x: max.x, y: min.y, z: max.z },
    { x: max.x, y: max.y, z: min.z },
    { x: max.x, y: max.y, z: max.z },
  ]
}

export function worldAabbToAtlas(bounds: AtlasAabb, frame: AtlasCoordinateFrame): AtlasAabb {
  const transformed = aabbCorners(bounds).map((corner) => worldToAtlas(corner, frame))
  return transformed.reduce<AtlasAabb>((acc, point) => ({
    min: {
      x: Math.min(acc.min.x, point.x),
      y: Math.min(acc.min.y, point.y),
      z: Math.min(acc.min.z, point.z),
    },
    max: {
      x: Math.max(acc.max.x, point.x),
      y: Math.max(acc.max.y, point.y),
      z: Math.max(acc.max.z, point.z),
    },
  }), {
    min: { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY, z: Number.POSITIVE_INFINITY },
    max: { x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY, z: Number.NEGATIVE_INFINITY },
  })
}
