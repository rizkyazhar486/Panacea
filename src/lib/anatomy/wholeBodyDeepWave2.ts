import type { AtlasLaterality, AtlasNode, AtlasProvenance, AtlasRegionId, AtlasScale, AtlasSystemId } from './atlasKernel'

const DEEP_WAVE_REFERENCE: AtlasProvenance = {
  sourceId: 'panacea-whole-body-deep-wave-2',
  sourceRevision: '2026-09-10-r1',
  license: 'Internal educational metadata scaffold; no third-party geometry bundled',
  sourceLocator: 'src/lib/anatomy/wholeBodyDeepWave2.ts',
  reviewStatus: 'academic-review-required',
  reviewerScope: 'Engineering topology, multiscale naming, and explicit relation wiring only. Publication as reviewed anatomy requires qualified human review and verified geometry/source mapping.',
}

type DeepDefinition = {
  id: string
  label: string
  system: AtlasSystemId
  regions: readonly AtlasRegionId[]
  scale: AtlasScale
  hints: readonly string[]
  parentId: string
  laterality?: AtlasLaterality
  synonyms?: readonly string[]
  physiologyCapable?: boolean
  surgicalLandmark?: boolean
  relations?: AtlasNode['relations']
}

const DEFINITIONS: readonly DeepDefinition[] = [
  // Integumentary / surface microanatomy
  { id: 'he2:skin-appendage-unit', label: 'Skin appendage unit', system: 'surface', regions: ['whole-body'], scale: 'microstructure', hints: ['skin appendage', 'pilosebaceous unit'], parentId: 'he:dermis', physiologyCapable: true },
  { id: 'he2:eccrine-sweat-unit', label: 'Eccrine sweat gland unit', system: 'surface', regions: ['whole-body'], scale: 'microstructure', hints: ['eccrine sweat gland', 'sweat gland'], parentId: 'he:dermis', physiologyCapable: true },
  { id: 'he2:sebaceous-unit', label: 'Sebaceous gland unit', system: 'surface', regions: ['whole-body'], scale: 'microstructure', hints: ['sebaceous gland'], parentId: 'he:hair-follicle-unit', physiologyCapable: true },
  { id: 'he2:nail-apparatus', label: 'Nail apparatus', system: 'surface', regions: ['hand', 'foot'], scale: 'suborgan', hints: ['nail matrix', 'nail bed', 'nail plate'], parentId: 'system:surface', laterality: 'paired' },

  // Skeletal / articular deep structure
  { id: 'he2:intervertebral-disc', label: 'Intervertebral disc', system: 'skeletal', regions: ['neck', 'thorax', 'back'], scale: 'suborgan', hints: ['intervertebral disc', 'annulus fibrosus', 'nucleus pulposus'], parentId: 'msk:spine', physiologyCapable: true },
  { id: 'he2:vertebral-endplate', label: 'Vertebral endplate', system: 'skeletal', regions: ['neck', 'thorax', 'back'], scale: 'tissue', hints: ['vertebral endplate'], parentId: 'he2:intervertebral-disc', physiologyCapable: true },
  { id: 'he2:articular-cartilage', label: 'Articular cartilage', system: 'articular', regions: ['whole-body'], scale: 'tissue', hints: ['articular cartilage', 'hyaline cartilage'], parentId: 'system:articular', physiologyCapable: true },
  { id: 'he2:meniscal-fibrocartilage', label: 'Meniscal fibrocartilage', system: 'articular', regions: ['lower-limb'], scale: 'tissue', hints: ['meniscus', 'meniscal fibrocartilage'], parentId: 'he:knee-complex', laterality: 'paired', physiologyCapable: true, surgicalLandmark: true },
  { id: 'he2:sacroiliac-complex', label: 'Sacroiliac joint complex', system: 'articular', regions: ['pelvis', 'back'], scale: 'suborgan', hints: ['sacroiliac joint', 'sacroiliac ligament'], parentId: 'system:articular', laterality: 'paired', surgicalLandmark: true },

  // Muscle-tendon / neuromuscular continuum
  { id: 'he2:myotendinous-junction', label: 'Myotendinous junction', system: 'muscular', regions: ['whole-body'], scale: 'microstructure', hints: ['myotendinous junction'], parentId: 'system:muscular', physiologyCapable: true },
  { id: 'he2:tendon-fascicle', label: 'Tendon fascicle', system: 'muscular', regions: ['whole-body'], scale: 'microstructure', hints: ['tendon fascicle', 'tenocyte'], parentId: 'system:muscular', physiologyCapable: true },
  { id: 'he2:motor-endplate', label: 'Motor endplate', system: 'muscular', regions: ['whole-body'], scale: 'microstructure', hints: ['motor end plate', 'neuromuscular junction'], parentId: 'system:muscular', physiologyCapable: true, relations: [{ kind: 'continuous-with', targetId: 'he2:neuromuscular-junction' }] },

  // Cardiovascular macro-to-micro corridors
  { id: 'he2:superior-vena-cava', label: 'Superior vena cava', system: 'cardiovascular', regions: ['thorax', 'neck'], scale: 'organ', hints: ['superior vena cava'], parentId: 'system:cardiovascular', physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'drains', targetId: 'cv:heart' }] },
  { id: 'he2:inferior-vena-cava', label: 'Inferior vena cava', system: 'cardiovascular', regions: ['abdomen', 'thorax'], scale: 'organ', hints: ['inferior vena cava'], parentId: 'system:cardiovascular', physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'drains', targetId: 'cv:heart' }] },
  { id: 'he2:pulmonary-veins', label: 'Pulmonary veins', system: 'cardiovascular', regions: ['thorax'], scale: 'suborgan', hints: ['pulmonary vein', 'pulmonary veins'], parentId: 'system:cardiovascular', laterality: 'paired', physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'drains', targetId: 'cv:heart' }, { kind: 'continuous-with', targetId: 'resp:lungs' }] },
  { id: 'he2:cerebral-arterial-circle', label: 'Cerebral arterial circle', system: 'cardiovascular', regions: ['head'], scale: 'suborgan', hints: ['circle of Willis', 'cerebral arterial circle'], parentId: 'he:systemic-arterial-tree', physiologyCapable: true, surgicalLandmark: true },
  { id: 'he2:arteriole-capillary-venule-unit', label: 'Arteriole-capillary-venule unit', system: 'cardiovascular', regions: ['whole-body'], scale: 'microstructure', hints: ['arteriole', 'capillary', 'venule'], parentId: 'he:systemic-capillary-bed', physiologyCapable: true },
  { id: 'he2:vascular-endothelium', label: 'Vascular endothelial interface', system: 'cardiovascular', regions: ['whole-body'], scale: 'microstructure', hints: ['vascular endothelium', 'endothelial layer'], parentId: 'he2:arteriole-capillary-venule-unit', physiologyCapable: true },

  // Lymphatic / immune structure
  { id: 'he2:cisterna-chyli', label: 'Cisterna chyli', system: 'lymphatic', regions: ['abdomen'], scale: 'suborgan', hints: ['cisterna chyli'], parentId: 'he:thoracic-duct', physiologyCapable: true, surgicalLandmark: true, relations: [{ kind: 'continuous-with', targetId: 'he:thoracic-duct' }] },
  { id: 'he2:lymph-node-cortex-medulla', label: 'Lymph node cortex-medulla unit', system: 'lymphatic', regions: ['whole-body'], scale: 'tissue', hints: ['lymph node cortex', 'lymph node medulla'], parentId: 'system:lymphatic', physiologyCapable: true },
  { id: 'he2:splenic-white-red-pulp', label: 'Splenic white/red pulp unit', system: 'lymphatic', regions: ['abdomen'], scale: 'tissue', hints: ['white pulp', 'red pulp', 'spleen'], parentId: 'system:lymphatic', physiologyCapable: true },

  // Nervous system: central-peripheral interface
  { id: 'he2:cranial-nerve-set', label: 'Cranial nerve set', system: 'nervous', regions: ['head', 'neck'], scale: 'suborgan', hints: ['cranial nerve', 'cranial nerves'], parentId: 'neuro:brainstem', laterality: 'paired', physiologyCapable: true, surgicalLandmark: true },
  { id: 'he2:dorsal-root-ganglion', label: 'Dorsal root ganglion', system: 'nervous', regions: ['neck', 'thorax', 'back'], scale: 'microstructure', hints: ['dorsal root ganglion', 'spinal ganglion'], parentId: 'neuro:spinal-cord', laterality: 'paired', physiologyCapable: true },
  { id: 'he2:neuromuscular-junction', label: 'Neuromuscular junction', system: 'nervous', regions: ['whole-body'], scale: 'microstructure', hints: ['neuromuscular junction', 'motor end plate'], parentId: 'system:nervous', physiologyCapable: true, relations: [{ kind: 'innervates', targetId: 'system:muscular' }] },
  { id: 'he2:autonomic-ganglion', label: 'Autonomic ganglion', system: 'nervous', regions: ['neck', 'thorax', 'abdomen', 'pelvis'], scale: 'microstructure', hints: ['autonomic ganglion', 'sympathetic ganglion', 'parasympathetic ganglion'], parentId: 'system:nervous', physiologyCapable: true },
  { id: 'he2:peripheral-nerve-end-organ', label: 'Peripheral sensory end-organ', system: 'nervous', regions: ['whole-body'], scale: 'microstructure', hints: ['mechanoreceptor', 'sensory nerve ending'], parentId: 'he:peripheral-nerve-fascicle', physiologyCapable: true },

  // Respiratory deep wave: conducting-to-respiratory zone
  { id: 'he2:terminal-bronchiole', label: 'Terminal bronchiole', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['terminal bronchiole'], parentId: 'he:tracheobronchial-tree', physiologyCapable: true, relations: [{ kind: 'continuous-with', targetId: 'he2:respiratory-bronchiole' }] },
  { id: 'he2:respiratory-bronchiole', label: 'Respiratory bronchiole', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['respiratory bronchiole'], parentId: 'he:pulmonary-acinus', physiologyCapable: true, relations: [{ kind: 'continuous-with', targetId: 'he2:alveolar-duct' }] },
  { id: 'he2:alveolar-duct', label: 'Alveolar duct', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['alveolar duct'], parentId: 'he:pulmonary-acinus', physiologyCapable: true, relations: [{ kind: 'continuous-with', targetId: 'he2:alveolar-sac' }] },
  { id: 'he2:alveolar-sac', label: 'Alveolar sac', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['alveolar sac', 'alveolus'], parentId: 'he:pulmonary-acinus', physiologyCapable: true, relations: [{ kind: 'continuous-with', targetId: 'resp:alveolar-capillary-unit' }] },
  { id: 'he2:alveolar-epithelial-unit', label: 'Alveolar epithelial unit', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['type I pneumocyte', 'type II pneumocyte', 'alveolar epithelium'], parentId: 'resp:alveolar-capillary-unit', physiologyCapable: true },
  { id: 'he2:pulmonary-capillary-sheet', label: 'Pulmonary capillary sheet', system: 'respiratory', regions: ['thorax'], scale: 'microstructure', hints: ['pulmonary capillary', 'alveolar capillary'], parentId: 'resp:alveolar-capillary-unit', physiologyCapable: true, relations: [{ kind: 'continuous-with', targetId: 'he2:pulmonary-veins' }] },

  // Digestive wall and portal microarchitecture
  { id: 'he2:enteric-plexus', label: 'Enteric plexus network', system: 'digestive', regions: ['thorax', 'abdomen', 'pelvis'], scale: 'microstructure', hints: ['myenteric plexus', 'submucosal plexus'], parentId: 'system:digestive', physiologyCapable: true, relations: [{ kind: 'innervates', targetId: 'gi:small-intestine' }, { kind: 'innervates', targetId: 'gi:large-intestine' }] },
  { id: 'he2:intestinal-crypt-villus-axis', label: 'Intestinal crypt-villus axis', system: 'digestive', regions: ['abdomen'], scale: 'microstructure', hints: ['intestinal crypt', 'crypt of Lieberkuhn', 'intestinal villus'], parentId: 'he:intestinal-villus', physiologyCapable: true },
  { id: 'he2:hepatic-portal-triad', label: 'Hepatic portal triad', system: 'digestive', regions: ['abdomen'], scale: 'microstructure', hints: ['portal triad', 'hepatic arteriole', 'portal venule', 'bile ductule'], parentId: 'he:hepatic-lobule', physiologyCapable: true, surgicalLandmark: true },
  { id: 'he2:hepatic-sinusoid', label: 'Hepatic sinusoid', system: 'digestive', regions: ['abdomen'], scale: 'microstructure', hints: ['hepatic sinusoid'], parentId: 'he:hepatic-lobule', physiologyCapable: true, relations: [{ kind: 'drains', targetId: 'he:portal-venous-system' }] },
  { id: 'he2:pancreatic-acinus', label: 'Pancreatic acinar unit', system: 'digestive', regions: ['abdomen'], scale: 'microstructure', hints: ['pancreatic acinus', 'acinar cell'], parentId: 'gi:pancreas', physiologyCapable: true },

  // Urinary nephron deep wave
  { id: 'he2:juxtaglomerular-apparatus', label: 'Juxtaglomerular apparatus', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['juxtaglomerular apparatus', 'macula densa'], parentId: 'he:glomerulus', laterality: 'paired', physiologyCapable: true },
  { id: 'he2:glomerular-filtration-barrier', label: 'Glomerular filtration barrier', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['glomerular filtration barrier', 'podocyte', 'glomerular basement membrane'], parentId: 'he:glomerulus', laterality: 'paired', physiologyCapable: true },
  { id: 'he2:loop-of-henle', label: 'Loop of Henle', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['loop of Henle', 'nephron loop'], parentId: 'he:nephron', laterality: 'paired', physiologyCapable: true },
  { id: 'he2:collecting-duct-system', label: 'Collecting duct system', system: 'urinary', regions: ['abdomen', 'back'], scale: 'microstructure', hints: ['collecting duct', 'papillary duct'], parentId: 'he:nephron', laterality: 'paired', physiologyCapable: true },

  // Endocrine microarchitecture
  { id: 'he2:anterior-pituitary-unit', label: 'Anterior pituitary endocrine unit', system: 'endocrine', regions: ['head'], scale: 'microstructure', hints: ['adenohypophysis', 'anterior pituitary'], parentId: 'endo:pituitary', physiologyCapable: true },
  { id: 'he2:posterior-pituitary-unit', label: 'Posterior pituitary neurosecretory unit', system: 'endocrine', regions: ['head'], scale: 'microstructure', hints: ['neurohypophysis', 'posterior pituitary'], parentId: 'endo:pituitary', physiologyCapable: true },
  { id: 'he2:adrenal-medulla', label: 'Adrenal medulla', system: 'endocrine', regions: ['abdomen'], scale: 'tissue', hints: ['adrenal medulla'], parentId: 'endo:adrenals', laterality: 'paired', physiologyCapable: true },
  { id: 'he2:thyroid-follicular-parafollicular-unit', label: 'Thyroid follicular/parafollicular unit', system: 'endocrine', regions: ['neck'], scale: 'microstructure', hints: ['thyroid follicular cell', 'parafollicular cell', 'C cell'], parentId: 'he:thyroid-follicle', physiologyCapable: true },

  // Reproductive deep wave
  { id: 'he2:endometrial-functional-layer', label: 'Endometrial functional layer', system: 'reproductive', regions: ['pelvis'], scale: 'tissue', hints: ['stratum functionalis', 'endometrium functional layer'], parentId: 'he:uterine-wall', physiologyCapable: true },
  { id: 'he2:endometrial-basal-layer', label: 'Endometrial basal layer', system: 'reproductive', regions: ['pelvis'], scale: 'tissue', hints: ['stratum basalis', 'endometrium basal layer'], parentId: 'he:uterine-wall', physiologyCapable: true },
  { id: 'he2:testicular-interstitial-unit', label: 'Testicular interstitial unit', system: 'reproductive', regions: ['pelvis'], scale: 'microstructure', hints: ['Leydig cell', 'testicular interstitium'], parentId: 'system:reproductive', laterality: 'paired', physiologyCapable: true },
  { id: 'he2:seminiferous-epithelium', label: 'Seminiferous epithelium', system: 'reproductive', regions: ['pelvis'], scale: 'microstructure', hints: ['seminiferous epithelium', 'Sertoli cell'], parentId: 'he:seminiferous-tubule', laterality: 'paired', physiologyCapable: true },

  // Special senses beyond macroscopic organ identity
  { id: 'he2:corneal-layer-stack', label: 'Corneal layer stack', system: 'sensory', regions: ['head'], scale: 'tissue', hints: ['corneal epithelium', 'Bowman layer', 'corneal stroma', 'Descemet membrane', 'corneal endothelium'], parentId: 'he:ocular-globe', laterality: 'paired', surgicalLandmark: true },
  { id: 'he2:optic-nerve-head', label: 'Optic nerve head', system: 'sensory', regions: ['head'], scale: 'suborgan', hints: ['optic disc', 'optic nerve head'], parentId: 'he:retina', laterality: 'paired', physiologyCapable: true, surgicalLandmark: true },
  { id: 'he2:organ-of-corti', label: 'Organ of Corti', system: 'sensory', regions: ['head'], scale: 'microstructure', hints: ['organ of Corti', 'cochlear hair cell'], parentId: 'he:cochlea', laterality: 'paired', physiologyCapable: true },
  { id: 'he2:vestibular-hair-cell-unit', label: 'Vestibular hair-cell unit', system: 'sensory', regions: ['head'], scale: 'microstructure', hints: ['vestibular hair cell', 'crista ampullaris', 'macula utriculi'], parentId: 'he:vestibular-apparatus', laterality: 'paired', physiologyCapable: true },

  // Fascia / connective corridors
  { id: 'he2:tendon-sheath', label: 'Tendon sheath', system: 'fascial', regions: ['hand', 'foot'], scale: 'tissue', hints: ['tendon sheath', 'synovial tendon sheath'], parentId: 'system:fascial', laterality: 'paired' },
  { id: 'he2:flexor-retinaculum', label: 'Flexor retinaculum', system: 'fascial', regions: ['hand', 'foot'], scale: 'suborgan', hints: ['flexor retinaculum'], parentId: 'he:deep-fascia', laterality: 'paired', surgicalLandmark: true },
  { id: 'he2:neurovascular-sheath', label: 'Neurovascular sheath', system: 'fascial', regions: ['whole-body'], scale: 'tissue', hints: ['neurovascular sheath', 'vascular sheath'], parentId: 'he:deep-fascia', surgicalLandmark: true },
]

