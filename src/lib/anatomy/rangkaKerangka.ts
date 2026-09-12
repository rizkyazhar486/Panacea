// Kerangka sebagai daftar tulang yang bisa DITUNJUK, bukan daftar istilah.
//
// skeletal.glb mengirim 278 node bergeometri dengan nama anatomis yang rapi
// ("Femur.l", "Vertebra T1", "First metatarsal bone.r"). Yang belum ada adalah
// jembatan antara nama-nama itu dan cara orang benar-benar memikirkan kerangka:
// per kelompok — gelang bahu, lengan bawah, pergelangan tangan, kolumna
// vertebralis per wilayah.
//
// EMPAT JEBAKAN berkas ini, semuanya gagal TANPA galat apa pun:
//
//   1. GLTFLoader membuang titik pemisah, jadi "Femur.l" dan "Femur.r" tiba di
//      scene dengan nama yang sama. Pencocokan harus memakai nama ASLI dari
//      gltf.parser.associations, bukan nama scene.
//
//   2. Tiga nama tengkorak — "Frontal bone", "Ethmoid bone", "Sphenoid bone" —
//      adalah node PIVOT tanpa mesh sendiri; geometrinya ada di anak yang tidak
//      bernama. Mengikatnya seperti tulang biasa akan menghasilkan kelompok
//      yang "terikat" tetapi tidak pernah menyala. Karena itu ketiganya harus
//      dinyatakan eksplisit lewat `meshViaAnak`, dan gerbang uji memeriksa
//      bahwa anak-anak itu memang membawa geometri.
//
//   3. Sisi kiri dan kanan pada berkas ini MEMAKAI INDEKS MESH YANG SAMA;
//      yang membedakan hanya node dan transformasinya (skala X negatif untuk
//      sisi kiri). Jadi bukti "dua sisi terikat" adalah dua NODE berbeda dengan
//      tanda X berlawanan, bukan dua indeks mesh berbeda.
//
//   4. Nama yang salah ketik tidak menimbulkan galat — ia hanya diam. Semua
//      nama di bawah diperiksa terhadap berkasnya oleh scripts/uji.
//
// BATAS: ini anatomi rujukan pada kerangka dewasa umum. Bukan pencitraan,
// bukan kerangka seseorang, dan tidak menyimpulkan apa pun tentang cedera,
// patah tulang, atau penanganannya.

export interface KelompokTulang {
  id: string
  /** Nama kelompok dalam bahasa Inggris. */
  label: string
  wilayah: WilayahRangka
  /** Satu kalimat bahasa Inggris tentang apa kelompok ini. */
  ringkas: string
  /** Nama node PERSIS seperti di skeletal.glb. */
  mesh: readonly string[]
  /**
   * Bagian dari `mesh` yang geometrinya ada di node anak tanpa nama.
   * Harus dinyatakan, supaya node pivot tanpa mesh tidak bisa lolos diam-diam.
   */
  meshViaAnak?: readonly string[]
  /** Benar bila kelompok ini punya pasangan kiri dan kanan. */
  berpasangan: boolean
  /** Sendi utama yang dibentuk tulang-tulang ini. */
  artikulasi: readonly string[]
}

export type WilayahRangka = 'Axial skeleton' | 'Upper limb' | 'Lower limb'

export const WILAYAH_RANGKA: readonly WilayahRangka[] = [
  'Axial skeleton', 'Upper limb', 'Lower limb',
]

export const BERKAS_KERANGKA = 'anatomy/skeletal.glb'

// Node hiasan pada berkasnya — bukan tulang, dan tidak boleh ikut tampil.
export const NODE_BUKAN_TULANG: readonly string[] = ['HOW TO ...', 'Take a picture']

/** Dua sisi dari satu nama dasar, seperti penulisan di berkasnya. */
function duaSisi(...dasar: string[]): string[] {
  return dasar.flatMap((n) => [`${n}.l`, `${n}.r`])
}

const JARI_TANGAN = ['first', 'second', 'third', 'fourth', 'fifth']
const URUT_IGA = [
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth',
  'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth',
]

