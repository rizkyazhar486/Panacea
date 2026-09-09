export type EyeVisibleGroup =
  | 'orbit' | 'eyelid-adnexa' | 'ocular-surface' | 'globe'
  | 'anterior-segment' | 'posterior-segment' | 'extraocular'
  | 'lacrimal' | 'neurovascular' | 'visual-pathway'

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

type RawEye = readonly [string, string, EyeVisibleGroup, string | null, EyeVisibleGeometryStatus, string, boolean?, string?]
const S = (r: RawEye): EyeVisibleStructure => ({
  id: r[0], label: r[1], group: r[2], parentId: r[3], geometryStatus: r[4],
  evidenceAnchor: r[5], reviewStatus: 'academic-review-pending',
  mustBeSelectable: r[6] ?? true, notes: r[7],
})

const G: EyeVisibleGeometryStatus = 'source-geometry-required'
const R: EyeVisibleGeometryStatus = 'reference-only'
const EYE = 'NCBI:NBK482428'
const ORBIT = 'NCBI:NBK531490'
const ORBIT_SOFT = 'NCBI:NBK539843'
const RETINA = 'NCBI:NBK542332'
const NEI = 'NEI:ABOUT-EYE-2025'
const TEARS = 'NEI:HOW-TEARS-WORK-2025'

