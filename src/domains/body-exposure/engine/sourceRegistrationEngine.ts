import type {
  AnatomyRegistrationLandmark,
  AnatomyRegistrationMetrics,
  AnatomyRegistrationOptions,
  AnatomyRegistrationResult,
  AnatomySimilarityTransform,
  RegistrationVec3,
} from '../model/sourceRegistration'

const SEMANTICS = 'candidate-similarity-registration-not-qualified-anatomical-validation' as const

function finiteVec(v: RegistrationVec3) {
  return v.length === 3 && v.every(Number.isFinite)
}

function add(a: RegistrationVec3, b: RegistrationVec3): RegistrationVec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function sub(a: RegistrationVec3, b: RegistrationVec3): RegistrationVec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

function scaleVec(v: RegistrationVec3, s: number): RegistrationVec3 {
  return [v[0] * s, v[1] * s, v[2] * s]
}

function dot(a: RegistrationVec3, b: RegistrationVec3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: RegistrationVec3, b: RegistrationVec3): RegistrationVec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function norm(v: RegistrationVec3) {
  return Math.hypot(v[0], v[1], v[2])
}

function normalize(v: RegistrationVec3, epsilon: number): RegistrationVec3 | null {
  const n = norm(v)
  return n > epsilon ? scaleVec(v, 1 / n) : null
}

function centroid(points: readonly RegistrationVec3[]): RegistrationVec3 {
  const sum = points.reduce<RegistrationVec3>((acc, point) => add(acc, point), [0, 0, 0])
  return scaleVec(sum, 1 / points.length)
}

type Basis = readonly [RegistrationVec3, RegistrationVec3, RegistrationVec3]

function basisFromTriangle(
  a: RegistrationVec3,
  b: RegistrationVec3,
  c: RegistrationVec3,
  epsilon: number,
): Basis | null {
  const x = normalize(sub(b, a), epsilon)
  if (!x) return null
  const normal = normalize(cross(x, sub(c, a)), epsilon)
  if (!normal) return null
  const y = normalize(cross(normal, x), epsilon)
  if (!y) return null
  return [x, y, normal]
}

function triangleDoubleArea(
  a: RegistrationVec3,
  b: RegistrationVec3,
  c: RegistrationVec3,
) {
  return norm(cross(sub(b, a), sub(c, a)))
}

function chooseStableTriplet(
  landmarks: readonly AnatomyRegistrationLandmark[],
  epsilon: number,
): readonly [number, number, number] | null {
  let best: readonly [number, number, number] | null = null
  let bestScore = 0

  for (let i = 0; i < landmarks.length - 2; i += 1) {
    for (let j = i + 1; j < landmarks.length - 1; j += 1) {
      for (let k = j + 1; k < landmarks.length; k += 1) {
        const sourceArea = triangleDoubleArea(
          landmarks[i].source,
          landmarks[j].source,
          landmarks[k].source,
        )
        const targetArea = triangleDoubleArea(
          landmarks[i].target,
          landmarks[j].target,
          landmarks[k].target,
        )
        if (sourceArea <= epsilon || targetArea <= epsilon) continue
        const score = sourceArea * targetArea
        if (score > bestScore) {
          bestScore = score
          best = [i, j, k]
        }
      }
    }
  }
  return best
}

function rotationFromBases(source: Basis, target: Basis): AnatomySimilarityTransform['rotation'] {
  // R = T * S^T where basis vectors are matrix columns.
  const r = (row: 0 | 1 | 2, col: 0 | 1 | 2) =>
    target[0][row] * source[0][col]
    + target[1][row] * source[1][col]
    + target[2][row] * source[2][col]

  return [
    r(0, 0), r(0, 1), r(0, 2),
    r(1, 0), r(1, 1), r(1, 2),
    r(2, 0), r(2, 1), r(2, 2),
  ]
}

function rotate(
  rotation: AnatomySimilarityTransform['rotation'],
  point: RegistrationVec3,
): RegistrationVec3 {
  return [
    rotation[0] * point[0] + rotation[1] * point[1] + rotation[2] * point[2],
    rotation[3] * point[0] + rotation[4] * point[1] + rotation[5] * point[2],
    rotation[6] * point[0] + rotation[7] * point[1] + rotation[8] * point[2],
  ]
}

function determinant3(rotation: AnatomySimilarityTransform['rotation']) {
  const r = rotation
  return r[0] * (r[4] * r[8] - r[5] * r[7])
    - r[1] * (r[3] * r[8] - r[5] * r[6])
    + r[2] * (r[3] * r[7] - r[4] * r[6])
}

function estimateUniformScale(
  landmarks: readonly AnatomyRegistrationLandmark[],
  epsilon: number,
) {
  let sourceSquared = 0
  let targetSquared = 0
  for (let i = 0; i < landmarks.length - 1; i += 1) {
    for (let j = i + 1; j < landmarks.length; j += 1) {
      const sourceDistance = norm(sub(landmarks[i].source, landmarks[j].source))
      const targetDistance = norm(sub(landmarks[i].target, landmarks[j].target))
      if (sourceDistance <= epsilon || targetDistance <= epsilon) continue
      sourceSquared += sourceDistance * sourceDistance
      targetSquared += targetDistance * targetDistance
    }
  }
  if (sourceSquared <= epsilon || targetSquared <= epsilon) return null
  return Math.sqrt(targetSquared / sourceSquared)
}

export function applyAnatomySimilarityTransform(
  transform: AnatomySimilarityTransform,
  point: RegistrationVec3,
): RegistrationVec3 {
  return add(scaleVec(rotate(transform.rotation, point), transform.scale), transform.translation)
}

