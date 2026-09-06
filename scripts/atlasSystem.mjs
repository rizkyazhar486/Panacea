// Pemotong ATLAS PER SPESIALISASI dari human-atlas (BodyParts3D 4.0).
//
// Pemotong organ (atlasOrgan.mjs) membuat satu organ per berkas, dan pemotong
// kardiovaskular (atlasCardio.mjs) membuat satu sistem penuh. Berkas ini
// menggeneralkan keduanya: tiap MODUL adalah satu bidang klinis, dengan
// struktur bernama yang cukup untuk menunjukkan letak penyakitnya — bukan
// seluruh 2.234 mesh, yang akan membuat berkasnya puluhan megabita dan tidak
// ada satu pun struktur yang bisa dibedakan.
//
// Jalankan:  node scripts/atlasSystem.mjs <folder-human-atlas>

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { bacaAtlas, ambilBagian, garisTengah, pusat, tulisGlb, HAK_CIPTA } from './atlasGlb.mjs'
import { bacaGlb, bacaOrganGlb, gabung, klaster } from './atlasBacaGlb.mjs'

const SUMBER = process.argv[2] ?? '/home/user/ashemag/human-atlas'
const KELUAR = new URL('../public/atlas/', import.meta.url).pathname

// Warna menurut JENIS JARINGAN, bukan menurut selera per modul: tulang yang
// sama harus berwarna sama entah ia muncul di modul ortopedi maupun di modul
// THT, kalau tidak orang harus belajar ulang kodenya tiap kali berpindah.
const WARNA = {
  bone: '#e8ded0',
  cartilage: '#cfd8dc',
  muscle: '#b4564f',
  viscera: '#c98a6b',
  gut: '#d19a6a',
  liver: '#9b5a4a',
  gland: '#d9a441',
  nerve: '#e6dfae',
  brain: '#cbb8b0',
  vessel: '#c0504d',
  vein: '#4f6fa8',
  airway: '#9fc0d4',
  eye: '#8aa9c8',
  skin: '#d8b49a',
  lymph: '#8fae86',
  repro: '#c58f9a',
  urine: '#b08fbf',
}

const jenisDari = (p) => {
  const n = p.name.toLowerCase()
  if (/bronch|trachea|larynx|epiglottis|conus elasticus/.test(n)) return 'airway'
  if (/cartilage|meniscus|disc|labrum/.test(n)) return 'cartilage'
  if (/artery|arteri|aorta|trunk of (left|right) coronary/.test(n)) return 'vessel'
  if (/vein|venous|sinus$/.test(n)) return 'vein'
  if (/nerve|ganglion|plexus|chiasm|tract$/.test(n)) return 'nerve'
  if (/gyrus|cerebell|thalamus|callosum|nucleus|amygdala|hippocamp|cortex of|pallidus|putamen|claustrum|insula|operculum|colliculus|pons|medulla|midbrain|fornix|commissure|ventricle$|cerebral aqueduct|septum of telencephalon|habenula|lamina terminalis|interpeduncular/.test(n)) return 'brain'
  if (/kidney|ureter|bladder|urethra|renal/.test(n)) return 'urine'
  if (/testis|epididymis|prostate|seminal|deferent|penis|glans/.test(n)) return 'repro'
  if (/liver|hepat|gallbladder|bile|biliary|cystic duct/.test(n)) return 'liver'
  if (/stomach|duoden|jejun|ileum|colon|caecum|cecum|rectum|appendix|oesoph|esophag|anal|mesent|omentum|peritone/.test(n)) return 'gut'
  if (/adrenal|pituitary|pineal|thymus|pancrea|lacrimal gland|parotid|submandibular|sublingual/.test(n)) return 'gland'
  if (/spleen|lymph|tonsil/.test(n)) return 'lymph'
  if (/cornea|sclera|iris|lens|retina|choroid|vitreous|ciliaris|eyelid|eyeball|tarsal plate/.test(n)) return 'eye'
  if (/skin|hair|eyebrow|^lip$/.test(n)) return 'skin'
  if (p.system === 'skeletal') return 'bone'
  if (p.system === 'muscular') return 'muscle'
  return 'viscera'
}

