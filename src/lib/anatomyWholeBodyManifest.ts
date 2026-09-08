import type { AnatomyRegion, AnatomyRelation, AnatomySystem, AtlasManifest, AtlasNode } from './anatomyAtlasGraph'

const pendingReview = { status: 'pending' as const }

interface NodeSpec {
  id: string
  name: string
  primarySystem: AnatomySystem
  regions: AnatomyRegion[]
  parentId?: string
  systems?: AnatomySystem[]
  aliases?: string[]
  hints?: string[]
  relations?: AnatomyRelation[]
  importance?: number
  cost?: number
}

const node = (spec: NodeSpec): AtlasNode => ({
  id: spec.id,
  canonicalName: spec.name,
  aliases: spec.aliases ?? [],
  sourceHints: spec.hints ?? [],
  primarySystem: spec.primarySystem,
  systems: spec.systems ?? [spec.primarySystem],
  regions: spec.regions,
  parentId: spec.parentId,
  relations: spec.relations ?? [],
  importanceWeight: spec.importance ?? 1,
  estimatedCostUnits: spec.cost ?? 1,
  academicReview: pendingReview,
})

const root = (id: string, name: string, primarySystem: AnatomySystem, importance = 4): AtlasNode => node({
  id,
  name,
  primarySystem,
  regions: ['whole-body'],
  importance,
  cost: 2,
})