export const KELOMPOK_TULANG: readonly KelompokTulang[] = [
  // ── Rangka aksial ───────────────────────────────────────────────────────
  {
    id: 'cranial-vault',
    label: 'Cranial vault and base',
    wilayah: 'Axial skeleton',
    ringkas: 'The braincase: the roof and floor that enclose the brain.',
    mesh: [
      'Frontal bone', 'Occipital bone', 'Sphenoid bone', 'Ethmoid bone',
      ...duaSisi('Parietal bone', 'Temporal bone'),
    ],
    // Ketiganya node pivot; geometrinya di anak tanpa nama.
    meshViaAnak: ['Frontal bone', 'Sphenoid bone', 'Ethmoid bone'],
    berpasangan: true,
    artikulasi: [
      'Coronal suture (frontal–parietal)',
      'Sagittal suture (parietal–parietal)',
      'Lambdoid suture (parietal–occipital)',
      'Atlanto-occipital joint (occipital condyles–atlas)',
    ],
  },
  {
    id: 'facial-skeleton',
    label: 'Facial skeleton',
    wilayah: 'Axial skeleton',
    ringkas: 'The bones of the face, orbit and nasal cavity, excluding the mandible.',
    mesh: [
      'Vomer',
      ...duaSisi(
        'Maxilla', 'Zygomatic bone', 'Nasal bone', 'Lacrimal bone',
        'Palatine bone', 'Inferior nasal concha bone',
      ),
    ],
    berpasangan: true,
    artikulasi: [
      'Zygomaticomaxillary suture',
      'Intermaxillary suture at the midline palate',
      'Zygomaticotemporal suture (zygomatic arch)',
    ],
  },
  {
    id: 'mandible',
    label: 'Mandible',
    wilayah: 'Axial skeleton',
    ringkas: 'The only freely mobile bone of the skull.',
    mesh: ['Mandible'],
    berpasangan: false,
    artikulasi: ['Temporomandibular joint (mandibular condyle–temporal bone)'],
  },
  {
    id: 'paranasal-spaces',
    label: 'Paranasal sinuses and ethmoid cells',
    wilayah: 'Axial skeleton',
    ringkas: 'Air spaces carried inside the cranial and facial bones.',
    mesh: [
      'Sinus of frontal bone', 'Sinus of sphenoid bone',
      ...duaSisi(
        'Anterior cells of ethmoid bone',
        'Middle cells of ethmoid bone',
        'Posterior cells of ethmoid bone',
      ),
    ],
    berpasangan: true,
    artikulasi: [
      'Not joints — these are cavities that drain into the nasal meatuses',
    ],
  },
  {
    id: 'dentition',
    label: 'Teeth',
    wilayah: 'Axial skeleton',
    ringkas: 'The dentition carried by this model: incisors to second molars.',
    mesh: duaSisi(
      'Upper medial incisor', 'Upper lateral incisor', 'Upper canine',
      'Upper first premolar', 'Upper second premolar',
      'Upper first molar tooth', 'Upper second molar tooth',
      'Lower medial incisor', 'Lower lateral incisor', 'Lower canine',
      'Lower first premolar', 'Lower second premolar',
      'Lower first molar tooth', 'Lower second molar tooth',
    ),
    berpasangan: true,
    artikulasi: ['Gomphosis — each root is held in its socket by the periodontal ligament'],
  },
  {
    id: 'auditory-ossicles',
    label: 'Auditory ossicles',
    wilayah: 'Axial skeleton',
    ringkas: 'The three smallest bones in the body, inside the middle ear.',
    mesh: duaSisi('Malleus', 'Incus', 'Stapes'),
    berpasangan: true,
    artikulasi: [
      'Incudomallear joint',
      'Incudostapedial joint',
      'Stapediovestibular joint (stapes footplate in the oval window)',
    ],
  },
  {
    id: 'hyoid-larynx',
    label: 'Hyoid and laryngeal cartilages',
    wilayah: 'Axial skeleton',
    ringkas: 'The suspended hyoid and the cartilage framework of the larynx.',
    mesh: [
      'Hyoid bone', 'Thyroid cartilage', 'Cricoid cartilage',
      ...duaSisi('Arytenoid cartilage', 'Corniculate cartilage'),
    ],
    berpasangan: true,
    artikulasi: [
      'Cricothyroid joint',
      'Cricoarytenoid joint',
      'The hyoid articulates with no bone — it is slung from muscles and ligaments',
    ],
  },
  {
    id: 'nasal-cartilages',
    label: 'Nasal cartilages',
    wilayah: 'Axial skeleton',
    ringkas: 'The cartilage skeleton of the external nose and septum.',
    mesh: [
      'Nasal septal cartilage',
      ...duaSisi('Lateral process of nasal septal cartilage', 'Major alar cartilage'),
    ],
    berpasangan: true,
    artikulasi: ['Septal cartilage meets the vomer and the perpendicular plate of the ethmoid'],
  },
  {
    id: 'cervical-spine',
    label: 'Cervical spine (C1–C7)',
    wilayah: 'Axial skeleton',
    ringkas: 'Seven vertebrae carrying the head, the most mobile part of the column.',
    mesh: ['Atlas (C1)', 'Axis (C2)', 'Vertebra C3', 'Vertebra C4', 'Vertebra C5', 'Vertebra C6', 'Vertebra C7'],
    berpasangan: false,
    artikulasi: [
      'Atlanto-occipital joint — nodding',
      'Atlanto-axial joint — rotation around the dens',
      'Zygapophysial (facet) joints C2–C7',
    ],
  },
  {
    id: 'thoracic-spine',
    label: 'Thoracic spine (T1–T12)',
    wilayah: 'Axial skeleton',
    ringkas: 'Twelve vertebrae, each one carrying a rib pair.',
    mesh: Array.from({ length: 12 }, (_, i) => `Vertebra T${i + 1}`),
    berpasangan: false,
    artikulasi: [
      'Costovertebral joints (rib head–vertebral bodies)',
      'Costotransverse joints (rib tubercle–transverse process)',
      'Zygapophysial joints, oriented for rotation',
    ],
  },
  {
    id: 'lumbar-spine',
    label: 'Lumbar spine (L1–L5)',
    wilayah: 'Axial skeleton',
    ringkas: 'Five wide-bodied vertebrae carrying most of the trunk load.',
    mesh: Array.from({ length: 5 }, (_, i) => `Vertebra L${i + 1}`),
    berpasangan: false,
    artikulasi: [
      'Zygapophysial joints, oriented for flexion and extension',
      'Lumbosacral joint (L5–S1)',
    ],
  },
  {
    id: 'sacrum-coccyx',
    label: 'Sacrum and coccyx',
    wilayah: 'Axial skeleton',
    ringkas: 'Fused vertebrae forming the back wall of the pelvis.',
    mesh: ['Sacrum', 'Coccyx'],
    berpasangan: false,
    artikulasi: [
      'Sacro-iliac joint (sacrum–hip bone)',
      'Sacrococcygeal joint',
      'Lumbosacral joint (L5–S1)',
    ],
  },
  {
    id: 'ribs',
    label: 'Ribs (1–12)',
    wilayah: 'Axial skeleton',
    ringkas: 'Twelve pairs: seven true, three false, two floating.',
    mesh: duaSisi(...URUT_IGA.map((n) => `${n} rib`)),
    berpasangan: true,
    artikulasi: [
      'Costovertebral and costotransverse joints behind',
      'Costochondral junctions in front',
      'Ribs 11 and 12 end free in the abdominal wall',
    ],
  },
  {
    id: 'costal-cartilages',
    label: 'Costal cartilages',
    wilayah: 'Axial skeleton',
    ringkas: 'The cartilage bars that carry ribs 1–10 towards the sternum.',
    mesh: duaSisi(...URUT_IGA.slice(0, 10).map((n) => `Costal cartilage of ${n.toLowerCase()} rib`)),
    berpasangan: true,
    artikulasi: [
      'Sternocostal joints for cartilages 1–7',
      'Cartilages 8–10 join the cartilage above, forming the costal margin',
    ],
  },
  {
    id: 'sternum',
    label: 'Sternum',
    wilayah: 'Axial skeleton',
    ringkas: 'Three parts in the front midline of the chest.',
    mesh: ['Manubrium of sternum', 'Body of sternum', 'Xiphoid process'],
    berpasangan: false,
    artikulasi: [
      'Sternoclavicular joint — the only joint between the upper limb and the axial skeleton',
      'Manubriosternal joint (sternal angle, at the second costal cartilage)',
      'Sternocostal joints',
    ],
  },

  // ── Anggota gerak atas ──────────────────────────────────────────────────
  {
    id: 'shoulder-girdle',
    label: 'Shoulder girdle',
    wilayah: 'Upper limb',
    ringkas: 'Clavicle and scapula, slung on muscle over the rib cage.',
    mesh: duaSisi('Clavicle', 'Scapula'),
    berpasangan: true,
    artikulasi: [
      'Sternoclavicular joint',
      'Acromioclavicular joint',
      'Glenohumeral joint (scapula–humerus)',
      'Scapulothoracic gliding surface — not a true joint',
    ],
  },
  {
    id: 'arm',
    label: 'Arm (humerus)',
    wilayah: 'Upper limb',
    ringkas: 'One long bone between shoulder and elbow.',
    mesh: duaSisi('Humerus'),
    berpasangan: true,
    artikulasi: [
      'Glenohumeral joint above',
      'Humero-ulnar and humeroradial joints at the elbow',
    ],
  },
  {
    id: 'forearm',
    label: 'Forearm (radius and ulna)',
    wilayah: 'Upper limb',
    ringkas: 'Two bones that rotate on each other to pronate and supinate.',
    mesh: duaSisi('Radius', 'Ulna'),
    berpasangan: true,
    artikulasi: [
      'Proximal and distal radio-ulnar joints — rotation',
      'Humero-ulnar and humeroradial joints at the elbow',
      'Radiocarpal joint at the wrist',
    ],
  },
  {
    id: 'carpus',
    label: 'Carpus (wrist)',
    wilayah: 'Upper limb',
    ringkas: 'Eight small bones in two rows.',
    mesh: duaSisi(
      'Scaphoid bone', 'Lunate bone', 'Triquetrum bone', 'Pisiform bone',
      'Trapezium bone', 'Trapezoid bone', 'Capitate bone', 'Hamate bone',
    ),
    berpasangan: true,
    artikulasi: [
      'Radiocarpal joint (radius–scaphoid, lunate)',
      'Midcarpal joint between the two rows',
      'Carpometacarpal joints, the thumb saddle joint among them',
    ],
  },
  {
    id: 'metacarpus',
    label: 'Metacarpus (palm)',
    wilayah: 'Upper limb',
    ringkas: 'Five metacarpal bones forming the palm.',
    mesh: duaSisi(
      'First metacarpal bone', 'Second metacarpal bone', 'Third metacarpal bone',
      'Fourth metacarpal bone', 'Fifth metacarpal bone',
    ),
    berpasangan: true,
    artikulasi: [
      'Carpometacarpal joints proximally',
      'Metacarpophalangeal joints (knuckles) distally',
    ],
  },
  {
    id: 'hand-phalanges',
    label: 'Phalanges of the hand',
    wilayah: 'Upper limb',
    ringkas: 'Three phalanges per finger, two for the thumb.',
    mesh: duaSisi(
      ...JARI_TANGAN.map((j) => `Proximal phalanx of ${j} finger of hand`),
      ...JARI_TANGAN.filter((j) => j !== 'first').map((j) => `Middle phalanx of ${j} finger of hand`),
      ...JARI_TANGAN.map((j) => `Distal phalanx of ${j} finger of hand`),
    ),
    berpasangan: true,
    artikulasi: [
      'Metacarpophalangeal joints',
      'Proximal and distal interphalangeal joints',
      'The thumb has a single interphalangeal joint',
    ],
  },

  // ── Anggota gerak bawah ─────────────────────────────────────────────────
  {
    id: 'pelvic-girdle',
    label: 'Pelvic girdle (hip bones)',
    wilayah: 'Lower limb',
    ringkas: 'Each hip bone is ilium, ischium and pubis fused into one.',
    mesh: duaSisi('Hip bone'),
    berpasangan: true,
    artikulasi: [
      'Sacro-iliac joint behind',
      'Pubic symphysis in front',
      'Hip joint (acetabulum–femoral head)',
    ],
  },
  {
    id: 'thigh',
    label: 'Thigh (femur and patella)',
    wilayah: 'Lower limb',
    ringkas: 'The longest bone in the body, plus the kneecap in front of it.',
    mesh: duaSisi('Femur', 'Patella'),
    berpasangan: true,
    artikulasi: [
      'Hip joint above',
      'Tibiofemoral joint at the knee',
      'Patellofemoral joint',
    ],
  },
  {
    id: 'leg',
    label: 'Leg (tibia and fibula)',
    wilayah: 'Lower limb',
    ringkas: 'The tibia carries the load; the fibula carries almost none.',
    mesh: duaSisi('Tibia', 'Fibula'),
    berpasangan: true,
    artikulasi: [
      'Tibiofemoral joint at the knee',
      'Superior and inferior tibiofibular joints',
      'Talocrural (ankle) joint, whose mortise is tibia plus fibula',
    ],
  },
  {
    id: 'tarsus',
    label: 'Tarsus (ankle and hindfoot)',
    wilayah: 'Lower limb',
    ringkas: 'Seven bones between the leg and the metatarsus.',
    mesh: duaSisi(
      'Talus', 'Calcaneus', 'Navicular bone', 'Cuboid bone',
      'Medial cuneiform bone', 'Intermediate cuneiform bone', 'Lateral cuneiform bone',
    ),
    berpasangan: true,
    artikulasi: [
      'Talocrural (ankle) joint — the talus in the mortise',
      'Subtalar joint — inversion and eversion',
      'Transverse tarsal (talonavicular and calcaneocuboid) joints',
    ],
  },
  {
    id: 'metatarsus',
    label: 'Metatarsus',
    wilayah: 'Lower limb',
    ringkas: 'Five metatarsals, with the sesamoids under the first head.',
    mesh: duaSisi(
      'First metatarsal bone', 'Second metatarsal bone', 'Third metatarsal bone',
      'Fourth metatarsal bone', 'Fifth metatarsal bone', 'Sesamoid bones of foot',
    ),
    berpasangan: true,
    artikulasi: [
      'Tarsometatarsal (Lisfranc) joints proximally',
      'Metatarsophalangeal joints distally',
    ],
  },
  {
    id: 'foot-phalanges',
    label: 'Phalanges of the foot',
    wilayah: 'Lower limb',
    ringkas: 'Three phalanges per toe, two for the great toe.',
    mesh: duaSisi(
      ...JARI_TANGAN.map((j) => `Proximal phalanx of ${j} finger of foot`),
      ...JARI_TANGAN.filter((j) => j !== 'first').map((j) => `Middle phalanx of ${j} finger of foot`),
      ...JARI_TANGAN.map((j) => `Distal phalanx of ${j} finger of foot`),
    ),
    berpasangan: true,
    artikulasi: [
      'Metatarsophalangeal joints',
      'Interphalangeal joints',
      'The great toe has a single interphalangeal joint',
    ],
  },
]

