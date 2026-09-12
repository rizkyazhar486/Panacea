// Pohon arteri sebagai benda yang bisa ditunjuk, bukan sebagai paragraf.
//
// Berkas cardiovascular.glb menyimpan arteri sebagai POHON: tiap batang
// bernama adalah simpul pivot tanpa mesh, yang menggendong satu anak tanpa
// nama berisi geometri batang itu sendiri, ditambah anak-anak bernama yang
// merupakan cabang-cabangnya. Struktur itulah yang dipakai di sini:
//   - geometri yang disorot = mesh milik batang itu sendiri;
//   - cabang distal = anak bernama langsung, dibaca dari berkasnya.
// Daftar `cabang` di bawah bukan hafalan: gerbang scripts/uji/wilayah-arteri.mts
// membandingkannya persis dengan isi GLB, jadi ia tidak bisa menyimpang diam-diam.
//
// BATAS KLINIS. Wilayah yang ditulis di sini adalah anatomi kasar baku, dan
// hanya itu. Wilayah bervariasi antarorang dan sirkulasi kolateral ada; tidak
// ada satu pun kalimat di sini yang boleh dibaca sebagai pola infark,
// diagnosis, prognosis, sasaran tindakan, atau apa pun yang khas satu pasien.

export const BERKAS_ARTERI = 'cardiovascular.glb'

export type SisiArteri = 'kiri' | 'kanan' | 'tengah'

export interface SimpulArteri {
  /** Nama ASLI simpul glTF. Nama di scene three.js sudah disanitasi; jangan dipakai. */
  nama: string
  sisi: SisiArteri
  /** Anak bernama langsung di dalam GLB — cabang distal yang dimodelkan berkas ini. */
  cabang: string[]
}

export interface Arteri {
  id: string
  label: string
  kelompok: string
  /** Wilayah yang dipasok — anatomi kasar baku saja. */
  wilayah: string[]
  catatan?: string
  simpul: SimpulArteri[]
}

