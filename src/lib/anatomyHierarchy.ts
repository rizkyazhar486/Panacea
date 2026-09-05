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
  /** Jenis gambar yang paling masuk akal dimuat lebih dulu untuk entri ini.
   *  Jaringan defaultnya histologi (mikrograf), bukan diagram anatomi. */
  imageKind?: 'anatomy' | 'histology'
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

// Jaringan tingkat MIKROSKOPIK — ini sisi "jaringan" dari materi anatomi yang
// tidak bisa diwakili model 3D: tidak ada bentuk 3D dari "epitel skuamosa
// simpleks". Yang dipakai untuk mempelajarinya adalah mikrograf sediaan
// berpewarnaan, jadi tiap entri di sini mengambil gambar lewat mode histologi
// (lihat histologyImageLookup di server), bukan diagram anatomi.
//
// Daftarnya mengikuti pembagian histologi baku: empat jaringan dasar, masing-
// masing dengan subtipe yang benar-benar dibedakan di bawah mikroskop.
export const TISSUE_SUBTYPES: AnatomyEntry[] = [
  // — Epitel: diklasifikasikan oleh jumlah lapisan × bentuk selnya.
  { key: 'simple-squamous', label: 'Simple squamous epithelium', description: 'One layer of flat cells — thin enough for diffusion. Lines the alveoli and the inside of blood vessels (endothelium).', searchTerms: ['simple squamous epithelium'], imageKind: 'histology' },
  { key: 'simple-cuboidal', label: 'Simple cuboidal epithelium', description: 'One layer of cube-shaped cells, built for secretion and absorption. Lines kidney tubules and many glands.', searchTerms: ['simple cuboidal epithelium'], imageKind: 'histology' },
  { key: 'simple-columnar', label: 'Simple columnar epithelium', description: 'One layer of tall cells lining the stomach and intestine, often with microvilli for absorption.', searchTerms: ['simple columnar epithelium'], imageKind: 'histology' },
  { key: 'pseudostratified', label: 'Pseudostratified columnar epithelium', description: 'Looks layered but every cell touches the base. Ciliated, it lines the airways and sweeps mucus upward.', searchTerms: ['pseudostratified columnar epithelium'], imageKind: 'histology' },
  { key: 'stratified-squamous', label: 'Stratified squamous epithelium', description: 'Many layers, built to survive abrasion. Keratinised in the epidermis, non-keratinised in the mouth and oesophagus.', searchTerms: ['stratified squamous epithelium'], imageKind: 'histology' },
  { key: 'transitional', label: 'Transitional epithelium (urothelium)', description: 'Changes shape as it stretches — lines the bladder and ureters so they can fill without tearing.', searchTerms: ['transitional epithelium urothelium'], imageKind: 'histology' },
  { key: 'glandular-epithelium', label: 'Glandular epithelium', description: 'Epithelium specialised for secretion, forming exocrine glands (ducts) and endocrine glands (into the blood).', searchTerms: ['glandular epithelium'], imageKind: 'histology' },

  // — Ikat: sel yang jarang di dalam matriks; sifat matriksnya yang membedakan.
  { key: 'areolar', label: 'Loose (areolar) connective tissue', description: 'The loose packing tissue under epithelia — fibres in a gel matrix, holding vessels, nerves, and immune cells.', searchTerms: ['areolar connective tissue'], imageKind: 'histology' },
  { key: 'dense-regular', label: 'Dense regular connective tissue', description: 'Collagen bundles in parallel, built for pull in one direction — tendons and ligaments.', searchTerms: ['dense regular connective tissue', 'tendon histology'], imageKind: 'histology' },
  { key: 'dense-irregular', label: 'Dense irregular connective tissue', description: 'Collagen running in every direction, resisting stress from all sides — the dermis and organ capsules.', searchTerms: ['dense irregular connective tissue'], imageKind: 'histology' },
  { key: 'adipose', label: 'Adipose tissue', description: 'Fat-storing cells with the nucleus pushed to the rim. Stores energy, insulates, and acts as an endocrine organ.', searchTerms: ['adipose tissue histology'], imageKind: 'histology' },
  { key: 'reticular', label: 'Reticular connective tissue', description: 'A fine mesh of reticular fibres forming the scaffold of lymph nodes, spleen, and bone marrow.', searchTerms: ['reticular connective tissue'], imageKind: 'histology' },
  { key: 'hyaline-cartilage', label: 'Hyaline cartilage', description: 'Glassy, smooth cartilage covering joint surfaces and forming the airway rings and costal cartilages.', searchTerms: ['hyaline cartilage histology'], imageKind: 'histology' },
  { key: 'elastic-cartilage', label: 'Elastic cartilage', description: 'Cartilage packed with elastic fibres so it springs back — the external ear and the epiglottis.', searchTerms: ['elastic cartilage histology'], imageKind: 'histology' },
  { key: 'fibrocartilage', label: 'Fibrocartilage', description: 'The toughest cartilage, built to absorb compression — intervertebral discs and the knee menisci.', searchTerms: ['fibrocartilage histology'], imageKind: 'histology' },
  { key: 'compact-bone', label: 'Compact bone', description: 'Dense bone built from osteons — concentric rings around a central canal carrying vessels and nerves.', searchTerms: ['compact bone histology osteon'], imageKind: 'histology' },
  { key: 'spongy-bone', label: 'Spongy (cancellous) bone', description: 'An open lattice of trabeculae — lighter than compact bone, and where red marrow sits.', searchTerms: ['spongy bone trabecular histology'], imageKind: 'histology' },
  { key: 'blood-tissue', label: 'Blood', description: 'A connective tissue whose matrix is liquid plasma, carrying red cells, white cells, and platelets.', searchTerms: ['blood smear histology'], imageKind: 'histology' },

  // — Otot: tiga jenis, dibedakan lurik/tidak dan kendali sadar/tidak.
  { key: 'skeletal-muscle-tissue', label: 'Skeletal muscle tissue', description: 'Long striated fibres with many nuclei at the edge — under voluntary control, moving the skeleton.', searchTerms: ['skeletal muscle histology'], imageKind: 'histology' },
  { key: 'cardiac-muscle-tissue', label: 'Cardiac muscle tissue', description: 'Striated, branching cells joined by intercalated discs so the heart contracts as one unit. Involuntary.', searchTerms: ['cardiac muscle histology intercalated disc'], imageKind: 'histology' },
  { key: 'smooth-muscle-tissue', label: 'Smooth muscle tissue', description: 'Spindle-shaped cells with no striations, in the walls of vessels, gut, and airways. Involuntary.', searchTerms: ['smooth muscle histology'], imageKind: 'histology' },

  // — Saraf: sel penghantar sinyal + sel penyokongnya.
  { key: 'neuron', label: 'Neuron', description: 'The signalling cell — dendrites receive, the cell body integrates, and one axon carries the impulse away.', searchTerms: ['neuron histology'], imageKind: 'histology' },
  { key: 'neuroglia', label: 'Neuroglia (glial cells)', description: 'The support cells that outnumber neurons — astrocytes, oligodendrocytes, microglia, and Schwann cells.', searchTerms: ['neuroglia astrocyte histology'], imageKind: 'histology' },
]

