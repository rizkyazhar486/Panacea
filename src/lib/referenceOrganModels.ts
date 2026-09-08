import type { OrganModel } from './organModels'

// Reference close-ups that REUSE atlas GLBs already shipped by Panacea.
// No binary is copied into /organs-atlas: assetPath points at the existing
// specialty/reference atlas, so higher anatomical quality does not increase
// download/storage cost through duplication.
//
// Counts are the semantic structures emitted by scripts/atlasSystem.mjs. That
// generator writes one named GLB mesh per semantic entry for these modules.
// They are deliberately explicit instead of inferred from an AI surface.

const Z_ANATOMY_LABEL = 'Z-Anatomy · derived from BodyParts3D'
const Z_ANATOMY_LICENSE = 'CC BY-SA 4.0'
const HRA_FEMALE_LABEL = 'HuBMAP Human Reference Atlas · female reference object'
const HRA_MALE_LABEL = 'HuBMAP Human Reference Atlas · male reference object'
const HRA_LICENSE = 'CC BY 4.0'

function zReference(
  id: string,
  focusKey: string,
  label: string,
  scientificName: string,
  assetPath: string,
  structures: number,
  accent: string,
): OrganModel {
  return {
    id,
    focusKey,
    label,
    scientificName,
    accent,
    hotspots: [],
    illustrated: false,
    sumber: 'z-anatomy',
    jumlahBagian: structures,
    jumlahMesh: structures,
    sourceLabel: Z_ANATOMY_LABEL,
    sourceLicense: Z_ANATOMY_LICENSE,
    assetPath,
  }
}

function hraReference(
  id: string,
  focusKey: string,
  label: string,
  scientificName: string,
  assetPath: string,
  structures: number,
  accent: string,
  sex: 'female' | 'male' = 'female',
): OrganModel {
  return {
    id,
    focusKey,
    label,
    scientificName,
    accent,
    hotspots: [],
    illustrated: false,
    sumber: 'hra',
    jumlahBagian: structures,
    jumlahMesh: structures,
    sourceLabel: sex === 'male' ? HRA_MALE_LABEL : HRA_FEMALE_LABEL,
    sourceLicense: HRA_LICENSE,
    assetPath,
  }
}

const EAR_ASSET = 'atlas/telinga.glb'
const EAR_STRUCTURES = 21

/**
 * Strongest single-organ/reference close-up when a BodyParts3D organ cut is not
 * already available. These models may replace the old AI surface in the organ
 * dossier because their named meshes carry explicit source provenance.
 */
export const REFERENCE_ATLAS_MODELS: OrganModel[] = [
  zReference(
    'lungs-reference',
    'lungs',
    'Lungs & pleura',
    'Pulmones et pleurae',
    'atlas/paru.glb',
    13,
    '#9fc0d4',
  ),
  zReference(
    'thyroid-reference',
    'thyroid',
    'Thyroid & parathyroid',
    'Glandula thyroidea et glandulae parathyroideae',
    'atlas/tiroid.glb',
    10,
    '#d9a441',
  ),
  zReference(
    'ear-reference',
    'ear',
    'Middle & inner ear',
    'Auris media et interna',
    EAR_ASSET,
    EAR_STRUCTURES,
    '#e6dfae',
  ),
  // These focused routes intentionally reuse the same registered ear atlas.
  // The viewer exposes the exact source names, so a user can select ossicles,
  // tympanic membranes, cochlea/vestibule, chorda tympani and CN VIII without
  // inventing separate meshes or guessing inter-atlas transforms.
  zReference(
    'ossicles-reference',
    'ossicles',
    'Auditory ossicles in ear context',
    'Ossicula auditus',
    EAR_ASSET,
    EAR_STRUCTURES,
    '#e8ded0',
  ),
  zReference(
    'eardrum-reference',
    'eardrum',
    'Tympanic membrane in ear context',
    'Membrana tympanica',
    EAR_ASSET,
    EAR_STRUCTURES,
    '#c98a6b',
  ),
  zReference(
    'inner-ear-nerve-reference',
    'inner-ear-nerve',
    'Inner ear & vestibulocochlear nerve',
    'Auris interna et nervus vestibulocochlearis',
    EAR_ASSET,
    EAR_STRUCTURES,
    '#e6dfae',
  ),
  hraReference(
    'spinal-cord-reference',
    'spinal-cord',
    'Spinal cord',
    'Medulla spinalis',
    'atlas/medula-spinalis.glb',
    29,
    '#e6dfae',
  ),
  hraReference(
    'breast-reference',
    'breast',
    'Breast',
    'Mamma',
    'atlas/payudara.glb',
    16,
    '#c58f9a',
  ),
]

/**
 * Optional regional views. They never replace a more detailed primary organ
 * close-up. Their purpose is functional: expose clinically important spatial
 * relationships while keeping source, license and reference-object sex clear.
 */
export const REGIONAL_REFERENCE_ATLAS_MODELS: OrganModel[] = [
  hraReference(
    'heart-regional-reference',
    'heart',
    'Heart chambers & valves',
    'Cor — camerae et valvae',
    'atlas/jantung-ruang.glb',
    14,
    '#c0504d',
  ),
  hraReference(
    'liver-biliary-regional-reference',
    'liver',
    'Biliary tree & pancreatic ducts',
    'Hepar et arbor biliaris — regional context',
    'atlas/bilier.glb',
    40,
    '#9b5a4a',
  ),
  hraReference(
    'pancreas-biliary-regional-reference',
    'pancreas',
    'Biliary tree & pancreatic ducts',
    'Pancreas et ductus pancreatici — regional context',
    'atlas/bilier.glb',
    40,
    '#d9a441',
  ),
  hraReference(
    'gallbladder-biliary-regional-reference',
    'gallbladder',
    'Biliary tree & pancreatic ducts',
    'Vesica biliaris et arbor biliaris — regional context',
    'atlas/bilier.glb',
    40,
    '#9b5a4a',
  ),
  hraReference(
    'prostate-pelvis-regional-reference',
    'prostate',
    'Prostate zones & bladder',
    'Prostata et vesica urinaria — regional context',
    'atlas/prostat.glb',
    26,
    '#c58f9a',
    'male',
  ),
  hraReference(
    'bladder-prostate-regional-reference',
    'bladder',
    'Prostate zones & bladder',
    'Vesica urinaria et prostata — regional context',
    'atlas/prostat.glb',
    26,
    '#b08fbf',
    'male',
  ),
]
