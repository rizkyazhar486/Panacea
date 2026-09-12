// Stasiun limfe sebagai objek yang bisa DITUNJUK, bukan daftar nama.
//
// "Kelenjar coeliaca", "nodus ileokolika", "kelompok aksila sentral" adalah
// bahasa kerja sehari-hari, dan selama ini aplikasi ini hanya memuatnya sebagai
// teks. lymphoid.glb mengirim stasiun-stasiun itu sebagai mesh tersendiri, jadi
// namanya bisa ditunjukkan pada tubuh, lengkap dengan wilayah yang dialirkannya.
//
// EMPAT JEBAKAN berkas ini, masing-masing sudah pernah menghasilkan gambar yang
// terlihat benar dan sebenarnya kosong atau salah:
//
//   1. Berkas ini memakai EXT_meshopt_compression. Tanpa setMeshoptDecoder,
//      GLTFLoader menolak berkas dan kanvas tinggal kosong.
//
//   2. GLTFLoader MEMBERSIHKAN nama simpul. Titik dibuang, sehingga ".l" dan
//      ".r" runtuh menjadi satu nama scene dengan akhiran angka yang urutannya
//      tidak dijamin. Nama ASLI karena itu dipulihkan lewat
//      gltf.parser.associations, dan pencocokan di sini SELALU memakai nama asli.
//
//   3. Berkas ini mengirim simpul BERLABEL TANPA GEOMETRI: "Cubital nodes.l/.r"
//      dan "Inferior deep lateral cervical nodes.l/.r" hanyalah pivot yang
//      memayungi mesh lain. Mengikatnya lolos pemeriksaan "nama ada" dan tidak
//      menggambar apa pun. Keduanya dikunci di MESH_PIVOT_TANPA_GEOMETRI sebagai
//      kontrol negatif gerbang.
//
//   4. Sisi TIDAK bisa dibaca dari koordinat X pada berkas ini. Dua pasangan
//      ("Anterior inferior jugular nodes", "Supratrochlear nodes") adalah anak
//      dari pivot berpasangan, sehingga translasi lokalnya nyaris identik dan
//      bertanda sama; pasangan lain dicerminkan lewat skala negatif. Sisi hanya
//      dipercaya dari nama asli.
//
// BATAS KLINIS: hubungan aliran di bawah adalah anatomi kotor baku -- wilayah
// mana yang mengalir ke stasiun mana pada orang dewasa. Ia BUKAN penentuan
// stadium, bukan pernyataan tentang penyebaran keganasan, bukan prognosis, dan
// tidak menyimpulkan apa pun tentang siapa pun. Aliran limfe bervariasi antar
// orang, punya banyak jalur pintas, dan tidak bisa dipakai untuk menyimpulkan
// anatomi seseorang tertentu.

/** Nama berkas atlas, relatif terhadap BASE_URL. */
export const BERKAS_LIMFOID = 'anatomy/lymphoid.glb'

/** Kelompok wilayah untuk daftar yang bisa dipakai tanpa menunjuk model. */
export type WilayahLimfe = 'head-neck' | 'upper-limb' | 'thorax' | 'abdomen' | 'pelvis' | 'lower-limb' | 'organ'

export const WILAYAH_LIMFE: readonly { id: WilayahLimfe; label: string }[] = [
  { id: 'head-neck', label: 'Head and neck' },
  { id: 'upper-limb', label: 'Upper limb, axilla and breast' },
  { id: 'thorax', label: 'Thorax' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'pelvis', label: 'Pelvis' },
  { id: 'lower-limb', label: 'Lower limb' },
  { id: 'organ', label: 'Lymphoid organs' },
]

export interface StasiunLimfe {
  /** Identitas, bukan teks: dipakai untuk perbandingan dan atribut data. */
  id: string
  /** Nama yang dibaca pengguna, dalam bahasa Inggris. */
  label: string
  wilayah: WilayahLimfe
  /** Nama simpul PERSIS seperti di lymphoid.glb, termasuk kurung dan ".l"/".r". */
  mesh: readonly string[]
  /** Wilayah tubuh yang mengalir ke stasiun ini. */
  drainase: readonly string[]
  /** Catatan orientasi tambahan; bukan penilaian klinis. */
  catatan?: string
}

