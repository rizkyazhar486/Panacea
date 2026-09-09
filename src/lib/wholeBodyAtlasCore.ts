import type {
  AnatomyLaterality,
  AnatomyRegion,
  AnatomySpatialEdge,
  AnatomySpatialGraph,
  AnatomySpatialNode,
  AnatomySystem,
} from './anatomySpatialGraph'
import { RESPIRATORY_ATLAS_EDGES, RESPIRATORY_ATLAS_NODES } from './respiratoryAtlasContract'

const MB = 1024 * 1024

function node(
  id: string,
  label: string,
  system: AnatomySystem,
  region: AnatomyRegion,
  parentId: string | undefined,
  aliases: readonly string[] = [],
  laterality: AnatomyLaterality = 'not-applicable',
  sourceNodeAliases: readonly string[] = [],
  clinicalWeight = 1,
): AnatomySpatialNode {
  return {
    id,
    label,
    aliases,
    sourceNodeAliases,
    system,
    region,
    laterality,
    parentId,
    lod: {
      minLevel: parentId ? 1 : 0,
      maxLevel: 4,
      clinicalWeight,
      estimatedGpuBytes: Math.round((1.5 + clinicalWeight * 2.5) * MB),
      geometricError: Math.max(0.5, 10 / Math.max(0.5, clinicalWeight)),
    },
    reviewStatus: 'pending',
  }
}