export const ORGAN_SYSTEMS: AnatomyEntry[] = [
  {
    key: 'integumentary',
    label: 'Integumentary system',
    description: 'Skin, hair, and nails — the body\'s outer barrier against injury, infection, and fluid loss, and a major organ for temperature regulation. The 3D model shows the body\'s external surface and its named regions, not microscopic skin layers (epidermis/dermis) or glands.',
    searchTerms: ['skin disease', 'integumentary system disease'],
    layer3d: 'surface',
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

// Struktur yang TIDAK punya geometri di model 3D Z-Anatomy/BodyParts3D —
// sudah diperiksa sampai tingkat koleksi, bukan diasumsikan: reproduksi wanita
// memang tidak dimodelkan sama sekali (kategori "Vulva" ada tapi kosong), dan
// kulit sengaja dilepas supaya struktur di bawahnya terlihat.
//
// Keduanya tetap dilayani di sini lewat jalur yang TIDAK butuh mesh 3D:
// istilah anatomi nyata dari UBERON/FMA (OLS4) + gambar berlisensi bebas dari
// Wikimedia Commons. Jadi bagian tubuh ini tidak lagi hilang dari aplikasi
// hanya karena bentuk 3D-nya belum ada.
export const IMAGE_ONLY_STRUCTURES: AnatomyEntry[] = [
  { key: 'uterus', label: 'Uterus', description: 'The muscular organ where a fetus develops. Its lining (endometrium) thickens and sheds across the menstrual cycle.', searchTerms: ['uterine disease', 'endometriosis'] },
  { key: 'ovary', label: 'Ovary', description: 'Paired glands that release eggs and produce oestrogen and progesterone — both a reproductive and an endocrine organ.', searchTerms: ['ovarian disease', 'polycystic ovary syndrome'] },
  { key: 'fallopian-tube', label: 'Fallopian tube', description: 'Carries the egg from ovary to uterus, and is usually where fertilisation happens.', searchTerms: ['fallopian tube disease'] },
  { key: 'cervix', label: 'Cervix', description: 'The lower neck of the uterus opening into the vagina — the site screened by a Pap smear.', searchTerms: ['cervical disease', 'cervical cancer'] },
  { key: 'vagina', label: 'Vagina', description: 'The muscular canal connecting the cervix to the outside of the body.', searchTerms: ['vaginal disease'] },
  { key: 'breast', label: 'Breast', description: 'Glandular tissue and ducts that produce and carry milk, over a bed of fat and connective tissue.', searchTerms: ['breast disease', 'breast cancer'] },
  { key: 'epidermis', label: 'Epidermis', description: 'The outermost skin layer — a self-renewing barrier of keratinocytes, with the pigment cells (melanocytes) at its base.', searchTerms: ['epidermis disease', 'skin disease'] },
  { key: 'dermis', label: 'Dermis', description: 'The layer beneath the epidermis, holding collagen, blood vessels, nerve endings, and the roots of hair and glands.', searchTerms: ['dermis disease'] },
  { key: 'hair-follicle', label: 'Hair follicle', description: 'The tube-shaped structure in the dermis that grows a hair, with a sebaceous gland attached to it.', searchTerms: ['hair follicle disease', 'alopecia'] },
  { key: 'sebaceous-gland', label: 'Sebaceous & sweat glands', description: 'Sebaceous glands oil the skin and hair; sweat glands cool the body. Blocked sebaceous glands are central to acne.', searchTerms: ['sebaceous gland disease', 'acne'] },
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
