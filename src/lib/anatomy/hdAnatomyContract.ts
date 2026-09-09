import type { ProjectionAssetProvenance } from '../bodyProjectionReadiness'

export type AnatomyReferenceUse = 'capability-reference-only' | 'licensed-source'
export type AnatomyReferenceLicenseStatus = 'verified' | 'unverified'

export interface MandatoryAnatomyReference {
  id: 'thebuggeddev-anatomy' | 'thebuggeddev-breath-atlas'
  label: string
  url: string
  required: true
  use: AnatomyReferenceUse
  licenseStatus: AnatomyReferenceLicenseStatus
  directCopyAllowed: boolean
  note: string
}

/**
 * Product-direction references that must survive refactors.
 *
 * These are capability references, not blanket permission to copy code/assets.
 * Until an asset-level license is independently verified, Panacea may reproduce
 * interaction/capability patterns but must not ingest upstream meshes, textures,
 * or code as if they were licensed anatomy sources.
 */
export const MANDATORY_ANATOMY_REFERENCES: readonly MandatoryAnatomyReference[] = [
  {
    id: 'thebuggeddev-anatomy',
    label: 'thebuggeddev Anatomy',
    url: 'https://github.com/thebuggeddev/anatomy',
    required: true,
    use: 'capability-reference-only',
    licenseStatus: 'unverified',
    directCopyAllowed: false,
    note: 'Mandatory capability benchmark for interactive layered whole-body anatomy; do not copy upstream code/assets until license and provenance are verified.',
  },
  {
    id: 'thebuggeddev-breath-atlas',
    label: 'thebuggeddev Breath Atlas',
    url: 'https://breath-atlas.thebuggeddev.chatgpt.site/',
    required: true,
    use: 'capability-reference-only',
    licenseStatus: 'unverified',
    directCopyAllowed: false,
    note: 'Mandatory respiratory-atlas capability benchmark; Panacea implementation must remain native, evidence-aware, and fail-closed.',
  },
] as const

export type HdAnatomyLod = 'overview' | 'organ' | 'detail'

export interface HdRenderProfile {
  id: 'mobile-safe' | 'desktop-balanced' | 'desktop-hd'
  maxDevicePixelRatio: number
  maxConcurrentDetailLayers: number
  preferredLod: HdAnatomyLod
  progressiveLoadingRequired: true
  allowHighResolutionTextures: boolean
  requireGracefulFallback: true
}

/**
 * Render budgets deliberately bound detail on mobile instead of trying to make
 * every device render the maximum-resolution asset set at once. High-definition
 * quality is achieved through LOD/progressive loading rather than an unbounded DPR.
 */
export const HD_ANATOMY_RENDER_PROFILES: readonly HdRenderProfile[] = [
  {
    id: 'mobile-safe',
    maxDevicePixelRatio: 1.5,
    maxConcurrentDetailLayers: 1,
    preferredLod: 'organ',
    progressiveLoadingRequired: true,
    allowHighResolutionTextures: false,
    requireGracefulFallback: true,
  },
  {
    id: 'desktop-balanced',
    maxDevicePixelRatio: 2,
    maxConcurrentDetailLayers: 2,
    preferredLod: 'organ',
    progressiveLoadingRequired: true,
    allowHighResolutionTextures: true,
    requireGracefulFallback: true,
  },
  {
    id: 'desktop-hd',
    maxDevicePixelRatio: 2.5,
    maxConcurrentDetailLayers: 3,
    preferredLod: 'detail',
    progressiveLoadingRequired: true,
    allowHighResolutionTextures: true,
    requireGracefulFallback: true,
  },
] as const

export interface HdRenderContext {
  viewportWidth: number
  devicePixelRatio: number
  lowPowerDevice?: boolean
}