function metricsFor(
  transform: AnatomySimilarityTransform,
  landmarks: readonly AnatomyRegistrationLandmark[],
  epsilon: number,
): AnatomyRegistrationMetrics {
  const targetCenter = centroid(landmarks.map((landmark) => landmark.target))
  let squared = 0
  let maxError = 0
  let targetSquaredRadius = 0

  for (const landmark of landmarks) {
    const predicted = applyAnatomySimilarityTransform(transform, landmark.source)
    const error = norm(sub(predicted, landmark.target))
    squared += error * error
    maxError = Math.max(maxError, error)
    const targetRadius = norm(sub(landmark.target, targetCenter))
    targetSquaredRadius += targetRadius * targetRadius
  }

  const rmsError = Math.sqrt(squared / landmarks.length)
  const targetRmsRadius = Math.sqrt(targetSquaredRadius / landmarks.length)
  return {
    landmarkCount: landmarks.length,
    rmsError,
    maxError,
    normalizedRmsError: rmsError / Math.max(targetRmsRadius, epsilon),
    targetRmsRadius,
  }
}

function reject(reasons: readonly string[], metrics: AnatomyRegistrationMetrics | null = null): AnatomyRegistrationResult {
  return { status: 'rejected', transform: null, metrics, reasons: [...new Set(reasons)], semantics: SEMANTICS }
}

/**
 * Deterministic landmark similarity registration for cross-atlas candidates.
 *
 * Formula:
 *   q_hat = s R p + t
 *   s = sqrt(sum_ij ||q_i-q_j||^2 / sum_ij ||p_i-p_j||^2)
 *   t = centroid(q) - s R centroid(p)
 *
 * R is a proper rotation (determinant +1) built from the most stable
 * non-collinear landmark triplet. Acceptance is residual-based and fail-closed.
 * A passing transform is only an engineering registration candidate; it never
 * constitutes anatomical accuracy, provenance review, or publication approval.
 */
export function registerAnatomyLandmarks(
  landmarks: readonly AnatomyRegistrationLandmark[],
  options: AnatomyRegistrationOptions = {},
): AnatomyRegistrationResult {
  const epsilon = Math.max(options.epsilon ?? 1e-9, Number.EPSILON)
  const maxNormalizedRmsError = options.maxNormalizedRmsError ?? 0.05
  const absoluteMaxError = options.maxError ?? Number.POSITIVE_INFINITY
  const reasons: string[] = []

  if (landmarks.length < 3) reasons.push('At least three landmark pairs are required.')
  const ids = landmarks.map((landmark) => landmark.id.trim())
  if (ids.some((id) => !id)) reasons.push('Every landmark requires a non-empty id.')
  if (new Set(ids).size !== ids.length) reasons.push('Landmark ids must be unique.')
  if (landmarks.some((landmark) => !finiteVec(landmark.source) || !finiteVec(landmark.target))) {
    reasons.push('Landmark coordinates must be finite 3D vectors.')
  }
  if (!Number.isFinite(maxNormalizedRmsError) || maxNormalizedRmsError < 0) {
    reasons.push('maxNormalizedRmsError must be finite and non-negative.')
  }
  if (!(Number.isFinite(absoluteMaxError) || absoluteMaxError === Number.POSITIVE_INFINITY) || absoluteMaxError < 0) {
    reasons.push('maxError must be non-negative or +Infinity.')
  }
  if (reasons.length) return reject(reasons)

  const triplet = chooseStableTriplet(landmarks, epsilon)
  if (!triplet) return reject(['Landmarks are degenerate or collinear in source or target space.'])

  const [i, j, k] = triplet
  const sourceBasis = basisFromTriangle(
    landmarks[i].source,
    landmarks[j].source,
    landmarks[k].source,
    epsilon,
  )
  const targetBasis = basisFromTriangle(
    landmarks[i].target,
    landmarks[j].target,
    landmarks[k].target,
    epsilon,
  )
  if (!sourceBasis || !targetBasis) return reject(['Unable to construct stable landmark bases.'])

  const rotation = rotationFromBases(sourceBasis, targetBasis)
  const determinant = determinant3(rotation)
  if (!Number.isFinite(determinant) || Math.abs(determinant - 1) > 1e-6) {
    return reject(['Registration rotation is not a proper orientation-preserving transform.'])
  }

  const uniformScale = estimateUniformScale(landmarks, epsilon)
  if (!uniformScale || !Number.isFinite(uniformScale) || uniformScale <= epsilon) {
    return reject(['Unable to estimate a positive uniform scale from landmark distances.'])
  }

  const sourceCenter = centroid(landmarks.map((landmark) => landmark.source))
  const targetCenter = centroid(landmarks.map((landmark) => landmark.target))
  const translation = sub(targetCenter, scaleVec(rotate(rotation, sourceCenter), uniformScale))
  const transform: AnatomySimilarityTransform = {
    scale: uniformScale,
    rotation,
    translation,
  }
  const metrics = metricsFor(transform, landmarks, epsilon)

  if (metrics.normalizedRmsError > maxNormalizedRmsError) {
    reasons.push(
      `Normalized RMS residual ${metrics.normalizedRmsError.toFixed(6)} exceeds threshold ${maxNormalizedRmsError.toFixed(6)}.`,
    )
  }
  if (metrics.maxError > absoluteMaxError) {
    reasons.push(
      `Maximum landmark residual ${metrics.maxError.toFixed(6)} exceeds threshold ${absoluteMaxError.toFixed(6)}.`,
    )
  }
  if (reasons.length) return reject(reasons, metrics)

  return {
    status: 'accepted',
    transform,
    metrics,
    reasons: [],
    semantics: SEMANTICS,
  }
}