function makeNode(definition: DeepDefinition): AtlasNode {
  return {
    id: definition.id,
    label: definition.label,
    system: definition.system,
    regions: definition.regions,
    laterality: definition.laterality ?? 'not-applicable',
    scale: definition.scale,
    parentId: definition.parentId,
    synonyms: definition.synonyms,
    source: { mode: 'specific-fallback', nodeHints: definition.hints },
    provenance: DEEP_WAVE_REFERENCE,
    geometryStatus: 'reference-only',
    educationalPriority: definition.surgicalLandmark ? 0.94 : definition.physiologyCapable ? 0.9 : 0.84,
    physiologyCapable: definition.physiologyCapable,
    surgicalLandmark: definition.surgicalLandmark ?? false,
    relations: definition.relations,
  }
}

export const WHOLE_BODY_DEEP_WAVE_2_NODES: readonly AtlasNode[] = DEFINITIONS.map(makeNode)

export const WHOLE_BODY_DEEP_WAVE_2_SYSTEMS: readonly AtlasSystemId[] = [...new Set(WHOLE_BODY_DEEP_WAVE_2_NODES.map((node) => node.system))].sort()
export const WHOLE_BODY_DEEP_WAVE_2_REGIONS: readonly AtlasRegionId[] = [...new Set(WHOLE_BODY_DEEP_WAVE_2_NODES.flatMap((node) => node.regions))].sort()
export const WHOLE_BODY_DEEP_WAVE_2_SCALES: readonly AtlasScale[] = [...new Set(WHOLE_BODY_DEEP_WAVE_2_NODES.map((node) => node.scale))].sort()
