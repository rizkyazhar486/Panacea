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
  sourceRevision: '2026-09-09-r1',
  license: 'Internal educational metadata scaffold; no third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/higherEndWholeBodyAtlas.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering topology, spatial anchors, and cross-scale links only; anatomical accuracy requires qualified human review before publication as reviewed content.',
}

type HighEndNodeInput = Omit<AtlasNode, 'provenance' | 'educationalPriority' | 'geometryStatus'> & {
  educationalPriority?: number
}

function refNode(input: HighEndNodeInput): AtlasNode {
  return {
    provenance: HIGHER_END_REFERENCE,
    geometryStatus: 'reference-only',
    educationalPriority: input.educationalPriority ?? 0.86,
    ...input,
  }
}

function scaffold(input: {
  id: string
  label: string
  system: AtlasSystemId
  regions: readonly AtlasRegionId[]
  laterality?: AtlasLaterality
  scale?: AtlasScale
  parentId: string
  hints: readonly string[]
  synonyms?: readonly string[]
  center?: readonly [number, number, number]
  radius?: number
  physiologyCapable?: boolean
  surgicalLandmark?: boolean
  educationalPriority?: number
  relations?: AtlasNode['relations']
}): AtlasNode {
  return refNode({
    id: input.id,
    label: input.label,
    system: input.system,
    regions: input.regions,
    laterality: input.laterality ?? 'not-applicable',
    scale: input.scale ?? 'suborgan',
    parentId: input.parentId,
    synonyms: input.synonyms,
    source: { mode: 'specific-fallback', nodeHints: input.hints },
    spatial: input.center && input.radius
      ? { center: input.center, radius: input.radius, preferredCameraDistance: Math.max(0.35, input.radius * 5) }
      : undefined,
    physiologyCapable: input.physiologyCapable,
    surgicalLandmark: input.surgicalLandmark,
    educationalPriority: input.educationalPriority,
    relations: input.relations,
  })
}

/**
 * Higher-end whole-body expansion pack.
 *
 * These nodes intentionally remain reference-only until a reviewed source node
 * or acquisition asset is admitted. The graph is useful before geometry exists:
 * search, cross-scale navigation, completeness audits, cross-section planning,
 * prefetch topology, and future histology/surgical bridges can all reference a
 * stable identity without pretending unreviewed meshes have shipped.
 *
 * Spatial anchors are normalized educational model coordinates, never patient
 * coordinates and never a substitute for imaging or operative navigation.
 */
