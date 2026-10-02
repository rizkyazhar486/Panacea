export type ArticularSourceAdmissionStatus =
  | 'candidate-unimported'
  | 'converted-unverified'
  | 'source-verified'

export interface ArticularSourceVerification {
  convertedArtifactSha256?: string
  sourceNodeCount: number
  objectNamesPreserved: boolean
  referenceFrameVerified: boolean
  licenseScopeVerified: boolean
  academicReviewComplete: boolean
}

/**
 * Pinned upstream candidate for the currently-missing whole-body articular layer.
 *
 * This record is provenance only. It does not admit geometry into the atlas and
 * must never be interpreted as evidence that `system:articular` is shipped.
 */
export const ARTICULAR_SOURCE_CANDIDATE = {
  upstreamRepository: 'LluisV/Z-Anatomy',
  upstreamCommit: '6c7f9016bd5899ac8edafd31b9900c151df42ed6',
  upstreamPath: 'Resources/Models/FBX/Joints100.fbx',
  upstreamBlobSha: '9db06d20217f4f42999dcfdf31b1f6af78dc7794',
  upstreamBytes: 9_804_796,
  sourceFormat: 'FBX',
  targetFormat: 'GLB',
  targetBundleFile: 'articular.glb',
  attribution: [
    'BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan',
    'Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0',
  ],
  licensePolicy: 'share-alike-attribution-required',
  currentStatus: 'candidate-unimported' as ArticularSourceAdmissionStatus,
  patientSpecific: false,
  clinicalInferenceAllowed: false,
} as const

export function articularSourceAdmissionStatus(
  verification: ArticularSourceVerification,
): ArticularSourceAdmissionStatus {
  const converted = Boolean(verification.convertedArtifactSha256) && verification.sourceNodeCount > 0
  if (!converted) return 'candidate-unimported'

  const verified =
    verification.objectNamesPreserved &&
    verification.referenceFrameVerified &&
    verification.licenseScopeVerified &&
    verification.academicReviewComplete

  return verified ? 'source-verified' : 'converted-unverified'
}

export function articularSourceMayPromoteSystem(
  verification: ArticularSourceVerification,
): boolean {
  return articularSourceAdmissionStatus(verification) === 'source-verified'
}

export const ARTICULAR_SOURCE_BOUNDARY =
  'Pinned source candidate only. Do not mark articular anatomy shipped until the converted artifact, source-node identity, reference frame, license scope, and academic review are all independently verified.' as const
