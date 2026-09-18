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
  { id: 'gross', label: 'Body', semanticScale: 'whole-body', representation: 'source-backed gross 3D', rule: 'Whole body, system, region, organ and named structure remain spatially source-backed.' },
  { id: 'microanatomy', label: 'Histology', semanticScale: 'tissue', representation: 'histology / microanatomy', rule: 'Tissue layers replace gross meshes when source resolution is exceeded.' },
  { id: 'cellular', label: 'Cell', semanticScale: 'cell', representation: 'cell-type-specific reference', rule: 'Cell identity must match the selected tissue or stay explicitly generic.' },
  { id: 'subcellular', label: 'Organelle', semanticScale: 'organelle', representation: 'subcellular reference', rule: 'Organelles use validated cell/subcellular sources rather than gross coordinates.' },
  { id: 'chemistry', label: 'Chemistry', semanticScale: 'molecule', representation: 'molecule / protein / peptide / metabolite / compound', rule: 'Molecular structures require verified identifiers and source provenance.' },
  { id: 'genomic', label: 'Genome', semanticScale: 'genome', representation: 'DNA / chromatin / sequence reference', rule: 'Genome views are reference data and never inferred from atlas position.' },
] as const

/**
 * Universal quality target. This registry deliberately describes required
 * depth, not current completion. No organ is allowed to be the lone "gold
 * standard"; every system must eventually satisfy the same contract.
 */