export const WHOLE_BODY_CORE_NODES: readonly AnatomySpatialNode[] = [
  node('skeletal-system', 'Skeletal system', 'skeletal', 'whole-body', undefined, ['skeleton']),
  node('axial-skeleton', 'Axial skeleton', 'skeletal', 'whole-body', 'skeletal-system'),
  node('skull', 'Skull', 'skeletal', 'head-neck', 'axial-skeleton', ['cranium'], 'midline', ['Skull'], 1.5),
  node('vertebral-column', 'Vertebral column', 'skeletal', 'back', 'axial-skeleton', ['spine'], 'midline', ['Spine'], 2),
  node('rib-cage', 'Thoracic cage', 'skeletal', 'thorax', 'axial-skeleton', ['rib cage'], 'midline', ['Ribs'], 1.5),
  node('appendicular-skeleton', 'Appendicular skeleton', 'skeletal', 'whole-body', 'skeletal-system'),
  node('upper-limb-skeleton', 'Upper limb skeleton', 'skeletal', 'upper-limb', 'appendicular-skeleton', [], 'bilateral'),
  node('lower-limb-skeleton', 'Lower limb skeleton', 'skeletal', 'lower-limb', 'appendicular-skeleton', [], 'bilateral'),
  node('pelvic-girdle', 'Pelvic girdle', 'skeletal', 'pelvis', 'appendicular-skeleton', ['bony pelvis'], 'midline'),

  node('muscular-system', 'Muscular system', 'muscular', 'whole-body', undefined, ['skeletal muscles']),
  node('head-neck-muscles', 'Head and neck muscles', 'muscular', 'head-neck', 'muscular-system', [], 'bilateral'),
  node('thoracic-muscles', 'Thoracic muscles', 'muscular', 'thorax', 'muscular-system', [], 'bilateral'),
  node('abdominal-wall-muscles', 'Abdominal wall muscles', 'muscular', 'abdomen', 'muscular-system', [], 'bilateral'),
  node('back-muscles', 'Back muscles', 'muscular', 'back', 'muscular-system', [], 'bilateral'),
  node('upper-limb-muscles', 'Upper limb muscles', 'muscular', 'upper-limb', 'muscular-system', [], 'bilateral'),
  node('lower-limb-muscles', 'Lower limb muscles', 'muscular', 'lower-limb', 'muscular-system', [], 'bilateral'),

  node('cardiovascular-system', 'Cardiovascular system', 'cardiovascular', 'whole-body', undefined, ['circulatory system']),
  node('heart', 'Heart', 'cardiovascular', 'thorax', 'cardiovascular-system', ['cardiac organ'], 'midline', ['Heart'], 3),
  node('arterial-system', 'Arterial system', 'arterial', 'whole-body', undefined, ['arteries']),
  node('aorta', 'Aorta', 'arterial', 'thorax', 'arterial-system', ['aortic tree'], 'midline', ['Aorta'], 3),
  node('pulmonary-arterial-tree', 'Pulmonary arterial tree', 'arterial', 'thorax', 'arterial-system', ['pulmonary arteries'], 'bilateral', ['Pulmonary_Arteries'], 2),
  node('systemic-arteries', 'Systemic arterial tree', 'arterial', 'whole-body', 'arterial-system', ['systemic arteries']),
  node('venous-system', 'Venous system', 'venous', 'whole-body', undefined, ['veins']),
  node('superior-vena-cava', 'Superior vena cava', 'venous', 'thorax', 'venous-system', ['SVC'], 'midline', ['Superior_Vena_Cava'], 2),
  node('inferior-vena-cava', 'Inferior vena cava', 'venous', 'abdomen', 'venous-system', ['IVC'], 'midline', ['Inferior_Vena_Cava'], 2),
  node('pulmonary-veins', 'Pulmonary veins', 'venous', 'thorax', 'venous-system', [], 'bilateral', ['Pulmonary_Veins'], 2),

  node('nervous-system', 'Nervous system', 'nervous', 'whole-body', undefined, ['neural system']),
  node('brain', 'Brain', 'nervous', 'head-neck', 'nervous-system', ['encephalon'], 'midline', ['Brain'], 3),
  node('spinal-cord', 'Spinal cord', 'nervous', 'back', 'nervous-system', [], 'midline', ['Spinal_Cord'], 3),
  node('peripheral-nerves', 'Peripheral nerves', 'nervous', 'whole-body', 'nervous-system', ['PNS'], 'bilateral'),

  node('digestive-system', 'Digestive system', 'digestive', 'whole-body', undefined, ['gastrointestinal system', 'GI tract']),
  node('esophagus', 'Esophagus', 'digestive', 'thorax', 'digestive-system', ['oesophagus'], 'midline', ['Esophagus'], 2),
  node('stomach', 'Stomach', 'digestive', 'abdomen', 'digestive-system', [], 'left', ['Stomach'], 2),
  node('liver', 'Liver', 'digestive', 'abdomen', 'digestive-system', [], 'right', ['Liver'], 3),
  node('gallbladder', 'Gallbladder', 'digestive', 'abdomen', 'digestive-system', [], 'right', ['Gallbladder'], 2),
  node('pancreas', 'Pancreas', 'digestive', 'abdomen', 'digestive-system', [], 'midline', ['Pancreas'], 3),
  node('small-intestine', 'Small intestine', 'digestive', 'abdomen', 'digestive-system', ['small bowel'], 'midline', ['Small_Intestine'], 2),
  node('large-intestine', 'Large intestine', 'digestive', 'abdomen', 'digestive-system', ['colon', 'large bowel'], 'midline', ['Large_Intestine'], 2),

  node('urinary-system', 'Urinary system', 'urinary', 'whole-body', undefined, ['renal system']),
  node('kidneys', 'Kidneys', 'urinary', 'abdomen', 'urinary-system', ['renal organs'], 'bilateral', ['Kidneys'], 3),
  node('ureters', 'Ureters', 'urinary', 'abdomen', 'urinary-system', [], 'bilateral', ['Ureters'], 2),
  node('urinary-bladder', 'Urinary bladder', 'urinary', 'pelvis', 'urinary-system', ['bladder'], 'midline', ['Bladder'], 2),

  node('lymphatic-system', 'Lymphatic system', 'lymphatic', 'whole-body', undefined, ['lymphatics']),
  node('lymph-node-groups', 'Lymph node groups', 'lymphatic', 'whole-body', 'lymphatic-system', ['lymph nodes'], 'bilateral'),
  node('spleen', 'Spleen', 'lymphatic', 'abdomen', 'lymphatic-system', [], 'left', ['Spleen'], 2),
  node('thoracic-duct', 'Thoracic duct', 'lymphatic', 'thorax', 'lymphatic-system', [], 'midline', ['Thoracic_Duct'], 2),

  node('endocrine-system', 'Endocrine system', 'endocrine', 'whole-body', undefined, ['endocrine glands']),
  node('pituitary-gland', 'Pituitary gland', 'endocrine', 'head-neck', 'endocrine-system', ['hypophysis'], 'midline', ['Pituitary'], 2),
  node('thyroid-gland', 'Thyroid gland', 'endocrine', 'head-neck', 'endocrine-system', ['thyroid'], 'midline', ['Thyroid'], 2),
  node('adrenal-glands', 'Adrenal glands', 'endocrine', 'abdomen', 'endocrine-system', ['suprarenal glands'], 'bilateral', ['Adrenals'], 2),

  node('reproductive-system', 'Reproductive system', 'reproductive', 'pelvis', undefined, ['reproductive organs']),
  node('uterus', 'Uterus', 'reproductive', 'pelvis', 'reproductive-system', [], 'midline', ['Uterus'], 2),
  node('ovaries', 'Ovaries', 'reproductive', 'pelvis', 'reproductive-system', [], 'bilateral', ['Ovaries'], 2),
  node('prostate', 'Prostate', 'reproductive', 'pelvis', 'reproductive-system', ['prostate gland'], 'midline', ['Prostate'], 2),
  node('testes', 'Testes', 'reproductive', 'pelvis', 'reproductive-system', ['testicles'], 'bilateral', ['Testes'], 2),

  node('integumentary-system', 'Integumentary system', 'integumentary', 'whole-body', undefined, ['skin system']),
  node('skin', 'Skin', 'integumentary', 'whole-body', 'integumentary-system', ['cutaneous surface'], 'bilateral', ['Skin'], 1.5),
  node('fascia-system', 'Fascial system', 'fascia', 'whole-body', undefined, ['fascia']),
  node('superficial-fascia', 'Superficial fascia', 'fascia', 'whole-body', 'fascia-system', [], 'bilateral'),
  node('deep-fascia', 'Deep fascia', 'fascia', 'whole-body', 'fascia-system', [], 'bilateral'),
] as const

