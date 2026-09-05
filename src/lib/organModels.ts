// ─────────────────────────────────────────────────────────────────────────────
// Tampilan ORGAN TUNGGAL beresolusi tinggi, terpisah dari figur tubuh utuh.
//
// ASAL DAN SIFATNYA, dan ini harus dibaca sebelum memakainya.
//
// Berkas .glb di /public/organs/ berasal dari repositori anatomy milik pemilik
// aplikasi ini (thebuggeddev/anatomy), dipakai atas izinnya. Modelnya DIBUAT
// DENGAN AI (pembangkit 3D Tripo — tiap berkas berisi satu mesh bernama
// "tripo_node_<uuid>"), BUKAN diturunkan dari data tubuh manusia nyata seperti
// BodyParts3D yang dipakai figur utuh.
//
// Akibatnya ada dua, dan keduanya dinyatakan di layar, bukan disembunyikan:
//   1. Bentuknya adalah PENDEKATAN yang menyerupai organ, bukan geometri yang
//      terverifikasi. Ia bagus untuk mengenali rupa dan letak umum; ia bukan
//      rujukan untuk hal yang bergantung pada bentuk persisnya.
//   2. Tiap berkas hanya SATU mesh tanpa sub-struktur bernama, jadi menyentuh
//      permukaannya tidak bisa mengenali bagian tertentu seperti pada figur
//      utuh. Karena itu bagiannya ditandai dengan TITIK BERKOORDINAT (hotspot)
//      yang diletakkan manual, dan tiap titik membawa istilah Terminologia
//      Anatomica-nya sebagai identitas baku lintas bahasa.
//
// Figur tubuh utuh TETAP memakai BodyParts3D. Yang ini pelengkap untuk melihat
// satu organ dari dekat, bukan penggantinya.
// ─────────────────────────────────────────────────────────────────────────────

export interface OrganHotspot {
  id: string
  /** Istilah Terminologia Anatomica — identitas baku, tidak diterjemahkan. */
  ta: string
  position: [number, number, number]
  color: string
}

export interface OrganModel {
  /** id di repo sumber, sekaligus nama berkas .glb dan folder gambarnya. */
  id: string
  /** key ORGAN_FOCUS yang sepadan, kalau ada — penghubung ke berkas organ. */
  focusKey: string | null
  label: string
  /** Nama Latin, sengaja sama di semua bahasa. */
  scientificName: string
  accent: string
  hotspots: OrganHotspot[]
  /** Punya ilustrasi /organs/<id>/*.webp (organ, location, microscopic, compare). */
  illustrated: boolean
  /**
   * Dari mana geometrinya datang. 'ai' = model bangkitan Tripo di /organs/;
   * 'bodyparts3d' = potongan anatomi rujukan nyata di /organs-atlas/, dibangun
   * oleh scripts/atlasOrgan.mjs. Bedanya dinyatakan di layar, bukan disamarkan.
   */
  sumber?: 'ai' | 'bodyparts3d'
  /** Jumlah mesh bernama di dalam berkas — hanya untuk model bodyparts3d. */
  jumlahBagian?: number
}

/** Folder publik tempat berkas .glb organ ini berada. */
export function folderModel(m: OrganModel): string {
  return m.sumber === 'bodyparts3d' ? 'organs-atlas' : 'organs'
}

import { ORGAN_ATLAS } from './organAtlas.gen'

