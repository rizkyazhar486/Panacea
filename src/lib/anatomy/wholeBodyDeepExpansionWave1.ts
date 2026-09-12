import type {
  AtlasLaterality,
  AtlasNode,
  AtlasProvenance,
  AtlasRegionId,
  AtlasScale,
  AtlasSystemId,
} from './atlasKernel'

const DEEP_REFERENCE: AtlasProvenance = {
  sourceId: 'panacea-deep-whole-body-reference-wave-1',
  sourceRevision: '2026-09-09-r1',
  license: 'Internal educational metadata scaffold; no third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/wholeBodyDeepExpansionWave1.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering hierarchy, terminology, and source-hint scaffold only. Publication as verified anatomy requires qualified human review and licensed source geometry.',
}

type Definition = {
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
  priority?: number
}

const D: readonly Definition[] = [
  // Skeletal — axial and appendicular coverage.
  { id: 'deep:vertebral-column', label: 'Vertebral column', system: 'skeletal', regions: ['neck', 'thorax', 'back', 'abdomen', 'pelvis'], scale: 'organ', hints: ['vertebral column', 'spine'], parentId: 'system:skeletal', priority: 0.96 },
  { id: 'deep:cervical-spine', label: 'Cervical spine C1–C7', system: 'skeletal', regions: ['neck', 'back'], scale: 'suborgan', hints: ['cervical vertebra', 'atlas vertebra', 'axis vertebra'], parentId: 'deep:vertebral-column', priority: 0.94 },
  { id: 'deep:thoracic-spine', label: 'Thoracic spine T1–T12', system: 'skeletal', regions: ['thorax', 'back'], scale: 'suborgan', hints: ['thoracic vertebra'], parentId: 'deep:vertebral-column', priority: 0.91 },
  { id: 'deep:lumbar-spine', label: 'Lumbar spine L1–L5', system: 'skeletal', regions: ['abdomen', 'back'], scale: 'suborgan', hints: ['lumbar vertebra'], parentId: 'deep:vertebral-column', priority: 0.92 },
  { id: 'deep:sacrum-coccyx', label: 'Sacrum and coccyx', system: 'skeletal', regions: ['pelvis', 'back'], scale: 'suborgan', hints: ['sacrum', 'coccyx'], parentId: 'deep:vertebral-column', priority: 0.86 },
  { id: 'deep:pectoral-girdle', label: 'Pectoral girdle', system: 'skeletal', regions: ['thorax', 'upper-limb'], scale: 'organ', hints: ['clavicle', 'scapula'], parentId: 'system:skeletal', laterality: 'paired', priority: 0.89 },
  { id: 'deep:arm-bones', label: 'Arm and forearm bones', system: 'skeletal', regions: ['upper-limb'], scale: 'organ', hints: ['humerus', 'radius', 'ulna'], parentId: 'system:skeletal', laterality: 'paired', priority: 0.9 },
  { id: 'deep:hand-bones', label: 'Carpal, metacarpal and phalangeal skeleton', system: 'skeletal', regions: ['hand'], scale: 'suborgan', hints: ['carpal bone', 'metacarpal', 'hand phalanx'], parentId: 'deep:arm-bones', laterality: 'paired', priority: 0.88 },
  { id: 'deep:pelvic-ring', label: 'Pelvic ring', system: 'skeletal', regions: ['pelvis'], scale: 'organ', hints: ['ilium', 'ischium', 'pubis', 'sacrum'], parentId: 'system:skeletal', laterality: 'bilateral', priority: 0.92 },
  { id: 'deep:thigh-leg-bones', label: 'Thigh and leg bones', system: 'skeletal', regions: ['lower-limb'], scale: 'organ', hints: ['femur', 'patella', 'tibia', 'fibula'], parentId: 'system:skeletal', laterality: 'paired', priority: 0.93 },
  { id: 'deep:foot-bones', label: 'Tarsal, metatarsal and phalangeal skeleton', system: 'skeletal', regions: ['foot'], scale: 'suborgan', hints: ['tarsal bone', 'metatarsal', 'foot phalanx'], parentId: 'deep:thigh-leg-bones', laterality: 'paired', priority: 0.88 },

  // Articular — major joints and stabilizing complexes.
  { id: 'deep:atlantoaxial-complex', label: 'Atlanto-occipital and atlanto-axial complexes', system: 'articular', regions: ['head', 'neck'], scale: 'suborgan', hints: ['atlanto occipital joint', 'atlanto axial joint'], parentId: 'system:articular', priority: 0.9 },
  { id: 'deep:elbow-complex', label: 'Elbow joint complex', system: 'articular', regions: ['upper-limb'], scale: 'suborgan', hints: ['humeroulnar joint', 'humeroradial joint', 'proximal radioulnar joint'], parentId: 'system:articular', laterality: 'paired', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:wrist-complex', label: 'Wrist joint complex', system: 'articular', regions: ['upper-limb', 'hand'], scale: 'suborgan', hints: ['radiocarpal joint', 'midcarpal joint'], parentId: 'system:articular', laterality: 'paired', physiologyCapable: true, priority: 0.86 },
  { id: 'deep:sacroiliac-complex', label: 'Sacroiliac joint complex', system: 'articular', regions: ['pelvis', 'back'], scale: 'suborgan', hints: ['sacroiliac joint'], parentId: 'system:articular', laterality: 'paired', physiologyCapable: true, priority: 0.87 },
  { id: 'deep:ankle-complex', label: 'Ankle and subtalar joint complex', system: 'articular', regions: ['lower-limb', 'foot'], scale: 'suborgan', hints: ['talocrural joint', 'subtalar joint'], parentId: 'system:articular', laterality: 'paired', physiologyCapable: true, priority: 0.89 },

  // Muscular — regional compartments rather than a toy single-muscle list.
  { id: 'deep:axial-musculature', label: 'Axial trunk musculature', system: 'muscular', regions: ['neck', 'thorax', 'abdomen', 'back'], scale: 'organ', hints: ['erector spinae', 'multifidus', 'abdominal wall muscle'], parentId: 'system:muscular', physiologyCapable: true, priority: 0.91 },
  { id: 'deep:neck-musculature', label: 'Deep and superficial neck musculature', system: 'muscular', regions: ['neck'], scale: 'suborgan', hints: ['sternocleidomastoid', 'scalene muscle', 'longus colli'], parentId: 'deep:axial-musculature', laterality: 'paired', physiologyCapable: true, priority: 0.87 },
  { id: 'deep:abdominal-wall', label: 'Anterolateral abdominal wall', system: 'muscular', regions: ['abdomen'], scale: 'suborgan', hints: ['rectus abdominis', 'external oblique', 'internal oblique', 'transversus abdominis'], parentId: 'deep:axial-musculature', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:arm-muscle-compartments', label: 'Arm muscle compartments', system: 'muscular', regions: ['upper-limb'], scale: 'suborgan', hints: ['biceps brachii', 'brachialis', 'triceps brachii'], parentId: 'system:muscular', laterality: 'paired', physiologyCapable: true, priority: 0.87 },
  { id: 'deep:forearm-muscle-compartments', label: 'Forearm flexor and extensor compartments', system: 'muscular', regions: ['upper-limb', 'hand'], scale: 'suborgan', hints: ['forearm flexor', 'forearm extensor'], parentId: 'system:muscular', laterality: 'paired', physiologyCapable: true, priority: 0.86 },
  { id: 'deep:gluteal-musculature', label: 'Gluteal musculature', system: 'muscular', regions: ['pelvis', 'lower-limb'], scale: 'suborgan', hints: ['gluteus maximus', 'gluteus medius', 'gluteus minimus'], parentId: 'system:muscular', laterality: 'paired', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:thigh-muscle-compartments', label: 'Thigh muscle compartments', system: 'muscular', regions: ['lower-limb'], scale: 'suborgan', hints: ['quadriceps femoris', 'hamstring', 'adductor muscle'], parentId: 'system:muscular', laterality: 'paired', physiologyCapable: true, priority: 0.93 },
  { id: 'deep:leg-muscle-compartments', label: 'Leg muscle compartments', system: 'muscular', regions: ['lower-limb', 'foot'], scale: 'suborgan', hints: ['tibialis anterior', 'gastrocnemius', 'soleus', 'fibularis muscle'], parentId: 'system:muscular', laterality: 'paired', physiologyCapable: true, priority: 0.91 },

  // Cardiovascular — chambers, valves and major venous return.
  { id: 'deep:right-atrium', label: 'Right atrium', system: 'cardiovascular', regions: ['thorax'], scale: 'suborgan', hints: ['right atrium'], parentId: 'cv:heart', physiologyCapable: true, priority: 0.98 },
  { id: 'deep:right-ventricle', label: 'Right ventricle', system: 'cardiovascular', regions: ['thorax'], scale: 'suborgan', hints: ['right ventricle'], parentId: 'cv:heart', physiologyCapable: true, priority: 0.99 },
  { id: 'deep:left-atrium', label: 'Left atrium', system: 'cardiovascular', regions: ['thorax'], scale: 'suborgan', hints: ['left atrium'], parentId: 'cv:heart', physiologyCapable: true, priority: 0.98 },
  { id: 'deep:left-ventricle', label: 'Left ventricle', system: 'cardiovascular', regions: ['thorax'], scale: 'suborgan', hints: ['left ventricle'], parentId: 'cv:heart', physiologyCapable: true, priority: 1 },
  { id: 'deep:atrioventricular-valves', label: 'Atrioventricular valves', system: 'cardiovascular', regions: ['thorax'], scale: 'suborgan', hints: ['tricuspid valve', 'mitral valve'], parentId: 'cv:heart', physiologyCapable: true, priority: 0.96 },
  { id: 'deep:semilunar-valves', label: 'Semilunar valves', system: 'cardiovascular', regions: ['thorax'], scale: 'suborgan', hints: ['pulmonary valve', 'aortic valve'], parentId: 'cv:heart', physiologyCapable: true, priority: 0.96 },
  { id: 'deep:vena-cavae', label: 'Superior and inferior vena cava', system: 'cardiovascular', regions: ['neck', 'thorax', 'abdomen'], scale: 'organ', hints: ['superior vena cava', 'inferior vena cava'], parentId: 'system:cardiovascular', physiologyCapable: true, priority: 0.95 },
  { id: 'deep:pulmonary-veins', label: 'Pulmonary veins', system: 'cardiovascular', regions: ['thorax'], scale: 'suborgan', hints: ['pulmonary vein'], parentId: 'system:cardiovascular', laterality: 'paired', physiologyCapable: true, priority: 0.95 },
  { id: 'deep:systemic-venous-tree', label: 'Systemic venous return tree', system: 'cardiovascular', regions: ['whole-body'], scale: 'organism', hints: ['systemic vein', 'venous tree'], parentId: 'system:cardiovascular', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:pulmonary-capillary-bed', label: 'Pulmonary capillary bed', system: 'cardiovascular', regions: ['thorax'], scale: 'microstructure', hints: ['pulmonary capillary', 'alveolar capillary'], parentId: 'system:cardiovascular', physiologyCapable: true, priority: 0.96 },

  // Lymphatic and immune architecture.
  { id: 'deep:spleen', label: 'Spleen', system: 'lymphatic', regions: ['abdomen'], scale: 'organ', hints: ['spleen'], parentId: 'system:lymphatic', physiologyCapable: true, priority: 0.88 },
  { id: 'deep:thymus', label: 'Thymus', system: 'lymphatic', regions: ['thorax'], scale: 'organ', hints: ['thymus'], parentId: 'system:lymphatic', physiologyCapable: true, priority: 0.82 },
  { id: 'deep:cisterna-chyli', label: 'Cisterna chyli', system: 'lymphatic', regions: ['abdomen'], scale: 'suborgan', hints: ['cisterna chyli'], parentId: 'system:lymphatic', physiologyCapable: true, priority: 0.78 },
  { id: 'deep:mesenteric-lymphatics', label: 'Mesenteric lymphatic network', system: 'lymphatic', regions: ['abdomen'], scale: 'suborgan', hints: ['mesenteric lymph node', 'intestinal lymphatic'], parentId: 'system:lymphatic', physiologyCapable: true, priority: 0.8 },

  // Nervous — central subdivisions, roots and high-value peripheral nerves.
  { id: 'deep:frontal-lobe', label: 'Frontal lobe', system: 'nervous', regions: ['head'], scale: 'suborgan', hints: ['frontal lobe'], parentId: 'neuro:brain', laterality: 'bilateral', physiologyCapable: true, priority: 0.96 },
  { id: 'deep:parietal-lobe', label: 'Parietal lobe', system: 'nervous', regions: ['head'], scale: 'suborgan', hints: ['parietal lobe'], parentId: 'neuro:brain', laterality: 'bilateral', physiologyCapable: true, priority: 0.94 },
  { id: 'deep:temporal-lobe', label: 'Temporal lobe', system: 'nervous', regions: ['head'], scale: 'suborgan', hints: ['temporal lobe'], parentId: 'neuro:brain', laterality: 'bilateral', physiologyCapable: true, priority: 0.95 },
  { id: 'deep:occipital-lobe', label: 'Occipital lobe', system: 'nervous', regions: ['head'], scale: 'suborgan', hints: ['occipital lobe'], parentId: 'neuro:brain', laterality: 'bilateral', physiologyCapable: true, priority: 0.94 },
  { id: 'deep:thalamus', label: 'Thalamus', system: 'nervous', regions: ['head'], scale: 'suborgan', hints: ['thalamus'], parentId: 'neuro:brain', laterality: 'bilateral', physiologyCapable: true, priority: 0.93 },
  { id: 'deep:hypothalamus', label: 'Hypothalamus', system: 'nervous', regions: ['head'], scale: 'suborgan', hints: ['hypothalamus'], parentId: 'neuro:brain', physiologyCapable: true, priority: 0.94 },
  { id: 'deep:spinal-nerve-roots', label: 'Spinal nerve roots', system: 'nervous', regions: ['neck', 'thorax', 'back', 'abdomen', 'pelvis'], scale: 'suborgan', hints: ['spinal nerve root', 'dorsal root', 'ventral root'], parentId: 'neuro:spinal-cord', laterality: 'paired', physiologyCapable: true, priority: 0.93 },
  { id: 'deep:radial-nerve', label: 'Radial nerve', system: 'nervous', regions: ['upper-limb', 'hand'], scale: 'organ', hints: ['radial nerve'], parentId: 'system:nervous', laterality: 'paired', physiologyCapable: true, priority: 0.91 },
  { id: 'deep:median-nerve', label: 'Median nerve', system: 'nervous', regions: ['upper-limb', 'hand'], scale: 'organ', hints: ['median nerve'], parentId: 'system:nervous', laterality: 'paired', physiologyCapable: true, priority: 0.92 },
  { id: 'deep:ulnar-nerve', label: 'Ulnar nerve', system: 'nervous', regions: ['upper-limb', 'hand'], scale: 'organ', hints: ['ulnar nerve'], parentId: 'system:nervous', laterality: 'paired', physiologyCapable: true, priority: 0.92 },
  { id: 'deep:femoral-nerve', label: 'Femoral nerve', system: 'nervous', regions: ['pelvis', 'lower-limb'], scale: 'organ', hints: ['femoral nerve'], parentId: 'system:nervous', laterality: 'paired', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:sciatic-nerve', label: 'Sciatic nerve', system: 'nervous', regions: ['pelvis', 'lower-limb'], scale: 'organ', hints: ['sciatic nerve'], parentId: 'system:nervous', laterality: 'paired', physiologyCapable: true, priority: 0.95 },
  { id: 'deep:tibial-nerve', label: 'Tibial nerve', system: 'nervous', regions: ['lower-limb', 'foot'], scale: 'organ', hints: ['tibial nerve'], parentId: 'system:nervous', laterality: 'paired', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:common-fibular-nerve', label: 'Common fibular nerve', system: 'nervous', regions: ['lower-limb', 'foot'], scale: 'organ', hints: ['common fibular nerve', 'common peroneal nerve'], parentId: 'system:nervous', laterality: 'paired', physiologyCapable: true, priority: 0.9 },

  // Respiratory — proximal-to-microstructure ladder beyond a single lung model.
  { id: 'deep:nasopharynx', label: 'Nasopharynx', system: 'respiratory', regions: ['head', 'neck'], scale: 'suborgan', hints: ['nasopharynx'], parentId: 'system:respiratory', physiologyCapable: true, priority: 0.84 },
  { id: 'deep:oropharynx', label: 'Oropharynx', system: 'respiratory', regions: ['head', 'neck'], scale: 'suborgan', hints: ['oropharynx'], parentId: 'system:respiratory', physiologyCapable: true, priority: 0.86 },
  { id: 'deep:hypopharynx', label: 'Hypopharynx', system: 'respiratory', regions: ['neck'], scale: 'suborgan', hints: ['laryngopharynx', 'hypopharynx'], parentId: 'system:respiratory', physiologyCapable: true, priority: 0.85 },
  { id: 'deep:terminal-bronchiole', label: 'Terminal bronchiole reference', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['terminal bronchiole'], parentId: 'system:respiratory', physiologyCapable: true, priority: 0.91 },
  { id: 'deep:respiratory-bronchiole', label: 'Respiratory bronchiole reference', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['respiratory bronchiole'], parentId: 'deep:terminal-bronchiole', physiologyCapable: true, priority: 0.92 },
  { id: 'deep:alveolar-duct', label: 'Alveolar duct reference', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['alveolar duct'], parentId: 'deep:respiratory-bronchiole', physiologyCapable: true, priority: 0.93 },
  { id: 'deep:alveolar-sac', label: 'Alveolar sac reference', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['alveolar sac', 'alveolus'], parentId: 'deep:alveolar-duct', physiologyCapable: true, priority: 0.96 },

  // Digestive — luminal and hepatobiliary continuity.
  { id: 'deep:oral-cavity', label: 'Oral cavity', system: 'digestive', regions: ['head'], scale: 'organ', hints: ['oral cavity', 'mouth'], parentId: 'system:digestive', physiologyCapable: true, priority: 0.83 },
  { id: 'deep:esophagus', label: 'Esophagus', system: 'digestive', regions: ['neck', 'thorax', 'abdomen'], scale: 'organ', hints: ['esophagus'], parentId: 'system:digestive', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:gallbladder', label: 'Gallbladder', system: 'digestive', regions: ['abdomen'], scale: 'organ', hints: ['gallbladder'], parentId: 'system:digestive', physiologyCapable: true, priority: 0.87 },
  { id: 'deep:biliary-tree', label: 'Extrahepatic biliary tree', system: 'digestive', regions: ['abdomen'], scale: 'suborgan', hints: ['common hepatic duct', 'cystic duct', 'common bile duct'], parentId: 'system:digestive', physiologyCapable: true, priority: 0.91 },
  { id: 'deep:duodenum', label: 'Duodenum', system: 'digestive', regions: ['abdomen'], scale: 'suborgan', hints: ['duodenum'], parentId: 'gi:small-intestine', physiologyCapable: true, priority: 0.89 },
  { id: 'deep:jejunum', label: 'Jejunum', system: 'digestive', regions: ['abdomen'], scale: 'suborgan', hints: ['jejunum'], parentId: 'gi:small-intestine', physiologyCapable: true, priority: 0.84 },
  { id: 'deep:ileum', label: 'Ileum', system: 'digestive', regions: ['abdomen', 'pelvis'], scale: 'suborgan', hints: ['ileum'], parentId: 'gi:small-intestine', physiologyCapable: true, priority: 0.85 },
  { id: 'deep:appendix', label: 'Vermiform appendix', system: 'digestive', regions: ['abdomen', 'pelvis'], scale: 'suborgan', hints: ['vermiform appendix', 'appendix'], parentId: 'gi:large-intestine', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:colon-segments', label: 'Colon segments', system: 'digestive', regions: ['abdomen', 'pelvis'], scale: 'suborgan', hints: ['ascending colon', 'transverse colon', 'descending colon', 'sigmoid colon'], parentId: 'gi:large-intestine', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:rectum-anal-canal', label: 'Rectum and anal canal', system: 'digestive', regions: ['pelvis'], scale: 'suborgan', hints: ['rectum', 'anal canal'], parentId: 'gi:large-intestine', physiologyCapable: true, priority: 0.89 },

  // Urinary — collecting system and nephron microstructure.
  { id: 'deep:renal-pelvicalyceal-system', label: 'Renal pelvicalyceal system', system: 'urinary', regions: ['abdomen', 'back'], scale: 'suborgan', hints: ['renal pelvis', 'major calyx', 'minor calyx'], parentId: 'urinary:kidneys', laterality: 'paired', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:glomerular-filtration-barrier', label: 'Glomerular filtration barrier', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['glomerular filtration barrier', 'podocyte', 'glomerular basement membrane'], parentId: 'urinary:kidneys', laterality: 'paired', physiologyCapable: true, priority: 0.94 },
  { id: 'deep:proximal-tubule', label: 'Proximal tubule reference', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['proximal convoluted tubule'], parentId: 'urinary:kidneys', laterality: 'paired', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:loop-of-henle', label: 'Loop of Henle reference', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['loop of Henle', 'thin limb', 'thick ascending limb'], parentId: 'urinary:kidneys', laterality: 'paired', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:distal-collecting-system', label: 'Distal tubule and collecting duct reference', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['distal convoluted tubule', 'collecting duct'], parentId: 'urinary:kidneys', laterality: 'paired', physiologyCapable: true, priority: 0.9 },

  // Endocrine — gland compartments and cellular endocrine units.
  { id: 'deep:pineal-gland', label: 'Pineal gland', system: 'endocrine', regions: ['head'], scale: 'organ', hints: ['pineal gland'], parentId: 'system:endocrine', physiologyCapable: true, priority: 0.74 },
  { id: 'deep:adrenal-medulla', label: 'Adrenal medulla', system: 'endocrine', regions: ['abdomen'], scale: 'tissue', hints: ['adrenal medulla'], parentId: 'endo:adrenals', laterality: 'paired', physiologyCapable: true, priority: 0.87 },
  { id: 'deep:pancreatic-islet', label: 'Pancreatic islet reference', system: 'endocrine', regions: ['abdomen'], scale: 'microstructure', hints: ['pancreatic islet', 'islet of Langerhans'], parentId: 'system:endocrine', physiologyCapable: true, priority: 0.92 },

  // Reproductive — male and female tract reference identities.
  { id: 'deep:testes', label: 'Testes', system: 'reproductive', regions: ['pelvis'], scale: 'organ', hints: ['testis', 'testicle'], parentId: 'system:reproductive', laterality: 'paired', physiologyCapable: true, priority: 0.88 },
  { id: 'deep:epididymides', label: 'Epididymides', system: 'reproductive', regions: ['pelvis'], scale: 'organ', hints: ['epididymis'], parentId: 'system:reproductive', laterality: 'paired', physiologyCapable: true, priority: 0.82 },
  { id: 'deep:ductus-deferens', label: 'Ductus deferens', system: 'reproductive', regions: ['pelvis'], scale: 'organ', hints: ['ductus deferens', 'vas deferens'], parentId: 'system:reproductive', laterality: 'paired', physiologyCapable: true, priority: 0.82 },
  { id: 'deep:prostate', label: 'Prostate gland', system: 'reproductive', regions: ['pelvis'], scale: 'organ', hints: ['prostate gland', 'prostate'], parentId: 'system:reproductive', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:seminal-vesicles', label: 'Seminal vesicles', system: 'reproductive', regions: ['pelvis'], scale: 'organ', hints: ['seminal vesicle'], parentId: 'system:reproductive', laterality: 'paired', physiologyCapable: true, priority: 0.82 },
  { id: 'deep:ovaries', label: 'Ovaries', system: 'reproductive', regions: ['pelvis'], scale: 'organ', hints: ['ovary'], parentId: 'system:reproductive', laterality: 'paired', physiologyCapable: true, priority: 0.9 },
  { id: 'deep:uterine-tubes', label: 'Uterine tubes', system: 'reproductive', regions: ['pelvis'], scale: 'organ', hints: ['uterine tube', 'fallopian tube'], parentId: 'system:reproductive', laterality: 'paired', physiologyCapable: true, priority: 0.85 },
  { id: 'deep:uterus', label: 'Uterus', system: 'reproductive', regions: ['pelvis'], scale: 'organ', hints: ['uterus'], parentId: 'system:reproductive', physiologyCapable: true, priority: 0.92 },
  { id: 'deep:cervix-vagina', label: 'Cervix and vagina', system: 'reproductive', regions: ['pelvis'], scale: 'suborgan', hints: ['uterine cervix', 'vagina'], parentId: 'system:reproductive', physiologyCapable: true, priority: 0.85 },

  // Sensory systems.
  { id: 'deep:globe-eye', label: 'Globe of the eye', system: 'sensory', regions: ['head'], scale: 'organ', hints: ['eye globe', 'eyeball'], parentId: 'system:sensory', laterality: 'paired', physiologyCapable: true, priority: 0.97 },
  { id: 'deep:cochlear-vestibular-labyrinth', label: 'Cochlear and vestibular labyrinth', system: 'sensory', regions: ['head'], scale: 'suborgan', hints: ['cochlea', 'vestibular labyrinth', 'semicircular canal'], parentId: 'system:sensory', laterality: 'paired', physiologyCapable: true, priority: 0.91 },
  { id: 'deep:olfactory-epithelium', label: 'Olfactory epithelium reference', system: 'sensory', regions: ['head'], scale: 'tissue', hints: ['olfactory epithelium'], parentId: 'system:sensory', physiologyCapable: true, priority: 0.78 },
  { id: 'deep:taste-bud', label: 'Taste bud reference', system: 'sensory', regions: ['head'], scale: 'microstructure', hints: ['taste bud'], parentId: 'system:sensory', physiologyCapable: true, priority: 0.72 },

  // Fascial/connective planes — needed for dissection and surgical context.
  { id: 'deep:deep-cervical-fascia', label: 'Deep cervical fascial planes', system: 'fascial', regions: ['neck'], scale: 'tissue', hints: ['deep cervical fascia', 'pretracheal fascia', 'prevertebral fascia'], parentId: 'system:fascial', priority: 0.88 },
  { id: 'deep:endothoracic-fascia', label: 'Endothoracic fascia', system: 'fascial', regions: ['thorax'], scale: 'tissue', hints: ['endothoracic fascia'], parentId: 'system:fascial', priority: 0.8 },
  { id: 'deep:thoracolumbar-fascia', label: 'Thoracolumbar fascia', system: 'fascial', regions: ['back', 'abdomen'], scale: 'tissue', hints: ['thoracolumbar fascia'], parentId: 'system:fascial', priority: 0.86 },
  { id: 'deep:transversalis-fascia', label: 'Transversalis fascia', system: 'fascial', regions: ['abdomen', 'pelvis'], scale: 'tissue', hints: ['transversalis fascia'], parentId: 'system:fascial', priority: 0.83 },
  { id: 'deep:pelvic-fascia', label: 'Pelvic fascial planes', system: 'fascial', regions: ['pelvis'], scale: 'tissue', hints: ['pelvic fascia', 'endopelvic fascia'], parentId: 'system:fascial', priority: 0.86 },

  // Surface layers to bridge gross anatomy to tissue scale.
  { id: 'deep:subcutaneous-tissue', label: 'Subcutaneous tissue', system: 'surface', regions: ['whole-body'], scale: 'tissue', hints: ['subcutaneous tissue', 'superficial fascia'], parentId: 'system:surface', physiologyCapable: true, priority: 0.72 },
] as const

function definitionToNode(definition: Definition): AtlasNode {
  return {
    id: definition.id,
    label: definition.label,
    system: definition.system,
    regions: definition.regions,
    laterality: definition.laterality ?? 'not-applicable',
    scale: definition.scale,
    parentId: definition.parentId ?? `system:${definition.system}`,
    synonyms: definition.synonyms,
    source: { mode: definition.hints.length > 1 ? 'composite' : 'specific-fallback', nodeHints: definition.hints },
    provenance: DEEP_REFERENCE,
    geometryStatus: 'reference-only',
    educationalPriority: definition.priority ?? 0.8,
    physiologyCapable: definition.physiologyCapable,
    surgicalLandmark: false,
  }
}

export const WHOLE_BODY_DEEP_EXPANSION_WAVE_1: readonly AtlasNode[] = D.map(definitionToNode)

export function validateWholeBodyDeepExpansionWave1(nodes: readonly AtlasNode[] = WHOLE_BODY_DEEP_EXPANSION_WAVE_1): string[] {
  const issues: string[] = []
  const ids = new Set<string>()
  for (const node of nodes) {
    if (ids.has(node.id)) issues.push(`Duplicate deep whole-body node id: ${node.id}`)
    ids.add(node.id)
    if (node.geometryStatus !== 'reference-only') issues.push(`Deep expansion node must remain reference-only until verified geometry is attached: ${node.id}`)
    if (node.provenance.reviewStatus !== 'academic-review-required') issues.push(`Deep expansion node must remain academic-review-required: ${node.id}`)
    if (!node.source.nodeHints.length) issues.push(`Deep expansion node is missing source hints: ${node.id}`)
    if (node.surgicalLandmark) issues.push(`Reference-only deep expansion node cannot self-promote to a surgical landmark: ${node.id}`)
  }

  const representedSystems = new Set(nodes.map((node) => node.system))
  const requiredSystems: readonly AtlasSystemId[] = [
    'surface', 'skeletal', 'articular', 'muscular', 'cardiovascular', 'lymphatic', 'nervous',
    'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive', 'sensory', 'fascial',
  ]
  for (const system of requiredSystems) {
    if (!representedSystems.has(system)) issues.push(`Deep whole-body expansion is missing system coverage: ${system}`)
  }
  return issues
}