const relation = (from: string, to: string, type: AnatomySpatialEdge['relation']): AnatomySpatialEdge => ({ from, to, relation: type })

export const WHOLE_BODY_CORE_EDGES: readonly AnatomySpatialEdge[] = [
  relation('heart', 'aorta', 'continuousWith'),
  relation('superior-vena-cava', 'heart', 'drainsTo'),
  relation('inferior-vena-cava', 'heart', 'drainsTo'),
  relation('pulmonary-veins', 'heart', 'drainsTo'),
  relation('heart', 'pulmonary-arterial-tree', 'supplies'),
  relation('brain', 'spinal-cord', 'continuousWith'),
  relation('spinal-cord', 'peripheral-nerves', 'continuousWith'),
  relation('esophagus', 'stomach', 'continuousWith'),
  relation('stomach', 'small-intestine', 'continuousWith'),
  relation('small-intestine', 'large-intestine', 'continuousWith'),
  relation('kidneys', 'ureters', 'continuousWith'),
  relation('ureters', 'urinary-bladder', 'continuousWith'),
  relation('thoracic-duct', 'venous-system', 'drainsTo'),
  relation('rib-cage', 'thoracic-muscles', 'adjacentTo'),
  relation('vertebral-column', 'spinal-cord', 'adjacentTo'),
  relation('skin', 'superficial-fascia', 'adjacentTo'),
  relation('superficial-fascia', 'deep-fascia', 'continuousWith'),
] as const

export const WHOLE_BODY_ATLAS_GRAPH: AnatomySpatialGraph = {
  nodes: [...WHOLE_BODY_CORE_NODES, ...RESPIRATORY_ATLAS_NODES],
  edges: [...WHOLE_BODY_CORE_EDGES, ...RESPIRATORY_ATLAS_EDGES],
}

export const WHOLE_BODY_SYSTEM_ROOTS: Readonly<Record<AnatomySystem, string>> = {
  skeletal: 'skeletal-system',
  muscular: 'muscular-system',
  arterial: 'arterial-system',
  venous: 'venous-system',
  lymphatic: 'lymphatic-system',
  nervous: 'nervous-system',
  respiratory: 'respiratory-system',
  cardiovascular: 'cardiovascular-system',
  digestive: 'digestive-system',
  urinary: 'urinary-system',
  reproductive: 'reproductive-system',
  endocrine: 'endocrine-system',
  integumentary: 'integumentary-system',
  fascia: 'fascia-system',
} as const