export const WHOLE_BODY_ATLAS: AtlasManifest = {
  id: 'panacea-whole-body-atlas',
  version: '1.0.0-engineering-foundation',
  sourceRegistryRefs: ['data/source-registry/anatomy/thebuggeddev-anatomy-breath-atlas.json'],
  nodes: [
    root('surface-system', 'Surface anatomy', 'surface'),
    root('skeletal-system', 'Skeletal system', 'skeletal'),
    root('muscular-system', 'Muscular system', 'muscular'),
    root('cardiovascular-system', 'Cardiovascular system', 'cardiovascular'),
    root('respiratory-system', 'Respiratory system', 'respiratory', 6),
    root('nervous-system', 'Nervous system', 'nervous'),
    root('digestive-system', 'Digestive system', 'digestive'),
    root('urinary-system', 'Urinary system', 'urinary'),
    root('reproductive-system', 'Reproductive system', 'reproductive'),
    root('endocrine-system', 'Endocrine system', 'endocrine'),
    root('lymphatic-system', 'Lymphatic system', 'lymphatic'),
    root('connective-system', 'Connective tissue and fascia', 'connective'),

    node({ id: 'skin', name: 'Skin', primarySystem: 'surface', regions: ['whole-body'], parentId: 'surface-system', hints: ['skin', 'integument'], importance: 3, cost: 4 }),
    node({ id: 'skull', name: 'Skull', primarySystem: 'skeletal', regions: ['head-neck'], parentId: 'skeletal-system', hints: ['skull', 'cranium'], importance: 3, cost: 3 }),
    node({ id: 'vertebral-column', name: 'Vertebral column', primarySystem: 'skeletal', regions: ['back'], parentId: 'skeletal-system', aliases: ['spine'], hints: ['vertebral column', 'spine'], importance: 4, cost: 5 }),
    node({ id: 'thoracic-cage', name: 'Thoracic cage', primarySystem: 'skeletal', regions: ['thorax'], parentId: 'skeletal-system', aliases: ['rib cage'], hints: ['ribs', 'sternum', 'thoracic cage'], importance: 4, cost: 4 }),
    node({ id: 'pelvic-skeleton', name: 'Pelvic skeleton', primarySystem: 'skeletal', regions: ['pelvis'], parentId: 'skeletal-system', hints: ['pelvis', 'pelvic bone'], importance: 3, cost: 4 }),
    node({ id: 'upper-limb-skeleton', name: 'Upper limb skeleton', primarySystem: 'skeletal', regions: ['upper-limb'], parentId: 'skeletal-system', hints: ['humerus', 'radius', 'ulna', 'hand'], importance: 3, cost: 5 }),
    node({ id: 'lower-limb-skeleton', name: 'Lower limb skeleton', primarySystem: 'skeletal', regions: ['lower-limb'], parentId: 'skeletal-system', hints: ['femur', 'tibia', 'fibula', 'foot'], importance: 3, cost: 5 }),

    node({ id: 'axial-musculature', name: 'Axial musculature', primarySystem: 'muscular', regions: ['thorax', 'abdomen', 'back'], parentId: 'muscular-system', hints: ['trunk muscle', 'back muscle', 'abdominal muscle'], importance: 3, cost: 6 }),
    node({ id: 'upper-limb-musculature', name: 'Upper limb musculature', primarySystem: 'muscular', regions: ['upper-limb'], parentId: 'muscular-system', hints: ['upper limb muscle', 'arm muscle'], importance: 3, cost: 6 }),
    node({ id: 'lower-limb-musculature', name: 'Lower limb musculature', primarySystem: 'muscular', regions: ['lower-limb'], parentId: 'muscular-system', hints: ['lower limb muscle', 'leg muscle'], importance: 3, cost: 6 }),

    node({ id: 'heart', name: 'Heart', primarySystem: 'cardiovascular', regions: ['thorax'], parentId: 'cardiovascular-system', hints: ['heart', 'cardiac'], importance: 6, cost: 6 }),
    node({ id: 'aorta', name: 'Aorta', primarySystem: 'cardiovascular', regions: ['thorax', 'abdomen'], parentId: 'cardiovascular-system', hints: ['aorta'], importance: 5, cost: 4 }),
    node({ id: 'venous-trunks', name: 'Major venous trunks', primarySystem: 'cardiovascular', regions: ['thorax', 'abdomen'], parentId: 'cardiovascular-system', hints: ['vena cava', 'major vein'], importance: 4, cost: 4 }),
    node({ id: 'pulmonary-circulation', name: 'Pulmonary circulation', primarySystem: 'cardiovascular', systems: ['cardiovascular', 'respiratory'], regions: ['thorax'], parentId: 'cardiovascular-system', hints: ['pulmonary artery', 'pulmonary vein'], importance: 5, cost: 4 }),

    node({ id: 'upper-airway', name: 'Upper airway', primarySystem: 'respiratory', regions: ['head-neck'], parentId: 'respiratory-system', hints: ['upper airway'], importance: 5, cost: 2 }),
    node({ id: 'nasal-cavity', name: 'Nasal cavity', primarySystem: 'respiratory', regions: ['head-neck'], parentId: 'upper-airway', hints: ['nasal cavity', 'nasal'], importance: 3, cost: 2 }),
    node({ id: 'pharynx', name: 'Pharynx', primarySystem: 'respiratory', systems: ['respiratory', 'digestive'], regions: ['head-neck'], parentId: 'upper-airway', hints: ['pharynx'], importance: 4, cost: 2 }),
    node({ id: 'larynx', name: 'Larynx', primarySystem: 'respiratory', regions: ['head-neck'], parentId: 'upper-airway', hints: ['larynx'], importance: 4, cost: 3 }),
    node({ id: 'trachea', name: 'Trachea', primarySystem: 'respiratory', regions: ['head-neck', 'thorax'], parentId: 'respiratory-system', hints: ['trachea'], relations: [{ kind: 'continuous-with', targetId: 'larynx' }], importance: 5, cost: 3 }),
    node({ id: 'right-main-bronchus', name: 'Right main bronchus', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'trachea', aliases: ['right mainstem bronchus'], hints: ['right main bronchus', 'right mainstem bronchus'], importance: 5, cost: 2 }),
    node({ id: 'left-main-bronchus', name: 'Left main bronchus', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'trachea', aliases: ['left mainstem bronchus'], hints: ['left main bronchus', 'left mainstem bronchus'], importance: 5, cost: 2 }),
    node({ id: 'right-lung', name: 'Right lung', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'respiratory-system', hints: ['right lung'], relations: [{ kind: 'paired-with', targetId: 'left-lung' }], importance: 6, cost: 6 }),
    node({ id: 'left-lung', name: 'Left lung', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'respiratory-system', hints: ['left lung'], relations: [{ kind: 'paired-with', targetId: 'right-lung' }], importance: 6, cost: 6 }),
    node({ id: 'right-upper-lobe', name: 'Right upper lobe', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'right-lung', aliases: ['RUL'], hints: ['right upper lobe'], importance: 4, cost: 3 }),
    node({ id: 'right-middle-lobe', name: 'Right middle lobe', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'right-lung', aliases: ['RML'], hints: ['right middle lobe'], importance: 4, cost: 3 }),
    node({ id: 'right-lower-lobe', name: 'Right lower lobe', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'right-lung', aliases: ['RLL'], hints: ['right lower lobe'], importance: 4, cost: 3 }),
    node({ id: 'left-upper-lobe', name: 'Left upper lobe', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'left-lung', aliases: ['LUL'], hints: ['left upper lobe'], importance: 4, cost: 3 }),
    node({ id: 'left-lower-lobe', name: 'Left lower lobe', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'left-lung', aliases: ['LLL'], hints: ['left lower lobe'], importance: 4, cost: 3 }),
    node({ id: 'right-upper-lobe-bronchus', name: 'Right upper lobe bronchus', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'right-main-bronchus', hints: ['right upper lobe bronchus'], relations: [{ kind: 'continuous-with', targetId: 'right-upper-lobe' }], importance: 3, cost: 2 }),
    node({ id: 'right-middle-lobe-bronchus', name: 'Right middle lobe bronchus', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'right-main-bronchus', hints: ['right middle lobe bronchus'], relations: [{ kind: 'continuous-with', targetId: 'right-middle-lobe' }], importance: 3, cost: 2 }),
    node({ id: 'right-lower-lobe-bronchus', name: 'Right lower lobe bronchus', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'right-main-bronchus', hints: ['right lower lobe bronchus'], relations: [{ kind: 'continuous-with', targetId: 'right-lower-lobe' }], importance: 3, cost: 2 }),
    node({ id: 'left-upper-lobe-bronchus', name: 'Left upper lobe bronchus', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'left-main-bronchus', hints: ['left upper lobe bronchus'], relations: [{ kind: 'continuous-with', targetId: 'left-upper-lobe' }], importance: 3, cost: 2 }),
    node({ id: 'left-lower-lobe-bronchus', name: 'Left lower lobe bronchus', primarySystem: 'respiratory', regions: ['thorax'], parentId: 'left-main-bronchus', hints: ['left lower lobe bronchus'], relations: [{ kind: 'continuous-with', targetId: 'left-lower-lobe' }], importance: 3, cost: 2 }),
    node({ id: 'pleura', name: 'Pleura', primarySystem: 'respiratory', systems: ['respiratory', 'connective'], regions: ['thorax'], parentId: 'respiratory-system', hints: ['pleura', 'pleural'], relations: [{ kind: 'adjacent-to', targetId: 'right-lung' }, { kind: 'adjacent-to', targetId: 'left-lung' }], importance: 5, cost: 3 }),
    node({ id: 'diaphragm', name: 'Diaphragm', primarySystem: 'respiratory', systems: ['respiratory', 'muscular'], regions: ['thorax', 'abdomen'], parentId: 'respiratory-system', hints: ['diaphragm'], relations: [{ kind: 'adjacent-to', targetId: 'right-lung' }, { kind: 'adjacent-to', targetId: 'left-lung' }], importance: 6, cost: 4 }),

    node({ id: 'brain', name: 'Brain', primarySystem: 'nervous', regions: ['head-neck'], parentId: 'nervous-system', hints: ['brain'], importance: 6, cost: 7 }),
    node({ id: 'spinal-cord', name: 'Spinal cord', primarySystem: 'nervous', regions: ['back'], parentId: 'nervous-system', hints: ['spinal cord'], importance: 5, cost: 5 }),
    node({ id: 'peripheral-nerves', name: 'Peripheral nerves', primarySystem: 'nervous', regions: ['whole-body'], parentId: 'nervous-system', hints: ['peripheral nerve'], importance: 4, cost: 8 }),

    node({ id: 'esophagus', name: 'Esophagus', primarySystem: 'digestive', regions: ['head-neck', 'thorax', 'abdomen'], parentId: 'digestive-system', hints: ['esophagus'], importance: 4, cost: 3 }),
    node({ id: 'stomach', name: 'Stomach', primarySystem: 'digestive', regions: ['abdomen'], parentId: 'digestive-system', hints: ['stomach'], importance: 4, cost: 4 }),
    node({ id: 'liver', name: 'Liver', primarySystem: 'digestive', regions: ['abdomen'], parentId: 'digestive-system', hints: ['liver', 'hepatic'], importance: 5, cost: 6 }),
    node({ id: 'pancreas', name: 'Pancreas', primarySystem: 'digestive', systems: ['digestive', 'endocrine'], regions: ['abdomen'], parentId: 'digestive-system', hints: ['pancreas'], importance: 5, cost: 4 }),
    node({ id: 'intestines', name: 'Intestines', primarySystem: 'digestive', regions: ['abdomen', 'pelvis'], parentId: 'digestive-system', hints: ['small intestine', 'large intestine', 'colon'], importance: 5, cost: 8 }),

    node({ id: 'kidneys', name: 'Kidneys', primarySystem: 'urinary', regions: ['abdomen'], parentId: 'urinary-system', hints: ['kidney', 'renal'], importance: 5, cost: 5 }),
    node({ id: 'ureters', name: 'Ureters', primarySystem: 'urinary', regions: ['abdomen', 'pelvis'], parentId: 'urinary-system', hints: ['ureter'], importance: 3, cost: 3 }),
    node({ id: 'urinary-bladder', name: 'Urinary bladder', primarySystem: 'urinary', regions: ['pelvis'], parentId: 'urinary-system', hints: ['urinary bladder', 'bladder'], importance: 4, cost: 4 }),

    node({ id: 'reproductive-organs', name: 'Reproductive organs', primarySystem: 'reproductive', regions: ['pelvis'], parentId: 'reproductive-system', hints: ['reproductive organ'], importance: 4, cost: 6 }),
    node({ id: 'pituitary-gland', name: 'Pituitary gland', primarySystem: 'endocrine', regions: ['head-neck'], parentId: 'endocrine-system', hints: ['pituitary gland', 'pituitary'], importance: 4, cost: 2 }),
    node({ id: 'thyroid-gland', name: 'Thyroid gland', primarySystem: 'endocrine', regions: ['head-neck'], parentId: 'endocrine-system', hints: ['thyroid gland', 'thyroid'], importance: 4, cost: 3 }),
    node({ id: 'adrenal-glands', name: 'Adrenal glands', primarySystem: 'endocrine', regions: ['abdomen'], parentId: 'endocrine-system', hints: ['adrenal gland', 'suprarenal'], importance: 4, cost: 3 }),

    node({ id: 'lymphatic-vessels', name: 'Lymphatic vessels', primarySystem: 'lymphatic', regions: ['whole-body'], parentId: 'lymphatic-system', hints: ['lymphatic vessel', 'lymph vessel'], importance: 3, cost: 7 }),
    node({ id: 'lymph-nodes', name: 'Lymph nodes', primarySystem: 'lymphatic', regions: ['whole-body'], parentId: 'lymphatic-system', hints: ['lymph node'], importance: 4, cost: 6 }),
    node({ id: 'spleen', name: 'Spleen', primarySystem: 'lymphatic', regions: ['abdomen'], parentId: 'lymphatic-system', hints: ['spleen'], importance: 4, cost: 4 }),

    node({ id: 'deep-fascia', name: 'Deep fascia', primarySystem: 'connective', regions: ['whole-body'], parentId: 'connective-system', hints: ['deep fascia', 'fascia'], importance: 3, cost: 6 }),
  ],
}