export const ARTERI: Arteri[] = [
  {
    id: 'ascending-aorta',
    label: 'Ascending aorta',
    kelompok: 'Aorta and great vessels',
    wilayah: [
      'Carries the entire output of the left ventricle',
      'Gives rise to the right and left coronary arteries',
    ],
    simpul: [
    { nama: 'Ascending aorta', sisi: 'tengah', cabang: [] },
    ],
  },
  {
    id: 'aortic-arch',
    label: 'Aortic arch',
    kelompok: 'Aorta and great vessels',
    wilayah: [
      'Head, neck and both upper limbs, through its three branches',
    ],
    simpul: [
    { nama: 'Aortic arch', sisi: 'tengah', cabang: ['Brachiocephalic trunk'] },
    ],
  },
  {
    id: 'brachiocephalic-trunk',
    label: 'Brachiocephalic trunk',
    kelompok: 'Aorta and great vessels',
    wilayah: [
      'Right side of the head and neck, and the right upper limb, through the right common carotid and right subclavian arteries',
    ],
    simpul: [
    { nama: 'Brachiocephalic trunk', sisi: 'kanan', cabang: [] },
    ],
  },
  {
    id: 'thoracic-aorta',
    label: 'Thoracic aorta (descending)',
    kelompok: 'Aorta and great vessels',
    wilayah: [
      'Thoracic wall and the intercostal spaces',
      'Oesophagus, bronchi and posterior mediastinum',
      'Upper surface of the diaphragm',
    ],
    simpul: [
    { nama: 'Thoracic aorta', sisi: 'tengah', cabang: ['Posterior intercostal arteries.l', 'Posterior intercostal arteries.r', 'Subcostal artery.l', 'Subcostal artery.r', 'Superior phrenic arteries'] },
    ],
  },
  {
    id: 'abdominal-aorta',
    label: 'Abdominal aorta',
    kelompok: 'Aorta and great vessels',
    wilayah: [
      'Abdominal viscera, through the coeliac, superior mesenteric, renal and inferior mesenteric arteries',
      'Posterior abdominal wall',
      'Continues as the common iliac arteries to the pelvis and lower limbs',
    ],
    simpul: [
    { nama: 'Abdominal aorta', sisi: 'tengah', cabang: ['Coeliac trunk', 'Inferior mesenteric artery', 'Inferior phrenic artery', 'Left renal artery', 'Left testicular artery', 'Lumbar arteries.r', 'Lumbar arteries.l', 'Right renal artery', 'Right testicular artery.r', 'Superior mesenteric artery'] },
    ],
  },
  {
    id: 'common-carotid',
    label: 'Common carotid artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Head and neck of its own side, through the internal and external carotid arteries',
    ],
    simpul: [
    { nama: 'Left common carotid artery', sisi: 'kiri', cabang: ['External carotid artery.l', 'Internal carotid artery.l'] },
    { nama: 'Right common carotid artery', sisi: 'kanan', cabang: ['External carotid artery.r', 'Internal carotid artery.r'] },
    ],
  },
  {
    id: 'internal-carotid',
    label: 'Internal carotid artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Most of the cerebral hemisphere of its own side, through the anterior and middle cerebral arteries',
      'The eye and orbit, through the ophthalmic artery',
    ],
    simpul: [
    { nama: 'Internal carotid artery.l', sisi: 'kiri', cabang: ['Middle cerebral artery (M1-segment).l', 'Ophthalmic artery.l'] },
    { nama: 'Internal carotid artery.r', sisi: 'kanan', cabang: ['Anterior cerebral artery.l', 'Anterior cerebral artery.r', 'Middle cerebral artery (M1-segment).r', 'Ophthalmic artery.r'] },
    ],
  },
  {
    id: 'external-carotid',
    label: 'External carotid artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Face, scalp and superficial neck',
      'Tongue, pharynx and palate',
      'Jaws and teeth, and the cranial dura through the middle meningeal artery',
    ],
    simpul: [
    { nama: 'External carotid artery.l', sisi: 'kiri', cabang: ['Ascending pharyngeal artery.l', 'Facial artery.l', 'Maxillary artery.l', 'Occipital artery.l', 'Superficial temporal artery.l'] },
    { nama: 'External carotid artery.r', sisi: 'kanan', cabang: ['Ascending pharyngeal artery.r', 'Facial artery.r', 'Maxillary artery.r', 'Occipital artery.r', 'Superficial temporal artery.r'] },
    ],
  },
  {
    id: 'vertebral',
    label: 'Vertebral artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Cervical spinal cord and upper cervical vertebrae',
      'Joins its fellow to form the basilar artery and contribute to the posterior cerebral circulation',
    ],
    simpul: [
    { nama: 'Vertebral artery.l', sisi: 'kiri', cabang: ['Posterior inferior cerebellar artery.l'] },
    { nama: 'Vertebral artery.r', sisi: 'kanan', cabang: ['Basilar artery', 'Posterior inferior cerebellar artery.r'] },
    ],
  },
  {
    id: 'facial',
    label: 'Facial artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Superficial face — lips, cheek and side of the nose',
      'Submandibular gland',
    ],
    simpul: [
    { nama: 'Facial artery.l', sisi: 'kiri', cabang: ['Angular artery.l', 'Inferior labial artery.l', 'Submental artery.l', 'Superior labial artery.l'] },
    { nama: 'Facial artery.r', sisi: 'kanan', cabang: ['Angular artery.r', 'Inferior labial artery.r', 'Submental artery.r', 'Superior labial artery.r'] },
    ],
  },
  {
    id: 'maxillary',
    label: 'Maxillary artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Deep face — muscles of mastication and the upper and lower teeth',
      'Nasal cavity and palate',
      'Cranial dura, through the middle meningeal artery',
    ],
    simpul: [
    { nama: 'Maxillary artery.l', sisi: 'kiri', cabang: ['Anterior deep temporal artery.l', 'Artery of pterygoid canal.l', 'Buccal artery.l', 'Descending palatine artery.l', 'Inferior alveolar artery.l', 'Infra-orbital artery.l', 'Middle meningeal artery.l', 'Posterior deep temporal artery.l', 'Posterior septal branches of sphenopalatine artery.l', 'Posterior superior alveolar artery.l', 'Posterior lateral nasal branches of sphenopalatine artery..l'] },
    { nama: 'Maxillary artery.r', sisi: 'kanan', cabang: ['Anterior deep temporal artery.r', 'Artery of pterygoid canal.r', 'Buccal artery.r', 'Descending palatine artery.r', 'Inferior alveolar artery.r', 'Infra-orbital artery.r', 'Middle meningeal artery.r', 'Posterior deep temporal artery.r', 'Posterior septal branches of sphenopalatine artery.r', 'Posterior superior alveolar artery.r', 'Posterior lateral nasal branches of sphenopalatine artery..r'] },
    ],
  },
  {
    id: 'middle-meningeal',
    label: 'Middle meningeal artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Cranial dura mater and the inner surface of the overlying skull vault',
    ],
    simpul: [
    { nama: 'Middle meningeal artery.l', sisi: 'kiri', cabang: ['Accessory branch of middle meningeal artery.l'] },
    { nama: 'Middle meningeal artery.r', sisi: 'kanan', cabang: ['Accessory branch of middle meningeal artery.r'] },
    ],
  },
  {
    id: 'superficial-temporal',
    label: 'Superficial temporal artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Scalp over the temple and the side of the head',
    ],
    simpul: [
    { nama: 'Superficial temporal artery.l', sisi: 'kiri', cabang: ['Frontal branch of superficial temporal artery.l', 'Transverse facial artery.l'] },
    { nama: 'Superficial temporal artery.r', sisi: 'kanan', cabang: ['Frontal branch of superficial temporal artery.r', 'Transverse facial artery.r'] },
    ],
  },
  {
    id: 'ophthalmic',
    label: 'Ophthalmic artery',
    kelompok: 'Head and neck',
    wilayah: [
      'Eye, including the retina through the central retinal artery',
      'Orbit, lacrimal gland and eyelids',
    ],
    simpul: [
    { nama: 'Ophthalmic artery.l', sisi: 'kiri', cabang: ['Anterior ethmoidal artery.l', 'Central retinal artery.l', 'Lacrimal artery.l', 'Posterior ethmoidal artery.l', 'Long posterior ciliary arteries.l', 'Short posterior ciliary arteries.l', 'Supra-orbital artery.l', 'Supratrochlear artery.l'] },
    { nama: 'Ophthalmic artery.r', sisi: 'kanan', cabang: ['Anterior ethmoidal artery.r', 'Central retinal artery.r', 'Lacrimal artery.r', 'Posterior ethmoidal artery.r', 'Long posterior ciliary arteries.r', 'Short posterior ciliary arteries.r', 'Supra-orbital artery.r', 'Supratrochlear artery.r'] },
    ],
  },
  {
    id: 'basilar',
    label: 'Basilar artery',
    kelompok: 'Brain',
    wilayah: [
      'Brainstem — pons and midbrain',
      'Cerebellum, through the anterior inferior and superior cerebellar arteries',
      'Divides into the two posterior cerebral arteries',
    ],
    simpul: [
    { nama: 'Basilar artery', sisi: 'tengah', cabang: ['Anterior inferior cerebellar artery.l', 'Anterior inferior cerebellar artery.r', 'Lateral pontine branches of basilar artery.l', 'Lateral pontine branches of basilar artery.r', 'Medial pontine branches of basilar artery.l', 'Medial pontine branches of basilar artery.r', 'Posterior cerebral artery.l', 'Posterior cerebral artery.r', 'Superior cerebellar artery.l', 'Superior cerebellar artery.r'] },
    ],
  },
  {
    id: 'anterior-cerebral',
    label: 'Anterior cerebral artery',
    kelompok: 'Brain',
    wilayah: [
      'Medial surface of the frontal and parietal lobes',
      'Anterior part of the corpus callosum',
    ],
    simpul: [
    { nama: 'Anterior cerebral artery.l', sisi: 'kiri', cabang: ['Callosomarginal artery.l', 'Orbitofrontal branches of anterior cerebral artery.l', 'Pericallosal artery.l'] },
    { nama: 'Anterior cerebral artery.r', sisi: 'kanan', cabang: ['Callosomarginal artery.r', 'Orbitofrontal branches of anterior cerebral artery.r', 'Pericallosal artery.r'] },
    ],
  },
  {
    id: 'middle-cerebral',
    label: 'Middle cerebral artery (M1 segment)',
    kelompok: 'Brain',
    wilayah: [
      'Lateral surface of the frontal, parietal and temporal lobes',
      'Insula',
      'Deep grey matter, through the lateral striate (lenticulostriate) branches',
    ],
    simpul: [
    { nama: 'Middle cerebral artery (M1-segment).l', sisi: 'kiri', cabang: ['Distal lateral striate branches.l', 'Insular branches of middle cerebral artery (M2-segment).l', 'Proximal lateral striate branches.l'] },
    { nama: 'Middle cerebral artery (M1-segment).r', sisi: 'kanan', cabang: ['Distal lateral striate branches.r', 'Insular branches of middle cerebral artery (M2).r', 'Proximal lateral striate branches.r'] },
    ],
  },
  {
    id: 'posterior-cerebral',
    label: 'Posterior cerebral artery',
    kelompok: 'Brain',
    wilayah: [
      'Occipital lobe, including the visual cortex',
      'Inferomedial surface of the temporal lobe',
    ],
    simpul: [
    { nama: 'Posterior cerebral artery.l', sisi: 'kiri', cabang: ['Lateral occipital artery.l', 'Medial occipital artery.l', 'Parieto-occipital artery.l'] },
    { nama: 'Posterior cerebral artery.r', sisi: 'kanan', cabang: ['Medial occipital artery.r', 'Parieto-occipital artery.r'] },
    ],
  },
  {
    id: 'right-coronary',
    label: 'Right coronary artery',
    kelompok: 'Heart',
    wilayah: [
      'Right atrium and right ventricle',
      'Sinuatrial and atrioventricular nodes in most people',
      'Inferior wall of the left ventricle where the circulation is right-dominant',
    ],
    catatan: 'Coronary dominance varies between people: the artery that gives the posterior interventricular branch is the right coronary in most, the circumflex in a minority, and either in the rest.',
    simpul: [
    { nama: 'Right coronary artery', sisi: 'kanan', cabang: ['Right inferolateral branch of right coronary artery'] },
    ],
  },
  {
    id: 'left-coronary',
    label: 'Left coronary artery',
    kelompok: 'Heart',
    wilayah: [
      'Left atrium and most of the left ventricle',
      'Interventricular septum, through the anterior interventricular branch',
    ],
    simpul: [
    { nama: 'Left coronary artery', sisi: 'kiri', cabang: ['Anterior interventricular artery', 'Circumflex artery of heart'] },
    ],
  },
  {
    id: 'anterior-interventricular',
    label: 'Anterior interventricular artery',
    kelompok: 'Heart',
    wilayah: [
      'Anterior wall of the left ventricle',
      'Anterior part of the interventricular septum',
      'Apex of the heart',
    ],
    simpul: [
    { nama: 'Anterior interventricular artery', sisi: 'tengah', cabang: ['Septal branches of anterior interventricular artery'] },
    ],
  },
  {
    id: 'pulmonary-trunk',
    label: 'Pulmonary trunk',
    kelompok: 'Pulmonary circulation',
    wilayah: [
      'Carries deoxygenated blood from the right ventricle to both lungs — a pulmonary, not a systemic, artery',
    ],
    simpul: [
    { nama: 'Pulmonary trunk', sisi: 'tengah', cabang: ['Bifurcation of pulmonary trunk'] },
    ],
  },
  {
    id: 'right-pulmonary',
    label: 'Right pulmonary artery',
    kelompok: 'Pulmonary circulation',
    wilayah: [
      'Right lung — upper, middle and lower lobes',
    ],
    simpul: [
    { nama: 'Right pulmonary artery', sisi: 'kanan', cabang: ['Inferior lobar artery of right lung', 'Middle lobar artery of right lung', 'Superior lobar artery of right lung'] },
    ],
  },
  {
    id: 'left-pulmonary',
    label: 'Left pulmonary artery',
    kelompok: 'Pulmonary circulation',
    wilayah: [
      'Left lung — upper and lower lobes',
    ],
    simpul: [
    { nama: 'Left pulmonary artery', sisi: 'kiri', cabang: ['Anterior basal segmental artery of left lung', 'Lateral basal segmental artery of left lung', 'Medial basal segmental artery of left lung', 'Posterior basal segmental artery of left lung', 'Superior segmental artery of left lung', 'Anterior segmental artery of left lung', 'Apical segmental artery of left lung', 'Inferior lingular artery of left lung', 'Posterior segmental artery of left lung', 'Superior lingular artery of left lung'] },
    ],
  },
  {
    id: 'coeliac-trunk',
    label: 'Coeliac trunk',
    kelompok: 'Abdomen',
    wilayah: [
      'Foregut derivatives — abdominal oesophagus, stomach and proximal duodenum',
      'Liver, gallbladder, spleen and pancreas',
    ],
    simpul: [
    { nama: 'Coeliac trunk', sisi: 'tengah', cabang: ['Common hepatic artery', 'Left gastric artery', 'Splenic artery'] },
    ],
  },
  {
    id: 'common-hepatic',
    label: 'Common hepatic artery',
    kelompok: 'Abdomen',
    wilayah: [
      'Liver and gallbladder, through the proper hepatic artery',
      'Stomach and proximal duodenum, through the gastroduodenal artery',
    ],
    simpul: [
    { nama: 'Common hepatic artery', sisi: 'tengah', cabang: ['Gastroduodenal artery', 'Proper hepatic artery'] },
    ],
  },
  {
    id: 'proper-hepatic',
    label: 'Proper hepatic artery',
    kelompok: 'Abdomen',
    wilayah: [
      'Liver',
      'Gallbladder, through the cystic artery in most people',
    ],
    simpul: [
    { nama: 'Proper hepatic artery', sisi: 'tengah', cabang: [] },
    ],
  },
  {
    id: 'splenic',
    label: 'Splenic artery',
    kelompok: 'Abdomen',
    wilayah: [
      'Spleen',
      'Body and tail of the pancreas',
      'Fundus and greater curvature of the stomach',
    ],
    simpul: [
    { nama: 'Splenic artery', sisi: 'kiri', cabang: [] },
    ],
  },
  {
    id: 'left-gastric',
    label: 'Left gastric artery',
    kelompok: 'Abdomen',
    wilayah: [
      'Lesser curvature of the stomach',
      'Abdominal oesophagus',
    ],
    simpul: [
    { nama: 'Left gastric artery', sisi: 'kiri', cabang: [] },
    ],
  },
  {
    id: 'superior-mesenteric',
    label: 'Superior mesenteric artery',
    kelompok: 'Abdomen',
    wilayah: [
      'Midgut derivatives — distal duodenum, jejunum and ileum',
      'Caecum, appendix, ascending colon and the proximal transverse colon',
      'Head of the pancreas',
    ],
    simpul: [
    { nama: 'Superior mesenteric artery', sisi: 'tengah', cabang: ['Ileocolic artery', 'Inferior pancreaticoduodenal artery', 'Marginal artery', 'Middle colic artery', 'Right colic artery'] },
    ],
  },
  {
    id: 'inferior-mesenteric',
    label: 'Inferior mesenteric artery',
    kelompok: 'Abdomen',
    wilayah: [
      'Hindgut derivatives — distal transverse colon, descending and sigmoid colon',
      'Upper rectum',
    ],
    simpul: [
    { nama: 'Inferior mesenteric artery', sisi: 'tengah', cabang: ['Left colic artery', 'Sigmoid arteries', 'Superior anorectal artery'] },
    ],
  },
  {
    id: 'renal',
    label: 'Renal artery',
    kelompok: 'Abdomen',
    wilayah: [
      'Kidney of its own side',
      'Part of the adrenal gland, through the inferior suprarenal artery',
      'Proximal ureter',
    ],
    simpul: [
    { nama: 'Left renal artery', sisi: 'kiri', cabang: ['Anterior branch of renal artery.l', 'Inferior suprarenal artery.l', 'Intrarenal arteries of left kidney', 'Posterior branch of renal artery.l'] },
    { nama: 'Right renal artery', sisi: 'kanan', cabang: ['Anterior branch of renal artery.r', 'Inferior suprarenal artery.r', 'Intrarenal arteries of right kidney', 'Posterior branch of renal artery.r'] },
    ],
  },
  {
    id: 'common-iliac',
    label: 'Common iliac artery',
    kelompok: 'Pelvis',
    wilayah: [
      'Pelvis and lower limb of its own side, through the internal and external iliac arteries',
    ],
    simpul: [
    { nama: 'Common iliac artery.l', sisi: 'kiri', cabang: ['External iliac artery.l', 'Internal iliac artery.l'] },
    { nama: 'Common iliac artery.r', sisi: 'kanan', cabang: ['External iliac artery.r', 'Internal iliac artery.r'] },
    ],
  },
  {
    id: 'external-iliac',
    label: 'External iliac artery',
    kelompok: 'Pelvis',
    wilayah: [
      'Lower limb of its own side, continuing as the femoral artery',
      'Lower anterior abdominal wall, through the inferior epigastric artery',
    ],
    simpul: [
    { nama: 'External iliac artery.l', sisi: 'kiri', cabang: ['Inferior epigastric artery.l'] },
    { nama: 'External iliac artery.r', sisi: 'kanan', cabang: ['Inferior epigastric artery.r'] },
    ],
  },
  {
    id: 'internal-iliac',
    label: 'Internal iliac artery',
    kelompok: 'Pelvis',
    wilayah: [
      'Pelvic viscera',
      'Pelvic wall, perineum and gluteal region',
    ],
    simpul: [
    { nama: 'Internal iliac artery.l', sisi: 'kiri', cabang: ['Anterior division of internal iliac artery.l', 'Posterior division of internal iliac artery.l'] },
    { nama: 'Internal iliac artery.r', sisi: 'kanan', cabang: ['Anterior division of internal iliac artery.r', 'Posterior division of internal iliac artery.r'] },
    ],
  },
  {
    id: 'internal-pudendal',
    label: 'Internal pudendal artery',
    kelompok: 'Pelvis',
    wilayah: [
      'Perineum and external genitalia',
      'Anal canal below the pectinate line',
    ],
    simpul: [
    { nama: 'Internal pudendal artery.l', sisi: 'kiri', cabang: ['Deep artery of penis.l', 'Dorsal artery of penis.l'] },
    { nama: 'Internal pudendal artery.r', sisi: 'kanan', cabang: ['Deep artery of penis.r', 'Dorsal artery of penis.r'] },
    ],
  },
  {
    id: 'subclavian',
    label: 'Subclavian artery',
    kelompok: 'Upper limb',
    wilayah: [
      'Upper limb of its own side, continuing as the axillary artery',
      'Neck, and the posterior brain circulation through the vertebral artery',
      'Anterior chest wall, through the internal thoracic artery',
    ],
    simpul: [
    { nama: 'Left subclavian artery', sisi: 'kiri', cabang: ['Axillary artery.l', 'Costocervical trunk.l', 'Internal thoracic artery.l', 'Thyrocervical trunk.l', 'Vertebral artery.l'] },
    { nama: 'Right subclavian artery', sisi: 'kanan', cabang: ['Axillary artery.r', 'Costocervical trunk.r', 'Internal thoracic artery.r', 'Thyrocervical trunk.r', 'Vertebral artery.r'] },
    ],
  },
  {
    id: 'internal-thoracic',
    label: 'Internal thoracic artery',
    kelompok: 'Upper limb',
    wilayah: [
      'Anterior chest wall and the anterior intercostal spaces',
      'Upper anterior abdominal wall, through the superior epigastric artery',
    ],
    simpul: [
    { nama: 'Internal thoracic artery.l', sisi: 'kiri', cabang: ['Musculophrenic artery.l', 'Superior epigastric artery.l'] },
    { nama: 'Internal thoracic artery.r', sisi: 'kanan', cabang: ['Musculophrenic artery.r', 'Superior epigastric artery.r'] },
    ],
  },
  {
    id: 'axillary',
    label: 'Axillary artery',
    kelompok: 'Upper limb',
    wilayah: [
      'Shoulder region and the axilla',
      'Lateral chest wall and the breast',
      'Continues as the brachial artery in the arm',
    ],
    simpul: [
    { nama: 'Axillary artery.l', sisi: 'kiri', cabang: ['Anterior circumflex humeral artery.l', 'Brachial artery.l', 'Lateral thoracic artery.l', 'Posterior circumflex humeral artery.l', 'Subscapular artery.l', 'Thoraco-acromial artery.l'] },
    { nama: 'Axillary artery.r', sisi: 'kanan', cabang: ['Anterior circumflex humeral artery.r', 'Brachial artery.r', 'Lateral thoracic artery.r', 'Posterior circumflex humeral artery.r', 'Subscapular artery.r', 'Thoraco-acromial artery.r'] },
    ],
  },
  {
    id: 'brachial',
    label: 'Brachial artery',
    kelompok: 'Upper limb',
    wilayah: [
      'Arm — flexor and extensor compartments',
      'Divides at the elbow into the radial and ulnar arteries',
    ],
    simpul: [
    { nama: 'Brachial artery.l', sisi: 'kiri', cabang: ['Deep brachial artery.l', 'Inferior ulnar collateral artery.l', 'Radial artery.l', 'Superior ulnar collateral artery.l', 'Ulnar artery.l'] },
    { nama: 'Brachial artery.r', sisi: 'kanan', cabang: ['Deep brachial artery.r', 'Inferior ulnar collateral artery.r', 'Radial artery.r', 'Superior ulnar collateral artery.r', 'Ulnar artery.r'] },
    ],
  },
  {
    id: 'radial',
    label: 'Radial artery',
    kelompok: 'Upper limb',
    wilayah: [
      'Lateral side of the forearm',
      'Deep palmar arch of the hand',
    ],
    simpul: [
    { nama: 'Radial artery.l', sisi: 'kiri', cabang: ['Deep palmar arch.l', 'Dorsal carpal anastomosis.l', 'Palmar carpal branch of radial artery.l'] },
    { nama: 'Radial artery.r', sisi: 'kanan', cabang: ['Deep palmar arch.r', 'Dorsal carpal anastomosis.r', 'Palmar carpal branch of radial artery.r'] },
    ],
  },
  {
    id: 'ulnar',
    label: 'Ulnar artery',
    kelompok: 'Upper limb',
    wilayah: [
      'Medial side of the forearm',
      'Superficial palmar arch of the hand',
    ],
    simpul: [
    { nama: 'Ulnar artery.l', sisi: 'kiri', cabang: ['(Ulnar recurrent artery).l', 'Common interosseous artery.l', 'Dorsal carpal branch of ulnar artery.l', 'Superficial palmar arch.l'] },
    { nama: 'Ulnar artery.r', sisi: 'kanan', cabang: ['(Ulnar recurrent artery).r', 'Common interosseous artery.r', 'Dorsal carpal branch of ulnar artery.r', 'Superficial palmar arch.r'] },
    ],
  },
  {
    id: 'femoral',
    label: 'Femoral artery',
    kelompok: 'Lower limb',
    wilayah: [
      'Anterior thigh, and the rest of the thigh through the deep femoral artery',
      'Continues behind the knee as the popliteal artery',
    ],
    simpul: [
    { nama: 'Femoral artery.l', sisi: 'kiri', cabang: ['Deep external pudendal artery.l', 'Deep femoral artery.l', 'Popliteal artery.l', 'Superficial epigastric artery.l', 'Superficial external pudendal artery.l'] },
    { nama: 'Femoral artery.r', sisi: 'kanan', cabang: ['Deep external pudendal artery.r', 'Deep femoral artery.r', 'Popliteal artery.r', 'Superficial epigastric artery.r', 'Superficial external pudendal artery.r'] },
    ],
  },
  {
    id: 'deep-femoral',
    label: 'Deep femoral artery',
    kelompok: 'Lower limb',
    wilayah: [
      'Flexor, extensor and adductor muscles of the thigh',
      'Head and neck of the femur, through the circumflex femoral arteries',
    ],
    simpul: [
    { nama: 'Deep femoral artery.l', sisi: 'kiri', cabang: ['Lateral circumflex femoral artery.l', 'Medial circumflex femoral artery.l', 'Perforating femoral arteries.l'] },
    { nama: 'Deep femoral artery.r', sisi: 'kanan', cabang: ['Lateral circumflex femoral artery.r', 'Medial circumflex femoral artery.r', 'Perforating femoral arteries.r'] },
    ],
  },
  {
    id: 'popliteal',
    label: 'Popliteal artery',
    kelompok: 'Lower limb',
    wilayah: [
      'Knee joint, through the genicular arteries',
      'Divides into the anterior and posterior tibial arteries for the leg and foot',
    ],
    simpul: [
    { nama: 'Popliteal artery.l', sisi: 'kiri', cabang: ['Anterior tibial artery.l', 'Inferior lateral genicular artery.l', 'Inferior medial genicular artery.l', 'Middle genicular artery.l', 'Patellar anastomosis.l', 'Posterior tibial artery.l', 'Superior lateral genicular artery.l', 'Superior medial genicular artery.l'] },
    { nama: 'Popliteal artery.r', sisi: 'kanan', cabang: ['Anterior tibial artery.r', 'Inferior lateral genicular artery.r', 'Inferior medial genicular artery.r', 'Middle genicular artery.r', 'Patellar anastomosis.r', 'Posterior tibial artery.r', 'Superior lateral genicular artery.r', 'Superior medial genicular artery.r'] },
    ],
  },
  {
    id: 'anterior-tibial',
    label: 'Anterior tibial artery',
    kelompok: 'Lower limb',
    wilayah: [
      'Anterior (extensor) compartment of the leg',
      'Continues onto the dorsum of the foot as the dorsalis pedis artery',
    ],
    simpul: [
    { nama: 'Anterior tibial artery.l', sisi: 'kiri', cabang: ['Dorsalis pedis artery.l'] },
    { nama: 'Anterior tibial artery.r', sisi: 'kanan', cabang: ['Dorsalis pedis artery.r'] },
    ],
  },
  {
    id: 'posterior-tibial',
    label: 'Posterior tibial artery',
    kelompok: 'Lower limb',
    wilayah: [
      'Posterior (flexor) compartment of the leg',
      'Sole of the foot, through the medial and lateral plantar arteries',
    ],
    simpul: [
    { nama: 'Posterior tibial artery.l', sisi: 'kiri', cabang: ['Calcaneal branches of posterior tibial artery.l', 'Fibular artery.l', 'Lateral plantar artery.l', 'Medial plantar artery.l'] },
    { nama: 'Posterior tibial artery.r', sisi: 'kanan', cabang: ['Calcaneal branches of posterior tibial artery.r', 'Fibular artery.r', 'Lateral plantar artery.r', 'Medial plantar artery.r'] },
    ],
  },
  {
    id: 'fibular',
    label: 'Fibular artery',
    kelompok: 'Lower limb',
    wilayah: [
      'Lateral compartment of the leg',
      'Neighbouring muscles of the posterior compartment',
    ],
    simpul: [
    { nama: 'Fibular artery.l', sisi: 'kiri', cabang: ['Calcaneal branches of fibular artery.l'] },
    { nama: 'Fibular artery.r', sisi: 'kanan', cabang: ['Calcaneal branches of fibular artery.r'] },
    ],
  },
  {
    id: 'dorsalis-pedis',
    label: 'Dorsalis pedis artery',
    kelompok: 'Lower limb',
    wilayah: [
      'Dorsum of the foot',
      'Contributes to the deep plantar arch of the sole',
    ],
    simpul: [
    { nama: 'Dorsalis pedis artery.l', sisi: 'kiri', cabang: ['Arcuate artery.l', 'Deep plantar artery.l', 'Lateral tarsal artery.l'] },
    { nama: 'Dorsalis pedis artery.r', sisi: 'kanan', cabang: ['Arcuate artery.r', 'Deep plantar artery.r', 'Lateral tarsal artery.r'] },
    ],
  },
]

