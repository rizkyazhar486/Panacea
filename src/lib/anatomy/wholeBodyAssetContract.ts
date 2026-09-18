export type AnatomyReferenceSex = 'male-reference' | 'female-reference'
export type AnatomyAssetScope = 'whole-body' | 'regional'
export type AnatomyAssetStatus = 'shipped' | 'pipeline-ready' | 'source-gap'

export interface WholeBodyAssetLayer {
  id: string
  label: string
  sourcePath: string
  coordinateSpace: string
  status: AnatomyAssetStatus
  provenance: string
  notes?: string
}

export interface WholeBodyReferenceVariant {
  id: string
  label: string
  sex: AnatomyReferenceSex
  scope: AnatomyAssetScope
  coordinateSpace: string
  layers: readonly WholeBodyAssetLayer[]
  boundary: string
}

export const Z_ANATOMY_MALE_SPACE = 'z-anatomy-bodyparts3d-male-reference'
export const HRA_FEMALE_SPACE = 'hubmap-hra-vh-female-reference'
export const PANACEA_FEMALE_PELVIS_SPACE = 'panacea-normalized-hra-vh-female-pelvis-v1'

/**
 * Current compatible whole-body source set.
 *
 * All seven bundles were exported from the same Z-Anatomy / BodyParts3D
 * reference project and may be assembled into one Blender scene without
 * inventing a cross-reference transform. The surface layer contains the
 * shipped superficial/face catalogue; ocular compartments live in nervous.glb;
 * male reproductive structures live in visceral.glb.
 */
export const MALE_WHOLE_BODY_REFERENCE: WholeBodyReferenceVariant = {
  id: 'male-z-anatomy-v1',
  label: 'Adult male whole-body reference',
  sex: 'male-reference',
  scope: 'whole-body',
  coordinateSpace: Z_ANATOMY_MALE_SPACE,
  boundary: 'Reference anatomy only. It is not a patient-specific body and must not be presented as representing every anatomical variation.',
  layers: [
    { id: 'surface', label: 'Integument / face / superficial regions', sourcePath: '/anatomy/surface.glb', coordinateSpace: Z_ANATOMY_MALE_SPACE, status: 'shipped', provenance: 'Z-Anatomy → BodyParts3D; see public/anatomy/CREDITS.txt' },
    { id: 'skeletal', label: 'Skeleton', sourcePath: '/anatomy/skeletal.glb', coordinateSpace: Z_ANATOMY_MALE_SPACE, status: 'shipped', provenance: 'Z-Anatomy → BodyParts3D; see public/anatomy/CREDITS.txt' },
    { id: 'muscular', label: 'Muscles', sourcePath: '/anatomy/muscular.glb', coordinateSpace: Z_ANATOMY_MALE_SPACE, status: 'shipped', provenance: 'Z-Anatomy → BodyParts3D; see public/anatomy/CREDITS.txt' },
    { id: 'cardiovascular', label: 'Arteries and veins', sourcePath: '/anatomy/cardiovascular.glb', coordinateSpace: Z_ANATOMY_MALE_SPACE, status: 'shipped', provenance: 'Z-Anatomy → BodyParts3D; see public/anatomy/CREDITS.txt' },
    { id: 'nervous', label: 'Nervous + ocular compartments', sourcePath: '/anatomy/nervous.glb', coordinateSpace: Z_ANATOMY_MALE_SPACE, status: 'shipped', provenance: 'Z-Anatomy → BodyParts3D; see public/anatomy/CREDITS.txt' },
    { id: 'lymphoid', label: 'Lymphoid structures', sourcePath: '/anatomy/lymphoid.glb', coordinateSpace: Z_ANATOMY_MALE_SPACE, status: 'shipped', provenance: 'Z-Anatomy → BodyParts3D; see public/anatomy/CREDITS.txt' },
    { id: 'visceral', label: 'Viscera + male urogenital structures', sourcePath: '/anatomy/visceral.glb', coordinateSpace: Z_ANATOMY_MALE_SPACE, status: 'shipped', provenance: 'Z-Anatomy → BodyParts3D; see public/anatomy/CREDITS.txt' },
  ],
}

/**
 * The currently shipped female reproductive reference is regional only.
 * It must not be overlaid on the male whole-body source until a validated
 * cross-reference registration exists. Fitting it by eye would create anatomy
 * that looks coherent while being spatially fabricated.
 */