/** Gross-visible Eye Wave 1. No histology/cellular/molecular geometry is synthesized here. */
const RAW: readonly RawEye[] = [
  ['eye-system','Eye and visual system','orbit',null,G,EYE],
  ['orbit','Bony orbit','orbit','eye-system',G,ORBIT],
  ['orbital-rim','Orbital rim','orbit','orbit',G,ORBIT],
  ['orbital-roof','Orbital roof','orbit','orbit',R,ORBIT],
  ['orbital-floor','Orbital floor','orbit','orbit',R,ORBIT],
  ['orbital-medial-wall','Medial orbital wall','orbit','orbit',R,ORBIT],
  ['orbital-lateral-wall','Lateral orbital wall','orbit','orbit',R,ORBIT],
  ['orbital-apex','Orbital apex','orbit','orbit',R,ORBIT],
  ['optic-canal','Optic canal','orbit','orbital-apex',G,ORBIT],
  ['superior-orbital-fissure','Superior orbital fissure','orbit','orbital-apex',G,ORBIT],
  ['inferior-orbital-fissure','Inferior orbital fissure','orbit','orbit',G,ORBIT],
  ['intraconal-space','Intraconal space','orbit','orbit',R,ORBIT_SOFT],
  ['extraconal-space','Extraconal space','orbit','orbit',R,ORBIT_SOFT],
  ['periorbita','Periorbita','orbit','orbit',R,ORBIT_SOFT],
  ['orbital-fat','Orbital fat','orbit','orbit',G,ORBIT_SOFT],
  ['common-tendinous-ring','Common tendinous ring / annulus of Zinn','orbit','orbital-apex',R,ORBIT_SOFT],
  ['tenon-capsule','Tenon capsule / fascia bulbi','orbit','globe',R,ORBIT_SOFT],
  ['lockwood-ligament','Suspensory ligament of Lockwood','orbit','globe',R,ORBIT_SOFT],
  ['whitnall-ligament','Superior transverse ligament of Whitnall','orbit','upper-eyelid',R,ORBIT_SOFT],

  ['upper-eyelid','Upper eyelid','eyelid-adnexa','orbit',G,EYE],
  ['lower-eyelid','Lower eyelid','eyelid-adnexa','orbit',G,EYE],
  ['palpebral-fissure','Palpebral fissure','eyelid-adnexa','orbit',R,EYE,false,'Opening, not tissue.'],
  ['upper-tarsal-plate','Upper tarsal plate','eyelid-adnexa','upper-eyelid',R,EYE],
  ['lower-tarsal-plate','Lower tarsal plate','eyelid-adnexa','lower-eyelid',R,EYE],
  ['upper-meibomian-glands','Upper Meibomian glands','eyelid-adnexa','upper-tarsal-plate',R,EYE],
  ['lower-meibomian-glands','Lower Meibomian glands','eyelid-adnexa','lower-tarsal-plate',R,EYE],
  ['glands-of-zeis','Glands of Zeis','eyelid-adnexa','upper-eyelid',R,EYE],
  ['glands-of-moll','Glands of Moll','eyelid-adnexa','upper-eyelid',R,EYE],
  ['upper-eyelashes','Upper eyelashes','eyelid-adnexa','upper-eyelid',R,EYE],
  ['lower-eyelashes','Lower eyelashes','eyelid-adnexa','lower-eyelid',R,EYE],
  ['medial-canthus','Medial canthus','eyelid-adnexa','orbit',R,EYE],
  ['lateral-canthus','Lateral canthus','eyelid-adnexa','orbit',R,EYE],
  ['medial-canthal-tendon','Medial canthal tendon','eyelid-adnexa','medial-canthus',R,EYE],
  ['lateral-canthal-tendon','Lateral canthal tendon','eyelid-adnexa','lateral-canthus',R,EYE],
  ['orbital-septum','Orbital septum','eyelid-adnexa','orbit',R,ORBIT_SOFT],
  ['levator-palpebrae-superioris','Levator palpebrae superioris','eyelid-adnexa','upper-eyelid',G,ORBIT_SOFT],
  ['levator-aponeurosis','Levator aponeurosis','eyelid-adnexa','levator-palpebrae-superioris',R,ORBIT_SOFT],
  ['superior-tarsal-muscle','Superior tarsal (Müller) muscle','eyelid-adnexa','upper-eyelid',R,ORBIT_SOFT],
  ['orbicularis-oculi','Orbicularis oculi','eyelid-adnexa','orbit',G,EYE],

  ['conjunctiva','Conjunctiva','ocular-surface','eye-system',R,EYE],
  ['palpebral-conjunctiva','Palpebral conjunctiva','ocular-surface','conjunctiva',R,EYE],
  ['bulbar-conjunctiva','Bulbar conjunctiva','ocular-surface','conjunctiva',R,EYE],
  ['superior-conjunctival-fornix','Superior conjunctival fornix','ocular-surface','conjunctiva',R,EYE],
  ['inferior-conjunctival-fornix','Inferior conjunctival fornix','ocular-surface','conjunctiva',R,EYE],
  ['lacrimal-caruncle','Lacrimal caruncle','ocular-surface','medial-canthus',R,EYE],
  ['plica-semilunaris','Plica semilunaris','ocular-surface','medial-canthus',R,EYE],
  ['tear-film','Tear film','ocular-surface','cornea',R,TEARS,false,'Surface fluid film; not gross tissue geometry.'],

  ['globe','Eyeball / globe','globe','orbit',G,EYE],
  ['anterior-pole','Anterior pole','globe','globe',R,EYE,false],
  ['posterior-pole','Posterior pole','globe','globe',R,EYE,false],
  ['visual-axis','Visual axis','globe','globe',R,NEI,false,'Conceptual axis; never rendered as tissue.'],
  ['cornea','Cornea','globe','globe',G,EYE],
  ['sclera','Sclera','globe','globe',G,EYE],
  ['episclera','Episclera','globe','sclera',R,EYE],
  ['corneoscleral-limbus','Corneoscleral limbus','globe','globe',R,EYE],

  ['iris','Iris','anterior-segment','globe',G,EYE],
  ['pupil','Pupil','anterior-segment','iris',R,NEI,false,'Aperture only; never create a tissue mesh for the pupil.'],
  ['ciliary-body','Ciliary body','anterior-segment','globe',G,EYE],
  ['ciliary-processes','Ciliary processes','anterior-segment','ciliary-body',R,EYE],
  ['ciliary-muscle','Ciliary muscle','anterior-segment','ciliary-body',R,EYE],
  ['lens','Lens','anterior-segment','globe',G,NEI],
  ['lens-capsule','Lens capsule','anterior-segment','lens',R,EYE],
  ['zonular-apparatus','Zonular apparatus / suspensory fibers','anterior-segment','lens',R,EYE],
  ['anterior-chamber','Anterior chamber','anterior-segment','globe',R,EYE],
  ['posterior-chamber','Posterior chamber','anterior-segment','globe',R,EYE],
  ['iridocorneal-angle','Iridocorneal angle','anterior-segment','anterior-chamber',R,EYE],
  ['trabecular-meshwork','Trabecular meshwork','anterior-segment','iridocorneal-angle',R,EYE],
  ['schlemm-canal','Canal of Schlemm','anterior-segment','iridocorneal-angle',R,EYE],
  ['scleral-spur','Scleral spur','anterior-segment','iridocorneal-angle',R,EYE],
  ['aqueous-humor','Aqueous humor','anterior-segment','globe',R,EYE,false],

  ['choroid','Choroid','posterior-segment','globe',G,EYE],
  ['retina','Retina','posterior-segment','globe',G,RETINA],
  ['ora-serrata','Ora serrata','posterior-segment','retina',R,RETINA],
  ['macula','Macula','posterior-segment','retina',R,NEI],
  ['fovea','Fovea centralis','posterior-segment','macula',R,NEI],
  ['foveola','Foveola','posterior-segment','fovea',R,RETINA],
  ['optic-disc','Optic disc / optic nerve head','posterior-segment','retina',R,RETINA],
  ['vitreous-body','Vitreous body','posterior-segment','globe',G,NEI],
  ['vitreous-base','Vitreous base','posterior-segment','vitreous-body',R,EYE],
  ['hyaloid-canal','Hyaloid / Cloquet canal','posterior-segment','vitreous-body',R,EYE],

  ['extraocular-muscles','Extraocular muscles','extraocular','orbit',G,ORBIT_SOFT],
  ['superior-rectus','Superior rectus','extraocular','extraocular-muscles',G,ORBIT_SOFT],
  ['inferior-rectus','Inferior rectus','extraocular','extraocular-muscles',G,ORBIT_SOFT],
  ['medial-rectus','Medial rectus','extraocular','extraocular-muscles',G,ORBIT_SOFT],
  ['lateral-rectus','Lateral rectus','extraocular','extraocular-muscles',G,ORBIT_SOFT],
  ['superior-oblique','Superior oblique','extraocular','extraocular-muscles',G,ORBIT_SOFT],
  ['inferior-oblique','Inferior oblique','extraocular','extraocular-muscles',G,ORBIT_SOFT],
  ['trochlea','Trochlea of superior oblique','extraocular','superior-oblique',R,ORBIT_SOFT],

  ['lacrimal-system','Lacrimal apparatus','lacrimal','orbit',G,EYE],
  ['lacrimal-gland','Lacrimal gland','lacrimal','lacrimal-system',G,EYE],
  ['lacrimal-gland-orbital-lobe','Orbital lobe of lacrimal gland','lacrimal','lacrimal-gland',R,EYE],
  ['lacrimal-gland-palpebral-lobe','Palpebral lobe of lacrimal gland','lacrimal','lacrimal-gland',R,EYE],
  ['lacrimal-excretory-ducts','Lacrimal gland excretory ducts','lacrimal','lacrimal-gland',R,EYE],
  ['superior-lacrimal-punctum','Superior lacrimal punctum','lacrimal','upper-eyelid',R,TEARS],
  ['inferior-lacrimal-punctum','Inferior lacrimal punctum','lacrimal','lower-eyelid',R,TEARS],
  ['superior-canaliculus','Superior lacrimal canaliculus','lacrimal','superior-lacrimal-punctum',R,TEARS],
  ['inferior-canaliculus','Inferior lacrimal canaliculus','lacrimal','inferior-lacrimal-punctum',R,TEARS],
  ['common-canaliculus','Common lacrimal canaliculus','lacrimal','lacrimal-system',R,TEARS],
  ['lacrimal-sac','Lacrimal sac','lacrimal','lacrimal-system',G,TEARS],
  ['nasolacrimal-duct','Nasolacrimal duct','lacrimal','lacrimal-sac',G,TEARS],
  ['inferior-nasal-meatus','Inferior nasal meatus drainage endpoint','lacrimal','nasolacrimal-duct',R,TEARS],

  ['ophthalmic-artery','Ophthalmic artery','neurovascular','orbit',G,ORBIT],
  ['central-retinal-artery','Central retinal artery','neurovascular','ophthalmic-artery',R,RETINA],
  ['central-retinal-vein','Central retinal vein','neurovascular','optic-nerve',R,RETINA],
  ['short-posterior-ciliary-arteries','Short posterior ciliary arteries','neurovascular','ophthalmic-artery',R,EYE],
  ['long-posterior-ciliary-arteries','Long posterior ciliary arteries','neurovascular','ophthalmic-artery',R,EYE],
  ['anterior-ciliary-arteries','Anterior ciliary arteries','neurovascular','ophthalmic-artery',R,EYE],
  ['choriocapillaris','Choriocapillaris','neurovascular','choroid',R,RETINA],
  ['vortex-veins','Vortex veins','neurovascular','choroid',R,EYE],
  ['superior-ophthalmic-vein','Superior ophthalmic vein','neurovascular','orbit',G,ORBIT_SOFT],
  ['inferior-ophthalmic-vein','Inferior ophthalmic vein','neurovascular','orbit',G,ORBIT_SOFT],
  ['cavernous-sinus-drainage','Cavernous sinus drainage connection','neurovascular','orbit',R,ORBIT_SOFT],
  ['optic-nerve','Optic nerve (CN II)','neurovascular','globe',G,NEI],
  ['optic-nerve-intraocular','Intraocular optic nerve segment','neurovascular','optic-nerve',R,EYE],
  ['optic-nerve-intraorbital','Intraorbital optic nerve segment','neurovascular','optic-nerve',R,EYE],
  ['optic-nerve-intracanalicular','Intracanalicular optic nerve segment','neurovascular','optic-nerve',R,ORBIT],
  ['optic-nerve-intracranial','Intracranial optic nerve segment','neurovascular','optic-nerve',R,EYE],
  ['oculomotor-nerve','Oculomotor nerve (CN III)','neurovascular','orbit',G,ORBIT_SOFT],
  ['trochlear-nerve','Trochlear nerve (CN IV)','neurovascular','orbit',G,ORBIT_SOFT],
  ['abducens-nerve','Abducens nerve (CN VI)','neurovascular','orbit',G,ORBIT_SOFT],
  ['ophthalmic-division-trigeminal','Ophthalmic division trigeminal (V1)','neurovascular','orbit',G,ORBIT],
  ['nasociliary-nerve','Nasociliary nerve','neurovascular','ophthalmic-division-trigeminal',R,ORBIT_SOFT],
  ['long-ciliary-nerves','Long ciliary nerves','neurovascular','nasociliary-nerve',R,ORBIT_SOFT],
  ['ciliary-ganglion','Ciliary ganglion','neurovascular','orbit',R,ORBIT_SOFT],
  ['short-ciliary-nerves','Short ciliary nerves','neurovascular','ciliary-ganglion',R,ORBIT_SOFT],

  ['optic-chiasm','Optic chiasm','visual-pathway','eye-system',G,EYE],
  ['optic-tract','Optic tract','visual-pathway','optic-chiasm',G,EYE],
  ['lateral-geniculate-nucleus','Lateral geniculate nucleus','visual-pathway','optic-tract',R,EYE],
  ['optic-radiations','Optic radiations','visual-pathway','lateral-geniculate-nucleus',R,EYE],
  ['meyer-loop','Meyer loop','visual-pathway','optic-radiations',R,EYE],
  ['parietal-optic-radiations','Parietal optic radiations','visual-pathway','optic-radiations',R,EYE],
  ['primary-visual-cortex','Primary visual / calcarine cortex','visual-pathway','optic-radiations',R,EYE],
]