// Pembuluh yang DICARI dan memang tidak ada di berkas ini.
//
// Menutupi lubang dengan mencerminkan geometri atau menyorot pembuluh tetangga
// akan menghasilkan gambar yang meyakinkan dan salah. Jadi ketiadaannya
// dinyatakan, dan gerbang uji membuktikan bahwa ia memang tidak ada — kalau
// suatu hari berkasnya memuatnya, gerbangnya gagal dan daftar ini harus disusut.
export interface ArteriTakAda {
  nama: string
  /** Pola pencarian yang dipakai gerbang untuk membuktikan ketiadaannya. */
  pola: string
  keterangan: string
}

export const ARTERI_TIDAK_DIMUAT: ArteriTakAda[] = [
  {
    nama: 'Superior thyroid artery',
    pola: 'thyroid artery',
    keterangan:
      'The file models the inferior thyroid artery on both sides, but no superior thyroid artery.',
  },
  {
    nama: 'Lingual artery',
    pola: 'lingual',
    keterangan: 'No lingual artery is modelled; only the lingual vein is present.',
  },
  {
    nama: 'Uterine and ovarian arteries',
    pola: 'uterine|ovarian',
    keterangan:
      'This atlas models a male pelvis, so the uterine and ovarian arteries are not present at all.',
  },
]