/**
 * Tiap modul menyebut pola nama yang ia butuhkan. Aturannya satu: struktur
 * yang TIDAK bisa ditunjuk saat menjelaskan penyakit tidak perlu diikutkan —
 * berkas yang besar membuat halamannya lambat, dan lambat berarti tidak dibuka.
 */
const MODUL = {
  respirasi: {
    label: 'Respiratory',
    pola: [
      /^trachea$/, /bronchus/, /bronchial tree$/, /^diaphragm$/, /^epiglottis$/,
      /cricoid cartilage|thyroid cartilage|arytenoid cartilage/, /vocal (ligament|fold)/,
      /pharyngeal constrictor/, /intercostal muscle/, /^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth) (left|right) rib$/,
      /^(left|right) rib$/, /rib$/, /^sternum$|^body of sternum$|^manubrium$|^xiphoid/,
    ],
  },
  gastro: {
    label: 'Gastrointestinal & hepatobiliary',
    pola: [
      /^stomach$/, /^duodenum$/, /part of (jejunum|ileum)$/, /^(ascending|transverse|descending|sigmoid) colon$/,
      /^caecum$|^cecum$/, /^appendix$/, /^rectum$/, /^esophagus$/, /^oesophagus$/,
      /lobe of liver$/, /^liver$/, /^gallbladder$/, /^cystic duct$/, /^common hepatic duct$/,
      /^bile duct$|^common bile duct$/, /^pancreas$/, /^parenchyma of pancreas$/, /^spleen$/,
      /hepatic portal vein$/, /^superior mesenteric artery$/, /^celiac trunk$/, /anal sphincter$/,
    ],
  },
  nefrologi: {
    label: 'Kidney & urinary tract',
    pola: [
      /^(left|right) kidney$/, /^(left|right) ureter$/, /^urinary bladder$/, /^urethra$/,
      /^(left|right) renal (artery|vein)$/, /^abdominal aorta$/, /^inferior vena cava$/,
      /^(left|right) adrenal gland$/,
    ],
  },
  endokrin: {
    label: 'Endocrine & metabolic',
    pola: [
      /^pituitary gland$/, /^pineal body$/, /^(left|right) adrenal gland$/, /^pancreas$/,
      /^parenchyma of pancreas$/, /lobe of thymus$/, /^(left|right) testis$/, /^hypothalamus$/,
      /^(left|right) kidney$/, /lobe of liver$/,
    ],
  },
  neurologi: {
    label: 'Brain & nerves',
    pola: [
      /gyrus$/, /^cerebellum$/, /^corpus callosum$/, /^hypothalamus$/, /^(left|right) thalamus$/,
      /^(left|right) (caudate nucleus|putamen|globus pallidus|amygdala|hippocampus|claustrum|insula)$/,
      /^(pons|midbrain|medulla oblongata)$/, /peduncle of midbrain/, /colliculus$/,
      /^(third|fourth|left lateral|right lateral) ventricle$/, /^cerebral aqueduct$/,
      /^(left|right) optic nerve$/, /^optic chiasm$/, /optic tract$/, /oculomotor nerve$/,
      /trigeminal|facial nerve$|vestibulocochlear|vagus nerve$|hypoglossal nerve$|accessory nerve$/,
      /^(left|right) internal carotid artery$/, /^basilar artery$/, /middle cerebral artery$/,
    ],
  },
  tht: {
    label: 'Ear, nose & throat',
    pola: [
      /^external ear$/, /nasal cartilage$/, /nasal concha$/, /^vomer$/, /nasal bone$/,
      /pharyng/, /^epiglottis$/, /^soft palate$/, /^uvula$/, /cricoid cartilage|thyroid cartilage|arytenoid cartilage|corniculate|cuneiform cartilage/,
      /vocal (ligament|fold|is)$/, /^tongue$/, /^(left|right) (parotid|submandibular|sublingual) gland$/,
      /^trachea$/, /^(left|right) palatine tonsil$/, /^mandible$/, /^maxilla$/,
    ],
  },
  mata: {
    label: 'Eye & orbit',
    pola: [
      /^(left|right) (cornea|iris|lens|sclera|choroid|vitreous body|corona ciliaris)$/,
      /^optic part of (left|right) retina$/, /^anterior chamber of (left|right) eyeball$/,
      /^(left|right) optic nerve$/, /^optic chiasm$/,
      // "oblique" tanpa batas ikut menarik obliquus abdominis, dan "orbital"
      // ikut menarik girus orbitalis di otak — dua struktur yang sama sekali
      // bukan bagian mata.
      /^(left|right) (superior|inferior|medial|lateral) rectus$/,
      /^(left|right) (superior|inferior) oblique$/,
      /levator palpebrae superioris$/, /lacrimal (gland|sac|canaliculus)$/, /nasolacrimal duct$/,
      /tarsal plate of (left|right) (upper|lower) eyelid$/,
    ],
  },
  ortopedi: {
    label: 'Bones, joints & muscles',
    pola: [
      /^(left|right) (femur|tibia|fibula|humerus|radius|ulna|patella|scapula|clavicle|hip bone)$/,
      /^sacrum$|^coccyx$/, /vertebra$/, /^atlas$|^axis$/, /rib$/, /sternum$/,
      /^(left|right) (deltoid|biceps brachii|triceps brachii|gluteus maximus|gluteus medius|rectus femoris|biceps femoris|gastrocnemius|soleus|tibialis anterior|supraspinatus|latissimus dorsi|rectus abdominis)$/,
      /part of (left|right) (trapezius|deltoid|pectoralis major)$/, /calcaneal tendon$/,
      /iliotibial tract$/, /interosseous membrane of (left|right) (leg|forearm)$/,
    ],
  },
  urogenital: {
    label: 'Urogenital & andrology',
    pola: [
      /^prostate$/, /^(left|right) (testis|epididymis|seminal vesicle|deferent duct)$/,
      /corpus (cavernosum|spongiosum) of penis$/, /^glans penis$/, /^urinary bladder$/,
      /^urethra$/, /^(left|right) ureter$/, /^(left|right) kidney$/,
    ],
  },
  obstetri: {
    label: 'Pelvis (obstetrics & gynaecology)',
    pola: [
      /^(left|right) hip bone$/, /^sacrum$/, /^coccyx$/, /^(fourth|fifth) lumbar vertebra$/,
      /^urinary bladder$/, /^rectum$/, /^urethra$/, /levator ani|coccygeus|obturator internus/,
      /^(left|right) (internal|external|common) iliac (artery|vein)$/,
    ],
  },
  imunologi: {
    label: 'Immune, blood & lymphoid',
    pola: [/^spleen$/, /lobe of thymus$/, /lymph/, /^(left|right) femur$/, /^sternum$/, /^(left|right) hip bone$/],
  },
  kulit: {
    label: 'Skin & integument',
    pola: [/^skin$/, /^hair of head$/, /^eyebrow$/, /^lip$/, /^pubic hair$/],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MODUL DARI SUMBER LAIN
//
// Empat hal yang dulu saya nyatakan tidak ada memang tidak ada di BodyParts3D
// versi human-atlas — tapi ADA di dua sumber lain yang sudah/boleh dipakai:
//
//   Z-Anatomy (CC BY-SA 4.0, sudah dipakai figur tubuh utuh di aplikasi ini)
//     kelenjar tiroid & paratiroid, lobus paru dan pleura, tulang pendengaran,
//     gendang telinga, koklea, dan saraf-sarafnya.
//   HuBMAP Human Reference Atlas (CC BY 4.0)
//     rujukan PEREMPUAN: rahim, ovarium, tuba uterina, vagina, ligamen, dan
//     panggul perempuan.
//
// Tiap sumber punya ruang koordinatnya sendiri, dan menggabungkan dua ruang di
// dalam satu modul akan menempatkan organ di tempat yang salah. Karena itu
// modul-modul ini berdiri SENDIRI, tidak dicampur ke modul BodyParts3D — bukan
// karena lebih mudah, tapi karena satu-satunya cara untuk menggabungkannya
// adalah menebak transformasinya, dan tebakan pada atlas anatomi adalah
// kebohongan yang terlihat rapi.
// ─────────────────────────────────────────────────────────────────────────────

const Z = (n) => new URL(`../public/anatomy/${n}.glb`, import.meta.url).pathname
const HRA = '/home/user/hubmapconsortium/ccf-3d-reference-object-library/VH_Female/v1.2/'
const HRA_13 = '/home/user/hubmapconsortium/ccf-3d-reference-object-library/VH_Female/v1.3/'
const HRA_M = '/home/user/hubmapconsortium/ccf-3d-reference-object-library/VH_Male/v1.2/'

/**
 * Nama Z-Anatomy menjadi nama yang dibaca orang.
 *
 * Akhiran "l" dan "r" pada Z-Anatomy menandai sisi kiri dan kanan, tapi menebak
 * dari huruf terakhir tidak bisa diandalkan: "Cochleal" adalah koklea kiri
 * sementara "Cochlear" adalah koklea kanan, dan keduanya juga kata sifat yang
 * sah dalam bahasa Inggris. Struktur yang dipakai modul karena itu diberi nama
 * secara EKSPLISIT; tebakan hanya dipakai untuk sisanya.
 */
const NAMA_Z = {
  Cochleal: 'Left cochlea', Cochlear: 'Right cochlea',
  Vestibulel: 'Left vestibule', Vestibuler: 'Right vestibule',
  Tympanic_membranel: 'Left tympanic membrane', Tympanic_membraner: 'Right tympanic membrane',
  Chorda_tympanil: 'Left chorda tympani', Chorda_tympanir: 'Right chorda tympani',
  Cochlear_nervel: 'Left cochlear nerve', Cochlear_nerver: 'Right cochlear nerve',
  Vestibular_nervel: 'Left vestibular nerve', Vestibular_nerver: 'Right vestibular nerve',
  'Vestibulocochlear_nerve_(VIII)l': 'Left vestibulocochlear nerve',
  'Vestibulocochlear_nerve_(VIII)r': 'Right vestibulocochlear nerve',
  Malleusl: 'Left malleus', Malleusr: 'Right malleus',
  Incusl: 'Left incus', Incusr: 'Right incus',
  Stapesl: 'Left stapes', Stapesr: 'Right stapes',
  Temporal_bonel: 'Left temporal bone', Temporal_boner: 'Right temporal bone',
  Superior_parathyroid_glandl: 'Left superior parathyroid gland',
  Superior_parathyroid_glandr: 'Right superior parathyroid gland',
  Inferior_parathyroid_glandl: 'Left inferior parathyroid gland',
  Inferior_parathyroid_glandr: 'Right inferior parathyroid gland',
  Thyroid_gland: 'Thyroid gland', Thyroid_cartilage: 'Thyroid cartilage',
  Cricoid_cartilage: 'Cricoid cartilage', Hyoid_bone: 'Hyoid bone',
  Oesophagus: 'Oesophagus', Trachea: 'Trachea',
  Left_main_bronchus: 'Left main bronchus', Right_main_bronchus: 'Right main bronchus',
}

function rapikanZ(n) {
  const bersih = n.replace(/_instance_\d+$/, '').replace(/_\d+$/, '')
  if (NAMA_Z[bersih]) return NAMA_Z[bersih]
  const s = bersih.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Nama HuBMAP HRA menjadi nama yang dibaca orang: "VH_F_meniscus_L" menjadi
 * "Left meniscus". Awalan VH_F_ hanyalah penanda berkas rujukan, dan akhiran
 * _L/_R adalah sisi — keduanya bukan bagian dari nama anatominya.
 */
// Beberapa nama HRA disingkat atau bernomor di berkasnya; ditulis ulang di
// sini supaya yang terbaca pengguna adalah istilah anatominya, bukan singkatan
// internal berkas.
const NAMA_HRA = {
  papillary_muscle_of_heart_ant: 'Anterior papillary muscle',
  papillary_muscle_of_heart_antlat: 'Anterolateral papillary muscle',
  papillary_muscle_of_heart_med: 'Medial papillary muscle',
  papillary_muscle_of_heart_pos: 'Posterior papillary muscle',
  papillary_muscle_of_heart_posmed: 'Posteromedial papillary muscle',
  fundus_of_urinary_bladder_dome: 'Dome of urinary bladder',
  fundus_of_urinary_bladder_base1: 'Base of urinary bladder',
  urinary_bladder_neck_smooth_muscle: 'Bladder neck smooth muscle',
  other_urethra: 'Membranous and penile urethra',
  'transition_zone__of_prostate_L': 'Left transition zone of prostate',
  'transition_zone_of_prostate_R': 'Right transition zone of prostate',
}

function rapikanHra(n) {
  let s = n.replace(/^VH_[FM]_/, '')
  if (NAMA_HRA[s]) return NAMA_HRA[s]
  let sisi = ''
  const m = s.match(/_(L|R)$/)
  if (m) { sisi = m[1] === 'L' ? 'Left ' : 'Right '; s = s.slice(0, -2) }
  s = s.replace(/^(left|right)_/i, (x) => { sisi = x.toLowerCase().startsWith('left') ? 'Left ' : 'Right '; return '' })
  s = s.replace(/_/g, ' ').trim()
  return (sisi + s).replace(/^(.)/, (c) => c.toUpperCase())
}

const MODUL_GLB = {
  paru: {
    label: 'Lungs & pleura',
    asal: 'z-anatomy',
    isi: [
      { berkas: Z('visceral'), pola: /^(Superior|Middle|Inferior)_lobe_of_(left|right)_lung$/, kind: 'viscera', sel: 0.003 },
      { berkas: Z('visceral'), pola: /^Pleura$/, kind: 'viscera', sel: 0.005 },
      { berkas: Z('visceral'), pola: /^(Trachea|Left_main_bronchus|Right_main_bronchus)$/, kind: 'airway', sel: 0.0015 },
      { berkas: Z('visceral'), pola: /^(Left|Right)_(superior|inferior|middle)_lobar_bronchus$/, kind: 'airway', sel: 0.0015 },
    ],
  },
  tiroid: {
    label: 'Thyroid & parathyroid',
    asal: 'z-anatomy',
    isi: [
      { berkas: Z('visceral'), pola: /^Thyroid_gland$/, kind: 'gland' },
      { berkas: Z('visceral'), pola: /^(Superior|Inferior)_parathyroid_gland[lr]$/, kind: 'gland' },
      { berkas: Z('visceral'), pola: /^(Trachea|Oesophagus)$/, kind: 'airway', sel: 0.001 },
      { berkas: Z('skeletal'), pola: /^(Thyroid_cartilage|Cricoid_cartilage|Hyoid_bone)$/, kind: 'cartilage' },
    ],
  },
  telinga: {
    label: 'Middle & inner ear',
    asal: 'z-anatomy',
    isi: [
      { berkas: Z('skeletal'), pola: /^(Malleus|Incus|Stapes)[lr]$/, kind: 'bone' },
      { berkas: Z('nervous'), pola: /^(Tympanic_membrane|Cochlea|Vestibule)[lr]$/, kind: 'viscera' },
      { berkas: Z('nervous'), pola: /^(Cochlear_nerve|Vestibular_nerve|Chorda_tympani)[lr]$/, kind: 'nerve' },
      { berkas: Z('nervous'), pola: /^Vestibulocochlear_nerve_\(VIII\)[lr]$/, kind: 'nerve', sel: 0.0005 },
      { berkas: Z('skeletal'), pola: /^Temporal_bone[lr]$/, kind: 'bone', sel: 0.002 },
    ],
  },
  lutut: {
    label: 'Knee joint',
    asal: 'hra-female',
    isi: [
      { berkas: HRA + 'VH_F_Knee_L.glb', perMesh: true, kind: 'bone', sel: 0.0008 },
      { berkas: HRA + 'VH_F_Ligaments_Knee_L.glb', perMesh: true, kind: 'connective', sel: 0.0008 },
      { berkas: HRA + 'VH_F_Muscles_Knee_L.glb', perMesh: true, kind: 'muscle', sel: 0.0015 },
    ],
  },
  payudara: {
    label: 'Breast',
    asal: 'hra-female',
    isi: [
      { berkas: HRA_13 + 'VH_F_mammary_gland_L.glb', perMesh: true, kind: 'gland', sel: 0.0025 },
      { berkas: HRA_13 + 'VH_F_mammary_gland_R.glb', perMesh: true, kind: 'gland', sel: 0.0025 },
    ],
  },
  'medula-spinalis': {
    label: 'Spinal cord',
    asal: 'hra-female',
    isi: [
      { berkas: HRA + 'VH_F_Spinal_Cord.glb', perMesh: true, kind: 'nerve', sel: 0.0009 },
    ],
  },
  'jantung-ruang': {
    label: 'Heart chambers & valves',
    asal: 'hra-female',
    isi: [
      { berkas: HRA + 'VH_F_Heart.glb', perMesh: true, kind: 'chamber', sel: 0.0012 },
    ],
  },
  bilier: {
    label: 'Biliary tree & pancreatic ducts',
    asal: 'hra-female',
    isi: [
      { berkas: HRA + 'VH_F_Biliary_Tree.glb', perMesh: true, kind: 'liver' },
      { berkas: HRA + 'VH_F_Gallbladder.glb', perMesh: true, kind: 'liver' },
      { berkas: HRA + 'VH_F_Pancreas.glb', perMesh: true, kind: 'gland', sel: 0.0015 },
      { berkas: HRA + 'VH_F_Liver.glb', perMesh: true, kind: 'liver', sel: 0.004 },
    ],
  },
  prostat: {
    label: 'Prostate zones & bladder',
    asal: 'hra-male',
    isi: [
      { berkas: HRA_M + 'VH_M_Prostate.glb', perMesh: true, kind: 'repro', sel: 0.0008 },
      { berkas: HRA_M + 'VH_M_Urinary_Bladder.glb', perMesh: true, kind: 'urine', sel: 0.0015 },
      { berkas: HRA_M + 'VH_M_Urethra.glb', perMesh: true, kind: 'urine', sel: 0.0008 },
    ],
  },
  obgin: {
    label: 'Female pelvis (obstetrics & gynaecology)',
    asal: 'hra-female',
    isi: [
      { berkas: HRA + 'VH_F_Uterus.glb', nama: 'Uterus', kind: 'repro', sel: 0.0015 },
      { berkas: HRA + 'VH_F_Ovary_L.glb', nama: 'Left ovary', kind: 'repro' },
      { berkas: HRA + 'VH_F_Ovary_R.glb', nama: 'Right ovary', kind: 'repro' },
      { berkas: HRA + 'VH_F_Fallopian_Tube_L.glb', nama: 'Left uterine tube', kind: 'repro', sel: 0.001 },
      { berkas: HRA + 'VH_F_Fallopian_Tube_R.glb', nama: 'Right uterine tube', kind: 'repro', sel: 0.001 },
      { berkas: HRA + 'VH_F_Vagina.glb', nama: 'Vagina', kind: 'repro', sel: 0.0015 },
      { berkas: HRA + 'VH_F_Urinary_Bladder.glb', nama: 'Urinary bladder', kind: 'urine', sel: 0.0015 },
      { berkas: HRA + 'VH_F_Ligaments_Uterus_Ovaries.glb', nama: 'Ligaments of uterus and ovaries', kind: 'connective', sel: 0.002 },
      { berkas: HRA + 'VH_F_Pelvis.glb', nama: 'Female bony pelvis', kind: 'bone', sel: 0.003 },
    ],
  },
}

const HAK_CIPTA_Z =
  'Z-Anatomy (CC BY-SA 4.0), derived from BodyParts3D (c) The Database Center for Life Science'
const HAK_CIPTA_HRA =
  'HuBMAP Human Reference Atlas, 3D Reference Organ Set for Female (CC BY 4.0)'

const { atlas, potongan } = bacaAtlas(SUMBER)

mkdirSync(KELUAR, { recursive: true })
const ringkas = []
const semuaBagian = []

for (const [id, m] of Object.entries(MODUL)) {
  const sudah = new Set()
  const cocok = atlas.parts.filter((p) => {
    const n = p.name.toLowerCase()
    if (!m.pola.some((r) => r.test(n))) return false
    if (sudah.has(n)) return false     // beberapa nama muncul dua kali di sumber
    sudah.add(n)
    return true
  })
  if (!cocok.length) { console.warn(`lewat ${id}: tidak ada bagian cocok`); continue }

  const data = cocok.map((p) => ({ ...ambilBagian(potongan, p), warna: WARNA[jenisDari(p)] }))

  // Dipusatkan sebagai SATU kesatuan: letak antar struktur adalah setengah dari
  // yang sedang diajarkan, jadi tidak boleh masing-masing digeser ke tengah.
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (const d of data) for (let i = 0; i < d.pos.length; i += 3)
    for (let a = 0; a < 3; a++) { const v = d.pos[i + a]; if (v < min[a]) min[a] = v; if (v > max[a]) max[a] = v }
  const rentang = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1
  const skala = 2 / rentang
  const tengah = [0, 1, 2].map((a) => (min[a] + max[a]) / 2)
  for (const d of data) for (let i = 0; i < d.pos.length; i += 3)
    for (let a = 0; a < 3; a++) d.pos[i + a] = (d.pos[i + a] - tengah[a]) * skala

  const bytes = tulisGlb(join(KELUAR, `${id}.glb`), data, HAK_CIPTA)
  const tri = cocok.reduce((s, p) => s + p.indexCount / 3, 0)

  cocok.forEach((p, i) => {
    semuaBagian.push({
      name: p.name,
      module: id,
      kind: jenisDari(p),
      color: WARNA[jenisDari(p)],
      centroid: pusat(data[i]),
      line: garisTengah(data[i], 6),
      triangles: p.indexCount / 3,
      source: 'bodyparts3d',
    })
  })
  ringkas.push({ id, label: m.label, struktur: cocok.length, tri, kb: Math.round(bytes / 1024) })
}

// ── Modul dari berkas GLB (Z-Anatomy dan HRA) ────────────────────────────────
for (const [id, m] of Object.entries(MODUL_GLB)) {
  const data = []
  for (const bagian of m.isi) {
    let mesh = []
    if (bagian.pola) {
      mesh = await bacaOrganGlb(bagian.berkas, bagian.pola)
      mesh = mesh.map((x) => ({ ...x, nama: rapikanZ(x.nama) }))
    } else if (bagian.perMesh) {
      // Satu berkas berisi BANYAK struktur bernama (lutut, payudara, medula
      // spinalis): tiap mesh berdiri sendiri sebagai struktur yang bisa
      // disorot, bukan dilebur menjadi satu gumpalan.
      mesh = (await bacaGlb(bagian.berkas)).map((x) => ({ ...x, nama: rapikanHra(x.nama) }))
    } else {
      // Satu berkas = satu organ (bentuk berkas HRA). Dibaca sebagai DAFTAR
      // MESH DATAR, bukan lewat pencocokan nama simpul: mencocokkan semua nama
      // akan mengambil simpul induk dan anaknya sekaligus, dan geometri yang
      // sama terhitung dua kali.
      const semua = await bacaGlb(bagian.berkas)
      if (!semua.length) continue
      mesh = [gabung(bagian.nama, semua)]
    }
    for (let x of mesh) {
      if (bagian.sel) x = klaster(x, bagian.sel)
      if (!x.idx.length) continue
      data.push({ ...x, warna: WARNA[bagian.kind] ?? WARNA.viscera, kind: bagian.kind })
    }
  }
  if (!data.length) { console.warn(`lewat ${id}: tidak ada mesh`); continue }

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (const d of data) for (let i = 0; i < d.pos.length; i += 3)
    for (let a = 0; a < 3; a++) { const v = d.pos[i + a]; if (v < min[a]) min[a] = v; if (v > max[a]) max[a] = v }
  const rentang = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1
  const skala = 2 / rentang
  const tengah = [0, 1, 2].map((a) => (min[a] + max[a]) / 2)
  for (const d of data) for (let i = 0; i < d.pos.length; i += 3)
    for (let a = 0; a < 3; a++) d.pos[i + a] = (d.pos[i + a] - tengah[a]) * skala

  const bytes = tulisGlb(join(KELUAR, `${id}.glb`), data, m.asal.startsWith('hra') ? HAK_CIPTA_HRA : HAK_CIPTA_Z)
  let tri = 0
  for (const d of data) {
    tri += d.idx.length / 3
    semuaBagian.push({
      name: d.nama, module: id, kind: d.kind, color: d.warna,
      centroid: pusat(d), line: garisTengah(d, 6), triangles: d.idx.length / 3, source: m.asal,
    })
  }
  ringkas.push({ id, label: m.label, struktur: data.length, tri, kb: Math.round(bytes / 1024) })
}

writeFileSync(new URL('../src/lib/systemAtlas.gen.ts', import.meta.url).pathname,
`// DIBANGKITKAN oleh scripts/atlasSystem.mjs — jangan disunting tangan.
//
// Struktur bernama untuk tiap modul spesialisasi, dipotong dari BodyParts3D 4.0
// (Database Center for Life Science, CC BY 4.0). Nama di sini SAMA PERSIS
// dengan nama mesh di /atlas/<modul>.glb, sehingga menyorot satu struktur cukup
// dengan mencocokkan namanya.
export interface AtlasPart {
  name: string
  module: string
  kind: string
  color: string
  /** Dari sumber geometri mana bagian ini datang. */
  source: 'bodyparts3d' | 'z-anatomy' | 'hra-female' | 'hra-male'
  centroid: [number, number, number]
  line: [number, number, number][]
  triangles: number
}

export const ATLAS_PARTS: AtlasPart[] = ${JSON.stringify(semuaBagian)} as unknown as AtlasPart[]

export const ATLAS_MODULE_INFO: Record<string, { label: string; structures: number; kb: number }> =
  ${JSON.stringify(Object.fromEntries(ringkas.map((r) => [r.id, { label: r.label, structures: r.struktur, kb: r.kb }])), null, 2)}

export function partsForModule(module: string): AtlasPart[] {
  return ATLAS_PARTS.filter((p) => p.module === module)
}

export const ATLAS_BY_NAME: Record<string, AtlasPart> = Object.fromEntries(
  ATLAS_PARTS.map((p) => [p.module + '::' + p.name.toLowerCase(), p]),
)
`)

console.table(ringkas)
console.log('total struktur', semuaBagian.length)