export const EYE_VISIBLE_WAVE1 = RAW.map(S) as readonly EyeVisibleStructure[]

export const EYE_VISIBLE_WAVE1_REQUIRED_IDS = [
  'orbit','optic-canal','upper-eyelid','lower-eyelid','cornea','sclera','iris','ciliary-body','lens',
  'trabecular-meshwork','schlemm-canal','retina','macula','fovea','optic-disc','vitreous-body',
  'superior-rectus','inferior-rectus','medial-rectus','lateral-rectus','superior-oblique','inferior-oblique',
  'lacrimal-gland','lacrimal-sac','nasolacrimal-duct','ophthalmic-artery','central-retinal-artery','central-retinal-vein',
  'optic-nerve','oculomotor-nerve','trochlear-nerve','abducens-nerve','optic-chiasm','optic-tract','lateral-geniculate-nucleus','optic-radiations','primary-visual-cortex',
] as const

export const EYE_DEEPER_WAVES = {
  wave2: 'Exact asset-level geometry and provenance audit after Wave 1 gross-visible acceptance.',
  wave3: 'High-detail shared-renderer eye viewer with isolate, section, layer and transparency after Wave 2.',
  wave4: 'Corneal and retinal histology/microanatomy only after gross geometry is stable.',
  wave5: 'Physiology remains schematic/model-layer unless provenance-bearing motion exists.',
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
