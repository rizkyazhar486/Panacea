import type {
  AtlasLaterality,
  AtlasNode,
  AtlasProvenance,
  AtlasRegionId,
  AtlasScale,
  AtlasSystemId,
} from './atlasKernel'

const HIGHER_END_REFERENCE: AtlasProvenance = {
  sourceId: 'panacea-higher-end-whole-body-reference-scaffold',
  sourceRevision: '2026-09-09-r2',
  license: 'Internal educational metadata scaffold; no third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/higherEndWholeBodyAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering topology and educational naming only; anatomical publication requires qualified human review and verified source geometry.',
}

type ReferenceDefinition = {
  id: string
  label: string
  system: AtlasSystemId
  regions: readonly AtlasRegionId[]
  scale: AtlasScale
  hints: readonly string[]
  parentId?: string
  laterality?: AtlasLaterality
  synonyms?: readonly string[]
  physiologyCapable?: boolean
}

const DEFINITIONS: readonly ReferenceDefinition[] = [
  { id: 'he:skin-envelope', label: 'Whole-body skin envelope', system: 'surface', regions: ['whole-body'], scale: 'organism', hints: ['skin', 'integument'] },
  { id: 'he:scalp', label: 'Scalp', system: 'surface', regions: ['head'], scale: 'region', hints: ['scalp'] },
  { id: 'he:epidermis', label: 'Epidermis', system: 'surface', regions: ['whole-body'], scale: 'tissue', hints: ['epidermis'], physiologyCapable: true },
  { id: 'he:dermis', label: 'Dermis', system: 'surface', regions: ['whole-body'], scale: 'tissue', hints: ['dermis'], physiologyCapable: true },
  { id: 'he:hair-follicle-unit', label: 'Hair follicle unit', system: 'surface', regions: ['whole-body'], scale: 'microstructure', hints: ['hair follicle'] },

  { id: 'he:skull-base', label: 'Skull base', system: 'skeletal', regions: ['head'], scale: 'suborgan', hints: ['skull base', 'cranial base'] },
  { id: 'he:thoracic-cage', label: 'Thoracic cage', system: 'skeletal', regions: ['thorax', 'back'], scale: 'organ', hints: ['rib', 'sternum', 'thoracic vertebra'] },
  { id: 'he:bony-pelvis', label: 'Bony pelvis', system: 'skeletal', regions: ['pelvis'], scale: 'organ', hints: ['ilium', 'ischium', 'pubis', 'sacrum'] },
  { id: 'he:hand-skeleton', label: 'Hand skeleton', system: 'skeletal', regions: ['upper-limb', 'hand'], scale: 'suborgan', hints: ['carpal', 'metacarpal', 'hand phalanx'], laterality: 'paired' },
  { id: 'he:foot-skeleton', label: 'Foot skeleton', system: 'skeletal', regions: ['lower-limb', 'foot'], scale: 'suborgan', hints: ['tarsal', 'metatarsal', 'foot phalanx'], laterality: 'paired' },

  { id: 'he:tmj-complex', label: 'Temporomandibular joint complex', system: 'articular', regions: ['head'], scale: 'suborgan', hints: ['temporomandibular joint', 'mandibular condyle'], laterality: 'paired' },
  { id: 'he:shoulder-complex', label: 'Shoulder joint complex', system: 'articular', regions: ['thorax', 'upper-limb'], scale: 'suborgan', hints: ['glenohumeral joint', 'acromioclavicular joint'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:hip-complex', label: 'Hip joint complex', system: 'articular', regions: ['pelvis', 'lower-limb'], scale: 'suborgan', hints: ['hip joint', 'acetabulum'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:knee-complex', label: 'Knee joint complex', system: 'articular', regions: ['lower-limb'], scale: 'suborgan', hints: ['knee joint', 'meniscus', 'cruciate ligament'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:synovial-membrane', label: 'Synovial membrane', system: 'articular', regions: ['whole-body'], scale: 'tissue', hints: ['synovial membrane', 'synovium'], physiologyCapable: true },

  { id: 'he:diaphragm-muscle', label: 'Diaphragm muscle', system: 'muscular', regions: ['thorax', 'abdomen'], scale: 'organ', hints: ['diaphragm'], physiologyCapable: true },
  { id: 'he:rotator-cuff', label: 'Rotator cuff', system: 'muscular', regions: ['thorax', 'upper-limb'], scale: 'suborgan', hints: ['supraspinatus', 'infraspinatus', 'teres minor', 'subscapularis'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:pelvic-floor', label: 'Pelvic floor', system: 'muscular', regions: ['pelvis'], scale: 'suborgan', hints: ['levator ani', 'coccygeus'], physiologyCapable: true },
  { id: 'he:intrinsic-hand-muscles', label: 'Intrinsic hand muscles', system: 'muscular', regions: ['hand'], scale: 'suborgan', hints: ['hand interossei', 'hand lumbrical', 'thenar'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:sarcomere-unit', label: 'Sarcomere functional unit', system: 'muscular', regions: ['whole-body'], scale: 'microstructure', hints: ['sarcomere', 'actin', 'myosin'], physiologyCapable: true },

  { id: 'he:systemic-arterial-tree', label: 'Systemic arterial tree', system: 'cardiovascular', regions: ['whole-body'], scale: 'organism', hints: ['aorta', 'artery'], physiologyCapable: true },
  { id: 'he:carotid-system', label: 'Carotid arterial system', system: 'cardiovascular', regions: ['neck', 'head'], scale: 'suborgan', hints: ['common carotid artery', 'internal carotid artery', 'external carotid artery'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:portal-venous-system', label: 'Portal venous system', system: 'cardiovascular', regions: ['abdomen'], scale: 'suborgan', hints: ['portal vein', 'splenic vein', 'superior mesenteric vein'], physiologyCapable: true },
  { id: 'he:coronary-microvascular-bed', label: 'Coronary microvascular bed', system: 'cardiovascular', regions: ['thorax'], scale: 'microstructure', hints: ['coronary arteriole', 'myocardial capillary'], physiologyCapable: true },
  { id: 'he:systemic-capillary-bed', label: 'Systemic capillary bed', system: 'cardiovascular', regions: ['whole-body'], scale: 'microstructure', hints: ['capillary', 'microcirculation'], physiologyCapable: true },

  { id: 'he:thoracic-duct', label: 'Thoracic duct', system: 'lymphatic', regions: ['abdomen', 'thorax', 'neck'], scale: 'organ', hints: ['thoracic duct'], physiologyCapable: true },
  { id: 'he:cervical-lymph-nodes', label: 'Cervical lymph-node chains', system: 'lymphatic', regions: ['head', 'neck'], scale: 'suborgan', hints: ['cervical lymph node'], laterality: 'paired' },
  { id: 'he:axillary-lymph-nodes', label: 'Axillary lymph-node groups', system: 'lymphatic', regions: ['thorax', 'upper-limb'], scale: 'suborgan', hints: ['axillary lymph node'], laterality: 'paired' },
  { id: 'he:inguinal-lymph-nodes', label: 'Inguinal lymph-node groups', system: 'lymphatic', regions: ['pelvis', 'lower-limb'], scale: 'suborgan', hints: ['inguinal lymph node'], laterality: 'paired' },
  { id: 'he:lymphatic-capillary', label: 'Lymphatic capillary', system: 'lymphatic', regions: ['whole-body'], scale: 'microstructure', hints: ['lymphatic capillary'], physiologyCapable: true },

  { id: 'he:cerebral-cortex', label: 'Cerebral cortex', system: 'nervous', regions: ['head'], scale: 'tissue', hints: ['cerebral cortex'], physiologyCapable: true },
  { id: 'he:basal-ganglia', label: 'Basal ganglia', system: 'nervous', regions: ['head'], scale: 'suborgan', hints: ['caudate nucleus', 'putamen', 'globus pallidus'], physiologyCapable: true },
  { id: 'he:brachial-plexus', label: 'Brachial plexus', system: 'nervous', regions: ['neck', 'thorax', 'upper-limb'], scale: 'suborgan', hints: ['brachial plexus'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:lumbosacral-plexus', label: 'Lumbosacral plexus', system: 'nervous', regions: ['back', 'pelvis', 'lower-limb'], scale: 'suborgan', hints: ['lumbar plexus', 'sacral plexus'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:peripheral-nerve-fascicle', label: 'Peripheral nerve fascicle', system: 'nervous', regions: ['whole-body'], scale: 'microstructure', hints: ['nerve fascicle', 'perineurium'], physiologyCapable: true },

  { id: 'he:nasal-airway', label: 'Nasal airway', system: 'respiratory', regions: ['head'], scale: 'organ', hints: ['nasal cavity', 'nasal airway'], physiologyCapable: true },
  { id: 'he:laryngeal-airway', label: 'Laryngeal airway', system: 'respiratory', regions: ['neck'], scale: 'organ', hints: ['larynx', 'glottis'], physiologyCapable: true },
  { id: 'he:tracheobronchial-tree', label: 'Tracheobronchial tree', system: 'respiratory', regions: ['neck', 'thorax'], scale: 'suborgan', hints: ['trachea', 'bronchus', 'bronchiole'], physiologyCapable: true },
  { id: 'he:pulmonary-acinus', label: 'Pulmonary acinus', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['acinus', 'respiratory bronchiole', 'alveolar duct'], physiologyCapable: true },
  { id: 'he:alveolar-blood-gas-barrier', label: 'Alveolar-blood gas barrier', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['alveolar capillary membrane', 'blood gas barrier'], physiologyCapable: true },

  { id: 'he:esophageal-wall', label: 'Esophageal wall', system: 'digestive', regions: ['neck', 'thorax', 'abdomen'], scale: 'tissue', hints: ['esophageal wall', 'esophagus'], physiologyCapable: true },
  { id: 'he:gastric-wall', label: 'Gastric wall', system: 'digestive', regions: ['abdomen'], scale: 'tissue', hints: ['gastric wall', 'stomach mucosa'], physiologyCapable: true },
  { id: 'he:hepatic-lobule', label: 'Hepatic lobule', system: 'digestive', regions: ['abdomen'], scale: 'microstructure', hints: ['hepatic lobule'], physiologyCapable: true },
  { id: 'he:intestinal-villus', label: 'Intestinal villus', system: 'digestive', regions: ['abdomen'], scale: 'microstructure', hints: ['intestinal villus'], physiologyCapable: true },
  { id: 'he:anorectal-complex', label: 'Anorectal complex', system: 'digestive', regions: ['pelvis'], scale: 'suborgan', hints: ['rectum', 'anal canal'], physiologyCapable: true },

  { id: 'he:renal-cortex', label: 'Renal cortex', system: 'urinary', regions: ['abdomen', 'back'], scale: 'tissue', hints: ['renal cortex'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:renal-medulla', label: 'Renal medulla', system: 'urinary', regions: ['abdomen', 'back'], scale: 'tissue', hints: ['renal medulla'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:nephron', label: 'Nephron', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['nephron'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:glomerulus', label: 'Glomerulus', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['glomerulus'], parentId: 'he:nephron', laterality: 'paired', physiologyCapable: true },
  { id: 'he:urethra', label: 'Urethra', system: 'urinary', regions: ['pelvis'], scale: 'organ', hints: ['urethra'], physiologyCapable: true },

  { id: 'he:hypothalamic-pituitary-axis', label: 'Hypothalamic-pituitary axis', system: 'endocrine', regions: ['head'], scale: 'suborgan', hints: ['hypothalamus', 'pituitary'], physiologyCapable: true },
  { id: 'he:thyroid-follicle', label: 'Thyroid follicle', system: 'endocrine', regions: ['neck'], scale: 'microstructure', hints: ['thyroid follicle'], physiologyCapable: true },
  { id: 'he:parathyroid-glands', label: 'Parathyroid glands', system: 'endocrine', regions: ['neck'], scale: 'organ', hints: ['parathyroid gland'], physiologyCapable: true },
  { id: 'he:adrenal-cortex', label: 'Adrenal cortex', system: 'endocrine', regions: ['abdomen'], scale: 'tissue', hints: ['adrenal cortex'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:pancreatic-islet', label: 'Pancreatic islet', system: 'endocrine', regions: ['abdomen'], scale: 'microstructure', hints: ['islet of Langerhans', 'pancreatic islet'], physiologyCapable: true },

  { id: 'he:uterine-wall', label: 'Uterine wall', system: 'reproductive', regions: ['pelvis'], scale: 'tissue', hints: ['endometrium', 'myometrium'], physiologyCapable: true },
  { id: 'he:ovarian-follicle', label: 'Ovarian follicle', system: 'reproductive', regions: ['pelvis'], scale: 'microstructure', hints: ['ovarian follicle'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:male-ductal-system', label: 'Male reproductive ductal system', system: 'reproductive', regions: ['pelvis'], scale: 'suborgan', hints: ['epididymis', 'ductus deferens', 'ejaculatory duct'], physiologyCapable: true },
  { id: 'he:seminiferous-tubule', label: 'Seminiferous tubule', system: 'reproductive', regions: ['pelvis'], scale: 'microstructure', hints: ['seminiferous tubule'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:prostate-zones', label: 'Prostate zonal anatomy', system: 'reproductive', regions: ['pelvis'], scale: 'suborgan', hints: ['prostate peripheral zone', 'prostate transition zone'], physiologyCapable: true },

  { id: 'he:ocular-globe', label: 'Ocular globe', system: 'sensory', regions: ['head'], scale: 'organ', hints: ['eye', 'ocular globe'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:retina', label: 'Retina', system: 'sensory', regions: ['head'], scale: 'tissue', hints: ['retina'], parentId: 'he:ocular-globe', laterality: 'paired', physiologyCapable: true },
  { id: 'he:retinal-photoreceptor-unit', label: 'Retinal photoreceptor unit', system: 'sensory', regions: ['head'], scale: 'microstructure', hints: ['photoreceptor', 'rod', 'cone'], parentId: 'he:retina', laterality: 'paired', physiologyCapable: true },
  { id: 'he:cochlea', label: 'Cochlea', system: 'sensory', regions: ['head'], scale: 'suborgan', hints: ['cochlea'], laterality: 'paired', physiologyCapable: true },
  { id: 'he:vestibular-apparatus', label: 'Vestibular apparatus', system: 'sensory', regions: ['head'], scale: 'suborgan', hints: ['semicircular canal', 'utricle', 'saccule'], laterality: 'paired', physiologyCapable: true },

  { id: 'he:superficial-fascia', label: 'Superficial fascia', system: 'fascial', regions: ['whole-body'], scale: 'tissue', hints: ['superficial fascia', 'subcutaneous fascia'] },
  { id: 'he:deep-fascia', label: 'Deep fascia', system: 'fascial', regions: ['whole-body'], scale: 'tissue', hints: ['deep fascia'] },
  { id: 'he:thoracolumbar-fascia', label: 'Thoracolumbar fascia', system: 'fascial', regions: ['thorax', 'abdomen', 'back'], scale: 'suborgan', hints: ['thoracolumbar fascia'] },
  { id: 'he:visceral-fascial-planes', label: 'Visceral fascial planes', system: 'fascial', regions: ['thorax', 'abdomen', 'pelvis'], scale: 'tissue', hints: ['visceral fascia', 'organ fascia'] },
  { id: 'he:neural-connective-sheath', label: 'Neural connective-tissue sheath', system: 'fascial', regions: ['whole-body'], scale: 'microstructure', hints: ['epineurium', 'perineurium', 'endoneurium'] },
]

function makeReferenceNode(definition: ReferenceDefinition): AtlasNode {
  return {
    id: definition.id,
    label: definition.label,
    system: definition.system,
    regions: definition.regions,
    laterality: definition.laterality ?? 'not-applicable',
    scale: definition.scale,
    parentId: definition.parentId ?? `system:${definition.system}`,
    synonyms: definition.synonyms,
    source: { mode: 'specific-fallback', nodeHints: definition.hints },
    provenance: HIGHER_END_REFERENCE,
    geometryStatus: 'reference-only',
    educationalPriority: 0.86,
    physiologyCapable: definition.physiologyCapable,
    surgicalLandmark: false,
  }
}

export const HIGHER_END_WHOLE_BODY_NODES: readonly AtlasNode[] = DEFINITIONS.map(makeReferenceNode)

export const HIGHER_END_WHOLE_BODY_SYSTEMS: readonly AtlasSystemId[] = [...new Set(HIGHER_END_WHOLE_BODY_NODES.map((node) => node.system))].sort()
export const HIGHER_END_WHOLE_BODY_REGIONS: readonly AtlasRegionId[] = [...new Set(HIGHER_END_WHOLE_BODY_NODES.flatMap((node) => node.regions))].sort()
export const HIGHER_END_WHOLE_BODY_SCALES: readonly AtlasScale[] = [...new Set(HIGHER_END_WHOLE_BODY_NODES.map((node) => node.scale))].sort()