export const FEMALE_PELVIS_REFERENCE: WholeBodyReferenceVariant = {
  id: 'female-hra-pelvis-v1',
  label: 'Adult female pelvis reference',
  sex: 'female-reference',
  scope: 'regional',
  coordinateSpace: PANACEA_FEMALE_PELVIS_SPACE,
  boundary: 'Regional Visible Human female reference normalized for this standalone module. Do not overlay it on either the male Z-Anatomy body or raw HRA whole-body coordinates without a validated transform.',
  layers: [
    {
      id: 'female-pelvis',
      label: 'Uterus / ovaries / uterine tubes / vagina / ligaments / bladder / pelvis',
      sourcePath: '/atlas/obgin.glb',
      coordinateSpace: PANACEA_FEMALE_PELVIS_SPACE,
      status: 'shipped',
      provenance: 'HuBMAP Human Reference Atlas VH_Female; see public/atlas/CREDITS.txt',
    },
  ],
}

/**
 * Source-discovered full female reference candidate.
 *
 * HRA v1.5 publishes a Visible Human female "united" GLB with a whole-body
 * surface and selected organs, including female reproductive anatomy. It is
 * pipeline-ready, not shipped: runtime admission still requires asset
 * download verification, manifest inspection, structure-name audit, browser
 * performance checks and preserved CC BY 4.0 attribution.
 */
export const FEMALE_HRA_UNITED_REFERENCE: WholeBodyReferenceVariant = {
  id: 'female-hra-united-v1.5',
  label: 'Adult female HRA united reference',
  sex: 'female-reference',
  scope: 'whole-body',
  coordinateSpace: HRA_FEMALE_SPACE,
  boundary: 'Whole-body female reference candidate with surface and selected organs; skeleton and muscle coverage are partial and it must not be presented as anatomically complete.',
  layers: [
    {
      id: 'female-united',
      label: 'Female whole-body surface + selected organs',
      sourcePath: 'https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb',
      coordinateSpace: HRA_FEMALE_SPACE,
      status: 'pipeline-ready',
      provenance: 'HuBMAP Human Reference Atlas / Visible Human Female v1.5 · CC BY 4.0',
      notes: 'External pinned-version source candidate. Do not runtime-load until acquisition manifest, node audit and performance acceptance pass.',
    },
  ],
}

export const WHOLE_BODY_REFERENCE_VARIANTS = [
  MALE_WHOLE_BODY_REFERENCE,
  FEMALE_HRA_UNITED_REFERENCE,
  FEMALE_PELVIS_REFERENCE,
] as const

export interface WholeBodyAssetGap {
  id: string
  label: string
  priority: 'P0' | 'P1' | 'P2'
  reason: string
  completionRule: string
}

export const WHOLE_BODY_ASSET_GAPS: readonly WholeBodyAssetGap[] = [
  {
    id: 'female-whole-body-runtime-admission',
    label: 'Female whole-body runtime admission',
    priority: 'P0',
    reason: 'HRA provides a pinned whole-body female united source candidate, but Panacea has not yet acquired, audited, packaged and performance-validated it for the runtime.',
    completionRule: 'Acquire the v1.5 HRA female united GLB, record checksum/metadata/license, audit exact node coverage including reproductive and surface anatomy, package through Blender, and pass browser/mobile acceptance before marking it shipped.',
  },
  {
    id: 'fascial-layer',
    label: 'Source-backed superficial/deep fascia',
    priority: 'P0',
    reason: 'Current source bundles do not justify inventing a continuous fascial layer.',
    completionRule: 'Admit fascia only from a licensed source with explicit mesh identity, provenance and spatial compatibility.',
  },
  {
    id: 'skin-depth',
    label: 'Skin microanatomy below the gross surface',
    priority: 'P0',
    reason: 'The whole-body surface is gross anatomy, not epidermis/dermis histology.',
    completionRule: 'Switch representation at tissue scale to source-backed microanatomy/histology instead of enlarging surface.glb.',
  },
  {
    id: 'female-external-genital-surface',
    label: 'Female external genital surface anatomy',
    priority: 'P0',
    reason: 'Do not infer or sculpt vulvar geometry from the current male surface or pelvis-only internal-organ module.',
    completionRule: 'Use a licensed female source with explicit vulvar/external genital geometry in a compatible reference frame.',
  },
  {
    id: 'fine-vascular-neural-branching',
    label: 'Finer distal vascular and neural branches',
    priority: 'P1',
    reason: 'Branch detail must stop at the resolution of the source rather than being procedurally invented.',
    completionRule: 'Add only when exact source meshes and source-level provenance are available.',
  },
]

export function canOverlayReferenceAssets(a: WholeBodyAssetLayer, b: WholeBodyAssetLayer) {
  return a.coordinateSpace === b.coordinateSpace
}

export function wholeBodySourcePaths(variant: WholeBodyReferenceVariant) {
  return variant.layers
    .filter((layer) => layer.status === 'shipped')
    .map((layer) => layer.sourcePath)
}
