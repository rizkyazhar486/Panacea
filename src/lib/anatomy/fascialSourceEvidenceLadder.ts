import { EXPLICIT_SUPERFICIAL_FASCIAL_MANIFEST_NODES } from './fascialLayerManifestAudit.ts'

export type FascialEvidenceTier =
  | 'layer-manifest'
  | 'cross-indexed-text'
  | 'bundle-metadata-compatible'
  | 'bundle-node-verified'
  | 'converted-artifact-verified'
  | 'same-frame-verified'
  | 'license-scope-verified'
  | 'academic-review-complete'

export interface PinnedTextEvidence {
  id: 'layer-7' | 'collection-fasciae' | 'collection-csv' | 'hierarchy' | 'object-inventory'
  upstreamPath: string
  upstreamBlobSha: string
  evidenceKind: 'layer-manifest' | 'collection-manifest' | 'collection-csv' | 'hierarchy-index' | 'object-inventory'
}

export interface SuperficialFasciaCandidateVerification {
  candidateBundleSha: string
  verifiedSourceNodeNames: readonly string[]
  convertedArtifactSha256?: string
  objectNamesPreserved: boolean
  referenceFrameVerified: boolean
  licenseScopeVerified: boolean
  academicReviewComplete: boolean
}

/**
 * Text/index evidence for the four explicit labels discovered in the pinned
 * Z-Anatomy fascial manifests. Repetition across indexes reduces the risk that
 * one sidecar is an orphaned label, but none of these files is geometry.
 */
export const SUPERFICIAL_FASCIA_TEXT_EVIDENCE: readonly PinnedTextEvidence[] = [
  {
    id: 'layer-7',
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Layers/Fasciae/Fasciae-7.txt',
    upstreamBlobSha: 'a622236baad28d662033fe6bd3a2c4eaf0b3a371',
    evidenceKind: 'layer-manifest',
  },
  {
    id: 'collection-fasciae',
    upstreamPath: 'Z-Anatomy PC/Assets/Models/Collections/BONUS/Fasciae.txt',
    upstreamBlobSha: 'e04b98afb00fc5967af4ae2b184589900268fd2f',
    evidenceKind: 'collection-manifest',
  },
  {
    id: 'collection-csv',
    upstreamPath: 'Resources/Layers/Collections - Fasciae.csv',
    upstreamBlobSha: 'c33926393ae2e1834998048f4abdd2dcf0cd0cbe',
    evidenceKind: 'collection-csv',
  },
  {
    id: 'hierarchy',
    upstreamPath: 'Z-Anatomy PC/Assets/Resources/Hierarchy order.txt',
    upstreamBlobSha: 'a45d444963d4d41b0c32d81e2b9ee2f7e92cbd89',
    evidenceKind: 'hierarchy-index',
  },
  {
    id: 'object-inventory',
    upstreamPath: 'Resources/Descriptions/OriginalDescriptions/obj_list.txt',
    upstreamBlobSha: '269988a630788cb6ab052bef5fed23ed4eb2d72a',
    evidenceKind: 'object-inventory',
  },
] as const

/**
 * The same pinned MuscularSystem100 binary blob is exposed in both the compact
 * Resources export and the Unity project tree. The Unity importer metadata for
 * that project copy names both `Fascia` and `Superficial` material classes.
 * This is useful host-bundle compatibility evidence only: material classes do
 * not identify which source nodes are present in the FBX.
 */
export const SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS = {
  upstreamRepository: 'LluisV/Z-Anatomy',
  upstreamCommit: '6c7f9016bd5899ac8edafd31b9900c151df42ed6',
  resourcesBundlePath: 'Resources/Models/FBX/MuscularSystem100.fbx',
  unityProjectBundlePath: 'Z-Anatomy PC/Assets/Models/1.0 Models/MuscularSystem100.fbx',
  bundleBlobSha: '2477e1b6caf97d7174762b5eec6cf1c80db64eed',
  bundleBytes: 37_343_180,
  importerMetadataPath: 'Z-Anatomy PC/Assets/Models/1.0 Models/MuscularSystem100.fbx.meta',
  importerMetadataBlobSha: '69274fff276fc408f1ce4787d1a3e28c572333e8',
  observedMaterialClasses: ['Fascia', 'Superficial'] as const,
  status: 'bundle-host-hypothesis-only' as const,
  sourceNodeIdentityVerified: false,
} as const

