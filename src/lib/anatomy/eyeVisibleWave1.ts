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
  | 'visual-pathway'

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
): EyeVisibleStructure => ({ id, label, group, parentId, geometryStatus, evidenceAnchor, reviewStatus: 'academic-review-pending', mustBeSelectable, notes })

/**
 * Eye Wave 1 = gross/visible ocular anatomy only. This intentionally finishes
 * the large macroscopic layer before descending into histology/cellular work.
 * Missing exact provenance-bearing geometry remains reference-only; no mesh is
 * synthesized merely to satisfy completeness.
 */
export const EYE_VISIBLE_WAVE1: readonly EyeVisibleStructure[] = [
  S('eye-system', 'Eye and visual system', 'orbit', null, 'source-geometry-required', 'NCBI:NBK482428'),
  S('orbit', 'Bony orbit', 'orbit', 'eye-system', 'source-geometry-required', 'NCBI:NBK482428'),
  S('orbital-roof', 'Orbital roof', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482428'),
  S('orbital-floor', 'Orbital floor', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482428'),
  S('orbital-medial-wall', 'Medial orbital wall', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482428'),
  S('orbital-lateral-wall', 'Lateral orbital wall', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482428'),
  S('orbital-rim', 'Orbital rim', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482428'),
  S('orbital-apex', 'Orbital apex', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482428'),
  S('optic-canal', 'Optic canal', 'orbit', 'orbital-apex', 'source-geometry-required', 'NCBI:NBK482428'),
  S('superior-orbital-fissure', 'Superior orbital fissure', 'orbit', 'orbital-apex', 'source-geometry-required', 'NCBI:NBK482428'),
  S('inferior-orbital-fissure', 'Inferior orbital fissure', 'orbit', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('periorbita', 'Periorbita', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482304'),
  S('orbital-fat', 'Orbital fat', 'orbit', 'orbit', 'source-geometry-required', 'NCBI:NBK482304'),
  S('intraconal-space', 'Intraconal space', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482304'),
  S('extraconal-space', 'Extraconal space', 'orbit', 'orbit', 'reference-only', 'NCBI:NBK482304'),
  S('common-tendinous-ring', 'Common tendinous ring / annulus of Zinn', 'orbit', 'orbital-apex', 'reference-only', 'NCBI:NBK482428'),
  S('tenon-capsule', 'Tenon capsule / fascia bulbi', 'orbit', 'globe', 'reference-only', 'NCBI:NBK482304'),
  S('lockwood-ligament', 'Suspensory ligament of Lockwood', 'orbit', 'globe', 'reference-only', 'NCBI:NBK482304'),
  S('whitnall-ligament', 'Superior transverse ligament of Whitnall', 'orbit', 'upper-eyelid', 'reference-only', 'NCBI:NBK482304'),

  S('globe', 'Eyeball / globe', 'globe', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('anterior-pole', 'Anterior pole', 'globe', 'globe', 'reference-only', 'NCBI:NBK482428'),
  S('posterior-pole', 'Posterior pole', 'globe', 'globe', 'reference-only', 'NCBI:NBK482428'),
  S('visual-axis', 'Visual axis', 'globe', 'globe', 'reference-only', 'NCBI:NBK482428', false, 'Conceptual axis; never rendered as tissue.'),
  S('cornea', 'Cornea', 'globe', 'globe', 'source-geometry-required', 'NCBI:NBK482428'),
  S('sclera', 'Sclera', 'globe', 'globe', 'source-geometry-required', 'NCBI:NBK482428'),
  S('episclera', 'Episclera', 'globe', 'sclera', 'reference-only', 'NCBI:NBK53329'),
  S('corneoscleral-limbus', 'Corneoscleral limbus', 'globe', 'globe', 'reference-only', 'NCBI:NBK53329'),

  S('upper-eyelid', 'Upper eyelid / palpebra superior', 'eyelid-adnexa', 'orbit', 'source-geometry-required', 'NCBI:NBK482304'),
  S('lower-eyelid', 'Lower eyelid / palpebra inferior', 'eyelid-adnexa', 'orbit', 'source-geometry-required', 'NCBI:NBK482304'),
  S('upper-tarsal-plate', 'Upper tarsal plate', 'eyelid-adnexa', 'upper-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('lower-tarsal-plate', 'Lower tarsal plate', 'eyelid-adnexa', 'lower-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('upper-meibomian-glands', 'Upper Meibomian glands', 'eyelid-adnexa', 'upper-tarsal-plate', 'reference-only', 'NCBI:NBK482304'),
  S('lower-meibomian-glands', 'Lower Meibomian glands', 'eyelid-adnexa', 'lower-tarsal-plate', 'reference-only', 'NCBI:NBK482304'),
  S('glands-of-zeis', 'Glands of Zeis', 'eyelid-adnexa', 'upper-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('glands-of-moll', 'Glands of Moll', 'eyelid-adnexa', 'upper-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('upper-eyelashes', 'Upper eyelashes', 'eyelid-adnexa', 'upper-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('lower-eyelashes', 'Lower eyelashes', 'eyelid-adnexa', 'lower-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('medial-canthus', 'Medial canthus', 'eyelid-adnexa', 'orbit', 'reference-only', 'NCBI:NBK482304'),
  S('lateral-canthus', 'Lateral canthus', 'eyelid-adnexa', 'orbit', 'reference-only', 'NCBI:NBK482304'),
  S('medial-canthal-tendon', 'Medial canthal tendon', 'eyelid-adnexa', 'medial-canthus', 'reference-only', 'NCBI:NBK482304'),
  S('lateral-canthal-tendon', 'Lateral canthal tendon', 'eyelid-adnexa', 'lateral-canthus', 'reference-only', 'NCBI:NBK482304'),
  S('levator-palpebrae-superioris', 'Levator palpebrae superioris', 'eyelid-adnexa', 'upper-eyelid', 'source-geometry-required', 'NCBI:NBK482304'),
  S('levator-aponeurosis', 'Levator aponeurosis', 'eyelid-adnexa', 'levator-palpebrae-superioris', 'reference-only', 'NCBI:NBK482304'),
  S('superior-tarsal-muscle', 'Superior tarsal / Müller muscle', 'eyelid-adnexa', 'upper-eyelid', 'reference-only', 'NCBI:NBK482304'),
  S('orbicularis-oculi', 'Orbicularis oculi', 'eyelid-adnexa', 'orbit', 'source-geometry-required', 'NCBI:NBK482304'),
  S('orbital-septum', 'Orbital septum', 'eyelid-adnexa', 'orbit', 'reference-only', 'NCBI:NBK482304'),

  S('conjunctiva', 'Conjunctiva', 'ocular-surface', 'eye-system', 'reference-only', 'NCBI:NBK482428'),
  S('palpebral-conjunctiva', 'Palpebral conjunctiva', 'ocular-surface', 'conjunctiva', 'reference-only', 'NCBI:NBK482304'),
  S('bulbar-conjunctiva', 'Bulbar conjunctiva', 'ocular-surface', 'conjunctiva', 'reference-only', 'NCBI:NBK482428'),
  S('superior-conjunctival-fornix', 'Superior conjunctival fornix', 'ocular-surface', 'conjunctiva', 'reference-only', 'NCBI:NBK482304'),
  S('inferior-conjunctival-fornix', 'Inferior conjunctival fornix', 'ocular-surface', 'conjunctiva', 'reference-only', 'NCBI:NBK482304'),
  S('lacrimal-caruncle', 'Lacrimal caruncle', 'ocular-surface', 'medial-canthus', 'reference-only', 'NCBI:NBK482304'),
  S('plica-semilunaris', 'Plica semilunaris', 'ocular-surface', 'medial-canthus', 'reference-only', 'NCBI:NBK482304'),

  S('iris', 'Iris', 'anterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK11120'),
  S('pupil', 'Pupil', 'anterior-segment', 'iris', 'reference-only', 'NCBI:NBK11120', true, 'Aperture only; never create a tissue mesh for the pupil.'),
  S('ciliary-body', 'Ciliary body', 'anterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK11120'),
  S('ciliary-processes', 'Ciliary processes', 'anterior-segment', 'ciliary-body', 'reference-only', 'NCBI:NBK11120'),
  S('ciliary-muscle', 'Ciliary muscle', 'anterior-segment', 'ciliary-body', 'reference-only', 'NCBI:NBK482428'),
  S('lens', 'Lens', 'anterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK482428'),
  S('zonular-apparatus', 'Zonular apparatus / suspensory fibers', 'anterior-segment', 'lens', 'reference-only', 'NCBI:NBK482428'),
  S('anterior-chamber', 'Anterior chamber', 'anterior-segment', 'globe', 'reference-only', 'NCBI:NBK11120'),
  S('posterior-chamber', 'Posterior chamber', 'anterior-segment', 'globe', 'reference-only', 'NCBI:NBK11120'),
  S('iridocorneal-angle', 'Iridocorneal angle', 'anterior-segment', 'anterior-chamber', 'reference-only', 'NCBI:NBK53329'),
  S('trabecular-meshwork', 'Trabecular meshwork', 'anterior-segment', 'iridocorneal-angle', 'reference-only', 'NCBI:NBK11120'),
  S('schlemm-canal', 'Canal of Schlemm', 'anterior-segment', 'iridocorneal-angle', 'reference-only', 'NCBI:NBK53329'),
  S('scleral-spur', 'Scleral spur', 'anterior-segment', 'iridocorneal-angle', 'reference-only', 'NCBI:NBK53329'),
  S('aqueous-humor', 'Aqueous humor', 'anterior-segment', 'globe', 'reference-only', 'NCBI:NBK11120'),

  S('choroid', 'Choroid', 'posterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK11120'),
  S('retina', 'Retina', 'posterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK482428'),
  S('ora-serrata', 'Ora serrata', 'posterior-segment', 'retina', 'reference-only', 'NCBI:NBK482428'),
  S('macula', 'Macula', 'posterior-segment', 'retina', 'reference-only', 'NCBI:NBK553189'),
  S('fovea', 'Fovea centralis', 'posterior-segment', 'macula', 'reference-only', 'NCBI:NBK553189'),
  S('foveola', 'Foveola', 'posterior-segment', 'fovea', 'reference-only', 'NCBI:NBK553189'),
  S('optic-disc', 'Optic disc / optic nerve head', 'posterior-segment', 'retina', 'reference-only', 'NCBI:NBK553189'),
  S('vitreous-body', 'Vitreous body', 'posterior-segment', 'globe', 'source-geometry-required', 'NCBI:NBK11120'),
  S('vitreous-base', 'Vitreous base', 'posterior-segment', 'vitreous-body', 'reference-only', 'NCBI:NBK11120'),
  S('hyaloid-canal', 'Hyaloid / Cloquet canal', 'posterior-segment', 'vitreous-body', 'reference-only', 'NCBI:NBK11120'),

  S('extraocular-muscles', 'Extraocular muscles', 'extraocular', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('superior-rectus', 'Superior rectus', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('inferior-rectus', 'Inferior rectus', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('medial-rectus', 'Medial rectus', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('lateral-rectus', 'Lateral rectus', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('superior-oblique', 'Superior oblique', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('inferior-oblique', 'Inferior oblique', 'extraocular', 'extraocular-muscles', 'source-geometry-required', 'NCBI:NBK482428'),
  S('trochlea', 'Trochlea of superior oblique', 'extraocular', 'superior-oblique', 'reference-only', 'NCBI:NBK482428'),

  S('lacrimal-system', 'Lacrimal apparatus', 'lacrimal', 'orbit', 'source-geometry-required', 'NCBI:NBK482213'),
  S('lacrimal-gland', 'Lacrimal gland', 'lacrimal', 'lacrimal-system', 'source-geometry-required', 'NCBI:NBK482428'),
  S('lacrimal-gland-orbital-lobe', 'Orbital lobe of lacrimal gland', 'lacrimal', 'lacrimal-gland', 'reference-only', 'NCBI:NBK482428'),
  S('lacrimal-gland-palpebral-lobe', 'Palpebral lobe of lacrimal gland', 'lacrimal', 'lacrimal-gland', 'reference-only', 'NCBI:NBK482428'),
  S('lacrimal-excretory-ducts', 'Lacrimal gland excretory ducts', 'lacrimal', 'lacrimal-gland', 'reference-only', 'NCBI:NBK482428'),
  S('superior-lacrimal-punctum', 'Superior lacrimal punctum', 'lacrimal', 'upper-eyelid', 'reference-only', 'NCBI:NBK482213'),
  S('inferior-lacrimal-punctum', 'Inferior lacrimal punctum', 'lacrimal', 'lower-eyelid', 'reference-only', 'NCBI:NBK482213'),
  S('superior-canaliculus', 'Superior lacrimal canaliculus', 'lacrimal', 'superior-lacrimal-punctum', 'reference-only', 'NCBI:NBK482213'),
  S('inferior-canaliculus', 'Inferior lacrimal canaliculus', 'lacrimal', 'inferior-lacrimal-punctum', 'reference-only', 'NCBI:NBK482213'),
  S('common-canaliculus', 'Common lacrimal canaliculus', 'lacrimal', 'lacrimal-system', 'reference-only', 'NCBI:NBK482213'),
  S('lacrimal-sac', 'Lacrimal sac', 'lacrimal', 'lacrimal-system', 'source-geometry-required', 'NCBI:NBK482213'),
  S('nasolacrimal-duct', 'Nasolacrimal duct', 'lacrimal', 'lacrimal-sac', 'source-geometry-required', 'NCBI:NBK482213'),
  S('inferior-nasal-meatus', 'Inferior nasal meatus drainage endpoint', 'lacrimal', 'nasolacrimal-duct', 'reference-only', 'NCBI:NBK482213'),

  S('ophthalmic-artery', 'Ophthalmic artery', 'neurovascular', 'orbit', 'source-geometry-required', 'NCBI:NBK53329'),
  S('central-retinal-artery', 'Central retinal artery', 'neurovascular', 'ophthalmic-artery', 'reference-only', 'NCBI:NBK53329'),
  S('central-retinal-vein', 'Central retinal vein', 'neurovascular', 'optic-nerve', 'reference-only', 'NCBI:NBK53329'),
  S('short-posterior-ciliary-arteries', 'Short posterior ciliary arteries', 'neurovascular', 'ophthalmic-artery', 'reference-only', 'NCBI:NBK53329'),
  S('long-posterior-ciliary-arteries', 'Long posterior ciliary arteries', 'neurovascular', 'ophthalmic-artery', 'reference-only', 'NCBI:NBK53329'),
  S('anterior-ciliary-arteries', 'Anterior ciliary arteries', 'neurovascular', 'ophthalmic-artery', 'reference-only', 'NCBI:NBK53329'),
  S('choriocapillaris', 'Choriocapillaris', 'neurovascular', 'choroid', 'reference-only', 'NCBI:NBK53329'),
  S('vortex-veins', 'Vortex veins', 'neurovascular', 'choroid', 'reference-only', 'NCBI:NBK53329'),
  S('superior-ophthalmic-vein', 'Superior ophthalmic vein', 'neurovascular', 'orbit', 'source-geometry-required', 'NCBI:NBK53329'),
  S('inferior-ophthalmic-vein', 'Inferior ophthalmic vein', 'neurovascular', 'orbit', 'source-geometry-required', 'NCBI:NBK53329'),
  S('cavernous-sinus-drainage', 'Cavernous sinus venous drainage connection', 'neurovascular', 'orbit', 'reference-only', 'NCBI:NBK53329'),

  S('optic-nerve', 'Optic nerve (CN II)', 'neurovascular', 'globe', 'source-geometry-required', 'NCBI:NBK553189'),
  S('optic-nerve-intraocular', 'Intraocular optic nerve segment', 'neurovascular', 'optic-nerve', 'reference-only', 'NCBI:NBK553189'),
  S('optic-nerve-intraorbital', 'Intraorbital optic nerve segment', 'neurovascular', 'optic-nerve', 'reference-only', 'NCBI:NBK553189'),
  S('optic-nerve-intracanalicular', 'Intracanalicular optic nerve segment', 'neurovascular', 'optic-nerve', 'reference-only', 'NCBI:NBK553189'),
  S('optic-nerve-intracranial', 'Intracranial optic nerve segment', 'neurovascular', 'optic-nerve', 'reference-only', 'NCBI:NBK553189'),
  S('oculomotor-nerve', 'Oculomotor nerve (CN III)', 'neurovascular', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('trochlear-nerve', 'Trochlear nerve (CN IV)', 'neurovascular', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('abducens-nerve', 'Abducens nerve (CN VI)', 'neurovascular', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('ophthalmic-division-trigeminal', 'Ophthalmic division of trigeminal nerve (V1)', 'neurovascular', 'orbit', 'source-geometry-required', 'NCBI:NBK482428'),
  S('nasociliary-nerve', 'Nasociliary nerve', 'neurovascular', 'ophthalmic-division-trigeminal', 'reference-only', 'NCBI:NBK482428'),
  S('long-ciliary-nerves', 'Long ciliary nerves', 'neurovascular', 'nasociliary-nerve', 'reference-only', 'NCBI:NBK482428'),
  S('ciliary-ganglion', 'Ciliary ganglion', 'neurovascular', 'orbit', 'reference-only', 'NCBI:NBK482428'),
  S('short-ciliary-nerves', 'Short ciliary nerves', 'neurovascular', 'ciliary-ganglion', 'reference-only', 'NCBI:NBK482428'),

  S('optic-chiasm', 'Optic chiasm', 'visual-pathway', 'eye-system', 'source-geometry-required', 'NCBI:NBK553189'),
  S('optic-tract', 'Optic tract', 'visual-pathway', 'optic-chiasm', 'source-geometry-required', 'NCBI:NBK553189'),
  S('lateral-geniculate-nucleus', 'Lateral geniculate nucleus', 'visual-pathway', 'optic-tract', 'reference-only', 'NCBI:NBK553189'),
  S('optic-radiations', 'Optic radiations', 'visual-pathway', 'lateral-geniculate-nucleus', 'reference-only', 'NCBI:NBK553189'),
  S('meyer-loop', 'Meyer loop', 'visual-pathway', 'optic-radiations', 'reference-only', 'NCBI:NBK553189'),
  S('parietal-optic-radiations', 'Parietal optic radiations', 'visual-pathway', 'optic-radiations', 'reference-only', 'NCBI:NBK553189'),
  S('primary-visual-cortex', 'Primary visual cortex / calcarine cortex', 'visual-pathway', 'optic-radiations', 'reference-only', 'NCBI:NBK553189'),
] as const

export const EYE_VISIBLE_WAVE1_REQUIRED_IDS = [
  'orbital-roof', 'orbital-floor', 'orbital-medial-wall', 'orbital-lateral-wall', 'orbital-apex', 'optic-canal', 'superior-orbital-fissure',
  'upper-eyelid', 'lower-eyelid', 'upper-tarsal-plate', 'lower-tarsal-plate', 'upper-meibomian-glands', 'lower-meibomian-glands',
  'palpebral-conjunctiva', 'bulbar-conjunctiva', 'cornea', 'sclera', 'iris', 'ciliary-body', 'lens', 'trabecular-meshwork', 'schlemm-canal',
  'choroid', 'retina', 'macula', 'fovea', 'optic-disc', 'vitreous-body',
  'superior-rectus', 'inferior-rectus', 'medial-rectus', 'lateral-rectus', 'superior-oblique', 'inferior-oblique',
  'lacrimal-gland', 'superior-lacrimal-punctum', 'inferior-lacrimal-punctum', 'lacrimal-sac', 'nasolacrimal-duct',
  'ophthalmic-artery', 'central-retinal-artery', 'central-retinal-vein', 'short-posterior-ciliary-arteries', 'long-posterior-ciliary-arteries',
  'optic-nerve', 'oculomotor-nerve', 'trochlear-nerve', 'abducens-nerve', 'ciliary-ganglion', 'optic-chiasm', 'optic-tract', 'lateral-geniculate-nucleus', 'optic-radiations', 'primary-visual-cortex',
] as const

export const EYE_DEEPER_WAVES = {
  wave2: 'Tunics and structural layers only after Wave 1 gross-visible anatomy is accepted.',
  wave3: 'Retinal/corneal histology only after Wave 2 is accepted.',
  wave4: 'Cellular and organelle representations only where evidence supports them.',
  wave5: 'Protein/pathway/molecule/gene/DNA navigation only after macroscopic and microscopic anatomy are mature.',
} as const

export function validateEyeVisibleWave1(records: readonly EyeVisibleStructure[] = EYE_VISIBLE_WAVE1): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`label:${item.id}`)
    if (!(item.evidenceAnchor.startsWith('NCBI:') || item.evidenceAnchor.startsWith('NEI:'))) errors.push(`evidence:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
  }
  for (const item of records) if (item.parentId && !ids.has(item.parentId)) errors.push(`parent:${item.id}:${item.parentId}`)
  for (const id of EYE_VISIBLE_WAVE1_REQUIRED_IDS) if (!ids.has(id)) errors.push(`required:${id}`)
  return errors
}