/**
 * Struktur yang TIDAK dibawa berkas ini.
 *
 * Menyatakan sesuatu "tidak ada" adalah cara termurah membuat gerbang uji
 * lulus, jadi tiap baris di sini membawa istilah pencarian dan gerbangnya
 * MEMBUKTIKAN bahwa istilah itu memang tidak muncul di skeletal.glb.
 */
export interface TidakDibawa {
  label: string
  /** Dicari sebagai substring, huruf kecil, pada semua nama node. */
  cari: readonly string[]
  catatan: string
}

export const TIDAK_DIBAWA: readonly TidakDibawa[] = [
  {
    label: 'Third molars (wisdom teeth)',
    cari: ['third molar', 'wisdom'],
    catatan: 'The dentition stops at the second molar in this model.',
  },
  {
    label: 'Sesamoid bones of the hand',
    cari: ['sesamoid bones of hand', 'sesamoid bone of hand'],
    catatan: 'The foot sesamoids are carried; the thumb sesamoids are not.',
  },
  {
    label: 'Ilium, ischium and pubis as separate bones',
    cari: ['ilium', 'ischium', 'pubis'],
    catatan: 'The hip bone ships as one fused bone, as it is after adolescence.',
  },
  {
    label: 'Costal cartilages of ribs 11 and 12',
    cari: ['costal cartilage of eleventh', 'costal cartilage of twelfth'],
    catatan: 'Floating ribs end free, so the model carries no cartilage for them.',
  },
  {
    label: 'Intervertebral discs',
    cari: ['intervertebral', 'disc'],
    catatan: 'This is a bone model; the discs between the vertebrae are not in it.',
  },
]

const PETA_NAMA: ReadonlyMap<string, string> = new Map(
  KELOMPOK_TULANG.flatMap((k) => k.mesh.map((n) => [n, k.id] as [string, string])),
)

/** Id kelompok untuk satu nama node ASLI, atau null bila tidak terikat. */
export function kelompokDariNama(namaAsli: string): string | null {
  return PETA_NAMA.get(namaAsli) ?? null
}

export function kelompokUntuk(id: string): KelompokTulang | undefined {
  return KELOMPOK_TULANG.find((k) => k.id === id)
}

/** Jumlah nama node yang diikat seluruh katalog — dipakai gerbang uji. */
export const JUMLAH_NAMA_TERIKAT = PETA_NAMA.size