export const ORGAN_MODELS: OrganModel[] = [
  {
    id: 'heart',
    focusKey: 'heart',
    label: 'Heart',
    scientificName: 'Cor',
    accent: '#ee7c6a',
    illustrated: true,
    hotspots: [
      { id: 'aorta', ta: 'Aorta', position: [-0.35, 1.65, 0.55], color: '#ee7c6a' },
      { id: 'left-atrium', ta: 'Atrium sinistrum', position: [0.82, 0.65, 0.5], color: '#f2a33b' },
      { id: 'right-atrium', ta: 'Atrium dextrum', position: [-0.9, 0.35, 0.55], color: '#6393d8' },
      { id: 'left-ventricle', ta: 'Ventriculus sinister', position: [0.7, -0.75, 0.65], color: '#f2a33b' },
      { id: 'right-ventricle', ta: 'Ventriculus dexter', position: [-0.65, -0.68, 0.66], color: '#ee7c6a' },
      { id: 'mitral', ta: 'Valva atrioventricularis sinistra', position: [0.18, -1.35, 0.48], color: '#d89bc4' },
    ],
  },
  {
    id: 'brain',
    focusKey: 'brain',
    label: 'Brain',
    scientificName: 'Encephalon',
    accent: '#c58696',
    illustrated: true,
    hotspots: [
      { id: 'frontal', ta: 'Lobus frontalis', position: [-0.7, 0.65, 0.8], color: '#ee7c6a' },
      { id: 'parietal', ta: 'Lobus parietalis', position: [0.15, 1.1, 0.65], color: '#f2a33b' },
      { id: 'temporal', ta: 'Lobus temporalis', position: [0.75, -0.1, 0.82], color: '#6393d8' },
      { id: 'cerebellum', ta: 'Cerebellum', position: [0.72, -0.9, 0.55], color: '#d89bc4' },
    ],
  },
  {
    id: 'lungs',
    focusKey: 'lungs',
    label: 'Lungs',
    scientificName: 'Pulmones',
    accent: '#dd8f8b',
    illustrated: true,
    hotspots: [
      { id: 'trachea', ta: 'Trachea', position: [0.0, 1.6, 0.2], color: '#6393d8' },
      { id: 'right-lung', ta: 'Pulmo dexter', position: [-1.2, 0.1, 0.7], color: '#ee7c6a' },
      { id: 'left-lung', ta: 'Pulmo sinister', position: [1.2, 0.1, 0.7], color: '#f2a33b' },
      { id: 'bronchus', ta: 'Bronchus principalis', position: [-0.03, 0.3, 0.35], color: '#d89bc4' },
      { id: 'base', ta: 'Basis pulmonis', position: [-1.14, -1.2, 1.0], color: '#7fa88a' },
    ],
  },
  {
    id: 'liver',
    focusKey: 'liver',
    label: 'Liver',
    scientificName: 'Hepar',
    accent: '#b86858',
    illustrated: true,
    hotspots: [
      { id: 'right-lobe', ta: 'Lobus hepatis dexter', position: [-0.75, 0.35, 0.75], color: '#ee7c6a' },
      { id: 'left-lobe', ta: 'Lobus hepatis sinister', position: [0.85, 0.25, 0.75], color: '#f2a33b' },
      { id: 'portal', ta: 'Vena portae hepatis', position: [0.1, -0.3, 0.82], color: '#6393d8' },
    ],
  },
  {
    id: 'kidneys',
    focusKey: 'kidneys',
    label: 'Kidneys',
    scientificName: 'Renes',
    accent: '#c96963',
    illustrated: true,
    hotspots: [
      { id: 'cortex', ta: 'Cortex renalis', position: [-0.9, 0.55, 0.7], color: '#ee7c6a' },
      { id: 'medulla', ta: 'Medulla renalis', position: [0.85, 0.2, 0.7], color: '#f2a33b' },
      { id: 'ureter', ta: 'Ureter', position: [0.4, -1.1, 0.5], color: '#6393d8' },
    ],
  },
  {
    id: 'eyeball',
    focusKey: 'eye',
    label: 'Eyeball',
    scientificName: 'Oculus',
    accent: '#7294b9',
    illustrated: true,
    hotspots: [
      { id: 'cornea', ta: 'Cornea', position: [-0.94, 0.05, 1.47], color: '#6393d8' },
      { id: 'iris', ta: 'Iris', position: [-1.22, -0.53, 1.15], color: '#f2a33b' },
      { id: 'optic', ta: 'Nervus opticus', position: [1.61, -0.18, 0.54], color: '#d89bc4' },
    ],
  },
  {
    id: 'intestine',
    focusKey: 'small-intestine',
    label: 'Intestine',
    scientificName: 'Intestinum',
    accent: '#d78b77',
    illustrated: true,
    hotspots: [
      { id: 'duodenum', ta: 'Duodenum', position: [0.6, 0.8, 0.75], color: '#f2a33b' },
      { id: 'jejunum', ta: 'Jejunum', position: [-0.45, 0.1, 0.82], color: '#ee7c6a' },
      { id: 'colon', ta: 'Colon', position: [0.75, -0.55, 0.72], color: '#6393d8' },
    ],
  },
  {
    id: 'pancreas',
    focusKey: 'pancreas',
    label: 'Pancreas',
    scientificName: 'Pancreas',
    accent: '#c69a5e',
    illustrated: true,
    hotspots: [
      { id: 'head', ta: 'Caput pancreatis', position: [-1.32, -0.36, 0.55], color: '#ee7c6a' },
      { id: 'body', ta: 'Corpus pancreatis', position: [0.05, 0.25, 0.45], color: '#f2a33b' },
      { id: 'tail', ta: 'Cauda pancreatis', position: [1.55, 0.3, 0.35], color: '#6393d8' },
      { id: 'duct', ta: 'Ductus pancreaticus', position: [-0.61, 0.39, 0.5], color: '#d89bc4' },
    ],
  },
  {
    id: 'skin',
    // Ditautkan belakangan: saat pemetaan ini dibuat, sasaran organ "skin"
    // belum ada, sehingga berkas skin.glb (5,8 MB) sudah tersalin tapi tidak
    // pernah bisa dijangkau siapa pun. Sasarannya ditambahkan bersama kelainan
    // bawaan kulit, dan tautannya sempat tertinggal.
    focusKey: 'skin',
    label: 'Skin',
    scientificName: 'Integumentum',
    accent: '#c99277',
    illustrated: true,
    hotspots: [
      { id: 'epidermis', ta: 'Epidermis', position: [-0.05, 0.88, 1.4], color: '#ee7c6a' },
      { id: 'dermis', ta: 'Dermis', position: [0.29, 0.05, 1.4], color: '#f2a33b' },
      { id: 'hypodermis', ta: 'Tela subcutanea', position: [-0.39, -1.15, 1.4], color: '#6393d8' },
      { id: 'follicle', ta: 'Folliculus pili', position: [0.89, -0.44, 1.4], color: '#d89bc4' },
    ],
  },
]

/**
 * Model organ untuk satu sasaran. Potongan BodyParts3D DIDAHULUKAN atas model
 * bangkitan AI: keduanya sama-sama menampilkan organ dari dekat, tapi hanya
 * yang pertama merupakan geometri manusia rujukan, dan tiap bagiannya bernama.
 */
export function modelForFocus(focusKey: string): OrganModel | undefined {
  return ORGAN_ATLAS.find((m) => m.focusKey === focusKey)
    ?? ORGAN_MODELS.find((m) => m.focusKey === focusKey)
}

/** Model bangkitan AI saja — dipakai untuk mencari ilustrasi /organs/<id>/. */
export function modelIlustrasi(focusKey: string): OrganModel | undefined {
  return ORGAN_MODELS.find((m) => m.focusKey === focusKey && m.illustrated)
}

/** Empat ilustrasi yang tersedia per organ, sesuai isi foldernya. */
export const ILUSTRASI = [
  { key: 'organ', label: 'The organ' },
  { key: 'location', label: 'Where it sits' },
  { key: 'microscopic', label: 'Under the microscope' },
  { key: 'compare', label: 'Size comparison' },
] as const