export function selectHdAnatomyRenderProfile(context: HdRenderContext): HdRenderProfile {
  if (context.lowPowerDevice || context.viewportWidth < 768) return HD_ANATOMY_RENDER_PROFILES[0]
  if (context.viewportWidth < 1440 || context.devicePixelRatio < 1.75) return HD_ANATOMY_RENDER_PROFILES[1]
  return HD_ANATOMY_RENDER_PROFILES[2]
}

export interface HdAnatomyAssetDescriptor {
  assetId: string
  targetId: string
  lod: HdAnatomyLod
  namedStructures: string[]
  provenance?: ProjectionAssetProvenance
  sourceLicenseVerified: boolean
  textureLicenseVerified: boolean
  hasExplicitLeftRightOrientation: boolean
  hasExplicitAnatomicalAxes: boolean
  closeZoomApproved: boolean
}

export interface HdAnatomyAssetGateResult {
  usableForReferenceRendering: boolean
  usableForVerifiedRendering: boolean
  reasons: string[]
}

const nonBlank = (value: string | undefined) => Boolean(value?.trim())

/**
 * Fail-closed HD asset gate.
 *
 * Reference rendering can tolerate an unreviewed asset only when it has known
 * source/license identity and orientation. "Verified" rendering additionally
 * requires a complete asset-level provenance record and recorded human review.
 */
export function evaluateHdAnatomyAsset(asset: HdAnatomyAssetDescriptor): HdAnatomyAssetGateResult {
  const referenceReasons: string[] = []
  const verifiedReasons: string[] = []

  if (!nonBlank(asset.assetId)) referenceReasons.push('Asset identity is missing.')
  if (!nonBlank(asset.targetId)) referenceReasons.push('Projection target identity is missing.')
  if (!asset.namedStructures.length || asset.namedStructures.some((name) => !nonBlank(name))) {
    referenceReasons.push('Named anatomical structures are missing or invalid.')
  }
  if (!asset.sourceLicenseVerified) referenceReasons.push('Source asset license has not been verified.')
  if (!asset.textureLicenseVerified) referenceReasons.push('Texture/material license has not been verified.')
  if (!asset.hasExplicitLeftRightOrientation) referenceReasons.push('Left/right orientation metadata is missing.')
  if (!asset.hasExplicitAnatomicalAxes) referenceReasons.push('Anatomical axis metadata is missing.')
  if (asset.lod === 'detail' && !asset.closeZoomApproved) {
    referenceReasons.push('Detail LOD has not passed close-zoom quality review.')
  }

  const provenance = asset.provenance
  if (!provenance) {
    verifiedReasons.push('Asset-level provenance is missing.')
  } else {
    if (provenance.targetId !== asset.targetId) verifiedReasons.push('Asset provenance target does not match the HD asset target.')
    if (!nonBlank(provenance.sourceId)) verifiedReasons.push('Source identity is missing.')
    if (!nonBlank(provenance.sourceRevision)) verifiedReasons.push('Source revision is missing.')
    if (!nonBlank(provenance.license)) verifiedReasons.push('Provenance license is missing.')
    if (!nonBlank(provenance.attribution)) verifiedReasons.push('Attribution is missing.')
    if (!provenance.transformationHistory.length) verifiedReasons.push('Transformation history is missing.')
    if (provenance.academicReview !== 'recorded') verifiedReasons.push('Qualified academic review is not recorded.')
    if (!nonBlank(provenance.reviewerName)) verifiedReasons.push('Reviewer identity is missing.')
    if (!nonBlank(provenance.reviewerCredentials)) verifiedReasons.push('Reviewer credentials are missing.')
    if (!nonBlank(provenance.reviewerDate)) verifiedReasons.push('Reviewer date is missing.')
    if (!nonBlank(provenance.reviewerScope)) verifiedReasons.push('Reviewer scope is missing.')
  }

  const usableForReferenceRendering = referenceReasons.length === 0
  const usableForVerifiedRendering = usableForReferenceRendering && verifiedReasons.length === 0

  return {
    usableForReferenceRendering,
    usableForVerifiedRendering,
    reasons: [...new Set([...referenceReasons, ...verifiedReasons])],
  }
}
