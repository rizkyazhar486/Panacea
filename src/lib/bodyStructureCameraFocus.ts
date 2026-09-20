export interface BodyStructureFocusPoint {
  x: number
  y: number
  z: number
}

export interface BodyStructureFocusBounds {
  min: BodyStructureFocusPoint
  max: BodyStructureFocusPoint
}

export interface BodyStructureCameraFocus {
  target: BodyStructureFocusPoint
  position: BodyStructureFocusPoint
  span: number
}

/**
 * Frames exact source-mesh bounds while preserving the user's current view
 * direction. Degenerate source bounds stay finite instead of producing NaN.
 */
export function bodyStructureCameraFocus(
  bounds: BodyStructureFocusBounds,
  cameraPosition: BodyStructureFocusPoint,
  padding = 2.25,
): BodyStructureCameraFocus {
  const target = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  }
  const span = Math.max(
    Math.abs(bounds.max.x - bounds.min.x),
    Math.abs(bounds.max.y - bounds.min.y),
    Math.abs(bounds.max.z - bounds.min.z),
    0.01,
  )
  let x = cameraPosition.x - target.x
  let y = cameraPosition.y - target.y
  let z = cameraPosition.z - target.z
  let length = Math.hypot(x, y, z)
  if (!Number.isFinite(length) || length < 1e-6) {
    x = 0.25
    y = 0.08
    z = 2.25
    length = Math.hypot(x, y, z)
  }
  const distance = span * Math.max(1, Number.isFinite(padding) ? padding : 2.25)
  return {
    target,
    position: {
      x: target.x + (x / length) * distance,
      y: target.y + (y / length) * distance,
      z: target.z + (z / length) * distance,
    },
    span,
  }
}
