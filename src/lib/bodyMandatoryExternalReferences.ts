export type BodyExternalReferenceRole = 'implementation-reference' | 'interaction-reference'
export type BodyExternalReferenceVerification = 'repository-inspected' | 'live-verification-pending'

export interface BodyMandatoryExternalReference {
  id: 'thebuggeddev-anatomy' | 'thebuggeddev-breath-atlas'
  label: string
  url: string
  role: BodyExternalReferenceRole
  required: true
  scientificAuthority: false
  verification: BodyExternalReferenceVerification
  licenseStatus: 'verification-required'
  assetImportPolicy: 'blocked-until-license-and-provenance-verified'
  academicReviewStatus: 'not-recorded'
  note: string
}

/**
 * Mandatory product/design references requested for Panacea Body maturation.
 *
 * These entries are deliberately NOT scientific sources. They may inform
 * interaction and implementation ideas, but they cannot supply anatomy truth,
 * geometry provenance, clinical claims, or assets until license/provenance and
 * the relevant academic review are independently verified.
 */
export const BODY_MANDATORY_EXTERNAL_REFERENCES: readonly BodyMandatoryExternalReference[] = [
  {
    id: 'thebuggeddev-anatomy',
    label: 'thebuggeddev/anatomy',
    url: 'https://github.com/thebuggeddev/anatomy',
    role: 'implementation-reference',
    required: true,
    scientificAuthority: false,
    verification: 'repository-inspected',
    licenseStatus: 'verification-required',
    assetImportPolicy: 'blocked-until-license-and-provenance-verified',
    academicReviewStatus: 'not-recorded',
    note: 'Use navigation, organ-card and hotspot interaction ideas only. Do not import external meshes, hotspot coordinates, labels or medical prose as verified anatomy without independent license, provenance and academic review.',
  },
  {
    id: 'thebuggeddev-breath-atlas',
    label: 'Breath Atlas · thebuggeddev',
    url: 'https://breath-atlas.thebuggeddev.chatgpt.site/',
    role: 'interaction-reference',
    required: true,
    scientificAuthority: false,
    verification: 'live-verification-pending',
    licenseStatus: 'verification-required',
    assetImportPolicy: 'blocked-until-license-and-provenance-verified',
    academicReviewStatus: 'not-recorded',
    note: 'Required respiratory interaction reference. Panacea must reproduce useful concepts with its own provenance-bearing Body3D/Z-Anatomy pipeline rather than iframe, remote-runtime embedding, or unverified content copying.',
  },
] as const

export function canImportMandatoryBodyReferenceAssets(reference: BodyMandatoryExternalReference) {
  return reference.assetImportPolicy !== 'blocked-until-license-and-provenance-verified'
}

export function mandatoryBodyReferenceById(id: BodyMandatoryExternalReference['id']) {
  return BODY_MANDATORY_EXTERNAL_REFERENCES.find((reference) => reference.id === id)
}
