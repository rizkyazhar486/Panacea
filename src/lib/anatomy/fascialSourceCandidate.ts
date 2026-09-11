export type FascialSourceAdmissionStatus =
  | 'candidate-unimported'
  | 'converted-unverified'
  | 'source-verified'

export interface FascialSourceVerification {
  convertedArtifactSha256?: string
  sourceNodeCount: number
  objectNamesPreserved: boolean
  referenceFrameVerified: boolean
  licenseScopeVerified: boolean
  academicReviewComplete: boolean
}

export interface FascialSourceCandidate {
  domain: 'deep-msk' | 'visceral' | 'neural'
  upstreamPath: string
  upstreamBlobSha: string
  upstreamBytes: number
}

/**
 * Pinned upstream candidates for the current whole-body fascial blocker.
 *
 * These records are provenance candidates only. They do not admit geometry into
 * Panacea and must not be interpreted as evidence that `system:fascial` ships.
 */
export const FASCIAL_SOURCE_CANDIDATES: readonly FascialSourceCandidate[] = [
  {
    domain: 'deep-msk',
    upstreamPath: 'Resources/Models/FBX/MuscularSystem100.fbx',
    upstreamBlobSha: '2477e1b6caf97d7174762b5eec6cf1c80db64eed',
    upstreamBytes: 37_343_180,
  },
  {
    domain: 'visceral',
    upstreamPath: 'Resources/Models/FBX/VisceralSystem100.fbx',
    upstreamBlobSha: '355770ae46123044c85deca03de3fb880b8f7301',
    upstreamBytes: 18_401_708,
  },
  {
    domain: 'neural',
    upstreamPath: 'Resources/Models/FBX/NervousSystem100.fbx',
    upstreamBlobSha: '4ec6e3cb2a1ba821aca02c1d523ac614fdf41a02',
    upstreamBytes: 53_887_724,
  },
] as const

export const FASCIAL_SOURCE_PROVENANCE = {
  upstreamRepository: 'LluisV/Z-Anatomy',
  upstreamCommit: '6c7f9016bd5899ac8edafd31b9900c151df42ed6',
  sourceFormat: 'FBX',
  targetFormat: 'GLB',
  repositoryLicense: 'CC-BY-SA-4.0',
  attribution: 'Z-Anatomy — The open source atlas of anatomy',
  currentStatus: 'candidate-unimported' as FascialSourceAdmissionStatus,
  patientSpecific: false,
  clinicalInferenceAllowed: false,
} as const

export function fascialSourceAdmissionStatus(
  verification: FascialSourceVerification,
): FascialSourceAdmissionStatus {
  const converted = Boolean(verification.convertedArtifactSha256) && verification.sourceNodeCount > 0
  if (!converted) return 'candidate-unimported'

  const verified =
    verification.objectNamesPreserved &&
    verification.referenceFrameVerified &&
    verification.licenseScopeVerified &&
    verification.academicReviewComplete

  return verified ? 'source-verified' : 'converted-unverified'
}

export function fascialSourceMayPromoteSystem(
  verifications: readonly FascialSourceVerification[],
): boolean {
  return verifications.length === FASCIAL_SOURCE_CANDIDATES.length
    && verifications.every((entry) => fascialSourceAdmissionStatus(entry) === 'source-verified')
}

export const FASCIAL_SOURCE_BOUNDARY =
  'Pinned source candidates only. Do not mark fascial anatomy shipped until every required converted artifact has verified source-node identity, preserved names, compatible reference frame, license scope, and qualified academic review.' as const
