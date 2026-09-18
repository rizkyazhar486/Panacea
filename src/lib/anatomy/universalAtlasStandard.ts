import type { BodySemanticScale } from '../bodySemanticZoom'
import type { BodySystemId } from '../bodySystemSourceWave'

export type UniversalAtlasDepthId =
  | 'gross'
  | 'microanatomy'
  | 'cellular'
  | 'subcellular'
  | 'chemistry'
  | 'genomic'

export interface UniversalAtlasDepth {
  id: UniversalAtlasDepthId
  label: string
  semanticScale: BodySemanticScale
  representation: string
  rule: string
}

export interface UniversalAtlasRequirement {
  id: string
  label: string
  system: BodySystemId | 'cross-system'
  depth: UniversalAtlasDepthId
  examples: readonly string[]
}

export const UNIVERSAL_ATLAS_DEPTHS: readonly UniversalAtlasDepth[] = [
  {
    id: 'gross',
    label: 'Body',
    semanticScale: 'whole-body',
    representation: 'source-backed gross 3D',
    rule: 'Whole body, system, region, organ and named structure remain spatially source-backed.',
  },
  {
    id: 'microanatomy',
    label: 'Histology',
    semanticScale: 'tissue',
    representation: 'histology / microanatomy',
    rule: 'Tissue layers replace gross meshes when source resolution is exceeded.',
  },
  {
    id: 'cellular',
    label: 'Cell',
    semanticScale: 'cell',
    representation: 'cell-type-specific reference',
    rule: 'Cell identity must match the selected tissue or stay explicitly generic.',
  },
  {
    id: 'subcellular',
    label: 'Organelle',
    semanticScale: 'organelle',
    representation: 'subcellular reference',
    rule: 'Organelles are represented from validated cell/subcellular sources, not gross coordinates.',
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    semanticScale: 'molecule',
    representation: 'molecule / protein / peptide / metabolite / compound',
    rule: 'Molecular structures require verified identifiers and source provenance.',
  },
  {
    id: 'genomic',
    label: 'Genome',
    semanticScale: 'genome',
    representation: 'DNA / chromatin / sequence reference',
    rule: 'Genome views are reference data and never inferred from atlas position.',
  },
] as const

/**
 * This is a quality target, not a claim that every item is already shipped.
 * Every body system must eventually satisfy the same depth contract; no organ
 * is privileged as the single "gold standard".
 */
export const UNIVERSAL_ATLAS_REQUIREMENTS: readonly UniversalAtlasRequirement[] = [
  {
    id: 'integument-complete',
    label: 'Integument',
    system: 'integumentary-surface',
    depth: 'microanatomy',
    examples: [
      'skin surface',
      'epidermis',
      'dermis',
      'hypodermis',
      'hair follicle',
      'sebaceous gland',
      'eccrine gland',
      'apocrine gland',
      'nail plate',
      'nail bed',
      'nail matrix',
    ],
  },
  {
    id: 'breast-complete',
    label: 'Breast',
    system: 'integumentary-surface',
    depth: 'microanatomy',
    examples: ['nipple', 'areola', 'lactiferous ducts', 'lobules', 'adipose tissue'],
  },
  {
    id: 'renal-complete',
    label: 'Kidney / nephron',
    system: 'urinary',
    depth: 'microanatomy',
    examples: [
      'kidney',
      'capsule',
      'cortex',
      'medulla',
      'renal pyramid',
      'calyx',
      'glomerulus',
      'Bowman capsule',
      'proximal tubule',
      'loop of Henle',
      'distal tubule',
      'collecting duct',
    ],
  },
  {
    id: 'ocular-complete',
    label: 'Eye / adnexa',
    system: 'sensory-ent',
    depth: 'microanatomy',
    examples: [
      'cornea',
      'corneal epithelium',
      'stroma',
      'endothelium',
      'sclera',
      'iris',
      'lens',
      'retina',
      'vitreous',
      'eyelid',
      'meibomian gland',
      'lacrimal system',
    ],
  },
  {
    id: 'ear-complete',
    label: 'Ear',
    system: 'sensory-ent',
    depth: 'microanatomy',
    examples: ['auricle', 'external acoustic meatus', 'tympanic membrane', 'ossicles', 'cochlea', 'vestibule'],
  },
  {
    id: 'vascular-wall-complete',
    label: 'Vessel wall',
    system: 'cardiovascular',
    depth: 'microanatomy',
    examples: [
      'tunica intima',
      'endothelium',
      'internal elastic lamina',
      'tunica media',
      'vascular smooth muscle',
      'external elastic lamina',
      'tunica adventitia',
      'vasa vasorum',
    ],
  },
  {
    id: 'male-reproductive-complete',
    label: 'Male reproductive',
    system: 'reproductive',
    depth: 'microanatomy',
    examples: [
      'penis',
      'glans',
      'corpora cavernosa',
      'corpus spongiosum',
      'testis',
      'seminiferous tubules',
      'epididymis',
      'deferent duct',
      'seminal vesicle',
      'prostate',
    ],
  },
  {
    id: 'female-reproductive-complete',
    label: 'Female reproductive',
    system: 'reproductive',
    depth: 'microanatomy',
    examples: [
      'vulva',
      'labia',
      'clitoris',
      'vagina',
      'cervix',
      'uterus',
      'endometrium',
      'myometrium',
      'uterine tube',
      'ovary',
      'follicle',
    ],
  },
  {
    id: 'cellular-energy',
    label: 'Cellular energy',
    system: 'cross-system',
    depth: 'chemistry',
    examples: ['glucose', 'pyruvate', 'acetyl-CoA', 'NAD+', 'NADH', 'FAD', 'FADH2', 'ATP', 'ADP', 'AMP'],
  },
  {
    id: 'protein-peptide',
    label: 'Protein / peptide',
    system: 'cross-system',
    depth: 'chemistry',
    examples: ['protein complex', 'enzyme', 'receptor', 'peptide', 'amino acid', 'cofactor'],
  },
  {
    id: 'genomic-depth',
    label: 'Genome / chromatin',
    system: 'cross-system',
    depth: 'genomic',
    examples: ['chromosome', 'chromatin', 'nucleosome', 'histone', 'DNA', 'gene', 'RNA'],
  },
] as const

export function universalDepthForSemanticScale(scale: BodySemanticScale): UniversalAtlasDepthId {
  if (scale === 'whole-body' || scale === 'system' || scale === 'organ') return 'gross'
  if (scale === 'tissue') return 'microanatomy'
  if (scale === 'cell') return 'cellular'
  if (scale === 'organelle') return 'subcellular'
  if (scale === 'molecule') return 'chemistry'
  return 'genomic'
}

export function universalRequirementsForSystem(system: BodySystemId) {
  return UNIVERSAL_ATLAS_REQUIREMENTS.filter(
    (item) => item.system === system || item.system === 'cross-system',
  )
}
