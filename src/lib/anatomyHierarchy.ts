import type { AnatomyLayer } from '../components/Body3D'

// Hierarki anatomi baku: jaringan -> organ -> sistem organ -> region tubuh.
// Tiap entri punya searchTerms nyata dipakai untuk query ke Human Disease
// Ontology / Human Phenotype Ontology (lihat api.anatomyOntology di
// BodyExplorer.tsx) -- ini yang menautkan setiap level anatomi ke penyakit
// nyata, bukan daftar statis.
export interface AnatomyEntry {
  key: string
  label: string
  description: string
  searchTerms: string[]
  /** Kalau level ini punya lapisan 3D yang cocok, tombol "View in 3D" muncul. */
  layer3d?: AnatomyLayer['key']
}

export const TISSUE_TYPES: AnatomyEntry[] = [
  {
    key: 'epithelial',
    label: 'Epithelial tissue',
    description: 'Covers body surfaces and lines organs/cavities — skin, the lining of the gut, glands. Cells sit tightly packed with almost no space between them, forming a barrier.',
    searchTerms: ['epithelial tissue disease', 'skin disease'],
  },
  {
    key: 'connective',
    label: 'Connective tissue',
    description: 'Supports and connects other tissues — bone, blood, fat, tendons, ligaments, cartilage. The most varied tissue type, from solid bone to liquid blood.',
    searchTerms: ['connective tissue disease'],
  },
  {
    key: 'muscle',
    label: 'Muscle tissue',
    description: 'Generates force through contraction — skeletal (voluntary movement), smooth (organ walls, blood vessels), and cardiac (the heart) muscle.',
    searchTerms: ['muscle tissue disease', 'myopathy'],
    layer3d: 'muscular',
  },
  {
    key: 'nervous',
    label: 'Nervous tissue',
    description: 'Transmits electrical signals — the brain, spinal cord, and peripheral nerves. Built from neurons and supporting glial cells.',
    searchTerms: ['nervous system disease'],
    layer3d: 'nervous',
  },
]

export const ORGAN_SYSTEMS: AnatomyEntry[] = [
  {
    key: 'integumentary',
    label: 'Integumentary system',
    description: 'Skin, hair, and nails — the body\'s outer barrier against injury, infection, and fluid loss, and a major organ for temperature regulation.',
    searchTerms: ['skin disease', 'integumentary system disease'],
  },
  {
    key: 'skeletal',
    label: 'Skeletal system',
    description: '206 bones in an adult, plus cartilage and ligaments — structural support, movement (with muscles), mineral storage, and blood cell production in bone marrow.',
    searchTerms: ['skeletal system disease', 'bone disease'],
    layer3d: 'skeletal',
  },
  {
    key: 'muscular',
    label: 'Muscular system',
    description: 'Over 600 skeletal muscles that move the skeleton, plus the smooth and cardiac muscle in organs and the heart.',
    searchTerms: ['muscular system disease', 'myopathy'],
    layer3d: 'muscular',
  },
  {
    key: 'nervous-system',
    label: 'Nervous system',
    description: 'Brain, spinal cord, and peripheral nerves — the body\'s control and communication network, from reflexes to conscious thought.',
    searchTerms: ['nervous system disease'],
    layer3d: 'nervous',
  },
  {
    key: 'endocrine',
    label: 'Endocrine system',
    description: 'Hormone-producing glands (thyroid, adrenal, pancreas, pituitary, and more) that regulate metabolism, growth, and stress response via the bloodstream.',
    searchTerms: ['endocrine system disease'],
  },
  {
    key: 'cardiovascular',
    label: 'Cardiovascular system',
    description: 'The heart and blood vessels — arteries, veins, and capillaries — that circulate blood, oxygen, and nutrients throughout the body.',
    searchTerms: ['cardiovascular system disease', 'heart disease'],
    layer3d: 'cardiovascular',
  },
  {
    key: 'lymphatic',
    label: 'Lymphatic / immune system',
    description: 'Lymph nodes, spleen, thymus, and lymphatic vessels — drains excess fluid from tissues and forms the backbone of immune defense.',
    searchTerms: ['lymphatic system disease', 'immune system disease'],
  },
  {
    key: 'respiratory',
    label: 'Respiratory system',
    description: 'Lungs, airways, and diaphragm — brings in oxygen and removes carbon dioxide through breathing.',
    searchTerms: ['respiratory system disease'],
    layer3d: 'visceral',
  },
  {
    key: 'digestive',
    label: 'Digestive system',
    description: 'Mouth to intestines, plus the liver, gallbladder, and pancreas — breaks down food, absorbs nutrients, and eliminates waste.',
    searchTerms: ['digestive system disease', 'gastrointestinal disease'],
    layer3d: 'visceral',
  },
  {
    key: 'urinary',
    label: 'Urinary system',
    description: 'Kidneys, ureters, bladder, and urethra — filters blood, balances fluid and electrolytes, and removes waste as urine.',
    searchTerms: ['urinary system disease', 'kidney disease'],
    layer3d: 'visceral',
  },
  {
    key: 'reproductive',
    label: 'Reproductive system',
    description: 'The organs responsible for reproduction — different in structure between sexes, shared in overall hormonal regulation with the endocrine system.',
    searchTerms: ['reproductive system disease'],
    layer3d: 'visceral',
  },
]

export const BODY_REGIONS: AnatomyEntry[] = [
  { key: 'caput', label: 'Head (Caput)', description: 'Skull, brain, face, and special sense organs (eyes, ears, nose).', searchTerms: ['head disease', 'headache'] },
  { key: 'collum', label: 'Neck (Collum/Cervix)', description: 'Cervical spine, throat, thyroid, and major vessels/nerves passing to the head.', searchTerms: ['neck disease', 'thyroid disease'] },
  { key: 'thorax', label: 'Thorax (chest)', description: 'Rib cage, lungs, heart, and great vessels.', searchTerms: ['thoracic disease', 'chest pain'] },
  { key: 'abdomen', label: 'Abdomen', description: 'Stomach, intestines, liver, pancreas, spleen, and kidneys.', searchTerms: ['abdominal disease', 'abdominal pain'] },
  { key: 'pelvis', label: 'Pelvis & perineum', description: 'Pelvic bones, bladder, reproductive organs, and rectum.', searchTerms: ['pelvic disease', 'pelvic pain'] },
  { key: 'upper-limb', label: 'Upper limb', description: 'Shoulder, arm, elbow, forearm, wrist, and hand.', searchTerms: ['upper limb disease', 'arm pain'] },
  { key: 'lower-limb', label: 'Lower limb', description: 'Hip, thigh, knee, leg, ankle, and foot.', searchTerms: ['lower limb disease', 'leg pain'] },
  { key: 'dorsum', label: 'Back (Dorsum)', description: 'Vertebral column, spinal cord, and the muscles supporting posture.', searchTerms: ['back pain', 'spinal disease'] },
]