/** Semua nama simpul glTF yang diikat katalog ini. */
export function namaSimpulArteri(): string[] {
  return ARTERI.flatMap((a) => a.simpul.map((s) => s.nama))
}

/** Arteri yang memiliki simpul dengan nama asli ini, kalau ada. */
export function arteriDariSimpul(namaAsli: string): Arteri | null {
  for (const a of ARTERI) for (const s of a.simpul) if (s.nama === namaAsli) return a
  return null
}

/** Sisi yang diikat sebuah nama simpul. */
export function sisiSimpul(namaAsli: string): SisiArteri | null {
  for (const a of ARTERI) for (const s of a.simpul) if (s.nama === namaAsli) return s.sisi
  return null
}

/**
 * Nama tampilan Inggris untuk sebuah nama simpul glTF: akhiran sisi ".l"/".r"
 * dibuang, titik ganda yang tersisa dirapikan. `id` tidak pernah diterjemahkan.
 */
export function labelSimpul(namaAsli: string): string {
  return namaAsli.replace(/\.+[lr]$/i, '').replace(/\.+$/, '').trim()
}

/** Cabang distal langsung sebuah arteri, sebagai label, tanpa duplikat sisi. */
export function cabangDistal(a: Arteri): string[] {
  const keluar: string[] = []
  for (const s of a.simpul) {
    for (const c of s.cabang) {
      const label = labelSimpul(c)
      if (!keluar.includes(label)) keluar.push(label)
    }
  }
  return keluar
}

/** Kelompok yang tampil di daftar, dalam urutan katalog. */
export function kelompokArteri(): string[] {
  const keluar: string[] = []
  for (const a of ARTERI) if (!keluar.includes(a.kelompok)) keluar.push(a.kelompok)
  return keluar
}

/** Batas yang WAJIB muncul di panel mana pun yang memakai katalog ini. */
export const BATAS_ARTERI = [
  'Supplied territories are standard gross anatomy. They vary between people, and neighbouring arteries overlap through collateral channels.',
  'This is a generic atlas model, not a scan of anybody. It cannot show where a lesion is, what an occlusion would do, or what any individual body looks like.',
  'Nothing here is a diagnosis, a prognosis, or a target for a procedure.',
  'Distal branches are the branches this atlas file models below the selected artery. The file is not a complete branch list, and some textbook branches are not present in it.',
]
