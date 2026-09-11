export type EyeVisibleGroup =
  | 'orbit'
  | 'eyelid-adnexa'
  | 'ocular-surface'
  | 'globe'
  | 'anterior-segment'
  | 'posterior-segment'
  | 'extraocular'
  | 'lacrimal'
  | 'neurovascular'

export type EyeVisibleGeometryStatus = 'source-geometry-required' | 'reference-only'
export type EyeVisibleReviewStatus = 'academic-review-pending'

export interface EyeVisibleStructure {
  id: string
  label: string
  group: EyeVisibleGroup
  parentId: string | null
  geometryStatus: EyeVisibleGeometryStatus
  evidenceAnchor: string
  reviewStatus: EyeVisibleReviewStatus
  mustBeSelectable: boolean
  notes?: string
}

const S = (
  id: string,
  label: string,
  group: EyeVisibleGroup,
  parentId: string | null,
  geometryStatus: EyeVisibleGeometryStatus,
  evidenceAnchor: string,
  mustBeSelectable = true,
  notes?: string,
): EyeVisibleStructure => ({
  id,
  label,
  group,
  parentId,
  geometryStatus,
  evidenceAnchor,
  reviewStatus: 'academic-review-pending',
  mustBeSelectable,
  notes,
})

/**
 * Eye Wave 1 is deliberately visible-first.
 * It does not descend into histology, proteins, pathways, molecules or DNA.
 * Missing exact source geometry stays reference-only instead of being fabricated.
 */
