export type RegistrationVec3 = readonly [number, number, number]

export interface AnatomyRegistrationLandmark {
  id: string
  source: RegistrationVec3
  target: RegistrationVec3
}

export interface AnatomySimilarityTransform {
  /** Uniform scale from source-frame units into target-frame units. */
  scale: number
  /** Row-major 3x3 proper-rotation matrix (determinant +1). */
  rotation: readonly [
    number, number, number,
    number, number, number,
    number, number, number,
  ]
  translation: RegistrationVec3
}

export interface AnatomyRegistrationMetrics {
  landmarkCount: number
  rmsError: number
  maxError: number
  normalizedRmsError: number
  targetRmsRadius: number
}

export type AnatomyRegistrationResult =
  | {
      status: 'accepted'
      transform: AnatomySimilarityTransform
      metrics: AnatomyRegistrationMetrics
      reasons: readonly []
      semantics: 'candidate-similarity-registration-not-qualified-anatomical-validation'
    }
  | {
      status: 'rejected'
      transform: null
      metrics: AnatomyRegistrationMetrics | null
      reasons: readonly string[]
      semantics: 'candidate-similarity-registration-not-qualified-anatomical-validation'
    }

export interface AnatomyRegistrationOptions {
  /**
   * Maximum RMS landmark residual divided by the target landmark RMS radius.
   * This is an engineering registration tolerance, not anatomical validation.
   */
  maxNormalizedRmsError?: number
  /** Absolute residual ceiling in target-frame units when a bounded unit is known. */
  maxError?: number
  epsilon?: number
}