export const HIGHER_END_WHOLE_BODY_NODES: readonly AtlasNode[] = [
  // Integumentary / surface scale ladder.
  scaffold({ id: 'he:skin-envelope', label: 'Whole-body skin envelope', system: 'surface', regions: ['whole-body'], scale: 'organism', parentId: 'system:surface', hints: ['skin'], synonyms: ['integument'], center: [0, 0, 0], radius: 1.05, educationalPriority: 0.92 }),
  scaffold({ id: 'he:skin-epidermis', label: 'Epidermis', system: 'surface', regions: ['whole-body'], scale: 'tissue', parentId: 'he:skin-envelope', hints: ['epidermis'], physiologyCapable: true }),
  scaffold({ id: 'he:skin-dermis', label: 'Dermis', system: 'surface', regions: ['whole-body'], scale: 'tissue', parentId: 'he:skin-envelope', hints: ['dermis'], physiologyCapable: true }),
  scaffold({ id: 'he:skin-hypodermis', label: 'Hypodermis and superficial fascia', system: 'surface', regions: ['whole-body'], scale: 'tissue', parentId: 'he:skin-envelope', hints: ['hypodermis', 'superficial fascia'], physiologyCapable: true }),

  // Skeletal architecture and clinically important regional frameworks.
  scaffold({ id: 'he:skull-base', label: 'Skull base', system: 'skeletal', regions: ['head'], parentId: 'system:skeletal', hints: ['skull base', 'cranial base'], center: [0, 0.83, 0.02], radius: 0.16, surgicalLandmark: true, educationalPriority: 0.98 }),
  scaffold({ id: 'he:cranial-foramina', label: 'Cranial foramina complex', system: 'skeletal', regions: ['head'], scale: 'suborgan', parentId: 'he:skull-base', hints: ['foramen magnum', 'jugular foramen', 'foramen ovale', 'optic canal'], center: [0, 0.8, 0.01], radius: 0.11, surgicalLandmark: true, educationalPriority: 0.98 }),
  scaffold({ id: 'he:thoracic-cage', label: 'Thoracic cage', system: 'skeletal', regions: ['thorax', 'back'], parentId: 'system:skeletal', hints: ['rib', 'sternum', 'thoracic vertebra'], center: [0, 0.31, 0], radius: 0.34, surgicalLandmark: true, educationalPriority: 0.95 }),
  scaffold({ id: 'he:bony-pelvis', label: 'Bony pelvis', system: 'skeletal', regions: ['pelvis'], parentId: 'system:skeletal', hints: ['ilium', 'ischium', 'pubis', 'sacrum'], center: [0, -0.28, 0], radius: 0.27, surgicalLandmark: true, educationalPriority: 0.95 }),
  scaffold({ id: 'he:hand-skeleton', label: 'Hand skeleton', system: 'skeletal', regions: ['hand', 'upper-limb'], laterality: 'paired', parentId: 'system:skeletal', hints: ['carpal', 'metacarpal', 'phalanx'], center: [0.67, 0.0, 0], radius: 0.16, surgicalLandmark: true }),
  scaffold({ id: 'he:foot-skeleton', label: 'Foot skeleton', system: 'skeletal', regions: ['foot', 'lower-limb'], laterality: 'paired', parentId: 'system:skeletal', hints: ['tarsal', 'metatarsal', 'phalanx'], center: [0.18, -0.97, 0.03], radius: 0.18, surgicalLandmark: true }),

  // Articular system: high-value motion complexes rather than generic joints.
  scaffold({ id: 'he:shoulder-complex', label: 'Shoulder complex', system: 'articular', regions: ['upper-limb', 'thorax'], laterality: 'paired', parentId: 'system:articular', hints: ['glenohumeral joint', 'acromioclavicular joint', 'sternoclavicular joint'], center: [0.31, 0.47, 0], radius: 0.13, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:elbow-complex', label: 'Elbow complex', system: 'articular', regions: ['upper-limb'], laterality: 'paired', parentId: 'system:articular', hints: ['humeroulnar joint', 'humeroradial joint', 'proximal radioulnar joint'], center: [0.5, 0.23, 0], radius: 0.1, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:wrist-complex', label: 'Wrist and carpal complex', system: 'articular', regions: ['upper-limb', 'hand'], laterality: 'paired', parentId: 'system:articular', hints: ['radiocarpal joint', 'carpal joint'], center: [0.64, 0.05, 0], radius: 0.09, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:hip-complex', label: 'Hip complex', system: 'articular', regions: ['pelvis', 'lower-limb'], laterality: 'paired', parentId: 'system:articular', hints: ['hip joint', 'acetabulum'], center: [0.16, -0.31, 0], radius: 0.13, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:knee-complex', label: 'Knee complex', system: 'articular', regions: ['lower-limb'], laterality: 'paired', parentId: 'system:articular', hints: ['knee joint', 'meniscus', 'cruciate ligament'], center: [0.15, -0.66, 0], radius: 0.13, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:ankle-complex', label: 'Ankle and hindfoot complex', system: 'articular', regions: ['lower-limb', 'foot'], laterality: 'paired', parentId: 'system:articular', hints: ['ankle joint', 'talocrural joint', 'subtalar joint'], center: [0.15, -0.91, 0], radius: 0.1, physiologyCapable: true, surgicalLandmark: true }),

  // Muscular / fascial functional units.
  scaffold({ id: 'he:rotator-cuff', label: 'Rotator cuff', system: 'muscular', regions: ['upper-limb', 'thorax'], laterality: 'paired', parentId: 'system:muscular', hints: ['supraspinatus', 'infraspinatus', 'teres minor', 'subscapularis'], center: [0.31, 0.45, 0.01], radius: 0.12, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:pelvic-floor', label: 'Pelvic floor', system: 'muscular', regions: ['pelvis'], laterality: 'midline', parentId: 'system:muscular', hints: ['levator ani', 'coccygeus'], center: [0, -0.42, 0.02], radius: 0.18, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:intrinsic-hand-muscles', label: 'Intrinsic hand muscles', system: 'muscular', regions: ['hand'], laterality: 'paired', parentId: 'system:muscular', hints: ['interossei of hand', 'lumbrical of hand', 'thenar'], center: [0.67, 0.0, 0], radius: 0.14, physiologyCapable: true }),
  scaffold({ id: 'he:intrinsic-foot-muscles', label: 'Intrinsic foot muscles', system: 'muscular', regions: ['foot'], laterality: 'paired', parentId: 'system:muscular', hints: ['interossei of foot', 'lumbrical of foot'], center: [0.18, -0.96, 0.03], radius: 0.16, physiologyCapable: true }),
  scaffold({ id: 'he:sarcomere-unit', label: 'Sarcomere functional unit', system: 'muscular', regions: ['whole-body'], scale: 'microstructure', parentId: 'system:muscular', hints: ['sarcomere', 'actin', 'myosin'], physiologyCapable: true }),

  // Cardiovascular: macro circulation -> regional routes -> microcirculation.
  scaffold({ id: 'he:systemic-arterial-tree', label: 'Systemic arterial tree', system: 'cardiovascular', regions: ['whole-body'], scale: 'organism', parentId: 'system:cardiovascular', hints: ['aorta', 'artery'], center: [0, 0, 0], radius: 0.9, physiologyCapable: true, surgicalLandmark: true, educationalPriority: 1 }),
  scaffold({ id: 'he:systemic-venous-tree', label: 'Systemic venous return', system: 'cardiovascular', regions: ['whole-body'], scale: 'organism', parentId: 'system:cardiovascular', hints: ['superior vena cava', 'inferior vena cava', 'vein'], center: [0, 0, 0], radius: 0.9, physiologyCapable: true, surgicalLandmark: true, educationalPriority: 1 }),
  scaffold({ id: 'he:carotid-system', label: 'Carotid arterial system', system: 'cardiovascular', regions: ['neck', 'head'], laterality: 'paired', parentId: 'he:systemic-arterial-tree', hints: ['common carotid artery', 'internal carotid artery', 'external carotid artery'], center: [0.05, 0.67, 0.02], radius: 0.24, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:vertebrobasilar-system', label: 'Vertebrobasilar arterial system', system: 'cardiovascular', regions: ['neck', 'head'], parentId: 'he:systemic-arterial-tree', hints: ['vertebral artery', 'basilar artery'], center: [0, 0.72, -0.04], radius: 0.22, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:upper-limb-arterial-tree', label: 'Upper-limb arterial tree', system: 'cardiovascular', regions: ['upper-limb', 'hand'], laterality: 'paired', parentId: 'he:systemic-arterial-tree', hints: ['subclavian artery', 'axillary artery', 'brachial artery', 'radial artery', 'ulnar artery'], center: [0.44, 0.26, 0], radius: 0.42, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:lower-limb-arterial-tree', label: 'Lower-limb arterial tree', system: 'cardiovascular', regions: ['pelvis', 'lower-limb', 'foot'], laterality: 'paired', parentId: 'he:systemic-arterial-tree', hints: ['external iliac artery', 'femoral artery', 'popliteal artery', 'tibial artery'], center: [0.14, -0.58, 0], radius: 0.46, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:portal-venous-system', label: 'Portal venous system', system: 'cardiovascular', regions: ['abdomen'], parentId: 'he:systemic-venous-tree', hints: ['portal vein', 'superior mesenteric vein', 'splenic vein'], center: [0.02, 0.02, 0.02], radius: 0.22, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:microcirculation', label: 'Systemic microcirculation', system: 'cardiovascular', regions: ['whole-body'], scale: 'microstructure', parentId: 'system:cardiovascular', hints: ['arteriole', 'capillary', 'venule'], physiologyCapable: true, educationalPriority: 0.95 }),

  // Lymphatics.
  scaffold({ id: 'he:thoracic-duct', label: 'Thoracic duct', system: 'lymphatic', regions: ['abdomen', 'thorax', 'neck'], parentId: 'system:lymphatic', hints: ['thoracic duct'], center: [-0.02, 0.23, -0.04], radius: 0.38, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:cisterna-chyli', label: 'Cisterna chyli', system: 'lymphatic', regions: ['abdomen'], parentId: 'he:thoracic-duct', hints: ['cisterna chyli'], center: [0, -0.01, -0.04], radius: 0.08, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:cervical-lymph-nodes', label: 'Cervical lymph-node chains', system: 'lymphatic', regions: ['head', 'neck'], laterality: 'paired', parentId: 'system:lymphatic', hints: ['cervical lymph node'], center: [0.06, 0.68, 0], radius: 0.2, surgicalLandmark: true }),
  scaffold({ id: 'he:axillary-lymph-nodes', label: 'Axillary lymph-node groups', system: 'lymphatic', regions: ['thorax', 'upper-limb'], laterality: 'paired', parentId: 'system:lymphatic', hints: ['axillary lymph node'], center: [0.29, 0.37, 0], radius: 0.13, surgicalLandmark: true }),
  scaffold({ id: 'he:mediastinal-lymph-nodes', label: 'Mediastinal lymph-node stations', system: 'lymphatic', regions: ['thorax'], parentId: 'system:lymphatic', hints: ['mediastinal lymph node'], center: [0, 0.31, 0], radius: 0.22, surgicalLandmark: true }),
  scaffold({ id: 'he:mesenteric-lymph-nodes', label: 'Mesenteric lymph-node chains', system: 'lymphatic', regions: ['abdomen'], parentId: 'system:lymphatic', hints: ['mesenteric lymph node'], center: [0, -0.03, 0], radius: 0.26, surgicalLandmark: true }),
  scaffold({ id: 'he:inguinal-lymph-nodes', label: 'Inguinal lymph-node groups', system: 'lymphatic', regions: ['pelvis', 'lower-limb'], laterality: 'paired', parentId: 'system:lymphatic', hints: ['inguinal lymph node'], center: [0.16, -0.4, 0], radius: 0.14, surgicalLandmark: true }),

  // Nervous system and clinically useful peripheral networks.
  scaffold({ id: 'he:cranial-nerve-complex', label: 'Cranial nerves I–XII', system: 'nervous', regions: ['head', 'neck'], parentId: 'system:nervous', hints: ['cranial nerve'], center: [0, 0.79, 0], radius: 0.19, physiologyCapable: true, surgicalLandmark: true, educationalPriority: 1 }),
  scaffold({ id: 'he:brachial-plexus', label: 'Brachial plexus', system: 'nervous', regions: ['neck', 'thorax', 'upper-limb'], laterality: 'paired', parentId: 'system:nervous', hints: ['brachial plexus'], center: [0.2, 0.48, 0], radius: 0.2, physiologyCapable: true, surgicalLandmark: true, educationalPriority: 1 }),
  scaffold({ id: 'he:lumbosacral-plexus', label: 'Lumbosacral plexus', system: 'nervous', regions: ['abdomen', 'pelvis', 'lower-limb'], laterality: 'paired', parentId: 'system:nervous', hints: ['lumbar plexus', 'sacral plexus'], center: [0.11, -0.26, -0.02], radius: 0.25, physiologyCapable: true, surgicalLandmark: true, educationalPriority: 1 }),
  scaffold({ id: 'he:sympathetic-chain', label: 'Sympathetic trunks', system: 'nervous', regions: ['neck', 'thorax', 'abdomen', 'pelvis', 'back'], laterality: 'paired', parentId: 'system:nervous', hints: ['sympathetic trunk', 'sympathetic chain'], center: [0.04, 0.08, -0.07], radius: 0.68, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:parasympathetic-network', label: 'Parasympathetic outflow network', system: 'nervous', regions: ['head', 'neck', 'thorax', 'abdomen', 'pelvis'], parentId: 'system:nervous', hints: ['vagus nerve', 'pelvic splanchnic nerve'], center: [0, 0.12, 0], radius: 0.72, physiologyCapable: true }),
  scaffold({ id: 'he:enteric-nervous-system', label: 'Enteric nervous system', system: 'nervous', regions: ['abdomen', 'pelvis'], scale: 'tissue', parentId: 'system:nervous', hints: ['myenteric plexus', 'submucosal plexus'], center: [0, -0.08, 0], radius: 0.28, physiologyCapable: true }),
  scaffold({ id: 'he:neuron-synapse-unit', label: 'Neuron–synapse unit', system: 'nervous', regions: ['whole-body'], scale: 'microstructure', parentId: 'system:nervous', hints: ['neuron', 'synapse'], physiologyCapable: true }),

  // Digestive / hepatobiliary / mesenteric architecture.
  scaffold({ id: 'he:oral-cavity', label: 'Oral cavity', system: 'digestive', regions: ['head'], parentId: 'system:digestive', hints: ['oral cavity', 'mouth'], center: [0, 0.79, 0.08], radius: 0.13, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:esophageal-course', label: 'Esophageal course', system: 'digestive', regions: ['neck', 'thorax', 'abdomen'], parentId: 'system:digestive', hints: ['esophagus'], center: [0, 0.29, -0.03], radius: 0.48, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:hepatobiliary-tree', label: 'Hepatobiliary tree', system: 'digestive', regions: ['abdomen'], parentId: 'system:digestive', hints: ['intrahepatic bile duct', 'common hepatic duct', 'common bile duct', 'gallbladder'], center: [0.09, 0.02, 0.02], radius: 0.2, physiologyCapable: true, surgicalLandmark: true, educationalPriority: 1 }),
  scaffold({ id: 'he:portal-triad', label: 'Portal triad', system: 'digestive', regions: ['abdomen'], scale: 'suborgan', parentId: 'he:hepatobiliary-tree', hints: ['portal vein', 'hepatic artery', 'bile duct'], center: [0.08, 0.02, 0.02], radius: 0.09, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:mesentery', label: 'Small-bowel mesentery', system: 'digestive', regions: ['abdomen'], scale: 'tissue', parentId: 'system:digestive', hints: ['mesentery'], center: [0, -0.08, 0], radius: 0.26, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:greater-omentum', label: 'Greater omentum', system: 'digestive', regions: ['abdomen'], scale: 'tissue', parentId: 'system:digestive', hints: ['greater omentum'], center: [0, -0.08, 0.07], radius: 0.28, surgicalLandmark: true }),
  scaffold({ id: 'he:hepatic-lobule-unit', label: 'Hepatic lobule and sinusoid unit', system: 'digestive', regions: ['abdomen'], scale: 'microstructure', parentId: 'he:hepatobiliary-tree', hints: ['hepatic lobule', 'sinusoid'], physiologyCapable: true }),
  scaffold({ id: 'he:intestinal-villus-unit', label: 'Intestinal villus–crypt unit', system: 'digestive', regions: ['abdomen'], scale: 'microstructure', parentId: 'system:digestive', hints: ['intestinal villus', 'crypt'], physiologyCapable: true }),

  // Urinary multiscale ladder.
  scaffold({ id: 'he:renal-parenchyma', label: 'Renal parenchyma', system: 'urinary', regions: ['abdomen', 'back'], laterality: 'paired', parentId: 'system:urinary', hints: ['renal cortex', 'renal medulla'], center: [0.13, 0.02, -0.08], radius: 0.14, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:renal-collecting-system', label: 'Renal collecting system', system: 'urinary', regions: ['abdomen'], laterality: 'paired', parentId: 'he:renal-parenchyma', hints: ['renal calyx', 'renal pelvis'], center: [0.11, 0.01, -0.07], radius: 0.1, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:nephron', label: 'Nephron', system: 'urinary', regions: ['abdomen'], laterality: 'paired', scale: 'microstructure', parentId: 'he:renal-parenchyma', hints: ['nephron'], physiologyCapable: true }),
  scaffold({ id: 'he:glomerulus', label: 'Glomerular filtration unit', system: 'urinary', regions: ['abdomen'], laterality: 'paired', scale: 'microstructure', parentId: 'he:nephron', hints: ['glomerulus', 'Bowman capsule'], physiologyCapable: true }),

  // Endocrine multiscale structures.
  scaffold({ id: 'he:hypothalamic-pituitary-axis', label: 'Hypothalamic–pituitary axis', system: 'endocrine', regions: ['head'], parentId: 'system:endocrine', hints: ['hypothalamus', 'pituitary gland', 'infundibulum'], center: [0, 0.82, 0], radius: 0.09, physiologyCapable: true, educationalPriority: 0.98 }),
  scaffold({ id: 'he:thyroid-follicle', label: 'Thyroid follicle', system: 'endocrine', regions: ['neck'], scale: 'microstructure', parentId: 'system:endocrine', hints: ['thyroid follicle'], physiologyCapable: true }),
  scaffold({ id: 'he:pancreatic-islet', label: 'Pancreatic islet', system: 'endocrine', regions: ['abdomen'], scale: 'microstructure', parentId: 'system:endocrine', hints: ['islet of Langerhans', 'pancreatic islet'], physiologyCapable: true }),
  scaffold({ id: 'he:adrenal-cortex-medulla', label: 'Adrenal cortex–medulla architecture', system: 'endocrine', regions: ['abdomen'], laterality: 'paired', scale: 'tissue', parentId: 'system:endocrine', hints: ['adrenal cortex', 'adrenal medulla'], center: [0.12, 0.08, -0.06], radius: 0.07, physiologyCapable: true }),

  // Reproductive anatomy kept neutral and reference-only until dedicated reviewed assets exist.
  scaffold({ id: 'he:male-pelvic-reproductive-complex', label: 'Male pelvic reproductive complex', system: 'reproductive', regions: ['pelvis'], parentId: 'system:reproductive', hints: ['prostate', 'seminal vesicle', 'vas deferens', 'testis'], center: [0, -0.39, 0.02], radius: 0.2, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:female-pelvic-reproductive-complex', label: 'Female pelvic reproductive complex', system: 'reproductive', regions: ['pelvis'], parentId: 'system:reproductive', hints: ['uterus', 'ovary', 'uterine tube', 'vagina'], center: [0, -0.38, 0.02], radius: 0.19, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:gonadal-gametogenic-unit', label: 'Gonadal gametogenic unit', system: 'reproductive', regions: ['pelvis'], scale: 'microstructure', parentId: 'system:reproductive', hints: ['seminiferous tubule', 'ovarian follicle'], physiologyCapable: true }),

  // Special senses: macroscopic organ to microstructure.
  scaffold({ id: 'he:ocular-globe', label: 'Ocular globe', system: 'sensory', regions: ['head'], laterality: 'paired', parentId: 'system:sensory', hints: ['eye', 'eyeball'], center: [0.07, 0.87, 0.09], radius: 0.07, physiologyCapable: true, surgicalLandmark: true, educationalPriority: 0.98 }),
  scaffold({ id: 'he:retina', label: 'Retina', system: 'sensory', regions: ['head'], laterality: 'paired', scale: 'tissue', parentId: 'he:ocular-globe', hints: ['retina'], physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:retinal-photoreceptor-unit', label: 'Retinal photoreceptor unit', system: 'sensory', regions: ['head'], laterality: 'paired', scale: 'microstructure', parentId: 'he:retina', hints: ['photoreceptor', 'rod cell', 'cone cell'], physiologyCapable: true }),
  scaffold({ id: 'he:inner-ear-complex', label: 'Cochlear–vestibular complex', system: 'sensory', regions: ['head'], laterality: 'paired', parentId: 'system:sensory', hints: ['cochlea', 'vestibular apparatus', 'semicircular canal'], center: [0.09, 0.82, 0], radius: 0.06, physiologyCapable: true, surgicalLandmark: true }),
  scaffold({ id: 'he:organ-of-corti', label: 'Organ of Corti', system: 'sensory', regions: ['head'], laterality: 'paired', scale: 'microstructure', parentId: 'he:inner-ear-complex', hints: ['organ of Corti', 'hair cell'], physiologyCapable: true }),

  // Fascial spaces and surgical compartments.
  scaffold({ id: 'he:deep-neck-spaces', label: 'Deep neck fascial spaces', system: 'fascial', regions: ['neck'], parentId: 'system:fascial', hints: ['deep cervical fascia', 'retropharyngeal space', 'danger space'], center: [0, 0.65, -0.03], radius: 0.17, surgicalLandmark: true, educationalPriority: 0.96 }),
  scaffold({ id: 'he:mediastinal-compartments', label: 'Mediastinal compartments', system: 'fascial', regions: ['thorax'], parentId: 'system:fascial', hints: ['mediastinum'], center: [0, 0.31, 0], radius: 0.27, surgicalLandmark: true, educationalPriority: 0.96 }),
  scaffold({ id: 'he:retroperitoneum', label: 'Retroperitoneal compartment', system: 'fascial', regions: ['abdomen', 'back'], parentId: 'system:fascial', hints: ['retroperitoneum', 'renal fascia'], center: [0, -0.02, -0.08], radius: 0.3, surgicalLandmark: true, educationalPriority: 0.97 }),
  scaffold({ id: 'he:inguinal-canal', label: 'Inguinal canal', system: 'fascial', regions: ['abdomen', 'pelvis'], laterality: 'paired', parentId: 'system:fascial', hints: ['inguinal canal'], center: [0.12, -0.37, 0.06], radius: 0.08, surgicalLandmark: true, educationalPriority: 0.98 }),
  scaffold({ id: 'he:femoral-triangle', label: 'Femoral triangle', system: 'fascial', regions: ['pelvis', 'lower-limb'], laterality: 'paired', parentId: 'system:fascial', hints: ['femoral triangle'], center: [0.14, -0.43, 0.04], radius: 0.1, surgicalLandmark: true, educationalPriority: 0.97 }),
  scaffold({ id: 'he:popliteal-fossa', label: 'Popliteal fossa', system: 'fascial', regions: ['lower-limb'], laterality: 'paired', parentId: 'system:fascial', hints: ['popliteal fossa'], center: [0.15, -0.66, -0.04], radius: 0.1, surgicalLandmark: true, educationalPriority: 0.96 }),

  // Respiratory high-end microstructure supplements. Existing airway/lobe/segment
  // graph remains canonical; these add distal scale rather than duplicate it.
  scaffold({ id: 'he:respiratory-acinus', label: 'Respiratory acinus', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', parentId: 'resp:alveolar-capillary-unit', hints: ['respiratory bronchiole', 'alveolar duct', 'acinus'], physiologyCapable: true, educationalPriority: 0.98 }),
  scaffold({ id: 'he:alveolar-blood-gas-barrier', label: 'Alveolar–blood gas barrier', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', parentId: 'he:respiratory-acinus', hints: ['alveolar epithelium', 'basement membrane', 'capillary endothelium'], physiologyCapable: true, educationalPriority: 1, relations: [{ kind: 'continuous-with', targetId: 'he:microcirculation', note: 'Educational gas-exchange interface; not a patient-specific measurement.' }] }),
]

export const HIGHER_END_WHOLE_BODY_SYSTEMS = [...new Set(HIGHER_END_WHOLE_BODY_NODES.map((node) => node.system))] as readonly AtlasSystemId[]
export const HIGHER_END_WHOLE_BODY_REGIONS = [...new Set(HIGHER_END_WHOLE_BODY_NODES.flatMap((node) => node.regions))] as readonly AtlasRegionId[]
export const HIGHER_END_WHOLE_BODY_SCALES = [...new Set(HIGHER_END_WHOLE_BODY_NODES.map((node) => node.scale))] as readonly AtlasScale[]