export const UNIVERSAL_ATLAS_REQUIREMENTS: readonly UniversalAtlasRequirement[] = [
  {
    id: 'cardiovascular-complete',
    label: 'Cardiovascular',
    system: 'cardiovascular',
    depth: 'microanatomy',
    examples: ['heart wall', 'valves', 'conduction system', 'artery', 'vein', 'capillary', 'tunica intima', 'endothelium', 'tunica media', 'vascular smooth muscle', 'tunica adventitia', 'vasa vasorum'],
  },
  {
    id: 'nervous-complete',
    label: 'Nervous',
    system: 'nervous',
    depth: 'subcellular',
    examples: ['brain', 'spinal cord', 'root', 'peripheral nerve', 'cortex', 'nucleus', 'neuron', 'axon', 'dendrite', 'synapse', 'myelin', 'microtubule', 'mitochondrion'],
  },
  {
    id: 'respiratory-complete',
    label: 'Respiratory',
    system: 'respiratory',
    depth: 'cellular',
    examples: ['nasal airway', 'larynx', 'trachea', 'bronchus', 'bronchiole', 'alveolus', 'respiratory epithelium', 'type I pneumocyte', 'type II pneumocyte', 'surfactant', 'alveolar capillary'],
  },
  {
    id: 'digestive-complete',
    label: 'Digestive / hepatobiliary',
    system: 'digestive',
    depth: 'cellular',
    examples: ['esophagus', 'stomach', 'small bowel', 'colon', 'mucosa', 'submucosa', 'muscularis', 'serosa', 'villus', 'crypt', 'enterocyte', 'liver lobule', 'hepatocyte', 'bile canaliculus', 'pancreatic acinus'],
  },
  {
    id: 'renal-complete',
    label: 'Kidney / nephron',
    system: 'urinary',
    depth: 'cellular',
    examples: ['kidney', 'capsule', 'cortex', 'medulla', 'renal pyramid', 'calyx', 'glomerulus', 'Bowman capsule', 'podocyte', 'proximal tubule', 'loop of Henle', 'distal tubule', 'collecting duct', 'juxtaglomerular apparatus'],
  },
  {
    id: 'endocrine-complete',
    label: 'Endocrine',
    system: 'endocrine',
    depth: 'cellular',
    examples: ['pituitary', 'thyroid follicle', 'parathyroid', 'adrenal cortex', 'zona glomerulosa', 'zona fasciculata', 'zona reticularis', 'adrenal medulla', 'pancreatic islet', 'beta cell'],
  },
  {
    id: 'male-reproductive-complete',
    label: 'Male reproductive',
    system: 'reproductive',
    depth: 'cellular',
    examples: ['penis', 'glans', 'corpora cavernosa', 'corpus spongiosum', 'testis', 'seminiferous tubule', 'Sertoli cell', 'Leydig cell', 'epididymis', 'deferent duct', 'seminal vesicle', 'prostate'],
  },
  {
    id: 'female-reproductive-complete',
    label: 'Female reproductive',
    system: 'reproductive',
    depth: 'cellular',
    examples: ['vulva', 'labia', 'clitoris', 'vagina', 'cervix', 'uterus', 'endometrium', 'myometrium', 'uterine tube', 'ovary', 'follicle', 'oocyte'],
  },
  {
    id: 'lymphatic-immune-complete',
    label: 'Lymphatic / immune',
    system: 'lymphatic-immune',
    depth: 'cellular',
    examples: ['lymphatic vessel', 'lymph node', 'cortex', 'paracortex', 'medulla', 'spleen red pulp', 'spleen white pulp', 'thymic cortex', 'thymic medulla', 'lymphocyte', 'macrophage', 'dendritic cell'],
  },
  {
    id: 'musculoskeletal-complete',
    label: 'Musculoskeletal',
    system: 'musculoskeletal',
    depth: 'subcellular',
    examples: ['bone', 'cortical bone', 'trabecular bone', 'osteon', 'osteocyte', 'cartilage', 'chondrocyte', 'tendon', 'ligament', 'muscle fascicle', 'muscle fiber', 'sarcomere', 'actin', 'myosin'],
  },
  {
    id: 'ocular-complete',
    label: 'Eye / adnexa',
    system: 'sensory-ent',
    depth: 'cellular',
    examples: ['cornea', 'corneal epithelium', 'Bowman layer', 'stroma', 'Descemet membrane', 'endothelium', 'sclera', 'iris', 'lens', 'retina', 'photoreceptor', 'vitreous', 'eyelid', 'meibomian gland', 'lacrimal system'],
  },
  {
    id: 'ear-complete',
    label: 'Ear',
    system: 'sensory-ent',
    depth: 'cellular',
    examples: ['auricle', 'external acoustic meatus', 'tympanic membrane', 'malleus', 'incus', 'stapes', 'cochlea', 'organ of Corti', 'hair cell', 'vestibule', 'semicircular canal'],
  },
  {
    id: 'integument-complete',
    label: 'Integument',
    system: 'integumentary-surface',
    depth: 'cellular',
    examples: ['skin surface', 'stratum corneum', 'epidermis', 'dermis', 'hypodermis', 'hair follicle', 'sebaceous gland', 'eccrine gland', 'apocrine gland', 'nail plate', 'nail bed', 'nail matrix', 'keratinocyte', 'melanocyte'],
  },
  {
    id: 'breast-complete',
    label: 'Breast',
    system: 'integumentary-surface',
    depth: 'cellular',
    examples: ['nipple', 'areola', 'lactiferous duct', 'terminal duct lobular unit', 'lobule', 'myoepithelial cell', 'adipose tissue'],
  },
  {
    id: 'cellular-energy',
    label: 'Cellular energy',
    system: 'cross-system',
    depth: 'chemistry',
    examples: ['glucose', 'pyruvate', 'acetyl-CoA', 'NAD+', 'NADH', 'FAD', 'FADH2', 'ATP', 'ADP', 'AMP', 'oxygen', 'carbon dioxide'],
  },
  {
    id: 'protein-peptide',
    label: 'Protein / peptide',
    system: 'cross-system',
    depth: 'chemistry',
    examples: ['protein complex', 'enzyme', 'receptor', 'ion channel', 'transporter', 'peptide', 'amino acid', 'lipid', 'cofactor'],
  },
  {
    id: 'genomic-depth',
    label: 'Genome / chromatin',
    system: 'cross-system',
    depth: 'genomic',
    examples: ['chromosome', 'chromatin', 'nucleosome', 'histone', 'DNA', 'gene', 'RNA', 'transcript', 'regulatory element'],
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

/**
 * The requirement records a system owns for itself, excluding the shared
 * cross-system chemistry/genomic entries.
 *
 * `SemanticMicroscopeStage` previously named the resolution boundary in the
 * abstract ("tissue microanatomy") without saying which structures it
 * actually means for the selected system. The named structures already exist
 * here — `UNIVERSAL_ATLAS_REQUIREMENTS[n].examples` — they were simply never
 * read back out into that message. This makes the boundary concrete instead
 * of generic, using only structures already reviewed into this registry.
 *
 * Returns an ARRAY, not a single entry: `reproductive`, `sensory-ent` and
 * `integumentary-surface` each own TWO records (male/female reproductive;
 * eye/ear; skin/breast). Reducing to one match would silently drop the
 * second half of an already-reviewed list for exactly those three systems.
 */
export function ownRequirementsForSystem(system: BodySystemId): readonly UniversalAtlasRequirement[] {
  return UNIVERSAL_ATLAS_REQUIREMENTS.filter((item) => item.system === system)
}
