import {
  evaluateAnatomyAccuracyGate,
  type QualifiedAnatomyReview,
} from './bodyExposureAccuracyGate.ts'

export interface BodyExposureQualityEvidence {
  visualIntegrity: number
  interactionCompleteness: number
  provenanceCompleteness: number
  performanceAcceptance: number
  accessibilityAcceptance: number
  mobileFluidLayoutPass: boolean
  reducedMotionPass: boolean
  featurePreservationPass: boolean
}

export interface BodyExposureQualityGateInput {
  quality: BodyExposureQualityEvidence
  anatomyReview: QualifiedAnatomyReview
}

function ratio(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${field} must be in [0,1]`)
  return value
}

/**
 * Panaceamed internal product-quality index only:
 * `Q = (visualIntegrity + interactionCompleteness + provenanceCompleteness + performanceAcceptance + accessibilityAcceptance) / 5`.
 *
 * Q is deliberately independent from the qualified anatomical-accuracy gate.
 * Visual polish/performance can never compensate for anatomical review below
 * 0.92 or an unresolved major anatomical finding.
 */
export function evaluateBodyExposureQualityGate(input: BodyExposureQualityGateInput) {
  const visualIntegrity = ratio(input.quality.visualIntegrity, 'visualIntegrity')
  const interactionCompleteness = ratio(input.quality.interactionCompleteness, 'interactionCompleteness')
  const provenanceCompleteness = ratio(input.quality.provenanceCompleteness, 'provenanceCompleteness')
  const performanceAcceptance = ratio(input.quality.performanceAcceptance, 'performanceAcceptance')
  const accessibilityAcceptance = ratio(input.quality.accessibilityAcceptance, 'accessibilityAcceptance')
  const q = (visualIntegrity + interactionCompleteness + provenanceCompleteness + performanceAcceptance + accessibilityAcceptance) / 5
  const anatomy = evaluateAnatomyAccuracyGate(input.anatomyReview)

  const qualityReasons: string[] = []
  if (q < 0.88) qualityReasons.push('internal Body Exposure quality index is below 0.88')
  if (!input.quality.mobileFluidLayoutPass) qualityReasons.push('mobile fluid-layout acceptance has not passed')
  if (!input.quality.reducedMotionPass) qualityReasons.push('reduced-motion acceptance has not passed')
  if (!input.quality.featurePreservationPass) qualityReasons.push('feature-preservation acceptance has not passed')

  return {
    thresholds: {
      internalQualityQ: 0.88 as const,
      anatomicalAccuracy: 0.92 as const,
    },
    q,
    anatomy,
    qualityPass: qualityReasons.length === 0,
    overallPass: qualityReasons.length === 0 && anatomy.pass,
    qualityReasons,
    anatomyReasons: anatomy.reasons,
    boundary: {
      qIsInternalProductAcceptanceOnly: true as const,
      qIsNotClinicalValidity: true as const,
      qCannotCompensateForAnatomyFailure: true as const,
      anatomicalAccuracyRequiresQualifiedHumanReview: true as const,
    },
  }
}
