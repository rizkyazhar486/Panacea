export type BodyReferenceRole = 'geometry-reference' | 'interaction-reference'
export type BodyReferenceLicenseStatus = 'verified' | 'pending'

export interface BodyMandatoryReferenceSource {
  id: 'thebuggeddev_anatomy' | 'thebuggeddev_breath_atlas'
  label: string
  role: BodyReferenceRole
  url: string
  repositoryUrl?: string
  pinnedRevision?: string
  licenseStatus: BodyReferenceLicenseStatus
  requiredForDesignReview: true
  runtimeAssetImportAllowed: boolean
  verifiedAnatomyAllowed: boolean
  note: string
}

export interface BodyHighFidelityReferenceTier {
  id: '5k-reference'
  longEdgePx: 5120
  purpose: 'reference-render-capture'
  runtimePolicy: 'adaptive'
  note: string
}

/**
 * Mandatory external references for the Body Exposure maturation roadmap.
 *
 * These records intentionally do NOT grant permission to ship third-party
 * assets and do NOT promote a visual reference into anatomical truth.
 * Runtime geometry still has to pass the existing asset-level provenance,
 * licensing and qualified academic-review gates before verified rendering.
 */
export const BODY_MANDATORY_REFERENCE_SOURCES: readonly BodyMandatoryReferenceSource[] = [
  {
    id: 'thebuggeddev_anatomy',
    label: 'thebuggeddev/anatomy',
    role: 'geometry-reference',
    url: 'https://github.com/thebuggeddev/anatomy',
    repositoryUrl: 'https://github.com/thebuggeddev/anatomy',
    pinnedRevision: '8c0e6f321a47f895ae58ce098028b92774733ee9',
    licenseStatus: 'pending',
    requiredForDesignReview: true,
    runtimeAssetImportAllowed: false,
    verifiedAnatomyAllowed: false,
    note: 'Mandatory visual/interaction reference. Upstream GLB assets must not be copied, vendored, or promoted to verified anatomy until exact asset-level license evidence, checksums, transformation lineage, and qualified academic review are recorded.',
  },
  {
    id: 'thebuggeddev_breath_atlas',
    label: 'Breath Atlas',
    role: 'interaction-reference',
    url: 'https://breath-atlas.thebuggeddev.chatgpt.site/',
    licenseStatus: 'pending',
    requiredForDesignReview: true,
    runtimeAssetImportAllowed: false,
    verifiedAnatomyAllowed: false,
    note: 'Mandatory breathing/physiology interaction reference only. It is not a source of patient-specific measurements, verified gross anatomy, clinical advice, or operative guidance.',
  },
] as const

/**
 * "5K" is a Panacea reference-render/capture target, not a claim that every
 * upstream mesh or texture natively contains 5K detail. Interactive runtime
 * quality remains adaptive so mobile and lower-memory devices stay usable.
 */
export const BODY_HIGH_FIDELITY_REFERENCE_TIER: BodyHighFidelityReferenceTier = {
  id: '5k-reference',
  longEdgePx: 5120,
  purpose: 'reference-render-capture',
  runtimePolicy: 'adaptive',
  note: 'Use 5120px long-edge capture for high-fidelity QA/reference output while preserving adaptive runtime LOD and memory budgets.',
}

export function validateBodyMandatoryReferenceSources() {
  const reasons: string[] = []
  const expectedIds = new Set<BodyMandatoryReferenceSource['id']>([
    'thebuggeddev_anatomy',
    'thebuggeddev_breath_atlas',
  ])

  for (const source of BODY_MANDATORY_REFERENCE_SOURCES) {
    expectedIds.delete(source.id)
    if (!source.url.startsWith('https://')) reasons.push(`${source.id}: source URL must use HTTPS.`)
    if (!source.requiredForDesignReview) reasons.push(`${source.id}: reference must remain mandatory for design review.`)
    if (source.licenseStatus !== 'verified' && source.runtimeAssetImportAllowed) {
      reasons.push(`${source.id}: runtime asset import must remain blocked while licensing is pending.`)
    }
    if (source.licenseStatus !== 'verified' && source.verifiedAnatomyAllowed) {
      reasons.push(`${source.id}: pending-license reference must not be promoted to verified anatomy.`)
    }
  }

  if (expectedIds.size) reasons.push(`Missing mandatory Body references: ${[...expectedIds].join(', ')}.`)
  if (BODY_HIGH_FIDELITY_REFERENCE_TIER.longEdgePx !== 5120) reasons.push('5K reference tier must remain exactly 5120px on the long edge.')
  if (BODY_HIGH_FIDELITY_REFERENCE_TIER.runtimePolicy !== 'adaptive') reasons.push('5K reference target must not force 5K runtime rendering on every device.')

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] }
}
