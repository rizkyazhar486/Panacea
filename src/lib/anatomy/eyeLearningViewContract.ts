export type EyeLearningViewScale = 'organ' | 'suborgan' | 'tissue' | 'cellular' | 'molecular'
export type EyeLearningViewMotion = 'static' | 'representational'
export type EyeLearningViewReviewStatus = 'academic-review-pending' | 'academic-reviewed'

export interface EyeLearningViewExternalReference {
  label: string
  url: string
  use: 'design-reference-only'
  codeReuseAllowed: false
  assetReuseAllowed: false
}

export interface EyeLearningViewState {
  id: string
  label: string
  scale: EyeLearningViewScale
  canonicalNodeIds: readonly string[]
  evidenceRefs: readonly string[]
  motion: EyeLearningViewMotion
  conformationalEvidenceRefs?: readonly string[]
  reviewStatus: EyeLearningViewReviewStatus
  patientSpecific: false
  functionalInferenceAllowed: false
  lesionLocalizationAllowed: false
  publicationReady: false
}

export const EYE_LEARNING_VIEW_EXTERNAL_REFERENCES: readonly EyeLearningViewExternalReference[] = [
  {
    label: 'ProteinBlender',
    url: 'https://animation-lab.github.io/ProteinBlender/',
    use: 'design-reference-only',
    codeReuseAllowed: false,
    assetReuseAllowed: false,
  },
  {
    label: 'Anatomy3D Learning',
    url: 'https://satorumuro.github.io/Anatomy3D-Learning/',
    use: 'design-reference-only',
    codeReuseAllowed: false,
    assetReuseAllowed: false,
  },
] as const

export interface EyeLearningViewDecision {
  status: 'eligible' | 'blocked'
  blockers: readonly string[]
  mayAnimate: boolean
  mayPublish: false
  mayLocalizeLesion: false
}

export function evaluateEyeLearningView(view: EyeLearningViewState): EyeLearningViewDecision {
  const blockers: string[] = []

  if (!view.id.trim()) blockers.push('missing-id')
  if (!view.label.trim()) blockers.push('missing-label')
  if (view.canonicalNodeIds.length === 0 || view.canonicalNodeIds.some((id) => !id.trim())) blockers.push('missing-canonical-node')
  if (view.evidenceRefs.length === 0 || view.evidenceRefs.some((ref) => !ref.trim())) blockers.push('missing-evidence')
  if (view.patientSpecific !== false) blockers.push('patient-specific')
  if (view.functionalInferenceAllowed !== false) blockers.push('functional-inference-enabled')
  if (view.lesionLocalizationAllowed !== false) blockers.push('lesion-localization-enabled')
  if (view.publicationReady !== false) blockers.push('publication-promotion')

  const conformationalEvidence = view.conformationalEvidenceRefs?.filter((ref) => ref.trim()) ?? []
  if (view.motion === 'representational' && conformationalEvidence.length === 0) blockers.push('missing-conformational-evidence')

  return {
    status: blockers.length === 0 ? 'eligible' : 'blocked',
    blockers,
    mayAnimate: blockers.length === 0 && (view.motion === 'static' || conformationalEvidence.length > 0),
    mayPublish: false,
    mayLocalizeLesion: false,
  }
}

export const EYE_LEARNING_VIEW_BOUNDARY =
  'Learning views are declarative educational viewport states over Panacea-owned provenance-bearing nodes. External references are design-only. Do not copy external code/assets, infer anatomy from camera composition, infer function from spatial contact, interpolate unsupported physiology, localize patient lesions, or treat engineering validation as qualified academic review.'
