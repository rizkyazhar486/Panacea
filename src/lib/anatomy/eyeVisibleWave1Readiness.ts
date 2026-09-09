import { EYE_VISIBLE_WAVE1, validateEyeVisibleWave1, type EyeVisibleStructure } from './eyeVisibleWave1'

export interface EyeVisibleWave1Readiness {
  structureCount: number
  selectableCount: number
  referenceOnlyCount: number
  sourceGeometryRequiredCount: number
  academicReviewPendingCount: number
  contractErrors: readonly string[]
  grossLayerComplete: boolean
  verified3dReady: false
  nextAllowedLayer: 'none' | 'wave2-geometry-provenance-audit'
  blockers: readonly string[]
}

export function assessEyeVisibleWave1Readiness(records: readonly EyeVisibleStructure[] = EYE_VISIBLE_WAVE1): EyeVisibleWave1Readiness {
  const contractErrors = validateEyeVisibleWave1(records)
  const structureCount = records.length
  const selectableCount = records.filter((item) => item.mustBeSelectable).length
  const referenceOnlyCount = records.filter((item) => item.geometryStatus === 'reference-only').length
  const sourceGeometryRequiredCount = records.filter((item) => item.geometryStatus === 'source-geometry-required').length
  const academicReviewPendingCount = records.filter((item) => item.reviewStatus === 'academic-review-pending').length
  const grossLayerComplete = contractErrors.length === 0 && structureCount >= 110
  const blockers = [
    ...(contractErrors.length ? ['Gross-visible anatomy contract has validation errors.'] : []),
    ...(academicReviewPendingCount > 0 ? ['Qualified ophthalmology/anatomy review has not been recorded.'] : []),
    ...(referenceOnlyCount > 0 ? ['Reference-only targets must not be represented as verified gross anatomy.'] : []),
    ...(sourceGeometryRequiredCount > 0 ? ['Source-geometry-required targets still need exact asset/revision/license/attribution/transformation provenance.'] : []),
  ]
  return {
    structureCount,
    selectableCount,
    referenceOnlyCount,
    sourceGeometryRequiredCount,
    academicReviewPendingCount,
    contractErrors,
    grossLayerComplete,
    verified3dReady: false,
    nextAllowedLayer: grossLayerComplete ? 'wave2-geometry-provenance-audit' : 'none',
    blockers,
  }
}
