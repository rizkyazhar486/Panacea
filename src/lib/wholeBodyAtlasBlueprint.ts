export type AtlasLayerKey = 'surface' | 'skeletal' | 'muscular' | 'cardiovascular' | 'nervous' | 'visceral' | 'lymphoid'

export type GeometryProvenance = 'native-geometry' | 'adjacent-geometry' | 'not-represented'

export type AtlasRegionKey =
  | 'head-neck'
  | 'thorax'
  | 'abdomen'
  | 'pelvis-perineum'
  | 'upper-limb'
  | 'lower-limb'
  | 'spine-back'

export interface AtlasStructureTarget {
  id: string
  label: string
  layer: AtlasLayerKey
  nodeHints: string[]
  level: 'region' | 'organ' | 'tissue' | 'structure' | 'microstructure'
  provenance: GeometryProvenance
  clinicalWhy: string
}

export interface AtlasRegion {
  key: AtlasRegionKey
  label: string
  landmark: string
  structures: AtlasStructureTarget[]
}

export interface SpecialtyAtlasModule {
  id: string
  specialty: 'orthopedic' | 'plastic' | 'general-surgery' | 'neurosurgery' | 'cardiothoracic' | 'ENT' | 'ophthalmology' | 'urology' | 'obgyn'
  label: string
  region: AtlasRegionKey
  learningGoal: string
  layers: Array<{
    order: number
    label: string
    layer: AtlasLayerKey
    structuresAtRisk: string[]
  }>
  meshExpectation: string
}

export interface MovementPrimitive {
  id: string
  label: string
  chain: string[]
  planes: Array<'sagittal' | 'frontal' | 'transverse' | 'scapular' | 'multiplanar'>
  keyJoints: string[]
  keyMuscles: string[]
  teachingPoint: string
}