/**
 * Simpul yang MEMBAWA LABEL tetapi TIDAK membawa geometri.
 *
 * Kontrol negatif gerbang: kalau salah satu dari nama ini pernah terikat ke
 * sebuah stasiun, stasiun itu akan tampak terdaftar dan tidak pernah menyala.
 */
export const MESH_PIVOT_TANPA_GEOMETRI: readonly string[] = [
  'Cubital nodes.l',
  'Cubital nodes.r',
  'Inferior deep lateral cervical nodes.l',
  'Inferior deep lateral cervical nodes.r',
]

/** Simpul bantu berkas sumber, bukan anatomi; disembunyikan saat render. */
export const MESH_BUKAN_ANATOMI: readonly string[] = ['HOW TO ...', 'Take a picture']

/**
 * Atlas ini tidak mengirim SATU pun pembuluh atau duktus limfatik.
 *
 * Tidak ada ductus thoracicus, tidak ada cisterna chyli, tidak ada trunkus.
 * Klaim itu diperiksa langsung terhadap JSON berkas oleh
 * scripts/uji/stasiun-limfe.mts, dan dinyatakan di antarmuka alih-alih ditutupi
 * dengan geometri pinjaman.
 */
export const POLA_PEMBULUH_ABSEN: readonly string[] = ['duct', 'cisterna', 'chyl', 'trunk', 'vessel']