export const SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES = [
  ...EXPLICIT_SUPERFICIAL_FASCIAL_MANIFEST_NODES,
] as const

export const SUPERFICIAL_FASCIA_EVIDENCE_LADDER: readonly {
  tier: FascialEvidenceTier
  satisfied: boolean
  meaning: string
}[] = [
  {
    tier: 'layer-manifest',
    satisfied: SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES.length === 4,
    meaning: 'Pinned fascial layer manifest contains explicit superficial-fascia labels.',
  },
  {
    tier: 'cross-indexed-text',
    satisfied: SUPERFICIAL_FASCIA_TEXT_EVIDENCE.length === 5,
    meaning: 'The labels recur across pinned collection, hierarchy and object inventories.',
  },
  {
    tier: 'bundle-metadata-compatible',
    satisfied:
      SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.observedMaterialClasses.includes('Fascia') &&
      SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.observedMaterialClasses.includes('Superficial'),
    meaning: 'A plausible source bundle has importer material classes compatible with fascial/superficial content.',
  },
  {
    tier: 'bundle-node-verified',
    satisfied: false,
    meaning: 'Not satisfied until the binary source is inspected and the required source-node identities are verified.',
  },
  {
    tier: 'converted-artifact-verified',
    satisfied: false,
    meaning: 'Not satisfied until a converted artifact digest and preserved source-node names are verified.',
  },
  {
    tier: 'same-frame-verified',
    satisfied: false,
    meaning: 'Not satisfied until the converted geometry is proven compatible with the canonical whole-body frame.',
  },
  {
    tier: 'license-scope-verified',
    satisfied: false,
    meaning: 'Not satisfied until the exact source asset license and share-alike obligations are reviewed for this use.',
  },
  {
    tier: 'academic-review-complete',
    satisfied: false,
    meaning: 'Not satisfied until a qualified anatomical reviewer approves identity, coverage and intended educational use.',
  },
] as const

export function currentSuperficialFasciaEvidenceTier(): FascialEvidenceTier {
  const satisfied = SUPERFICIAL_FASCIA_EVIDENCE_LADDER.filter((entry) => entry.satisfied)
  return satisfied[satisfied.length - 1]?.tier ?? 'layer-manifest'
}

export function superficialFasciaCandidateAdmissionReady(
  verification: SuperficialFasciaCandidateVerification,
): boolean {
  if (verification.candidateBundleSha !== SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBlobSha) return false
  if (!verification.convertedArtifactSha256) return false
  if (!verification.objectNamesPreserved) return false
  if (!verification.referenceFrameVerified) return false
  if (!verification.licenseScopeVerified) return false
  if (!verification.academicReviewComplete) return false

  const verifiedNames = new Set(verification.verifiedSourceNodeNames)
  return SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES.every((name) => verifiedNames.has(name))
}

/**
 * Evidence gathered here can support a future candidate-admission review, but
 * this discovery module never promotes `system:fascial` by itself. System
 * promotion remains governed by the canonical macro closure/admission gates.
 */
export function superficialFasciaEvidenceMayPromoteSystem(): boolean {
  return false
}

export const SUPERFICIAL_FASCIA_EVIDENCE_BOUNDARY =
  'Current evidence reaches bundle-metadata compatibility only. Repeated text labels and MuscularSystem100 importer material classes do not prove FBX source-node identity, converted geometry, same-frame alignment, exact asset license scope, or anatomical review. Keep the superficial fascial source candidate and system:fascial fail-closed until those higher tiers are independently verified.' as const