export const WHOLE_BODY_REGIONS: AtlasRegion[] = [
  {
    key: 'head-neck',
    label: 'Head & neck',
    landmark: 'Skull base → hyoid → thoracic inlet',
    structures: [
      { id: 'cranial-skeleton', label: 'Cranial skeleton', layer: 'skeletal', nodeHints: ['skull', 'mandible', 'maxilla', 'zygomatic', 'temporal bone'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Surface landmarks, fracture patterns, orbital and facial surgical orientation.' },
      { id: 'facial-muscles', label: 'Muscles of facial expression', layer: 'muscular', nodeHints: ['orbicularis', 'zygomaticus', 'buccinator', 'frontalis'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Facial nerve function, flap planning and facial trauma.' },
      { id: 'carotid-jugular', label: 'Carotid–jugular axis', layer: 'cardiovascular', nodeHints: ['carotid', 'jugular'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Neck dissection, line placement and vascular injury risk.' },
      { id: 'cranial-nerves', label: 'Major cranial nerve pathways', layer: 'nervous', nodeHints: ['trigeminal', 'facial nerve', 'vagus', 'optic'], level: 'structure', provenance: 'adjacent-geometry', clinicalWhy: 'Neurologic localization and surgical danger zones.' },
    ],
  },
  {
    key: 'thorax',
    label: 'Thorax',
    landmark: 'Thoracic inlet → costal margin → diaphragm',
    structures: [
      { id: 'thoracic-cage', label: 'Ribs, sternum & thoracic vertebrae', layer: 'skeletal', nodeHints: ['rib', 'sternum', 'thoracic vertebra'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Trauma, chest access and respiratory mechanics.' },
      { id: 'heart-great-vessels', label: 'Heart & great vessels', layer: 'cardiovascular', nodeHints: ['heart', 'aorta', 'pulmonary trunk', 'vena cava'], level: 'organ', provenance: 'native-geometry', clinicalWhy: 'Cardiothoracic orientation, shock and circulation.' },
      { id: 'lungs-airway', label: 'Lungs & central airway', layer: 'visceral', nodeHints: ['lung', 'trachea', 'bronch'], level: 'organ', provenance: 'native-geometry', clinicalWhy: 'Ventilation, thoracic surgery and chest tube education.' },
      { id: 'intercostal-bundle', label: 'Intercostal neurovascular bundle', layer: 'nervous', nodeHints: ['intercostal nerve', 'intercostal artery', 'intercostal vein'], level: 'structure', provenance: 'adjacent-geometry', clinicalWhy: 'Explains why pleural access hugs the superior rib border.' },
    ],
  },
  {
    key: 'abdomen',
    label: 'Abdomen',
    landmark: 'Costal margin → inguinal ligament',
    structures: [
      { id: 'abdominal-wall', label: 'Anterior abdominal wall', layer: 'muscular', nodeHints: ['rectus abdominis', 'external oblique', 'internal oblique', 'transversus'], level: 'tissue', provenance: 'native-geometry', clinicalWhy: 'Laparotomy, hernia and core biomechanics.' },
      { id: 'hepatobiliary', label: 'Liver, gallbladder & biliary region', layer: 'visceral', nodeHints: ['liver', 'gallbladder', 'bile duct'], level: 'organ', provenance: 'native-geometry', clinicalWhy: 'Cholecystectomy and hepatobiliary orientation.' },
      { id: 'stomach-bowel', label: 'Stomach & bowel', layer: 'visceral', nodeHints: ['stomach', 'duodenum', 'jejunum', 'ileum', 'colon'], level: 'organ', provenance: 'native-geometry', clinicalWhy: 'Acute abdomen, anastomosis concepts and visceral relationships.' },
      { id: 'aorta-branches', label: 'Abdominal aorta & major branches', layer: 'cardiovascular', nodeHints: ['abdominal aorta', 'celiac', 'mesenteric', 'renal artery'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Hemorrhage, aneurysm and organ perfusion.' },
    ],
  },
  {
    key: 'pelvis-perineum',
    label: 'Pelvis & perineum',
    landmark: 'Pelvic brim → pelvic floor → perineum',
    structures: [
      { id: 'pelvic-ring', label: 'Pelvic ring', layer: 'skeletal', nodeHints: ['ilium', 'ischium', 'pubis', 'sacrum'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Pelvic trauma and load transfer.' },
      { id: 'pelvic-floor', label: 'Pelvic floor', layer: 'muscular', nodeHints: ['levator ani', 'coccygeus'], level: 'structure', provenance: 'adjacent-geometry', clinicalWhy: 'Continence, prolapse and pelvic biomechanics.' },
      { id: 'pelvic-viscera', label: 'Pelvic viscera', layer: 'visceral', nodeHints: ['bladder', 'rectum', 'uterus', 'prostate'], level: 'organ', provenance: 'adjacent-geometry', clinicalWhy: 'Urology, colorectal and reproductive anatomy.' },
    ],
  },
  {
    key: 'upper-limb',
    label: 'Upper limb',
    landmark: 'Scapular girdle → hand',
    structures: [
      { id: 'shoulder-complex', label: 'Shoulder complex', layer: 'skeletal', nodeHints: ['scapula', 'clavicle', 'humerus'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Large ROM with stability trade-offs; crucial for orthopedic and sports teaching.' },
      { id: 'rotator-cuff', label: 'Rotator cuff', layer: 'muscular', nodeHints: ['supraspinatus', 'infraspinatus', 'teres minor', 'subscapularis'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Dynamic humeral-head centering and common injury patterns.' },
      { id: 'brachial-plexus', label: 'Brachial plexus pathways', layer: 'nervous', nodeHints: ['median nerve', 'ulnar nerve', 'radial nerve', 'musculocutaneous'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Trauma, entrapment and surgical danger zones.' },
      { id: 'hand-tendons', label: 'Hand & tendon system', layer: 'muscular', nodeHints: ['flexor digitorum', 'extensor digitorum', 'thenar', 'hypothenar'], level: 'microstructure', provenance: 'adjacent-geometry', clinicalWhy: 'Plastic/hand surgery and functional anatomy.' },
    ],
  },
  {
    key: 'lower-limb',
    label: 'Lower limb',
    landmark: 'Pelvis → foot',
    structures: [
      { id: 'hip-complex', label: 'Hip complex', layer: 'skeletal', nodeHints: ['acetabulum', 'femur', 'pelvis'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Load transfer, gait and arthroplasty orientation.' },
      { id: 'knee-complex', label: 'Knee complex', layer: 'skeletal', nodeHints: ['femur', 'tibia', 'patella'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Sports injury, arthroplasty and extensor mechanics.' },
      { id: 'lower-limb-muscles', label: 'Major lower-limb muscle compartments', layer: 'muscular', nodeHints: ['quadriceps', 'hamstring', 'glute', 'gastrocnemius', 'soleus'], level: 'tissue', provenance: 'native-geometry', clinicalWhy: 'Gait, strength and kinetic-chain teaching.' },
      { id: 'sciatic-tibial-fibular', label: 'Sciatic → tibial/common fibular pathways', layer: 'nervous', nodeHints: ['sciatic', 'tibial nerve', 'common fibular'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Neurologic localization and operative risk.' },
    ],
  },
  {
    key: 'spine-back',
    label: 'Spine & back',
    landmark: 'Occiput → sacrum',
    structures: [
      { id: 'vertebral-column', label: 'Vertebral column', layer: 'skeletal', nodeHints: ['cervical vertebra', 'thoracic vertebra', 'lumbar vertebra', 'sacrum'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Axial load, neurologic level and surgical orientation.' },
      { id: 'paraspinals', label: 'Paraspinal musculature', layer: 'muscular', nodeHints: ['erector spinae', 'multifidus'], level: 'structure', provenance: 'adjacent-geometry', clinicalWhy: 'Segmental control and spine biomechanics.' },
      { id: 'spinal-cord-roots', label: 'Spinal cord & roots', layer: 'nervous', nodeHints: ['spinal cord', 'spinal nerve'], level: 'structure', provenance: 'native-geometry', clinicalWhy: 'Myelopathy, radiculopathy and spine surgery.' },
    ],
  },
]

export const SPECIALTY_ATLAS_MODULES: SpecialtyAtlasModule[] = [
  {
    id: 'ortho-knee-medial-parapatellar', specialty: 'orthopedic', label: 'Knee · medial parapatellar approach', region: 'lower-limb',
    learningGoal: 'Follow the operative corridor from skin to joint while preserving extensor mechanism orientation.',
    layers: [
      { order: 1, label: 'Skin and subcutaneous tissue', layer: 'surface', structuresAtRisk: ['superficial sensory branches'] },
      { order: 2, label: 'Deep fascia / retinacular plane', layer: 'muscular', structuresAtRisk: ['medial retinacular structures'] },
      { order: 3, label: 'Quadriceps tendon and medial patellar border', layer: 'muscular', structuresAtRisk: ['quadriceps tendon', 'patellar blood supply'] },
      { order: 4, label: 'Capsule and knee joint', layer: 'skeletal', structuresAtRisk: ['articular cartilage', 'menisci', 'ligamentous structures'] },
    ],
    meshExpectation: 'Native bones and major muscles are expected; retinaculum/capsule may require teaching overlays rather than fabricated mesh.',
  },
  {
    id: 'plastic-face-smas', specialty: 'plastic', label: 'Face · skin–SMAS–deep plane concept', region: 'head-neck',
    learningGoal: 'Teach layered facial anatomy and why nerve risk changes with plane.',
    layers: [
      { order: 1, label: 'Skin', layer: 'surface', structuresAtRisk: ['cutaneous perfusion'] },
      { order: 2, label: 'Subcutaneous fat', layer: 'surface', structuresAtRisk: ['superficial vessels'] },
      { order: 3, label: 'SMAS / mimetic muscle plane', layer: 'muscular', structuresAtRisk: ['facial nerve branches near deeper planes'] },
      { order: 4, label: 'Deep fascia / parotid-masseteric region', layer: 'nervous', structuresAtRisk: ['facial nerve branches', 'parotid duct'] },
    ],
    meshExpectation: 'Major facial muscles are native; SMAS and tiny facial nerve branches must be clearly labeled as educational overlays if absent.',
  },
  {
    id: 'general-abdominal-entry', specialty: 'general-surgery', label: 'Anterior abdomen · layered entry', region: 'abdomen',
    learningGoal: 'Make the abdominal wall a true layer stack instead of “skin then muscle”.',
    layers: [
      { order: 1, label: 'Skin', layer: 'surface', structuresAtRisk: ['skin perfusion'] },
      { order: 2, label: 'Camper and Scarpa fascia', layer: 'surface', structuresAtRisk: ['superficial epigastric vessels'] },
      { order: 3, label: 'External oblique', layer: 'muscular', structuresAtRisk: ['iliohypogastric/ilioinguinal pathways laterally'] },
      { order: 4, label: 'Internal oblique', layer: 'muscular', structuresAtRisk: ['segmental nerves'] },
      { order: 5, label: 'Transversus abdominis', layer: 'muscular', structuresAtRisk: ['deep inferior epigastric vessels depending on corridor'] },
      { order: 6, label: 'Transversalis fascia / preperitoneal tissue', layer: 'surface', structuresAtRisk: ['inferior epigastric vessels'] },
      { order: 7, label: 'Parietal peritoneum', layer: 'visceral', structuresAtRisk: ['underlying bowel'] },
    ],
    meshExpectation: 'Major muscles and viscera are native; fascial planes are teaching overlays unless separately represented.',
  },
]

export const MOVEMENT_PRIMITIVES: MovementPrimitive[] = [
  { id: 'gait', label: 'Walking gait', chain: ['foot contact', 'ankle rocker', 'knee loading', 'hip progression', 'pelvis', 'trunk counter-rotation'], planes: ['sagittal', 'frontal', 'transverse'], keyJoints: ['ankle', 'knee', 'hip', 'lumbopelvic complex'], keyMuscles: ['soleus', 'gastrocnemius', 'quadriceps', 'hamstrings', 'gluteus medius', 'gluteus maximus'], teachingPoint: 'Human gait is multiplanar; frontal pelvic control and transverse rotation matter as much as sagittal flexion/extension.' },
  { id: 'running', label: 'Running', chain: ['foot strike', 'ankle spring', 'knee shock absorption', 'hip extension', 'pelvis', 'trunk/arm counter-rotation'], planes: ['sagittal', 'frontal', 'transverse'], keyJoints: ['ankle', 'knee', 'hip'], keyMuscles: ['soleus', 'gastrocnemius', 'quadriceps', 'hamstrings', 'gluteus maximus', 'gluteus medius'], teachingPoint: 'Ground-reaction force is redirected through a linked chain; stiffness and timing determine absorption, storage and return.' },
  { id: 'squat', label: 'Squat', chain: ['foot tripod', 'ankle dorsiflexion', 'knee flexion', 'hip flexion', 'pelvis', 'trunk'], planes: ['sagittal', 'frontal'], keyJoints: ['ankle', 'knee', 'hip'], keyMuscles: ['quadriceps', 'gluteus maximus', 'adductors', 'soleus', 'trunk stabilizers'], teachingPoint: 'Joint moment depends on the external force line and its perpendicular distance from each joint center.' },
  { id: 'jump', label: 'Jump', chain: ['hip extension', 'knee extension', 'ankle plantarflexion', 'take-off'], planes: ['sagittal'], keyJoints: ['hip', 'knee', 'ankle'], keyMuscles: ['gluteus maximus', 'quadriceps', 'gastrocnemius', 'soleus'], teachingPoint: 'Proximal-to-distal sequencing can raise endpoint velocity and power during triple extension.' },
  { id: 'throw', label: 'Throw', chain: ['ground', 'legs', 'pelvis', 'trunk', 'scapula', 'shoulder', 'elbow', 'wrist', 'hand'], planes: ['transverse', 'scapular', 'multiplanar'], keyJoints: ['hip', 'spine', 'shoulder', 'elbow', 'wrist'], keyMuscles: ['gluteals', 'obliques', 'serratus anterior', 'trapezius', 'rotator cuff', 'pectoralis major', 'triceps'], teachingPoint: 'Efficient throwing transfers angular momentum across segments instead of forcing the shoulder to create all endpoint velocity.' },
]

export const ATLAS_REFERENCE_MODEL = {
  visualTarget: 'Exploded whole-body anatomy with translucent layers, labeled structures, orbit controls and region focus.',
  interactionTarget: 'Dental-atlas-like inspectability scaled to the whole body: choose region → structure → layer → clinical/surgical/biomechanical context.',
  truthRule: 'Never invent missing geometry. Every specialty label must expose whether it is native geometry, adjacent geometry or not directly represented.',
  scaleRule: 'Macro anatomy uses source mesh scale. Microstructure/cell overlays must explicitly declare teaching scale rather than implying literal whole-body scale.',
} as const