export const STASIUN_LIMFE: readonly StasiunLimfe[] = [
  // ── Kepala dan leher ────────────────────────────────────────────────────
  {
    id: 'occipital', label: 'Occipital nodes', wilayah: 'head-neck',
    mesh: ['Occipital nodes.l', 'Occipital nodes.r'],
    drainase: ['Back of the scalp', 'Skin over the upper back of the neck'],
  },
  {
    id: 'mastoid', label: 'Mastoid (retro-auricular) nodes', wilayah: 'head-neck',
    mesh: ['Mastoid nodes.l', 'Mastoid nodes.r'],
    drainase: ['Scalp above and behind the ear', 'Upper part of the auricle', 'Back wall of the external acoustic meatus'],
  },
  {
    id: 'parotid', label: 'Parotid nodes', wilayah: 'head-neck',
    mesh: [
      'Pre-auricular nodes.l', 'Pre-auricular nodes.r',
      'Superficial parotid nodes.l', 'Superficial parotid nodes.r',
      'Intraglandular parotid nodes.l', 'Intraglandular parotid nodes.r',
      'Infra-auricular nodes.l', 'Infra-auricular nodes.r',
    ],
    drainase: ['Parotid gland', 'Temporal and frontal scalp', 'Lateral parts of the eyelids', 'Front of the auricle and the external acoustic meatus'],
    catatan: 'Superficial, intraglandular, pre-auricular and infra-auricular nodes are the one parotid group.',
  },
  {
    id: 'facial', label: 'Facial nodes', wilayah: 'head-neck',
    mesh: ['Bucinator node.l', 'Bucinator node.r', 'Nasolabial node.l', 'Nasolabial node.r', 'Mandibular node.l', 'Mandibular node.r'],
    drainase: ['Skin and mucosa of the cheek', 'Side of the nose and the lower eyelid'],
    catatan: 'Small, inconstant nodes scattered along the facial vessels; their lymph passes on to the submandibular nodes.',
  },
  {
    id: 'submandibular', label: 'Submandibular nodes', wilayah: 'head-neck',
    mesh: ['Submandibular nodes.l', 'Submandibular nodes.r'],
    drainase: ['Cheek and side of the nose', 'Upper lip and lateral part of the lower lip', 'Gums and teeth, except the lower incisors', 'Anterior tongue, except its tip', 'Submandibular and sublingual glands'],
  },
  {
    id: 'submental', label: 'Submental nodes', wilayah: 'head-neck',
    mesh: ['Submental nodes.l', 'Submental nodes.r'],
    drainase: ['Tip of the tongue', 'Central part of the lower lip and the chin', 'Floor of the mouth in front', 'Lower incisor teeth'],
  },
  {
    id: 'retropharyngeal', label: 'Retropharyngeal nodes', wilayah: 'head-neck',
    mesh: ['Retropharyngeal nodes.l', 'Retropharyngeal nodes.r'],
    drainase: ['Nasopharynx', 'Back of the nasal cavity and the paranasal sinuses', 'Auditory tube', 'Soft palate'],
  },
  {
    id: 'superficial-lateral-cervical', label: 'Superficial lateral cervical nodes', wilayah: 'head-neck',
    mesh: ['Superficial lateral cervical nodes.l', 'Superficial lateral cervical nodes.r'],
    drainase: ['Skin over the angle of the jaw and the lower parotid region', 'Lower part of the auricle'],
    catatan: 'These lie along the external jugular vein.',
  },
  {
    id: 'superficial-anterior-cervical', label: 'Superficial anterior cervical nodes', wilayah: 'head-neck',
    mesh: ['Superficial anterior cervical nodes'],
    drainase: ['Skin of the front of the neck below the hyoid bone'],
    catatan: 'These lie along the anterior jugular vein.',
  },
  {
    id: 'jugulodigastric', label: 'Jugulodigastric node', wilayah: 'head-neck',
    mesh: ['Jugulodigastric node.l', 'Jugulodigastric node.r'],
    drainase: ['Palatine tonsil', 'Tongue'],
    catatan: 'The largest node of the upper deep cervical chain, below and behind the angle of the mandible.',
  },
  {
    id: 'superior-deep-cervical', label: 'Upper deep cervical nodes', wilayah: 'head-neck',
    mesh: ['Lateral superior jugular node.l', 'Lateral superior jugular node.r'],
    drainase: ['Most of the head and neck, directly or through the more superficial node groups'],
    catatan: 'The deep cervical chain runs alongside the internal jugular vein and collects the region as a whole.',
  },
  {
    id: 'inferior-deep-cervical', label: 'Lower deep cervical nodes', wilayah: 'head-neck',
    mesh: ['Anterior inferior jugular nodes.l', 'Anterior inferior jugular nodes.r'],
    drainase: ['Upper deep cervical nodes', 'Front of the neck'],
    catatan: 'These sit under the pivot node named "Inferior deep lateral cervical nodes", which itself carries no geometry in this file.',
  },
  {
    id: 'supraclavicular', label: 'Supraclavicular nodes', wilayah: 'head-neck',
    mesh: ['Supraclavicular nodes.l', 'Supraclavicular nodes.r'],
    drainase: ['Deep cervical chain above', 'Skin over the lower neck and shoulder'],
    catatan: 'The lowest nodes of the deep cervical chain, in the supraclavicular fossa.',
  },
  {
    id: 'paratracheal-cervical', label: 'Cervical paratracheal nodes', wilayah: 'head-neck',
    mesh: ['Paratracheal cervical nodes'],
    drainase: ['Larynx below the vocal folds', 'Cervical trachea', 'Cervical oesophagus', 'Thyroid gland'],
  },
  {
    id: 'thyroid-nodes', label: 'Thyroid nodes', wilayah: 'head-neck',
    mesh: ['Thyroid nodes.l', 'Thyroid nodes.r'],
    drainase: ['Thyroid gland'],
  },
  {
    id: 'prevertebral', label: 'Prevertebral nodes', wilayah: 'head-neck',
    mesh: ['Prevertebral nodes'],
    drainase: ['Structures in front of the vertebral column at the root of the neck'],
  },

  // ── Anggota gerak atas, aksila dan payudara ─────────────────────────────
  {
    id: 'supratrochlear', label: 'Supratrochlear (cubital) nodes', wilayah: 'upper-limb',
    mesh: ['Supratrochlear nodes.l', 'Supratrochlear nodes.r'],
    drainase: ['Little and ring fingers', 'Ulnar side of the hand and forearm'],
    catatan: 'These sit under the pivot node named "Cubital nodes", which itself carries no geometry in this file.',
  },
  {
    id: 'infraclavicular', label: 'Infraclavicular (deltopectoral) nodes', wilayah: 'upper-limb',
    mesh: ['Infraclavicular nodes.l', 'Infraclavicular nodes.r'],
    drainase: ['Superficial lymphatics running with the cephalic vein, from the radial side of the hand and forearm'],
  },
  {
    id: 'lateral-axillary', label: 'Lateral (brachial) axillary nodes', wilayah: 'upper-limb',
    mesh: ['Lateral axillary nodes.l', 'Lateral axillary nodes.r', 'Brachial nodes.l', 'Brachial nodes.r'],
    drainase: ['Most of the upper limb'],
  },
  {
    id: 'anterior-axillary', label: 'Anterior (pectoral) axillary nodes', wilayah: 'upper-limb',
    mesh: ['Anterior axillary nodes.l', 'Anterior axillary nodes.r'],
    drainase: ['Anterolateral chest wall', 'Most of the breast'],
  },
  {
    id: 'posterior-axillary', label: 'Posterior (subscapular) axillary nodes', wilayah: 'upper-limb',
    mesh: ['Posterior axillary nodes.l', 'Posterior axillary nodes.r'],
    drainase: ['Back of the chest wall and the scapular region', 'Skin of the back down to the iliac crest'],
  },
  {
    id: 'central-axillary', label: 'Central axillary nodes', wilayah: 'upper-limb',
    mesh: ['Central axillary nodes.l', 'Central axillary nodes.r'],
    drainase: ['Anterior, posterior and lateral axillary groups'],
  },
  {
    id: 'apical-axillary', label: 'Apical axillary nodes', wilayah: 'upper-limb',
    mesh: ['Apical axillary nodes.l', 'Apical axillary nodes.r'],
    drainase: ['All other axillary groups', 'Lymphatics running with the cephalic vein'],
  },
  {
    id: 'interpectoral', label: 'Interpectoral nodes', wilayah: 'upper-limb',
    mesh: ['Interpectoral nodes.l', 'Interpectoral nodes.r'],
    drainase: ['Pectoral muscles', 'Deep part of the breast'],
  },
  {
    id: 'parasternal', label: 'Parasternal (internal thoracic) nodes', wilayah: 'upper-limb',
    mesh: ['Parasternal nodes.l', 'Parasternal nodes.r'],
    drainase: ['Medial part of the breast', 'Front of the chest wall', 'Upper part of the anterior abdominal wall', 'Diaphragm and the upper surface of the liver'],
  },

  // ── Toraks ─────────────────────────────────────────────────────────────
  {
    id: 'intercostal', label: 'Intercostal nodes', wilayah: 'thorax',
    mesh: ['Intercostal nodes.l', 'Intercostal nodes.r'],
    drainase: ['Posterolateral chest wall and the intercostal spaces', 'Parietal pleura'],
  },
  {
    id: 'diaphragmatic', label: 'Diaphragmatic nodes', wilayah: 'thorax',
    mesh: ['Superior diaphragmatic nodes', 'Inferior diaphragmatic nodes'],
    drainase: ['Diaphragm', 'Pleura and peritoneum next to the diaphragm', 'Upper surface of the liver'],
  },
  {
    id: 'pericardial', label: 'Pericardial nodes', wilayah: 'thorax',
    mesh: ['Prepericardial nodes', 'Lateral pericardial nodes'],
    drainase: ['Pericardium', 'Adjacent part of the diaphragm'],
  },
  {
    id: 'brachiocephalic', label: 'Brachiocephalic nodes', wilayah: 'thorax',
    mesh: ['Brachiocephalic nodes'],
    drainase: ['Thymus', 'Thyroid gland', 'Pericardium'],
    catatan: 'Anterior mediastinal nodes, in front of the brachiocephalic veins.',
  },
  {
    id: 'tracheal', label: 'Tracheal (paratracheal) nodes', wilayah: 'thorax',
    mesh: ['Paratracheal thoracic nodes', 'Pretracheal nodes.l', 'Pretracheal nodes.r'],
    drainase: ['Thoracic trachea', 'Adjacent oesophagus', 'Tracheobronchial nodes below'],
  },
  {
    id: 'tracheobronchial', label: 'Tracheobronchial nodes', wilayah: 'thorax',
    mesh: ['Superior tracheobronchial nodes', 'Inferior tracheobronchial nodes'],
    drainase: ['Lungs and bronchi', 'Lower trachea'],
    catatan: 'The inferior group lies at the carina, in the angle between the two main bronchi.',
  },
  {
    id: 'intrapulmonary', label: 'Intrapulmonary nodes', wilayah: 'thorax',
    mesh: ['Intrapulmonary nodes'],
    drainase: ['Lung tissue itself, along the branching bronchi'],
  },
  {
    id: 'juxta-oesophageal', label: 'Juxta-oesophageal nodes', wilayah: 'thorax',
    mesh: ['Juxta-oesophageal nodes'],
    drainase: ['Thoracic oesophagus'],
  },
  {
    id: 'aortic-arch-nodes', label: 'Nodes around the aortic arch', wilayah: 'thorax',
    mesh: ['Subaortic nodes', 'Node of ligamentum arteriosum', 'Node of arch of azygos vein'],
    drainase: ['Mediastinal structures next to the aortic arch'],
    catatan: 'Named landmarks on the mediastinal chain; this atlas carries them as separate small nodes.',
  },

  // ── Abdomen ────────────────────────────────────────────────────────────
  {
    id: 'coeliac', label: 'Coeliac nodes', wilayah: 'abdomen',
    mesh: ['Coeliac nodes'],
    drainase: ['Stomach', 'Liver and gallbladder', 'Spleen', 'Pancreas', 'First part of the duodenum'],
    catatan: 'The collecting point for the foregut, receiving from the gastric, hepatic and pancreaticosplenic groups.',
  },
  {
    id: 'gastric', label: 'Gastric nodes', wilayah: 'abdomen',
    mesh: ['Right gastric nodes', 'Right gastro-omental nodes'],
    drainase: ['Lesser and greater curvatures of the stomach', 'Pylorus'],
  },
  {
    id: 'pyloric', label: 'Pyloric nodes', wilayah: 'abdomen',
    mesh: ['(Suprapyloric node)', '(Subpyloric nodes)', '(Retropyloric nodes)'],
    drainase: ['Pylorus', 'First part of the duodenum'],
  },
  {
    id: 'pancreaticosplenic', label: 'Pancreaticosplenic nodes', wilayah: 'abdomen',
    mesh: ['Superior pancreatic nodes', 'Inferior pancreatic nodes', 'Splenic nodes'],
    drainase: ['Body and tail of the pancreas', 'Spleen', 'Fundus and greater curvature of the stomach'],
  },
  {
    id: 'pancreaticoduodenal', label: 'Superior pancreaticoduodenal nodes', wilayah: 'abdomen',
    mesh: ['Superior pancreaticoduodenal nodes'],
    drainase: ['Duodenum', 'Head of the pancreas'],
  },
  {
    id: 'cystic', label: 'Cystic node', wilayah: 'abdomen',
    mesh: ['Cystic node'],
    drainase: ['Gallbladder'],
    catatan: 'A single node at the neck of the gallbladder.',
  },
  {
    id: 'mesenteric', label: 'Mesenteric nodes', wilayah: 'abdomen',
    mesh: ['Juxta-intestinal mesenteric nodes', 'Central superior mesenteric nodes', 'Paracolic superior mesenteric nodes'],
    drainase: ['Jejunum and ileum'],
    catatan: 'Lying in the layers of the mesentery, from the gut wall inwards to the root.',
  },
  {
    id: 'ileocolic', label: 'Ileocolic nodes', wilayah: 'abdomen',
    mesh: ['Ileocolic nodes', 'Appendicular nodes', 'Precaecal nodes', 'Retrocaecal nodes'],
    drainase: ['Terminal ileum', 'Caecum and appendix', 'Beginning of the ascending colon'],
  },
  {
    id: 'right-colic', label: 'Right colic nodes', wilayah: 'abdomen',
    mesh: ['Right colic nodes'], drainase: ['Ascending colon'],
  },
  {
    id: 'middle-colic', label: 'Middle colic nodes', wilayah: 'abdomen',
    mesh: ['Middle colic nodes'], drainase: ['Transverse colon'],
  },
  {
    id: 'left-colic', label: 'Left colic nodes', wilayah: 'abdomen',
    mesh: ['Left colic nodes'], drainase: ['Descending colon'],
  },
  {
    id: 'sigmoid', label: 'Sigmoid nodes', wilayah: 'abdomen',
    mesh: ['Sigmoid nodes'], drainase: ['Sigmoid colon'],
  },
  {
    id: 'pre-aortic', label: 'Pre-aortic nodes', wilayah: 'abdomen',
    mesh: ['Pre-aortic nodes'],
    drainase: ['Coeliac, superior mesenteric and inferior mesenteric groups — that is, the gut as a whole'],
  },
  {
    id: 'lateral-aortic', label: 'Lateral aortic (lumbar) nodes', wilayah: 'abdomen',
    mesh: ['Lateral aortic nodes'],
    drainase: ['Kidneys and suprarenal glands', 'Testis or ovary', 'Ureters', 'Posterior abdominal wall', 'Common iliac nodes below'],
    catatan: 'The gonads drain here, high on the posterior abdominal wall, not to the inguinal nodes — they developed in the abdomen and kept their lymphatics.',
  },
  {
    id: 'caval-lumbar', label: 'Caval (right lumbar) nodes', wilayah: 'abdomen',
    mesh: ['Precaval nodes', 'Lateral caval nodes', 'Retrocaval nodes'],
    drainase: ['Right kidney and right suprarenal gland', 'Right testis or ovary', 'Posterior abdominal wall on the right'],
  },
  {
    id: 'retro-aortic', label: 'Retro-aortic and intermediate lumbar nodes', wilayah: 'abdomen',
    mesh: ['Retro-aortic nodes', 'Intermediate lumbar nodes'],
    drainase: ['Posterior abdominal wall', 'The neighbouring lumbar node groups'],
  },
  {
    id: 'inferior-epigastric', label: 'Inferior epigastric nodes', wilayah: 'abdomen',
    mesh: ['Inferior epigastric nodes.l', 'Inferior epigastric nodes.r'],
    drainase: ['Anterior abdominal wall below the umbilicus, alongside the inferior epigastric vessels'],
  },

  // ── Pelvis ─────────────────────────────────────────────────────────────
  {
    id: 'common-iliac', label: 'Common iliac nodes', wilayah: 'pelvis',
    mesh: ['Lateral common iliac nodes', 'Intermediate common iliac nodes', 'Medial common iliac nodes'],
    drainase: ['External iliac nodes', 'Internal iliac nodes'],
    catatan: 'The step between the pelvis and the lumbar nodes.',
  },
  {
    id: 'external-iliac', label: 'External iliac nodes', wilayah: 'pelvis',
    mesh: [
      'Medial external iliac nodes.l', 'Medial external iliac nodes.r',
      'Intermediate external iliac nodes.l', 'Intermediate external iliac nodes.r',
      '(Lateral lacunar node).l', '(Lateral lacunar node).r',
      '(Intermediate lacunar node).l', '(Intermediate lacunar node).r',
      '(Medial lacunar node).l', '(Medial lacunar node).r',
    ],
    drainase: ['Inguinal nodes, and so the whole lower limb', 'Lower anterior abdominal wall', 'Urinary bladder'],
    catatan: 'The lacunar nodes are the lowest external iliac nodes, behind the inguinal ligament.',
  },
  {
    id: 'obturator', label: 'Obturator nodes', wilayah: 'pelvis',
    mesh: ['Obturator nodes.l', 'Obturator nodes.r'],
    drainase: ['Side wall of the pelvis'],
  },
  {
    id: 'gluteal', label: 'Gluteal nodes', wilayah: 'pelvis',
    mesh: ['Superior gluteal nodes.l', 'Superior gluteal nodes.r', 'Inferior gluteal nodes.l', 'Inferior gluteal nodes.r'],
    drainase: ['Deep parts of the gluteal region', 'Back wall of the pelvis'],
  },
  {
    id: 'sacral', label: 'Sacral nodes', wilayah: 'pelvis',
    mesh: ['Lateral sacral nodes.l', 'Lateral sacral nodes.r', 'Median sacral nodes'],
    drainase: ['Rectum', 'Back wall of the pelvis'],
  },
  {
    id: 'vesical', label: 'Vesical nodes', wilayah: 'pelvis',
    mesh: ['Prevesical nodes', 'Postvesical nodes', 'Lateral vesical nodes.l', 'Lateral vesical nodes.r'],
    drainase: ['Urinary bladder'],
  },
  {
    id: 'pararectal', label: 'Pararectal nodes', wilayah: 'pelvis',
    mesh: ['Pararectal nodes'],
    drainase: ['Rectum'],
  },

  // ── Anggota gerak bawah ────────────────────────────────────────────────
  {
    id: 'superficial-inguinal', label: 'Superficial inguinal nodes', wilayah: 'lower-limb',
    mesh: [
      'Superolateral superficial inguinal nodes.l', 'Superolateral superficial inguinal nodes.r',
      'Superomedial superficial inguinal nodes.l', 'Superomedial superficial inguinal nodes.r',
      'Inferior superficial inguinal nodes.l', 'Inferior superficial inguinal nodes.r',
    ],
    drainase: ['Skin of the whole lower limb', 'Anterior abdominal wall below the umbilicus', 'Gluteal skin', 'Perineum and external genitalia, excluding the testis', 'Anal canal below the pectinate line'],
    catatan: 'A very large territory for a small group of nodes: the skin of the limb, the lower belly wall and the perineum all arrive here.',
  },
  {
    id: 'deep-inguinal', label: 'Deep inguinal nodes', wilayah: 'lower-limb',
    mesh: ['(Proximal deep inguinal node).l', '(Proximal deep inguinal node).r', '(Intermediate deep inguinal node).l', '(Intermediate deep inguinal node).r'],
    drainase: ['Deep lymphatics of the lower limb, along the femoral vessels', 'Glans penis or clitoris', 'Superficial inguinal nodes'],
  },
  {
    id: 'popliteal', label: 'Popliteal nodes', wilayah: 'lower-limb',
    mesh: ['Superficial popliteal nodes.l', 'Superficial popliteal nodes.r', 'Deep popliteal nodes.l', 'Deep popliteal nodes.r'],
    drainase: ['Lateral side of the foot and leg, along the small saphenous vein', 'Knee joint', 'Deep structures of the leg'],
  },
  {
    id: 'leg-deep-nodes', label: 'Tibial and fibular nodes', wilayah: 'lower-limb',
    mesh: ['(Anterior tibial node).l', '(Anterior tibial node).r', '(Posterior tibial node).l', '(Posterior tibial node).r', '(Fibular node).l', '(Fibular node).r'],
    drainase: ['Deep structures of the leg, on the way up to the popliteal nodes'],
    catatan: 'Small, inconstant nodes sitting directly on the deep vessels of the leg.',
  },

  // ── Organ limfoid ──────────────────────────────────────────────────────
  {
    id: 'spleen', label: 'Spleen', wilayah: 'organ',
    mesh: ['Spleen'],
    drainase: ['Not a node: the spleen filters blood, not lymph. Its own lymphatics leave at the hilum to the splenic nodes.'],
  },
  {
    id: 'thymus', label: 'Thymus', wilayah: 'organ',
    mesh: ['Left lobe of thymus', 'Right lobe of thymus'],
    drainase: ['Not a node: the thymus is where T lymphocytes mature. Its lymphatics leave to the parasternal, brachiocephalic and tracheobronchial nodes.'],
    catatan: 'Largest in childhood; in the adult it is mostly replaced by fat, so this shape is a young thymus.',
  },
  {
    id: 'palatine-tonsil', label: 'Palatine tonsil', wilayah: 'organ',
    mesh: ['Palatine tonsil.l', 'Palatine tonsil.r'],
    drainase: ['Not a node: a mucosal lymphoid mass in the wall of the oropharynx. Its lymph goes to the jugulodigastric node.'],
  },
]

/** Nama-nama mesh yang dipakai, sekali saja, untuk pemeriksaan cepat. */
export function semuaMeshTerikat(): string[] {
  return STASIUN_LIMFE.flatMap((s) => s.mesh)
}

export function stasiunUntuk(id: string): StasiunLimfe | undefined {
  return STASIUN_LIMFE.find((s) => s.id === id)
}

/**
 * Stasiun dari nama simpul ASLI (bukan nama scene hasil GLTFLoader).
 *
 * Pemanggil WAJIB memulihkan nama asli lewat gltf.parser.associations; nama
 * scene sudah kehilangan titik pemisah sisi dan tidak bisa dipercaya.
 */
export function stasiunDariMeshAsli(namaAsli: string): string | undefined {
  const n = namaAsli.trim()
  for (const s of STASIUN_LIMFE) if (s.mesh.includes(n)) return s.id
  return undefined
}

export function stasiunDiWilayah(wilayah: WilayahLimfe): StasiunLimfe[] {
  return STASIUN_LIMFE.filter((s) => s.wilayah === wilayah)
}
