export type EyeOrbitAdnexaDomain =
  | 'orbit'
  | 'extraocular-muscle'
  | 'eyelid'
  | 'lacrimal'
  | 'neurovascular'

export type EyeOrbitAdnexaGeometryStatus = 'reference-only'
export type EyeOrbitAdnexaReviewStatus = 'academic-review-pending'

export interface EyeOrbitAdnexaNode {
  id: string
  label: string
  domain: EyeOrbitAdnexaDomain
  parentId: string | null
  searchTerms: readonly string[]
  evidenceAnchor: string
  geometryStatus: EyeOrbitAdnexaGeometryStatus
  reviewStatus: EyeOrbitAdnexaReviewStatus
  representationPolicy: 'reference-overlay-only'
  patientSpecific: false
}

const N = (
  id: string,
  label: string,
  domain: EyeOrbitAdnexaDomain,
  parentId: string | null,
  searchTerms: readonly string[],
  evidenceAnchor: string,
): EyeOrbitAdnexaNode => ({
  id,
  label,
  domain,
  parentId,
  searchTerms,
  evidenceAnchor,
  geometryStatus: 'reference-only',
  reviewStatus: 'academic-review-pending',
  representationPolicy: 'reference-overlay-only',
  patientSpecific: false,
})

/**
 * Source-backed educational inventory for the orbit and ocular adnexa.
 * These records intentionally remain reference-only until exact compatible source geometry,
 * asset-level licensing/provenance and qualified academic review are recorded.
 */
export const EYE_ORBIT_ADNEXA_WAVE13: readonly EyeOrbitAdnexaNode[] = [
  N('bony-orbit', 'Bony orbit', 'orbit', null, ['orbit', 'bony orbit'], 'NCBI:NBK539843'),
  N('orbital-fat', 'Orbital adipose tissue', 'orbit', 'bony-orbit', ['orbital fat', 'orbital adipose tissue'], 'NCBI:NBK539843'),

  N('superior-rectus', 'Superior rectus', 'extraocular-muscle', 'bony-orbit', ['superior rectus muscle'], 'NCBI:NBK519565'),
  N('inferior-rectus', 'Inferior rectus', 'extraocular-muscle', 'bony-orbit', ['inferior rectus muscle'], 'NCBI:NBK519565'),
  N('medial-rectus', 'Medial rectus', 'extraocular-muscle', 'bony-orbit', ['medial rectus muscle'], 'NCBI:NBK519565'),
  N('lateral-rectus', 'Lateral rectus', 'extraocular-muscle', 'bony-orbit', ['lateral rectus muscle'], 'NCBI:NBK519565'),
  N('superior-oblique', 'Superior oblique', 'extraocular-muscle', 'bony-orbit', ['superior oblique muscle'], 'NCBI:NBK519565'),
  N('inferior-oblique', 'Inferior oblique', 'extraocular-muscle', 'bony-orbit', ['inferior oblique muscle'], 'NCBI:NBK519565'),
  N('levator-palpebrae-superioris', 'Levator palpebrae superioris', 'eyelid', 'bony-orbit', ['levator palpebrae superioris'], 'NCBI:NBK519565'),

  N('lacrimal-apparatus', 'Lacrimal apparatus', 'lacrimal', 'bony-orbit', ['lacrimal apparatus'], 'NCBI:NBK539843'),
  N('lacrimal-gland', 'Lacrimal gland', 'lacrimal', 'lacrimal-apparatus', ['lacrimal gland'], 'NCBI:NBK539843'),

  N('ophthalmic-artery', 'Ophthalmic artery', 'neurovascular', 'bony-orbit', ['ophthalmic artery'], 'NCBI:NBK470534'),
  N('superior-ophthalmic-vein', 'Superior ophthalmic vein', 'neurovascular', 'bony-orbit', ['superior ophthalmic vein'], 'NCBI:NBK470534'),
  N('inferior-ophthalmic-vein', 'Inferior ophthalmic vein', 'neurovascular', 'bony-orbit', ['inferior ophthalmic vein'], 'NCBI:NBK470534'),
] as const

export const EYE_ORBIT_ADNEXA_REQUIRED_IDS = [
  'bony-orbit',
  'superior-rectus', 'inferior-rectus', 'medial-rectus', 'lateral-rectus',
  'superior-oblique', 'inferior-oblique', 'levator-palpebrae-superioris',
  'lacrimal-apparatus', 'lacrimal-gland',
  'ophthalmic-artery', 'superior-ophthalmic-vein', 'inferior-ophthalmic-vein',
] as const

const acceptedEvidence = /^NCBI:NBK\d+$/

export function validateEyeOrbitAdnexaWave13(
  records: readonly EyeOrbitAdnexaNode[] = EYE_ORBIT_ADNEXA_WAVE13,
): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`label:${item.id}`)
    if (item.searchTerms.length === 0 || item.searchTerms.some((term) => !term.trim())) errors.push(`search:${item.id}`)
    if (!acceptedEvidence.test(item.evidenceAnchor)) errors.push(`evidence:${item.id}`)
    if (item.geometryStatus !== 'reference-only') errors.push(`geometry:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
    if (item.representationPolicy !== 'reference-overlay-only') errors.push(`representation:${item.id}`)
    if (item.patientSpecific !== false) errors.push(`patient:${item.id}`)
  }

  for (const item of records) {
    if (item.parentId && !ids.has(item.parentId)) errors.push(`parent:${item.id}:${item.parentId}`)
  }
  for (const id of EYE_ORBIT_ADNEXA_REQUIRED_IDS) if (!ids.has(id)) errors.push(`required:${id}`)

  return errors
}

export const EYE_ORBIT_ADNEXA_WAVE13_BOUNDARY =
  'Educational reference overlay only. Do not invent orbital coordinates, muscle insertion measurements, surgical safe zones, patient-specific gaze mechanics, lesion localization, pressure, flow, or verified 3D geometry. Promotion requires exact compatible source geometry, asset-level provenance/license evidence and qualified academic review.'
