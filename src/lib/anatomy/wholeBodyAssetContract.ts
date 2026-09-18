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
  coordinateSpace: HRA_FEMALE_SPACE,
  boundary: 'Regional Visible Human female reference. Do not merge into the male Z-Anatomy coordinate space without validated registration.',
  layers: [
    {
      id: 'female-pelvis',
      label: 'Uterus / ovaries / uterine tubes / vagina / ligaments / bladder / pelvis',
      sourcePath: '/atlas/obgin.glb',
      coordinateSpace: HRA_FEMALE_SPACE,
      status: 'shipped',
      provenance: 'HuBMAP Human Reference Atlas VH_Female; see public/atlas/CREDITS.txt',
    },
  ],
}

export const WHOLE_BODY_REFERENCE_VARIANTS = [
  MALE_WHOLE_BODY_REFERENCE,
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
    id: 'female-whole-body-compatible',
    label: 'Female whole-body compatible reference',
    priority: 'P0',
    reason: 'The current female source is pelvis-only and uses a different reference coordinate space.',
    completionRule: 'Ship a source-backed female whole-body surface plus required systems in one documented coordinate frame, or a validated registration with reproducible error measurements.',
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
