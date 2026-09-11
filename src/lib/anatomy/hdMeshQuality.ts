import type { HdAnatomyLod } from './hdAnatomyContract'

export interface HdMeshQualityBudget {
  lod: HdAnatomyLod
  maxSimplificationErrorFraction: number
  maxDegenerateTriangleFraction: number
  minNamedBoundaryRetention: number
}

/**
 * Technical rendering tolerances, not claims of medical accuracy.
 *
 * Error is normalized to the source mesh bounding-box diagonal so the same gate
 * can be applied across structures of different physical sizes. Anatomical
 * verification still requires source evidence and qualified review separately.
 */
export const HD_MESH_QUALITY_BUDGETS: readonly HdMeshQualityBudget[] = [
  {
    lod: 'overview',
    maxSimplificationErrorFraction: 0.02,
    maxDegenerateTriangleFraction: 0.0005,
    minNamedBoundaryRetention: 1,
  },
  {
    lod: 'organ',
    maxSimplificationErrorFraction: 0.008,
    maxDegenerateTriangleFraction: 0.0002,
    minNamedBoundaryRetention: 1,
  },
  {
    lod: 'detail',
    maxSimplificationErrorFraction: 0.002,
    maxDegenerateTriangleFraction: 0.0001,
    minNamedBoundaryRetention: 1,
  },
] as const

export interface HdMeshQualityObservation {
  assetId: string
  lod: HdAnatomyLod
  vertexCount: number
  triangleCount: number
  sourceBoundingDiagonal: number
  maxSurfaceError: number
  degenerateTriangleCount: number
  invalidNormalCount: number
  selfIntersectionCount: number
  unintendedBoundaryEdgeCount: number
  namedBoundaryCount: number
  retainedNamedBoundaryCount: number
  leftRightIdentityPreserved: boolean
  anatomicalAxesPreserved: boolean
  sourceTransformPreserved: boolean
}

export interface HdMeshQualityResult {
  passesTechnicalHdGate: boolean
  simplificationErrorFraction: number
  degenerateTriangleFraction: number
  namedBoundaryRetention: number
  reasons: string[]
}

function finiteNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0
}

function budgetFor(lod: HdAnatomyLod) {
  const budget = HD_MESH_QUALITY_BUDGETS.find((candidate) => candidate.lod === lod)
  if (!budget) throw new Error(`Missing HD mesh quality budget for ${lod}`)
  return budget
}

/**
 * Fail closed on measurable geometry defects before a mesh can be called
 * "HD-ready" by the renderer. Passing this gate means only that the generated
 * mesh satisfies technical fidelity/topology requirements; it does not promote
 * the asset to verified anatomy or academic review.
 */
export function evaluateHdMeshQuality(observation: HdMeshQualityObservation): HdMeshQualityResult {
  const reasons: string[] = []
  const budget = budgetFor(observation.lod)

  if (!observation.assetId.trim()) reasons.push('Asset identity is missing.')
  if (!Number.isInteger(observation.vertexCount) || observation.vertexCount < 3) reasons.push('Vertex count is invalid.')
  if (!Number.isInteger(observation.triangleCount) || observation.triangleCount < 1) reasons.push('Triangle count is invalid.')
  if (!Number.isFinite(observation.sourceBoundingDiagonal) || observation.sourceBoundingDiagonal <= 0) reasons.push('Source bounding diagonal is invalid.')
  if (!finiteNonNegative(observation.maxSurfaceError)) reasons.push('Surface-error measurement is invalid.')
  if (!Number.isInteger(observation.degenerateTriangleCount) || observation.degenerateTriangleCount < 0) reasons.push('Degenerate-triangle count is invalid.')
  if (!Number.isInteger(observation.invalidNormalCount) || observation.invalidNormalCount < 0) reasons.push('Invalid-normal count is invalid.')
  if (!Number.isInteger(observation.selfIntersectionCount) || observation.selfIntersectionCount < 0) reasons.push('Self-intersection count is invalid.')
  if (!Number.isInteger(observation.unintendedBoundaryEdgeCount) || observation.unintendedBoundaryEdgeCount < 0) reasons.push('Boundary-edge count is invalid.')
  if (!Number.isInteger(observation.namedBoundaryCount) || observation.namedBoundaryCount < 0) reasons.push('Named-boundary count is invalid.')
  if (!Number.isInteger(observation.retainedNamedBoundaryCount) || observation.retainedNamedBoundaryCount < 0) reasons.push('Retained named-boundary count is invalid.')

  const simplificationErrorFraction = observation.sourceBoundingDiagonal > 0 && finiteNonNegative(observation.maxSurfaceError)
    ? observation.maxSurfaceError / observation.sourceBoundingDiagonal
    : Number.POSITIVE_INFINITY
  const degenerateTriangleFraction = observation.triangleCount > 0 && observation.degenerateTriangleCount >= 0
    ? observation.degenerateTriangleCount / observation.triangleCount
    : Number.POSITIVE_INFINITY
  const namedBoundaryRetention = observation.namedBoundaryCount === 0
    ? 1
    : observation.retainedNamedBoundaryCount / observation.namedBoundaryCount

  if (simplificationErrorFraction > budget.maxSimplificationErrorFraction) {
    reasons.push(`Surface simplification error ${simplificationErrorFraction.toFixed(6)} exceeds ${budget.maxSimplificationErrorFraction.toFixed(6)} for ${observation.lod} LOD.`)
  }
  if (degenerateTriangleFraction > budget.maxDegenerateTriangleFraction) {
    reasons.push(`Degenerate-triangle fraction ${degenerateTriangleFraction.toFixed(6)} exceeds ${budget.maxDegenerateTriangleFraction.toFixed(6)}.`)
  }
  if (observation.invalidNormalCount > 0) reasons.push('Mesh contains invalid normals.')
  if (observation.selfIntersectionCount > 0) reasons.push('Mesh contains self-intersections.')
  if (observation.unintendedBoundaryEdgeCount > 0) reasons.push('Mesh contains unintended open boundary edges.')
  if (namedBoundaryRetention < budget.minNamedBoundaryRetention) reasons.push('One or more named anatomical boundaries were lost during LOD generation.')
  if (observation.retainedNamedBoundaryCount > observation.namedBoundaryCount) reasons.push('Retained named-boundary count exceeds the source boundary count.')
  if (!observation.leftRightIdentityPreserved) reasons.push('Left/right identity was not preserved.')
  if (!observation.anatomicalAxesPreserved) reasons.push('Anatomical axes were not preserved.')
  if (!observation.sourceTransformPreserved) reasons.push('Source voxel/world transform was not preserved.')

  return {
    passesTechnicalHdGate: reasons.length === 0,
    simplificationErrorFraction,
    degenerateTriangleFraction,
    namedBoundaryRetention,
    reasons: [...new Set(reasons)],
  }
}