export const EYE_VISIBLE_WAVE1: readonly EyeVisibleStructure[] = [
  S('eye-system', 'Eye and visual system', 'orbit', null, 'source-geometry-required', 'NCBI:NBK482428'),
  S('orbit', 'Bony orbit', 'orbit', 'eye-system', 'source-geometry-required', 'NCBI:NBK482428'),
  S('orbital-fat', 'Orbital fat', 'orbit', 'orbit', 'source-geometry-required', 'NCBI:NBK482304'),
  S('globe', 'Eyeball / globe', 'globe', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),

  S('upper-eyelid', 'Upper eyelid / palpebra superior', 'eyelid-adnexa', 'orbit', 'source-geometry-required', 'NCBI:NBK482304'),
  S('lower-eyelid', 'Lower eyelid / palpebra inferior', 'eyelid-adnexa', 'orbit', 'source-geometry-required', 'NCBI:NBK482304'),
  S('upper-tarsal-plate', 'Upper tarsal plate', 'eyelid-adnexa', 'upper-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('lower-tarsal-plate', 'Lower tarsal plate', 'eyelid-adnexa', 'lower-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('upper-meibomian-glands', 'Upper Meibomian glands', 'eyelid-adnexa', 'upper-tarsal-plate', 'reference-only', 'NCBI:NBK482304'),
  S('lower-meibomian-glands', 'Lower Meibomian glands', 'eyelid-adnexa', 'lower-tarsal-plate', 'reference-only', 'NCBI:NBK482304'),
  S('upper-eyelashes', 'Upper eyelashes', 'eyelid-adnexa', 'upper-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('lower-eyelashes', 'Lower eyelashes', 'eyelid-adnexa', 'lower-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('medial-canthus', 'Medial canthus', 'eyelid-adnexa', 'orbit', 'reference-only', 'NCBI:NBK482304'),
  S('lateral-canthus', 'Lateral canthus', 'eyelid-adnexa', 'orbit', 'reference-only', 'NCBI:NBK482304'),
  S('medial-canthal-tendon', 'Medial canthal tendon', 'eyelid-adnexa', 'medial-canthus', 'reference-only', 'NCBI:NBK482304'),
  S('lateral-canthal-tendon', 'Lateral canthal tendon', 'eyelid-adnexa', 'lateral-canthus', 'reference-only', 'NCBI:NBK482304'),
  S('levator-palpebrae-superioris', 'Levator palpebrae superioris', 'eyelid-adnexa', 'upper-eyelid', 'source-geometry-required', 'NCBI:NBK482304'),
  S('orbicularis-oculi', 'Orbicularis oculi', 'eyelid-adnexa', 'orbit', 'source-geometry-required', 'NCBI:NBK482304'),
  S('orbital-septum', 'Orbital septum', 'eyelid-adnexa', 'orbit', 'reference-only', 'NCBI:NBK482304'),

  S('conjunctiva', 'Conjunctiva', 'ocular-surface', 'eye-system', 'reference-only', 'NCBI:NBK482428'),
  S('palpebral-conjunctiva', 'Palpebral conjunctiva', 'ocular-surface', 'conjunctiva', 'reference-only', 'NCBI:NBK482304'),
  S('bulbar-conjunctiva', 'Bulbar conjunctiva', 'ocular-surface', 'conjunctiva', 'reference-only', 'NCBI:NBK482428'),
  S('conjunctival-fornix-superior', 'Superior conjunctival fornix', 'ocular-surface', 'conjunctiva', 'reference-only', 'NCBI:NBK482304'),
  S('conjunctival-fornix-inferior', 'Inferior conjunctival fornix', 'ocular-surface', 'conjunctiva', 'reference-only', 'NCBI:NBK482304'),
  S('lacrimal-caruncle', 'Lacrimal caruncle', 'ocular-surface', 'medial-canthus', 'reference-only', 'NCBI:NBK482304'),
  S('plica-semilunaris', 'Plica semilunaris', 'ocular-surface', 'medial-canthus', 'reference-only', 'NCBI:NBK482304'),

  S('cornea', 'Cornea', 'globe', 'globe', 'source-geometry-required', 'NCBI:NBK482428'),
  S('sclera', 'Sclera', 'globe', 'globe', 'source-geometry-required', 'NCBI:NBK482428'),
  S('corneoscleral-limbus', 'Corneoscleral limbus', 'globe', 'globe', 'reference-only', 'NCBI:NBK53329'),
  S('iris', 'Iris', 'anterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK11120'),
  S('pupil', 'Pupil', 'anterior-segment', 'iris', 'reference-only', 'NCBI:NBK11120', true, 'Aperture only; never create a tissue mesh for the pupil.'),
  S('ciliary-body', 'Ciliary body', 'anterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK11120'),
  S('lens', 'Lens', 'anterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK482428'),
  S('zonular-apparatus', 'Zonular apparatus / suspensory fibers', 'anterior-segment', 'lens', 'reference-only', 'NCBI:NBK482428'),
  S('anterior-chamber', 'Anterior chamber', 'anterior-segment', 'globe', 'reference-only', 'NCBI:NBK11120'),
  S('posterior-chamber', 'Posterior chamber', 'anterior-segment', 'globe', 'reference-only', 'NCBI:NBK11120'),
  S('aqueous-humor', 'Aqueous humor', 'anterior-segment', 'globe', 'reference-only', 'NCBI:NBK11120'),

  S('choroid', 'Choroid', 'posterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK11120'),
  S('retina', 'Retina', 'posterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK482428'),
  S('macula', 'Macula', 'posterior-segment', 'retina', 'reference-only', 'NCBI:NBK553189'),
  S('fovea', 'Fovea centralis', 'posterior-segment', 'macula', 'reference-only', 'NCBI:NBK553189'),
  S('optic-disc', 'Optic disc / optic nerve head', 'posterior-segment', 'retina', 'reference-only', 'NCBI:NBK553189'),
  S('vitreous-body', 'Vitreous body', 'posterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK11120'),

  S('extraocular-muscles', 'Extraocular muscles', 'extraocular', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('superior-rectus', 'Superior rectus', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('inferior-rectus', 'Inferior rectus', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('medial-rectus', 'Medial rectus', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('lateral-rectus', 'Lateral rectus', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('superior-oblique', 'Superior oblique', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('inferior-oblique', 'Inferior oblique', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('trochlea', 'Trochlea of superior oblique', 'extraocular', 'superior-oblique', 'reference-only', 'NCBI:NBK482428'),

  S('lacrimal-gland', 'Lacrimal gland', 'lacrimal', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('lacrimal-excretory-ducts', 'Lacrimal gland excretory ducts', 'lacrimal', 'lacrimal-gland', 'reference-only', 'NCBI:NBK482428'),
  S('superior-lacrimal-punctum', 'Superior lacrimal punctum', 'lacrimal', 'upper-eyelid', 'reference-only', 'NCBI:NBK482213'),
  S('inferior-lacrimal-punctum', 'Inferior lacrimal punctum', 'lacrimal', 'lower-eyelid', 'reference-only', 'NCBI:NBK482213'),
  S('superior-canaliculus', 'Superior lacrimal canaliculus', 'lacrimal', 'superior-lacrimal-punctum', 'reference-only', 'NCBI:NBK482213'),
  S('inferior-canaliculus', 'Inferior lacrimal canaliculus', 'lacrimal', 'inferior-lacrimal-punctum', 'reference-only', 'NCBI:NBK482213'),
  S('common-canaliculus', 'Common lacrimal canaliculus', 'lacrimal', 'eye-system', 'reference-only', 'NCBI:NBK482213'),
  S('lacrimal-sac', 'Lacrimal sac', 'lacrimal', 'eye-system', 'source-geometry-required', 'NCBI:NBK482213'),
  S('nasolacrimal-duct', 'Nasolacrimal duct', 'lacrimal', 'lacrimal-sac', 'source-geometry-required', 'NCBI:NBK482213'),
  S('inferior-nasal-meatus', 'Inferior nasal meatus drainage endpoint', 'lacrimal', 'nasolacrimal-duct', 'reference-only', 'NCBI:NBK482213'),

  S('optic-nerve', 'Optic nerve (CN II)', 'neurovascular', 'globe', 'source-geometry-required', 'NCBI:NBK553189'),
  S('optic-chiasm', 'Optic chiasm', 'neurovascular', 'eye-system', 'source-geometry-required', 'NCBI:NBK553189'),
  S('optic-tract', 'Optic tract', 'neurovascular', 'eye-system', 'source-geometry-required', 'NCBI:NBK553189'),
  S('ophthalmic-artery', 'Ophthalmic artery', 'neurovascular', 'orbit', 'source-geometry-required', 'NCBI:NBK53329'),
  S('central-retinal-artery', 'Central retinal artery', 'neurovascular', 'optic-nerve', 'reference-only', 'NCBI:NBK53329'),
  S('central-retinal-vein', 'Central retinal vein', 'neurovascular', 'optic-nerve', 'reference-only', 'NCBI:NBK53329'),
  S('posterior-ciliary-arteries', 'Posterior ciliary arteries', 'neurovascular', 'ophthalmic-artery', 'reference-only', 'NCBI:NBK53329'),
] as const

export const EYE_VISIBLE_WAVE1_REQUIRED_IDS = [
  'upper-eyelid', 'lower-eyelid', 'upper-tarsal-plate', 'lower-tarsal-plate',
  'upper-meibomian-glands', 'lower-meibomian-glands', 'palpebral-conjunctiva', 'bulbar-conjunctiva',
  'cornea', 'sclera', 'iris', 'ciliary-body', 'lens', 'choroid', 'retina', 'macula', 'fovea', 'optic-disc',
  'superior-rectus', 'inferior-rectus', 'medial-rectus', 'lateral-rectus', 'superior-oblique', 'inferior-oblique',
  'lacrimal-gland', 'superior-lacrimal-punctum', 'inferior-lacrimal-punctum', 'superior-canaliculus', 'inferior-canaliculus',
  'lacrimal-sac', 'nasolacrimal-duct', 'optic-nerve', 'ophthalmic-artery',
] as const

export const EYE_DEEPER_WAVES = {
  wave2: 'Tunics and structural layers: corneal layers, scleral microstructure, uveal layers, ciliary muscle/processes, lens capsule/epithelium/fibers, trabecular meshwork and Schlemm canal.',
  wave3: 'Retinal and corneal histology: full retinal lamination, RPE, photoreceptors, Müller/bipolar/horizontal/amacrine/ganglion cells, corneal epithelium/Bowman/stroma/Descemet/endothelium.',
  wave4: 'Cellular and organelle representations only where evidence supports them.',
  wave5: 'Protein/pathway/molecule/gene/DNA navigation after the visible and microscopic anatomy is mature.',
} as const

export function validateEyeVisibleWave1(records: readonly EyeVisibleStructure[] = EYE_VISIBLE_WAVE1): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`label:${item.id}`)
    if (!item.evidenceAnchor.startsWith('NCBI:')) errors.push(`evidence:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
  }
  for (const item of records) if (item.parentId && !ids.has(item.parentId)) errors.push(`parent:${item.id}:${item.parentId}`)
  for (const id of EYE_VISIBLE_WAVE1_REQUIRED_IDS) if (!ids.has(id)) errors.push(`required:${id}`)
  return errors
}
